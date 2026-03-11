import { z } from 'zod';

export const validatorTypeEnum = z.enum([
  'medical', 'blueprint', 'nbme_quality', 'option_symmetry', 'explanation_quality', 'exam_translation',
]);

export const validatorReportSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(10),
  issues_found: z.array(z.string()),
  repair_instructions: z.string().nullable().optional(),
});

export type ValidatorReportInput = z.infer<typeof validatorReportSchema>;
