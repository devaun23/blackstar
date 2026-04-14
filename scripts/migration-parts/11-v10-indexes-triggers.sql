-- V10 Part D: Indexes and triggers

CREATE INDEX IF NOT EXISTS idx_learner_model_user ON learner_model(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_dimension ON learner_model(dimension_type, dimension_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_review ON learner_model(user_id, next_review_due);
CREATE INDEX IF NOT EXISTS idx_learner_model_mastery ON learner_model(user_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_user ON attempt_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_item ON attempt_v2(item_draft_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_question ON attempt_v2(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_session ON attempt_v2(session_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_error ON attempt_v2(diagnosed_cognitive_error_id);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON learner_model
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
