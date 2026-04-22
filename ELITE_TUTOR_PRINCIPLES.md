# Elite Tutor Principles

## Purpose

Ten operating rules distilled from elite Step 2 CK tutors and 270+ scorers. They describe how questions **function as teaching tools**, not how questions are built. Blackstar's pipeline already generates NBME-grade items; these rules govern how those items *teach* the student.

Each rule is stated as an enforceable criterion with the schema/validator/UI lever that enforces it, and a one-line test for detecting violations.

---

## Rule 1 — Questions test decisions under uncertainty, not knowledge under certainty

The USMLE requires, on average, three correct sequential decisions to reach the best answer. A well-built Blackstar item decomposes into 2–4 linked decisions, each resolvable from the stem.

- **Lever:** `case_plan.reasoning_step_count` (2–4) + `case_plan.reasoning_steps[]` (each with `what_student_must_recognize` + `clinical_signal`). Enforced by `nbme_quality_validator`.
- **Test:** A reader who skips any single `reasoning_steps[]` entry should get the wrong answer.

## Rule 2 — The 270+ student does not miss easy questions

Easy pattern-recognition items are essential: they detect content gaps and build the speed needed for time management. ~30% of the bank must be `easy_recognition`, ~60% `decision_fork`, ~10% `hard_discrimination`.

- **Lever:** `case_plan.difficulty_class` enum. Batch generator `--difficulty-mix` flag enforces generation distribution. Session selector ensures mix per session.
- **Diagnostic signal:** When a user misses a `difficulty_class='easy_recognition'` item, the repair engine emits a distinct "content gap" message instead of a standard "wrong answer" correction.
- **Test:** Any competent student should get every `easy_recognition` item correct. If ≥30% of strong users miss one, the item is miscategorized.

## Rule 3 — Stop rewarding zebras

Step 2 tests common conditions with common management. Distractor archetypes must be explicitly assigned: exactly one `correct`, exactly one `primary_competitor` (tempting to a strong student), 0–1 `zebra` (exotic trap), the rest `near_miss` / `implausible` / `neutral`.

- **Lever:** `case_plan.option_frames[].archetype` enum. Enforced by `option_symmetry_validator` + schema `superRefine`.
- **Test:** Every item has exactly one `primary_competitor` and at most one `zebra`. More than one zebra = auto-kill (R-OPT-05).

## Rule 4 — Teach the "down to two" skill explicitly

When a student narrows to two answers, the discriminating skill is re-reading the stem for a single decisive detail. Every explanation teaches this.

- **Lever:** `explanation.down_to_two_discrimination` = `{ competitor_option, tipping_detail, counterfactual }`. `counterfactual` must state the scenario where the competitor would be correct. Data already carried in `option_frames[].pivot_detail` and `option_frames[].correct_if` — explanation writer surfaces it.
- **Test:** Reading `tipping_detail` aloud and then the stem must make the correct answer feel inevitable.

## Rule 5 — Explanations ARE the textbook

Comprehensive explanations are not feedback — they are the primary teaching mechanism. A student who has never studied the topic must be able to read the explanation and know everything board-testable about it.

- **Lever:** v22 `medicine_deep_dive` (pathophysiology, diagnostic_criteria, management_algorithm, monitoring, high_yield_associations), `comparison_table`, `pharmacology_notes`. Enforced by `explanation_validator` including new `teachable_from_scratch` rubric.
- **Test:** A student who has never studied this topic should be able to read the explanation and answer a different question on the same topic correctly.

## Rule 6 — Capture the student's reasoning, not just their answer

Wrong answers should prompt a single-line free-text: *"What were you thinking when you picked [their answer]?"* This is metacognitive gold. We don't need to analyze it computationally now — just capture it for later pattern-mining.

- **Lever:** `attempt_v2.what_were_you_thinking TEXT NULL`. UI: pre-focused, optional input on wrong-answer feedback. `self_labeled_error` also persisted end-to-end.
- **Test:** For any wrong answer in the last 30 days, we can join `attempt_v2` → `questions` → surface the student's stated reasoning next to the correct answer.

## Rule 7 — Do not soften wrong-answer feedback

The emotional sting of being wrong drives retention. Banners must be clear and immediate. Error classifications must be direct. Transfer rules must feel like corrections, not suggestions. No "Nice try!" / "Don't worry!" language.

- **Lever:** `UX_PRINCIPLES.md` (canonical). Regression check enumerated in verification.
- **Test:** grep the study-feedback UI for softening phrases; none permitted.

## Rule 8 — Time pressure is a feature

Practice mode exposes an optional per-question count-up timer (off by default, toggled at session start). Assessment mode enforces a per-question countdown with warning at 30s and force-submit at 0s. Response time already penalizes mastery above 60s.

- **Lever:** Session picker toggle for practice; `session_mode='assessment'` forces countdown. Mastery penalty lives in `src/lib/learner/model.ts`.
- **Test:** Assessment sessions auto-submit at 0s; practice sessions have no forced submit.

## Rule 9 — System-focused blocks first, mixed blocks later

Early users (first ~200 attempts) learn best from system-clustered sessions that build pattern density. Mid-range (200–800) benefits from partial mixing. Advanced (800+) uses fully randomized blocks to simulate the real exam.

- **Lever:** `learner_model.user_progression_phase` derived from `total_attempts`. Selector biases same-system selection in `system_clustered` phase, relaxes in `partially_mixed`, randomizes in `fully_random`. Automatic, not user-configured.
- **Test:** For a user with <200 attempts, ≥80% of consecutive questions share a system. For ≥800, distribution is indistinguishable from uniform-by-blueprint.

## Rule 10 — Teach the student to think like the question writer

Every explanation includes one sentence on question-writer intent: *"This question tests whether you prioritize X over Y when Z."* Over hundreds of items, students who internalize writer intent develop NBME instinct.

- **Lever:** `explanation.question_writer_intent: string (20–200 chars)`. Enforced by `explanation_validator` template rubric.
- **Test:** The sentence must fit the template "This question tests whether you prioritize X over Y when Z" and must not simply restate the transfer rule.

---

## Enforcement Summary

| Rule | Generation lever | Runtime lever |
|---|---|---|
| 1 | `case_plan.reasoning_steps[]` + `nbme_quality_validator` | — |
| 2 | `case_plan.difficulty_class` + `--difficulty-mix` batch flag | Selector ensures mix per session; repair engine flags easy-miss |
| 3 | `option_frame.archetype` + `option_symmetry_validator` | — |
| 4 | `explanation.down_to_two_discrimination` + `explanation_validator` | `DownToTwoCard` UI |
| 5 | `medicine_deep_dive` + `teachable_from_scratch` rubric | — |
| 6 | — | `attempt_v2.what_were_you_thinking` + `MetacognitiveInputs` free-text |
| 7 | — | `UX_PRINCIPLES.md` + grep regression |
| 8 | — | Per-question timer (practice toggle, assessment enforce) + 15% mastery penalty |
| 9 | — | `user_progression_phase` + selector clustering logic |
| 10 | `explanation.question_writer_intent` + `explanation_validator` template | Renders as Fix-layer footer |

Every item published after these rules land must satisfy all ten. Violations are auto-kills (see `REJECTION_RULES.md` R-REAS-01 through R-EXP-05).
