-- v28: Policy layer, experiment framework, event log, attribute mastery, simulator harness.
--
-- Five research tenets become first-class architectural concepts here:
--
--   1. Bandit action policy      — policy_decision is the causal ledger. Every
--                                   ActionPolicy/SelectionPolicy decision writes
--                                   one row with policyName + arm + context
--                                   snapshot. Phase B bandits read lift/regret
--                                   from this table.
--
--   2. Fine-grained cognitive    — attribute_mastery stores per-user per-attribute
--      diagnosis                    state. case_plan and question_skeleton gain
--                                   attribute_tags jsonb for agent-emitted tags.
--                                   Phase A: schema only, no writes.
--
--   3. Dialogue & rationale      — attempt_event captures fine-grained client
--      signals                      events (option_hover, section_expand, etc.)
--                                   without mutating attempt_v2. Rationale
--                                   classifier output lives on
--                                   attempt_v2.rationale_analysis.
--
--   4. Simulator-based policy    — simulator_run + simulated_response store
--      testing                      offline LLM-student evaluations of the
--                                   tutor. Phase A: fixture-student stub only.
--
--   5. Causal experiments        — experiment + experiment_assignment provide
--                                   sticky per-user arm assignment. Phase A
--                                   seeds one 'default' experiment with a
--                                   single 'control' arm; every user gets
--                                   assigned to it on first request.
--
-- Invariant: user-visible behavior is identical to pre-migration. Only new
-- tables/columns land here. Nothing is populated or enforced yet.
--
-- Idempotent: every create uses IF NOT EXISTS; every alter tolerates re-runs.

-- -----------------------------------------------------------------------------
-- 1. experiment framework (tenet 5)
-- -----------------------------------------------------------------------------

create table if not exists public.experiment (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  arms jsonb not null,                         -- e.g. ["control", "bandit"]
  is_active boolean default true not null,
  started_at timestamptz default now() not null,
  ended_at timestamptz
);

alter table public.experiment enable row level security;

create policy "Authenticated users can read experiment"
  on public.experiment for select
  to authenticated
  using (true);

create table if not exists public.experiment_assignment (
  user_id uuid not null,
  experiment_id uuid not null references public.experiment(id) on delete cascade,
  arm text not null,
  assigned_at timestamptz default now() not null,
  primary key (user_id, experiment_id)
);

alter table public.experiment_assignment enable row level security;

create policy "Users can read own experiment_assignment"
  on public.experiment_assignment for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists idx_experiment_assignment_arm
  on public.experiment_assignment (experiment_id, arm);

comment on table public.experiment is
  'Top-level experiment registry. Each row is one A/B (or multi-arm) test with a JSONB list of arm names. Phase A seeds a single "default" experiment with arms=["control"].';
comment on table public.experiment_assignment is
  'Sticky per-user arm assignment. Row created on first request; same arm returned forever (or until experiment ended_at is set).';

-- Phase A seed: default experiment, single control arm. Every user is placed
-- here on first call to getAssignment(). Phase B adds a second experiment
-- (bandit_vs_rules_repair) with arms=["control", "bandit"] at 95/5.
insert into public.experiment (name, description, arms, is_active)
values (
  'default',
  'Phase A default arm. Everyone is control. Exists so the policy layer always has an arm to tag decisions with.',
  '["control"]'::jsonb,
  true
)
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- 2. policy_decision — the causal ledger (tenet 1 + 5)
-- -----------------------------------------------------------------------------

create table if not exists public.policy_decision (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  attempt_id uuid references public.attempt_v2(id) on delete set null,
  decision_type text not null,                 -- 'action' | 'selection'
  policy_name text not null,                   -- e.g. 'rule_action_v1'
  experiment_id uuid references public.experiment(id) on delete set null,
  arm text not null default 'control',
  context_snapshot jsonb not null,             -- the input given to the policy
  choice jsonb not null,                       -- the decision returned
  created_at timestamptz default now() not null
);

alter table public.policy_decision enable row level security;

create policy "Users can read own policy_decision"
  on public.policy_decision for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists idx_policy_decision_user
  on public.policy_decision (user_id, created_at desc);
create index if not exists idx_policy_decision_attempt
  on public.policy_decision (attempt_id);
create index if not exists idx_policy_decision_arm
  on public.policy_decision (policy_name, arm, created_at desc);

comment on table public.policy_decision is
  'Causal ledger: one row per ActionPolicy or SelectionPolicy decision. Phase B bandits compute lift/regret from this table. context_snapshot is the PolicyContext at decision time; choice is the PolicyDecision returned.';

-- -----------------------------------------------------------------------------
-- 3. attempt_event — fine-grained client telemetry (tenet 3)
-- -----------------------------------------------------------------------------

create table if not exists public.attempt_event (
  id uuid default gen_random_uuid() primary key,
  attempt_id uuid not null references public.attempt_v2(id) on delete cascade,
  event_type text not null,
  ts timestamptz default now() not null,
  metadata jsonb
);

alter table public.attempt_event enable row level security;

create policy "Users can read own attempt_event"
  on public.attempt_event for select
  to authenticated
  using (
    attempt_id in (
      select id from public.attempt_v2 where user_id = auth.uid()
    )
  );

create index if not exists idx_attempt_event_attempt
  on public.attempt_event (attempt_id, event_type);
create index if not exists idx_attempt_event_ts
  on public.attempt_event (ts desc);

comment on table public.attempt_event is
  'Fine-grained client events associated with a study attempt: option_hover, option_select, section_expand, hint_request, etc. Phase A emits only attempt_submitted. Phase B adds the UI-level events. Feeds future dialogue-KT and section-view analyses.';

-- rationale_analysis — LLM-classified output from what_were_you_thinking.
-- Nullable and populated by a background cron in Phase B.
alter table public.attempt_v2
  add column if not exists rationale_analysis jsonb;

comment on column public.attempt_v2.rationale_analysis is
  'Structured tags extracted from what_were_you_thinking by the rationale-classifier agent (Phase B). Shape: { cognitive_error_hypotheses: [...], confidence_calibration: string, process_markers: [...] }.';

-- -----------------------------------------------------------------------------
-- 4. attribute_mastery — fine-grained cognitive diagnosis (tenet 2)
-- -----------------------------------------------------------------------------

create table if not exists public.attribute_mastery (
  user_id uuid not null,
  attribute_id text not null,                  -- app-level id, not a FK to a new table yet
  attribute_type text not null,                -- e.g. 'decision_rule_step', 'distractor_recognition'
  mastery_level double precision default 0 not null,
  attempts integer default 0 not null,
  correct integer default 0 not null,
  last_seen_at timestamptz,
  primary key (user_id, attribute_id)
);

alter table public.attribute_mastery enable row level security;

create policy "Users can read own attribute_mastery"
  on public.attribute_mastery for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists idx_attribute_mastery_type
  on public.attribute_mastery (user_id, attribute_type, mastery_level);

comment on table public.attribute_mastery is
  'Per-user per-attribute mastery sibling to learner_model. Phase A: schema only, zero writes. Phase B: case_planner emits attribute_tags, updateAfterAttempt writes here, selector biases within weakest dimension toward weakest attributes.';

-- attribute_tags on case_plan and question_skeleton. Nullable; agents emit
-- these in Phase B. Kept as jsonb for flexibility as the attribute taxonomy
-- evolves — we can normalize to a typed table later if needed.
alter table public.case_plan
  add column if not exists attribute_tags jsonb;

alter table public.question_skeleton
  add column if not exists attribute_tags jsonb;

comment on column public.case_plan.attribute_tags is
  'Agent-emitted attribute tags (Phase B). Shape: [{ id: string, type: string, description: string }]. Feeds attribute_mastery updates.';

-- -----------------------------------------------------------------------------
-- 5. simulator harness (tenet 4)
-- -----------------------------------------------------------------------------

create table if not exists public.simulator_run (
  id uuid default gen_random_uuid() primary key,
  persona_id text not null,
  policy_name text not null,
  n_items integer not null,
  metrics jsonb not null,                      -- { mastery_trajectory, contrast_success_rate, regret, ... }
  git_sha text,
  created_at timestamptz default now() not null
);

alter table public.simulator_run enable row level security;

create policy "Authenticated users can read simulator_run"
  on public.simulator_run for select
  to authenticated
  using (true);

create index if not exists idx_simulator_run_persona_policy
  on public.simulator_run (persona_id, policy_name, created_at desc);

create table if not exists public.simulated_response (
  id uuid default gen_random_uuid() primary key,
  simulator_run_id uuid not null references public.simulator_run(id) on delete cascade,
  persona_id text not null,
  policy_name text not null,
  item_draft_id uuid references public.item_draft(id) on delete set null,
  selected_answer text not null,
  is_correct boolean not null,
  simulated_time_ms integer,
  simulated_confidence integer,
  created_at timestamptz default now() not null
);

alter table public.simulated_response enable row level security;

create policy "Authenticated users can read simulated_response"
  on public.simulated_response for select
  to authenticated
  using (true);

create index if not exists idx_simulated_response_run
  on public.simulated_response (simulator_run_id);

comment on table public.simulator_run is
  'One row per offline simulator invocation. metrics jsonb holds the computed summary (mastery trajectory, contrast success rate, policy regret). CI regression gates read from here.';
comment on table public.simulated_response is
  'Per-item response from a simulated student. Phase A: FixtureStudent produces these deterministically. Phase B: SimulatedStudentAgent (Claude, persona-traited) replaces FixtureStudent.';
