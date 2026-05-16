import { callClaude } from '../claude';
import {
  adversarialStudentReportSchema,
  type AdversarialStudentReport,
} from '../schemas/adversarial-report';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, ItemPlanRow, CasePlanRow } from '@/lib/types/database';

/**
 * Adversarial-student validator (B1).
 *
 * Hypothesis: NBME's best questions cannot be defeated by surface cues alone.
 * A strong student who *doesn't know the transfer rule* should be unable to
 * eliminate more than one distractor by inspection. If they can eliminate
 * 2+, the item is too easy to game.
 *
 * Approach: ask Claude to ROLE-PLAY as a smart medical student who has NOT
 * studied the underlying rule. Give it only what a test-taker sees — the
 * vignette, stem, and options. Withhold the algorithm card, transfer rule,
 * reasoning steps, and key. The model identifies which distractors are
 * eliminable via length, register, specificity, syntactic shape, vocabulary,
 * implausibility, category mismatch, or absolute language.
 *
 * Pass: ≥3 of 4 distractors survive scrutiny.
 *
 * V1 prompt is inline (not DB-seeded). Once tuned via re-validate-draft.ts,
 * the prompt moves into agent_prompt and we add 'adversarial_student_validator'
 * to the agent_type DB enum (B4 / B5 migration).
 */

interface AdversarialStudentInput {
  draft: ItemDraftRow;
  plan?: ItemPlanRow | null;
  casePlan?: CasePlanRow | null; // accepted but not given to the model
  model?: string;
}

const SYSTEM_PROMPT = `You are a smart third-year medical student taking an NBME-style multiple-choice exam.

Crucially, you have NOT studied the specific transfer rule this question tests. You're going to use test-taking heuristics — surface cues that betray which option is "right" — to see if you can eliminate distractors WITHOUT knowing the underlying clinical rule.

For each non-correct option, identify whether you can eliminate it using ONLY surface cues:

- length: option is noticeably longer or shorter than peers
- register: formality / medical-register mismatch (lay phrasing in a clinical option set)
- specificity: one option carries more clinical detail than its peers
- syntactic_shape: parallel structure is broken (one option starts differently, lacks a verb, etc.)
- vocabulary: technical-jargon density that signals "this is the textbook right answer"
- implausibility: option is clinically absurd or unsafe; eliminable on safety grounds alone
- category_mismatch: option belongs to a different action class than its peers (e.g., a dose in a list of tests)
- absolute_language: contains "always" / "never" / "the only" — usually a tell for a wrong absolute claim

CRITICAL RULES:
1. You do NOT have access to the algorithm card, transfer rule, or answer key. Do NOT reason from clinical knowledge of the disease — that defeats the purpose. Stay in the test-taking-tricks lane.
2. An option that is "wrong because the clinical reasoning doesn't fit" does NOT count as eliminable. Only surface cues count.
3. The CORRECT option is given to you so you know which 4 to evaluate as distractors. Do not score the correct option.
4. Be honest. If a distractor has no surface tells, mark cues_used: [] and eliminable: false — that's a strong item.
5. weakest_distractor = the distractor with the most cues_used (the one most easily eliminated).

A high-quality NBME item will have at least 3 of 4 distractors surviving (eliminable: false). Items where 2+ distractors are eliminable by surface cues are too easy to game and must be flagged for repair.

Output JSON matching this schema:
{
  "per_distractor_eliminability": [
    {"option_id": "A|B|C|D|E", "cues_used": [...], "eliminable": true|false, "rationale": "..."},
    ... (4 entries — one per non-correct option)
  ],
  "surviving_distractor_count": <0-4>,
  "eliminability_cues_flagged": [<union of cues across all distractors>],
  "weakest_distractor": "A|B|C|D|E",
  "passed": <surviving_distractor_count >= 3>,
  "score": <round(10 * surviving_distractor_count / 4, 2)>,
  "issues_found": [<one human-readable string per eliminable distractor, naming the option and cues>],
  "repair_instructions": <if not passed: which distractor(s) to rewrite and what cue to remove; else null>
}`;

function buildUserMessage(draft: ItemDraftRow): string {
  const correctLabel = draft.correct_answer;
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
    '',
    `CORRECT (do NOT score this one — only score the other four as distractors): ${correctLabel}`,
    '',
    'For each of the four DISTRACTORS, return the per-distractor eliminability assessment as JSON per the schema above.',
  ].join('\n');
}

export async function run(
  _context: AgentContext,
  input: AdversarialStudentInput,
): Promise<AgentOutput<AdversarialStudentReport>> {
  const { draft, model } = input;
  try {
    const { data, tokensUsed } = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildUserMessage(draft),
      outputSchema: adversarialStudentReportSchema,
      ...(model ? { model } : {}),
      maxTokens: 3000,
    });

    // Defensive: ensure per_distractor count matches 4 non-correct options
    const expectedDistractors = (['A', 'B', 'C', 'D', 'E'] as const).filter(
      (o) => o !== draft.correct_answer,
    );
    const seenIds = new Set(data.per_distractor_eliminability.map((d) => d.option_id));
    const missing = expectedDistractors.filter((o) => !seenIds.has(o));
    if (missing.length > 0) {
      return {
        success: false,
        data: null as unknown as AdversarialStudentReport,
        tokensUsed,
        error: `adversarial-student returned eliminability for ${data.per_distractor_eliminability.length} options; missing distractors: ${missing.join(', ')}`,
      };
    }

    // Defensive: recompute surviving_distractor_count + passed in case the model miscounted
    const surviving = data.per_distractor_eliminability.filter((d) => !d.eliminable).length;
    const recomputed: AdversarialStudentReport = {
      ...data,
      surviving_distractor_count: surviving,
      passed: surviving >= 3,
      score: Math.round((10 * surviving) / 4 * 100) / 100,
    };

    return { success: true, data: recomputed, tokensUsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: null as unknown as AdversarialStudentReport,
      tokensUsed: 0,
      error: message,
    };
  }
}
