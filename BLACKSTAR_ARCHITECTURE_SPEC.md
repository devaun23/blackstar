# Blackstar Architecture Specification
## Complete System Reference — Nothing Missing

**Version:** 2.0 (Post-Structured Generation Schema)
**Date:** 2026-04-02
**Status:** Migrations v7-v12 applied. 3 test runs complete. Learner engine wired.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Map](#2-architecture-map)
3. [Database Schema](#3-database-schema)
4. [Generation Pipeline V2](#4-generation-pipeline-v2)
5. [Agent Inventory](#5-agent-inventory)
6. [Zod Schemas](#6-zod-schemas)
7. [Seed Data](#7-seed-data)
8. [Adaptive Learner Engine](#8-adaptive-learner-engine)
9. [API Surface](#9-api-surface)
10. [Study UI](#10-study-ui)
11. [Infrastructure](#11-infrastructure)
12. [Migrations](#12-migrations)
13. [Scripts & Harness](#13-scripts--harness)
14. [Governance Documents](#14-governance-documents)
15. [Generated Output](#15-generated-output)
16. [Type System](#16-type-system)
17. [File Inventory](#17-file-inventory)
18. [Dependencies](#18-dependencies)
19. [Test Results](#19-test-results)
20. [What Works vs What's Next](#20-what-works-vs-whats-next)

---

## 1. System Overview

Blackstar is an AI-powered NBME question factory for USMLE Step 2 CK with adaptive delivery. It solves three coupled problems simultaneously:

1. **Stem design** — hinge clue at exactly the right depth
2. **Distractor design** — every wrong option = a named cognitive error
3. **Explanation design** — teaches the transfer rule, not just justifies the answer

### Core Innovation: Structured Generation Schema

Questions are NOT generated in one shot. Instead, a **forced sequential schema** ensures coupling:

```
case_plan (declares cognitive operation + transfer rule + hinge depth)
  → skeleton (every wrong option has cognitive_error_id + hinge has depth + buried_by)
    → vignette (constrained by skeleton)
      → explanation (references declared transfer rule, doesn't invent one)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 + React 19 |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| AI | Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`) |
| Validation | Zod 4.3.6 |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5 (strict mode) |

---

## 2. Architecture Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BLACKSTAR ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─── LAYER 1: CONTENT GRAPH (Seeds) ──────────────────────────┐   │
│  │  135 blueprint nodes  ·  12 cognitive errors                 │   │
│  │  22 confusion sets    ·  18 transfer rules                   │   │
│  │  20 pattern families  ·  10 hinge clue types                 │   │
│  │  9 action classes     ·  20 alternate terminology             │   │
│  │  Tier A/B/C source registry (21 sources)                     │   │
│  │  21 agent prompts (14 agents, versioned)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─── LAYER 2: GENERATION PIPELINE (V2) ───────────────────────┐   │
│  │                                                              │   │
│  │  blueprint_selector ──▶ algorithm_extractor                  │   │
│  │                              │                                │   │
│  │                         card + facts                          │   │
│  │                              │                                │   │
│  │                    ┌─── STRUCTURED GENERATION ────┐           │   │
│  │                    │  case_planner                │           │   │
│  │                    │  (cognitive_operation_type,   │           │   │
│  │                    │   transfer_rule_text,         │           │   │
│  │                    │   hinge_depth_target,         │           │   │
│  │                    │   target_cognitive_error_id)  │           │   │
│  │                    │         │                     │           │   │
│  │                    │  skeleton_writer              │           │   │
│  │                    │  (cognitive_error_id REQUIRED │           │   │
│  │                    │   per distractor,             │           │   │
│  │                    │   hinge_depth + buried_by)    │           │   │
│  │                    │         │                     │           │   │
│  │                    │  skeleton_validator           │           │   │
│  │                    │  (hard gate: no nulls,        │           │   │
│  │                    │   no duplicate errors,        │           │   │
│  │                    │   depth must match plan)      │           │   │
│  │                    └─────────────────────────────┘           │   │
│  │                              │                                │   │
│  │                    item_planner                                │   │
│  │                              │                                │   │
│  │                    vignette_writer                             │   │
│  │                    (renders from skeleton)                     │   │
│  │                              │                                │   │
│  │               ┌── VALIDATION LOOP (max 3 cycles) ──┐         │   │
│  │               │  medical_validator       (accuracy) │         │   │
│  │               │  blueprint_validator     (scope)    │         │   │
│  │               │  nbme_quality_validator  (format)   │         │   │
│  │               │  option_symmetry_validator (opts)   │         │   │
│  │               │  explanation_validator   (explain)  │         │   │
│  │               │  exam_translation_validator (fork)  │         │   │
│  │               │           │                         │         │   │
│  │               │    repair_agent (if failed)         │         │   │
│  │               └─────────────────────────────────────┘         │   │
│  │                              │                                │   │
│  │                    explanation_writer v3                       │   │
│  │                    (anchored to transfer_rule_text             │   │
│  │                     from case_plan — NOT invented)             │   │
│  │                              │                                │   │
│  │                         PUBLISH                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                    published item_draft                              │
│                    (case_plan + skeleton + error_map)                │
│                              │                                      │
│  ┌─── LAYER 3: ADAPTIVE LEARNER ENGINE ────────────────────────┐   │
│  │                                                              │   │
│  │  /api/study/next ──▶ selector.ts                             │   │
│  │       │     picks question by weakest dimension              │   │
│  │       │     (6 types: topic, error, confusion,               │   │
│  │       │      transfer, action_class, hinge_clue_type)        │   │
│  │       │     normalizes item_draft → study UI shape            │   │
│  │       │     builds error_map from skeleton archetypes         │   │
│  │       │     includes transfer_rule_text from case_plan        │   │
│  │       ▼                                                      │   │
│  │  student answers                                             │   │
│  │       │                                                      │   │
│  │       ▼                                                      │   │
│  │  /api/study/attempt-v2 ──▶ records answer                    │   │
│  │       │     extracts 6 dimensions from case_plan              │   │
│  │       │     updates learner_model (Bayesian mastery)          │   │
│  │       │     runs repair-engine diagnosis                      │   │
│  │       │                                                      │   │
│  │       ▼                                                      │   │
│  │  repair-engine.ts                                            │   │
│  │       correct + fast → advance                               │   │
│  │       correct + slow → reinforce                             │   │
│  │       wrong + confusion → contrast                           │   │
│  │       wrong + 3x error → remediate                           │   │
│  │       wrong + high mastery → transfer_test                   │   │
│  │       │                                                      │   │
│  │       ▼                                                      │   │
│  │  scheduler.ts ──▶ spaced repetition                          │   │
│  │       0h → 1d → 3d → 7d → 14d → 30d                         │   │
│  │       mastery modulates by ±50%                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── LAYER 4: STUDY UI ──────────────────────────────────────┐    │
│  │  /study ──▶ session picker (retention/training/assessment)  │    │
│  │  study-session.tsx ──▶ question + answer + feedback          │    │
│  │       tracks questionType ('question' | 'item_draft')       │    │
│  │       passes correct type to attempt-v2                      │    │
│  │  study-feedback.tsx ──▶ error diagnosis + repair action      │    │
│  │  /dashboard ──▶ stats, accuracy, shelf breakdown            │    │
│  │  /practice ──▶ non-adaptive question carousel               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─── LAYER 5: INFRASTRUCTURE ─────────────────────────────────┐   │
│  │  Supabase: 20+ tables, 30+ enums, RLS policies             │   │
│  │  Anthropic: Claude Sonnet 4 via @anthropic-ai/sdk           │   │
│  │  Next.js 16 + React 19 + Zod 4 + Tailwind 4                │   │
│  │  Agent prompts: DB-stored, versioned, hot-swappable         │   │
│  │  Source packs: 4 authoritative sources (AASLD, ACG, SSC)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Tables (20+)

| Table | Key Columns | FK Dependencies | RLS |
|-------|-------------|-----------------|-----|
| `profiles` | id, full_name, role, target_score | auth.users | Yes |
| `blueprint_node` | id, shelf, system, topic, task_type, clinical_setting, age_group, yield_tier, published_count | content_system | Yes |
| `algorithm_card` | id, blueprint_node_id, entry_presentation, competing_paths, hinge_feature, correct_action, status | blueprint_node | Yes |
| `fact_row` | id, algorithm_card_id, fact_type, fact_text, threshold_value, source_tier, confidence | algorithm_card | Yes |
| `item_plan` | id, algorithm_card_id, target_hinge, competing_options, target_cognitive_error | algorithm_card | Yes |
| `item_draft` | id, item_plan_id, vignette, stem, choice_a-e, correct_answer, why_correct/wrong_*, status, case_plan_id, question_skeleton_id, visual_specs | item_plan, case_plan, question_skeleton | Yes |
| `case_plan` | id, blueprint_node_id, algorithm_card_id, **cognitive_operation_type**, **transfer_rule_text**, **hinge_depth_target**, target_*_id (5 ontology FKs), difficulty (3 dims) | blueprint_node, algorithm_card, ontology tables | Yes |
| `question_skeleton` | id, case_plan_id, case_summary, hidden_target, correct_action, wrong_option_archetypes (JSONB), **hinge_depth**, **hinge_buried_by**, hinge_placement, skeleton_validated | case_plan | Yes |
| `validator_report` | id, item_draft_id, validator_type, passed, score, issues_found, repair_instructions | item_draft | Yes |
| `pipeline_run` | id, blueprint_node_id, status, current_agent, agent_log, total_tokens_used, **validator_summary** | blueprint_node | - |
| `error_taxonomy` | id, error_name, definition, category, frequency_rank, detection_prompt, repair_strategy | - | Yes |
| `confusion_sets` | id, name, concepts, discriminating_clues, common_traps | - | Yes |
| `transfer_rules` | id, rule_text, category, trigger_pattern, action_priority, suppressions, wrong_pathways | - | Yes |
| `hinge_clue_type` | id, name, description, example | - | Yes |
| `action_class` | id, name, priority_rank, description, example_actions | - | Yes |
| `alternate_terminology` | id, nbme_phrasing, clinical_concept, context | - | Yes |
| `cognitive_error_tag` | id, error_taxonomy_id, item_draft_id, option_letter | error_taxonomy, item_draft | Yes |
| `agent_prompts` | id, agent_type, version, is_active, system_prompt, user_prompt_template | - | Yes |
| `learner_model` | id, user_id, dimension_type, dimension_id, mastery_level, total_attempts, correct_count, consecutive_correct, next_review_due, error_frequency | auth.users | Yes (user-scoped) |
| `attempt_v2` | id, user_id, question_id/item_draft_id, selected_answer, is_correct, confidence_pre/post, time_spent_ms, diagnosed_cognitive_error_id, repair_action, session_id | auth.users, item_draft, error_taxonomy | Yes (user-scoped) |
| `learning_session` | id, user_id, mode, status, target_count, completed_count, correct_count | auth.users | Yes (user-scoped) |
| `questions` | id, vignette, stem, option_a-e, correct_answer, error_map, system_topic | - | Yes |
| `source_registry` | id, display_id, source_name, source_tier, url | - | Yes |

### Enums (15+)

| Enum | Values |
|------|--------|
| `shelf` | medicine, surgery, pediatrics, obgyn, psychiatry, family_medicine, neurology, emergency_medicine |
| `task_type` | next_step, diagnostic_test, diagnosis, stabilization, risk_identification, complication_recognition |
| `clinical_setting` | outpatient, inpatient, ed, icu |
| `age_group` | neonate, infant, child, adolescent, young_adult, middle_aged, elderly |
| `time_horizon` | immediate, hours, days, weeks, chronic |
| `yield_tier` | tier_1, tier_2, tier_3 |
| `item_status` | draft, validating, passed, failed, repaired, published, killed |
| `validator_type` | medical, blueprint, nbme_quality, option_symmetry, explanation_quality, exam_translation |
| `agent_type` | blueprint_selector, algorithm_extractor, item_planner, vignette_writer, medical_validator, nbme_quality_validator, blueprint_validator, option_symmetry_validator, explanation_validator, exam_translation_validator, repair_agent, explanation_writer, case_planner, skeleton_writer, skeleton_validator |
| `dimension_type` | topic, transfer_rule, confusion_set, cognitive_error, action_class, hinge_clue_type |
| `repair_action` | advance, reinforce, contrast, remediate, transfer_test |
| `card_status` | draft, truth_verified, translation_verified, generation_ready, retired |
| `pipeline_status` | running, completed, failed, killed |
| `session_mode` | retention, training, assessment |
| `session_status` | active, completed, abandoned |
| `cognitive_operation_type` | rule_application, threshold_recognition, diagnosis_disambiguation, management_sequencing, risk_stratification |
| `hinge_depth` | surface, moderate, deep |

---

## 4. Generation Pipeline V2

### Flow (11 stages)

```
1.  Blueprint Selection
    → blueprintSelector.run() or config.blueprintNodeId
    → Output: BlueprintNodeRow

1.5 Source Sufficiency Gate
    → checkSourceSufficiency(topic)
    → Hard-fail if scoped topic lacks sources

2.  Algorithm Extraction
    → algorithmExtractor.run(node)
    → Output: algorithm_card + fact_rows (3-6)
    → DB: algorithm_card, fact_row tables

3.  Case Planning (STRUCTURED GENERATION)
    → casePlanner.run(node, card, facts, errors, ontology lookups)
    → REQUIRES: cognitive_operation_type, transfer_rule_text, hinge_depth_target, target_cognitive_error_id
    → DB: case_plan table

4.  Skeleton Writing (STRUCTURED GENERATION)
    → skeletonWriter.run(node, card, facts, casePlan)
    → REQUIRES: cognitive_error_id on EVERY wrong option archetype
    → REQUIRES: hinge_depth, hinge_buried_by, hinge_placement, hinge_description
    → DB: question_skeleton table

4.5 Skeleton Validation (HARD GATE)
    → skeletonValidator.run(casePlan, skeleton)
    → FAILS if: any null cognitive_error_id, duplicate errors, hinge depth mismatch
    → DB: updates skeleton.skeleton_validated

5.  Item Planning
    → itemPlanner.run(node, card, facts, errors)
    → DB: item_plan table

6.  Vignette Writing
    → vignetteWriter.run(node, card, plan, facts, skeleton)
    → Skeleton constrains the output
    → DB: item_draft table (status: draft)

6.5 Link Draft to Ontology
    → Sets case_plan_id and question_skeleton_id on item_draft

7.  Validation Loop (max 3 cycles)
    → 6 validators run in parallel:
       medical_validator, blueprint_validator, nbme_quality_validator,
       option_symmetry_validator, explanation_validator, exam_translation_validator
    → Auto-kill if medical score < 3
    → If failed: repair_agent regenerates → re-validate
    → DB: validator_report table per validator per cycle

8.  Explanation Writing
    → explanationWriter.run(draft, card, facts, node, transferRuleText)
    → v3 prompt: anchored to pre-declared transfer_rule_text from case_plan
    → 5-component explanation: decision_logic, hinge_id, error_diagnosis, transfer_rule, teaching_pearl
    → Visual spec generation (optional, from visual coverage map)
    → DB: updates item_draft with explanations + visual_specs

8.5 Visual Spec Validation (soft gate)
    → Invalid specs stripped, never kills item

9.  Publish
    → Status: 'published' (or 'passed' if skipExplanation)
    → Validator summary written to pipeline_run

### Validator Summary (persisted on pipeline_run)
    → { validator_type: { score, passed } } for each validator from final cycle
```

---

## 5. Agent Inventory

| # | Agent | Type | Purpose | Key Input | Key Output | Used In |
|---|-------|------|---------|-----------|------------|---------|
| 1 | blueprint_selector | Generator | Select underserved blueprint node | shelf?, yieldTier? | blueprint_node_id, rationale | v1, v2 |
| 2 | algorithm_extractor | Generator | Build clinical decision algorithm | BlueprintNodeRow | algorithm_card, fact_rows[] | v1, v2 |
| 3 | case_planner | Generator | Declare cognitive operation + transfer rule + hinge depth | node, card, facts, errors, ontology | case_plan (with required fields) | v2 only |
| 4 | skeleton_writer | Generator | Logical structure before prose | node, card, facts, casePlan | question_skeleton (required error IDs) | v2 only |
| 5 | skeleton_validator | Validator | Coherence gate on skeleton | casePlan, skeleton | skeleton_validated, issues[], suggestions[] | v2 only |
| 6 | item_planner | Generator | Question architecture plan | node, card, facts, errors | item_plan | v1, v2 |
| 7 | vignette_writer | Generator | Write NBME-style vignette | node, card, plan, facts, skeleton? | item_draft | v1, v2 |
| 8 | medical_validator | Validator | Clinical accuracy | draft, card, facts, topic? | passed, score, issues, repair_instructions | v1, v2 |
| 9 | blueprint_validator | Validator | Blueprint alignment + scope | draft, node, casePlan? | passed, score, issues, repair_instructions | v1, v2 |
| 10 | nbme_quality_validator | Validator | NBME formatting standards | draft | passed, score, issues, repair_instructions | v1, v2 |
| 11 | option_symmetry_validator | Validator | Answer choice quality | draft, plan, skeleton? | passed, score, issues, repair_instructions | v1, v2 |
| 12 | explanation_validator | Validator | Explanation completeness | draft, card | passed, score, issues, repair_instructions | v1, v2 |
| 13 | exam_translation_validator | Validator | Board-style decision fork | draft, card, node | passed, score, issues, repair_instructions | v1, v2 |
| 14 | repair_agent | Generator | Targeted fixes for failed items | draft, reports[], card, facts | repaired item_draft | v1, v2 |
| 15 | explanation_writer | Generator | Transfer-rule-anchored explanations | draft, card, facts, node, transferRuleText | explanations + visual_specs | v1, v2 |

### Agent Prompt Versions (in DB)

| Agent | Active Version | Notes |
|-------|---------------|-------|
| blueprint_selector | v2 | Coverage-aware with content system weights |
| algorithm_extractor | v1 | v2 (source-grounded) exists but inactive |
| item_planner | v1 | With task-competency lead-ins |
| vignette_writer | v1 | NBME Ch. 6 compliant |
| medical_validator | v1 | v2 (source-grounded) exists but inactive |
| blueprint_validator | v2 | With USMLE scope validation |
| nbme_quality_validator | v1 | 22-check quality gate |
| option_symmetry_validator | v1 | Testwiseness + convergence checks |
| explanation_validator | v1 | Decision-focused check |
| exam_translation_validator | v1 | Decision fork vs recall gate |
| repair_agent | v1 | Priority-ordered repair |
| explanation_writer | v3 | **Transfer-rule-anchored** (v1, v2 inactive) |
| case_planner | v1 | **NEW** — requires cognitive_operation + transfer_rule + hinge_depth |
| skeleton_writer | v1 | **NEW** — requires cognitive_error_id per distractor |
| skeleton_validator | v1 | **NEW** — hard gate on error coverage + hinge consistency |

---

## 6. Zod Schemas

| Schema | File | Required Fields (post-tightening) |
|--------|------|----------------------------------|
| `casePlanSchema` | `schemas/case-plan.ts` | cognitive_operation_type (enum), transfer_rule_text (min 10), hinge_depth_target (enum), target_cognitive_error_id (uuid, NOT nullable) |
| `questionSkeletonSchema` | `schemas/question-skeleton.ts` | wrong_option_archetypes[].cognitive_error_id (uuid, NOT nullable), hinge_placement (min 1), hinge_description (min 1), hinge_depth (enum), hinge_buried_by (min 1) |
| `algorithmExtractorOutputSchema` | `schemas/algorithm-card.ts` | algorithm_card + fact_rows (3-6) |
| `itemPlanSchema` | `schemas/item-plan.ts` | target_hinge, competing_options (4-5), target_cognitive_error, noise_elements, option_class, distractor_rationale |
| `itemDraftSchema` | `schemas/item-draft.ts` | vignette (min 50), stem (min 10), choice_a-e, correct_answer (A-E), why_correct (min 10) |
| `explanationOutputSchema` | `schemas/item-draft.ts` | why_correct, high_yield_pearl, reasoning_pathway + v2 fields (decision_logic, transfer_rule, error_diagnosis, teaching_pearl) |
| `validatorReportSchema` | `schemas/validator-report.ts` | passed (boolean), score (0-10), issues_found[], repair_instructions? |
| `skeletonValidatorOutputSchema` | `schemas/question-skeleton.ts` | skeleton_validated (boolean), issues[], suggestions[] |
| `visualSpecSchema` | `schemas/visual-specs.ts` | 6 types: comparison_table, severity_ladder, management_algorithm, timeline, diagnostic_funnel, distractor_breakdown |
| `batchQuestionSchema` | `schemas/batch-question.ts` | Full question with error_map + transfer_rule |

---

## 7. Seed Data

| Seed | Count | File | Status in DB |
|------|-------|------|-------------|
| Blueprint nodes | 135 | `seeds/blueprint-nodes.ts` + `seeds/exam-content-specs.ts` | 135 rows |
| Error taxonomy | 12 | `seeds/error-taxonomy.ts` | 12 rows |
| Source registry | 21 | `seeds/source-registry.ts` | 21 rows |
| Agent prompts | 21 | `seeds/agent-prompts.ts` | 21 rows (14 agents, some with multiple versions) |
| Hinge clue types | 10 | `seeds/hinge-clue-types.ts` | 10 rows |
| Action classes | 9 | `seeds/action-classes.ts` | 9 rows |
| Alternate terminology | 20 | `seeds/alternate-terminology.ts` | 20 rows |
| Confusion sets | 22 | `seeds/confusion-sets.ts` | 10 rows (need re-seed) |
| Transfer rules | 18 | `seeds/transfer-rules.ts` | 80 rows (existing + expanded) |
| Pattern families | 20 | `seeds/pattern-families.ts` | No table (not in migration) |
| Content systems | 15 | `seeds/content-systems.ts` | Schema cache issue |
| Content competencies | 12 | `seeds/content-competencies.ts` | Schema cache issue |
| Content disciplines | 5 | `seeds/content-disciplines.ts` | Schema cache issue |
| Content topics | 250+ | `seeds/content-topics.ts` | Schema cache issue |

### Error Taxonomy (12 entries)

| Error | Category | Rank |
|-------|----------|------|
| premature_closure | premature_closure | 1 |
| anchoring | premature_closure | 2 |
| wrong_algorithm_branch | next_step_error | 3 |
| under_triage | severity_miss | 4 |
| over_testing | next_step_error | 5 |
| reflex_response_to_finding | next_step_error | 6 |
| treating_labs_instead_of_patient | next_step_error | 7 |
| misreading_hemodynamic_status | severity_miss | 8 |
| skipping_required_diagnostic_step | next_step_error | 9 |
| premature_escalation | next_step_error | 10 |
| wrong_sequencing | next_step_error | 11 |
| misreading_severity | severity_miss | 12 |

### Action Classes (9 entries, priority-ranked)

| Class | Priority | Example |
|-------|----------|---------|
| stabilize | 1 | Intubate, IV fluids for shock |
| diagnose_emergent | 2 | STAT CT head, ECG for chest pain |
| treat_emergent | 3 | tPA for stroke, PCI for STEMI |
| diagnose_standard | 4 | Colonoscopy, TSH for fatigue |
| confirm | 5 | Tissue biopsy, genetic testing |
| treat_standard | 6 | Metformin for T2DM, ACE-i for CHF |
| observe | 7 | Serial exams, repeat troponin |
| counsel | 8 | Smoking cessation, dietary changes |
| disposition | 9 | Admit to ICU, discharge |

---

## 8. Adaptive Learner Engine

### 6-Dimension Mastery Model

Each dimension type is tracked independently per user:

| Dimension | Source | Example |
|-----------|--------|---------|
| topic | blueprint_node.topic | "Acute Coronary Syndrome" |
| cognitive_error | error_taxonomy.id | "premature_closure" |
| confusion_set | confusion_sets.id | "STEMI vs pericarditis" |
| transfer_rule | transfer_rules.id | "Stabilize before diagnose" |
| action_class | action_class.id | "treat_emergent" |
| hinge_clue_type | hinge_clue_type.id | "lab_pattern" |

### Mastery Calculation

```
rawAccuracy = correct_count / total_attempts
smoothingWeight = min(1.0, total_attempts / 10)
mastery_level = rawAccuracy * smoothingWeight + 0.5 * (1 - smoothingWeight)
```

### Spaced Repetition Schedule

| Consecutive Correct | Interval |
|---------------------|----------|
| 0 (wrong) | 5 minutes |
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 14 days |
| 5+ | 30 days |

Mastery modulates intervals by up to ±50%.

### Repair Engine Decision Tree

```
correct + fast + confident → ADVANCE (longer intervals)
correct + slow/uncertain  → REINFORCE (same dimension, build automaticity)
wrong + repeated error 3x → REMEDIATE (target that specific error, lower difficulty)
wrong + high mastery       → TRANSFER_TEST (new context for same rule)
wrong + confusion set      → CONTRAST (same confusion set, different correct answer)
wrong + default            → REMEDIATE
```

### Question Selection Strategy

1. **Repair routing** — if last answer triggered a repair action, select accordingly
2. **Weakest dimension** — find dimension with lowest mastery
3. **Retention mode** — only serve due reviews
4. **Assessment mode** — random, no repeats within session
5. **Training mode** — force specific dimension if targeted

---

## 9. API Surface

### Factory Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `POST /api/factory/seed` | POST | x-admin-key | Seed all tables (idempotent upsert) |
| `POST /api/factory/run` | POST | x-admin-key | Run v1 pipeline |
| `POST /api/factory/run-v2` | POST | x-admin-key | Run v2 pipeline (structured generation) |
| `GET /api/factory/blueprints` | GET | x-admin-key | List blueprint nodes |
| `GET /api/factory/item-drafts` | GET | x-admin-key | List generated items |

### Study Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `GET /api/study/next` | GET | userId param | Get next adaptive question |
| `POST /api/study/attempt-v2` | POST | userId in body | Record attempt + diagnose repair |
| `PATCH /api/study/attempt-v2/metacognitive` | PATCH | attemptId | Post-answer reflection |

### Learner Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `GET /api/learner/weaknesses` | GET | userId param | Top 5 weakest dimensions |

### Session Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `POST /api/session` | POST | userId | Create session (retention/training/assessment) |
| `GET /api/session` | GET | userId | Get active session |

### Key Wiring: study/next → item_draft normalization

When serving an `item_draft`, the `/api/study/next` route:
1. Renames `choice_a..e` → `option_a..e`
2. Builds `error_map` from `question_skeleton.wrong_option_archetypes` joined to `error_taxonomy`
3. Includes `transfer_rule_text` from `case_plan`
4. Returns `questionType: 'item_draft'` (study UI passes this to attempt-v2)

---

## 10. Study UI

### Components

| Component | File | Purpose |
|-----------|------|---------|
| StudyPage | `src/app/study/page.tsx` | Page wrapper, session init |
| SessionPicker | `src/app/study/session-picker.tsx` | Mode selection UI |
| StudyController | `src/app/study/study-controller.tsx` | Orchestrates session flow |
| StudySession | `src/app/study/study-session.tsx` | Main study interface (answer + review) |
| StudyFeedback | `src/app/study/study-feedback.tsx` | Error diagnosis + repair action display |
| AssessmentReview | `src/app/study/assessment-review.tsx` | End-of-assessment review |

### Key Fix (Phase 3)

`study-session.tsx` now tracks `questionType` from the API response and passes it to `attempt-v2` instead of hardcoding `'question'`.

---

## 11. Infrastructure

### Database Clients

| Client | File | Purpose |
|--------|------|---------|
| `createAdminClient()` | `src/lib/supabase/admin.ts` | Service role (bypasses RLS) — factory writes |
| `createClient()` | `src/lib/supabase/server.ts` | Server-side (auth-aware, RLS enforced) — learner reads |
| `createClient()` | `src/lib/supabase/client.ts` | Browser-side client |

### Claude Integration

| Function | File | Purpose |
|----------|------|---------|
| `callClaude<T>()` | `src/lib/factory/claude.ts` | Call Claude with JSON extraction + Zod validation + 1 retry |
| `runAgent<TIn, TOut>()` | `src/lib/factory/agent-helpers.ts` | Fetch prompt → fill template → callClaude → return typed output |
| `runValidator()` | `src/lib/factory/agents/validator-base.ts` | Shared validator pattern → write to validator_report table |

### Source Packs

| Pack | File | Topics Covered |
|------|------|----------------|
| AASLD Cirrhosis/SBP | `source-packs/aasld-cirrhosis-sbp.ts` | Cirrhosis, SBP |
| ACG Acute Pancreatitis | `source-packs/acg-acute-pancreatitis.ts` | Pancreatitis |
| ACG GI Bleeding | `source-packs/acg-gi-bleeding.ts` | GI Bleed |
| Surviving Sepsis 2021 | `source-packs/surviving-sepsis-2021.ts` | Sepsis |

---

## 12. Migrations

| Migration | Status | Tables/Columns Added |
|-----------|--------|---------------------|
| v2 | Applied | profiles |
| v3 | Applied | user_responses |
| v4 | Applied | content_system, content_discipline, content_competency, content_topic |
| v5 | Applied | visual_specs column on item_draft |
| v6 | Applied | blueprint_node, algorithm_card, fact_row, item_plan, item_draft, validator_report, pipeline_run, agent_prompts, error_taxonomy, confusion_sets, transfer_rules, source_registry, questions |
| v7 | **Applied** | hinge_clue_type, action_class, alternate_terminology, cognitive_error_tag + extends error_taxonomy, transfer_rules |
| v8 | **Applied** | case_plan, question_skeleton + extends item_draft (case_plan_id, question_skeleton_id) + agent_type enum (case_planner, skeleton_writer, skeleton_validator) |
| v9 | **Applied** | explanation_decision_logic, explanation_hinge_id, explanation_error_diagnosis, explanation_transfer_rule, explanation_teaching_pearl on item_draft |
| v10 | **Applied** | learner_model, attempt_v2 + dimension_type, repair_action enums |
| v11 | **Applied** | learning_session + session_mode, session_status enums |
| v12 | **Applied** | cognitive_operation_type enum, hinge_depth enum + case_plan (3 new columns) + question_skeleton (2 new columns, 2 NOT NULL) + pipeline_run (validator_summary) |

---

## 13. Scripts & Harness

| Script | Purpose | Usage |
|--------|---------|-------|
| `test-factory.ts` | CLI pipeline runner with full validation | `npx tsx scripts/test-factory.ts --topic "ACS" --validate-full --repair --explain --save` |
| `apply-migration.ts` | Apply SQL migrations via _exec_migration RPC | `npx tsx scripts/apply-migration.ts file.sql` |
| `generate-batch.ts` | Batch question generation | `npx tsx scripts/generate-batch.ts` |
| `audit-batch.ts` | Audit batch quality | `npx tsx scripts/audit-batch.ts` |
| `seed-mvp-tables.ts` | Seed MVP question bank | `npx tsx scripts/seed-mvp-tables.ts` |
| `harness/run-harness.ts` | Quality harness orchestrator | Runs pipeline + classifies failures + generates reports |
| `harness/failure-classifier.ts` | Classifies why items fail | Maps validator reports to failure categories |
| `harness/report-generator.ts` | Generates quality reports | Aggregates pass/kill rates, score distributions |

---

## 14. Governance Documents

| Document | Purpose |
|----------|---------|
| `PRODUCT_VISION.md` | Mission, core principles, anti-patterns, success criteria |
| `ARCHITECTURE_VNEXT.md` | 5-layer architecture, identifies Layer 2 as bottleneck |
| `BUILD_ORDER.md` | Sequenced build contract with completion gates |
| `AGENT_CONTRACTS.md` | Bounded roles for all 12 original agents |
| `ALGORITHM_CARD_SPEC.md` | Card structure, status lifecycle (draft → generation_ready) |
| `REPAIR_POLICY.md` | Max 3 cycles, auto-kill conditions, per-validator thresholds |
| `DISTILLATION_POLICY.md` | Source isolation: Tier C never reaches generating agents |
| `REJECTION_RULES.md` | 19 auto-kill rules across 7 categories |
| `SOURCE_POLICY.md` | Tier hierarchy: A (scope), B (truth), C (style) |

---

## 15. Generated Output

7 question files in `scripts/output/`:

| File | Topic | Outcome |
|------|-------|---------|
| question-1774532007580.json | Sepsis | Generated (earlier run) |
| question-1774532094797.json | Unknown | Generated (earlier run) |
| question-1774534250793.json | Unknown | Generated (earlier run) |
| question-1774535514222.json | Sepsis | Generated (earlier run) |
| question-1775156024876.json | Pulmonary Embolism | AUTO-KILLED (medical 2/10) |
| question-1775156081031.json | Acute Coronary Syndrome | KILLED (3 repair cycles) |
| question-1775156125919.json | Sepsis | KILLED (3 repair cycles) |

---

## 16. Type System

### Key Type Files

| File | Key Exports |
|------|-------------|
| `src/lib/types/database.ts` | All Row types (BlueprintNodeRow, AlgorithmCardRow, FactRowRow, ItemDraftRow, CasePlanRow, QuestionSkeletonRow, LearnerModelRow, AttemptV2Row, etc.) + all enums |
| `src/lib/types/factory.ts` | PipelineConfig, PipelineResult, AgentStepResult, AgentContext, AgentOutput |
| `src/lib/factory/schemas/index.ts` | All Zod schemas + inferred types |

### New Types (Phase 1)

```typescript
// src/lib/types/database.ts
type CognitiveOperationType = 'rule_application' | 'threshold_recognition' | 'diagnosis_disambiguation' | 'management_sequencing' | 'risk_stratification';
type HingeDepth = 'surface' | 'moderate' | 'deep';

// src/lib/factory/schemas/case-plan.ts
export const cognitiveOperationEnum = z.enum([...]);
export const hingeDepthEnum = z.enum([...]);
```

---

## 17. File Inventory

### Source Code (src/)

```
src/
├── app/
│   ├── api/
│   │   ├── admin/migrate/route.ts
│   │   ├── factory/
│   │   │   ├── blueprints/route.ts
│   │   │   ├── item-drafts/route.ts
│   │   │   ├── run/route.ts
│   │   │   ├── run-v2/route.ts
│   │   │   └── seed/route.ts
│   │   ├── learner/weaknesses/route.ts
│   │   ├── questions/route.ts
│   │   ├── responses/route.ts
│   │   ├── session/route.ts
│   │   └── study/
│   │       ├── attempt/route.ts
│   │       ├── attempt-v2/route.ts
│   │       ├── attempt-v2/metacognitive/route.ts
│   │       └── next/route.ts
│   ├── components/
│   │   ├── ui/ (badge, collapsible, section-card, step-indicator)
│   │   └── visuals/ (visual-renderer, comparison-table, distractor-breakdown, severity-ladder)
│   ├── dashboard/page.tsx
│   ├── login/ (login-form.tsx, page.tsx)
│   ├── practice/ (practice-session.tsx, practice-panel.tsx, explanation-panel.tsx, question-card.tsx, page.tsx)
│   ├── signup/ (signup-form.tsx, page.tsx)
│   ├── study/ (study-session.tsx, study-controller.tsx, session-picker.tsx, study-feedback.tsx, assessment-review.tsx, page.tsx)
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── factory/
│   │   ├── agents/ (15 agent files + validator-base.ts + index.ts)
│   │   ├── schemas/ (9 schema files + index.ts)
│   │   ├── seeds/ (15 seed files + index.ts)
│   │   ├── source-packs/ (4 source files + topic-source-map.ts + sufficiency.ts + types.ts)
│   │   ├── validators/ (visual-spec-validator.ts)
│   │   ├── agent-helpers.ts
│   │   ├── claude.ts
│   │   ├── pipeline.ts (v1)
│   │   └── pipeline-v2.ts (v2)
│   ├── learner/
│   │   ├── model.ts
│   │   ├── scheduler.ts
│   │   ├── selector.ts
│   │   ├── repair-engine.ts
│   │   ├── repair-strategies/ (advance.ts, reinforce.ts, remediate.ts, contrast.ts, transfer_test.ts)
│   │   └── types.ts
│   ├── session/index.ts
│   ├── supabase/ (admin.ts, server.ts, client.ts)
│   └── types/ (database.ts, factory.ts, + 5 more type files)
└── middleware.ts
```

### Scripts

```
scripts/
├── apply-migration.ts
├── audit-batch.ts
├── batch-prompts.ts
├── generate-batch.ts
├── seed-mvp-tables.ts
├── test-factory.ts
├── harness/
│   ├── run-harness.ts
│   ├── harness-orchestrator.ts
│   ├── failure-classifier.ts
│   ├── report-generator.ts
│   ├── version-tracker.ts
│   └── types.ts
└── output/ (7 generated question JSON files)
```

### Root Files

```
├── PRODUCT_VISION.md
├── ARCHITECTURE_VNEXT.md
├── BUILD_ORDER.md
├── AGENT_CONTRACTS.md
├── ALGORITHM_CARD_SPEC.md
├── REPAIR_POLICY.md
├── DISTILLATION_POLICY.md
├── REJECTION_RULES.md
├── SOURCE_POLICY.md
├── supabase-migration-v2.sql
├── supabase-migration-v3.sql
├── supabase-migration-v4-content-outline.ts
├── supabase-migration-v5-visual-specs.sql
├── supabase-migration-v6-mvp-tables.sql
├── supabase-migration-v7-reasoning-ontology.sql
├── supabase-migration-v8-case-plan.sql
├── supabase-migration-v9-explanation-structure.sql
├── supabase-migration-v10-learner-model.sql
├── supabase-migration-v11-session.sql
├── supabase-migration-v12-structured-generation.sql
├── package.json
├── tsconfig.json
├── next.config.ts
├── middleware.ts
└── .env.local
```

---

## 18. Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| @anthropic-ai/sdk | ^0.78.0 | Claude API |
| @supabase/ssr | ^0.9.0 | Server-side Supabase |
| @supabase/supabase-js | ^2.99.0 | Supabase client |
| next | 16.1.6 | Framework |
| react | 19.2.3 | UI |
| react-dom | 19.2.3 | UI rendering |
| zod | ^4.3.6 | Schema validation |

### Dev

| Package | Version | Purpose |
|---------|---------|---------|
| @tailwindcss/postcss | ^4 | CSS |
| typescript | ^5 | Type system |
| eslint | ^9 | Linting |
| pg | ^8.20.0 | Direct Postgres (scripts) |
| tailwindcss | ^4 | Utility CSS |

---

## 19. Test Results (2026-04-02)

### Pipeline Test Run (3 topics, CLI harness)

| Topic | Total Tokens | Time | Medical | Blueprint | NBME | Symmetry | Explanation | Exam Trans | Verdict |
|-------|-------------|------|---------|-----------|------|----------|-------------|------------|---------|
| ACS | 68,127 | 148s | 5/10 | 6/10 | 5/10 | 4/10 | 9/10 | 9/10 | KILLED (3 cycles) |
| Sepsis | 72,387 | 184s | 5/10 | 8/10 | 5/10 | 7/10 | 9/10 | 4/10 | KILLED (3 cycles) |
| PE | 26,114 | 79s | 2/10 | 3/10 | 6/10 | 9/10 | 9/10 | 9/10 | AUTO-KILLED |

**Note:** These runs used the CLI harness's own inline prompts (pre-tightening), not the DB pipeline with the new structured generation schema. The tightened schemas haven't been tested via the DB pipeline yet.

---

## 20. What Works vs What's Next

### Working (Verified)

- [x] 15 agents implemented and type-safe
- [x] V2 pipeline orchestrates correctly with structured generation stages
- [x] Schemas tightened: cognitive_error_id required, hinge_depth required, transfer_rule_text before question
- [x] All migrations v7-v12 applied to Supabase (96 statements, 0 failures)
- [x] All seed data populated (blueprints, errors, prompts, ontology)
- [x] V2 agent prompts seeded (case_planner, skeleton_writer, skeleton_validator, explanation_writer v3)
- [x] Learner engine wired: study UI passes correct questionType, API normalizes item_drafts
- [x] Validator scores summarized on pipeline_run
- [x] 7 questions generated via CLI harness
- [x] TypeScript strict mode: clean compile, zero errors

### Next Steps

- [ ] Run DB pipeline (via `/api/factory/run-v2`) to test full structured generation with tightened schemas
- [ ] Update CLI harness to use tightened schemas (required cognitive_error_id, hinge_depth, etc.)
- [ ] Fix content_system/content_topic schema cache issue (PostgREST reload or direct seed)
- [ ] Seed remaining confusion sets (22 in code, only 10 in DB)
- [ ] Create pattern_families table (20 seeds exist, no migration)
- [ ] End-to-end demo: student answers factory-generated question → gets adaptive feedback
- [ ] Phase 1.5: Validate algorithm cards on 3 topics against ALGORITHM_CARD_SPEC
- [ ] Scale testing: 20+ questions, measure pass/kill rate distribution
