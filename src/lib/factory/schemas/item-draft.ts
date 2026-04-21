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
  // v22 UWorld-equivalent depth — medicine_deep_dive is strictly required so a missing
  // field forces Zod retry inside callClaude instead of silently writing null.
  medicine_deep_dive: z.object({
    pathophysiology: z.string().min(80, 'pathophysiology must be at least 80 chars (2-3 sentences)'),
    diagnostic_criteria: z.string().min(40),
    management_algorithm: z.string().min(120, 'full management, not just the tested step'),
    monitoring_and_complications: z.string().min(40),
    high_yield_associations: z.string().min(20),
  }),
  comparison_table: z.object({
    confusion_set_id: z.string().uuid().nullable(),
    condition_a: z.string(),
    condition_b: z.string(),
    rows: z.array(z.object({
      feature: z.string(),
      condition_a_value: z.string(),
      condition_b_value: z.string(),
    })).min(5, 'at least 5 discriminating features').max(8),
  }).nullable().optional(),
  pharmacology_notes: z.array(z.object({
    drug: z.string(),
    appears_as: z.enum(['correct_answer', 'distractor']),
    mechanism: z.string().min(20),
    major_side_effects: z.array(z.string()).min(2),
    critical_contraindications: z.array(z.string()),
    monitoring: z.string(),
    key_interaction: z.string().nullable(),
  })).nullable().optional(),
  image_pointer: z.object({
    image_type: z.enum(['ecg','cxr','ct','mri','ultrasound','skin_lesion','pathology','peripheral_smear','xray','lab_panel']),
    reference_id: z.string(),
    license_tag: z.string(),
    alt_text: z.string(),
  }).nullable().optional(),
});

export type ItemDraftInput = z.infer<typeof itemDraftSchema>;
export type ExplanationOutput = z.infer<typeof explanationOutputSchema>;
