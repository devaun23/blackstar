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

// Pre-specified option frame — each slot defines a clinical meaning the writer renders
export const optionFrameSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  class: z.string().min(1),           // must match option_action_class
  meaning: z.string().min(5),         // clinical meaning of this option (e.g., "transfer for PCI immediately")
  // Near-miss distractor fields (exactly one distractor should have near_miss: true)
  near_miss: z.boolean().optional(),              // true for the near-miss distractor
  pivot_detail: z.string().nullable().optional(),  // what single detail change makes this correct
  correct_if: z.string().nullable().optional(),    // the modified scenario where this IS correct
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
});

export type OptionFrame = z.infer<typeof optionFrameSchema>;
export type CasePlanInput = z.infer<typeof casePlanSchema>;
