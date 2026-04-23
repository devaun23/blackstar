-- v27: item_draft.source_packs_used
--
-- Persists the list of source_pack_ids consulted during generation for this
-- item. This is historical truth — topicSourceMap is updated over time, so a
-- runtime lookup N months after generation may yield a different pack set than
-- what actually informed the item.
--
-- Why log it: enables later correlation of learner outcomes with source
-- provenance. Once response data exists, you can ask questions like "do items
-- grounded in pack X have different discrimination than items from pack Y?"
-- or "is a specific pack producing items that learners find unfair?" — neither
-- is answerable if source provenance isn't persisted.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS.

alter table public.item_draft
  add column if not exists source_packs_used text[] not null default '{}';

comment on column public.item_draft.source_packs_used is
  'Array of source_pack_ids consulted during generation (primary + secondaries). Populated at draft-link time in pipeline-v2. Historical record — do not backfill from current topicSourceMap.';

-- GIN index for containment queries like "which items used pack X?"
create index if not exists idx_item_draft_source_packs_used
  on public.item_draft using gin (source_packs_used);
