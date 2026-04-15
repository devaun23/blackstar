-- Migration v17: USPSTF Screening Recommendations
-- Dedicated structured table for preventive screening guidelines.
-- Queryable by condition, test, age, sex, risk group for agent retrieval.

-- 1. Create enum for USPSTF recommendation grades
CREATE TYPE public.uspstf_grade AS ENUM ('A', 'B', 'C', 'D', 'I');

-- 2. Screening recommendations table
CREATE TABLE IF NOT EXISTS public.uspstf_screening (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  display_id text NOT NULL UNIQUE,

  -- Condition & Test
  condition text NOT NULL,
  screening_test text NOT NULL,

  -- Population qualifiers
  sex text,                                   -- 'female', 'male', or null (both)
  age_start integer,                          -- Lower bound (nullable)
  age_end integer,                            -- Upper bound (nullable)
  risk_group text,                            -- 'general', 'smoker_20py', 'FAP', 'Lynch', etc.
  population_detail text,                     -- Free text population description

  -- Recommendation
  grade public.uspstf_grade NOT NULL,
  is_recommended boolean NOT NULL DEFAULT true,
  frequency_text text,                        -- 'Every 2 years', 'Annually', 'Once'
  frequency_months integer,                   -- Normalized integer for range queries

  -- Additional context
  special_notes text,
  topic_tags text[] NOT NULL DEFAULT '{}',

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes for agent query patterns
CREATE INDEX IF NOT EXISTS idx_uspstf_condition ON public.uspstf_screening(condition);
CREATE INDEX IF NOT EXISTS idx_uspstf_grade ON public.uspstf_screening(grade);
CREATE INDEX IF NOT EXISTS idx_uspstf_age_range ON public.uspstf_screening(age_start, age_end);
CREATE INDEX IF NOT EXISTS idx_uspstf_sex ON public.uspstf_screening(sex);
CREATE INDEX IF NOT EXISTS idx_uspstf_risk_group ON public.uspstf_screening(risk_group);
CREATE INDEX IF NOT EXISTS idx_uspstf_topic ON public.uspstf_screening USING gin(topic_tags);

-- 4. Auto-update trigger
CREATE TRIGGER set_uspstf_updated_at
  BEFORE UPDATE ON public.uspstf_screening
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. RLS
ALTER TABLE public.uspstf_screening ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read uspstf_screening"
  ON public.uspstf_screening FOR SELECT
  TO authenticated
  USING (true);

-- 6. Register USPSTF in source_registry
INSERT INTO public.source_registry (category, name, allowed_use, priority_rank, url, notes)
VALUES (
  'guideline',
  'USPSTF Screening Recommendations',
  'content',
  22,
  'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics',
  'Preventive screening guidelines. Primary source for age/sex-specific cancer screening, metabolic screening, and risk-factor-based screening questions.'
)
ON CONFLICT (name) DO NOTHING;
