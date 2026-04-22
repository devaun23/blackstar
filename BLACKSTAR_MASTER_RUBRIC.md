# Blackstar Master Rubric

## Purpose
This rubric scores Blackstar items, explanations, and adaptive outputs. It supports human review, model based rubric grading, and automated pipeline gating.

## Core rule
Use hard gates first. If a hard gate fails, the item fails regardless of total score.

## Score bands
- Publish: 90 to 100
- Revise: 80 to 89
- Major Revision: 70 to 79
- Reject: below 70

## Hard gate fail conditions
- Medical inaccuracy or unsafe management recommendation
- No single best answer
- Stem or explanation gives away the diagnosis too directly
- Option symmetry is broken without justified clinical fork
- Explanation teaches the wrong transfer rule
- Item is materially out of shelf or NBME scope
- Distractors are implausible or obviously weaker than the key
- Metadata required for learner modeling is missing

## Required metadata
- item_id
- shelf
- system
- blueprint_node
- concepts_tested
- cognitive_operation
- transfer_rule_text
- hinge_clue
- hinge_depth_target
- confusion_set
- cognitive_error_targets
- difficulty_target
- intended_user_stage
- explanation_goal
- tags

## Weighted domains out of 100
- Medical correctness and scope: 15
- Blueprint alignment: 8
- NBME stem fidelity: 12
- Hinge design and ambiguity control: 10
- Option set quality and symmetry: 12
- Key integrity: 5
- Explanation quality: 15
- Learner modeling value: 8
- Adaptive sequencing utility: 5
- Production readiness: 10

## Domain standards

### Medical correctness and scope 15
- 15: Fully correct, exam fair, no safety or factual issues
- 12: Minor imprecision but core reasoning is correct
- 8: Noticeable looseness that weakens fairness
- 0: Incorrect, unsafe, or multiple options defensible

### Blueprint alignment 8
- 8: Perfect blueprint fit
- 6: Mostly aligned
- 3: Adjacent material dominates
- 0: Off blueprint

### NBME stem fidelity 12
- 12: Reads like real NBME style
- 9: Mostly faithful
- 5: Educational or artificial
- 0: Obvious diagnosis or non NBME tone

### Hinge design and ambiguity control 10
- 10: True hinge with fair ambiguity
- 7: Good hinge but slightly too easy or too buried
- 4: Weak hinge or unfair resolution
- 0: No true hinge

### Option set quality and symmetry 12
- 12: Excellent set, all plausible, one best answer
- 9: One distractor weaker than ideal
- 5: Cueing or uneven option class
- 0: Broken set or no single best answer

### Key integrity 5
- 5: Robust key
- 3: Correct but challengeable phrasing
- 0: Unstable key

### Explanation quality 15
- 15: Concise, accurate, fixes exact reasoning problem
- 12: Strong but slightly long or generic
- 8: Useful but incomplete
- 0: Wrong, bloated, or wrong transfer rule

### Learner modeling value 8
- 8: Highly diagnostic of a specific weakness
- 6: Useful but not maximally specific
- 3: Mostly topic tagging
- 0: Cannot inform learner modeling

### Adaptive sequencing utility 5
- 5: Clear next item logic
- 3: Some adaptive value
- 1: Weak sequencing signal
- 0: No adaptive use

### Production readiness 10
- 10: Ready to publish
- 7: Minor cleanup needed
- 4: Needs structured repair
- 0: Cannot be reliably ingested

## Explanation only rubric out of 30
- Transfer rule clarity: 6
- Hinge identification: 5
- Correct answer defense: 5
- Tempting distractor analysis: 5
- Cognitive error diagnosis: 5
- Brevity and memorability: 4

## Learner modeling rubric out of 20
- Attribute specificity: 5
- Confusion set clarity: 4
- Cognitive error observability: 4
- Transfer sensitivity: 4
- Sequencing usefulness: 3

## Promptable evaluator questions
- Does the case preserve NBME style ambiguity until the intended hinge clue appears?
- Is there exactly one best answer for the intended reason?
- Are the wrong answers plausible enough to reflect realistic test taker traps?
- Does the explanation begin with the correct portable transfer rule?
- Does the explanation explicitly identify the hinge clue?
- Does the explanation diagnose the likely cognitive error behind the tempting distractor?
- Would this item produce useful learner model information beyond generic topic performance?
- Can this item support a clear adaptive next step if the learner passes or fails?

## Minimal publish threshold
- Hard gate pass required
- Medical correctness and scope at least 12 out of 15
- NBME stem fidelity at least 9 out of 12
- Option set quality and symmetry at least 9 out of 12
- Explanation quality at least 12 out of 15
- Learner modeling value at least 6 out of 8
- Total score at least 90 out of 100
