-- ============================================
-- Migration v20: IRT plumbing + variant tracking
--
-- Research basis:
-- - Time-sensitive IRT (Applied Sciences, Jun 2025): subtractive time-based
--   adjustments improve ability estimation over standard 1PL.
-- - Variant generation (BMC, Price et al. 2025): different questions testing
--   the same transfer rule prevent memorization in spaced repetition.
--
-- All columns nullable or defaulted — no breaking changes to existing data.
-- ============================================

-- 1. learner_ability: per-user, per-dimension IRT theta estimates
-- Separate from learner_model because theta requires calibration (50+ responses)
-- while mastery_level updates immediately. They serve different purposes:
-- mastery_level = Bayesian estimate for scheduling, theta = IRT estimate for measurement.
CREATE TABLE IF NOT EXISTS public.learner_ability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension_type text NOT NULL,          -- reuses dimension_type enum values
  dimension_id uuid NOT NULL,
  theta_ability numeric(6,4) DEFAULT 0.0,  -- ability estimate in logits
  se_theta numeric(6,4) DEFAULT 1.0,       -- standard error of theta (shrinks with more data)
  response_count int DEFAULT 0,
  last_calibrated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dimension_type, dimension_id)
);

-- RLS: users can only read their own ability estimates
ALTER TABLE public.learner_ability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ability" ON public.learner_ability
  FOR SELECT USING (auth.uid() = user_id);

-- Index for the common lookup pattern: get all abilities for a user in a dimension
CREATE INDEX IF NOT EXISTS idx_learner_ability_user_dim
  ON public.learner_ability(user_id, dimension_type);

-- 2. Response-time calibration columns on item_performance
-- These support time-sensitive IRT models (DTA-IRT, TP-IRT) once calibrated.
ALTER TABLE public.item_performance
  ADD COLUMN IF NOT EXISTS expected_response_time_ms int,
  ADD COLUMN IF NOT EXISTS time_discrimination numeric(5,4);

-- 3. variant_group_id on item_draft
-- Groups items that test the same transfer_rule with different clinical surface features.
-- Used by the selector to serve unseen variants instead of repeated questions.
ALTER TABLE public.item_draft
  ADD COLUMN IF NOT EXISTS variant_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_item_draft_variant_group
  ON public.item_draft(variant_group_id)
  WHERE variant_group_id IS NOT NULL;

-- 4. updated_at trigger for learner_ability
CREATE OR REPLACE FUNCTION public.update_learner_ability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_learner_ability_updated
  BEFORE UPDATE ON public.learner_ability
  FOR EACH ROW EXECUTE FUNCTION public.update_learner_ability_timestamp();
