# Measurement-Science Roadmap

**Context.** A literature-informed critique argued Blackstar's gap is "measurement science + learner modeling," not content or prompting. An audit of the codebase (2026-04-22) graded the 7 proposed areas:

| # | Area | Status pre-v26 | Status after v26/v27 + IRT Phase A |
|---|---|---|---|
| 1 | Knowledge tracing / learner model | PARTIAL (heuristic smoothing) | unchanged (blocked on ~10k response events) |
| 2 | IRT / psychometrics | SKELETAL (schema exists, no calibration) | **PHASE A SHIPPED** — estimator + synthetic-validated + calibration job idle-waiting for pilot data |
| 3 | Q-matrix / skill ontology | PARTIAL (tags exist, no enforcement) | **ENFORCED** via coverage validator |
| 4 | Rubric-based eval | MISSING | **IMPLEMENTED + INTEGRATED** — rubric_scorer runs in pipeline step 8b, feeds rubric_evaluator |
| 5 | NBME item-writing science | PARTIAL (scattered) | unchanged (refactor on demand) |
| 6 | Constrained RAG | PARTIAL-IMPLEMENTED | **PROVENANCE SHIPPED** — `item_draft.source_packs_used` captured per item (v27) |
| 7 | Content→cognition bridge | PARTIAL (heuristic routing) | unchanged (blocked on #2 Phase B data) |

v26 closes two gaps that were achievable **without empirical learner data**. The other five either need learner response data at scale (#1, #2, #7) or are honest refactors of existing code (#5, #6) that should be prioritized against product goals, not dogpiled.

This doc explains what to build next, in what order, and — critically — what each step **requires as input** before it pays off.

---

## 1. Knowledge tracing (KT) upgrade — blocked on data, not code

**Current state:** `src/lib/learner/model.ts` uses a Bayesian-smoothing heuristic with a confidence ramp — it is NOT Bayesian Knowledge Tracing (BKT), Deep Knowledge Tracing (DKT), or Self-Attentive Knowledge Tracing (SAKT). It cannot separate *knowledge growth from guessing and slipping* because it doesn't model latent skill state with transition probabilities.

**What's needed before building:** KT models calibrate against response sequences per user per skill. Minimum viable input:
- **~100+ users** × **~100+ responses each** per skill dimension = **~10,000+ response events**
- Response events must carry: `(user_id, skill_id, item_id, correct, response_time, timestamp)`
- The skill dimensions should be the Q-matrix dims (topic, transfer_rule, etc.) — which now that v26 is in, are **enforced on every new item**, so the data schema is ready.

**Current data:** at the time of writing, `session` + `response` + `item_attempt` tables exist, but the learner pool is pre-product-launch. Estimate: the calibration data doesn't exist yet. Check with:

```sql
select count(distinct user_id) as users,
       count(*) as responses,
       count(*) filter (where is_correct) * 1.0 / count(*) as p_correct
from response
where created_at > now() - interval '30 days';
```

**Build threshold.** Don't build KT until the query above returns ~100 users × ~100 responses. Building DKT against a 3-user, 40-response dataset produces an overfit model that's strictly worse than the current heuristic.

**When ready, minimum viable KT:** Start with **BKT per Q-matrix dim** (4 params per skill: p_init, p_learn, p_slip, p_guess). It's ~50 lines of code, has a closed-form MLE, and gives you real latent-skill estimation without deep-learning infra. DKT/SAKT come later if BKT drift is observed.

**Files that will need changes:**
- `src/lib/learner/model.ts` — replace `computeMastery()` with per-dim BKT posterior.
- New: `src/lib/learner/kt/bkt.ts` — four-parameter BKT fit + inference.
- New: `scripts/calibrate-bkt.ts` — nightly job, reads `response` table, writes per-(user, skill) posteriors to `learner_ability` (already exists, empty).

**Signal that this is working:** a mastery estimate of 0.7 should imply 70% probability the user will answer the next same-skill item correctly. Calibration plot (predicted vs observed accuracy) should be on the diagonal ±10%.

---

## 2. IRT calibration — Phase A SHIPPED, Phase B waiting for data

**Phase A status (2026-04-22): COMPLETE and validated.**

Files shipped:
- `src/lib/factory/psychometrics/irt-2pl.ts` — 2PL estimator with MAP priors on θ, b, log(a). Damped Newton + parameter clamping (θ ∈ [-4,4], b ∈ [-5,5], a ∈ [0.14, 7.4]) prevents divergence. Per-iteration scale-normalization (theta → mean 0, sd 1) fixes the 2PL gauge identifiability.
- `src/lib/factory/psychometrics/synthetic.ts` — synthetic-data generator, Pearson correlation, scale-invariant RMSE, post-hoc alignment to ground truth.
- `scripts/test-irt-2pl-synthetic.ts` — recovery test across 3 scenarios (50×30, 200×50, 500×100 users × items). All 3 pass with r(θ)=0.78–0.91, r(b)=0.85–0.92, scale-invariant RMSE within bounds.
- `scripts/calibrate-irt.ts` — production calibration job. Pulls `user_responses`, filters to published items, runs 2PL, writes back to `item_performance.item_difficulty` + `discrimination_index`. **Refuses to run below thresholds** (default: ≥500 responses/item, ≥100 users, ≥30 items) with clear error message and `--force` / `--min-*` escape hatches.

**Verified behavior:**
- Synthetic recovery: all 3 scenarios pass the pass/fail gate.
- Empty-data gate: `npx tsx scripts/calibrate-irt.ts` currently fails loud with "below threshold, wait for pilot data" — correct behavior pre-launch.

### Phase B (runtime activation — no code needed when data arrives)

Run `npx tsx scripts/calibrate-irt.ts`. Nothing to build. Add to cron once threshold is met.

**Data threshold:** `select item_draft_id, count(*) from user_responses join item_draft on id=item_draft_id where status='published' group by 1 having count(*) >= 500` — when this query returns ≥30 rows, calibration is viable.

**Intermediate (before 500/item):** use `item_performance.accuracy_rate` + `avg_time_seconds` as proxies for difficulty. Not IRT, but functional adaptive sequencing. Already partially wired in `selector.ts`.

### Phase B (blocked on data — ~500 responses per item)
IRT 2PL requires ~500 responses per item for stable calibration (lower bound; 1000+ is better). Until then, item params are too noisy to drive selection.

**Data threshold:** `select item_id, count(*) from item_attempt group by 1 having count(*) >= 500` — when this query returns a meaningful fraction of published items, Phase B activates.

**Intermediate (before 500/item):** use `response_time_percentile` + `correctness_rate` as proxies for difficulty. Not IRT, but functional adaptive sequencing. Already partially wired in `selector.ts`.

---

## 3. Q-matrix enforcement — DONE in v26

**What v26 shipped:**
- `src/lib/factory/agents/coverage-validator.ts` — deterministic validator.
- Hard-gates 4 dims at 100% empirical coverage (topic, cognitive_error, hinge_clue_type, action_class).
- Soft-warns 2 dims that legitimately don't apply to all items (transfer_rule, confusion_set).
- Runs inside the validator loop; `scripts/audit-qmatrix-coverage.ts` for retroactive audits.

**Follow-up work:**
- Backfill the 4 items flagged in the initial audit (`5d927653`, `78788d2a`, `e078697b`, `f9a4cb2e`) — or decide they're legitimately soft-only and acceptable.
- Consider a weekly cron job that re-runs the audit and alerts if any hard-dim coverage drops below 98%.

---

## 4. Multi-criterion rubric scoring — DONE in v26

**What v26 shipped:**
- `src/lib/factory/agents/rubric-scorer.ts` + prompt in `seeds/agent-prompts.ts`.
- 8 criteria, 1-5 scale, one-sentence rationale each, `flagged=true` if any sub-score ≤ 2.
- `item_rubric_score` table (migration v26) — one row per item per rubric version, keeps history.
- Smoke-test on real item (`0735967b`) produced genuinely useful signal: overall 4.25 with option_symmetry flagged at 3/5 for a real asymmetry.

**Integration status: SHIPPED.** As of 2026-04-22, rubric_scorer runs automatically as pipeline step 8b — after explanation_writer + explanation_validator, before the Master Rubric Evaluator. Its `overall_score` feeds into `rubric_evaluator` as one input among many (parameter `rubricScorerOverall`). Cost: ~4k tokens/item. Opt-out via `config.skipRubricScorer` for harness or cost-constrained runs.

**Intended downstream use:**
1. Sort human-review queue by `item_rubric_score.overall_score ASC` so reviewers see weakest items first.
2. Track `AVG(sub_scores->criterion->score)` weekly; calibration drift appears as sustained drops on specific criteria (e.g., a week where `distractor_plausibility` mean falls 0.3 points is a signal the generation pipeline is drifting).
3. Flagged items (any sub-score ≤ 2) are automatic priority-review candidates.

---

## 5. NBME item-writing science — refactor opportunity

**Current state:** Checks for grammatical cues, option symmetry, compound options, and absolute qualifiers are scattered across `agents/repair-strategies.ts`, `nbme-style-anchors.ts`, and implicit in validator prompts. There's no centralized "NBME flaw count" with severity scoring.

**Proposed refactor (not urgent):**
- Centralize into `src/lib/factory/validators/item-writing-flaws.ts` — one function per flaw, each returning `{ flaw_name, severity: 'minor'|'major', evidence }`.
- Emit a count + severity rollup in `validator_report.raw_output`.
- This isn't new behavior; it's existing behavior pulled into one auditable surface.

**Priority:** medium. Current enforcement is functional — this refactor buys visibility, not correctness. Do it if you find yourself adding the 6th NBME flaw check in a sixth different file.

---

## 6. Constrained RAG / grounded generation — already partially done

**Current state:** 193+ source packs exist (`src/lib/factory/source-packs/`) and agents pull context from them before generation. What's missing from the "constrained RAG" framing in the literature is **dynamic retrieval weighted by learner state** — e.g., if a learner is confused on *pericarditis vs. STEMI*, boost retrieval weight for sources covering that confusion_set when generating their next item.

**This needs KT first (#1).** Without real latent-skill estimates, there's no signal to weight retrieval on.

**Lightweight interim move — SHIPPED (2026-04-22):** `item_draft.source_packs_used text[]` column (migration v27) now captures the primary + secondary pack IDs consulted at generation time. Populated automatically by pipeline-v2 via `getSourcePackIds(topic)` in `source-loader.ts`. GIN-indexed for fast "which items used pack X" queries. Once learner data exists, correlate source provenance with learner outcomes: do items grounded in pack X have different discrimination than pack Y? Is a specific pack producing items learners find unfair?

---

## 7. Information-theoretic item selection — the ITS north star, blocked on IRT

**Current state:** `src/lib/learner/selector.ts` picks by lowest mastery_level (greedy weakness). This is reasonable for retention but is NOT information-theoretic.

**What the literature calls for:** Select the item that maximizes **Fisher information** at the learner's current θ estimate, subject to blueprint constraints and repair-loop overrides.

**Blocked on #2 (IRT).** Without calibrated item params (a, b), there's no Fisher information to maximize.

**When IRT Phase B is ready, ~1 day of work:**
```ts
function fisherInformation(theta: number, a: number, b: number): number {
  const p = 1 / (1 + Math.exp(-a * (theta - b)));
  return a * a * p * (1 - p);
}
// selector: pick argmax_i { fisherInformation(theta_user, a_i, b_i) } over eligible pool
```

**Interim signal:** "next most informative" is currently approximated by "next weakest dim + not-recently-seen." That's 70% of the benefit for 10% of the cost. Don't abandon it until IRT is calibrated.

---

## Summary of build threshold gates

| Work item | Unblocks | Minimum data threshold | Est. effort |
|---|---|---|---|
| IRT Phase A (estimator) | Phase B | None — buildable now | ~1 day |
| Log source_packs_used per item | RAG analysis | None | ~1 hour |
| Rubric scoring integrated into pipeline | Ranked human review | None | ~2 hours |
| Item-writing flaws refactor | Visibility | None | ~4 hours |
| BKT per Q-matrix dim | Learner model upgrade | 100 users × 100 responses | ~1 day |
| IRT Phase B activation | Info-theoretic selection | ~500 responses per item | runtime only |
| Info-theoretic selector | True ITS | IRT Phase B complete | ~1 day |
| DKT/SAKT | Richer KT | 1000+ users × 500+ responses | ~1 week |

**Order to build in:** (1) IRT estimator + synthetic validation — do now. (2) source-packs logging — do now. (3) rubric integration into pipeline — do now. (4) item-writing flaws refactor — do when you're adding the 6th check. (5–8) all blocked on empirical data; plan but don't code until thresholds crossed.

---

## What the critique got right and what it missed

**Right:** Blackstar's long-term trajectory is an ITS with a psychometric core, not a content factory. The 7 points name real gaps that will need closing before Blackstar is a measurement-grade tutor.

**Missed:** A solo-built pre-launch product shouldn't build KT + IRT + CAT before it has users. Those systems' value is a function of data volume. The right move at this stage is to **land the pieces that don't need data** (coverage enforcement, rubric scoring, IRT estimator infrastructure, source logging) so the moment data arrives, the calibration just runs. That's what v26 does.

Blackstar in Q2 2026 doesn't need DKT. It needs 500 passed items, 50 pilot learners, and the calibration job sitting idle waiting to fire the moment response data crosses threshold. The architecture is ready for the measurement science. Building the measurement science before the data exists is premature optimization that generates noise, not signal.
