-- V7 Part C: RLS policies and indexes

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read hinge_clue_type"
    ON hinge_clue_type FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read alternate_terminology"
    ON alternate_terminology FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read action_class"
    ON action_class FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read cognitive_error_tag"
    ON cognitive_error_tag FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE cognitive_error_tag ADD CONSTRAINT cognitive_error_tag_item_unique
    UNIQUE(error_taxonomy_id, item_draft_id, option_letter);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE cognitive_error_tag ADD CONSTRAINT cognitive_error_tag_question_unique
    UNIQUE(error_taxonomy_id, question_id, option_letter);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_item ON cognitive_error_tag(item_draft_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_question ON cognitive_error_tag(question_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_error ON cognitive_error_tag(error_taxonomy_id);
CREATE INDEX IF NOT EXISTS idx_hinge_clue_type_name ON hinge_clue_type(name);
CREATE INDEX IF NOT EXISTS idx_action_class_priority ON action_class(priority_rank);
CREATE INDEX IF NOT EXISTS idx_alternate_terminology_concept ON alternate_terminology(clinical_concept);
