import { z } from 'zod';

export const validatorTypeEnum = z.enum([
  'medical', 'blueprint', 'nbme_quality', 'option_symmetry', 'explanation_quality', 'exam_translation',
]);

/**
 * Failure categories for structured repair feedback.
 * Research (P2 — QUEST-AI) shows refinement only works with specific error categorization.
 */
export const failureCategoryEnum = z.enum([
  'multiple_correct',      // More than one answer choice is defensible (50% of invalid questions per P2)
  'wrong_answer_keyed',    // The declared correct answer is clinically incorrect (33% per P2)
  'no_correct_answer',     // None of the answer choices is fully correct (17% per P2)
  'medical_error',         // Factual medical inaccuracy in stem or explanation
  'option_asymmetry',      // Answer choices are not parallel in structure/length/specificity
  'stem_clue_leak',        // The stem contains grammatical or logical cues to the answer
  'scope_violation',       // Question topic outside the target exam content outline
  'recall_not_decision',   // Tests fact recall instead of clinical decision-making
  'explanation_gap',       // Explanation doesn't teach the reasoning pathway
  'hinge_missing',         // No clear decision hinge in the vignette
]);

export type FailureCategory = z.infer<typeof failureCategoryEnum>;

export const validatorReportSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(10),
  issues_found: z.array(z.string()),
  repair_instructions: z.string().nullable().optional(),
  failure_category: failureCategoryEnum.nullable().optional(),
});

export type ValidatorReportInput = z.infer<typeof validatorReportSchema>;
