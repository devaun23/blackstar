import { z } from 'zod';
import { hingeDepthEnum } from './case-plan';

// Frame-anchored option — each slot inherits from case_plan.option_frames
// The skeleton writer fills cognitive_error_id per distractor; the vignette writer fills rendered_text
const skeletonOptionFrameSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  class: z.string().min(1),                               // must match option_action_class
  meaning: z.string().min(5),                              // clinical meaning (from case_plan)
  cognitive_error_id: z.string().uuid().nullable(),        // null for the correct option
  action_class_id: z.string().uuid().nullable().optional(),
  rendered_text: z.string().nullable().optional(),         // NBME-polished wording (vignette_writer fills this)
});

export const questionSkeletonSchema = z.object({
  case_summary: z.string().min(10),
  hidden_target: z.string().min(1),
  correct_action: z.string().min(1),
  correct_action_class_id: z.string().uuid().nullable().optional(),

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
});

export const skeletonValidatorOutputSchema = z.object({
  skeleton_validated: z.boolean(),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type QuestionSkeletonInput = z.infer<typeof questionSkeletonSchema>;
export type SkeletonValidatorOutput = z.infer<typeof skeletonValidatorOutputSchema>;
