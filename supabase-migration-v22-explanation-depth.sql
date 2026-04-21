-- v22: expand item_draft explanation shape for UWorld-equivalent depth
--
-- Adds four JSONB columns that hold the structured explanation layers:
--   * medicine_deep_dive — required mini-review (pathophysiology, diagnostic_criteria,
--     management_algorithm, monitoring_and_complications, high_yield_associations)
--   * comparison_table   — discriminating-features table for confusion-set-targeted items
--   * pharmacology_notes — per-drug teaching (mechanism, SE, contraindications, monitoring, interactions)
--   * image_pointer      — curator-pending reference image metadata for visual-diagnosis topics
--
-- All four are nullable at the DB level. Presence is enforced by the explanation_validator
-- agent (conditional on confusion-set target / drug options / image_spec), not at the column
-- level, so legacy rows and non-clinical items stay valid.

alter table item_draft
  add column if not exists medicine_deep_dive jsonb,
  add column if not exists comparison_table jsonb,
  add column if not exists pharmacology_notes jsonb,
  add column if not exists image_pointer jsonb;

comment on column item_draft.medicine_deep_dive is
  'Structured mini-review (~250-400 words): pathophysiology, diagnostic_criteria, management_algorithm, monitoring_and_complications, high_yield_associations';
comment on column item_draft.comparison_table is
  'Confusion-set comparison: { confusion_set_id, condition_a, condition_b, rows[{feature, condition_a_value, condition_b_value}] }';
comment on column item_draft.pharmacology_notes is
  'Per-drug teaching array: [{ drug, appears_as, mechanism, major_side_effects[], critical_contraindications[], monitoring, key_interaction }]';
comment on column item_draft.image_pointer is
  'Reference image metadata for visual-diagnosis topics: { image_type, reference_id, license_tag, alt_text }';

create index if not exists idx_item_draft_has_comparison on item_draft ((comparison_table is not null));
create index if not exists idx_item_draft_has_pharm on item_draft ((pharmacology_notes is not null));
