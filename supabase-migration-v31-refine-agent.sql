-- Migration v31: refine_agent enum value
--
-- Adds 'refine_agent' to the agent_type enum so pipeline-v2's refine-loop
-- step (post-rubric-decision Piece 2b) can write 'refine_agent' to
-- pipeline_run.current_agent and agent_log entries without violating the
-- enum check.
--
-- The refine-agent itself uses an inline SYSTEM_PROMPT (see
-- src/lib/factory/agents/refine-agent.ts) — it does NOT depend on a DB
-- agent_prompt row. This migration is purely about the enum.
--
-- Apply order: AFTER v29-item-analysis.sql and v30-adversarial-validators.sql.
-- Postgres requires ALTER TYPE ADD VALUE to run outside a transaction with
-- subsequent uses, so this migration is intentionally single-statement.

ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'refine_agent';

-- Verification (manual, after applying):
--   select unnest(enum_range(null::agent_type));
--   -- should include 'refine_agent'
