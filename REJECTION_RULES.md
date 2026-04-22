# Rejection Rules

## Purpose

Auto-kill criteria that immediately disqualify a generated question. These are enforced by validators and the pipeline orchestrator. A single trigger kills the item — no repair attempt.

## Category 1: Medical Accuracy Kills

| Rule | Description | Validator |
|------|-------------|-----------|
| R-MED-01 | Correct answer is medically incorrect per Tier B sources | medical_validator |
| R-MED-02 | Any option recommends a harmful action (unless it's clearly the "wrong" answer) | medical_validator |
| R-MED-03 | Clinical presentation doesn't match the intended diagnosis | medical_validator |
| R-MED-04 | Clinical thresholds or lab values are factually wrong | medical_validator |
| R-MED-05 | Contraindication violated without being flagged as the error | medical_validator |
| R-MED-06 | Medical validator score < 3.0 | pipeline (auto-kill) |

## Category 2: Blueprint Alignment Kills

| Rule | Description | Validator |
|------|-------------|-----------|
| R-BP-01 | Question tests a different topic than the blueprint node specifies | blueprint_validator |
| R-BP-02 | Task type in stem doesn't match blueprint (e.g., blueprint says "diagnostic_test" but stem asks for treatment) | blueprint_validator |
| R-BP-03 | Clinical setting contradicts the blueprint (e.g., blueprint says "outpatient" but vignette is in an ICU) | blueprint_validator |

## Category 3: NBME Quality Kills

| Rule | Description | Validator |
|------|-------------|-----------|
| R-NBME-01 | Answer is determinable from the first sentence alone | nbme_quality_validator |
| R-NBME-02 | Vignette uses teaching voice, hints, or leading language | nbme_quality_validator |
| R-NBME-03 | Only 1 option is plausible (others are absurd or nonsensical) | nbme_quality_validator |
| R-NBME-04 | Classic buzzword makes answer trivially obvious (e.g., "butterfly rash" → lupus) | nbme_quality_validator |

## Category 3b: Reasoning Depth Kills (Rule 1)

| Rule | Description | Validator |
|------|-------------|-----------|
| R-REAS-01 | Single-step question (`case_plan.reasoning_step_count < 2`) — answerable from one decision instead of a chain | nbme_quality_validator |
| R-REAS-02 | Any `reasoning_steps[].clinical_signal` is not resolvable from stem text (hidden knowledge leap) | nbme_quality_validator |

## Category 4: Option Quality Kills

| Rule | Description | Validator |
|------|-------------|-----------|
| R-OPT-01 | Options mix different action classes (medications with diagnostic tests) | option_symmetry_validator |
| R-OPT-02 | Any distractor is medically absurd or nonsensical | option_symmetry_validator |
| R-OPT-03 | One option is significantly longer/more detailed than others (longest-answer pattern) | option_symmetry_validator |
| R-OPT-04 | No `archetype='primary_competitor'` designated in `case_plan.option_frames` (Rule 3) | option_symmetry_validator |
| R-OPT-05 | More than one `archetype='zebra'`, or zebra designated without a genuinely exotic clinical identity (Rule 3) | option_symmetry_validator |

## Category 5: Explanation Quality Kills

| Rule | Description | Validator |
|------|-------------|-----------|
| R-EXP-01 | Explanation is a disease lecture instead of a decision explanation | explanation_validator |
| R-EXP-02 | why_correct simply restates the answer without clinical reasoning | explanation_validator |
| R-EXP-03 | Missing or empty `down_to_two_discrimination` (Rule 4) | explanation_validator |
| R-EXP-04 | Missing `question_writer_intent` or not in "prioritize X over Y when Z" template (Rule 10) | explanation_validator |
| R-EXP-05 | `medicine_deep_dive` not teachable-from-scratch (Rule 5) — a student new to the topic cannot answer a sibling item after reading it | explanation_validator |

## Category 6: Source Policy Kills

| Rule | Description | Validator |
|------|-------------|-----------|
| R-SRC-01 | Correct answer justified solely by review notes (qbank) without guideline citation | medical_validator |
| R-SRC-02 | Fabricated guideline name cited | medical_validator |
| R-SRC-03 | No guideline source in algorithm_card.source_citations | medical_validator |

## Category 7: Pipeline Kills

| Rule | Description | Enforcer |
|------|-------------|----------|
| R-PIPE-01 | Item fails validation 3 times (max repair cycles exceeded) | pipeline orchestrator |
| R-PIPE-02 | Repair agent produces identical output to failed draft | pipeline orchestrator |

## Scoring Thresholds

Items are auto-killed (no repair attempt) when:
- Medical accuracy score < 3.0
- Any Category 1 rule triggered (R-MED-01 through R-MED-05)

Items are sent to repair (up to 3 cycles) when:
- Any validator fails with score ≥ 3.0
- Issues are flagged but not auto-kill severity

Items pass validation when:
- All 5 validators return `passed: true`
- All scores ≥ 7.0
