import type { SourcePack } from './types';

// Phase D stub — to be normalized from ACG GI Bleeding Guidelines
export const pack: SourcePack = {
  source_pack_id: 'PACK.ACG.GIB.2021',
  source_name: 'ACG GI Bleeding Guidelines',
  canonical_url:
    'https://journals.lww.com/ajg/fulltext/2021/05000/acg_clinical_guideline__upper_gastrointestinal_and.14.aspx',
  publication_year: 2021,
  guideline_body: 'American College of Gastroenterology',

  topic_tags: ['GI Bleed'],
  allowed_decision_scopes: [],
  excluded_decision_scopes: [],

  recommendations: [],
  diagnostic_criteria: [],
  thresholds: [],
  treatment_steps: [],
  red_flags: [],
  severity_definitions: [],

  source_pack_version: 0,
  status: 'draft',
  last_normalized: '2026-03-11',
  normalizer_version: 1,
  normalization_notes: 'Stub — awaiting guideline content for normalization.',

  all_item_ids: [],
  all_display_ids: [],
};
