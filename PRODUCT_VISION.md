# Blackstar: Product Vision

## Mission

Build an AI-powered question factory that mirrors how NBME creates board exam items — structured, evidence-based, and adversarially validated — so medical students get questions that train clinical decision-making, not pattern recognition.

## Core Principles

1. **Blueprint-first scope.** Every question traces back to a blueprint node (shelf × system × topic × task_type). If it's not in the blueprint, it doesn't get generated. No topic drift.

2. **Source hierarchy is law.** Scope sources define what's testable. Content sources (guidelines, references, review notes) are all available to agents, but facts must cite a guideline. See `SOURCE_POLICY.md`.

3. **Adversarial validation, not rubber-stamping.** Five independent validators attack each question. A single auto-kill condition ends the item. Validators are adversaries, not cheerleaders.

4. **Decision-focused, not fact-focused.** Questions test clinical reasoning at decision forks — "what do you do next given THIS finding?" — not "what is the mechanism of X?" Explanations teach the decision, not the disease.

5. **Late hinge architecture.** The distinguishing clinical finding appears in the final 1-2 sentences of the vignette. Before the hinge, multiple answers should look plausible. This is how real board questions work.

6. **Cold chart style.** Vignettes read like medical records, not textbooks. No teaching voice, no narrative, no hints. Data in, question out.

7. **Cognitive error targeting.** Every question is designed to exploit a specific cognitive error (anchoring, premature closure, etc.). The most common wrong answer should feel right to someone making that error.

## Ten Operating Rules

Every published item must satisfy the ten elite-tutor rules that govern *how questions teach*. See `ELITE_TUTOR_PRINCIPLES.md` for the full spec with enforcement levers.

1. **Multi-step reasoning** — every item decomposes into 2–4 linked decisions.
2. **30% easy pattern recognition** — the bank requires `easy_recognition` items to detect content gaps.
3. **One zebra maximum** — distractors carry explicit archetypes; exactly one `primary_competitor`, at most one `zebra`.
4. **Teach the "down to two"** — every explanation names the tipping detail + counterfactual.
5. **Explanations ARE the textbook** — teachable from scratch, not feedback addenda.
6. **Capture reasoning, not just answers** — free-text `what_were_you_thinking` on wrong answers.
7. **No softened feedback** — the emotional sting of being wrong drives retention.
8. **Timer visible in practice, enforced in assessment** — 90s countdown with auto-submit.
9. **System-focused → mixed progression** — automatic, driven by `user_progression_phase`.
10. **Question-writer intent on every explanation** — "This question tests whether you prioritize X over Y when Z."

**Success criterion:** Every published item satisfies all ten rules; violations are auto-kills (see `REJECTION_RULES.md` R-REAS-01 through R-EXP-05).

## Anti-Patterns

- **Topic drift:** Generating questions outside the blueprint because Claude thinks they're interesting.
- **Buzzword questions:** "A 45-year-old with a butterfly rash..." where the answer is obvious from sentence one.
- **Teaching vignettes:** Vignettes that explain the pathophysiology or hint at the answer.
- **Asymmetric options:** Mixing medications with diagnostic tests, or having one option that's obviously longer/more detailed.
- **Fact recall disguised as reasoning:** "What is the most common cause of X?" is not a decision question.
- **Unsourced facts:** Using review notes (UWorld, AMBOSS) as the sole citation for a clinical fact without guideline backing.
- **Validator collusion:** All validators passing a mediocre question because prompts are too lenient.

## Success Criteria

| Metric | Target |
|--------|--------|
| Medical accuracy (validator score) | ≥ 8.0 / 10 |
| Blueprint alignment | ≥ 9.0 / 10 |
| NBME quality score | ≥ 7.0 / 10 |
| Option symmetry score | ≥ 7.0 / 10 |
| Pipeline pass rate (items published / items attempted) | ≥ 40% |
| Kill rate (items auto-killed) | 10-30% (too low = weak validators) |
| Distractor distribution on published items | No option chosen < 5% |
| Student accuracy on published items | 40-70% (too easy or too hard = bad calibration) |
