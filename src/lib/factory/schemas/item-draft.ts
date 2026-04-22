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

// Rule 4 — Down-to-two discrimination block, always emitted by explanation_writer
export const downToTwoDiscriminationSchema = z.object({
  competitor_option: z.enum(['A', 'B', 'C', 'D', 'E']),  // the primary_competitor from case_plan
  tipping_detail: z.string().min(10),                     // concrete stem datum that tips the decision
  counterfactual: z.string().min(20),                     // scenario where competitor would be correct
});

export type DownToTwoDiscrimination = z.infer<typeof downToTwoDiscriminationSchema>;

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
  // Rule 4 — Teach the "down to two" skill
  down_to_two_discrimination: downToTwoDiscriminationSchema,
  // Rule 10 — Question-writer intent, template: "This question tests whether you prioritize X over Y when Z"
  question_writer_intent: z.string().min(20).max(200),
  // Rule 2 — On easy_recognition items, the one-line pattern a competent student should see
  easy_recognition_check: z.string().nullable().optional(),
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
    })).min(5, 'at least 5 discriminating features').max(6),
  }).nullable().optional(),
  // v24 — 7-component adaptive display. Nullable during rollout; prompt v7 enforces.
  anchor_rule: z.string()
    .min(10)
    .max(80)
    .refine((s) => s.trim().split(/\s+/).length <= 15, {
      message: 'anchor_rule must be ≤15 words',
    })
    .nullable()
    .optional(),
  illness_script: z.string().min(60).max(280).nullable().optional(),
  reasoning_compressed: z.string().min(40).max(240).nullable().optional(),
  management_protocol: z.array(z.object({
    step_num: z.number().int().min(1).max(12),
    action: z.string().min(8).max(160),
    criterion: z.string().max(160).nullable(),
  })).min(3).max(8).nullable().optional(),
  traps: z.array(z.object({
    trap_name: z.string().min(6).max(80),
    validation: z.string().min(20).max(240),
    correction: z.string().min(40).max(320),
    maps_to_option: z.enum(['A', 'B', 'C', 'D', 'E']).nullable(),
  })).min(2).max(5).nullable().optional(),
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
