import { z } from 'zod';

export const batchQuestionSchema = z.object({
  vignette: z.string().min(50),
  stem: z.string().min(10),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  option_e: z.string().min(1),
  correct_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  error_map: z.record(z.string(), z.string()),
  transfer_rule_text: z.string().min(5),
  explanation_decision: z.string().min(10),
  explanation_options: z.string().min(10),
  explanation_summary: z.string().min(10),
  system_topic: z.string(),
  confusion_set_name: z.string().nullable(),
  error_bucket: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const batchOutputSchema = z.array(batchQuestionSchema);

export type BatchQuestion = z.infer<typeof batchQuestionSchema>;
