# UX Principles

## Purpose

Governance for the learner-facing UI. Content generation is governed by `PRODUCT_VISION.md` + `ELITE_TUTOR_PRINCIPLES.md`; this doc governs how students *experience* the product.

These are enforceable rules, not stylistic preferences. A PR that violates any of these is rejected, the same as a PR that violates `REJECTION_RULES.md`.

---

## 1. The emotional arc is load-bearing

The learning loop is: **failure → diagnosis → correction → redemption**. Each stage is a distinct emotional beat that creates durable memory. Softening any stage flattens the arc and weakens retention. This is pedagogy, not friction.

- **Failure:** wrong-answer state must be unambiguous (red banner, "Incorrect", selected answer struck through).
- **Diagnosis:** the cognitive-error badge + transfer rule appear *immediately*, in the same card, no animation delay.
- **Correction:** the next question (repair-routed: contrast / remediate / transfer_test) is positioned as a second chance, not a punishment.
- **Redemption:** getting the repair question right is celebrated ("You closed the gap on [pattern]"). Getting it wrong again surfaces the `Nx repeat` badge.

## 2. Do not soften wrong-answer feedback (Rule 7)

Prohibited phrases anywhere in the feedback UI:

- "Nice try"
- "Don't worry"
- "Close call"
- "So close"
- "Almost had it"
- Emoji softeners (👍, 😊, 🤞) on incorrect states
- Exclamation marks on incorrect banners
- Hedging language on error classifications ("might be anchoring" vs "You anchored on X")

Permitted and required:

- "Incorrect" banner (plain text, red)
- Direct error naming ("You anchored on the cardiac history and missed the sepsis")
- Declarative transfer rule ("When BP < 90, always fluid-resuscitate before workup")
- Repeat counter badges (`2x repeat`, `3x repeat`) when applicable

This is verified by a grep regression check before every release.

## 3. Timer policy (Rule 8)

**Practice mode** (`session_mode='training'` or `'retention'`):
- Per-question count-up timer available; **off by default**
- Toggle lives in `session-picker.tsx` at session creation
- When on, timer displays elapsed seconds next to the question counter
- No forced submission; user can take as long as they want

**Assessment mode** (`session_mode='assessment'`):
- Per-question countdown timer **mandatory and non-toggleable**
- Default 90s per question (configurable at session creation)
- Visual state transitions:
  - 90s–31s: neutral
  - 30s–11s: amber warning
  - 10s–0s: red, pulsing
- At 0s: auto-submit current selected answer (or auto-score as incorrect if none selected)

**Mastery (both modes):** Already-implemented 15% mastery penalty applies when a correct answer takes >60s on ≥3 attempts (`src/lib/learner/model.ts`). Do not remove without explicit governance change.

## 4. Progressive disclosure, not information dump

The 3-layer explanation (Fix → Breakdown → Medicine) is the canonical structure. Never render all layers expanded by default on every question.

- **Fix layer:** always visible, never collapsible. Shows error badge, transfer rule, gap coaching, question-writer intent (Rule 10).
- **Breakdown layer:** visible by default on wrong answers. Shows why_correct, decision hinge, and the new `DownToTwoCard` (Rule 4). Per-option breakdown behind a "Show option breakdown" toggle.
- **Medicine layer:** behind "Learn more" expander. This is where the v22 `medicine_deep_dive`, `comparison_table`, `pharmacology_notes` live.

## 5. Metacognitive capture is always one tap or one line

We capture three metacognitive signals on wrong answers. None may require more than one tap or one short line of typing.

- **Self-labeled error** (`self_labeled_error`): single-select from `SELF_LABEL_OPTIONS` — *Didn't know / Misread / Between two / Rushed*.
- **Free-text reasoning** (`what_were_you_thinking`): single text input, pre-focused, optional. Not required to advance.
- **Confidence pre-answer** (`confidence_pre`): already captured pre-submit; do not move it to post-answer.

Never gate question advancement on metacognitive input. Advance is always immediately available.

## 6. Progression phase is invisible to the user (Rule 9)

`user_progression_phase` (`system_clustered` → `partially_mixed` → `fully_random`) drives selection but is **never shown** as a label, badge, or setting to the user. Selection should feel like natural adaptation, not a leveling system.

What the user sees: questions. What the system does: cluster by system early, mix later. The user should notice the pattern in retrospect, not be primed to expect it.

## 7. Content-gap signal on easy misses (Rule 2)

When a user misses a `difficulty_class='easy_recognition'` item, the wrong-answer feedback surfaces a distinct repair message:

> "This was a pattern-recognition check. Flagging a content gap in [topic]."

This is separate from the standard transfer-rule correction, and louder. Easy misses indicate knowledge gaps, not cognitive errors — the repair engine will route subsequent questions to remediate the topic, not the cognitive error.

---

## Regression checklist (run before every release)

1. `grep -i -r 'nice try\|don.t worry\|close call\|almost had it' src/app/\(app\)/study/` returns nothing
2. Assessment session at 0s auto-submits (manual walkthrough)
3. Practice session timer is off by default on a new account (manual walkthrough)
4. Wrong answer → `MetacognitiveInputs` free-text field is pre-focused and optional
5. `user_progression_phase` is not rendered anywhere in the DOM (grep the build output)
6. Easy-miss flagging message appears on `difficulty_class='easy_recognition'` misses
