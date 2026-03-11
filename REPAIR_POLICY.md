# Repair Policy

## Purpose

Defines when failed items get repaired vs discarded. Prevents zombie items from looping endlessly through low-quality repair cycles.

## Max Repair Attempts

**Global maximum: 3 repair cycles per item.**

After 3 failed validation rounds, the item is killed regardless of validator scores.

## Kill Conditions (Immediate — No Repair Attempt)

These failures are unrepairable. The item is killed on first occurrence:

| Condition | Validator | Rule |
|-----------|-----------|------|
| Correct answer is medically incorrect | medical_validator | R-MED-01 |
| Any option recommends a harmful action | medical_validator | R-MED-02 |
| Clinical presentation doesn't match intended diagnosis | medical_validator | R-MED-03 |
| Medical accuracy score < 3.0 | medical_validator | R-MED-06 |
| Fabricated guideline cited | medical_validator | R-SRC-02 |
| No Tier B source in algorithm card | medical_validator | R-SRC-03 |
| Question tests a different topic than blueprint | blueprint_validator | R-BP-01 |
| Item is guideline recall, not a decision fork | exam_translation_validator | — |

**Rationale:** These failures indicate a fundamentally broken item. Repair would require regenerating the core content, which is the algorithm extractor's job, not the repair agent's.

## Repairable Failures

These failures can be fixed by targeted edits:

| Failure Type | Typical Fix | Max Attempts |
|--------------|-------------|--------------|
| Hinge appears too early in vignette | Restructure vignette paragraph order | 2 |
| Teaching voice in vignette | Rewrite to cold chart style | 2 |
| Options not from same class | Replace mismatched options | 1 |
| Option length imbalance | Trim/expand options for balance | 2 |
| Classic buzzword makes answer obvious | Replace buzzword with clinical description | 2 |
| Explanation is a disease lecture | Rewrite with decision focus | 2 |
| why_wrong is generic | Rewrite with specific reasoning | 2 |
| Task type mismatch in stem | Rewrite stem to match blueprint task type | 1 |
| Clinical setting mismatch | Adjust vignette setting details | 1 |
| Weak distractors | Replace with plausible alternatives | 2 |

## Per-Validator Kill Thresholds

If a specific validator fails the item on consecutive cycles, kill it:

| Validator | Consecutive Fails to Kill |
|-----------|--------------------------|
| medical_validator | 2 |
| exam_translation_validator | 2 |
| blueprint_validator | 2 |
| nbme_quality_validator | 3 |
| option_symmetry_validator | 3 |
| explanation_validator | 3 |

**Rationale:** Medical accuracy, exam translation, and blueprint alignment are structural problems. If the repair agent can't fix them in 2 tries, the algorithm card or item plan is likely flawed. NBME quality, option symmetry, and explanation quality are more surface-level and may take an extra attempt.

## Repair Agent Constraints

1. **Targeted repairs only.** The repair agent must fix specific flagged issues, not regenerate the entire question.
2. **Correct answer is immutable.** The repair agent may NOT change the correct answer. If the correct answer is wrong, the item must be killed.
3. **No new clinical facts.** The repair agent must work within the existing algorithm card and fact rows. It cannot invent new medical information.
4. **Priority ordering.** When validator instructions conflict, follow the priority order in AGENT_CONTRACTS.md (medical > exam translation > blueprint > NBME quality > option symmetry > explanation quality).
5. **Identical output = kill.** If the repair agent returns an item identical to its input, the item is killed immediately (R-PIPE-02).

## Pipeline Orchestrator Responsibilities

The pipeline orchestrator (not the repair agent) is responsible for:

1. Tracking repair cycle count per item
2. Checking per-validator consecutive fail counts
3. Enforcing kill conditions before sending to repair
4. Killing items that exceed max repair attempts
5. Logging kill reasons in `pipeline_run.agent_log`

## Post-Kill Analysis

When an item is killed, the pipeline should log:
- Which validator(s) caused the kill
- The specific issues that were unrepairable
- The algorithm card ID (to flag potentially bad cards)
- The repair cycle count at time of kill

If an algorithm card produces 3+ killed items, it should be flagged for review and its status downgraded from `generation_ready` to `draft`.
