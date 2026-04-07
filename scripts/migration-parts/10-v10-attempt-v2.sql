-- V10 Part C: attempt_v2 table

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
  CREATE POLICY "Users can view own attempt_v2"
    ON attempt_v2 FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own attempt_v2"
    ON attempt_v2 FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
