-- V7 Part B: New ontology tables

CREATE TABLE IF NOT EXISTS hinge_clue_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  example TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hinge_clue_type ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS alternate_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nbme_phrasing TEXT NOT NULL,
  clinical_concept TEXT NOT NULL,
  context TEXT,
  UNIQUE(nbme_phrasing, clinical_concept),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE alternate_terminology ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS action_class (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  priority_rank INT NOT NULL,
  description TEXT NOT NULL,
  example_actions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE action_class ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cognitive_error_tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_taxonomy_id UUID NOT NULL REFERENCES error_taxonomy(id) ON DELETE CASCADE,
  item_draft_id UUID REFERENCES item_draft(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_letter CHAR(1) NOT NULL CHECK (option_letter IN ('A','B','C','D','E')),
  is_correct_answer BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cognitive_error_tag ENABLE ROW LEVEL SECURITY;
