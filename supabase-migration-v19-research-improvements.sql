-- ============================================
-- Migration v19: Research-backed improvements
-- Self-consistency sampling + IRT calibration columns
-- ============================================

-- 1. Self-consistency sampling: consistency_score on validator_report
-- Binary entropy of pass/fail across N samples (0 = unanimous, 1.0 = max uncertainty)
-- Research: Cohen's d = 0.90 between correct/incorrect items on this metric
ALTER TABLE public.validator_report
  ADD COLUMN IF NOT EXISTS consistency_score numeric(4,3);

-- 2. IRT calibration columns on item_performance
-- item_difficulty (b): proportion incorrect, calibrated via 2PL model
-- item_guessing (c): lower asymptote, fixed at 0.200 for 5-choice MCQ
-- Calibrate via 2PL IRT when item has 50+ responses
ALTER TABLE public.item_performance
  ADD COLUMN IF NOT EXISTS item_difficulty numeric(5,4),
  ADD COLUMN IF NOT EXISTS item_guessing numeric(4,3) DEFAULT 0.200;

-- 3. Add review_status to item_draft if not exists
-- Supports 'pending_review' (default) and 'flagged_uncertain' (self-consistency flag)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'item_draft' AND column_name = 'review_status'
  ) THEN
    ALTER TABLE public.item_draft ADD COLUMN review_status text DEFAULT 'pending_review';
  END IF;
END $$;

-- Index for flagged items (human review queue)
CREATE INDEX IF NOT EXISTS idx_item_draft_review_status
  ON public.item_draft(review_status)
  WHERE review_status = 'flagged_uncertain';

-- Index for IRT auto-retire query (discrimination < 0.5)
CREATE INDEX IF NOT EXISTS idx_item_performance_discrimination
  ON public.item_performance(discrimination_index)
  WHERE retired = false;
