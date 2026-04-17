# MCQ Quality Research: AI vs NBME Item Quality

## Executive Summary

15+ blinded comparison studies (2024-2026) reveal three specific, measurable failure modes that separate AI-generated questions from NBME-quality items. Human-authored questions outperform AI-generated questions across all quality indicators. The gaps are large enough to detect statistically but specific enough to fix.

**Headline finding:** AI discrimination index 0.19 vs human 0.29. The gap is driven by difficulty (questions too easy) and distractor quality (wrong answers don't function).

## Three Universal AI Failure Modes

### 1. Questions Are Too Easy
- AI difficulty index: **0.76** vs human **0.65** (p = 0.02)
- Every detail points at the answer — no competing signal, no noise, no reason to hesitate
- NBME questions make you hesitate; AI questions don't

### 2. Distractors Don't Function
- AI distractor efficiency: **39%** vs human **55%** (p = 0.035)
- A non-functioning distractor is chosen by <5% of test-takers
- AI repeats the same error type across multiple distractors instead of testing distinct reasoning failures

### 3. AI Tests Recall, Not Reasoning
- AI MCQs predominantly test "Remember" and "Understand" levels
- Human MCQs test "Apply" and "Analyze" cognitive levels
- Architecture partially addresses this (case_planner decision forks), but enforcement is inconsistent

## Three Highest-Impact Fixes

### Fix 1: Near-Miss Distractor Design
NBME's hardest questions don't have one right answer and four wrong ones. They have one BEST answer and one option that would be correct in a slightly different context — different patient, different timepoint, one lab value different. The near-miss distractor is what creates genuine difficulty.

**Implementation:** `case_planner` v4 requires exactly ONE near-miss distractor per item with structured fields: `near_miss: true`, `pivot_detail`, `correct_if`. The near-miss is what the hinge finding resolves.

### Fix 2: Competing Signal Requirement
Every vignette needs 2-3 findings that actively support the best distractor's diagnosis. Not just absence of evidence for the distractor — positive evidence for it. The student has to weigh real competing hypotheses, not just recognize a pattern.

**Implementation:** `vignette_writer` v4 requires positive evidence for the near-miss distractor, with an 80% self-test: covering the last 2 sentences of the vignette should leave the near-miss equally defensible.

### Fix 3: Linguistic Tell Elimination
Stylistic features — particularly redundancy (OR 6.90), repetition (OR 8.05), and overly smooth coherence (OR 6.62) — identify AI-generated text with high confidence. Vignettes need chart-note style: abbreviations, fragments, varied syntax, no "presents with" or "notably."

**Implementation:** `vignette_writer` v4 has PROHIBITED PHRASES list with replacements, POSITIVE STYLE REQUIREMENTS for chart-note formatting, and `nbme_quality_validator` v3 has CHECK 5 that auto-fails on 3+ prohibited phrases.

## Blackstar Implementation Mapping

| Research Gap | Blackstar Component | Version | Changes |
|---|---|---|---|
| Too easy | `case_planner` prompt | v4 | Near-miss rule, difficulty floor, distractor functioning self-check |
| Too easy | `nbme_quality_validator` prompt | v3 | CHECK 4 difficulty estimation (target 0.55-0.70) |
| Distractors don't function | `case_planner` prompt | v4 | Each distractor must attract ≥10% of test-takers |
| Distractors don't function | `nbme_quality_validator` prompt | v3 | Distractor plausibility sweep, non-functioning flags |
| Recall not reasoning | `case_planner` prompt | v4 (existing) | Decision fork requirement, anti-recall guardrail |
| Linguistic tells | `vignette_writer` prompt | v4 | Anti-AI style guide, prohibited phrases, chart-note style |
| Linguistic tells | `nbme_quality_validator` prompt | v3 | CHECK 5 linguistic naturalness, 3+ phrase auto-fail |
| Repair strategies | `repair_agent` prompt | v2 | Targeted strategies for too_easy, non_functioning, linguistic, near_miss |
| Failure categorization | `failure-categorizer.ts` | — | 4 new categories: too_easy, non_functioning_distractor, linguistic_tells, near_miss_absent |
| Repair overrides | `repair-strategies.ts` | — | Specialized repair prompts per new failure category |
| Data tracking | `case-plan.ts` schema | — | near_miss, pivot_detail, correct_if on option frames; estimated_difficulty |
| Data tracking | `validator-report.ts` schema | — | 4 new failure category enum values |
| Data tracking | `database.ts` types | — | estimated_difficulty, near_miss_option, near_miss_pivot_detail, distractor_estimates |
| Pipeline wiring | `pipeline-v2.ts` | — | Extracts difficulty estimate and near-miss data post-validation |
| Database | `supabase-migration-v20.sql` | — | Columns for difficulty, near-miss, distractor estimates |

## Measurement Plan

### Pre/Post Comparison
Generate 10+ items on topics with prior test runs (ACS, Sepsis, PE) and compare:

| Metric | Baseline (pre-research) | Target (post-research) |
|---|---|---|
| Pass rate (all validators) | 0% (3/3 killed) | ≥40% |
| Estimated difficulty | Not measured | 0.55-0.70 |
| Near-miss present | Not tracked | 100% of items |
| Prohibited phrases per vignette | Not tracked | ≤1 |
| Distractors ≥5% estimated selection | Not tracked | 4/4 per item |
| Competing signals present | Not enforced | 2+ per vignette |

### Ongoing Monitoring
- `item_draft.estimated_difficulty` — track distribution, alert if mean drifts above 0.75
- `validator_report.distractor_estimates` — flag items with any distractor <5%
- `item_draft.near_miss_option` — verify 100% of published items have a near-miss
- Linguistic tells in `issues_found` — track count per item across pipeline runs

## Research Sources

Key studies informing this implementation (2024-2026 blinded comparisons):
- AI vs human MCQ difficulty and discrimination indices
- Distractor efficiency in AI-generated vs clinician-authored items
- Bloom's taxonomy level distribution in AI vs human items
- Stylistic detection of AI-generated medical text (OR statistics for redundancy, repetition, coherence)
- NBME "Constructing Written Test Questions" (4th ed., 2016) — Chapters 3 and 6
- P2 (QUEST-AI) — refinement only works with specific error categorization
- P1 (Council of AIs) — cross-family validation outperforms single-model
- TeamMedAgents (Aug 2025) — adaptive component selection over comprehensive integration
