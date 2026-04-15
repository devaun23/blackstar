-- Blackstar: NBME Question Factory Schema
-- Run this in the Supabase SQL Editor
-- This REPLACES the previous simple schema

-- ============================================
-- ENUMS
-- ============================================

create type public.shelf as enum (
  'medicine', 'surgery', 'pediatrics', 'obgyn', 'psychiatry', 'family_medicine', 'neurology', 'emergency_medicine'
);

create type public.task_type as enum (
  'next_step', 'diagnostic_test', 'diagnosis', 'stabilization', 'risk_identification', 'complication_recognition'
);

create type public.clinical_setting as enum (
  'outpatient', 'inpatient', 'ed', 'icu'
);

create type public.age_group as enum (
  'neonate', 'infant', 'child', 'adolescent', 'young_adult', 'middle_aged', 'elderly'
);

create type public.time_horizon as enum (
  'immediate', 'hours', 'days', 'weeks', 'chronic'
);

create type public.yield_tier as enum (
  'tier_1', 'tier_2', 'tier_3'
);

create type public.fact_type as enum (
  'threshold', 'drug_choice', 'contraindication', 'diagnostic_criterion', 'risk_factor', 'complication', 'management_step'
);

create type public.confidence_level as enum (
  'high', 'moderate', 'low'
);

create type public.item_status as enum (
  'draft', 'validating', 'passed', 'failed', 'repaired', 'published', 'killed'
);

create type public.validator_type as enum (
  'medical', 'blueprint', 'nbme_quality', 'option_symmetry', 'explanation_quality', 'exam_translation'
);

create type public.agent_type as enum (
  'blueprint_selector', 'algorithm_extractor', 'item_planner', 'vignette_writer',
  'medical_validator', 'nbme_quality_validator', 'blueprint_validator',
  'option_symmetry_validator', 'explanation_validator', 'exam_translation_validator',
  'repair_agent', 'explanation_writer'
);

create type public.pipeline_status as enum (
  'running', 'completed', 'failed', 'killed'
);

create type public.user_role as enum (
  'student', 'admin'
);

create type public.card_status as enum (
  'draft', 'truth_verified', 'translation_verified', 'generation_ready', 'retired'
);

create type public.source_use as enum (
  'scope', 'content'
);

-- ============================================
-- 1. Profiles — extends Supabase auth.users
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role public.user_role not null default 'student',
  target_score integer,
  study_goals text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. Blueprint Node — what's testable (scope)
-- ============================================
create table public.blueprint_node (
  id uuid default gen_random_uuid() primary key,
  shelf public.shelf not null,
  system text not null,                -- e.g. "Cardiovascular", "Pulmonary"
  topic text not null,                 -- e.g. "Acute Coronary Syndrome", "Pulmonary Embolism"
  subtopic text,                       -- e.g. "STEMI vs NSTEMI management"
  task_type public.task_type not null,
  clinical_setting public.clinical_setting not null default 'inpatient',
  age_group public.age_group not null default 'middle_aged',
  time_horizon public.time_horizon not null default 'immediate',
  yield_tier public.yield_tier not null default 'tier_1',
  frequency_score numeric(5,2),        -- How often this topic appears on exams (0-100)
  discrimination_score numeric(5,2),   -- How well this topic discriminates high/low performers (0-1)
  published_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Prevent duplicate scope entries (subtopic included for finer granularity)
  unique (shelf, topic, subtopic, task_type, clinical_setting, age_group)
);

alter table public.blueprint_node enable row level security;

-- Authenticated users can read blueprints
create policy "Authenticated users can read blueprint_node"
  on public.blueprint_node for select
  to authenticated
  using (true);

-- Service role handles writes (no user-facing insert/update)

-- ============================================
-- 3. Algorithm Card — decision forks
-- ============================================
create table public.algorithm_card (
  id uuid default gen_random_uuid() primary key,
  blueprint_node_id uuid references public.blueprint_node(id) on delete cascade not null,
  status public.card_status not null default 'draft',
  entry_presentation text not null,          -- "Patient presents with..."
  competing_paths text[] not null default '{}', -- Array of differential paths
  hinge_feature text not null,               -- The distinguishing finding
  correct_action text not null,              -- What to do
  contraindications text[] not null default '{}',
  source_citations text[] not null default '{}', -- Tier B sources used
  time_horizon text,                         -- e.g. "immediate", "hours" — clinical urgency context
  severity_markers text[] default '{}',      -- e.g. ["tachycardia", "hypotension", "altered mental status"]
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.algorithm_card enable row level security;

create policy "Authenticated users can read algorithm_card"
  on public.algorithm_card for select
  to authenticated
  using (true);

-- ============================================
-- 4. Fact Row — verified clinical micro-facts
-- ============================================
create table public.fact_row (
  id uuid default gen_random_uuid() primary key,
  algorithm_card_id uuid references public.algorithm_card(id) on delete cascade not null,
  fact_type public.fact_type not null,
  fact_text text not null,                    -- The fact itself
  threshold_value text,                       -- e.g. "WBC > 250 cells/mm³"
  source_name text not null,                  -- e.g. "AASLD 2023 Guidelines"
  source_tier text not null check (source_tier in ('A', 'B', 'C')),
  confidence public.confidence_level not null default 'high',
  created_at timestamptz default now() not null
);

alter table public.fact_row enable row level security;

create policy "Authenticated users can read fact_row"
  on public.fact_row for select
  to authenticated
  using (true);

-- ============================================
-- 5. Item Plan — question architecture
-- ============================================
create table public.item_plan (
  id uuid default gen_random_uuid() primary key,
  algorithm_card_id uuid references public.algorithm_card(id) on delete cascade not null,
  blueprint_node_id uuid references public.blueprint_node(id) on delete cascade not null,
  target_hinge text not null,                 -- What distinguishes the correct answer
  competing_options text[] not null default '{}',
  target_cognitive_error text not null,       -- e.g. "anchoring", "premature_closure"
  noise_elements text[] not null default '{}', -- Distracting but irrelevant details
  option_class text not null,                 -- e.g. "medications", "diagnostic tests", "diagnoses"
  distractor_rationale text not null,         -- Why each wrong answer is tempting
  created_at timestamptz default now() not null
);

alter table public.item_plan enable row level security;

create policy "Authenticated users can read item_plan"
  on public.item_plan for select
  to authenticated
  using (true);

-- ============================================
-- 6. Item Draft — the full question
-- ============================================
create table public.item_draft (
  id uuid default gen_random_uuid() primary key,
  item_plan_id uuid references public.item_plan(id) on delete cascade not null,
  blueprint_node_id uuid references public.blueprint_node(id) on delete cascade not null,
  pipeline_run_id uuid,                       -- FK added after pipeline_run table created
  status public.item_status not null default 'draft',
  version integer not null default 1,

  -- Question content
  vignette text not null,
  stem text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  choice_e text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D', 'E')),

  -- Explanations
  why_correct text not null,
  why_wrong_a text,                           -- null if A is correct
  why_wrong_b text,
  why_wrong_c text,
  why_wrong_d text,
  why_wrong_e text,

  -- Metadata
  high_yield_pearl text,
  reasoning_pathway text,
  decision_hinge text,
  competing_differential text,

  repair_count integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.item_draft enable row level security;

-- Students can only see published items
create policy "Students can read published item_draft"
  on public.item_draft for select
  to authenticated
  using (status = 'published');

-- ============================================
-- 7. Validator Report — independent validation
-- ============================================
create table public.validator_report (
  id uuid default gen_random_uuid() primary key,
  item_draft_id uuid references public.item_draft(id) on delete cascade not null,
  validator_type public.validator_type not null,
  passed boolean not null,
  score numeric(4,2),                         -- 0.00 - 10.00
  issues_found text[] not null default '{}',
  repair_instructions text,
  raw_output jsonb,                           -- Full validator response for debugging
  created_at timestamptz default now() not null
);

alter table public.validator_report enable row level security;

-- No SELECT policy: service role only (system internal — contains QA feedback)

-- ============================================
-- 8. Error Taxonomy — cognitive error catalog
-- ============================================
create table public.error_taxonomy (
  id uuid default gen_random_uuid() primary key,
  error_name text not null unique,            -- e.g. "anchoring"
  definition text not null,
  explanation_template text not null,          -- Template for explaining why this error matters
  example_scenario text,
  created_at timestamptz default now() not null
);

alter table public.error_taxonomy enable row level security;

create policy "Authenticated users can read error_taxonomy"
  on public.error_taxonomy for select
  to authenticated
  using (true);

-- ============================================
-- 9. Source Registry — allowed sources
-- ============================================
create table public.source_registry (
  id uuid default gen_random_uuid() primary key,
  category text not null,                     -- e.g. "guideline", "outline", "qbank"
  name text not null unique,                  -- e.g. "AASLD 2023 HE Guidelines"
  allowed_use public.source_use not null,
  priority_rank integer not null default 100,  -- Lower = higher priority
  url text,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.source_registry enable row level security;

create policy "Authenticated users can read source_registry"
  on public.source_registry for select
  to authenticated
  using (true);

-- ============================================
-- 10. Item Performance — calibration data
-- ============================================
create table public.item_performance (
  id uuid default gen_random_uuid() primary key,
  item_draft_id uuid references public.item_draft(id) on delete cascade not null unique,
  total_attempts integer not null default 0,
  correct_count integer not null default 0,
  accuracy_rate numeric(5,4),                 -- 0.0000 - 1.0000
  avg_time_seconds numeric(7,2),
  distractor_distribution jsonb,              -- {"A": 0.12, "B": 0.25, ...}
  discrimination_index numeric(5,4),          -- Point-biserial correlation
  flagged_for_review boolean not null default false,
  retired boolean not null default false,
  updated_at timestamptz default now() not null
);

alter table public.item_performance enable row level security;

create policy "Authenticated users can read item_performance"
  on public.item_performance for select
  to authenticated
  using (true);

-- ============================================
-- 11. Pipeline Run — orchestration tracking
-- ============================================
create table public.pipeline_run (
  id uuid default gen_random_uuid() primary key,
  blueprint_node_id uuid references public.blueprint_node(id) on delete set null,
  status public.pipeline_status not null default 'running',
  current_agent public.agent_type,
  agent_log jsonb not null default '[]'::jsonb,  -- Array of {agent, started_at, completed_at, tokens_used, status, error}
  total_tokens_used integer not null default 0,
  error_message text,
  started_at timestamptz default now() not null,
  completed_at timestamptz
);

alter table public.pipeline_run enable row level security;

-- No SELECT policy: service role only (system internal — execution logs)

-- Now add the FK from item_draft to pipeline_run
alter table public.item_draft
  add constraint item_draft_pipeline_run_fk
  foreign key (pipeline_run_id) references public.pipeline_run(id) on delete set null;

-- ============================================
-- 12. Agent Prompt — versioned, hot-swappable
-- ============================================
create table public.agent_prompt (
  id uuid default gen_random_uuid() primary key,
  agent_type public.agent_type not null,
  version integer not null default 1,
  is_active boolean not null default true,
  system_prompt text not null,
  user_prompt_template text not null,          -- Contains {{variable}} placeholders
  notes text,
  created_at timestamptz default now() not null,

  -- Only one active prompt per agent type
  unique (agent_type, version)
);

alter table public.agent_prompt enable row level security;

-- No SELECT policy: service role only (system internal — AI system prompts)

-- Ensure only one active prompt per agent type
create unique index idx_agent_prompt_active
  on public.agent_prompt (agent_type)
  where (is_active = true);

-- ============================================
-- 13. User Responses — tracks every answer
-- ============================================
create table public.user_responses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_draft_id uuid references public.item_draft(id) on delete cascade not null,
  selected_answer text not null check (selected_answer in ('A', 'B', 'C', 'D', 'E')),
  is_correct boolean not null,
  time_spent_seconds integer,
  created_at timestamptz default now() not null
);

alter table public.user_responses enable row level security;

create policy "Users can view own responses"
  on public.user_responses for select
  using (auth.uid() = user_id);

create policy "Users can insert own responses"
  on public.user_responses for insert
  with check (auth.uid() = user_id);

-- ============================================
-- INDEXES for common queries
-- ============================================

-- Blueprint: find under-served nodes
create index idx_blueprint_node_coverage
  on public.blueprint_node (shelf, yield_tier, published_count);

-- Item drafts by status
create index idx_item_draft_status
  on public.item_draft (status);

-- Item drafts by blueprint
create index idx_item_draft_blueprint
  on public.item_draft (blueprint_node_id);

-- Fact rows by card
create index idx_fact_row_card
  on public.fact_row (algorithm_card_id);

-- Algorithm cards by status (for item generation queries)
create index idx_algorithm_card_status
  on public.algorithm_card (status);

-- Pipeline runs by status
create index idx_pipeline_run_status
  on public.pipeline_run (status);

-- User responses by user
create index idx_user_responses_user
  on public.user_responses (user_id);

-- Foreign key indexes (v18)
create index if not exists idx_algorithm_card_blueprint
  on public.algorithm_card(blueprint_node_id);
create index if not exists idx_item_plan_algorithm_card
  on public.item_plan(algorithm_card_id);
create index if not exists idx_item_plan_blueprint
  on public.item_plan(blueprint_node_id);
create index if not exists idx_item_draft_item_plan
  on public.item_draft(item_plan_id);
create index if not exists idx_item_draft_pipeline_run
  on public.item_draft(pipeline_run_id);
create index if not exists idx_validator_report_draft
  on public.validator_report(item_draft_id);
create index if not exists idx_user_responses_draft
  on public.user_responses(item_draft_id);

-- ============================================
-- TRIGGERS: auto-update updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.blueprint_node
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.algorithm_card
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.item_draft
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.item_performance
  for each row execute function public.handle_updated_at();

-- ============================================
-- TRIGGER: increment blueprint published_count
-- ============================================
create or replace function public.handle_item_published()
returns trigger as $$
begin
  if new.status = 'published' and (old.status is null or old.status != 'published') then
    update public.blueprint_node
    set published_count = published_count + 1,
        last_used_at = now()
    where id = new.blueprint_node_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_item_published
  after insert or update on public.item_draft
  for each row execute function public.handle_item_published();

-- ============================================
-- DIVINE INTERVENTION EVIDENCE LAYER (v14)
-- ============================================

create table if not exists public.di_episode (
  id uuid primary key default gen_random_uuid(),
  episode_number integer not null,
  title text not null,
  shelf text,
  topic_tags text[] not null default '{}',
  source_file text not null,
  total_items integer not null default 0,
  source text not null default 'divine_intervention',
  ingested_at timestamptz not null default now(),
  unique (source, episode_number)
);

create table if not exists public.di_evidence_item (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.di_episode(id) on delete cascade,
  item_type text not null,
  section_heading text not null,
  claim text not null,
  raw_text text not null,
  trigger_presentation text,
  association text,
  differential jsonb,
  mnemonic_text text,
  topic_tags text[] not null default '{}',
  shelf text,
  display_id text not null unique,
  source text not null default 'divine_intervention',
  created_at timestamptz not null default now()
);

create index if not exists idx_di_evidence_topic on public.di_evidence_item using gin(topic_tags);
create index if not exists idx_di_evidence_type on public.di_evidence_item(item_type);
create index if not exists idx_di_evidence_episode on public.di_evidence_item(episode_id);
create index if not exists idx_di_episode_shelf on public.di_episode(shelf);
create index if not exists idx_di_evidence_source on public.di_evidence_item(source);
create index if not exists idx_di_episode_source on public.di_episode(source);

alter table public.di_episode enable row level security;
create policy "Authenticated users can read di_episode"
  on public.di_episode for select
  to authenticated
  using (true);

alter table public.di_evidence_item enable row level security;
create policy "Authenticated users can read di_evidence_item"
  on public.di_evidence_item for select
  to authenticated
  using (true);

-- ============================================
-- USPSTF SCREENING RECOMMENDATIONS (v17)
-- ============================================

create type public.uspstf_grade as enum ('A', 'B', 'C', 'D', 'I');

create table if not exists public.uspstf_screening (
  id uuid primary key default gen_random_uuid(),
  display_id text not null unique,
  condition text not null,
  screening_test text not null,
  sex text,
  age_start integer,
  age_end integer,
  risk_group text,
  population_detail text,
  grade public.uspstf_grade not null,
  is_recommended boolean not null default true,
  frequency_text text,
  frequency_months integer,
  special_notes text,
  topic_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_uspstf_condition on public.uspstf_screening(condition);
create index if not exists idx_uspstf_grade on public.uspstf_screening(grade);
create index if not exists idx_uspstf_age_range on public.uspstf_screening(age_start, age_end);
create index if not exists idx_uspstf_sex on public.uspstf_screening(sex);
create index if not exists idx_uspstf_risk_group on public.uspstf_screening(risk_group);
create index if not exists idx_uspstf_topic on public.uspstf_screening using gin(topic_tags);

create trigger set_uspstf_updated_at
  before update on public.uspstf_screening
  for each row execute function public.handle_updated_at();

alter table public.uspstf_screening enable row level security;

create policy "Authenticated users can read uspstf_screening"
  on public.uspstf_screening for select
  to authenticated
  using (true);
