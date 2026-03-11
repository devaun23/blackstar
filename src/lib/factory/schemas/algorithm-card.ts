import { z } from 'zod';

export const factTypeEnum = z.enum([
  'threshold', 'drug_choice', 'contraindication', 'diagnostic_criterion', 'risk_factor', 'complication', 'management_step',
]);

export const confidenceEnum = z.enum(['high', 'moderate', 'low']);

export const factRowSchema = z.object({
  fact_type: factTypeEnum,
  fact_text: z.string().min(1),
  threshold_value: z.string().nullable().optional(),
  source_name: z.string().min(1),
  source_tier: z.enum(['A', 'B', 'C']),
  confidence: confidenceEnum,
});

export const algorithmCardSchema = z.object({
  entry_presentation: z.string().min(10),
  competing_paths: z.array(z.string()).min(2),
  hinge_feature: z.string().min(1),
  correct_action: z.string().min(1),
  contraindications: z.array(z.string()),
  source_citations: z.array(z.string()).min(1),
  time_horizon: z.string().nullable().optional(),
  severity_markers: z.array(z.string()).nullable().optional(),
});

// Combined output from Algorithm Extractor agent
export const algorithmExtractorOutputSchema = z.object({
  algorithm_card: algorithmCardSchema,
  fact_rows: z.array(factRowSchema).min(3).max(6),
});

export type AlgorithmCardInput = z.infer<typeof algorithmCardSchema>;
export type FactRowInput = z.infer<typeof factRowSchema>;
export type AlgorithmExtractorOutput = z.infer<typeof algorithmExtractorOutputSchema>;
