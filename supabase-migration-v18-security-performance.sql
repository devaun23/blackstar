-- Migration v18: Security & Performance Hardening
-- 1. Enable RLS on di_episode and di_evidence_item (CRITICAL security fix)
-- 2. Add missing foreign key indexes (CRITICAL performance fix)

-- ============================================
-- 1. RLS on evidence tables
-- ============================================

ALTER TABLE public.di_episode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read di_episode"
  ON public.di_episode FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.di_evidence_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read di_evidence_item"
  ON public.di_evidence_item FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 2. Missing foreign key indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_algorithm_card_blueprint
  ON public.algorithm_card(blueprint_node_id);

CREATE INDEX IF NOT EXISTS idx_item_plan_algorithm_card
  ON public.item_plan(algorithm_card_id);

CREATE INDEX IF NOT EXISTS idx_item_plan_blueprint
  ON public.item_plan(blueprint_node_id);

CREATE INDEX IF NOT EXISTS idx_item_draft_item_plan
  ON public.item_draft(item_plan_id);

CREATE INDEX IF NOT EXISTS idx_item_draft_pipeline_run
  ON public.item_draft(pipeline_run_id);

CREATE INDEX IF NOT EXISTS idx_validator_report_draft
  ON public.validator_report(item_draft_id);

CREATE INDEX IF NOT EXISTS idx_user_responses_draft
  ON public.user_responses(item_draft_id);
