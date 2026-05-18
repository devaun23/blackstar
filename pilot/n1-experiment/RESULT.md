# n=1 experiment — RESULT

> Fill this in after each generation cycle. Don't edit retrospectively —
> append a new cycle section if you re-run.

## Inputs

- Transfer rule: **D-dimer is only useful to EXCLUDE PE in LOW pre-test probability patients**
- Primary source: ESC 2019 PE Guidelines (Tier-A, priority 10–22)
- Background context: StatPearls PE article (not citation of record)
- Override: `BLACKSTAR_N1_OVERRIDE=1` in shell; di-loader returns `pilot/n1-experiment/refs.md`
- Runner: `scripts/n1-run.ts`

## How to run

```bash
cd /Users/devaun/blackstar
BLACKSTAR_N1_OVERRIDE=1 npx tsx scripts/n1-run.ts
```

If the topic doesn't exist as a `blueprint_node` row yet, the runner exits with
instructions — pick a different topic or seed the blueprint first.

## Cycle 1 — initial generation

- runId: `<paste from runner output>`
- itemDraftId: `<paste>`
- totalTokens: `<paste>`
- finalStatus: `<paste>`

### Rubric (out of 100)

- Total: __ / 100
- publish_decision: `<publish | revise | major_revision | reject>`
- Hard-gate failures (any of 8): __

| Domain | Score | Notes |
|---|---|---|
| medical_correctness_scope (15) | | |
| explanation_quality (15) | | |
| nbme_stem_fidelity (12) | | |
| option_set_quality_symmetry (12) | | |
| ... | | |

### 7-point audit (pilot/04-audit-protocol.md)

- [ ] Stem NBME compliance
- [ ] Lead-in form
- [ ] Option plausibility
- [ ] Correct answer not longest
- [ ] Confusion-set distractor present
- [ ] Explanation quality
- [ ] No medical errors

### Shelf-quality call

Would NBME publish this? `<yes | no | borderline>` — why?

### Distractor → cognitive error mapping

- A. ___ → ___
- B. ___ → ___
- C. ___ → ___ (correct)
- D. ___ → ___
- E. ___ → ___

## Cycle 2+ — critic→revise (only if cycle 1 failed)

Template (copy this block for each cycle):

### Critic prompt used

```
<paste the critic prompt you sent — should reference specific failed
domains/audit items and the rubric output>
```

### Revision instructions emitted

```
<paste structured revision output — which fields, why>
```

### Cycle N result

- ... same fields as Cycle 1 ...

## Final decision

After ≤3 cycles:

- [ ] PASSED — item is shelf-quality (rubric ≥90, 7/7 audit, no hard-gate fails)
- [ ] FAILED — failure mode: ___

If failed, what did the experiment reveal?
- Was reference text actually used by vignette-writer? (Check trace.)
- Was the critic prompt specific enough? (Generic critics produce generic revisions.)
- Did the model regress between cycles? (Some defects swap rather than resolve.)

## Conclusions for Phase B/C

(Fill in after the experiment ends — even if it failed.)

- What worked: ___
- What didn't: ___
- Implication for the refine loop (Phase B): ___
- Implication for RAG (Phase C): ___
- Should we proceed with Phase B as planned, or revise the plan first?

## Cleanup

After analysis is complete:

```bash
git checkout -- src/lib/factory/di-loader.ts
rm scripts/n1-run.ts
# Keep pilot/n1-experiment/ as documentation. Do NOT add refs.md to the seed corpus.
```
