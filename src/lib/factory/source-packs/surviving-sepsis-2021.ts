import type { SourcePack } from './types';

// Phase D stub — to be normalized from Surviving Sepsis Campaign Guidelines
export const pack: SourcePack = {
  source_pack_id: 'PACK.SSC.SEPSIS.2021',
  source_name: 'Surviving Sepsis Campaign Guidelines',
  canonical_url: 'https://www.sccm.org/SurvivingSepsisCampaign/Guidelines',
  publication_year: 2021,
  guideline_body: 'Society of Critical Care Medicine / European Society of Intensive Care Medicine',

  topic_tags: ['Sepsis', 'Septic Shock'],
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
