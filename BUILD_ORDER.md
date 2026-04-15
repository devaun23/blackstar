# Build Order

## Purpose

Sequenced build contract. Each step must be verified before the next begins. No step-skipping.

## Scope

All Step 2 CK content and all shelf exams. The database is built comprehensively; question generation focuses on one shelf at a time. The original 20 IM topics (Phase 1) remain the first generation targets.

## Status Legend

- [x] Complete
- [~] In progress
- [ ] Not started

---

## Block A: Foundation (Schema + Types + Seed + Governance)

### Step 1: Database schema
- [x] `supabase-schema.sql` — 13 tables, 15 enums, RLS policies, triggers
- [x] Schema synced with all type changes (subtopic, frequency/discrimination scores, severity_markers, card_status, exam_translation)
- [x] Schema applied to Supabase
- [x] Migration v3 applied (card_status enum, algorithm_card.status, exam_translation enums)

### Step 2: TypeScript types
- [x] `src/lib/types/database.ts` — Raw row types matching schema (includes CardStatus, expanded AgentType/ValidatorType)
- [x] `src/lib/types/factory.ts` — Domain types from Zod

### Step 3: Zod validation schemas
- [x] `src/lib/factory/schemas/*.ts` — 6 core object schemas
- [x] Schemas synced with type changes (subtopic, frequency/discrimination, time_horizon, severity_markers, exam_translation)

### Step 4: Seed data
- [x] `src/lib/factory/seeds/blueprint-nodes.ts` — 136 medicine blueprint nodes (Phase 1 batch)
- [x] `src/lib/factory/seeds/error-taxonomy.ts` — 12 cognitive errors
- [x] `src/lib/factory/seeds/source-registry.ts` — Scope + Content sources
- [x] `src/lib/factory/seeds/agent-prompts.ts` — All 12 agent prompts (including exam_translation_validator)

### Step 5: Seed API route
- [x] `src/app/api/factory/seed/route.ts` — POST handler, admin-protected, idempotent upsert

### Governance Documents
- [x] `PRODUCT_VISION.md` — Mission, principles, anti-patterns, success criteria
- [x] `SOURCE_POLICY.md` — Scope + Content source rules, hard boundaries
- [x] `REJECTION_RULES.md` — Auto-kill criteria (19 rules, 7 categories)
- [x] `MEDICINE_TOPICS.csv` — Topic registry with phase tags (Phase 1: 20 IM topics)
- [x] `ALGORITHM_CARD_SPEC.md` — What makes a card board-testable, status lifecycle, acceptance criteria
- [x] `AGENT_CONTRACTS.md` — Per-agent role, inputs, outputs, may/may-not-decide, pass/fail
- [x] `REPAIR_POLICY.md` — Kill thresholds, repairable vs discard failures, per-validator consecutive fail limits
- [x] `MEDICINE_FORK_TARGETS.csv` — Fork counts per topic (65 total forks across Phase 1 topics)

**Verification:** `npx tsc --noEmit --strict` passes. All Supabase tables and enums verified.

---

## Block B: Agent Framework (Claude + Pipeline)

### Step 6: Claude client
- [x] `src/lib/factory/claude.ts` — SDK wrapper with retry, JSON extraction, Zod validation
- [ ] Mock mode (activate when ANTHROPIC_API_KEY unset or MOCK_AGENTS=true)

### Step 7: Base agent + prompt loader
- [x] `src/lib/factory/agent-helpers.ts` — runAgent skeleton
- [x] `src/lib/factory/prompts.ts` — fetchActivePrompt + fillTemplate

### Step 8: All agents
- [x] `src/lib/factory/agents/blueprint-selector.ts`
- [x] `src/lib/factory/agents/algorithm-extractor.ts`
- [x] `src/lib/factory/agents/item-planner.ts`
- [x] `src/lib/factory/agents/vignette-writer.ts`
- [x] `src/lib/factory/agents/medical-validator.ts`
- [x] `src/lib/factory/agents/blueprint-validator.ts`
- [x] `src/lib/factory/agents/nbme-quality-validator.ts`
- [x] `src/lib/factory/agents/option-symmetry-validator.ts`
- [x] `src/lib/factory/agents/explanation-validator.ts`
- [x] `src/lib/factory/agents/exam-translation-validator.ts`
- [x] `src/lib/factory/agents/repair-agent.ts`
- [x] `src/lib/factory/agents/explanation-writer.ts`

### Step 9: Pipeline orchestrator
- [x] `src/lib/factory/pipeline.ts` — State machine with 6-validator loop (includes exam_translation), repair cycles, publish

**Verification:** Pipeline compiles. Mock mode runs end-to-end (pending mock implementation).

---

## Block C: Algorithm Card Proving Ground

**Goal:** Prove the algorithm extractor produces board-testable cards, not guideline summaries.

### Step 10: Seed database
- [ ] Run `POST /api/factory/seed` to populate blueprint nodes, error taxonomy, sources, agent prompts

### Step 11: Test algorithm extraction on 3 topics
- [ ] Acute Pancreatitis
- [ ] Cirrhosis / SBP
- [ ] GI Bleed

For each topic:
- [ ] Algorithm extractor produces a card
- [ ] Card satisfies ALGORITHM_CARD_SPEC.md acceptance criteria
- [ ] Medical validator confirms source accuracy → card status: `truth_verified`
- [ ] Exam translation validator confirms fork quality → card status: `translation_verified`
- [ ] Card promoted to `generation_ready`

**Gate:** Do NOT proceed to Block D until at least 3 cards are `generation_ready`.

### Step 12: Add algorithm card review queue
- [ ] Pipeline enforces: item_planner only pulls `generation_ready` cards
- [ ] If a card produces 3+ killed items, auto-downgrade to `draft`
- [ ] Manual audit page or script showing card status progression

---

## Block D: Item Generation (3-topic pilot)

### Step 13: Run end-to-end pipeline on 3 topics
- [ ] Full pipeline: select → extract → plan → write → validate (6 validators) → repair → explain → publish
- [ ] Multiple items pass all validators
- [ ] Failures are interpretable (validator reports show clear issues)
- [ ] Repaired items improve meaningfully (not identical output)

**Gate:** Do NOT broaden beyond 3 topics until pass rate ≥ 40% and kill rate is 10-30%.

---

## Block E: Broadening (shelf by shelf)

### Step 14: Expand to all Phase 1 IM topics
- [ ] Generate algorithm cards for remaining 17 IM topics
- [ ] Verify card quality via translation validator
- [ ] Run pipeline at scale

### Step 15: Add next shelf (Surgery, Peds, OB/GYN, Psych)
- [ ] Add blueprint nodes for target shelf
- [ ] Seed algorithm cards
- [ ] Run pipeline, validate quality matches IM baseline

---

## Block F: API + UI (only after system stability)

### Step 16: Factory API routes
- [x] `POST /api/factory/run` — Trigger pipeline
- [x] `GET /api/factory/blueprints` — List/filter blueprint nodes
- [x] `GET /api/factory/item-drafts` — List drafts by status
- [ ] `GET /api/factory/run/[runId]` — Run status + agent trace

### Step 17: Student API routes
- [x] `GET /api/questions` — Published questions (RLS-filtered)
- [x] `POST /api/responses` — Submit answer, compute correctness

### Step 18: Audit / Debug UI
- [ ] Pipeline trace viewer (per-draft: blueprint → card → plan → draft → reports → repairs)
- [ ] Algorithm card review queue
- [ ] Kill analysis dashboard

### Step 19: Dashboard UI
- [ ] `src/app/(dashboard)/layout.tsx` — Sidebar layout
- [ ] Factory control panel
- [ ] Question browser

---

## Current Priority

1. **Build comprehensive content database** — ingest all Inner Circle, DI, and source material across all shelves
2. **Seed database** (Step 10) — populate all tables
3. **Test algorithm extraction on 3 topics** (Step 11) — prove the translation layer works
4. **Algorithm card review queue** (Step 12) — enforce generation_ready gate
