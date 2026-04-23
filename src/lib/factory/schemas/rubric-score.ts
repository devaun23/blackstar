import { z } from 'zod';

// HealthBench-style multi-criterion rubric scoring for finished items.
//
// Unlike the binary validators (pass/fail + issues), this produces 1-5 scaled
// scores across 8 dimensions with a one-sentence rationale for each. The goal
// is *graded* quality signal, not gate-keeping — use it to rank items, prioritize
// human review, detect calibration drift over time, and flag items that pass
// the binary gate but are weak on specific dimensions.
//
// Rubric version is encoded in the Zod schema and stored in the DB so future
// rubric revisions don't corrupt historical scores.

export const RUBRIC_VERSION = 'v1';

export const rubricCriterionScoreSchema = z.object({
  score: z.number().int().min(1).max(5),
  rationale: z.string().min(1).describe('One concise sentence justifying the score.'),
});

export const rubricSubScoresSchema = z.object({
  medical_correctness: rubricCriterionScoreSchema.describe(
    'Is every clinical claim in stem + explanation factually accurate per current guidelines?',
  ),
  blueprint_fit: rubricCriterionScoreSchema.describe(
    'Does the item test the targeted task_type + topic + clinical_setting, or does it drift?',
  ),
  nbme_voice: rubricCriterionScoreSchema.describe(
    'Does the prose read like NBME (terse, structural regularity, no AI-tells)?',
  ),
  distractor_plausibility: rubricCriterionScoreSchema.describe(
    'Would each distractor realistically tempt a reasonable-but-undertrained student (not a strawman)?',
  ),
  single_best_answer_integrity: rubricCriterionScoreSchema.describe(
    'Is exactly one option fully correct under the stem conditions, with all others defensibly wrong?',
  ),
  hinge_clarity: rubricCriterionScoreSchema.describe(
    'Is the decision hinge present, discriminating, and buried at appropriate depth (not telegraphed)?',
  ),
  explanation_transfer_value: rubricCriterionScoreSchema.describe(
    'Does the explanation teach a rule the learner can transfer, or only restate the answer?',
  ),
  option_symmetry: rubricCriterionScoreSchema.describe(
    'Are options parallel in structure, specificity, length, and action class? Correct answer not longest?',
  ),
});

export const rubricOutputSchema = z.object({
  rubric_version: z.literal(RUBRIC_VERSION),
  overall_score: z
    .number()
    .min(1)
    .max(5)
    .describe('Mean of the 8 sub-scores, rounded to 2 decimals.'),
  sub_scores: rubricSubScoresSchema,
  flagged: z.boolean().describe('True if any sub-score is <= 2.'),
  summary: z.string().describe('One-paragraph overall assessment.'),
});

export type RubricSubScores = z.infer<typeof rubricSubScoresSchema>;
export type RubricOutput = z.infer<typeof rubricOutputSchema>;
export type RubricCriterion = keyof RubricSubScores;

export const RUBRIC_CRITERIA: RubricCriterion[] = [
  'medical_correctness',
  'blueprint_fit',
  'nbme_voice',
  'distractor_plausibility',
  'single_best_answer_integrity',
  'hinge_clarity',
  'explanation_transfer_value',
  'option_symmetry',
];
