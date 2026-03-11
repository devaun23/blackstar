import { z } from 'zod';

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
});

export type ItemDraftInput = z.infer<typeof itemDraftSchema>;
export type ExplanationOutput = z.infer<typeof explanationOutputSchema>;
