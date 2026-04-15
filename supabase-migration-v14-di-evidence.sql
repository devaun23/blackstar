-- Migration v14: Divine Intervention Evidence Layer
-- Stores parsed DI podcast episode content as atomic, topic-tagged evidence items
-- for direct retrieval by case_planner, vignette_writer, and explanation_writer agents.

-- 1. Episode metadata table
CREATE TABLE IF NOT EXISTS public.di_episode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_number integer NOT NULL,
  title text NOT NULL,
  shelf text,
  topic_tags text[] NOT NULL DEFAULT '{}',
  source_file text NOT NULL,
  total_items integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'divine_intervention',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, episode_number)
);

-- 2. Atomic evidence items table
CREATE TABLE IF NOT EXISTS public.di_evidence_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES public.di_episode(id) ON DELETE CASCADE,

  -- Content identity
  item_type text NOT NULL,           -- clinical_pearl, comparison_table, mnemonic, risk_factor,
                                     -- treatment_protocol, pharmacology, pathophysiology, diagnostic_criterion
  section_heading text NOT NULL,     -- The # heading this item came from

  -- The extracted content
  claim text NOT NULL,               -- Normalized single-sentence claim
  raw_text text NOT NULL,            -- Original markdown text (audit trail)

  -- Structured fields (nullable, type-dependent)
  trigger_presentation text,         -- "Patient presents with X" trigger
  association text,                  -- "X -> Y" high-yield association
  differential jsonb,                -- For comparison items: [{condition, features}]
  mnemonic_text text,                -- The mnemonic itself

  -- Routing
  topic_tags text[] NOT NULL DEFAULT '{}',  -- Normalized to Blackstar blueprint_node.topic values
  shelf text,

  -- Identity
  display_id text NOT NULL UNIQUE,   -- 'DI.029.003' or 'IC.004.012' format (source.section.item)
  source text NOT NULL DEFAULT 'divine_intervention',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_di_evidence_topic ON public.di_evidence_item USING gin(topic_tags);
CREATE INDEX IF NOT EXISTS idx_di_evidence_type ON public.di_evidence_item(item_type);
CREATE INDEX IF NOT EXISTS idx_di_evidence_episode ON public.di_evidence_item(episode_id);
CREATE INDEX IF NOT EXISTS idx_di_episode_shelf ON public.di_episode(shelf);
