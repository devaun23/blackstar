import { z } from 'zod';
import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ValidatorType } from '@/lib/types/database';
import { callClaude } from './claude';
import { validatorReportSchema } from './schemas';

// ─── Jury Configuration ───

export interface JuryConfig {
  /** Models to use as jurors (run in parallel) */
  models: string[];
  /** Model used for facilitator synthesis when jurors disagree */
  facilitatorModel: string;
  /** Which validators get jury treatment */
  enabledValidators: ValidatorType[];
}

export const DEFAULT_JURY_CONFIG: JuryConfig = {
  models: [
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-haiku-3.5-20241022',
  ],
  facilitatorModel: 'claude-opus-4-20250514',
  enabledValidators: ['medical', 'exam_translation'],
};

export type JuryAgreement = 'unanimous_pass' | 'unanimous_fail' | 'facilitator_synthesized';

export interface JuryVerdict {
  /** The synthesized report (same shape as individual validator reports) */
  report: ValidatorReportInput;
  /** How consensus was reached */
  agreement: JuryAgreement;
  /** Individual juror reports (anonymized — no model IDs in the data) */
  jurorReports: ValidatorReportInput[];
  /** Whether the facilitator was invoked */
  facilitatorInvoked: boolean;
  /** Total tokens used across all jurors + facilitator */
  totalTokensUsed: number;
}

// ─── Jury Runner ───

/**
 * Runs a validator through a multi-model jury.
 *
 * Protocol (from P1 — Council of AIs):
 * 1. Run N jurors in parallel, each using a different model
 * 2. If unanimous (all pass or all fail) → accept consensus
 * 3. If any disagree → run facilitator synthesis (Opus)
 * 4. Return single synthesized report
 *
 * The facilitator is biased toward safety: if any juror identifies a genuine
 * medical error, it errs on the side of failing the item.
 */
export async function runJuryValidation(
  validatorRunner: (model: string) => Promise<AgentOutput<ValidatorReportInput & { reportId: string }>>,
  config: JuryConfig = DEFAULT_JURY_CONFIG,
  /** Additional context for facilitator (question text, etc.) */
  questionContext?: string,
): Promise<JuryVerdict> {
  // Step 1: Run all jurors in parallel
  const jurorResults = await Promise.all(
    config.models.map((model) => validatorRunner(model))
  );

  let totalTokensUsed = jurorResults.reduce((sum, r) => sum + r.tokensUsed, 0);

  // Extract reports from successful jurors; skip failures
  const jurorReports: ValidatorReportInput[] = [];
  for (const result of jurorResults) {
    if (result.success && result.data) {
      jurorReports.push({
        passed: result.data.passed,
        score: result.data.score,
        issues_found: result.data.issues_found,
        repair_instructions: result.data.repair_instructions,
      });
    }
  }

  // If no jurors succeeded, return a failure report
  if (jurorReports.length === 0) {
    return {
      report: {
        passed: false,
        score: 0,
        issues_found: ['All jury members failed to produce a report'],
        repair_instructions: null,
      },
      agreement: 'unanimous_fail',
      jurorReports: [],
      facilitatorInvoked: false,
      totalTokensUsed,
    };
  }

  // Step 2: Check for unanimity
  const allPass = jurorReports.every((r) => r.passed);
  const allFail = jurorReports.every((r) => !r.passed);

  if (allPass) {
    // Unanimous pass — use the report with the lowest score (most conservative)
    const mostConservative = jurorReports.reduce((a, b) => (a.score <= b.score ? a : b));
    return {
      report: mostConservative,
      agreement: 'unanimous_pass',
      jurorReports,
      facilitatorInvoked: false,
      totalTokensUsed,
    };
  }

  if (allFail) {
    // Unanimous fail — merge all issues
    const mergedIssues = Array.from(new Set(jurorReports.flatMap((r) => r.issues_found)));
    const lowestScore = Math.min(...jurorReports.map((r) => r.score));
    const repairInstructions = jurorReports
      .map((r) => r.repair_instructions)
      .filter(Boolean)
      .join('\n\n');

    return {
      report: {
        passed: false,
        score: lowestScore,
        issues_found: mergedIssues,
        repair_instructions: repairInstructions || null,
      },
      agreement: 'unanimous_fail',
      jurorReports,
      facilitatorInvoked: false,
      totalTokensUsed,
    };
  }

  // Step 3: Disagreement — invoke facilitator synthesis
  const facilitatorResult = await runFacilitator(
    jurorReports,
    config.facilitatorModel,
    questionContext,
  );

  totalTokensUsed += facilitatorResult.tokensUsed;

  return {
    report: facilitatorResult.report,
    agreement: 'facilitator_synthesized',
    jurorReports,
    facilitatorInvoked: true,
    totalTokensUsed,
  };
}

// ─── Facilitator ───

const FACILITATOR_SYSTEM_PROMPT = `You are a medical exam quality facilitator for a USMLE Step 2 CK question bank.

You have received independent validation reports from multiple reviewers for the same question. Your job is to synthesize these reports into a single, authoritative verdict.

RULES:
1. If ANY reviewer identifies a genuine medical error (wrong diagnosis, incorrect treatment, contraindication missed), you MUST fail the item. Patient safety errors are non-negotiable.
2. If reviewers disagree on subjective quality (wording, option symmetry, hinge clarity), defer to the majority unless the minority raises a compelling clinical argument.
3. Your score should reflect the WORST substantive issue identified by any reviewer. Do not average scores — use the minimum for medical/safety concerns, the median for stylistic concerns.
4. Merge all unique issues from all reviewers into a single list. Remove duplicates.
5. Write repair instructions that address ALL substantive issues, prioritizing medical accuracy over style.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.`;

async function runFacilitator(
  jurorReports: ValidatorReportInput[],
  facilitatorModel: string,
  questionContext?: string,
): Promise<{ report: ValidatorReportInput; tokensUsed: number }> {
  // Anonymize reports — label as "Reviewer 1", "Reviewer 2", etc.
  const anonymizedReports = jurorReports.map((report, i) => ({
    reviewer: `Reviewer ${i + 1}`,
    passed: report.passed,
    score: report.score,
    issues_found: report.issues_found,
    repair_instructions: report.repair_instructions,
  }));

  const userMessage = [
    questionContext ? `## Question Under Review\n${questionContext}\n` : '',
    `## Independent Reviewer Reports\n${JSON.stringify(anonymizedReports, null, 2)}`,
    '',
    '## Your Task',
    `${jurorReports.filter((r) => r.passed).length} of ${jurorReports.length} reviewers passed this item.`,
    'Synthesize the reports into a single verdict. Remember: if ANY reviewer found a genuine medical error, fail the item.',
    '',
    'Respond with a JSON object: { "passed": boolean, "score": number (0-10), "issues_found": string[], "repair_instructions": string | null }',
  ].join('\n');

  const { data, tokensUsed } = await callClaude({
    systemPrompt: FACILITATOR_SYSTEM_PROMPT,
    userMessage,
    outputSchema: validatorReportSchema,
    model: facilitatorModel,
  });

  return { report: data, tokensUsed };
}

// ─── Utility ───

/** Check if a validator type should use jury evaluation */
export function isJuryEnabled(
  validatorType: ValidatorType,
  config: JuryConfig = DEFAULT_JURY_CONFIG,
): boolean {
  return config.enabledValidators.includes(validatorType);
}
