-- ============================================
-- Blackstar: Full Schema Migration
-- Paste this ENTIRE file into Supabase SQL Editor and run
-- URL: https://supabase.com/dashboard/project/kyoucwvolfokrzzrrfxm/sql/new
-- ============================================

-- STEP 1: DROP EVERYTHING
DROP TRIGGER IF EXISTS on_item_published ON public.item_draft;
DROP TRIGGER IF EXISTS set_updated_at ON public.item_performance;
DROP TRIGGER IF EXISTS set_updated_at ON public.item_draft;
DROP TRIGGER IF EXISTS set_updated_at ON public.blueprint_node;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.user_responses CASCADE;
DROP TABLE IF EXISTS public.item_performance CASCADE;
DROP TABLE IF EXISTS public.validator_report CASCADE;
DROP TABLE IF EXISTS public.item_draft CASCADE;
DROP TABLE IF EXISTS public.item_plan CASCADE;
DROP TABLE IF EXISTS public.fact_row CASCADE;
DROP TABLE IF EXISTS public.algorithm_card CASCADE;
DROP TABLE IF EXISTS public.pipeline_run CASCADE;
DROP TABLE IF EXISTS public.agent_prompt CASCADE;
DROP TABLE IF EXISTS public.error_taxonomy CASCADE;
DROP TABLE IF EXISTS public.source_registry CASCADE;
DROP TABLE IF EXISTS public.blueprint_node CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_item_published() CASCADE;

DROP TYPE IF EXISTS public.shelf CASCADE;
DROP TYPE IF EXISTS public.task_type CASCADE;
DROP TYPE IF EXISTS public.clinical_setting CASCADE;
DROP TYPE IF EXISTS public.age_group CASCADE;
DROP TYPE IF EXISTS public.time_horizon CASCADE;
DROP TYPE IF EXISTS public.yield_tier CASCADE;
DROP TYPE IF EXISTS public.fact_type CASCADE;
DROP TYPE IF EXISTS public.confidence_level CASCADE;
DROP TYPE IF EXISTS public.item_status CASCADE;
DROP TYPE IF EXISTS public.validator_type CASCADE;
DROP TYPE IF EXISTS public.agent_type CASCADE;
DROP TYPE IF EXISTS public.pipeline_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.source_use CASCADE;

-- STEP 2: CREATE SCHEMA (from supabase-schema.sql)

-- ENUMS
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
  'medical', 'blueprint', 'nbme_quality', 'option_symmetry', 'explanation_quality'
);

create type public.agent_type as enum (
  'blueprint_selector', 'algorithm_extractor', 'item_planner', 'vignette_writer',
  'medical_validator', 'nbme_quality_validator', 'blueprint_validator',
  'option_symmetry_validator', 'explanation_validator', 'repair_agent', 'explanation_writer'
);

create type public.pipeline_status as enum (
  'running', 'completed', 'failed', 'killed'
);

create type public.user_role as enum (
  'student', 'admin'
);

create type public.source_use as enum (
  'scope', 'truth', 'inspiration'
);

-- 1. Profiles
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

-- 2. Blueprint Node
create table public.blueprint_node (
  id uuid default gen_random_uuid() primary key,
  shelf public.shelf not null,
  system text not null,
  topic text not null,
  subtopic text,
  task_type public.task_type not null,
  clinical_setting public.clinical_setting not null default 'inpatient',
  age_group public.age_group not null default 'middle_aged',
  time_horizon public.time_horizon not null default 'immediate',
  yield_tier public.yield_tier not null default 'tier_1',
  frequency_score numeric(5,2),
  discrimination_score numeric(5,2),
  published_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (shelf, topic, subtopic, task_type, clinical_setting, age_group)
);

alter table public.blueprint_node enable row level security;

create policy "Authenticated users can read blueprint_node"
  on public.blueprint_node for select
  to authenticated
  using (true);

-- 3. Algorithm Card
create table public.algorithm_card (
  id uuid default gen_random_uuid() primary key,
  blueprint_node_id uuid references public.blueprint_node(id) on delete cascade not null,
  entry_presentation text not null,
  competing_paths text[] not null default '{}',
  hinge_feature text not null,
  correct_action text not null,
  contraindications text[] not null default '{}',
  source_citations text[] not null default '{}',
  time_horizon text,
  severity_markers text[] default '{}',
  created_at timestamptz default now() not null
);

alter table public.algorithm_card enable row level security;

create policy "Authenticated users can read algorithm_card"
  on public.algorithm_card for select
  to authenticated
  using (true);

-- 4. Fact Row
create table public.fact_row (
  id uuid default gen_random_uuid() primary key,
  algorithm_card_id uuid references public.algorithm_card(id) on delete cascade not null,
  fact_type public.fact_type not null,
  fact_text text not null,
  threshold_value text,
  source_name text not null,
  source_tier text not null check (source_tier in ('A', 'B', 'C')),
  confidence public.confidence_level not null default 'high',
  created_at timestamptz default now() not null
);

alter table public.fact_row enable row level security;

create policy "Authenticated users can read fact_row"
  on public.fact_row for select
  to authenticated
  using (true);

-- 5. Item Plan
create table public.item_plan (
  id uuid default gen_random_uuid() primary key,
  algorithm_card_id uuid references public.algorithm_card(id) on delete cascade not null,
  blueprint_node_id uuid references public.blueprint_node(id) on delete cascade not null,
  target_hinge text not null,
  competing_options text[] not null default '{}',
  target_cognitive_error text not null,
  noise_elements text[] not null default '{}',
  option_class text not null,
  distractor_rationale text not null,
  created_at timestamptz default now() not null
);

alter table public.item_plan enable row level security;

create policy "Authenticated users can read item_plan"
  on public.item_plan for select
  to authenticated
  using (true);

-- 6. Item Draft
create table public.item_draft (
  id uuid default gen_random_uuid() primary key,
  item_plan_id uuid references public.item_plan(id) on delete cascade not null,
  blueprint_node_id uuid references public.blueprint_node(id) on delete cascade not null,
  pipeline_run_id uuid,
  status public.item_status not null default 'draft',
  version integer not null default 1,
  vignette text not null,
  stem text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  choice_e text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D', 'E')),
  why_correct text not null,
  why_wrong_a text,
  why_wrong_b text,
  why_wrong_c text,
  why_wrong_d text,
  why_wrong_e text,
  high_yield_pearl text,
  reasoning_pathway text,
  decision_hinge text,
  competing_differential text,
  repair_count integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.item_draft enable row level security;

create policy "Students can read published item_draft"
  on public.item_draft for select
  to authenticated
  using (status = 'published');

-- 7. Validator Report
create table public.validator_report (
  id uuid default gen_random_uuid() primary key,
  item_draft_id uuid references public.item_draft(id) on delete cascade not null,
  validator_type public.validator_type not null,
  passed boolean not null,
  score numeric(4,2),
  issues_found text[] not null default '{}',
  repair_instructions text,
  raw_output jsonb,
  created_at timestamptz default now() not null
);

alter table public.validator_report enable row level security;

create policy "Authenticated users can read validator_report"
  on public.validator_report for select
  to authenticated
  using (true);

-- 8. Error Taxonomy
create table public.error_taxonomy (
  id uuid default gen_random_uuid() primary key,
  error_name text not null unique,
  definition text not null,
  explanation_template text not null,
  example_scenario text,
  created_at timestamptz default now() not null
);

alter table public.error_taxonomy enable row level security;

create policy "Authenticated users can read error_taxonomy"
  on public.error_taxonomy for select
  to authenticated
  using (true);

-- 9. Source Registry
create table public.source_registry (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  name text not null unique,
  allowed_use public.source_use not null,
  priority_rank integer not null default 100,
  url text,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.source_registry enable row level security;

create policy "Authenticated users can read source_registry"
  on public.source_registry for select
  to authenticated
  using (true);

-- 10. Item Performance
create table public.item_performance (
  id uuid default gen_random_uuid() primary key,
  item_draft_id uuid references public.item_draft(id) on delete cascade not null unique,
  total_attempts integer not null default 0,
  correct_count integer not null default 0,
  accuracy_rate numeric(5,4),
  avg_time_seconds numeric(7,2),
  distractor_distribution jsonb,
  discrimination_index numeric(5,4),
  flagged_for_review boolean not null default false,
  retired boolean not null default false,
  updated_at timestamptz default now() not null
);

alter table public.item_performance enable row level security;

create policy "Authenticated users can read item_performance"
  on public.item_performance for select
  to authenticated
  using (true);

-- 11. Pipeline Run
create table public.pipeline_run (
  id uuid default gen_random_uuid() primary key,
  blueprint_node_id uuid references public.blueprint_node(id) on delete set null,
  status public.pipeline_status not null default 'running',
  current_agent public.agent_type,
  agent_log jsonb not null default '[]'::jsonb,
  total_tokens_used integer not null default 0,
  error_message text,
  started_at timestamptz default now() not null,
  completed_at timestamptz
);

alter table public.pipeline_run enable row level security;

create policy "Authenticated users can read pipeline_run"
  on public.pipeline_run for select
  to authenticated
  using (true);

-- FK from item_draft to pipeline_run
alter table public.item_draft
  add constraint item_draft_pipeline_run_fk
  foreign key (pipeline_run_id) references public.pipeline_run(id) on delete set null;

-- 12. Agent Prompt
create table public.agent_prompt (
  id uuid default gen_random_uuid() primary key,
  agent_type public.agent_type not null,
  version integer not null default 1,
  is_active boolean not null default true,
  system_prompt text not null,
  user_prompt_template text not null,
  notes text,
  created_at timestamptz default now() not null,
  unique (agent_type, version)
);

alter table public.agent_prompt enable row level security;

create policy "Authenticated users can read agent_prompt"
  on public.agent_prompt for select
  to authenticated
  using (true);

create unique index idx_agent_prompt_active
  on public.agent_prompt (agent_type)
  where (is_active = true);

-- 13. User Responses
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

-- INDEXES
create index idx_blueprint_node_coverage
  on public.blueprint_node (shelf, yield_tier, published_count);

create index idx_item_draft_status
  on public.item_draft (status);

create index idx_item_draft_blueprint
  on public.item_draft (blueprint_node_id);

create index idx_fact_row_card
  on public.fact_row (algorithm_card_id);

create index idx_pipeline_run_status
  on public.pipeline_run (status);

create index idx_user_responses_user
  on public.user_responses (user_id);

-- TRIGGERS
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
  before update on public.item_draft
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.item_performance
  for each row execute function public.handle_updated_at();

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
