import { z } from 'zod';
import { visualSpecSchema } from './visual-specs';

export const correctAnswerEnum = z.enum(['A', 'B', 'C', 'D', 'E']);

export const itemDraftSchema = z.object({
  vignette: z.string().min(50),
  stem: z.string().min(10),
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  choice_d: z.string().min(1),
  choice_e: z.string().min(1),
  correct_answer: correctAnswerEnum,
  why_correct: z.string().min(10),
  why_wrong_a: z.string().nullable().optional(),
  why_wrong_b: z.string().nullable().optional(),
  why_wrong_c: z.string().nullable().optional(),
  why_wrong_d: z.string().nullable().optional(),
  why_wrong_e: z.string().nullable().optional(),
  high_yield_pearl: z.string().nullable().optional(),
  reasoning_pathway: z.string().nullable().optional(),
  decision_hinge: z.string().nullable().optional(),
  competing_differential: z.string().nullable().optional(),
  visual_specs: z.array(visualSpecSchema).nullable().optional(),
});

// Explanation Writer output (updates existing draft)
export const explanationOutputSchema = z.object({
  why_correct: z.string().min(10),
  why_wrong_a: z.string().nullable().optional(),
  why_wrong_b: z.string().nullable().optional(),
  why_wrong_c: z.string().nullable().optional(),
  why_wrong_d: z.string().nullable().optional(),
  why_wrong_e: z.string().nullable().optional(),
  high_yield_pearl: z.string().min(10),
  reasoning_pathway: z.string().min(10),
  visual_specs: z.array(visualSpecSchema).nullable().optional(),
  // v2 5-component explanation (nullable for backward compatibility)
  explanation_decision_logic: z.string().nullable().optional(),
  explanation_hinge_id: z.string().uuid().nullable().optional(),
  explanation_error_diagnosis: z.record(
    z.enum(['A', 'B', 'C', 'D', 'E']),
    z.object({
      error_name: z.string(),
      explanation: z.string().max(200),
    }),
  ).nullable().optional(),
  explanation_transfer_rule: z.string().nullable().optional(),
  explanation_teaching_pearl: z.string().nullable().optional(),
  // v20 Palmerton gap coaching (skills/noise/consistency-specific process coaching)
  explanation_gap_coaching: z.string().nullable().optional(),
  // v21 Counterfactual — teaches rule boundary: "If [X changed], answer shifts to [Y]"
  explanation_counterfactual: z.string().nullable().optional(),
});

export type ItemDraftInput = z.infer<typeof itemDraftSchema>;
export type ExplanationOutput = z.infer<typeof explanationOutputSchema>;
