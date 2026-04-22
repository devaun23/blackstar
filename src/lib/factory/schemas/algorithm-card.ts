import { z } from 'zod';

// ─── Fact type normalization ───
// The LLM frequently outputs near-miss variants of the canonical enum values.
// Instead of failing validation (and wasting the entire pipeline run), map
// common synonyms to their canonical form.
// Canonical fact types
const CANONICAL_FACT_TYPES = [
  'threshold', 'drug_choice', 'contraindication', 'diagnostic_criterion', 'risk_factor', 'complication', 'management_step',
] as const;

// Keyword-based fuzzy matching for LLM-generated fact_type values.
// The LLM generates endlessly creative synonyms — exact alias maps can't keep up.
// Instead, match by keyword overlap and fall back to 'management_step' (safest default).
const KEYWORD_MAP: Array<{ keywords: string[]; target: typeof CANONICAL_FACT_TYPES[number] }> = [
  { keywords: ['drug', 'medication', 'dosing', 'dose', 'pharmacol', 'vasopressor', 'antibiotic', 'steroid', 'antihypertensive', 'statin', 'insulin'], target: 'drug_choice' },
  { keywords: ['threshold', 'target', 'hemodynamic', 'level', 'cutoff', 'value', 'range', 'normal'], target: 'threshold' },
  { keywords: ['risk', 'mortality', 'prognosis', 'epidemiol', 'stratification', 'prevalence', 'incidence', 'morbidity'], target: 'risk_factor' },
  { keywords: ['diagnost', 'criteria', 'classification', 'differential', 'workup', 'staging'], target: 'diagnostic_criterion' },
  { keywords: ['contraindic', 'avoid', 'prohibit', 'caution'], target: 'contraindication' },
  { keywords: ['complic', 'monitor', 'adverse', 'side_effect', 'toxicity', 'follow_up'], target: 'complication' },
  { keywords: ['treatment', 'management', 'intervention', 'resuscitat', 'therapy', 'timing', 'protocol', 'source_control', 'fluid', 'surgical'], target: 'management_step' },
];

function normalizeFact(val: unknown): unknown {
  if (typeof val !== 'string') return val;
  const lower = val.toLowerCase().trim().replace(/\s+/g, '_');

  // Direct match
  if ((CANONICAL_FACT_TYPES as readonly string[]).includes(lower)) return lower;

  // Keyword fuzzy match
  for (const { keywords, target } of KEYWORD_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return target;
  }

  // Default fallback — 'management_step' is the safest catch-all
  return 'management_step';
}

export const factTypeEnum = z.enum([
  'threshold', 'drug_choice', 'contraindication', 'diagnostic_criterion', 'risk_factor', 'complication', 'management_step',
]);

const normalizedFactType = z.preprocess(normalizeFact, factTypeEnum);

export const confidenceEnum = z.enum(['high', 'moderate', 'low']);

// Normalize source_tier: "tier_a" → "A", "Tier B" → "B", etc.
const normalizedSourceTier = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return val;
    const lower = val.toLowerCase().trim();
    if (lower === 'a' || lower === 'tier_a' || lower === 'tier a') return 'A';
    if (lower === 'b' || lower === 'tier_b' || lower === 'tier b') return 'B';
    if (lower === 'c' || lower === 'tier_c' || lower === 'tier c') return 'C';
    return val.toUpperCase().charAt(val.length - 1); // Last char as fallback
  },
  z.enum(['A', 'B', 'C']),
);

// Normalize threshold_value: numbers → strings
const normalizedThresholdValue = z.preprocess(
  (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return String(val);
    return val;
  },
  z.string().nullable().optional(),
);

export const factRowSchema = z.object({
  fact_type: normalizedFactType,
  fact_text: z.string().min(1),
  threshold_value: normalizedThresholdValue,
  source_name: z.string().min(1),
  source_tier: normalizedSourceTier,
  confidence: confidenceEnum,
});

// ─── Competing paths normalization ───
// The LLM sometimes returns objects {pathway, key_features} instead of strings.
// Extract the pathway/path string when this happens.
const normalizedCompetingPath = z.preprocess(
  (val) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      if (typeof obj.pathway === 'string') return obj.pathway;
      if (typeof obj.path === 'string') return obj.path;
      if (typeof obj.diagnosis === 'string') return obj.diagnosis;
      // Last resort: stringify the object
      return JSON.stringify(val);
    }
    return val;
  },
  z.string(),
);

export const algorithmCardSchema = z.object({
  entry_presentation: z.string().min(10),
  competing_paths: z.array(normalizedCompetingPath).min(2),
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
