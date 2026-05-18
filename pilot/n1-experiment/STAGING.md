# n=1 staging — di-loader override (DO NOT COMMIT)

> **Status:** Phase A of `~/.claude/plans/is-this-solvable-toasty-lerdorf.md`.
> **Files touched (uncommitted):**
> - `src/lib/factory/di-loader.ts` — adds `BLACKSTAR_N1_OVERRIDE=1` early-return.
> - `pilot/n1-experiment/refs.md` — the Tier-A passages that get injected.
> - `pilot/n1-experiment/CHOICE.md`, `STAGING.md`, `RESULT.md` — documentation only.

## What the override does

When `BLACKSTAR_N1_OVERRIDE=1` is set in the shell environment,
`resolveDIContext()` skips the `di_evidence_item` table (which holds review-note
sources now forbidden by R-IP-02) and instead reads `pilot/n1-experiment/refs.md`
verbatim. The topic argument is echoed at the top so the agent still sees what
topic was requested — but the body is the Tier-A ESC 2019 passages.

## Running the experiment

```bash
# from /Users/devaun/blackstar
export BLACKSTAR_N1_OVERRIDE=1

# generate one item against the PE topic / D-dimer rule
# (use whatever subset flags generate-batch.ts already supports)
npx tsx scripts/generate-batch.ts --target 1 --topic "Pulmonary Embolism" --rule "D-dimer is only useful to EXCLUDE PE in LOW pre-test probability patients"

unset BLACKSTAR_N1_OVERRIDE
```

If `generate-batch.ts` doesn't accept those exact flags, check its argv parsing
first — the override is independent of the CLI surface; it only depends on the
env var being set when the pipeline runs.

## Auditing the result

1. Open the generated draft (DB or trace output).
2. Run rubric-evaluator output through `pilot/04-audit-protocol.md` manually
   (7-point checklist).
3. Record decision in `pilot/n1-experiment/RESULT.md`:
   - rubric score (out of 100), per-domain breakdown
   - hard-gate failures (any of 8)
   - 7-point audit pass/fail per item
   - which named cognitive errors the distractors mapped to
   - your subjective shelf-quality call (would NBME publish this?)

## If audit fails — manual critic→revise cycle

1. Identify the failed domain(s) / audit items.
2. Compose a critic prompt referencing those specific defects (template in
   `RESULT.md` once we run the first cycle).
3. Re-run vignette-writer with revision_instructions appended to the prompt.
   For now, that means a one-off Claude API call — wire-up of automatic re-run
   is Phase B.
4. Cap at 3 cycles. If still failing, document the failure mode in `RESULT.md`
   and revisit the plan before starting Phase B.

## Reverting the override (cleanup)

Either:

```bash
git checkout -- src/lib/factory/di-loader.ts
```

…or manually delete the `N1_OVERRIDE_FILE` constant + the `BLACKSTAR_N1_OVERRIDE`
early-return block inside `resolveDIContext`.

The `pilot/n1-experiment/` directory can stay (it documents the experiment) but
should NOT be wired into the seed corpus.

## Why an env flag (not a CLI argument or a separate file)

- **Env flag:** zero changes to `pipeline-v2.ts` or `generate-batch.ts` surfaces.
  The override is purely opt-in at process boundary.
- **Same function signature:** anything that calls `resolveDIContext` continues
  to work; we don't fork the codepath.
- **Trivial to grep + revert:** one constant + one if-block. No spreading state.
