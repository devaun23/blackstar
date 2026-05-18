-- Migration v29: Item-Analysis Logging Columns
-- Adds per-distractor capture to attempt_v2 so distractor analytics
-- (per-option pick rate, point-biserial by option, miskey detection)
-- can run on every alpha attempt from Day 1.
--
-- Also adds item_draft.refine_cycle to support the post-rubric-decision
-- refine-agent repair loop (Piece 2b in BLACKSTAR_BLUEPRINT_COVERAGE
-- audit-pipeline plan). Cap at 3 enforced in pipeline-v2.ts, not here.

-- ============================================
-- 1. attempt_v2: distractor capture
-- ============================================
ALTER TABLE attempt_v2
  ADD COLUMN IF NOT EXISTS distractor_chosen CHAR(1)
    CHECK (distractor_chosen IS NULL OR distractor_chosen IN ('A','B','C','D','E'));

ALTER TABLE attempt_v2
  ADD COLUMN IF NOT EXISTS distractor_label TEXT;

COMMENT ON COLUMN attempt_v2.distractor_chosen IS
  'For incorrect attempts: which option letter (A-E) was selected. NULL when is_correct=true. Mirrors selected_answer on misses to make distractor-aggregation queries trivial.';

COMMENT ON COLUMN attempt_v2.distractor_label IS
  'Semantic label of why the chosen distractor was tempting (from questions.error_map or case_plan cognitive error name). NULL on correct answer or when unresolved.';

-- Partial index for the per-question, per-distractor aggregation in
-- scripts/distractor-analysis.ts. Excludes correct answers (where
-- distractor_chosen IS NULL) so the index stays small.
CREATE INDEX IF NOT EXISTS idx_attempt_v2_distractor_chosen
  ON attempt_v2 (item_draft_id, distractor_chosen)
  WHERE distractor_chosen IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attempt_v2_question_distractor
  ON attempt_v2 (question_id, distractor_chosen)
  WHERE distractor_chosen IS NOT NULL AND question_id IS NOT NULL;

-- ============================================
-- 2. item_draft: refine cycle counter (Piece 2b prep)
-- ============================================
ALTER TABLE item_draft
  ADD COLUMN IF NOT EXISTS refine_cycle INT NOT NULL DEFAULT 0
    CHECK (refine_cycle BETWEEN 0 AND 3);

COMMENT ON COLUMN item_draft.refine_cycle IS
  'Post-rubric-decision refine-agent repair counter. Capped at 3 per REJECTION_RULES R-PIPE-01. 0 = never refined; 1-3 = cycles consumed.';
