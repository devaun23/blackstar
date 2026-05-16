import { z } from 'zod';
import { callClaude } from '../claude';
import { juryReportSchema, juryVerdictEnum, type JuryReport } from '../schemas/adversarial-report';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type {
  ItemDraftRow,
  AlgorithmCardRow,
  CasePlanRow,
} from '@/lib/types/database';

/**
 * Jury-validator (B2): a second-model battle-test.
 *
 * A non-Claude model (GPT or Gemini) attempts the question with no hint of
 * the keyed answer or transfer rule. We then ask Claude to compare the jury's
 * reasoning trace to the keyed rule and classify the verdict:
 *
 *   right-reason  — jury picked the keyed answer for the keyed reason → PASS
 *   wrong-reason  — jury picked the keyed answer but for a different reason → FAIL
 *                   (the question is correct by coincidence, not by craft)
 *   wrong-answer  — jury picked a non-keyed answer → FAIL
 *
 * Default jury model: gpt-5. Override via input.juryModel.
 *
 * V1 ships with inline prompts; once the prompts are tuned, they move into
 * agent_prompt + a DB migration adds 'jury_validator' to agent_type.
 */

interface JuryInput {
  draft: ItemDraftRow;
  card?: AlgorithmCardRow | null;
  casePlan?: CasePlanRow | null;
  juryModel?: string;     // e.g., "gpt-5", "gemini-2.5-pro" — defaults to gpt-5
  classifierModel?: string; // Claude model used for the verdict classification
}

const JURY_SYSTEM_PROMPT = `You are a board-prep tutor sitting an NBME-style item.

Read the vignette, stem, and 5 options. Choose the single best answer and explain your reasoning in 4–8 sentences. Be specific about which clinical findings drove your choice. Do NOT guess — if you're uncertain between two options, name both and explain why you went with the one you did.

Output JSON only:
{
  "chosen_answer": "A" | "B" | "C" | "D" | "E",
  "reasoning_trace": "<4–8 sentence explanation of how the vignette findings led to your choice>"
}`;

const jurySelectionSchema = z.object({
  chosen_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  reasoning_trace: z.string().min(20).max(2000),
});

const CLASSIFIER_SYSTEM_PROMPT = `You are auditing a question-bank jury test.

A "jury" model took the question and produced a reasoning trace. You will be told (a) the keyed correct answer, (b) the keyed transfer rule the item is designed to test, and (c) the jury's chosen answer + reasoning trace.

Classify the jury's verdict:

- right-reason  — jury picked the keyed answer AND the reasoning trace invokes the keyed transfer rule (or a close paraphrase). The rule was the actual driver.
- wrong-reason  — jury picked the keyed answer BUT the reasoning trace does NOT invoke the keyed rule. Got lucky / went by elimination / pattern-matched a surface cue.
- wrong-answer  — jury picked a non-keyed answer. (regardless of reasoning)

When classifying "right-reason vs wrong-reason," look for: does the jury's reasoning name the same clinical hinge or decision principle as the keyed rule? Loose paraphrase counts. Generic mention ("seems like an ACS-type presentation") without the specific decision rule does NOT count.

Output JSON only:
{
  "verdict": "right-reason" | "wrong-reason" | "wrong-answer",
  "matched_keyed_archetype": <archetype the jury's pick maps to, or null if no case_plan> ,
  "issues_found": [<one or more strings if verdict != right-reason — what specifically went wrong>],
  "repair_instructions": <string with how to fix the item, or null if right-reason>
}`;

const classifierOutputSchema = z.object({
  verdict: juryVerdictEnum,
  matched_keyed_archetype: z.enum(['correct', 'primary_competitor', 'near_miss', 'zebra', 'implausible', 'neutral']).nullable(),
  issues_found: z.array(z.string()),
  repair_instructions: z.string().nullable().optional(),
});

function buildJuryUserMessage(draft: ItemDraftRow): string {
  return [
    'VIGNETTE:',
    draft.vignette,
    '',
    'STEM:',
    draft.stem,
    '',
    'OPTIONS:',
    `A. ${draft.choice_a}`,
    `B. ${draft.choice_b}`,
    `C. ${draft.choice_c}`,
    `D. ${draft.choice_d}`,
    `E. ${draft.choice_e}`,
  ].join('\n');
}

function buildClassifierUserMessage(
  draft: ItemDraftRow,
  card: AlgorithmCardRow | null | undefined,
  casePlan: CasePlanRow | null | undefined,
  jurySelection: z.infer<typeof jurySelectionSchema>,
): string {
  const transferRule = casePlan?.transfer_rule_text
    ?? (card as unknown as { transfer_rule?: string; correct_action?: string })?.transfer_rule
    ?? (card as unknown as { correct_action?: string })?.correct_action
    ?? '(no transfer rule available — case_plan and algorithm_card both lack one)';

  const archetypeMap = casePlan?.option_frames
    ? casePlan.option_frames.map((f) => `${f.id}: ${f.archetype}`).join(', ')
    : '(no case_plan — archetype mapping unavailable)';

  return [
    `KEYED CORRECT ANSWER: ${draft.correct_answer}`,
    `KEYED TRANSFER RULE: ${transferRule}`,
    `ARCHETYPE MAP: ${archetypeMap}`,
    '',
    `JURY CHOSE: ${jurySelection.chosen_answer}`,
    '',
    'JURY REASONING TRACE:',
    jurySelection.reasoning_trace,
    '',
    'Classify the verdict per the schema. If matched_keyed_archetype is unknown (no case_plan), return null for that field.',
  ].join('\n');
}

export async function run(
  _context: AgentContext,
  input: JuryInput,
): Promise<AgentOutput<JuryReport>> {
  const { draft, card, casePlan } = input;
  const juryModel = input.juryModel ?? 'gpt-5';
  const classifierModel = input.classifierModel ?? 'claude-sonnet-4-20250514';

  try {
    // ─── Step 1: jury attempts the question ───
    const juryResult = await callClaude({
      systemPrompt: JURY_SYSTEM_PROMPT,
      userMessage: buildJuryUserMessage(draft),
      outputSchema: jurySelectionSchema,
      model: juryModel,
      maxTokens: 1500,
    });

    const jurySelection = juryResult.data;
    let tokensUsed = juryResult.tokensUsed;

    // ─── Step 2: Claude classifies the jury's verdict ───
    const classifierResult = await callClaude({
      systemPrompt: CLASSIFIER_SYSTEM_PROMPT,
      userMessage: buildClassifierUserMessage(draft, card, casePlan, jurySelection),
      outputSchema: classifierOutputSchema,
      model: classifierModel,
      maxTokens: 1500,
    });

    tokensUsed += classifierResult.tokensUsed;
    const classification = classifierResult.data;

    // Reconcile: if jury picked the keyed answer, verdict cannot be 'wrong-answer'
    // (and vice versa). Re-derive from ground truth to defend against the
    // classifier mislabeling.
    const jurorPickedKey = jurySelection.chosen_answer === draft.correct_answer;
    let verdict = classification.verdict;
    if (jurorPickedKey && verdict === 'wrong-answer') {
      verdict = 'wrong-reason'; // classifier was wrong about the chosen letter
    }
    if (!jurorPickedKey && verdict !== 'wrong-answer') {
      verdict = 'wrong-answer';
    }

    const score = verdict === 'right-reason' ? 10 : verdict === 'wrong-reason' ? 5 : 0;
    const passed = verdict === 'right-reason';

    const report: JuryReport = {
      jury_model: juryModel,
      jury_chosen_answer: jurySelection.chosen_answer,
      jury_reasoning_trace: jurySelection.reasoning_trace,
      jury_verdict: verdict,
      matched_keyed_archetype: classification.matched_keyed_archetype,
      passed,
      score,
      issues_found: classification.issues_found,
      repair_instructions: classification.repair_instructions ?? null,
    };

    return {
      success: true,
      data: report,
      tokensUsed,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: null as unknown as JuryReport,
      tokensUsed: 0,
      error: message,
    };
  }
}
