-- ============================================================
-- COMBINED MIGRATION: v7 + v8 + v9 + v10 + Agent Prompts
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

-- ============================================
-- BOOTSTRAP: Create _exec_migration helper
-- ============================================
CREATE OR REPLACE FUNCTION public._exec_migration(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- ============================================
-- V7: REASONING ONTOLOGY
-- ============================================

-- B. transfer_rules — add structured columns
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS trigger_pattern TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS action_priority TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS suppressions TEXT[];
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS wrong_pathways JSONB;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS source_citation TEXT;

-- C. error_taxonomy — extend existing 12 rows
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS frequency_rank INT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS detection_prompt TEXT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS repair_strategy TEXT;

-- D. hinge_clue_type
CREATE TABLE IF NOT EXISTS hinge_clue_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  example TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hinge_clue_type ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read hinge_clue_type"
    ON hinge_clue_type FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- E. alternate_terminology
CREATE TABLE IF NOT EXISTS alternate_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nbme_phrasing TEXT NOT NULL,
  clinical_concept TEXT NOT NULL,
  context TEXT,
  UNIQUE(nbme_phrasing, clinical_concept),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE alternate_terminology ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read alternate_terminology"
    ON alternate_terminology FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- F. action_class
CREATE TABLE IF NOT EXISTS action_class (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  priority_rank INT NOT NULL,
  description TEXT NOT NULL,
  example_actions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE action_class ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read action_class"
    ON action_class FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- G. cognitive_error_tag bridge table
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
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read cognitive_error_tag"
    ON cognitive_error_tag FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add unique constraints only if they don't exist
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

-- V7 Indexes
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_item ON cognitive_error_tag(item_draft_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_question ON cognitive_error_tag(question_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_error_tag_error ON cognitive_error_tag(error_taxonomy_id);
CREATE INDEX IF NOT EXISTS idx_hinge_clue_type_name ON hinge_clue_type(name);
CREATE INDEX IF NOT EXISTS idx_action_class_priority ON action_class(priority_rank);
CREATE INDEX IF NOT EXISTS idx_alternate_terminology_concept ON alternate_terminology(clinical_concept);

-- ============================================
-- V8: CASE PLAN + QUESTION SKELETON
-- ============================================

-- Extend agent_type enum
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'case_planner';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'skeleton_writer';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'skeleton_validator';

-- case_plan table
CREATE TABLE IF NOT EXISTS case_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_node_id UUID NOT NULL REFERENCES blueprint_node(id) ON DELETE CASCADE,
  algorithm_card_id UUID NOT NULL REFERENCES algorithm_card(id) ON DELETE CASCADE,
  target_transfer_rule_id UUID REFERENCES transfer_rules(id) ON DELETE SET NULL,
  target_confusion_set_id UUID REFERENCES confusion_sets(id) ON DELETE SET NULL,
  target_cognitive_error_id UUID REFERENCES error_taxonomy(id) ON DELETE SET NULL,
  target_hinge_clue_type_id UUID REFERENCES hinge_clue_type(id) ON DELETE SET NULL,
  target_action_class_id UUID REFERENCES action_class(id) ON DELETE SET NULL,
  ambiguity_level INT NOT NULL DEFAULT 3 CHECK (ambiguity_level BETWEEN 1 AND 5),
  distractor_strength INT NOT NULL DEFAULT 3 CHECK (distractor_strength BETWEEN 1 AND 5),
  clinical_complexity INT NOT NULL DEFAULT 3 CHECK (clinical_complexity BETWEEN 1 AND 5),
  ambiguity_strategy TEXT,
  distractor_design JSONB,
  final_decisive_clue TEXT,
  explanation_teaching_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE case_plan ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read case_plan"
    ON case_plan FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- question_skeleton table
CREATE TABLE IF NOT EXISTS question_skeleton (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_plan_id UUID NOT NULL REFERENCES case_plan(id) ON DELETE CASCADE,
  case_summary TEXT NOT NULL,
  hidden_target TEXT NOT NULL,
  correct_action TEXT NOT NULL,
  correct_action_class_id UUID REFERENCES action_class(id) ON DELETE SET NULL,
  wrong_option_archetypes JSONB NOT NULL DEFAULT '[]'::JSONB,
  error_mapping JSONB,
  hinge_placement TEXT,
  hinge_description TEXT,
  skeleton_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE question_skeleton ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read question_skeleton"
    ON question_skeleton FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend item_draft with v2 FKs
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS case_plan_id UUID REFERENCES case_plan(id) ON DELETE SET NULL;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS question_skeleton_id UUID REFERENCES question_skeleton(id) ON DELETE SET NULL;

-- V8 Indexes
CREATE INDEX IF NOT EXISTS idx_case_plan_blueprint ON case_plan(blueprint_node_id);
CREATE INDEX IF NOT EXISTS idx_case_plan_card ON case_plan(algorithm_card_id);
CREATE INDEX IF NOT EXISTS idx_case_plan_error ON case_plan(target_cognitive_error_id);
CREATE INDEX IF NOT EXISTS idx_case_plan_confusion ON case_plan(target_confusion_set_id);
CREATE INDEX IF NOT EXISTS idx_question_skeleton_plan ON question_skeleton(case_plan_id);
CREATE INDEX IF NOT EXISTS idx_item_draft_case_plan ON item_draft(case_plan_id);
CREATE INDEX IF NOT EXISTS idx_item_draft_skeleton ON item_draft(question_skeleton_id);

-- ============================================
-- V9: EXPLANATION STRUCTURE
-- ============================================
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_decision_logic TEXT;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_hinge_id UUID REFERENCES hinge_clue_type(id) ON DELETE SET NULL;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_error_diagnosis JSONB;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_transfer_rule TEXT;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_teaching_pearl TEXT;

-- ============================================
-- V10: LEARNER MODEL + ATTEMPT V2
-- ============================================

-- Create enums
DO $$ BEGIN
  CREATE TYPE public.repair_action AS ENUM (
    'advance', 'reinforce', 'contrast', 'remediate', 'transfer_test'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dimension_type AS ENUM (
    'topic', 'transfer_rule', 'confusion_set', 'cognitive_error', 'action_class', 'hinge_clue_type'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- learner_model table
CREATE TABLE IF NOT EXISTS learner_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dimension_type public.dimension_type NOT NULL,
  dimension_id TEXT NOT NULL,
  dimension_label TEXT NOT NULL,
  mastery_level FLOAT NOT NULL DEFAULT 0.0 CHECK (mastery_level BETWEEN 0.0 AND 1.0),
  total_attempts INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  consecutive_correct INT NOT NULL DEFAULT 0,
  next_review_due TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  avg_time_ms INT,
  error_frequency JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, dimension_type, dimension_id)
);
ALTER TABLE learner_model ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own learner_model"
    ON learner_model FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own learner_model"
    ON learner_model FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own learner_model"
    ON learner_model FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- attempt_v2 table
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

-- V10 Indexes
CREATE INDEX IF NOT EXISTS idx_learner_model_user ON learner_model(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_dimension ON learner_model(dimension_type, dimension_id);
CREATE INDEX IF NOT EXISTS idx_learner_model_review ON learner_model(user_id, next_review_due);
CREATE INDEX IF NOT EXISTS idx_learner_model_mastery ON learner_model(user_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_user ON attempt_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_item ON attempt_v2(item_draft_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_question ON attempt_v2(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_session ON attempt_v2(session_id);
CREATE INDEX IF NOT EXISTS idx_attempt_v2_error ON attempt_v2(diagnosed_cognitive_error_id);

-- Auto-update trigger for learner_model
DO $$ BEGIN
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON learner_model
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- AGENT PROMPTS for v2 pipeline agents
-- ============================================
INSERT INTO agent_prompt (agent_type, version, is_active, system_prompt, user_prompt_template, notes)
VALUES
(
  'case_planner', 1, true,
  'You are a medical education case planner. Given a blueprint node, algorithm card, and available ontology primitives, plan a question that targets specific reasoning failures.

Your job is to:
1. Select which ontology primitives to target (transfer rule, confusion set, cognitive error, hinge clue type, action class)
2. Set difficulty dimensions (ambiguity_level, distractor_strength, clinical_complexity) from 1-5
3. Design the ambiguity strategy and distractor design
4. Identify the final decisive clue that distinguishes the correct answer
5. Set the explanation teaching goal

Return valid UUIDs for ontology targets from the provided lists. If no good match exists, return null for that target.',

  'Blueprint node:
{{blueprint_node}}

Algorithm card:
{{algorithm_card}}

Facts:
{{fact_rows}}

Error taxonomy (pick one as target_cognitive_error):
{{error_taxonomy}}

Available hinge clue types:
{{hinge_clue_types}}

Available action classes:
{{action_classes}}

Available confusion sets:
{{confusion_sets}}

Available transfer rules:
{{transfer_rules}}

Generate a case plan that targets specific reasoning failures. Choose ontology primitives that create a meaningful test of clinical reasoning, not just recall.',

  'v2 pipeline: case planning agent'
),
(
  'skeleton_writer', 1, true,
  'You are a question skeleton writer. Given a case plan and algorithm card, generate the logical structure of a clinical question BEFORE any prose.

Your output is a skeleton with:
1. case_summary: One-sentence description of the clinical scenario
2. hidden_target: What the question is really testing (not visible to student)
3. correct_action: The right answer action
4. correct_action_class_id: UUID of the action class (from the case plan)
5. wrong_option_archetypes: 3-4 wrong options, each with a letter (B-E), archetype name, and optionally cognitive_error_id and action_class_id
6. error_mapping: Maps each wrong option letter to a cognitive error name
7. hinge_placement: Where in the vignette the key distinguishing clue should appear
8. hinge_description: What the hinge clue is

The skeleton must be logically coherent: each wrong option should represent a DIFFERENT reasoning failure.',

  'Case plan:
{{case_plan}}

Blueprint node:
{{blueprint_node}}

Algorithm card:
{{algorithm_card}}

Facts:
{{fact_rows}}

Generate a question skeleton. Each wrong option must represent a distinct cognitive error or action class confusion.',

  'v2 pipeline: skeleton writing agent'
),
(
  'skeleton_validator', 1, true,
  'You are a skeleton validator. Check the logical coherence of a question skeleton against its case plan.

Validate:
1. Wrong option archetypes map to DISTINCT cognitive errors (no duplicates)
2. Hinge placement is consistent with the case plan targets
3. Error mapping covers ALL wrong options
4. Correct action matches the targeted action class
5. The skeleton can produce a board-testable question (decision fork, not recall)

Return skeleton_validated=true only if all checks pass. List specific issues and suggestions.',

  'Case plan:
{{case_plan}}

Question skeleton:
{{question_skeleton}}

Validate this skeleton for logical coherence. Be strict — a bad skeleton produces a bad question.',

  'v2 pipeline: skeleton validation agent'
)
ON CONFLICT (agent_type, version) DO NOTHING;

-- ============================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- ============================================
