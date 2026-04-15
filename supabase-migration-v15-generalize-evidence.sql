-- Migration v15: Generalize evidence tables for multiple review sources
-- Adds `source` column to di_episode and di_evidence_item so both
-- Divine Intervention and UWorld Inner Circle (and future sources) share one schema.

-- 1. Add source column to di_episode
ALTER TABLE public.di_episode
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'divine_intervention';

-- 2. Add source column to di_evidence_item
ALTER TABLE public.di_evidence_item
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'divine_intervention';

-- 3. Index for source-filtered queries
CREATE INDEX IF NOT EXISTS idx_di_evidence_source ON public.di_evidence_item(source);
CREATE INDEX IF NOT EXISTS idx_di_episode_source ON public.di_episode(source);

-- 4. Composite index for the primary access pattern: source + topic
CREATE INDEX IF NOT EXISTS idx_di_evidence_source_topic
  ON public.di_evidence_item USING gin(topic_tags) WHERE source IS NOT NULL;
