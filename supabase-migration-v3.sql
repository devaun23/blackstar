-- Blackstar: Migration v3 — Add exam_translation validator + algorithm card statuses
-- Run this in Supabase SQL Editor AFTER the main schema is applied
-- URL: https://supabase.com/dashboard/project/kyoucwvolfokrzzrrfxm/sql/new

-- 1. Add card_status enum
CREATE TYPE public.card_status AS ENUM (
  'draft', 'truth_verified', 'translation_verified', 'generation_ready', 'retired'
);

-- 2. Add status and updated_at to algorithm_card
ALTER TABLE public.algorithm_card
  ADD COLUMN IF NOT EXISTS status public.card_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- 3. Add updated_at trigger for algorithm_card
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.algorithm_card
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Add index for card status
CREATE INDEX IF NOT EXISTS idx_algorithm_card_status
  ON public.algorithm_card (status);

-- 5. Add exam_translation to validator_type enum
ALTER TYPE public.validator_type ADD VALUE IF NOT EXISTS 'exam_translation';

-- 6. Add exam_translation_validator to agent_type enum
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'exam_translation_validator';
