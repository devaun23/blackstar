# Source Policy

## Purpose

This document defines what each source tier can and cannot do. Every agent prompt references this policy. Violations are auto-kill conditions.

## Tier Definitions

### Tier A — Scope Sources

**What they do:** Define what topics are testable. The blueprint is built from these.

**What they CANNOT do:** Define correct answers or clinical thresholds.

| Source | Category |
|--------|----------|
| USMLE Step 2 CK Content Outline | outline |
| NBME Medicine Shelf Exam Content Outline | outline |
| NBME Surgery Shelf Exam Content Outline | outline |
| NBME Item Writing Guide | guide |

**Rules:**
- A topic not covered by a Tier A source is out of scope — period.
- Tier A sources determine the blueprint_node table.
- The NBME Item Writing Guide governs question format, not content.

### Tier B — Truth Sources

**What they do:** Define what is medically correct. Correct answers, clinical thresholds, drug choices, contraindications, and management algorithms come from here.

**What they CANNOT do:** Expand scope. A Tier B source cannot add a topic that no Tier A source covers.

| Source | Category | Domain |
|--------|----------|--------|
| AHA/ACC Guidelines | guideline | Cardiology |
| ACEP Clinical Policies | guideline | Emergency medicine |
| Surviving Sepsis Campaign | guideline | Sepsis |
| AASLD Practice Guidelines | guideline | Hepatology |
| KDIGO Guidelines | guideline | Nephrology |
| ADA Standards of Care | guideline | Diabetes/Endocrine |
| ATS/IDSA CAP Guidelines | guideline | Pulmonary/ID |
| IDSA Meningitis Guidelines | guideline | Infectious disease |
| GOLD COPD Guidelines | guideline | Pulmonary |
| GINA Asthma Guidelines | guideline | Pulmonary |
| UpToDate | reference | All (secondary) |

**Rules:**
- Society guidelines (priority_rank 10-19) take precedence over UpToDate (rank 30).
- When guidelines conflict, use the most recently published.
- UpToDate is a fallback when no society guideline covers a specific decision point.
- Every fact_row must cite a Tier B source by name.
- Algorithm cards must cite at least one Tier B source.

### Tier C — Inspiration Sources

**What they do:** Inform question style, difficulty calibration, and distractor quality. They show what a good board question looks and feels like.

**What they CANNOT do:** Define scope OR truth. A Tier C source cannot determine what is medically correct or what topics are testable.

| Source | Category |
|--------|----------|
| UWorld Step 2 CK | qbank |
| AMBOSS Step 2 CK | qbank |

**Rules:**
- Never cite a Tier C source as evidence for a correct answer.
- Never use a Tier C source to justify adding a topic to the blueprint.
- Tier C sources can inform: vignette length, distractor plausibility patterns, explanation structure.

## Hard Boundaries

1. **No source promotion.** An agent cannot treat a Tier C source as Tier B or a Tier B source as Tier A. The tier is fixed in `source_registry`.
2. **No unsourced facts.** Every `fact_row` requires `source_name` and `source_tier`. If a fact cannot be sourced to Tier B, it cannot be used as the basis for a correct answer.
3. **No guideline fabrication.** Agents must cite real guidelines by name. Inventing a guideline name is an auto-kill condition.
4. **Source citation audit trail.** The `algorithm_card.source_citations` array must contain at least one Tier B source. Validators check this.

## Conflict Resolution

When sources disagree:
1. Most recent society guideline wins (check publication year).
2. Specialty society guideline wins over general reference (e.g., AHA > UpToDate for cardiology).
3. If unresolvable, the fact is tagged `confidence: 'low'` and the question is flagged for human review.
