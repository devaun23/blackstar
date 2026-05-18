// Blackstar refine loop — RevisionInstructions schema.
//
// Phase B of ~/.claude/plans/is-this-solvable-toasty-lerdorf.md.
//
// The refine agent consumes a failed (or borderline) ItemDraft + its
// MasterRubricScore (+ optional 7-point audit) and emits a structured
// instruction set that the vignette-writer consumes on its next pass.
//
// Why structured (not free prose):
//   - Free-text critic output is easy for the writer to ignore.
//   - Field-level targets force the next pass to address each defect.
//   - Per-instruction provenance (which rubric domain / hard gate / audit
//     item triggered the change) lets us study what kinds of revisions
//     actually move the rubric.
//
// Status: schema only. The refine-agent stub consumes this. Wiring into
// pipeline-v2.ts + extending vignette-writer to accept revision_instructions
// is deferred until the in-flight firewall work commits — see plan §Sequencing.

import { z } from 'zod';

import { hardGateReasonEnum } from './master-rubric';

// ─── Which field of the ItemDraft is being targeted ─────────────────────────
// Matches itemDraftSchema field names. Use 'cross_cutting' for changes that
// can't be localized (e.g. the vignette and explanation must agree on hinge).

export const revisionTargetFieldEnum = z.enum([
  'vignette',
  'stem',
  'choice_a',
  'choice_b',
  'choice_c',
  'choice_d',
  'choice_e',
  'correct_answer',
  'why_correct',
  'why_wrong_a',
  'why_wrong_b',
  'why_wrong_c',
  'why_wrong_d',
  'why_wrong_e',
  'decision_hinge',
  'reasoning_pathway',
  'competing_differential',
  'high_yield_pearl',
  'cross_cutting',
]);
export type RevisionTargetField = z.infer<typeof revisionTargetFieldEnum>;

// ─── 7-point audit items (mirrors pilot/04-audit-protocol.md) ────────────────
// Optional input — when present, refine-agent can reference specific audit
// failures alongside rubric domain failures.

export const auditItemEnum = z.enum([
  'stem_nbme_compliance',
  'lead_in_form',
  'option_plausibility',
  'correct_answer_not_longest',
  'confusion_set_distractor_present',
  'explanation_quality',
  'no_medical_errors',
]);
export type AuditItem = z.infer<typeof auditItemEnum>;

// ─── One defect → one revision ───────────────────────────────────────────────

export const revisionInstructionSchema = z.object({
  // What to change.
  target_field: revisionTargetFieldEnum,
  // Why — the concrete defect observed, in the writer's vocabulary.
  defect: z.string().min(10),
  // What to do — actionable guidance the writer can execute.
  guidance: z.string().min(10),
  // Provenance — at least one of these must be populated. Drives study of
  // which signal types actually drive revisions.
  rubric_domain_failed: z.string().nullable().optional(),
  hard_gate_failed: hardGateReasonEnum.nullable().optional(),
  audit_item_failed: auditItemEnum.nullable().optional(),
}).refine(
  (obj) =>
    Boolean(obj.rubric_domain_failed) ||
    Boolean(obj.hard_gate_failed) ||
    Boolean(obj.audit_item_failed),
  { message: 'revision instruction must cite at least one provenance source' },
);
export type RevisionInstruction = z.infer<typeof revisionInstructionSchema>;

// ─── The full instruction set passed to vignette-writer ──────────────────────

export const revisionInstructionsSchema = z.object({
  // Which refine pass produced this (1, 2, 3 — cap is enforced in pipeline).
  cycle: z.number().int().min(1).max(3),
  // High-level diagnosis the writer should read first.
  summary: z.string().min(10),
  // Field-level changes. Empty array is invalid — if there's nothing to
  // change, the rubric should have published the item.
  instructions: z.array(revisionInstructionSchema).min(1),
  // Optional: parts of the draft to PRESERVE explicitly. Stops the writer
  // from regressing already-good fields on the next pass.
  preserve: z.array(revisionTargetFieldEnum).nullable().optional(),
});
export type RevisionInstructions = z.infer<typeof revisionInstructionsSchema>;
