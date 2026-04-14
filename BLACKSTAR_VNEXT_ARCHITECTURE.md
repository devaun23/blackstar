# Blackstar vNext Architecture: One Mode, One Loop

## The Promise

Every question feels like a real NBME cognitive rep that simultaneously tests reasoning, reinforces content, reveals weakness, and improves transfer.

One mode. One loop. One engine.

---

## Core Abstraction: Decision Rule Card

The atomic unit is not a question, a topic, or a diagnosis. It is a **tested decision rule under uncertainty**.

### Schema: `decision_rule`

```
id                    UUID PRIMARY KEY
organ_system          TEXT NOT NULL          -- cardiology, pulm, renal, etc.
presentation_family   TEXT NOT NULL          -- "acute chest pain", "postoperative oliguria"
tested_rule           TEXT NOT NULL          -- "When BUN/Cr and FENa disagree, FENa wins"
competing_frames      JSONB NOT NULL         -- [{diagnosis, key_features, why_tempting}]
hinge_clue_types      TEXT[]                 -- ["lab_pattern", "vital_sign_pattern"]
urgency_class         TEXT                   -- immediate, urgent, elective
first_wrong_branch    TEXT NOT NULL          -- the most common wrong path novices take
novice_error          TEXT NOT NULL          -- named cognitive error (premature_closure, severity_miss)
overthinker_error     TEXT                   -- the trap for students who know too much
explanation_core      TEXT NOT NULL          -- 2-3 sentence teaching payload
transfer_variants     JSONB NOT NULL         -- [{age, setting, presenting_complaint, task_type}]
disguise_dimensions   TEXT[]                 -- what can vary: age, setting, labs, comorbidities
related_rules         UUID[]                 -- prerequisite or sibling rules
prerequisite_content  TEXT[]                 -- what the learner must know first
difficulty_base       INT NOT NULL           -- 1-5 baseline difficulty
difficulty_modifiers  JSONB                  -- {deep_hinge: +1, multiple_comorbidities: +1}
source_citations      TEXT[]
created_at            TIMESTAMPTZ DEFAULT NOW()
```

### Relationship to Existing Objects

```
decision_rule (NEW — the nucleus)
  ├── algorithm_card (existing — becomes subordinate evidence)
  │     └── fact_row (existing — supporting data points)
  ├── confusion_set (existing — which rules get confused)
  ├── transfer_rule (existing — the portable principle)
  ├── error_taxonomy (existing — what goes wrong)
  └── item_plan → item_draft (existing — generated instances of this rule)
```

The decision_rule OWNS the generation pipeline. An algorithm_card provides the medical evidence. A confusion_set links rules that students confuse with each other. The item_plan generates a specific exam-like instance of the rule.

---

## The One Loop

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │ 1. SELECT │───▶│ 2. PLAN  │───▶│ 3. BUILD │  │
│   │ weakness  │    │ item     │    │ item     │  │
│   └──────────┘    └──────────┘    └──────────┘  │
│        ▲                               │        │
│        │                               ▼        │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │ 6. SCHED │◀───│ 5. DIAG  │◀───│ 4. VALID │  │
│   │ transfer │    │ failure  │    │ fidelity │  │
│   └──────────┘    └──────────┘    └──────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 1: SELECT — Choose what to test

Input: learner weakness model
Output: a `decision_rule` + target failure mode + desired difficulty

The selector queries the weakness model and picks the rule with the highest expected learning value. Factors:

- **Weakness priority**: rules the learner has failed recently
- **Spacing schedule**: rules due for retention check
- **Coverage**: rules not yet tested at all
- **Transfer readiness**: rules the learner passed once but hasn't transferred to a novel context
- **Prerequisite chain**: don't test advanced rules before foundations are solid

### Step 2: PLAN — Design the cognitive challenge

Input: decision_rule + target failure + difficulty
Output: item_plan with specific disguise parameters

The planner selects from the rule's `transfer_variants` and `disguise_dimensions`:

- Which age/setting/presenting complaint to use
- Which hinge depth (surface/buried/deep)
- Which distractor psychology to deploy
- Which competing frame to make most tempting
- Whether to test the rule directly or test transfer to a novel context

**Key constraint**: if the learner has seen this rule before, the planner MUST choose a different disguise. Same rule, new wrapper.

### Step 3: BUILD — Generate the item

Input: item_plan
Output: vignette + stem + options + explanation layers

The existing pipeline (case_planner → skeleton_writer → vignette_writer) executes the plan. The explanation writer produces all 3 layers.

### Step 4: VALIDATE — Enforce exam fidelity

Input: generated item
Output: pass/fail with specific defect categories

The 8 item rules, enforced as validators:

| Rule | Validator Check |
|------|----------------|
| 1. No named diagnosis if learner should infer | Scan vignette for disease names that appear in correct answer |
| 2. Declares tested decision rule | item_plan.decision_rule_id is set |
| 3. Declares target failure mode | item_plan.target_error is set |
| 4. Two plausible interpretations until late | Hinge appears in bottom 30% of vignette |
| 5. Every wrong answer = realistic cognitive error | All 4 distractors have error_map entries |
| 6. Feeds back at reasoning level | error_map values are specific (not just "wrong") |
| 7. Novel wrapper for repeated weakness | Check learner hasn't seen same disguise combo |
| 8. Explanation: hinge + medicine + why alternatives fail | All 3 layers are non-empty |

**Kill threshold**: fail any rule → item does not ship. No "good enough."

### Step 5: DIAGNOSE — Classify the failure

Input: learner's answer + item metadata
Output: specific failure classification

Not just "wrong." The diagnosis must identify:

- **Which decision rule** was being tested
- **Which competing frame** the learner chose
- **Which cognitive error** that represents (premature closure, severity miss, etc.)
- **Why** — was it knowledge gap, misread, between-two, or rushed?
- **Repeat status** — has this exact failure pattern occurred before?

This already exists in the attempt-v2 flow + repair engine. The gap is connecting it to decision_rule granularity.

### Step 6: SCHEDULE — Plan the re-exposure

Input: failure diagnosis
Output: next encounter parameters

The re-exposure is NOT "same question later." It is:

- Same decision rule
- Different disguise (age, setting, complaint, lab values)
- Potentially different task type (diagnosis → management, or vice versa)
- Spaced according to the learner's track record with this specific rule

The scheduling algorithm:

```
if first_miss:
  → immediate contrast (same confusion set, different correct answer)
  → then 1-day spacing

if repeat_miss (same rule):
  → remediate (simpler version, lower difficulty)
  → then 12-hour spacing

if correct_after_miss:
  → schedule transfer test (same rule, novel setting)
  → spacing: 1d → 3d → 7d → 14d → 30d

if correct_on_transfer:
  → rule marked as "generalizing"
  → enter long-term retention queue
```

---

## The 8 Item Rules (Enforcement Spec)

### Rule 1: No diagnosis giveaway

**Check**: The correct answer's disease/condition name must NOT appear in the vignette or stem. If the question tests "what is the diagnosis," the vignette cannot contain the answer. If the question tests management, the diagnosis can appear only if it's genuinely ambiguous.

**Validator**: `no_diagnosis_giveaway_validator` — regex + semantic check against correct answer entity.

### Rule 2: Every item declares its decision rule

**Check**: `item_plan.decision_rule_id` must reference a valid `decision_rule` record. The item is generated FROM a rule, not retroactively tagged.

**Validator**: FK constraint + pipeline enforcement.

### Rule 3: Every item declares its target failure

**Check**: `item_plan.target_cognitive_error` must be a specific entry from `error_taxonomy`, not a generic label.

**Validator**: existing `case_plan.target_cognitive_error_id` — already implemented.

### Rule 4: Late hinge placement

**Check**: The finding that resolves ambiguity should appear in the final 30% of the vignette (by character count). Earlier placement makes the question too easy.

**Validator**: `hinge_placement_validator` — checks character position of the declared hinge finding.

### Rule 5: Realistic distractor errors

**Check**: Each of the 4 wrong answers must map to a named cognitive error from the taxonomy. No distractor should be obviously wrong to anyone who read the vignette.

**Validator**: existing `option_symmetry_validator` + `error_map` completeness check.

### Rule 6: Reasoning-level feedback

**Check**: When a learner misses, the system records the failure at the `decision_rule` level, not just the topic level. The weakness model must update the specific rule's mastery, not just "cardiology."

**Validator**: post-attempt check that `decision_rule_id` is propagated to `learner_model`.

### Rule 7: Novel re-exposure

**Check**: When serving a previously-failed rule, the system must select a different combination from `transfer_variants`. The learner should not see the same age + setting + presenting complaint twice.

**Validator**: pre-serve check against `attempt_v2` history for this `decision_rule_id`.

### Rule 8: Three-layer explanation

**Check**: Every explanation must have:
- Layer 3 (Fix): error name + transfer rule — what went wrong and the portable principle
- Layer 2 (Breakdown): hinge identification + reasoning pathway + per-option analysis
- Layer 1 (Medicine): clinical content, pathophysiology, key facts

**Validator**: non-empty check on all three layers.

---

## Weakness Model (vNext)

### Current: 6 dimensions × mastery level

```
topic, cognitive_error, confusion_set, transfer_rule, action_class, hinge_clue_type
```

### vNext: Decision Rule mastery

```
decision_rule_id → {
  mastery_level: float,      // 0-1, Bayesian-smoothed
  total_encounters: int,     // times this rule was tested
  correct_count: int,
  consecutive_correct: int,
  last_failure_error: text,  // which error type on last miss
  disguises_seen: jsonb,     // [{age, setting, complaint}] — for novelty enforcement
  transfer_tested: bool,     // has the learner seen this rule in a novel context?
  transfer_passed: bool,     // did they get it right in the novel context?
  next_review_due: timestamptz,
  spacing_level: int,        // 0=immediate, 1=1d, 2=3d, 3=7d, 4=14d, 5=30d
}
```

This is a superset of the current `learner_model` table. The key addition: tracking at the `decision_rule` level with `disguises_seen` for novelty enforcement.

---

## Migration Path: Current → vNext

### Phase 1: Decision Rule Cards (seed from existing data)

1. Create `decision_rule` table
2. For each existing `algorithm_card`, generate a `decision_rule` that captures:
   - The tested rule (from `hinge_feature` + `correct_action`)
   - Competing frames (from `competing_paths`)
   - Transfer variants (from blueprint node's age/setting/task combinations)
3. Link existing `item_draft` records to their parent `decision_rule`

### Phase 2: Item Plan upgrade

1. Add `decision_rule_id` FK to `case_plan`
2. Update the case planner prompt to select from `decision_rule` instead of just `blueprint_node`
3. Add `disguise_parameters` field to case_plan (which variant is being used)

### Phase 3: Weakness model upgrade

1. Add `decision_rule_id` dimension to `learner_model`
2. Update `attempt-v2` to record `decision_rule_id`
3. Update selector to query weakness at the rule level

### Phase 4: Novelty enforcement

1. Track `disguises_seen` per learner per rule
2. Update item planner to exclude previously-seen disguise combinations
3. Add `novel_wrapper_validator` to the pipeline

### Phase 5: Validator stack upgrade

1. Add `no_diagnosis_giveaway_validator`
2. Add `hinge_placement_validator` (character position check)
3. Tighten existing validators to enforce all 8 rules

---

## Example: One Cardiology Rule Through the Loop

### Decision Rule Card

```json
{
  "tested_rule": "In STEMI with cardiogenic shock, emergent PCI takes priority over all supportive measures",
  "presentation_family": "acute chest pain with hemodynamic instability",
  "competing_frames": [
    {"diagnosis": "STEMI", "action": "emergent PCI", "why_tempting": "correct but students delay for stabilization"},
    {"diagnosis": "STEMI", "action": "vasopressor support first", "why_tempting": "seems logical to stabilize before intervening"},
    {"diagnosis": "aortic dissection", "action": "imaging then surgery", "why_tempting": "chest pain + hypotension overlap"}
  ],
  "first_wrong_branch": "Start dobutamine/vasopressors before cath lab activation",
  "novice_error": "severity_miss",
  "overthinker_error": "sequencing_error — knowing that shock needs pressors but not realizing reperfusion is definitive",
  "transfer_variants": [
    {"age": "54M", "setting": "ED", "complaint": "crushing chest pain", "task": "next_step"},
    {"age": "72F", "setting": "ICU transfer", "complaint": "post-arrest with STEMI", "task": "management_priority"},
    {"age": "45M", "setting": "rural ED", "complaint": "chest pain, 2hr to PCI center", "task": "fibrinolytic_vs_transfer"}
  ]
}
```

### Loop execution

1. **SELECT**: Learner missed "severity prioritization" 2 days ago. This rule is due for transfer test.
2. **PLAN**: Pick variant 2 (72F, ICU, post-arrest) — learner hasn't seen this disguise yet. Hinge depth: deep (the STEMI diagnosis is buried in post-arrest workup noise).
3. **BUILD**: Generate vignette about a 72-year-old found unresponsive, ROSC achieved, now intubated. ECG shows ST elevations. The hinge is the ECG finding buried after pages of resuscitation details.
4. **VALIDATE**: All 8 rules pass. Diagnosis not named. Hinge in final 25% of vignette. All distractors map to real errors.
5. **DIAGNOSE**: Learner correctly identifies emergent PCI. Transfer test passed.
6. **SCHEDULE**: Rule enters long-term retention. Next review in 7 days with variant 3 (rural ED, fibrinolytic decision).

---

## What This Replaces

| Current | vNext |
|---------|-------|
| 3 study modes (retention/training/assessment) | 1 mode + optional timed exam |
| Blueprint node as generation seed | Decision rule as generation seed |
| Topic-level weakness tracking | Rule-level weakness tracking |
| Same-question spaced repetition | Novel-disguise transfer testing |
| 6 validators (quality focused) | 8 validators (quality + fidelity + reasoning) |
| Algorithm card as medical truth | Decision rule as the tested principle, algorithm card as evidence |

---

## Success Metrics

The system is working when:

1. **No question feels easy** — if a learner can answer without genuine uncertainty, the item failed
2. **Every miss is diagnosable** — the system can name the exact failure, not just "wrong"
3. **Every re-exposure is novel** — the learner never sees the same wrapper twice
4. **Transfer generalizes** — passing a rule in one context predicts passing in another
5. **Mastery is durable** — 30-day retention rate on transferred rules exceeds 80%
