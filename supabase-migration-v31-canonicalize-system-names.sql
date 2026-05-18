-- ============================================
-- Migration v31 — Canonicalize blueprint_node system names
-- ============================================
--
-- Cleans up duplicate system labels that crept into the DB via ad-hoc
-- inserts (scripts/test-factory.ts pre-2026-05-17 used non-canonical
-- labels like 'Endocrine', 'Pulmonology', 'Neurology'). After this
-- migration and the manual collision reconciliation, the planner
-- pre-flight (A4) can flip from cellExistenceGate='warn' to 'strict'.
--
-- Apply order: AFTER v30-adversarial-validators.sql.
--
-- Canonical mapping (per BLACKSTAR_BLUEPRINT_COVERAGE.md and
-- src/lib/factory/seeds/nbme-content-outline.ts):
--   Cardiovascular   → Cardiology
--   Endocrine        → Endocrinology
--   Renal            → Nephrology
--   Neurology        → Neurology-within-IM
--   Gastrointestinal → Gastroenterology
--   Pulmonology      → Pulmonary
--
-- Two-part structure:
--   PART A — bulk UPDATE for rows with NO canonical-twin collision.
--            Each statement targets a specific node ID so a colliding
--            row in the same system bucket can't block the safe ones.
--   PART B — manual reconciliation for COLLISION rows. Each pair
--            consists of (wrong_id, canonical_id) where both rows
--            currently exist with the same (shelf, topic, subtopic,
--            task_type, clinical_setting, age_group) but different
--            system labels. Decide which to keep, migrate FKs, delete
--            the other.

-- ─── PART A — safe ID-targeted UPDATEs (8 rows) ───
-- These rows have no canonical-twin; UPDATE is safe.

update public.blueprint_node set system = 'Cardiology'           where id = '9d909a18-7619-43ad-8d74-7d994b6b9446'; -- CHF Exacerbation, next_step/inpatient/elderly
update public.blueprint_node set system = 'Cardiology'           where id = '2da1d82e-9739-47fb-9bc5-98c217ca2283'; -- ACS, next_step/ed/middle_aged
update public.blueprint_node set system = 'Endocrinology'        where id = '5dc73f15-71ac-475c-aac5-4b727c040f31'; -- HHS, stabilization/icu/elderly
update public.blueprint_node set system = 'Endocrinology'        where id = 'd6392143-d980-4ff7-a4eb-790f6a8bb2f6'; -- DKA, stabilization/ed/young_adult
update public.blueprint_node set system = 'Neurology-within-IM'  where id = 'fabb233a-bb13-4d1c-8b96-af0bade39e16'; -- Stroke, next_step/ed/elderly
update public.blueprint_node set system = 'Neurology-within-IM'  where id = 'c982adb0-20c4-49d8-a22f-79beaba828a1'; -- TIA, risk_identification/ed/elderly
update public.blueprint_node set system = 'Gastroenterology'     where id = '3bd0e6de-e7ae-48ec-bde9-eb93ab809997'; -- GI Bleed, stabilization/ed/elderly
update public.blueprint_node set system = 'Gastroenterology'     where id = '7d5dcc46-f493-40c4-b5c3-ab2048baef7c'; -- Cirrhosis/SBP, next_step/inpatient/middle_aged

-- ─── PART B — collision reconciliation (5 rows) ───
--
-- For each pair, the wrong-named row and a canonical-named row share
-- the same (shelf, topic, subtopic, task_type, clinical_setting, age_group)
-- unique key. Decision: keep one, migrate FKs to it, delete the other.
--
-- Default recommendation: KEEP THE CANONICAL ID (it matches the seed),
-- migrate item_draft / case_plan / item_plan / etc. references from
-- wrong_id to canonical_id, then DELETE wrong_id.
--
-- Run the FK survey query below for each (wrong_id) before deleting:
--
--   select 'item_draft' as t, count(*) from item_draft where blueprint_node_id = '<wrong_id>'
--   union all select 'item_plan', count(*) from item_plan where blueprint_node_id = '<wrong_id>'
--   union all select 'case_plan', count(*) from case_plan where blueprint_node_id = '<wrong_id>'
--   union all select 'algorithm_card', count(*) from algorithm_card where blueprint_node_id = '<wrong_id>';
--
-- Then for each non-zero count, update the FK to canonical_id:
--
--   update item_draft     set blueprint_node_id = '<canonical_id>' where blueprint_node_id = '<wrong_id>';
--   update item_plan      set blueprint_node_id = '<canonical_id>' where blueprint_node_id = '<wrong_id>';
--   update case_plan      set blueprint_node_id = '<canonical_id>' where blueprint_node_id = '<wrong_id>';
--   update algorithm_card set blueprint_node_id = '<canonical_id>' where blueprint_node_id = '<wrong_id>';
--
-- Finally, delete the wrong row:
--
--   delete from blueprint_node where id = '<wrong_id>';
--
-- Collision pairs (from pre-check 2026-05-17):
--
--   1. Syncope                | diagnostic_test/ed/elderly             | wrong=b77c3fba canonical=824ed241
--   2. Infective Endocarditis | diagnostic_test/inpatient/young_adult  | wrong=2a768d38 canonical=c78764e7
--   3. Hypercalcemia          | diagnostic_test/inpatient/elderly      | wrong=691c56ce canonical=1863becd
--   4. Acute Kidney Injury    | diagnostic_test/inpatient/elderly      | wrong=e19ceaef canonical=423941e3
--   5. Acute Pancreatitis     | diagnostic_test/ed/middle_aged         | wrong=2e643774 canonical=ace89135

-- ─── Post-apply verification ───
--
--   select system, count(*) from blueprint_node group by system order by count(*) desc;
--   -- Should NOT include any of: Cardiovascular, Endocrine, Renal, Neurology,
--   -- Gastrointestinal, Pulmonology
--
--   -- Once verified clean, flip A4's default in src/lib/factory/agents/item-planner.ts:
--   --   const gateMode = input.cellExistenceGate ?? 'warn';  →  'strict'
