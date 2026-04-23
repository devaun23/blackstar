# Contraindication Cross-Check Validator (CCV) Semantics

This document defines the two failure modes the CCV is authorized to reject on. These definitions are load-bearing: the validator's behavior should derive from them, not the other way around. If a future tuning pass conflicts with this document, update the document *first*, then the code.

## unsafe-correct-answer

The keyed answer describes an intervention that is absolutely contraindicated by a specific stem finding (the "trigger"), AND the `case_plan.decision_fork_type` is NOT `'contraindication'`.

The carve-out for `decision_fork_type === 'contraindication'` exists because some questions legitimately test whether the student RECOGNIZES a contraindication — the correct answer might then be to avoid the intervention, or the question might intentionally key an unsafe intervention so the student can identify it in the explanation. In those items, the `case_plan` has declared upfront that the contraindication IS the hinge; the CCV respects that declaration and does not hard-fail.

Outside that carve-out, an unsafe-correct-answer routes to hard fail. The `failure_category` is `absolute` (the common case) or `relative` (deferred to human review via `needs_human_review`). Relative contraindications never auto-reject — they escalate, because the clinical call depends on context the validator can't fully evaluate (risk/benefit tradeoff, severity of the indication, availability of alternatives).

## unsafe-distractor-not-primary-competitor

A distractor option describes an intervention that is absolutely contraindicated by a stem finding, AND the distractor's archetype is not `primary_competitor`.

`primary_competitor` archetypes are allowed to embody contraindications — in fact, they SHOULD, because that's how you teach discrimination. "Give tPA" and "give heparin alone" are the two things a student might pick in an unstable PE; the distractor that's contraindicated in the specific stem context teaches the discrimination. But if a `zebra`, `implausible`, or `neutral` distractor carries a contraindication, it's not teaching — it's making the question too obviously wrong, which violates option-symmetry principles (all distractors should be plausibly tempting; clearly-wrong distractors dilute the assessment).

Outside the primary_competitor carve-out, an unsafe distractor routes to hard fail. `failure_category` `absolute` for absolute contraindications, `relative` → human review for relative.

## What the CCV does NOT do

- **Does not judge clinical correctness beyond contraindications.** A "wrong" answer that isn't contraindicated (just suboptimal) is the medical_validator's job, not CCV's.
- **Does not read explanations.** The validator must be blind to `why_correct`, `why_wrong_*`, `high_yield_pearl`, `reasoning_pathway`. Otherwise it would agree with whatever the writer said about its own output. CCV sees only: vignette, stem, keyed option text, options A-E text, case_plan.decision_fork_type and option_frames[].archetype.
- **Does not silently pass on unknown interventions.** If the keyed answer describes an intervention but no registry entry matches, the CCV escalates to `needs_human_review` via `trigger_found='unknown'`. Silent pass is NEVER acceptable — the whole point of this validator is to be the safety backstop.
- **Does not fix items.** On hard-fail, CCV writes to `validator_report` with repair_instructions for the repair agent. Repair is a separate step.
