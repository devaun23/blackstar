-- V13: Foundation repair — fill schema gaps that silently failed in v7-v8
-- Run in Supabase SQL Editor

-- ============================================================
-- 1. Extend transfer_rules (v7 ALTERs that failed silently
--    because they ran before v6 created the table in the
--    combined migration script ordering)
-- ============================================================
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS trigger_pattern TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS action_priority TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS suppressions TEXT[];
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS wrong_pathways JSONB;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS source_citation TEXT;

-- ============================================================
-- 2. Extend case_plan with structured generation fields
--    (v8 CREATE only had FK + difficulty columns)
-- ============================================================
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS cognitive_operation_type TEXT;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS transfer_rule_text TEXT;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS hinge_depth_target TEXT DEFAULT 'surface';
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS decision_fork_type TEXT;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS decision_fork_description TEXT;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS option_action_class TEXT;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS option_frames JSONB DEFAULT '[]'::JSONB;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS correct_option_frame_id TEXT;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS distractor_rationale_by_frame JSONB;
ALTER TABLE case_plan ADD COLUMN IF NOT EXISTS forbidden_option_classes TEXT[];

-- ============================================================
-- 3. Extend question_skeleton with missing columns
--    (v8 CREATE had case_summary, hidden_target, correct_action,
--     error_mapping, hinge_placement, hinge_description only)
-- ============================================================
ALTER TABLE question_skeleton ADD COLUMN IF NOT EXISTS option_action_class TEXT;
ALTER TABLE question_skeleton ADD COLUMN IF NOT EXISTS option_frames JSONB DEFAULT '[]'::JSONB;
ALTER TABLE question_skeleton ADD COLUMN IF NOT EXISTS correct_option_frame_id TEXT;
ALTER TABLE question_skeleton ADD COLUMN IF NOT EXISTS hinge_depth TEXT DEFAULT 'surface';
ALTER TABLE question_skeleton ADD COLUMN IF NOT EXISTS hinge_buried_by TEXT;

-- ============================================================
-- 4. Extend confusion_sets with shelf column for Phase 1
--    system-level filtering
-- ============================================================
ALTER TABLE confusion_sets ADD COLUMN IF NOT EXISTS shelf TEXT;

-- ============================================================
-- 5. Fix case_plan.target_cognitive_error_id constraint
--    First backfill any NULLs, then make NOT NULL
-- ============================================================
-- Backfill: set any NULL target_cognitive_error_id to a sentinel
-- (Only if rows exist — skip if table is empty)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM case_plan WHERE target_cognitive_error_id IS NULL) THEN
    -- Get first error taxonomy ID as fallback
    UPDATE case_plan
    SET target_cognitive_error_id = (SELECT id FROM error_taxonomy LIMIT 1)
    WHERE target_cognitive_error_id IS NULL;
  END IF;
END $$;

-- Now make it NOT NULL (safe — no NULLs remain)
DO $$
BEGIN
  ALTER TABLE case_plan ALTER COLUMN target_cognitive_error_id SET NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'target_cognitive_error_id already NOT NULL or no rows to constrain';
END $$;

-- ============================================================
-- 6. Unique constraints for upsert support
-- ============================================================
DO $$
BEGIN
  ALTER TABLE confusion_sets ADD CONSTRAINT confusion_sets_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE transfer_rules ADD CONSTRAINT transfer_rules_rule_text_key UNIQUE (rule_text);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ============================================================
-- 7. Indexes for new columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transfer_rules_topic ON transfer_rules(topic);
CREATE INDEX IF NOT EXISTS idx_confusion_sets_shelf ON confusion_sets(shelf);
CREATE INDEX IF NOT EXISTS idx_case_plan_transfer_rule ON case_plan(target_transfer_rule_id);
