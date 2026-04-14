-- Migration v8: Case Plan + Question Skeleton
-- Inserts structured planning between algorithm extraction and vignette writing
-- Run in Supabase SQL Editor AFTER v7 migration

-- ============================================
-- Extend agent_type enum with new pipeline agents
-- ============================================
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'case_planner';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'skeleton_writer';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'skeleton_validator';

-- ============================================
-- 1. case_plan — links to all 6 ontology primitives
-- ============================================
CREATE TABLE IF NOT EXISTS case_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_node_id UUID NOT NULL REFERENCES blueprint_node(id) ON DELETE CASCADE,
  algorithm_card_id UUID NOT NULL REFERENCES algorithm_card(id) ON DELETE CASCADE,

  -- Target ontology primitives (all nullable — not every question targets all 6)
  target_transfer_rule_id UUID REFERENCES transfer_rules(id) ON DELETE SET NULL,
  target_confusion_set_id UUID REFERENCES confusion_sets(id) ON DELETE SET NULL,
  target_cognitive_error_id UUID REFERENCES error_taxonomy(id) ON DELETE SET NULL,
  target_hinge_clue_type_id UUID REFERENCES hinge_clue_type(id) ON DELETE SET NULL,
  target_action_class_id UUID REFERENCES action_class(id) ON DELETE SET NULL,

  -- Difficulty decomposition (1-5 each)
  ambiguity_level INT NOT NULL DEFAULT 3 CHECK (ambiguity_level BETWEEN 1 AND 5),
  distractor_strength INT NOT NULL DEFAULT 3 CHECK (distractor_strength BETWEEN 1 AND 5),
  clinical_complexity INT NOT NULL DEFAULT 3 CHECK (clinical_complexity BETWEEN 1 AND 5),

  -- Strategy
  ambiguity_strategy TEXT,
  distractor_design JSONB,
  final_decisive_clue TEXT,
  explanation_teaching_goal TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE case_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read case_plan"
  ON case_plan FOR SELECT TO authenticated USING (true);

-- ============================================
-- 2. question_skeleton — logical structure before prose
-- ============================================
CREATE TABLE IF NOT EXISTS question_skeleton (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_plan_id UUID NOT NULL REFERENCES case_plan(id) ON DELETE CASCADE,

  -- Core structure
  case_summary TEXT NOT NULL,
  hidden_target TEXT NOT NULL,
  correct_action TEXT NOT NULL,
  correct_action_class_id UUID REFERENCES action_class(id) ON DELETE SET NULL,

  -- Option architecture
  wrong_option_archetypes JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Each: { letter, archetype, cognitive_error_id, action_class_id }
  error_mapping JSONB,
  -- Maps option letters to cognitive error names

  -- Hinge placement
  hinge_placement TEXT,
  hinge_description TEXT,

  -- Gate
  skeleton_validated BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE question_skeleton ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read question_skeleton"
  ON question_skeleton FOR SELECT TO authenticated USING (true);

-- ============================================
-- 3. Extend item_draft with v2 FKs
-- ============================================
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS case_plan_id UUID REFERENCES case_plan(id) ON DELETE SET NULL;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS question_skeleton_id UUID REFERENCES question_skeleton(id) ON DELETE SET NULL;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_case_plan_blueprint ON case_plan(blueprint_node_id);
CREATE INDEX IF NOT EXISTS idx_case_plan_card ON case_plan(algorithm_card_id);
CREATE INDEX IF NOT EXISTS idx_case_plan_error ON case_plan(target_cognitive_error_id);
CREATE INDEX IF NOT EXISTS idx_case_plan_confusion ON case_plan(target_confusion_set_id);
CREATE INDEX IF NOT EXISTS idx_question_skeleton_plan ON question_skeleton(case_plan_id);
CREATE INDEX IF NOT EXISTS idx_item_draft_case_plan ON item_draft(case_plan_id);
CREATE INDEX IF NOT EXISTS idx_item_draft_skeleton ON item_draft(question_skeleton_id);
