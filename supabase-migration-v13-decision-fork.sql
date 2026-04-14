-- Migration v13: Decision Fork Constraint
-- Ensures every question has a genuine decision fork, not a trivially obvious answer.
-- Also enforces option action class homogeneity.

-- 1. Decision fork type enum
DO $$ BEGIN
  CREATE TYPE public.decision_fork_type AS ENUM (
    'competing_diagnoses',
    'management_tradeoff',
    'contraindication',
    'timing_decision',
    'severity_ambiguity'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add decision fork fields to case_plan
ALTER TABLE case_plan
  ADD COLUMN IF NOT EXISTS decision_fork_type public.decision_fork_type NOT NULL DEFAULT 'management_tradeoff',
  ADD COLUMN IF NOT EXISTS decision_fork_description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS option_action_class TEXT NOT NULL DEFAULT 'management_steps';

-- 3. Add option_action_class to question_skeleton
ALTER TABLE question_skeleton
  ADD COLUMN IF NOT EXISTS option_action_class TEXT NOT NULL DEFAULT 'management_steps';

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_case_plan_fork_type ON case_plan(decision_fork_type);
