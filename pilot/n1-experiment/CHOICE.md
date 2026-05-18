# n=1 experiment — rule selection

> **Status:** Phase A of the plan at `~/.claude/plans/is-this-solvable-toasty-lerdorf.md`.
> **Goal:** prove one shelf-quality NBME-style item is reachable with manual RAG +
> a critic→revise cycle, before building Phase B/C infrastructure.

## Chosen transfer rule

**"D-dimer is only useful to EXCLUDE PE in LOW pre-test probability patients"**

- Source in code: `src/lib/factory/seeds/transfer-rules.ts` lines 161–176 (first entry
  under `diagnostic_threshold`)
- Maps to gold card: `GOLD_CARD_PE` in `src/lib/factory/seeds/gold-algorithm-cards.ts`
  lines 132–257
- Matching question blueprint: `GOLD_CARD_PE.question_blueprints[2]` (lines 205–211)
  — "High pretest probability PE: Wells score 7, physician considers D-dimer vs CTA"
- Target cognitive error: `wrong_algorithm_branch` (from `seeds/error-taxonomy.ts`)

## Why this rule

1. **Strongest gold-card support.** PE card has 6 fact_rows, all Tier-A. AKI has 6,
   ACS has 6 — but the PE card explicitly names this nbme_trap (line 164):
   "Ordering D-dimer when pretest probability is HIGH (Wells ≥5)."
2. **Unambiguous hinge.** Wells ≥5 vs <2 is a numeric threshold the model can't fudge.
3. **Tier-A, open-access sources.** ESC 2019 PE Guidelines (open, indexed) + ACEP
   Clinical Policy on PE 2018 (open). No paywalled material, no source-firewall risk.
4. **Already wired downstream.** The fact_rows for D-dimer and Wells score are at
   `GOLD_CARD_PE.fact_rows[0]` and `[1]` (lines 176–177) — the pipeline already
   knows the thresholds.
5. **Cognitive-error-clean.** `wrong_algorithm_branch` (skipping CTA, using D-dimer
   as the gatekeeper in a high-probability patient) is one of the 11 named errors —
   no ambiguity in distractor mapping.

## Hinge specification (what the right answer turns on)

| Variable | Correct branch | Wrong branch |
|---|---|---|
| Wells score ≥5 | CTPA directly | D-dimer |
| Wells score <2 | D-dimer | CTPA |
| Hemodynamically unstable | Empiric heparin + thrombolytics consideration | Wait for imaging |

The n=1 item targets the **Wells ≥5 / "skip the D-dimer" branch**, because that's
the most common shelf trap (over_testing → over_imaging looks "safe").

## Anti-rules / what NOT to test in this item

- Don't make the hinge "what is the Wells score." That's recognition, not transfer.
  The hinge is "what to do when the score is already known to be high."
- Don't include a contraindication twist (renal failure, contrast allergy). One
  hinge per item; contraindication overrides are a separate rule (see
  transfer-rules.ts:178–192).
- Don't put the Wells features in a numbered list. Bury them in the vignette prose
  so the test-taker has to assemble the score themselves — that's the transfer
  step.

## Next steps

1. Pull Tier-A reference passages for ESC 2019 + ACEP 2018 (see `refs.md`).
2. Stage the di-loader override (see `STAGING.md`).
3. Run pipeline with target=1 against this rule's topic ("Pulmonary Embolism").
4. Audit per `pilot/04-audit-protocol.md`. Iterate ≤3 critic cycles.
5. Document the final item + the path it took in `RESULT.md`.
