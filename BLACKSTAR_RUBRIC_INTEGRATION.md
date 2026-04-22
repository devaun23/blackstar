# Blackstar Master Rubric — Integration Design

**Canonical:** `BLACKSTAR_MASTER_RUBRIC.md` (repo root).
**Schema:** `src/lib/factory/schemas/master-rubric.ts`.
**Storage:** `rubric_score` table (migration v26).
**Agent (Sprint 2):** `rubric_evaluator` — LLM + deterministic gates.

This document is the integration spec for Sprint 2 and beyond. It maps the master rubric to the existing pipeline and identifies exactly what's new.

---

## 1. Domain → existing validator mapping

The 10 rubric domains are not evaluated from scratch. Existing validators already produce most of the signal; the `rubric_evaluator` agent **aggregates** their reports + LLM-scores the gaps, rather than re-evaluating everything.

| # | Rubric domain | Max | Existing signal | Gap (Sprint 2 work) |
|---|---|---|---|---|
| 1 | Medical correctness & scope | 15 | `medical_validator` (pass/fail + score 0-10) + `contraindication_validator` (safety) | Convert binary → graded 0/8/12/15 mapping |
| 2 | Blueprint alignment | 8 | `blueprint_validator` | Graded 0/3/6/8 mapping |
| 3 | NBME stem fidelity | 12 | `nbme_quality_validator` | Graded 0/5/9/12 mapping |
| 4 | Hinge design & ambiguity | 10 | **Partial:** `case_plan.hinge_depth_target` + `explanation.decision_hinge` | **NEW:** explicit hinge-quality LLM pass |
| 5 | Option set quality & symmetry | 12 | `option_symmetry_validator` | Graded 0/5/9/12 mapping |
| 6 | Key integrity | 5 | `medical_validator` + `option_symmetry_validator` (composite) | Derivable from existing reports |
| 7 | Explanation quality | 15 | `explanation_validator` + `rubric_scorer` (existing 1-5 scaled rubric) | Graded mapping + reuse existing rubric_scorer sub-scores |
| 8 | Learner modeling value | 8 | **None currently.** | **NEW:** LLM pass that evaluates `confusion_set` specificity, cognitive_error trackability, case_plan attribute density |
| 9 | Adaptive sequencing utility | 5 | **None currently.** | **NEW:** LLM pass + `next_item_if_fail` / `next_item_if_pass` fields on case_plan |
| 10 | Production readiness | 10 | Implicit (if item reached this stage, it likely parses) | Deterministic: metadata completeness + JSON well-formedness |

**New LLM evaluations required for Sprint 2:** 3 domains (hinge design, learner modeling value, adaptive sequencing utility). Everything else is an aggregation of existing validator output.

---

## 2. Hard gates — detection path

| # | Hard gate | Detection | Where in pipeline |
|---|---|---|---|
| 1 | Medical inaccuracy or unsafe management | `medical_validator.passed === false` OR `contraindication_validator.passed === false` | Existing validator loop |
| 2 | No single best answer | `option_symmetry_validator` raw_output flag OR `medical_validator` multi-correct detection | Existing validator loop |
| 3 | Diagnosis given away | `nbme_quality_validator` raw_output: `gives_away_diagnosis` flag (may need to add) | Existing; minor prompt tweak |
| 4 | Option symmetry broken | `option_symmetry_validator.passed === false` (absent justified clinical fork in case_plan) | Existing |
| 5 | Explanation teaches wrong transfer rule | `explanation_validator` + check that explanation's transfer_rule_text matches `case_plan.transfer_rule_text` | Existing + deterministic check |
| 6 | Out of shelf scope | `blueprint_validator.passed === false` | Existing |
| 7 | Distractors implausible | `option_symmetry_validator` raw_output: distractor strength score | Existing |
| 8 | Missing required metadata | Deterministic check on case_plan + blueprint_node + item_draft fields (see §3) | **NEW** deterministic pre-check |

All 8 run **deterministically BEFORE the LLM grader**. If any fires, we short-circuit to `publish_decision: 'reject'` and skip the expensive LLM pass.

---

## 3. Metadata field → source map

The 15 required-metadata fields from §Required metadata in the rubric are populated from existing tables. `missing_required_metadata` fires if any is null/empty.

| Rubric field | Source |
|---|---|
| `item_id` | `item_draft.id` |
| `shelf` | `blueprint_node.shelf` |
| `system` | `blueprint_node.system` |
| `blueprint_node` | `blueprint_node.topic` + `.subtopic` + `.task_type` (composite string) |
| `concepts_tested` | `case_plan.concepts_tested` (NEW field — needs migration; or derive from `case_plan.reasoning_steps[].what_student_must_recognize`) |
| `cognitive_operation` | `case_plan.cognitive_operation_type` |
| `transfer_rule_text` | `case_plan.transfer_rule_text` |
| `hinge_clue` | `case_plan.final_decisive_clue` or `question_skeleton.hinge_description` |
| `hinge_depth_target` | `case_plan.hinge_depth_target` |
| `confusion_set` | `confusion_sets.conditions` via `case_plan.target_confusion_set_id` |
| `cognitive_error_targets` | `case_plan.target_cognitive_error_id` → `error_taxonomy.error_name` (+ any secondary) |
| `difficulty_target` | `case_plan.difficulty_class` (map decision_fork → 'medium', hard_discrimination → 'hard', easy_recognition → 'easy') |
| `intended_user_stage` | Derivable from `blueprint_node.yield_tier` (tier_1 → novice, tier_2 → intermediate, tier_3 → advanced) — or new field |
| `explanation_goal` | `case_plan.explanation_teaching_goal` |
| `tags` | derived from `blueprint_node` + `case_plan` |
| `next_item_if_fail` | **NEW field on case_plan** |
| `next_item_if_pass` | **NEW field on case_plan** |

**Sprint 2 schema work:** two new nullable columns on `case_plan`: `next_item_if_fail TEXT`, `next_item_if_pass TEXT`. Case-planner prompt updated to populate them.

---

## 4. Pipeline data flow

```
item_draft (passed existing validators)
         │
         ▼
┌────────────────────────────────────────────┐
│ rubric_evaluator agent                     │
│                                            │
│ Step 1: Deterministic hard-gate check      │
│   - Metadata completeness                  │
│   - Validator reports unanimity            │
│   - Transfer-rule match                    │
│   → If any fails: publish_decision='reject'│
│                                            │
│ Step 2: Score aggregation (no LLM)         │
│   - Map existing validator scores →        │
│     domain scores for 7 of 10 domains      │
│                                            │
│ Step 3: LLM evaluation (3 new domains)     │
│   - Hinge design & ambiguity (10 pts)      │
│   - Learner modeling value (8 pts)         │
│   - Adaptive sequencing utility (5 pts)    │
│                                            │
│ Step 4: Compose + validate score object    │
│   - Sum = total_score                      │
│   - deriveMasterRubricDecision() → final   │
│   - Zod validate                           │
│                                            │
│ Step 5: Persist                            │
│   - Insert rubric_score row                │
│   - Update item_draft.status based on      │
│     publish_decision                       │
└────────────────────────────────────────────┘
         │
         ▼
item_draft.status routing:
  publish        → status='published', review_status='approved'
  revise         → status='needs_revision'
  major_revision → status='needs_human_review'
  reject         → status='killed' (if hard gate) or 'failed'
```

Key property: **`deriveMasterRubricDecision()` is the final authority**, not the LLM's suggestion. The LLM proposes domain scores; the deterministic function composes them and routes.

---

## 5. Minimum Sprint 2 work

1. Schema: add `next_item_if_fail` + `next_item_if_pass` to case_plan (migration v27).
2. Agent: `rubric_evaluator` with the 4-step flow above.
3. Prompt: seed v1 of `rubric_evaluator` system + user prompt in `agent-prompts.ts`.
4. Pipeline: wire into pipeline-v2 as the final meta-evaluator, after the existing validator loop + explanation_writer.
5. Aggregation helpers: typed mappers from existing validator reports → domain scores.
6. Backfill: score all 7 published items + any draft items, store results.

---

## 6. What survives from the old system

- `validator_report` table — still the store for individual validator runs. `rubric_score` aggregates them, doesn't replace them.
- Existing `rubric_scorer` (1-5 HealthBench-style) — demoted to diagnostic supplement. Its `rubric_output` feeds the `explanation_quality` and `nbme_stem_fidelity` domain aggregation.
- All existing validators — still run in the cycle loop. Their pass/fail drives repair decisions; their scores feed the master rubric.
- `contraindication_validator` (CCV) — stays as its own hard-gate validator. Its output feeds hard gate #1.

---

## 7. Out of scope for Sprint 2

- **Chatbot feature** — separate Sprint 4.
- **HealthBench import** — Sprint 4, license check first.
- **Retroactive revision** of items scored under old system — they get re-scored under master rubric during backfill; no UI changes needed.
- **UI for reviewers** — the rubric_score is consumed by automated routing; human review UI exposing the score object is Sprint 3 work.
