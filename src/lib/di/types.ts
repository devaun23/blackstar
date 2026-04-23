// Review source evidence layer types
// Supports Divine Intervention, UWorld Inner Circle, and future review sources.
// Tables: di_episode, di_evidence_item (names are historical; the `source` column differentiates).

import { z } from 'zod/v4';

// --- Source identifiers ---

export type ReviewSource = 'divine_intervention' | 'inner_circle' | 'amboss' | 'emma_holliday' | 'nbme';
export const REVIEW_SOURCES = ['divine_intervention', 'inner_circle', 'amboss', 'emma_holliday', 'nbme'] as const;

// --- Enums ---

export const DIItemType = z.enum([
  'clinical_pearl',
  'comparison_table',
  'mnemonic',
  'risk_factor',
  'treatment_protocol',
  'pharmacology',
  'pathophysiology',
  'diagnostic_criterion',
  // AMBOSS behavioral science types
  'definition',
  'legal_rule',
  'procedure_protocol',
  'classification',
  'ethical_principle',
  // NBME CCSS types (case_presentation = the clinical scenario + options block;
  // distractor_rule = why each wrong option is wrong, usable as option-analysis pattern)
  'case_presentation',
  'distractor_rule',
]);
export type DIItemType = z.infer<typeof DIItemType>;

// --- Row types ---

export interface DIEpisodeRow {
  id: string;
  episode_number: number;
  title: string;
  shelf: string | null;
  topic_tags: string[];
  source_file: string;
  total_items: number;
  source: ReviewSource;
  ingested_at: string;
}

export interface DIEvidenceItemRow {
  id: string;
  episode_id: string;
  item_type: DIItemType;
  section_heading: string;
  claim: string;
  raw_text: string;
  trigger_presentation: string | null;
  association: string | null;
  differential: Array<{ condition: string; features: string }> | null;
  mnemonic_text: string | null;
  topic_tags: string[];
  shelf: string | null;
  display_id: string;
  source: ReviewSource;
  created_at: string;
}

// --- Ingestion types (used by parser + ingestion script) ---

export interface ParsedEpisode {
  episode_number: number;
  title: string;
  shelf: string | null;
  topic_tags: string[];       // Raw DI tags from frontmatter
  source_file: string;
  items: ParsedEvidenceItem[];
}

export interface ParsedEvidenceItem {
  item_type: DIItemType;
  section_heading: string;
  claim: string;
  raw_text: string;
  trigger_presentation: string | null;
  association: string | null;
  differential: Array<{ condition: string; features: string }> | null;
  mnemonic_text: string | null;
  topic_tags: string[];       // Normalized to Blackstar topics
  shelf: string | null;
}

// --- Zod schemas for validation ---

export const ParsedEvidenceItemSchema = z.object({
  item_type: DIItemType,
  section_heading: z.string().min(1),
  claim: z.string().min(1),
  raw_text: z.string().min(1),
  trigger_presentation: z.string().nullable(),
  association: z.string().nullable(),
  differential: z.array(z.object({ condition: z.string(), features: z.string() })).nullable(),
  mnemonic_text: z.string().nullable(),
  topic_tags: z.array(z.string()),
  shelf: z.string().nullable(),
});

export const ParsedEpisodeSchema = z.object({
  episode_number: z.number().int().positive(),
  title: z.string().min(1),
  shelf: z.string().nullable(),
  topic_tags: z.array(z.string()),
  source_file: z.string().min(1),
  items: z.array(ParsedEvidenceItemSchema),
});
