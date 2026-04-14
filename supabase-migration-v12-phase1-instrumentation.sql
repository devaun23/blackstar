-- Migration v12: Phase 1 Instrumentation
-- Adds contrast loop tracking and confusion set reference to attempt_v2
-- Also adds option_frames and correct_option_frame_id to case_plan and question_skeleton

-- ─── attempt_v2: contrast loop instrumentation ───
ALTER TABLE attempt_v2
  ADD COLUMN IF NOT EXISTS is_contrast_question boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contrast_success boolean,
  ADD COLUMN IF NOT EXISTS confusion_set_id uuid REFERENCES confusion_set(id);

CREATE INDEX IF NOT EXISTS idx_attempt_v2_contrast
  ON attempt_v2 (user_id, confusion_set_id)
  WHERE is_contrast_question = true;

CREATE INDEX IF NOT EXISTS idx_attempt_v2_error_repetition
  ON attempt_v2 (user_id, confusion_set_id, diagnosed_cognitive_error_id)
  WHERE is_correct = false;

-- ─── case_plan: option frames ───
ALTER TABLE case_plan
  ADD COLUMN IF NOT EXISTS option_frames jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS correct_option_frame_id text,
  ADD COLUMN IF NOT EXISTS distractor_rationale_by_frame jsonb,
  ADD COLUMN IF NOT EXISTS forbidden_option_classes text[];

-- ─── question_skeleton: frame-anchored options ───
-- Replace wrong_option_archetypes with option_frames
ALTER TABLE question_skeleton
  ADD COLUMN IF NOT EXISTS option_frames jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS correct_option_frame_id text;

-- Keep wrong_option_archetypes for backward compatibility with existing data
-- but new records will use option_frames exclusively

COMMENT ON COLUMN attempt_v2.is_contrast_question IS 'True if this question was served as a contrast follow-up after a wrong answer';
COMMENT ON COLUMN attempt_v2.contrast_success IS 'If contrast question, did the user answer correctly? Null for non-contrast questions.';
COMMENT ON COLUMN attempt_v2.confusion_set_id IS 'Confusion set this question belongs to, for error repetition tracking';
COMMENT ON COLUMN case_plan.option_frames IS 'Pre-specified answer slots (A-E) with clinical meanings. Writer renders, does not invent.';
COMMENT ON COLUMN case_plan.correct_option_frame_id IS 'Which option frame (A-E) is the correct answer';
COMMENT ON COLUMN case_plan.forbidden_option_classes IS 'Option classes the writer must never introduce';
COMMENT ON COLUMN question_skeleton.option_frames IS 'Frame-anchored options inherited from case_plan with cognitive_error_id per distractor';
COMMENT ON COLUMN question_skeleton.correct_option_frame_id IS 'Which option frame (A-E) is the correct answer';
