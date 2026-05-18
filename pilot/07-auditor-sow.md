# Blackstar — Beta Auditor SOW

**For paid auditors reviewing pre-release pilot questions.**

Read time: 10 min. Per-item audit time target: 2–3 min.

---

## 1. What you're auditing

Blackstar generates NBME-style Step 2 CK questions through an AI pipeline.
Every item is supposed to (a) be medically accurate, (b) read like a real
NBME item, (c) teach a clinical decision rule, and (d) have distractors
that punish a specific cognitive error.

You are the calibration anchor: a recent, high-scoring Step 2 perspective
that catches what the pipeline's own validators miss. The pipeline is
already an array of automated validators and an LLM judge — your job is
to surface the failure modes those validators don't catch.

The core principles you're checking against (from `PRODUCT_VISION.md`):

- **Decision-focused, not fact-focused.** Questions test clinical reasoning at decision forks, not "what is the mechanism of X."
- **Late hinge.** The distinguishing finding appears in the last 1–2 sentences. Before the hinge, multiple answers should look plausible.
- **Cold chart style.** Vignettes read like medical records — no teaching voice, no buzzwords.
- **Cognitive error targeting.** The most common wrong answer should feel right to a student making a specific cognitive error.
- **Explanations teach decisions, not diseases.** Explanations name the "down to two" pivot detail.

---

## 2. The primary tool: 7-point ship checklist

For every item, check all 7. **All 7 must pass for an item to ship.**

1. **Stem reads NBME** — no AI tells (em dashes in dialogue, list-of-five style), no abbreviations, dual temperature (°C and °F), `/min` for vitals, `mm Hg` for BP.
2. **Lead-in is a standard NBME form** — "Which of the following is the most likely diagnosis?" / "Which of the following is the most appropriate next step?" / "Which of the following is the most likely cause of this patient's findings?" / etc.
3. **All 5 options are plausible to a competent MS3** — no obvious throwaways.
4. **Correct answer is NOT the longest option** — known AI tell, NBME prohibits.
5. **At least one distractor is the confusion-set partner** — the thing this case is most easily mistaken for. The anchoring trap.
6. **Explanation tells you why each wrong answer was tempting** — not just why the correct one is right.
7. **No medical errors** — the only check you can't outsource.

This list is the source of truth. It's also implemented in
`pilot/04-audit-protocol.md` and rendered into `pilot/audit-output.md` with
`- [ ]` boxes — tick each one as you read.

---

## 3. Secondary tool: auto-kill rules

If any rule below fires, the item is killed — no repair. You'll mostly
not need these directly; they catch what should be caught. Flag any
violation you see and the category.

| Category | When it fires | Example |
|---|---|---|
| **R-MED** (medical accuracy) | Wrong drug, wrong dose, harmful action keyed, contraindication violated | "Give heparin" keyed in a stroke pt at hr-6 with no NIHSS workup |
| **R-BP** (blueprint mismatch) | Item tests a different topic than the blueprint node | Topic is "atrial fibrillation" but stem is asking about heart failure mgmt |
| **R-NBME** (style/format) | Answer determinable from sentence 1, teaching voice, leading language, classic buzzword giveaway | "Malar rash + arthritis + ANA" → SLE in sentence 1 |
| **R-REAS** (reasoning depth) | Single-step item, or a reasoning step requires knowledge not in the stem | "What's the diagnosis?" with no decision fork |
| **R-OPT** (option quality) | Mixed action classes (drug + lab), absurd distractor, longest-answer key, missing primary_competitor, **≥2 distractors eliminable by surface cues alone** | One option says "ABCDEFG syndrome with elevated ferritin"; others say "anemia" |
| **R-EXP** (explanation) | Disease lecture, restates the answer, no "down to two" pivot, missing writer intent | "The answer is amoxicillin because amoxicillin treats community-acquired pneumonia" |
| **R-SRC** (sources) | Cites review notes (UWorld/AMBOSS) without a guideline, fabricated guideline name | "Per UWorld, the next step is..." |
| **R-IP** (originality) | >12 consecutive word match to UWorld/AMBOSS/Bootcamp/NBME release, vignette traceable to a specific known item | The presentation reads like UW question #12345 |

Full canonical list with rule IDs: `REJECTION_RULES.md`.

---

## 4. Reference (use only on close calls)

If the 7-point checklist + auto-kill rules don't give you a clear
verdict, consult `BLACKSTAR_MASTER_RUBRIC.md` — 10 weighted domains on a
100-point scale with explicit point bands. You don't need to score on the
100-point scale; just use the domain definitions to triage.

The publish thresholds the rubric uses:
- ≥90: publish
- 80–89: revise (small edits)
- 70–79: major revision
- <70: reject

If your gut says "this is fine but the explanation is weak" → the rubric's
`explanation_quality` floor (≥12 / 15) is what's flagging it.

---

## 5. Submission format

For each item, submit:

- **Item ID** (UUID from the audit-output file)
- **7-point checklist results** (✔ / ✗ per item — 7 fields)
- **Auto-kill rule hits** (free text: rule category + one-line description)
- **Free-form rationale** (1–3 sentences on the closest call)
- **Suggested fix** (if revisable) or "kill" (if not)
- **Audit duration** (minutes spent)

Submission channel will be a Notion DB or Google Form shared with you at
onboarding. Do not save findings locally — confidentiality.

---

## 6. Payment + NDA

- **Rate:** $75/hour, billed in 15-min increments, paid via Venmo or PayPal weekly.
- **Workload:** ~4 hours covering ~30 items. You can split into multiple sessions.
- **NDA:** Mutual NDA covering pre-release Blackstar content — see `pilot/09-auditor-nda.md`. Signed before access. Expires 90 days after pilot close.
- **Conflict policy:** If you're currently writing or reviewing for UWorld / AMBOSS / Bootcamp / NBME, you cannot audit. Disclose at onboarding.

---

## 7. What we want you to flag beyond the rubric

The rubric is necessary but not sufficient. The most valuable signal you
provide is the *unrubric-able* judgment:

- Does this question feel like NBME, or like a clever student wrote it?
- Would a 240+ scorer get this right for the right reason, or accidentally?
- Does the explanation actually teach the rule, or does it just defend the key?
- Is there a confusion you can think of that the distractor set *should* be testing but isn't?

When in doubt, flag and explain. False positives are cheap; false negatives
ship to alpha users.
