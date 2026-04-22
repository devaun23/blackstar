import { z } from 'zod';

// Blackstar Master Rubric — score object schema.
// Matches BLACKSTAR_MASTER_RUBRIC.md at repo root and
// blackstar_master_rubric_template.json field-for-field.
//
// This is the CANONICAL rubric for publish_decision routing. The existing
// rubric-score.ts (v1 HealthBench-style 1-5 scaled rubric) is retained as
// supplementary graded-quality signal but does NOT gate publish — that is
// this file's job from 2026-04-22 onward.
//
// Three purposes:
//   1. Validate rubric_evaluator agent output before DB write.
//   2. Type the rubric_score table rows.
//   3. Source of truth for publish_decision derivation.

// ─── Hard gates ─────────────────────────────────────────────────────────────
// All 8 from §Hard gate fail conditions. A fail on any → item fails regardless
// of weighted score.

export const hardGateReasonEnum = z.enum([
  'medical_inaccuracy_or_unsafe',
  'no_single_best_answer',
  'diagnosis_given_away',
  'option_symmetry_broken',
  'wrong_transfer_rule_taught',
  'out_of_shelf_scope',
  'distractors_implausible',
  'missing_required_metadata',
]);
export type HardGateReason = z.infer<typeof hardGateReasonEnum>;

// ─── 10 weighted domain scores, sum = 100 ───────────────────────────────────

export const masterDomainScoresSchema = z.object({
  medical_correctness_scope:   z.number().int().min(0).max(15),
  blueprint_alignment:         z.number().int().min(0).max(8),
  nbme_stem_fidelity:          z.number().int().min(0).max(12),
  hinge_design_ambiguity:      z.number().int().min(0).max(10),
  option_set_quality_symmetry: z.number().int().min(0).max(12),
  key_integrity:               z.number().int().min(0).max(5),
  explanation_quality:         z.number().int().min(0).max(15),
  learner_modeling_value:      z.number().int().min(0).max(8),
  adaptive_sequencing_utility: z.number().int().min(0).max(5),
  production_readiness:        z.number().int().min(0).max(10),
});
export type MasterDomainScores = z.infer<typeof masterDomainScoresSchema>;

// ─── Publish decision ───────────────────────────────────────────────────────

export const publishDecisionEnum = z.enum([
  'publish',          // ≥90, all floor-thresholds passed, hard gates clear
  'revise',           // 80-89 OR ≥90 with a floor fail
  'major_revision',   // 70-79
  'reject',           // <70 OR any hard-gate fail
]);
export type PublishDecision = z.infer<typeof publishDecisionEnum>;

// ─── Sub-rubrics (not additive to total — diagnostic breakouts) ─────────────

export const explanationSubScoresSchema = z.object({
  transfer_rule_clarity:       z.number().int().min(0).max(6),
  hinge_identification:        z.number().int().min(0).max(5),
  correct_answer_defense:      z.number().int().min(0).max(5),
  tempting_distractor_analysis:z.number().int().min(0).max(5),
  cognitive_error_diagnosis:   z.number().int().min(0).max(5),
  brevity_memorability:        z.number().int().min(0).max(4),
}).nullable().optional();
export type ExplanationSubScores = z.infer<typeof explanationSubScoresSchema>;

export const learnerModelingSubScoresSchema = z.object({
  attribute_specificity:        z.number().int().min(0).max(5),
  confusion_set_clarity:        z.number().int().min(0).max(4),
  cognitive_error_observability:z.number().int().min(0).max(4),
  transfer_sensitivity:         z.number().int().min(0).max(4),
  sequencing_usefulness:        z.number().int().min(0).max(3),
}).nullable().optional();
export type LearnerModelingSubScores = z.infer<typeof learnerModelingSubScoresSchema>;

// ─── Required metadata (§Required metadata) ─────────────────────────────────
// Missing any → 'missing_required_metadata' hard gate fires.

export const masterRubricMetadataSchema = z.object({
  shelf: z.string().min(1),
  system: z.string().min(1),
  blueprint_node: z.string().min(1),
  concepts_tested: z.array(z.string()).min(1),
  cognitive_operation: z.string().min(1),
  transfer_rule_text: z.string().min(1),
  hinge_clue: z.string().min(1),
  hinge_depth_target: z.enum(['early', 'middle', 'late', 'buried_late']),
  confusion_set: z.array(z.string()).min(1),
  cognitive_error_targets: z.array(z.string()).min(1),
  difficulty_target: z.enum(['easy', 'medium', 'hard', 'nbme_hard']),
  intended_user_stage: z.enum(['novice', 'intermediate', 'advanced']),
  explanation_goal: z.string().min(1),
  tags: z.array(z.string()),
  // From the template JSON §Machine readable score object example
  next_item_if_fail: z.string().nullable().optional(),
  next_item_if_pass: z.string().nullable().optional(),
});
export type MasterRubricMetadata = z.infer<typeof masterRubricMetadataSchema>;

// ─── Full score object — matches blackstar_master_rubric_template.json ──────

export const masterRubricScoreSchema = z.object({
  item_id: z.string(),
  hard_gate_pass: z.boolean(),
  hard_gate_fail_reasons: z.array(hardGateReasonEnum),
  scores: masterDomainScoresSchema,
  total_score: z.number().int().min(0).max(100),
  publish_decision: publishDecisionEnum,
  metadata: masterRubricMetadataSchema,
  notes: z.string().nullable().optional(),
  explanation_sub_scores: explanationSubScoresSchema,
  learner_modeling_sub_scores: learnerModelingSubScoresSchema,
}).refine((obj) => {
  // When hard gates pass, total_score must equal sum of domain scores.
  const s = obj.scores;
  const sum = s.medical_correctness_scope + s.blueprint_alignment + s.nbme_stem_fidelity +
              s.hinge_design_ambiguity + s.option_set_quality_symmetry + s.key_integrity +
              s.explanation_quality + s.learner_modeling_value + s.adaptive_sequencing_utility +
              s.production_readiness;
  return obj.total_score === sum;
}, { message: 'total_score must equal sum of domain scores' });

export type MasterRubricScore = z.infer<typeof masterRubricScoreSchema>;

// ─── Minimal publish floors (§Minimal publish threshold) ────────────────────

export const MINIMAL_PUBLISH_FLOORS: Record<keyof MasterDomainScores, number> = {
  medical_correctness_scope: 12,
  nbme_stem_fidelity: 9,
  option_set_quality_symmetry: 9,
  explanation_quality: 12,
  learner_modeling_value: 6,
  blueprint_alignment: 0,
  hinge_design_ambiguity: 0,
  key_integrity: 0,
  adaptive_sequencing_utility: 0,
  production_readiness: 0,
};

export const PUBLISH_TOTAL_THRESHOLD = 90;
export const REVISE_TOTAL_THRESHOLD = 80;
export const MAJOR_REVISION_TOTAL_THRESHOLD = 70;

/**
 * Deterministic publish-decision derivation. Pure arithmetic over scores +
 * thresholds from §Minimal publish threshold. The LLM rubric grader returns
 * a suggested decision but this function has final say.
 */
export function deriveMasterRubricDecision(
  hardGatePass: boolean,
  scores: MasterDomainScores,
  totalScore: number,
): PublishDecision {
  if (!hardGatePass) return 'reject';
  if (totalScore < MAJOR_REVISION_TOTAL_THRESHOLD) return 'reject';
  if (totalScore < REVISE_TOTAL_THRESHOLD) return 'major_revision';

  const floorFail = (Object.keys(scores) as Array<keyof MasterDomainScores>).some(
    (k) => scores[k] < MINIMAL_PUBLISH_FLOORS[k],
  );
  if (floorFail) return 'revise';
  if (totalScore >= PUBLISH_TOTAL_THRESHOLD) return 'publish';
  return 'revise';
}
