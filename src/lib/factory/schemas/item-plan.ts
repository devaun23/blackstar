import { z } from 'zod';

export const itemPlanSchema = z.object({
  target_hinge: z.string().min(1),
  competing_options: z.array(z.string()).min(4).max(5),
  target_cognitive_error: z.string().min(1),
  noise_elements: z.array(z.string()).min(1),
  option_class: z.string().min(1),
  distractor_rationale: z.string().min(10),
});

export type ItemPlanInput = z.infer<typeof itemPlanSchema>;
