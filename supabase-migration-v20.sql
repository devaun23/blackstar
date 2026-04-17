-- v20: Research-backed MCQ quality metrics
-- Based on 15+ blinded comparison studies (2024-2026):
-- AI difficulty 0.76 vs human 0.65 (p=0.02)
-- AI distractor efficiency 39% vs human 55% (p=0.035)
-- Adds difficulty estimation, near-miss tracking, and distractor functioning estimates

-- Estimated difficulty on item_draft (set by NBME quality validator)
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS estimated_difficulty numeric(3,2)
  CHECK (estimated_difficulty BETWEEN 0 AND 1);

-- Near-miss tracking on item_draft (from case_plan option_frames)
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS near_miss_option char(1)
  CHECK (near_miss_option IN ('A','B','C','D','E'));
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS near_miss_pivot_detail text;

-- Distractor functioning estimates on validator_report (JSONB — per-option selection %)
-- Expected shape: {"A": 0.25, "B": 0.15, "C": 0.10, "D": 0.05, "E": 0.45}
ALTER TABLE validator_report ADD COLUMN IF NOT EXISTS distractor_estimates jsonb;

-- New failure categories in enum (idempotent — IF NOT EXISTS)
DO $$ BEGIN
  ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'too_easy';
  ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'non_functioning_distractor';
  ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'linguistic_tells';
  ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'near_miss_absent';
EXCEPTION WHEN duplicate_object THEN null;
END $$;
