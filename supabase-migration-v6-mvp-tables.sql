-- Migration v6: MVP question bank tables (alongside factory schema)
-- Run in Supabase SQL Editor

-- Enable UUID generation (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table 1: Confusion Sets
CREATE TABLE IF NOT EXISTS confusion_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  conditions JSONB NOT NULL,
  discriminating_clues JSONB NOT NULL,
  common_traps TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Transfer Rules
CREATE TABLE IF NOT EXISTS transfer_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_text TEXT NOT NULL,
  category VARCHAR(30) NOT NULL,
  times_violated INT DEFAULT 0,
  times_mastered INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vignette TEXT NOT NULL,
  stem TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D','E')),
  error_map JSONB NOT NULL,
  transfer_rule_id UUID REFERENCES transfer_rules(id),
  transfer_rule_text TEXT NOT NULL,
  explanation_decision TEXT NOT NULL,
  explanation_options TEXT NOT NULL,
  explanation_summary TEXT NOT NULL,
  system_topic VARCHAR(50) NOT NULL,
  confusion_set_id UUID REFERENCES confusion_sets(id),
  error_bucket VARCHAR(30) NOT NULL CHECK (error_bucket IN (
    'severity_miss','next_step_error','premature_closure','confusion_set_miss','test_interpretation_miss'
  )),
  difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  batch_number INT,
  times_served INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: Attempts
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) NOT NULL,
  selected_option CHAR(1) NOT NULL CHECK (selected_option IN ('A','B','C','D','E')),
  is_correct BOOLEAN NOT NULL,
  error_type VARCHAR(30),
  confidence_pre INT CHECK (confidence_pre BETWEEN 1 AND 5),
  self_labeled_error VARCHAR(50),
  time_spent_ms INT,
  session_id UUID,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('retention','training','mixed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: Mastery State
CREATE TABLE IF NOT EXISTS mastery_state (
  concept VARCHAR(100) PRIMARY KEY,
  mastery_level FLOAT DEFAULT 0.0 CHECK (mastery_level BETWEEN 0.0 AND 1.0),
  total_attempts INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  last_seen TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ DEFAULT NOW(),
  consecutive_correct INT DEFAULT 0,
  error_counts JSONB DEFAULT '{"severity_miss":0,"next_step_error":0,"premature_closure":0,"confusion_set_miss":0,"test_interpretation_miss":0}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: Session Log
CREATE TABLE IF NOT EXISTS session_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type VARCHAR(20) NOT NULL,
  questions_completed INT DEFAULT 0,
  accuracy FLOAT,
  errors_by_type JSONB DEFAULT '{}',
  transfer_rules_violated TEXT[] DEFAULT '{}',
  transfer_rules_mastered TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_error ON attempts(error_type);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_error_bucket ON questions(error_bucket);
CREATE INDEX IF NOT EXISTS idx_questions_system ON questions(system_topic);
CREATE INDEX IF NOT EXISTS idx_questions_batch ON questions(batch_number);
CREATE INDEX IF NOT EXISTS idx_mastery_review_due ON mastery_state(next_review_due);
