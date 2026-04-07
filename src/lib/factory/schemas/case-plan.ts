import { z } from 'zod';

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

// Pre-specified option frame — each slot defines a clinical meaning the writer renders
export const optionFrameSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  class: z.string().min(1),           // must match option_action_class
  meaning: z.string().min(5),         // clinical meaning of this option (e.g., "transfer for PCI immediately")
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

  // Option action class — all options must be from this same class (REQUIRED)
  option_action_class: z.string().min(1), // e.g., "management_steps", "diagnostic_tests", "medications"

  // Pre-specified option frames — the model CANNOT invent new answer choice classes.
  // Each frame defines a clinical meaning; the writer only renders NBME phrasing.
  option_frames: z.array(optionFrameSchema).length(5),
  correct_option_frame_id: z.enum(['A', 'B', 'C', 'D', 'E']),
  distractor_rationale_by_frame: z.record(z.string(), z.string()).optional(), // frame_id → why this distractor traps
  forbidden_option_classes: z.array(z.string()).optional(), // classes the writer must never introduce

  // Ontology target IDs (resolved by the case_planner agent from names/labels)
  target_transfer_rule_id: z.string().uuid().nullable().optional(),
  target_confusion_set_id: z.string().uuid().nullable().optional(),
  target_cognitive_error_id: z.string().uuid(),  // REQUIRED — every question targets a named error
  target_hinge_clue_type_id: z.string().uuid().nullable().optional(),
  target_action_class_id: z.string().uuid().nullable().optional(),

  // Difficulty decomposition (1-5 each)
  ambiguity_level: z.number().int().min(1).max(5),
  distractor_strength: z.number().int().min(1).max(5),
  clinical_complexity: z.number().int().min(1).max(5),

  // Strategy
  ambiguity_strategy: z.string().nullable().optional(),
  distractor_design: z.record(z.string(), z.unknown()).nullable().optional(),
  final_decisive_clue: z.string().nullable().optional(),
  explanation_teaching_goal: z.string().nullable().optional(),
});

export type OptionFrame = z.infer<typeof optionFrameSchema>;
export type CasePlanInput = z.infer<typeof casePlanSchema>;
