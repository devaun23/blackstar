-- v26: Q-matrix coverage validator + multi-criterion rubric scoring.
--
-- Two additions driven by the measurement-science audit:
--
--   1) validator_type += 'coverage'      — deterministic check that each item
--      carries all 6 Q-matrix dimensions (or has a justified waiver on the
--      soft-warn dims). Gate the hard-required dims at publish time so the
--      learner engine never encounters an unroutable item.
--
--   2) agent_type += 'rubric_scorer'     — new agent that runs HealthBench-style
--      multi-criterion scoring on finished items. Produces 1-5 scaled scores
--      across 8 content/pedagogy dimensions. Lives in its own table because
--      validator_report is binary-oriented (pass/fail + issues), while rubric
--      scoring is multi-dimensional and needs structured per-dim storage.
--
--   3) item_rubric_score table           — one row per item per rubric version,
--      typed JSONB holding 8 sub-scores + rationales + overall.
--
-- Idempotent: ALTER TYPE uses ADD VALUE IF NOT EXISTS; table uses IF NOT EXISTS.

alter type public.validator_type add value if not exists 'coverage';
alter type public.agent_type add value if not exists 'rubric_scorer';

create table if not exists public.item_rubric_score (
  id uuid default gen_random_uuid() primary key,
  item_draft_id uuid references public.item_draft(id) on delete cascade not null,
  rubric_version text not null,                         -- e.g. "v1" — bump when criteria change
  overall_score numeric(4,2) not null,                  -- mean of sub-scores, 1.00-5.00
  sub_scores jsonb not null,                            -- { criterion_name: { score, rationale } }
  flagged boolean not null default false,               -- any sub-score <= 2
  scorer_model text not null,                           -- e.g. "claude-opus-4-7"
  scorer_tokens integer not null default 0,
  raw_output jsonb,                                     -- full model output for audit
  created_at timestamptz default now() not null
);

alter table public.item_rubric_score enable row level security;

create policy "Authenticated users can read item_rubric_score"
  on public.item_rubric_score for select
  to authenticated
  using (true);

-- One index per query pattern: per-item, per-rubric-version, per-flagged.
create index if not exists idx_item_rubric_score_item
  on public.item_rubric_score (item_draft_id);
create index if not exists idx_item_rubric_score_version
  on public.item_rubric_score (rubric_version);
create index if not exists idx_item_rubric_score_flagged
  on public.item_rubric_score (flagged)
  where flagged = true;

comment on table public.item_rubric_score is
  'HealthBench-style multi-criterion rubric scores. Layered on top of binary validators. Row per (item, rubric_version) — re-scoring bumps version and keeps history.';
comment on column public.item_rubric_score.sub_scores is
  '{ criterion_name: { score: 1-5, rationale: string } } for 8 criteria: medical_correctness, blueprint_fit, nbme_voice, distractor_plausibility, single_best_answer_integrity, hinge_clarity, explanation_transfer_value, option_symmetry.';
