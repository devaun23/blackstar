import { z } from 'zod';
import { hingeDepthEnum, optionArchetypeEnum } from './case-plan';

// Frame-anchored option — each slot inherits from case_plan.option_frames
// The skeleton writer fills cognitive_error_id per distractor; the vignette writer fills rendered_text
// Accept any UUID-shaped string (Claude may generate version-0 UUIDs)
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nullableUuid = z.preprocess(
  (val) => (typeof val === 'string' && !uuidPattern.test(val) ? null : val),
  z.string().regex(uuidPattern).nullable()
);

const skeletonOptionFrameSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  class: z.string().min(1),                               // must match option_action_class
  meaning: z.string().min(5),                              // clinical meaning (from case_plan)
  archetype: optionArchetypeEnum,                          // Rule 3 — mirrored from case_plan.option_frames
  cognitive_error_id: nullableUuid,                        // null for the correct option
  action_class_id: nullableUuid.optional(),
  rendered_text: z.string().nullable().optional(),         // NBME-polished wording (vignette_writer fills this)
});

export const questionSkeletonSchema = z.object({
  case_summary: z.string().min(10),
  hidden_target: z.string().min(1),
  correct_action: z.string().min(1),
  correct_action_class_id: nullableUuid.optional(),

  // Option action class — ALL options (correct + wrong) must be from this class
  option_action_class: z.string().min(1),  // e.g., "management_steps", "diagnostic_tests", "medications"

  // Frame-anchored options — inherited from case_plan, NOT invented by the writer
  option_frames: z.array(skeletonOptionFrameSchema).length(5),
  correct_option_frame_id: z.enum(['A', 'B', 'C', 'D', 'E']),

  error_mapping: z.record(z.string(), z.string()).nullable().optional(),

  // Hinge specification — REQUIRED, must match case_plan.hinge_depth_target
  hinge_placement: z.string().min(1),             // Where in the vignette the hinge clue appears
  hinge_description: z.string().min(1),           // What the pivotal finding is
  hinge_depth: hingeDepthEnum,                    // Actual depth (skeleton_validator checks vs case_plan target)
  hinge_buried_by: z.string().min(1),             // What noise/detail obscures the hinge clue

  // B1: Purpose-tagged vignette details — forces intentional psychometric design
  planned_details: z.array(z.object({
    detail: z.string().min(3),                        // e.g., "WBC 18,000", "bilateral crackles"
    purpose: z.enum(['hinge', 'supporting', 'competing', 'noise']),
    target_option: z.enum(['A', 'B', 'C', 'D', 'E']).nullable().optional(), // null for noise, required for competing
    // Rule 3 mirror — the archetype of target_option in case_plan; optional (noise has no target)
    target_option_archetype: optionArchetypeEnum.nullable().optional(),
  })).min(4).max(12).optional(),

  // B2: Temporal ordering — required for management_sequencing or "first/next/initial" lead-ins
  temporal_ordering: z.array(z.object({
    option_id: z.enum(['A', 'B', 'C', 'D', 'E']),
    sequence_position: z.number().int().min(1).max(5),
    rationale: z.string().min(5),
  })).length(5).nullable().optional(),
});

export const skeletonValidatorOutputSchema = z.object({
  skeleton_validated: z.boolean(),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type QuestionSkeletonInput = z.infer<typeof questionSkeletonSchema>;
export type SkeletonValidatorOutput = z.infer<typeof skeletonValidatorOutputSchema>;
