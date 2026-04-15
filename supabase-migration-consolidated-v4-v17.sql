-- =============================================
-- CONSOLIDATED MIGRATIONS: v4, v5, v10, v11, v13, v15, v16, v17
-- Safe to re-run (uses IF NOT EXISTS / DO $$ patterns)
-- Paste this entire block into Supabase Dashboard > SQL Editor
-- =============================================

-- ═══════════════════════════════════════════
-- v4: Content Outline Tables
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.content_system (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  display_name text not null,
  usmle_label text not null,
  weight_min numeric(4,2) not null,
  weight_max numeric(4,2) not null,
  sort_order integer not null,
  created_at timestamptz default now() not null
);
ALTER TABLE public.content_system ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read content_system"
    ON public.content_system FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.content_competency (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  display_name text not null,
  usmle_label text not null,
  weight_min numeric(4,2) not null,
  weight_max numeric(4,2) not null,
  maps_to_task_types text[] not null default '{}',
  sort_order integer not null,
  created_at timestamptz default now() not null
);
ALTER TABLE public.content_competency ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read content_competency"
    ON public.content_competency FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.content_discipline (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  display_name text not null,
  usmle_label text not null,
  weight_min numeric(4,2) not null,
  weight_max numeric(4,2) not null,
  maps_to_shelves text[] not null default '{}',
  sort_order integer not null,
  created_at timestamptz default now() not null
);
ALTER TABLE public.content_discipline ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read content_discipline"
    ON public.content_discipline FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.content_topic (
  id uuid default gen_random_uuid() primary key,
  content_system_id uuid references public.content_system(id) on delete cascade not null,
  topic_name text not null,
  category text,
  is_high_yield boolean not null default false,
  created_at timestamptz default now() not null,
  unique (content_system_id, topic_name)
);
ALTER TABLE public.content_topic ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read content_topic"
    ON public.content_topic FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.blueprint_node
  ADD COLUMN IF NOT EXISTS content_system_id uuid references public.content_system(id) on delete set null;

CREATE INDEX IF NOT EXISTS idx_content_topic_system ON public.content_topic (content_system_id);
CREATE INDEX IF NOT EXISTS idx_content_topic_name ON public.content_topic (topic_name);
CREATE INDEX IF NOT EXISTS idx_blueprint_node_content_system ON public.blueprint_node (content_system_id);

-- ═══════════════════════════════════════════
-- v5: Visual Specs column
-- ═══════════════════════════════════════════

ALTER TABLE public.item_draft ADD COLUMN IF NOT EXISTS visual_specs jsonb;

-- ═══════════════════════════════════════════
-- v10: Learner Model + Attempt v2
-- ═══════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.repair_action AS ENUM (
    'advance', 'reinforce', 'contrast', 'remediate', 'transfer_test'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dimension_type AS ENUM (
    'topic', 'transfer_rule', 'confusion_set', 'cognitive_error', 'action_class', 'hinge_clue_type'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS learner_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dimension_type public.dimension_type NOT NULL,
  dimension_id TEXT NOT NULL,
  dimension_label TEXT NOT NULL,
  mastery_level FLOAT NOT NULL DEFAULT 0.0 CHECK (mastery_level BETWEEN 0.0 AND 1.0),
  total_attempts INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  consecutive_correct INT NOT NULL DEFAULT 0,
  next_review_due TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  avg_time_ms INT,
  error_frequency JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, dimension_type, dimension_id)
);
ALTER TABLE learner_model ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own learner_model" ON learner_model FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own learner_model" ON learner_model FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own learner_model" ON learner_model FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS attempt_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_draft_id UUID REFERENCES item_draft(id) ON DELETE SET NULL,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A','B','C','D','E')),
  is_correct BOOLEAN NOT NULL,
  time_spent_ms INT,
  confidence_pre INT CHECK (confidence_pre BETWEEN 1 AND 5),
  diagnosed_cognitive_error_id UUID REFERENCES error_taxonomy(id) ON DELETE SET NULL,
  diagnosed_hinge_miss BOOLEAN NOT NULL DEFAULT false,
  diagnosed_action_class_confusion BOOLEAN NOT NULL DEFAULT false,
  repair_action public.repair_action,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (item_draft_id IS NOT NULL OR question_id IS NOT NULL)
);
ALTER TABLE attempt_v2 ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own attempt_v2" ON attempt_v2 FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own attempt_v2" ON attempt_v2 FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_learner_model_user ON learner_model(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_dimension ON learner_model(dimension_type, dimension_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_review ON learner_model(user_id, next_review_due);
CREATE INDEX IF NOT EXISTS idx_learner_model_mastery ON learner_model(user_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_user ON attempt_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_item ON attempt_v2(item_draft_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_question ON attempt_v2(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_session ON attempt_v2(session_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_error ON attempt_v2(diagnosed_cognitive_error_id);

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON learner_model
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════
-- v11: Learning Session Management
-- ═══════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.session_mode AS ENUM ('retention', 'training', 'assessment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('active', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.learning_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode session_mode NOT NULL,
  status session_status NOT NULL DEFAULT 'active',
  target_count INT NOT NULL DEFAULT 20,
  completed_count INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  target_dimension_type dimension_type,
  target_dimension_id TEXT,
  time_limit_seconds INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_session_user_status ON public.learning_session (user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_session_user_mode ON public.learning_session (user_id, mode);

ALTER TABLE public.learning_session ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own sessions" ON public.learning_session FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own sessions" ON public.learning_session FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own sessions" ON public.learning_session FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.attempt_v2 ADD COLUMN IF NOT EXISTS session_mode session_mode;
ALTER TABLE public.attempt_v2 ADD COLUMN IF NOT EXISTS confidence_post INT CHECK (confidence_post BETWEEN 1 AND 5);
ALTER TABLE public.attempt_v2 ADD COLUMN IF NOT EXISTS self_labeled_error TEXT;

-- ═══════════════════════════════════════════
-- v13: Decision Fork Constraint
-- ═══════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.decision_fork_type AS ENUM (
    'competing_diagnoses', 'management_tradeoff', 'contraindication', 'timing_decision', 'severity_ambiguity'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE case_plan
  ADD COLUMN IF NOT EXISTS decision_fork_type public.decision_fork_type NOT NULL DEFAULT 'management_tradeoff',
  ADD COLUMN IF NOT EXISTS decision_fork_description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS option_action_class TEXT NOT NULL DEFAULT 'management_steps';

ALTER TABLE question_skeleton
  ADD COLUMN IF NOT EXISTS option_action_class TEXT NOT NULL DEFAULT 'management_steps';

CREATE INDEX IF NOT EXISTS idx_case_plan_fork_type ON case_plan(decision_fork_type);

-- ═══════════════════════════════════════════
-- v15: Generalize evidence tables (source column)
-- ═══════════════════════════════════════════

ALTER TABLE public.di_episode
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'divine_intervention';
ALTER TABLE public.di_evidence_item
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'divine_intervention';

CREATE INDEX IF NOT EXISTS idx_di_evidence_source ON public.di_evidence_item(source);
CREATE INDEX IF NOT EXISTS idx_di_episode_source ON public.di_episode(source);
CREATE INDEX IF NOT EXISTS idx_di_evidence_source_topic
  ON public.di_evidence_item USING gin(topic_tags) WHERE source IS NOT NULL;

-- ═══════════════════════════════════════════
-- v16: Flatten source tiers (Scope + Content)
-- ═══════════════════════════════════════════

ALTER TYPE public.source_use ADD VALUE IF NOT EXISTS 'content';

UPDATE public.source_registry
SET allowed_use = 'content'
WHERE allowed_use IN ('truth', 'inspiration');

-- ═══════════════════════════════════════════
-- v17: USPSTF Screening Recommendations
-- ═══════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.uspstf_grade AS ENUM ('A', 'B', 'C', 'D', 'I');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.uspstf_screening (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  condition text NOT NULL,
  screening_test text NOT NULL,
  sex text,
  age_start integer,
  age_end integer,
  risk_group text,
  population_detail text,
  grade public.uspstf_grade NOT NULL,
  is_recommended boolean NOT NULL DEFAULT true,
  frequency_text text,
  frequency_months integer,
  special_notes text,
  topic_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uspstf_condition ON public.uspstf_screening(condition);
CREATE INDEX IF NOT EXISTS idx_uspstf_grade ON public.uspstf_screening(grade);
CREATE INDEX IF NOT EXISTS idx_uspstf_age_range ON public.uspstf_screening(age_start, age_end);
CREATE INDEX IF NOT EXISTS idx_uspstf_sex ON public.uspstf_screening(sex);
CREATE INDEX IF NOT EXISTS idx_uspstf_risk_group ON public.uspstf_screening(risk_group);
CREATE INDEX IF NOT EXISTS idx_uspstf_topic ON public.uspstf_screening USING gin(topic_tags);

CREATE OR REPLACE TRIGGER set_uspstf_updated_at
  BEFORE UPDATE ON public.uspstf_screening
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.uspstf_screening ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read uspstf_screening"
    ON public.uspstf_screening FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.source_registry (category, name, allowed_use, priority_rank, url, notes)
VALUES (
  'guideline', 'USPSTF Screening Recommendations', 'content', 22,
  'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics',
  'Preventive screening guidelines. Primary source for age/sex-specific cancer screening, metabolic screening, and risk-factor-based screening questions.'
) ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════
-- Done! All migrations v4-v17 applied.
-- ═══════════════════════════════════════════
