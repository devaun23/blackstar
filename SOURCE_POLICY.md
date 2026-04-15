# Source Policy

## Purpose

This document defines what each source tier can and cannot do. Every agent prompt references this policy. Violations are auto-kill conditions.

## Tier Definitions

### Scope Sources

**What they do:** Define what topics are testable. The blueprint is built from these.

**What they CANNOT do:** Define correct answers or clinical thresholds.

| Source | Category |
|--------|----------|
| USMLE Step 2 CK Content Outline | outline |
| NBME Medicine Shelf Exam Content Outline | outline |
| NBME Surgery Shelf Exam Content Outline | outline |
| NBME Item Writing Guide | guide |
| USMLE Step 2 CK Physician Task Profiles | outline |
| NBME Medicine Shelf Content Outline — Subsystem Topics | outline |

**Rules:**
- A topic not covered by a Scope source is out of scope — period.
- Scope sources determine the `blueprint_node` table.
- The NBME Item Writing Guide governs question format, not content.

### Content Sources

**What they do:** Everything else. Guidelines define what is medically correct. Review notes inform question design, clinical reasoning patterns, difficulty calibration, distractor quality, and common learner traps. All Content sources are directly available to agents.

**What they CANNOT do:** Expand scope. A Content source cannot add a topic that no Scope source covers.

| Source | Category | Priority | Role |
|--------|----------|----------|------|
| AHA/ACC Guidelines | guideline | 10 | Cardiology management |
| ACEP Clinical Policies | guideline | 11 | Emergency medicine |
| Surviving Sepsis Campaign | guideline | 12 | Sepsis |
| AASLD Practice Guidelines | guideline | 13 | Hepatology |
| KDIGO Guidelines | guideline | 14 | Nephrology |
| ADA Standards of Care | guideline | 15 | Diabetes/Endocrine |
| ATS/IDSA CAP Guidelines | guideline | 16 | Pulmonary/ID |
| IDSA Meningitis Guidelines | guideline | 17 | Infectious disease |
| GOLD COPD Guidelines | guideline | 18 | Pulmonary |
| GINA Asthma Guidelines | guideline | 19 | Pulmonary |
| ACG Acute Pancreatitis Guidelines | guideline | 20 | GI |
| ACG GI Bleeding Guidelines | guideline | 21 | GI |
| USPSTF Screening Recommendations | guideline | 22 | Preventive screening |
| UpToDate | reference | 30 | All (secondary) |
| UWorld Step 2 CK | qbank | 50 | Question design, difficulty, traps |
| AMBOSS Step 2 CK | qbank | 51 | Explanation structure, reasoning |
| Divine Intervention Podcast Notes | review | 52 | Clinical patterns, high-yield focus |
| UWorld Inner Circle Step 2 CK Notes | review | 53 | Clinical reasoning, decision forks |

**Priority determines conflict resolution** — lower number wins. Guidelines (10-21) take precedence over references (30) and review notes (50+).

## Citation Rules

1. **Every `fact_row` must cite a guideline source** (priority 10-30). Review notes (priority 50+) cannot be the sole citation for a clinical fact used as the basis for a correct answer.
2. **Review notes are supplemental.** They can directly inform question construction, distractor design, difficulty calibration, clinical reasoning patterns, and common learner traps — without restriction.
3. **Algorithm cards must cite at least one guideline source** in `source_citations`.

## How Agents Use Content Sources

Agents draw from all Content sources in synergy:

- **Guidelines** → correct answers, clinical thresholds, drug choices, contraindications, management algorithms
- **UpToDate** → fallback when guidelines are insufficient for a specific decision point
- **Review notes** (UWorld, AMBOSS, Divine Intervention, Inner Circle) → question structure, presentation patterns, high-yield fork identification, distractor plausibility, difficulty targeting, common student errors

Agents are free to reference review notes by name in their reasoning. The constraint is on **citations in output**: `fact_row.source_name` and `algorithm_card.source_citations` must trace to guideline sources.

## Hard Boundaries

1. **No unsourced facts.** Every `fact_row` requires `source_name` and must cite a guideline (priority 10-30). If a fact cannot be sourced to a guideline, it cannot be used as the basis for a correct answer.
2. **No guideline fabrication.** Agents must cite real guidelines by name. Inventing a guideline name is an auto-kill condition.
3. **No scope expansion.** Content sources cannot add topics that no Scope source covers.
4. **Source citation audit trail.** The `algorithm_card.source_citations` array must contain at least one guideline source. Validators check this.

## Conflict Resolution

When sources disagree:
1. Most recent society guideline wins (check publication year).
2. Specialty society guideline wins over general reference (e.g., AHA > UpToDate for cardiology).
3. Review notes never override guidelines on clinical facts.
4. If unresolvable, the fact is tagged `confidence: 'low'` and the question is flagged for human review.
