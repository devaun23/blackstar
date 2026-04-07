-- Migration v7: Reasoning Ontology Layer
-- Extends seed layer from {confusion_sets, transfer_rules} to 6 structured primitives
-- Run in Supabase SQL Editor AFTER v6 migration

-- ============================================
-- A. confusion_sets — keep as-is (10 rows, working)
-- ============================================
-- No changes needed

-- ============================================
-- B. transfer_rules — add structured columns
-- ============================================
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS trigger_pattern TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS action_priority TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS suppressions TEXT[];
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS wrong_pathways JSONB;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS source_citation TEXT;

-- ============================================
-- C. error_taxonomy — extend existing 12 rows
-- ============================================
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS frequency_rank INT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS detection_prompt TEXT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS repair_strategy TEXT;

-- ============================================
-- D. hinge_clue_type — NEW (10 seed types)
-- ============================================
CREATE TABLE IF NOT EXISTS hinge_clue_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  example TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE hinge_clue_type ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read hinge_clue_type"
  ON hinge_clue_type FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- E. alternate_terminology — NEW (~20 seeds)
-- ============================================
CREATE TABLE IF NOT EXISTS alternate_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nbme_phrasing TEXT NOT NULL,
  clinical_concept TEXT NOT NULL,
  context TEXT,
  UNIQUE(nbme_phrasing, clinical_concept),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE alternate_terminology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read alternate_terminology"
  ON alternate_terminology FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- F. action_class — NEW (9 seed classes)
-- ============================================
CREATE TABLE IF NOT EXISTS action_class (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  priority_rank INT NOT NULL,
  description TEXT NOT NULL,
  example_actions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE action_class ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read action_class"
  ON action_class FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- G. cognitive_error_tag — bridge table
-- Links errors to specific distractor choices
-- ============================================
CREATE TABLE IF NOT EXISTS cognitive_error_tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_taxonomy_id UUID NOT NULL REFERENCES error_taxonomy(id) ON DELETE CASCADE,
  -- Nullable FKs: one of these should be set
  item_draft_id UUID REFERENCES item_draft(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_letter CHAR(1) NOT NULL CHECK (option_letter IN ('A','B','C','D','E')),
  is_correct_answer BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each error can only be tagged once per option per question
  UNIQUE(error_taxonomy_id, item_draft_id, option_letter),
  UNIQUE(error_taxonomy_id, question_id, option_letter)
);

-- RLS
ALTER TABLE cognitive_error_tag ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cognitive_error_tag"
  ON cognitive_error_tag FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_item ON cognitive_error_tag(item_draft_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_question ON cognitive_error_tag(question_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_error ON cognitive_error_tag(error_taxonomy_id);
CREATE INDEX IF NOT EXISTS idx_hinge_clue_type_name ON hinge_clue_type(name);
CREATE INDEX IF NOT EXISTS idx_action_class_priority ON action_class(priority_rank);
CREATE INDEX IF NOT EXISTS idx_alternate_terminology_concept ON alternate_terminology(clinical_concept);
