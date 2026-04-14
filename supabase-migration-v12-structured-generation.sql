-- Migration v12: Structured Generation Schema
-- Tightens case_plan and question_skeleton to enforce the three coupled problems:
-- 1. Every question declares its cognitive operation and transfer rule BEFORE writing
-- 2. Every distractor names its cognitive error (not nullable)
-- 3. Hinge depth is specified and validated against the plan
--
-- Run in Supabase SQL Editor AFTER v8 migration (case_plan + question_skeleton must exist)

-- ============================================
-- 1. Add cognitive_operation_type enum
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.cognitive_operation_type AS ENUM (
    'rule_application',
    'threshold_recognition',
    'diagnosis_disambiguation',
    'management_sequencing',
    'risk_stratification'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. Add hinge_depth enum
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.hinge_depth AS ENUM (
    'surface',
    'moderate',
    'deep'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. Extend case_plan with structured generation fields
-- ============================================
ALTER TABLE case_plan
  ADD COLUMN IF NOT EXISTS cognitive_operation_type public.cognitive_operation_type NOT NULL DEFAULT 'rule_application',
  ADD COLUMN IF NOT EXISTS transfer_rule_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hinge_depth_target public.hinge_depth NOT NULL DEFAULT 'moderate';

-- Make target_cognitive_error_id NOT NULL (with a temporary default for existing rows)
-- Only run if there are existing rows; new rows will always have it set by the agent
-- ALTER TABLE case_plan ALTER COLUMN target_cognitive_error_id SET NOT NULL;
-- NOTE: Uncomment the above after backfilling any existing rows with valid error IDs

-- ============================================
-- 4. Extend question_skeleton with hinge structure
-- ============================================
ALTER TABLE question_skeleton
  ADD COLUMN IF NOT EXISTS hinge_depth public.hinge_depth NOT NULL DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS hinge_buried_by TEXT NOT NULL DEFAULT '';

-- Make hinge_placement and hinge_description NOT NULL
ALTER TABLE question_skeleton ALTER COLUMN hinge_placement SET NOT NULL;
ALTER TABLE question_skeleton ALTER COLUMN hinge_placement SET DEFAULT '';
ALTER TABLE question_skeleton ALTER COLUMN hinge_description SET NOT NULL;
ALTER TABLE question_skeleton ALTER COLUMN hinge_description SET DEFAULT '';

-- ============================================
-- 5. Add validator_summary to pipeline_run
-- ============================================
ALTER TABLE pipeline_run
  ADD COLUMN IF NOT EXISTS validator_summary JSONB;

-- ============================================
-- 6. Indexes for new fields
-- ============================================
CREATE INDEX IF NOT EXISTS idx_case_plan_cognitive_op ON case_plan(cognitive_operation_type);
CREATE INDEX IF NOT EXISTS idx_case_plan_hinge_depth ON case_plan(hinge_depth_target);
CREATE INDEX IF NOT EXISTS idx_skeleton_hinge_depth ON question_skeleton(hinge_depth);
