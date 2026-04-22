-- v27: Adaptive-sequencing metadata on case_plan.
--
-- Master Rubric (§Required metadata and §Machine readable score object)
-- requires next_item_if_pass and next_item_if_fail so the rubric_score
-- metadata section can be populated without fallback guessing.
--
-- These two fields guide the selector when an attempt concludes: if the
-- learner passed, select an item matching next_item_if_pass (typically a
-- transfer or contrast case); if failed, next_item_if_fail (typically a
-- remediation or confusion-set sibling). Free-text for v1 — we can formalize
-- into a structured enum once we see patterns across ~50 case_plans.
--
-- Both nullable so existing case_plan rows remain valid. case_planner prompt
-- will be extended in a separate change to populate them on new items.

alter table public.case_plan
  add column if not exists next_item_if_pass text,
  add column if not exists next_item_if_fail text;

comment on column public.case_plan.next_item_if_pass is
  'Adaptive-sequencing hint: type of follow-up item when learner passes. Free-text, e.g. "transfer case with pregnancy constraints" or "spacing case in 3 days".';
comment on column public.case_plan.next_item_if_fail is
  'Adaptive-sequencing hint: type of follow-up item when learner fails. Free-text, e.g. "contrast case separating ACS from dissection" or "remediation of potassium management".';
