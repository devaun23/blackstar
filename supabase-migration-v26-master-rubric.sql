-- v26: Blackstar Master Rubric — canonical scoring artifact + publish_decision routing.
--
-- The Master Rubric (see BLACKSTAR_MASTER_RUBRIC.md at repo root) is the
-- canonical scoring contract for Blackstar items. This migration adds:
--
--   publish_decision  enum ('publish' | 'revise' | 'major_revision' | 'reject')
--   rubric_score      table — one row per (item_draft, rubric_version)
--   agent_type       += 'rubric_evaluator' (so the agent prompt can be seeded)
--   validator_type   += 'master_rubric'     (so validator_report can reference
--                                            the master rubric when deterministic
--                                            hard-gate checks fail, separate from
--                                            the LLM-graded rubric_score row)
--
-- One-to-many on item_draft so we can re-score items under future rubric
-- revisions without destroying history. `rubric_version` is the discriminator.
--
-- The rubric_score row stores the full JSON output object (matches
-- blackstar_master_rubric_template.json) in `score_object` so the UI + selectors
-- can consume it directly without joining a grid of columns. Scalar copies of
-- total_score, publish_decision, and hard_gate_pass are hoisted for indexing.
--
-- All additions are additive and safe. `if not exists` everywhere.

-- ─── Enum extensions ───────────────────────────────────────────────────────

do $$ begin
  create type public.publish_decision as enum ('publish', 'revise', 'major_revision', 'reject');
exception when duplicate_object then null; end $$;

alter type public.agent_type add value if not exists 'rubric_evaluator';
alter type public.validator_type add value if not exists 'master_rubric';

-- ─── rubric_score table ───────────────────────────────────────────────────

create table if not exists public.rubric_score (
  id               uuid primary key default gen_random_uuid(),
  item_draft_id    uuid not null references public.item_draft(id) on delete cascade,
  rubric_version   text not null default 'master_v1',

  -- Hoisted scalars for indexing / routing.
  hard_gate_pass   boolean not null,
  total_score      integer not null check (total_score >= 0 and total_score <= 100),
  publish_decision publish_decision not null,

  -- Full machine-readable JSON object; matches master_rubric.ts schema.
  score_object     jsonb not null,

  -- Grader provenance. Claude model id + agent prompt version used.
  grader_model     text,
  agent_prompt_version integer,

  created_at       timestamptz not null default now(),

  unique (item_draft_id, rubric_version)
);

comment on table public.rubric_score is
  'Blackstar Master Rubric scores — one row per (item_draft, rubric_version). See BLACKSTAR_MASTER_RUBRIC.md.';
comment on column public.rubric_score.score_object is
  'Full JSON output matching masterRubricScoreSchema (Zod). Canonical form of the scoring result.';
comment on column public.rubric_score.publish_decision is
  'Derived from deriveMasterRubricDecision() — source of truth for item_draft.status routing.';

-- Selector + review-queue indexes.
create index if not exists idx_rubric_score_item_draft     on public.rubric_score (item_draft_id);
create index if not exists idx_rubric_score_publish        on public.rubric_score (publish_decision);
create index if not exists idx_rubric_score_hard_gate_fail on public.rubric_score (item_draft_id) where hard_gate_pass = false;
create index if not exists idx_rubric_score_total          on public.rubric_score (total_score desc);

-- ─── RLS ───────────────────────────────────────────────────────────────────
-- Rubric scores are factory internals, not user-facing. Mirror the
-- validator_report posture: service-role only for writes, no anon reads.

alter table public.rubric_score enable row level security;

drop policy if exists "rubric_score service role all" on public.rubric_score;
create policy "rubric_score service role all"
  on public.rubric_score
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
