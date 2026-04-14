-- Migration v10: Learner Model + Attempt v2
-- Per-user, per-dimension mastery tracking with diagnostic attempt data
-- Run in Supabase SQL Editor AFTER v9 migration

-- ============================================
-- Create repair_action type
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.repair_action AS ENUM (
    'advance', 'reinforce', 'contrast', 'remediate', 'transfer_test'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Create dimension_type type
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.dimension_type AS ENUM (
    'topic', 'transfer_rule', 'confusion_set', 'cognitive_error', 'action_class', 'hinge_clue_type'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 1. learner_model — per-user, per-dimension mastery
-- ============================================
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

CREATE POLICY "Users can view own learner_model"
  ON learner_model FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learner_model"
  ON learner_model FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learner_model"
  ON learner_model FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. attempt_v2 — richer diagnostic data
-- ============================================
CREATE TABLE IF NOT EXISTS attempt_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Supports both question systems (nullable FKs)
  item_draft_id UUID REFERENCES item_draft(id) ON DELETE SET NULL,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,

  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A','B','C','D','E')),
  is_correct BOOLEAN NOT NULL,
  time_spent_ms INT,
  confidence_pre INT CHECK (confidence_pre BETWEEN 1 AND 5),

  -- Diagnostic fields
  diagnosed_cognitive_error_id UUID REFERENCES error_taxonomy(id) ON DELETE SET NULL,
  diagnosed_hinge_miss BOOLEAN NOT NULL DEFAULT false,
  diagnosed_action_class_confusion BOOLEAN NOT NULL DEFAULT false,

  -- Repair routing
  repair_action public.repair_action,

  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Must reference at least one question system
  CHECK (item_draft_id IS NOT NULL OR question_id IS NOT NULL)
);

ALTER TABLE attempt_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempt_v2"
  ON attempt_v2 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempt_v2"
  ON attempt_v2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_learner_model_user ON learner_model(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_dimension ON learner_model(dimension_type, dimension_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_review ON learner_model(user_id, next_review_due);
CREATE INDEX IF NOT EXISTS idx_learner_model_mastery ON learner_model(user_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_user ON attempt_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_item ON attempt_v2(item_draft_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_question ON attempt_v2(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_session ON attempt_v2(session_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_error ON attempt_v2(diagnosed_cognitive_error_id);

-- Auto-update updated_at on learner_model
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON learner_model
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
