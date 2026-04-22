-- v24: 7-component adaptive explanation display
--
-- Adds the five persistent fields the display layer needs to show novice-vs-expert
-- adaptive depth for the same payload. v22 (medicine_deep_dive + comparison_table +
-- pharmacology_notes + image_pointer) and v23 (down_to_two_discrimination +
-- question_writer_intent + easy_recognition_check) already land most of the content;
-- v24 adds the top-of-stack anchor, the novice-only illness script, the expert-mode
-- compressed reasoning, the structured management protocol, and the
-- validation-then-correction traps.
--
-- All columns nullable; legacy rows keep rendering via the v5/v6 fallback path in
-- normalize-explanation.ts.

alter table item_draft
  add column if not exists anchor_rule text,
  add column if not exists illness_script text,
  add column if not exists reasoning_compressed text,
  add column if not exists management_protocol jsonb,
  add column if not exists traps jsonb;

comment on column item_draft.anchor_rule is
  'One-sentence rule, ≤15 words. Always shown. Example: "Potassium below 3.3 — no insulin, no exceptions."';
comment on column item_draft.illness_script is
  '10-second illness script, formula form. Example: "Young T1DM + missed insulin + acidosis + ketones = DKA." Shown when mastery<0.4 or self_label=didnt_know.';
comment on column item_draft.reasoning_compressed is
  'One-sentence compressed reasoning for expert mode. Replaces full why_correct when mastery>0.7.';
comment on column item_draft.management_protocol is
  'Array of {step_num, action, criterion}, 3-8 entries. Structured form of management_algorithm. Shown when mastery 0.3-0.7 or error involves sequencing.';
comment on column item_draft.traps is
  'Array of {trap_name, validation, correction, maps_to_option}, 2-5 entries. Validation-then-correction format. Shown when answer incorrect.';

create index if not exists idx_item_draft_has_traps on item_draft ((traps is not null));
create index if not exists idx_item_draft_has_protocol on item_draft ((management_protocol is not null));
