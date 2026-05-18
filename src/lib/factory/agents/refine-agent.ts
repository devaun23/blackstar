// Refine agent — Phase B of ~/.claude/plans/is-this-solvable-toasty-lerdorf.md.
//
// Consumes a draft + its MasterRubricScore (+ optional 7-point audit) and
// emits structured RevisionInstructions for the vignette-writer's next pass.
//
// STATUS: stub. The agent function is fully typed and the prompt is
// authored, but the agent is NOT yet:
//   (a) registered as an AgentType (requires DB migration + prompt seed),
//   (b) wired into pipeline-v2.ts (waiting for the in-flight firewall
//       changes to commit — modifying pipeline-v2 now would conflict).
//
// Both wire-up steps are scoped in the plan. This file exists so the schema
// + prompt can be reviewed before the loop goes live.

import { z } from 'zod';

import { callClaude } from '../claude';
import {
  revisionInstructionsSchema,
  type RevisionInstructions,
  type AuditItem,
} from '../schemas/refine';
import type { MasterRubricScore } from '../schemas/master-rubric';
import type { ItemDraftRow } from '@/lib/types/database';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';

export interface RefineAgentInput {
  draft: ItemDraftRow;
  rubricScore: MasterRubricScore;
  /** Optional 7-point audit. If absent, refine reasons over rubric only. */
  failedAuditItems?: AuditItem[];
  /** Which refine cycle this is (1-indexed). Pipeline-v2 caps at 3. */
  cycle: 1 | 2 | 3;
  /** Optional model override for the refine call. */
  model?: string;
}

const SYSTEM_PROMPT = `You are a senior NBME item writer's critic. Your job is to read a
draft, its rubric score, and (optionally) a 7-point audit, then emit STRUCTURED
revision instructions that the writer agent will execute on its next pass.

You do NOT rewrite the item. You diagnose defects and prescribe field-level
changes.

Rules:
1. Every instruction must cite at least one provenance source: a rubric domain
   that scored low, a hard gate that failed, or a 7-point audit item that
   failed. Cite the most specific source available.
2. Target the smallest fix that resolves each defect. Don't ask the writer to
   rewrite the vignette when a stem-level change would suffice.
3. Be explicit about what to preserve. If the hinge clue is correct, name it
   in the 'preserve' list — otherwise the writer may regress it.
4. Never invent medical content. Critique structure, hinge depth, distractor
   plausibility, explanation alignment, NBME stem fidelity. Medical
   correctness is upstream (validators) — if a fact is wrong, cite the
   medical_inaccuracy_or_unsafe hard gate and let the next pass repair it
   against the fact_rows.
5. Output MUST conform to the RevisionInstructions schema. No prose around it.`;

const USER_PROMPT_TEMPLATE = (input: RefineAgentInput): string => {
  const { draft, rubricScore, failedAuditItems, cycle } = input;
  const auditBlock =
    failedAuditItems && failedAuditItems.length > 0
      ? `Failed 7-point audit items: ${failedAuditItems.join(', ')}`
      : 'No 7-point audit attached.';
  return `─── CURRENT DRAFT (cycle ${cycle}) ───
vignette:
${draft.vignette}

stem:
${draft.stem}

choices:
  A. ${draft.choice_a}
  B. ${draft.choice_b}
  C. ${draft.choice_c}
  D. ${draft.choice_d}
  E. ${draft.choice_e}

correct_answer: ${draft.correct_answer}
why_correct: ${draft.why_correct ?? '(missing)'}
why_wrong_a: ${draft.why_wrong_a ?? '(missing)'}
why_wrong_b: ${draft.why_wrong_b ?? '(missing)'}
why_wrong_c: ${draft.why_wrong_c ?? '(missing)'}
why_wrong_d: ${draft.why_wrong_d ?? '(missing)'}
why_wrong_e: ${draft.why_wrong_e ?? '(missing)'}
decision_hinge: ${draft.decision_hinge ?? '(missing)'}

─── RUBRIC SCORE ───
total_score: ${rubricScore.total_score} / 100
publish_decision: ${rubricScore.publish_decision}
hard_gate_pass: ${rubricScore.hard_gate_pass}
hard_gate_fail_reasons: ${rubricScore.hard_gate_fail_reasons.join(', ') || '(none)'}

domain scores:
${Object.entries(rubricScore.scores)
  .map(([k, v]) => `  ${k}: ${v}`)
  .join('\n')}

notes: ${rubricScore.notes ?? '(none)'}

─── AUDIT ───
${auditBlock}

─── YOUR TASK ───
Emit RevisionInstructions JSON conforming to the schema. cycle=${cycle}.
At least one instruction. Cite provenance on every one. List preserve items
when relevant.`;
};

export async function run(
  _context: AgentContext,
  input: RefineAgentInput,
): Promise<AgentOutput<RevisionInstructions>> {
  try {
    const userMessage = USER_PROMPT_TEMPLATE(input);
    const { data, tokensUsed } = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      outputSchema: revisionInstructionsSchema as z.ZodType<RevisionInstructions>,
      ...(input.model ? { model: input.model } : {}),
    });
    return { success: true, data, tokensUsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: null as unknown as RevisionInstructions,
      tokensUsed: 0,
      error: message,
    };
  }
}
