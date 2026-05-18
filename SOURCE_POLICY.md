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
| UWorld Step 2 CK | qbank | 50 | Question design, difficulty, traps |
| AMBOSS Step 2 CK | qbank | 51 | Explanation structure, reasoning |
| Divine Intervention Podcast Notes | review | 52 | Clinical patterns, high-yield focus |
| UWorld Inner Circle Step 2 CK Notes | review | 53 | Clinical reasoning, decision forks |

**Priority determines conflict resolution** — lower number wins. Open-access guidelines (10-22) take precedence over review notes (50+).

### Cross-check-only sources (NOT primary)

| Source | Priority | Allowed use |
|---|---|---|
| UpToDate | 30 | Cross-checking a fact already cited to a Tier-A guideline. Never the sole citation. Never quoted. |

UpToDate was demoted from the primary allowlist on 2026-05-15 by the `source-firewall` skill. Rationale: UpToDate is subscription-only and copyrighted; the open-source-only constraint cannot accommodate it as a primary source.

## Citation Rules

1. **Every `fact_row` must cite an open-access guideline source** (priority 10-22). Review notes (priority 50+) and cross-check-only sources (UpToDate, priority 30) cannot be the sole citation for any clinical fact used as the basis for a correct answer.
2. **Review notes are supplemental.** They can directly inform question construction, distractor design, difficulty calibration, clinical reasoning patterns, and common learner traps — without restriction. They cannot supply vignette structure, distractor wording, or explanation phrasing (those are firewall violations — see `source-firewall` skill).
3. **Algorithm cards must cite at least one open-access guideline source** in `source_citations` (priority 10-22).
4. **No primary citation may resolve to a paywalled URL.** Validators check public accessibility.

## How Agents Use Content Sources

Agents draw from all Content sources in synergy:

- **Open-access guidelines (priority 10-22)** → correct answers, clinical thresholds, drug choices, contraindications, management algorithms. **The only acceptable primary source.**
- **Internal `fact_row` corpus** → primary source when authored from Tier-A guidelines.
- **UpToDate (priority 30, cross-check only)** → verify a fact already cited to a guideline. Never the citation of record.
- **Review notes (UWorld, AMBOSS, Divine Intervention, Inner Circle)** → pedagogy reasoning only (what makes a topic high-yield, what traps exist conceptually). May NOT supply: stem openings, vignette constructs, distractor wording, explanation phrasing. Enforced by the `source-firewall` skill and rejection rules R-IP-01 through R-IP-03.

Agents are free to reference review notes by name in their reasoning. The constraint is on **citations in output**: `fact_row.source_name` and `algorithm_card.source_citations` must trace to guideline sources.

## Hard Boundaries

1. **No unsourced facts.** Every `fact_row` requires `source_name` and must cite an open-access guideline (priority 10-22). If a fact cannot be sourced to a Tier-A guideline, it cannot be used as the basis for a correct answer.
2. **No guideline fabrication.** Agents must cite real guidelines by name. Inventing a guideline name is an auto-kill condition.
3. **No scope expansion.** Content sources cannot add topics that no Scope source covers.
4. **No copyrighted primary source.** UpToDate, Harrison's, First Aid, and any review note cannot be the primary citation. Enforced by the `source-firewall` skill (R-IP-03).
5. **Per-item provenance stamp.** Every published `item_draft` carries `source_pack_id`, `source_name`, `source_tier`, and `source_citations[]`. Empty provenance fails the firewall.
6. **Source citation audit trail.** The `algorithm_card.source_citations` array must contain at least one open-access guideline source. Validators check this.

## Conflict Resolution

When sources disagree:
1. Most recent society guideline wins (check publication year).
2. Specialty society guideline wins over general reference (e.g., AHA > UpToDate for cardiology — note UpToDate cannot be primary anyway).
3. Review notes never override guidelines on clinical facts.
4. If unresolvable, the fact is tagged `confidence: 'low'` and the question is flagged for human review.

## Related artifacts

- `.claude/skills/source-firewall/SKILL.md` — operational firewall procedure invoked on every batch.
- `.claude/skills/source-firewall/open-source-allowlist.md` — definitive primary-source list (mirrors this doc).
- `REJECTION_RULES.md` Category 8 (R-IP-01, R-IP-02, R-IP-03) — auto-kill rules for IP / originality violations.
- `BLACKSTAR_MASTER_RUBRIC.md` 9th hard gate — provenance missing or qbank derivation suspected.
