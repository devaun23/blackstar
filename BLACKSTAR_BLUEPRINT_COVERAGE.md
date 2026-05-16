# Blueprint Coverage

## Purpose

This document is the **scope-discipline contract**. Every published Blackstar
item must land in a cell of the NBME content-outline matrix. Every cell on the
outline should have published items, at a depth proportional to its yield tier.

The matrix is the guardrail. If a question doesn't land in a cell, it shouldn't
be built. If a cell is empty, the bank has a gap — even if total item count
looks healthy.

## The matrix

Each `blueprint_node` row defines a single cell of:

```
shelf × system × task_type × age_group × yield_tier
```

The `blueprint_node` table is the source of truth. The schema already supports
all five dimensions — no migration needed. The `subtopic`, `clinical_setting`,
and `time_horizon` columns are *additional* facets, not part of the coverage
cell key.

Coverage is computed by `scripts/blueprint-coverage-report.ts`:

```bash
npx tsx scripts/blueprint-coverage-report.ts                 # all shelves
npx tsx scripts/blueprint-coverage-report.ts --shelf=medicine
npx tsx scripts/blueprint-coverage-report.ts --gaps-only     # only show under-target cells
```

Output: a CSV at `pilot/blueprint-coverage-{YYYY-MM-DD}.csv` plus a TTY table.

## Per-tier targets

| Yield tier | Target items per cell | Rationale |
|------------|-----------------------|-----------|
| tier_1     | ≥ 3                   | High-yield core rules: need alternate presentations across age, setting, comorbidity so we can detect content gaps via easy-recognition misses (Rule 2). |
| tier_2     | ≥ 2                   | Pattern-recognition material: one canonical presentation + one moderate-noise version is enough. |
| tier_3     | ≥ 1                   | Zebra / edge content: a single representative item satisfies the cell. |

Targets are intentionally low — they're a *minimum* to call a cell "covered."
Going past the target is fine when the cell deserves more depth.

## Sources of scope (what's testable)

Blackstar's scope is defined by the **public, free, authoritative** NBME
outlines. We do NOT use competitor-qbank topic lists as a scope source.

1. **USMLE Step 2 CK Content Outline** — free PDF from usmle.org.
2. **NBME Subject Examination Content Outlines** — one per shelf (IM, Surgery,
   Peds, OB, Psych, FM). Free.
3. **NBME task statements** — the verbs that define cognitive operations
   (identify, manage, anticipate, advise, screen, prevent, communicate).

Save the PDFs in `reference/nbme/` and update this section when new editions
release. The mapping from outline cells to seeded `blueprint_node` IDs lives
at `src/lib/factory/seeds/nbme-content-outline.ts`.

## Known coverage gaps (2026-05)

Confirmed by inventory: these systems are *systematically under-tested in
student-built decks* and have **zero or near-zero nodes seeded** in
`blueprint_node` today. Each gap is a Track A backfill (see plan).

| System bucket            | Status today | Why it matters on shelf day |
|--------------------------|--------------|----------------------------|
| Geriatrics (cross-cutting) | absent as system (age-band only) | Falls, polypharmacy, drug clearance, frailty, EOL — high yield on shelf IM and FM. |
| ethics_communication       | absent       | Informed consent, capacity, advance directives, breaking bad news. Frequent on every shelf. |
| patient_safety             | absent       | Handoffs, root-cause, near-miss, error disclosure. Part of Step 2 CK content outline. |
| biostats                   | absent       | Sensitivity/specificity, PPV/NPV, LR, study design, NNT/NNH. Tested on every shelf. |
| Preventive/Screening       | **seeded** (6 topics) | USPSTF Grade A/B coverage — already in place. |

Seed nodes for the four absent buckets land in
`src/lib/factory/seeds/exam-content-specs.ts` as part of Track A3. All new
nodes are `tier_1` or `tier_2` and conform to the existing `MedicineNodeSpec`
shape (subsystem defaults, suppression style, etc.).

## What's outside scope (cut without guilt)

These belong elsewhere and should NOT be seeded into `blueprint_node`:

- Subspecialty dosing minutiae — that's specialty boards, not Step 2 CK.
- Pure basic science not tied to clinical decision-making — Step 1.
- Rare diagnoses with no management implications, no matter how interesting.
- Topics whose only source is a competitor qbank (no NBME outline coverage).

The `item_planner` pre-flight (A4) will refuse to plan items whose
`blueprint_node_id` doesn't map to a node on the outline manifest.

## Scope enforcement at generation time

Two gates enforce this contract end-to-end:

1. **`item_planner` cell-existence gate** (A4): refuses to plan an item if the
   chosen `blueprint_node_id` is not present in the manifest at
   `src/lib/factory/seeds/nbme-content-outline.ts`. This blocks topic drift —
   the model cannot invent a blueprint cell that isn't on the outline.

2. **Coverage gate in `pipeline.ts`** (A5, conditional): if the target cell is
   already at target depth AND other cells in the same shelf are under target,
   refuse the run and recommend a different cell. This stops the bank from
   concentrating in already-dense cells while gaps stay open. Default off
   until A1's first report shows the actual gap distribution.

## Anti-patterns the matrix prevents

- **CV-heavy bias**: a bank that's 40% cardiology because algorithm extractors
  are easier on CV content. The matrix flags it as soon as the per-system
  rollup shows imbalance.
- **Topic-drift drift**: a model that proposes an "interesting" topic outside
  the outline. The cell-existence gate refuses to plan it.
- **Repeat coverage**: generating a 4th item in a tier_3 cell while tier_1
  cells in the same shelf have zero items. The coverage gate refuses.
- **Invisible gaps**: a cell with zero items that nobody noticed. The
  `--gaps-only` flag on the coverage report surfaces them.

## Workflow

1. Run `scripts/blueprint-coverage-report.ts --shelf=<shelf>` weekly.
2. Pick the highest-yield under-target cell.
3. Either seed a node for that cell (if absent), or run the pipeline against
   the existing node.
4. Re-run the report. Confirm the gap closed.

This is the actual sprint loop for D1.5 (Cardiology) and beyond. Coverage is
not a one-time setup — it's the per-week dashboard.
