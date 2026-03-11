# Distillation Policy

## Purpose

Defines how prep-style resources (qbanks, review materials, study aids) may influence the system. Prevents source laundering — the accidental use of Tier C content as clinical truth.

## Core Rule

**Prep resources are never directly available to content-generating agents.**

The vignette writer, algorithm extractor, and explanation writer must NEVER receive raw content from UWorld, AMBOSS, or any Tier C source. Not as context. Not as examples. Not as "inspiration." Not in prompts.

## What Prep Resources Can Inform

Prep resources may be used **only** through a formal distillation process that extracts abstract patterns, not specific content.

### Allowed Extractions

| What | Example | Use |
|------|---------|-----|
| High-yield fork candidates | "PE questions often hinge on Wells score + D-dimer" | Inform blueprint node selection and fork target prioritization |
| Common learner traps | "Students often anchor on chest pain = ACS and miss PE" | Inform error taxonomy and cognitive error targeting |
| Explanation patterns | "Decision-first explanations work better than disease-first" | Inform explanation writer prompt design |
| Difficulty calibration | "A good medicine shelf question has 40-60% accuracy" | Inform success criteria and validator thresholds |
| Option construction patterns | "Options should be from the same pharmacological class" | Inform option symmetry validator rules |

### Prohibited Extractions

| What | Why |
|------|-----|
| Specific clinical thresholds | May be outdated or wrong in the source |
| Correct answers to specific scenarios | Defines truth — must come from Tier B |
| Vignette text or structure | Direct copying or close paraphrasing |
| Specific patient demographics | Could reproduce biased patterns |
| Exact distractor sets | These are copyrighted content |

## Distillation Process

When prep resources inform system design (fork targets, error taxonomy, validator rules):

### Step 1: Extract the abstract pattern
- "UWorld PE questions often test the decision to anticoagulate vs observe based on hemodynamic stability"
- This is an abstract pattern about what decisions are testable.

### Step 2: Verify against Tier B sources
- Check: Do AHA/ACC guidelines actually define a decision fork based on hemodynamic stability in PE?
- If yes: The fork target is valid (but the truth comes from the guideline, not UWorld).
- If no: The extraction is discarded.

### Step 3: Record the verified pattern
- The fork target enters the system as a blueprint node or fork target, citing the Tier B source.
- The Tier C source is never referenced in the final product.

## Isolation Architecture

```
Tier C Sources (UWorld, AMBOSS)
    │
    ▼
[Distillation Layer — human or offline process]
    │
    ├── Fork target candidates → verified against Tier B → MEDICINE_T1_FORK_TARGETS.csv
    ├── Learner trap patterns → verified → error_taxonomy seeds
    └── Style patterns → inform prompt design (not content)

    ▼  (WALL — nothing below this line ever sees Tier C content)

[Agent System]
    ├── algorithm_extractor ← Tier B sources only
    ├── vignette_writer ← algorithm card + facts only
    ├── validators ← item draft + card + facts only
    └── explanation_writer ← item draft + card + facts only
```

## Enforcement

1. **Agent prompts must not reference Tier C sources.** No prompt should mention UWorld, AMBOSS, or any qbank by name as a content source.
2. **Seed data citations.** Every entry in `error_taxonomy`, `source_registry`, and `blueprint_node` must trace to a Tier A or Tier B source for its clinical content.
3. **Validator check.** The medical_validator must flag any item whose content appears to be directly derived from a qbank question (unusual demographic combinations, proprietary clinical vignette structures).

## Why This Matters

Without this policy, the system will eventually drift toward:
1. **Source laundering:** "The algorithm extractor used AMBOSS as a reference, so the facts are probably right" — but AMBOSS may be wrong or outdated.
2. **Copyright risk:** Generating questions that closely resemble copyrighted qbank items.
3. **Circular reasoning:** Training on qbank patterns to produce qbank-like questions, without grounding in primary evidence.

The distillation layer breaks this cycle by ensuring that prep resources inform *what to test* (scope decisions) but never *what is true* (clinical content).
