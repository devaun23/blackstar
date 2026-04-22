import { z } from 'zod';

// Accept any UUID-shaped string (Claude sometimes generates fake UUIDs with version 0)
// We validate against the actual DB rows downstream, not at schema level
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nullableUuid = z.preprocess(
  (val) => (typeof val === 'string' && !uuidPattern.test(val) ? null : val),
  z.string().regex(uuidPattern).nullable()
);

// What cognitive operation this question tests
export const cognitiveOperationEnum = z.enum([
  'rule_application',           // Apply a known rule to a new scenario
  'threshold_recognition',      // Recognize when a value/finding crosses a decision threshold
  'diagnosis_disambiguation',   // Distinguish between competing diagnoses
  'management_sequencing',      // Choose the correct next step in a sequence
  'risk_stratification',        // Classify severity or urgency correctly
]);

// How deeply the hinge clue is buried in the vignette
export const hingeDepthEnum = z.enum([
  'surface',   // Hinge clue is in the last 1-2 sentences, easy to spot
  'moderate',  // Hinge clue is mid-vignette, requires filtering noise
  'deep',      // Hinge clue is early or embedded in a detail most readers skip
]);

// What type of decision fork makes this question non-trivial
export const decisionForkTypeEnum = z.enum([
  'competing_diagnoses',    // ≥2 plausible diagnoses until the hinge resolves ambiguity
  'management_tradeoff',    // ≥2 valid management options; patient factor tips the balance
  'contraindication',       // Standard treatment is blocked; must choose alternative
  'timing_decision',        // When to act matters (emergent vs urgent vs elective)
  'severity_ambiguity',     // Same presentation could be mild or severe; workup determines
]);

// Rule 2 — Difficulty class drives both batch quotas and session-assembly mix
export const difficultyClassEnum = z.enum([
  'easy_recognition',    // ~30% — classic presentation, pattern-recognition check; a miss signals content gap
  'decision_fork',       // ~60% — the workhorse: 2-3 sequential decisions under ambiguity
  'hard_discrimination', // ~10% — close-call between primary competitor and correct, often involving noise
]);

// Rule 3 — Distractor archetype is a first-class property of every option frame
// Enforced by option_symmetry_validator and by superRefine on casePlanSchema
export const optionArchetypeEnum = z.enum([
  'correct',             // exactly one
  'primary_competitor',  // exactly one — the distractor a strong student seriously considers
  'near_miss',           // would be correct if one stem detail were different
  'zebra',               // 0-1 — exotic trap testing whether student picks common over exotic
  'implausible',         // filler, clinically absurd, should be ruled out quickly
  'neutral',             // plausible-but-plainly-wrong; fills remaining slots
]);

// Pre-specified option frame — each slot defines a clinical meaning the writer renders
export const optionFrameSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  class: z.string().min(1),           // must match option_action_class
  meaning: z.string().min(5),         // clinical meaning of this option (e.g., "transfer for PCI immediately")
  archetype: optionArchetypeEnum,     // Rule 3 — explicit distractor role
  // Near-miss distractor fields (the frame with archetype='near_miss' should fill these)
  near_miss: z.boolean().optional(),              // legacy field; redundant with archetype but kept for back-compat
  pivot_detail: z.string().nullable().optional(),  // what single detail change makes this correct
  correct_if: z.string().nullable().optional(),    // the modified scenario where this IS correct
});

// Rule 1 — One link in the sequential reasoning chain the item requires
export const reasoningStepSchema = z.object({
  step_number: z.number().int().min(1).max(4),
  what_student_must_recognize: z.string().min(10),  // the decision the student makes at this step
  clinical_signal: z.string().min(3),                // the concrete stem datum that resolves the step
});

export const casePlanSchema = z.object({
  // Cognitive operation declaration — what this question tests (REQUIRED)
  cognitive_operation_type: cognitiveOperationEnum,

  // Transfer rule — the portable decision principle, declared BEFORE the question
  // Format: "When [pattern], always [action] before [tempting alternative]"
  transfer_rule_text: z.string().min(10),

  // Hinge depth — how deeply the pivotal finding is buried (REQUIRED)
  hinge_depth_target: hingeDepthEnum,

  // Decision fork — what makes this question non-trivial (REQUIRED)
  decision_fork_type: decisionForkTypeEnum,
  decision_fork_description: z.string().min(10), // "Patient has X but also Y, creating genuine ambiguity between A and B"

  // Rule 1 — Multi-step reasoning chain (2-4 sequential decisions)
  reasoning_step_count: z.number().int().min(2).max(4),
  reasoning_steps: z.array(reasoningStepSchema).min(2).max(4),

  // Rule 2 — Difficulty class drives batch quota + session mix + easy-miss signal
  difficulty_class: difficultyClassEnum,

  // Option action class — all options must be from this same class (REQUIRED)
  option_action_class: z.string().min(1), // e.g., "management_steps", "diagnostic_tests", "medications"

  // Pre-specified option frames — the model CANNOT invent new answer choice classes.
  // Each frame defines a clinical meaning; the writer only renders NBME phrasing.
  option_frames: z.array(optionFrameSchema).length(5),
  correct_option_frame_id: z.enum(['A', 'B', 'C', 'D', 'E']),
  distractor_rationale_by_frame: z.record(z.string(), z.string()).optional(), // frame_id → why this distractor traps
  forbidden_option_classes: z.array(z.string()).optional(), // classes the writer must never introduce

  // Ontology target IDs (resolved by the case_planner agent from names/labels)
  // Uses nullableUuid to tolerate Claude outputting names instead of UUIDs
  target_transfer_rule_id: nullableUuid.optional(),
  target_confusion_set_id: nullableUuid.optional(),
  target_cognitive_error_id: nullableUuid,  // Should be set, but tolerate null if Claude can't resolve
  target_hinge_clue_type_id: nullableUuid.optional(),
  target_action_class_id: nullableUuid.optional(),

  // Difficulty decomposition (1-5 each)
  ambiguity_level: z.number().int().min(1).max(5),
  distractor_strength: z.number().int().min(1).max(5),
  clinical_complexity: z.number().int().min(1).max(5),

  // Estimated difficulty index (0.0-1.0, target 0.55-0.70)
  estimated_difficulty: z.number().min(0).max(1).optional(),

  // Strategy
  ambiguity_strategy: z.string().nullable().optional(),
  distractor_design: z.record(z.string(), z.unknown()).nullable().optional(),
  final_decisive_clue: z.string().nullable().optional(),
  explanation_teaching_goal: z.string().nullable().optional(),

  // B3: Image specification — designs question around visual interpretation even before image generation
  image_spec: z.object({
    image_type: z.enum(['ecg', 'cxr', 'ct', 'skin_lesion', 'lab_panel', 'pathology',
                         'peripheral_smear', 'xray', 'mri', 'ultrasound']),
    description: z.string().min(10),
    key_findings: z.array(z.string().min(3)).min(1).max(5),
    interpretation_required: z.boolean(),
  }).nullable().optional(),
}).superRefine((plan, ctx) => {
  // Rule 1 — reasoning_step_count must match reasoning_steps.length
  if (plan.reasoning_step_count !== plan.reasoning_steps.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reasoning_steps'],
      message: `reasoning_step_count (${plan.reasoning_step_count}) must equal reasoning_steps.length (${plan.reasoning_steps.length})`,
    });
  }
  // Rule 1 — step_numbers must be 1..N in order
  plan.reasoning_steps.forEach((step, idx) => {
    if (step.step_number !== idx + 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasoning_steps', idx, 'step_number'],
        message: `step_number must be ${idx + 1} (sequential)`,
      });
    }
  });

  // Rule 3 — archetype enforcement
  const archetypeCounts = plan.option_frames.reduce<Record<string, number>>((acc, f) => {
    acc[f.archetype] = (acc[f.archetype] ?? 0) + 1;
    return acc;
  }, {});

  if ((archetypeCounts['correct'] ?? 0) !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['option_frames'],
      message: `Exactly one option_frame must have archetype='correct' (found ${archetypeCounts['correct'] ?? 0})`,
    });
  }
  if ((archetypeCounts['primary_competitor'] ?? 0) !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['option_frames'],
      message: `Exactly one option_frame must have archetype='primary_competitor' (found ${archetypeCounts['primary_competitor'] ?? 0}) — Rule 3`,
    });
  }
  if ((archetypeCounts['zebra'] ?? 0) > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['option_frames'],
      message: `At most one option_frame may have archetype='zebra' (found ${archetypeCounts['zebra']}) — Rule 3`,
    });
  }

  // The correct_option_frame_id must point at the frame with archetype='correct'
  const correctFrame = plan.option_frames.find((f) => f.id === plan.correct_option_frame_id);
  if (correctFrame && correctFrame.archetype !== 'correct') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['correct_option_frame_id'],
      message: `correct_option_frame_id points to ${correctFrame.id} but its archetype is '${correctFrame.archetype}' (expected 'correct')`,
    });
  }
});

export type OptionFrame = z.infer<typeof optionFrameSchema>;
export type CasePlanInput = z.infer<typeof casePlanSchema>;
export type DifficultyClass = z.infer<typeof difficultyClassEnum>;
export type OptionArchetype = z.infer<typeof optionArchetypeEnum>;
export type ReasoningStep = z.infer<typeof reasoningStepSchema>;
