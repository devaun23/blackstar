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

/**
 * Cross-family jury: 3 models from 3 different families.
 *
 * Research basis (P1 — Council of AIs, P3 — Siam et al.):
 * - Intra-family error correlation: 0.39-0.58 (overlapping blind spots)
 * - Cross-family Fleiss' Kappa: -0.056 to 0.003 (near-zero = complementary errors)
 * - 3 diverse-family models beats 5 same-family models
 *
 * Cost: $0.038/validation (vs $0.047 previous same-family jury)
 */
export const DEFAULT_JURY_CONFIG: JuryConfig = {
  models: [
    'claude-opus-4-20250514',    // Anchor — best error detection (MEDEC 70.16%)
    'gpt-4o',                    // OpenAI family — complementary error patterns
    'gemini-2.5-flash',          // Google family — cheap third vote, fast tie-breaker
  ],
  facilitatorModel: 'claude-opus-4-20250514',
  enabledValidators: ['medical', 'exam_translation'],
};

export type JuryAgreement = 'unanimous_pass' | 'unanimous_fail' | 'facilitator_synthesized' | 'deliberation_synthesized';

export interface JuryVerdict {
  /** The synthesized report (same shape as individual validator reports) */
  report: ValidatorReportInput;
  /** How consensus was reached */
  agreement: JuryAgreement;
  /** Individual juror reports (anonymized — no model IDs in the data) */
  jurorReports: ValidatorReportInput[];
  /** Whether the facilitator was invoked */
  facilitatorInvoked: boolean;
  /** Whether the deliberation re-query loop was used */
  deliberationUsed: boolean;
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
      deliberationUsed: false,
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
      deliberationUsed: false,
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
      deliberationUsed: false,
      totalTokensUsed,
    };
  }

  // Step 3: Disagreement — invoke facilitator with deliberation loop
  // (Council of AIs protocol: formulate clarifying question → re-query jurors → synthesize)
  const facilitatorResult = await runFacilitatorWithDeliberation(
    jurorReports,
    config.facilitatorModel,
    config.models,
    questionContext,
  );

  totalTokensUsed += facilitatorResult.tokensUsed;

  return {
    report: facilitatorResult.report,
    agreement: facilitatorResult.deliberationUsed ? 'deliberation_synthesized' : 'facilitator_synthesized',
    jurorReports,
    facilitatorInvoked: true,
    deliberationUsed: facilitatorResult.deliberationUsed,
    totalTokensUsed,
  };
}

// ─── Deliberation Protocol (Council of AIs) ───

/**
 * Zod schema for the facilitator's divergence analysis output.
 * Phase 1 of deliberation: identify what the jurors disagree about.
 */
const deliberationQuestionSchema = z.object({
  divergence_summary: z.string(),
  clarifying_question: z.string(),
  specific_claims_to_verify: z.array(z.string()),
});

const DELIBERATION_QUESTION_PROMPT = `You are a medical exam quality facilitator analyzing disagreement between independent reviewers.

Multiple reviewers evaluated the same USMLE Step 2 CK question and DISAGREED on whether it passes quality standards. Your job is to identify the SPECIFIC point of divergence and formulate a clarifying question that will help resolve it.

INSTRUCTIONS:
1. Compare the reviewers' reports. Identify exactly WHERE they disagree — is it a medical fact, a threshold value, whether an answer choice is defensible, the quality of the hinge, or something else?
2. Formulate a SPECIFIC clarifying question that targets this divergence. The question should be answerable by re-examining the item — not a general medical knowledge question.
3. List the specific claims that need verification (e.g., "Reviewer 1 claims option C is also correct because X").

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.`;

const JUROR_REEXAMINATION_PROMPT = `You are a medical reviewer re-examining a USMLE Step 2 CK question after a facilitator identified a specific point of disagreement among reviewers.

You previously reviewed this question. Another reviewer DISAGREED with your assessment. The facilitator has analyzed the disagreement and formulated a clarifying question for you to address.

INSTRUCTIONS:
1. Read the clarifying question and divergence summary carefully.
2. Re-examine the SPECIFIC claims identified — do not simply repeat your previous assessment.
3. If the clarifying question reveals something you missed, update your verdict accordingly.
4. If you still maintain your original position after re-examination, explain WHY with specific clinical evidence.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.
Respond with: { "passed": boolean, "score": number (0-10), "issues_found": string[], "repair_instructions": string | null }`;

const FACILITATOR_SYNTHESIS_PROMPT = `You are a medical exam quality facilitator for a USMLE Step 2 CK question bank.

You have received TWO ROUNDS of independent validation reports for the same question. Round 1 showed disagreement. A clarifying question was formulated and the reviewers re-examined the item in Round 2.

Your job is to synthesize ALL reports (both rounds) into a single, authoritative verdict.

RULES:
1. If ANY reviewer in EITHER round identifies a genuine medical error (wrong diagnosis, incorrect treatment, contraindication missed), you MUST fail the item. Patient safety errors are non-negotiable.
2. Give MORE WEIGHT to Round 2 responses — reviewers had the chance to address specific concerns and their updated positions are more considered.
3. If a reviewer changed their verdict between rounds, their Round 2 position supersedes Round 1.
4. Your score should reflect the WORST substantive issue identified by any reviewer in either round. Do not average scores — use the minimum for medical/safety concerns.
5. Merge all unique issues from all reviewers across both rounds into a single list. Remove duplicates.
6. Write repair instructions that address ALL substantive issues, prioritizing medical accuracy over style.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.`;

// Keep the original facilitator prompt for fallback (when deliberation is skipped)
const FACILITATOR_SYSTEM_PROMPT = `You are a medical exam quality facilitator for a USMLE Step 2 CK question bank.

You have received independent validation reports from multiple reviewers for the same question. Your job is to synthesize these reports into a single, authoritative verdict.

RULES:
1. If ANY reviewer identifies a genuine medical error (wrong diagnosis, incorrect treatment, contraindication missed), you MUST fail the item. Patient safety errors are non-negotiable.
2. If reviewers disagree on subjective quality (wording, option symmetry, hinge clarity), defer to the majority unless the minority raises a compelling clinical argument.
3. Your score should reflect the WORST substantive issue identified by any reviewer. Do not average scores — use the minimum for medical/safety concerns, the median for stylistic concerns.
4. Merge all unique issues from all reviewers into a single list. Remove duplicates.
5. Write repair instructions that address ALL substantive issues, prioritizing medical accuracy over style.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.`;

// ─── Facilitator with Deliberation ───

/**
 * Council of AIs deliberation protocol:
 *
 * Phase 1: Facilitator analyzes divergence, formulates clarifying question
 * Phase 2: Each juror re-examines the item with the clarifying question (parallel)
 * Phase 3: Facilitator synthesizes Round 1 + Round 2 into final verdict
 *
 * If Phase 1 fails (e.g., model error), falls back to single-round synthesis.
 */
async function runFacilitatorWithDeliberation(
  jurorReports: ValidatorReportInput[],
  facilitatorModel: string,
  jurorModels: string[],
  questionContext?: string,
): Promise<{ report: ValidatorReportInput; tokensUsed: number; deliberationUsed: boolean }> {
  const anonymizedReports = jurorReports.map((report, i) => ({
    reviewer: `Reviewer ${i + 1}`,
    passed: report.passed,
    score: report.score,
    issues_found: report.issues_found,
    repair_instructions: report.repair_instructions,
  }));

  let totalTokensUsed = 0;

  // ── Phase 1: Divergence Analysis ──
  const divergenceMessage = [
    questionContext ? `## Question Under Review\n${questionContext}\n` : '',
    `## Independent Reviewer Reports\n${JSON.stringify(anonymizedReports, null, 2)}`,
    '',
    '## Your Task',
    `${jurorReports.filter((r) => r.passed).length} of ${jurorReports.length} reviewers passed this item.`,
    'Identify the specific point of divergence and formulate a clarifying question.',
    '',
    'Respond with a JSON object: { "divergence_summary": string, "clarifying_question": string, "specific_claims_to_verify": string[] }',
  ].join('\n');

  let deliberationQuestion: z.infer<typeof deliberationQuestionSchema>;
  try {
    const phase1Result = await callClaude({
      systemPrompt: DELIBERATION_QUESTION_PROMPT,
      userMessage: divergenceMessage,
      outputSchema: deliberationQuestionSchema,
      model: facilitatorModel,
    });
    deliberationQuestion = phase1Result.data;
    totalTokensUsed += phase1Result.tokensUsed;
  } catch {
    // Deliberation Phase 1 failed — fall back to single-round synthesis
    return runFacilitatorSingleRound(jurorReports, facilitatorModel, questionContext);
  }

  // ── Phase 2: Juror Re-examination (parallel) ──
  const reExamMessage = [
    questionContext ? `## Question Under Review\n${questionContext}\n` : '',
    `## Divergence Summary\n${deliberationQuestion.divergence_summary}\n`,
    `## Clarifying Question\n${deliberationQuestion.clarifying_question}\n`,
    `## Specific Claims to Verify\n${deliberationQuestion.specific_claims_to_verify.map((c) => `- ${c}`).join('\n')}\n`,
    '## Your Task',
    'Re-examine this item in light of the clarifying question above. Provide your updated verdict.',
    '',
    'Respond with a JSON object: { "passed": boolean, "score": number (0-10), "issues_found": string[], "repair_instructions": string | null }',
  ].join('\n');

  const round2Results = await Promise.all(
    jurorModels.map(async (model) => {
      try {
        const result = await callClaude({
          systemPrompt: JUROR_REEXAMINATION_PROMPT,
          userMessage: reExamMessage,
          outputSchema: validatorReportSchema,
          model,
        });
        totalTokensUsed += result.tokensUsed;
        return result.data;
      } catch {
        return null; // Juror failed to re-examine — exclude from Round 2
      }
    })
  );

  const round2Reports = round2Results.filter((r): r is ValidatorReportInput => r !== null);

  // If no jurors produced Round 2 reports, fall back to single-round synthesis
  if (round2Reports.length === 0) {
    const fallback = await runFacilitatorSingleRound(jurorReports, facilitatorModel, questionContext);
    return { ...fallback, tokensUsed: fallback.tokensUsed + totalTokensUsed };
  }

  // ── Phase 3: Final Synthesis with both rounds ──
  const anonymizedRound2 = round2Reports.map((report, i) => ({
    reviewer: `Reviewer ${i + 1}`,
    passed: report.passed,
    score: report.score,
    issues_found: report.issues_found,
    repair_instructions: report.repair_instructions,
  }));

  const synthesisMessage = [
    questionContext ? `## Question Under Review\n${questionContext}\n` : '',
    `## Round 1 Reports (Initial Review)\n${JSON.stringify(anonymizedReports, null, 2)}\n`,
    `## Divergence Identified\n${deliberationQuestion.divergence_summary}\n`,
    `## Clarifying Question Asked\n${deliberationQuestion.clarifying_question}\n`,
    `## Round 2 Reports (After Re-examination)\n${JSON.stringify(anonymizedRound2, null, 2)}\n`,
    '## Your Task',
    'Synthesize both rounds into a single final verdict. Give more weight to Round 2 (more considered positions).',
    '',
    'Respond with a JSON object: { "passed": boolean, "score": number (0-10), "issues_found": string[], "repair_instructions": string | null }',
  ].join('\n');

  const { data: finalReport, tokensUsed: synthesisTokens } = await callClaude({
    systemPrompt: FACILITATOR_SYNTHESIS_PROMPT,
    userMessage: synthesisMessage,
    outputSchema: validatorReportSchema,
    model: facilitatorModel,
  });

  totalTokensUsed += synthesisTokens;

  return { report: finalReport, tokensUsed: totalTokensUsed, deliberationUsed: true };
}

/**
 * Single-round facilitator synthesis (original behavior).
 * Used as fallback when deliberation Phase 1 fails.
 */
async function runFacilitatorSingleRound(
  jurorReports: ValidatorReportInput[],
  facilitatorModel: string,
  questionContext?: string,
): Promise<{ report: ValidatorReportInput; tokensUsed: number; deliberationUsed: boolean }> {
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

  return { report: data, tokensUsed, deliberationUsed: false };
}

// ─── Utility ───

/** Check if a validator type should use jury evaluation */
export function isJuryEnabled(
  validatorType: ValidatorType,
  config: JuryConfig = DEFAULT_JURY_CONFIG,
): boolean {
  return config.enabledValidators.includes(validatorType);
}
