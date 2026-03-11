# Algorithm Card Specification

## What an Algorithm Card Is

An algorithm card is a compressed clinical decision structure for a single testable scenario. It captures the fork — the point where a clinician must choose between competing actions based on a distinguishing finding.

An algorithm card is **not**:
- A disease summary
- A guideline restatement
- A differential diagnosis list
- A treatment protocol

It is the minimum decision structure needed to write one board-quality question.

## Required Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `entry_presentation` | text | How the patient presents (chief complaint + key objective findings) | Must be specific enough to narrow to 2-4 competing paths. Must NOT contain the hinge. 20-60 words. |
| `competing_paths` | text[] | The differential branches from this presentation | 2-4 paths. Each must be a plausible interpretation of the entry presentation. |
| `hinge_feature` | text | The single finding that distinguishes the correct path | Must be a specific, observable clinical datum (lab value, physical finding, imaging result, vital sign pattern). NOT a diagnosis. |
| `correct_action` | text | The evidence-based next step given the hinge | Must be a concrete action (order X, administer Y, perform Z). NOT "manage conservatively" or "treat appropriately." |
| `contraindications` | text[] | Actions that would be harmful in this scenario | At least 1. These become distractor fuel. |
| `source_citations` | text[] | Tier B sources supporting this card | At least 1 society guideline. |
| `time_horizon` | text | Clinical urgency context | One of: immediate, hours, days, weeks, chronic. |
| `severity_markers` | text[] | Objective findings indicating severity level | e.g., ["tachycardia >120", "MAP <65", "lactate >4"]. Used by vignette writer for calibration. |

## What Makes a Card Board-Testable

A card is board-testable when it satisfies ALL of these:

### 1. The fork is a decision, not a fact
- **Good:** "Patient with ascites and fever — do you do paracentesis now or start empiric antibiotics first?"
- **Bad:** "SBP is defined as PMN count >250 in ascitic fluid." (This is a fact, not a fork.)

### 2. The hinge is late-revealable
- The entry presentation must be ambiguous enough that the correct answer is NOT obvious before the hinge is revealed.
- **Test:** Cover the hinge_feature. Can you still determine the correct_action? If yes, the card fails.

### 3. The competing paths lead to different actions
- Each path must result in a meaningfully different clinical action.
- **Bad:** Two paths that both lead to "start antibiotics" (they don't actually compete).

### 4. The wrong actions are tempting
- Contraindications and wrong paths must be things a student would plausibly choose — correct actions for a similar but different scenario.

### 5. The scope fits one question
- A card should generate exactly one question. If a card could support 5 different questions, it's too broad. If it can only support one trivial question, it might be too narrow.

## What Makes a Card Too Guideline-Like

A card is too guideline-like when:

- The `correct_action` reads like a protocol step list ("Start IV fluids, obtain cultures, administer broad-spectrum antibiotics, measure lactate")
- The `entry_presentation` contains the diagnosis ("Patient with confirmed STEMI presents...")
- The `hinge_feature` is a guideline criterion rather than a clinical finding ("Meets SIRS criteria" instead of "Temperature 39.2°C, HR 115, WBC 18,000")
- The card tests whether the student memorized the guideline, not whether they can apply it to a clinical scenario

**Rule:** A card should feel like a patient encounter, not a flowchart step.

## What Makes a Card Too Textbook-Like

A card is too textbook-like when:

- The `entry_presentation` includes classic buzzwords that make the diagnosis trivially obvious ("Sandpaper rash," "Machine-like murmur," "Butterfly rash")
- The `competing_paths` are not genuinely competing (one is obviously wrong)
- The card tests disease recognition rather than management decisions
- The `hinge_feature` is the pathognomonic finding rather than a discriminating clinical datum

**Rule:** If a second-year medical student could answer the question from the entry presentation alone, the card is too textbook-like.

## What Makes a Card Too Broad

- More than 4 competing paths
- `correct_action` that branches into "it depends on..."
- Multiple independent clinical decisions compressed into one card
- Entry presentation that could represent 6+ conditions

**Rule:** One card = one fork = one question.

## What Makes a Card Too Narrow

- Only 1 competing path (nothing to compete with)
- `hinge_feature` that is so specific it eliminates all ambiguity from the entry presentation (no real fork)
- The scenario is so rare that it wouldn't appear on a shelf exam
- The card can only generate one distractor (need 4 wrong answers for a 5-option question)

**Rule:** A card must support at least 4 plausible answer choices from its competing paths and contraindications.

## Algorithm Card Status Lifecycle

| Status | Meaning | Gate |
|--------|---------|------|
| `draft` | Freshly extracted by algorithm_extractor | None |
| `truth_verified` | All facts checked against Tier B sources | medical_validator confirms source accuracy |
| `translation_verified` | Confirmed as board-testable decision fork | exam_translation_validator confirms fork quality |
| `generation_ready` | Approved for item generation | Both truth + translation verified |
| `retired` | No longer used for generation | Manual or automated retirement |

**Hard rule:** Item generation (item_planner, vignette_writer) may ONLY pull from cards with status `generation_ready`.

## Acceptance Criteria Summary

An algorithm card is `generation_ready` when:

1. Entry presentation is specific but ambiguous (hinge-dependent)
2. 2-4 genuinely competing paths exist
3. Hinge is a concrete clinical datum, not a diagnosis
4. Correct action is a specific, evidence-based intervention
5. At least 1 contraindication exists (distractor fuel)
6. At least 1 Tier B source cited
7. The fork tests a decision, not a fact
8. The hinge is late-revealable (covering it leaves the answer uncertain)
9. Severity markers are present and calibrated
10. A competent clinician would agree the correct action is correct
