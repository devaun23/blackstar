-- ============================================
-- Migration v30 — Adversarial validators (B1, B2)
-- ============================================
--
-- Adds two new validator types and two new agent types to support the
-- adversarial-student (B1) and jury battle-test (B2) validators introduced
-- in the v27 quality push.
--
-- Apply order: AFTER v29-item-analysis.sql.
--
-- This migration is REQUIRED before the new validators can persist
-- validator_report rows. Without it, attempted writes will fail with
-- "invalid input value for enum". The agents themselves (and B6's
-- re-validate-draft.ts script in dry-run mode) work without it — only
-- pipeline integration (B4) needs the migration applied.

-- Postgres enums use ADD VALUE; cannot be wrapped in a transaction with
-- subsequent uses of the same value. Apply this migration on its own.

alter type public.validator_type add value if not exists 'adversarial_student';
alter type public.validator_type add value if not exists 'jury';

alter type public.agent_type add value if not exists 'adversarial_student_validator';
alter type public.agent_type add value if not exists 'jury_validator';

-- Verification queries (manual, after applying):
--
--   select unnest(enum_range(null::validator_type));
--   -- should include 'adversarial_student' and 'jury'
--
--   select unnest(enum_range(null::agent_type));
--   -- should include 'adversarial_student_validator' and 'jury_validator'
