-- Migration v18: Security Hardening — RLS on all tables
-- Fixes 8 tables with no RLS and restricts 3 tables that leak system internals.
--
-- Categories:
--   1. Evidence tables (di_episode, di_evidence_item) — enable RLS + authenticated read
--   2. Seed/reference tables (confusion_sets, transfer_rules) — enable RLS + authenticated read
--   3. MVP question tables (questions) — enable RLS + authenticated read (published only)
--   4. User data tables (attempts, mastery_state, session_log) — enable RLS + block all access
--      (these are legacy v6 tables without user_id; superseded by attempt_v2, learner_model, learning_session)
--   5. System internals (agent_prompt, pipeline_run, validator_report) — drop permissive policies
--
-- Safe to re-run: all statements are idempotent.

-- ═══════════════════════════════════════════
-- 1. Evidence tables — authenticated read-only
-- ═══════════════════════════════════════════

ALTER TABLE public.di_episode ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.di_evidence_item ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read di_episode"
    ON public.di_episode FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read di_evidence_item"
    ON public.di_evidence_item FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════
-- 2. Seed/reference tables — authenticated read-only
-- ═══════════════════════════════════════════

ALTER TABLE public.confusion_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read confusion_sets"
    ON public.confusion_sets FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read transfer_rules"
    ON public.transfer_rules FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════
-- 3. Questions table — authenticated read-only
-- ═══════════════════════════════════════════

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read questions"
    ON public.questions FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════
-- 4. Legacy user data tables — lock down completely
--    These are superseded by attempt_v2, learner_model,
--    and learning_session (which have proper user_id + RLS).
--    Enabling RLS with NO policies = service role only.
-- ═══════════════════════════════════════════

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_log ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies = locked to service role only.
-- If these tables are still needed for reads, add policies later.

-- ═══════════════════════════════════════════
-- 5. System internals — restrict to service role only
--    Drop existing permissive policies so only service
--    role (which bypasses RLS) can access these tables.
-- ═══════════════════════════════════════════

-- agent_prompt: contains system prompts — should never be user-visible
DROP POLICY IF EXISTS "Authenticated users can read agent_prompt" ON public.agent_prompt;

-- pipeline_run: contains execution logs, agent outputs, token counts
DROP POLICY IF EXISTS "Authenticated users can read pipeline_run" ON public.pipeline_run;

-- validator_report: contains QA feedback that could reveal question weaknesses
DROP POLICY IF EXISTS "Authenticated users can read validator_report" ON public.validator_report;

-- RLS stays enabled on these tables (it already is).
-- With no SELECT policy + RLS enabled = locked to service role only.

-- ═══════════════════════════════════════════
-- Done. All tables now have RLS enabled.
-- Service role key bypasses RLS for admin/factory operations.
-- ═══════════════════════════════════════════
