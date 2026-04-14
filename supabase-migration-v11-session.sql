-- v11: Learning Session Management
-- Adds server-side session tracking for 3-mode learning engine (retention, training, assessment)

-- Session mode enum
DO $$ BEGIN
  CREATE TYPE public.session_mode AS ENUM ('retention', 'training', 'assessment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Session status enum
DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('active', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Learning session table
CREATE TABLE IF NOT EXISTS public.learning_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode session_mode NOT NULL,
  status session_status NOT NULL DEFAULT 'active',
  target_count INT NOT NULL DEFAULT 20,
  completed_count INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  -- Training mode: which weakness is being targeted
  target_dimension_type dimension_type,
  target_dimension_id TEXT,
  -- Assessment mode: time limit in seconds (null = untimed)
  time_limit_seconds INT,
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_session_user_status
  ON public.learning_session (user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_session_user_mode
  ON public.learning_session (user_id, mode);

-- RLS
ALTER TABLE public.learning_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.learning_session FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.learning_session FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.learning_session FOR UPDATE
  USING (auth.uid() = user_id);

-- Add session_mode to attempt_v2
ALTER TABLE public.attempt_v2 ADD COLUMN IF NOT EXISTS session_mode session_mode;

-- Add metacognitive fields to attempt_v2 (Phase 6, but adding now to avoid a second migration)
ALTER TABLE public.attempt_v2 ADD COLUMN IF NOT EXISTS confidence_post INT CHECK (confidence_post BETWEEN 1 AND 5);
ALTER TABLE public.attempt_v2 ADD COLUMN IF NOT EXISTS self_labeled_error TEXT;
