# Architecture Audit — Cho et al. 2024 (arXiv:2412.09248)

**Paper:** *A Systematic Review of Knowledge Tracing and Large Language Models in Education: Opportunities, Issues, and Future Research.* Cho, AlMamlook, Gharaibeh. 2024. 67 papers, PRISMA-compliant.

**Audit date:** 2026-04-22. Author: architectural review against the paper's taxonomy.

**Related docs:**
- `MEASUREMENT_SCIENCE_ROADMAP.md` — the authoritative build-order + data-threshold doc. Audit findings below align with that roadmap.
- `memory/feedback_measurement_layer_priority.md` — user-authored strategic framing (the 5 pillars). This audit does not restate that; it adds the paper's evidence.
- `memory/reference_kt_llm_systematic_review.md` — paper-specific reference notes.

---

## 1. Bucket assignment — where Blackstar sits on the paper's taxonomy

The paper classifies KT approaches into five buckets. Blackstar's current learner model maps to them as follows:

| Paper bucket | Representative models | Blackstar today | Notes |
|---|---|---|---|
| BKT | Corbett & Anderson 1995; 4-param HMM | Closest match — `src/lib/learner/model.ts` uses Bayesian smoothing with ramp-up prior | Not a real BKT (no p_slip / p_guess separation). Roadmap §1 schedules true BKT once data threshold hits. |
| FAM (IRT, PFA, KTM) | Logistic regression over (user, item, skill) | Schema-ready: `learner_ability` table exists per `v20`, unused | Roadmap §2: build 2PL estimator Phase A now; activate at ≥500 responses/item. |
| DKT | Piech 2015; RNN/LSTM | Not implemented | Deferred. Black-box cost too high for small-N dataset. |
| Attention-based KT | SAKT/AKT/SAINT | Not implemented | Deferred. Paper validates attention mechanisms for interpretability-through-weights, but this is a later-stage upgrade. |
| Graph-based KT | HGKT/JKT/SGKT | Not implemented | 6-dimension mastery model is a hand-coded surrogate. Graph KT is a phase-2 accuracy boost. |
| LLM-integrated KT | Three modes (general concerns / per-model limits / direct KT) | Partial — LLMs are used for content generation + validation; not for cold-start tagging or runtime explanation | Buildable: LLM-assigned Q-matrix dims at publish (mode a). |

**Bucket verdict:** Blackstar is a **simplified traditional-KT system** (heuristic Bayesian + rule-based repair) with strong content-generation infra. The roadmap's `v26` additions (coverage validator, rubric scorer) are pre-data infrastructure that sits below the KT layer — they do not change the bucket assignment.

---

## 2. What the paper validates (keep doing)

| Design choice | File | Paper support |
|---|---|---|
| Interpretable mastery, one scalar per dimension | `src/lib/learner/model.ts:66–143` | §3.2.1 — BKT/FAM interpretability is the reason to pick them over DKT at small scale |
| 6-dimension mastery model | `src/lib/types/database.ts:231`, `attempt_v2` schema | §3.2.1 — multi-KC modeling is the core of BKT/FAM; Blackstar's 6 dims are richer than typical 3–4 dim Q-matrices in the literature |
| Mastery-driven explanation depth (novice/targeted/expert) | `src/app/(app)/study/study-feedback.tsx:70–150`, v7 components | §3.1 Personalized learning support + §3.3 LLM explanations as KT-adjacent capability |
| Variant grouping (`variant_group_id`) to prevent memorization | `supabase-migration-v20-irt-plumbing.sql:50–55`, `src/lib/learner/selector.ts` | §3.2.2 — attention-based KT pioneered per-item relative weighting; variant groups implement the "different surface, same rule" property |
| Deterministic repair routing (contrast/remediate/transfer_test) | `src/lib/learner/repair-engine.ts:51–183` | §3.1 Scaffolding + §4.1 personalized learning — structured remediation beats generic "harder question" |
| Confidence capture (pre & post) | `attempt_v2.confidence_pre`, `confidence_post` cols (`migration-v10`, `v11`) | §3.3 — calibration gap is a documented KT-adjacent signal; capturing it early is cheap, fitting models to it needs N |
| Rubric-based item quality (HealthBench-style) | `src/lib/factory/agents/rubric-scorer.ts`, `item_rubric_score` table | §3.1 Assessment and feedback — multi-criterion LLM scoring is an emerging evaluation standard |
| Q-matrix coverage enforcement | `src/lib/factory/agents/coverage-validator.ts` (v26) | §3.2.1 — KC annotation is a hard requirement for FAM/BKT; enforcement at publish prevents unroutable items downstream |

---

## 3. What the paper flags (gaps that have buildable or deferred responses)

| Gap the paper names | Blackstar location | Response |
|---|---|---|
| Cold-start: no data for new learners | `src/lib/learner/model.ts:96–98` (uniform 0.5 prior) | **Buildable now:** IRT Phase A estimator with synthetic validation (roadmap §2). Once pilot data arrives, calibration fires automatically. Separately, LLM-assigned item features could seed priors at publish — not yet scheduled. |
| IRT columns exist but never written | `v20` columns: `learner_ability.theta_ability`, `se_theta`, `item_performance.expected_response_time_ms`, `time_discrimination` | **Buildable now:** `scripts/calibrate-irt.ts` per roadmap §2 Phase A. Runs idempotently against `attempt_v2`. Activation gated on data thresholds. |
| No LLM knowledge-tagging for new items | Item ingest pipeline | **Partial:** `coverage-validator` (v26) enforces the dims exist. LLM auto-assignment of the values is not done. Low-priority per roadmap §1 — BKT per existing-dim is the bigger miss. |
| Explanations are pre-baked, not LLM-adaptive at serve time | `study-feedback.tsx` | **Intentional.** Paper cites §3.3 as a capability but flags recency bias + cost + latency. Blackstar chooses pre-baked + mastery-driven depth. Paper does not require runtime generation. |
| Explanation tiers vary depth, not content focus | `getLayerConfig(repairInfo.action, isCorrect)` in `study-feedback.tsx` | **New design move (not in roadmap yet):** signature-driven content-focus leads ("why YOU missed it"). Keyed to `attempt_v2.diagnosed_cognitive_error_id` + confusion_set + error signature. Low code risk; high UX value. Candidate for follow-up task. |
| No graph-based prerequisite modeling | Not implemented | **Deferred.** 6-dim mastery + variant groups approximate the use case. Graph KT pays off at large scale where concept-concept learning dependencies carry signal. |
| Educational data imbalance limits model training | Single-domain small-N dataset | **Acknowledged, not fixable.** Paper's own conclusion (§4.2) — small educational datasets are the norm. Roadmap's `prove the loop at 50 items` stance is the correct response. |
| LLM-generated distractors non-functional | Item generation pipeline | **Tracked separately** — `memory/reference_ai_mcq_quality_research.md`, `project_kill_rate_progress.md`. |
| Recency bias in few-shot prompts | All LLM agent prompts | **Tracked separately** — `memory/feedback_nbme_voice_texture.md` covers the 7-layer anti-AI-tells framework. |

---

## 4. The paper's bottom line for Blackstar

The paper's thesis: **LLMs enrich KT. LLMs are not the KT model.** Use LLMs for feature extraction, knowledge tagging, difficulty prediction, cold-start inference, and natural-language explanations — but keep a dedicated, interpretable tracking layer that estimates learner state from response sequences.

Blackstar's current architecture is consistent with this thesis:
- Content generation is LLM-heavy (v2 pipeline, 15+ agents, validators, rubric scorer).
- Learner modeling is interpretable and deterministic (6-dim mastery, rule-based repair, mastery-driven explanations).
- The missing piece is the **measurement layer** — not LLM-driven KT, but classical psychometrics (IRT 2PL) that activate once data thresholds hit.

That's exactly what `MEASUREMENT_SCIENCE_ROADMAP.md` already schedules. The paper adds *evidence* for the roadmap's design choices; it does not change the build order.

---

## 5. Concrete follow-ups (ordered)

1. **Build IRT 2PL Phase A estimator** (roadmap §2) — `src/lib/factory/psychometrics/irt-2pl.ts` + synthetic-data test. 1 day. Buildable now.
2. **Add error-signature derivation** — pure function over existing `attempt_v2` + `questions.error_map` columns. Produces `{trap, missed_clue, confusion_pair}` JSON. No new DB fields needed. Enables Phase F.
3. **Signature-driven explanation leads** — extend `getLayerConfig()` in `study-feedback.tsx` to take error signature and re-order 5-component display. No new content authored.
4. **Integrate rubric scoring into pipeline** (roadmap §4) — 2 hours. Already implemented, just not wired.
5. **Log `source_packs_used` per item** (roadmap §6) — 1 hour. Unlocks future learner-outcome correlation analysis.
6. **BKT per Q-matrix dim** — blocked on data threshold (100 users × 100 responses). Build when the query in roadmap §1 clears.
7. **IRT Phase B activation + information-theoretic selector** — blocked on 500 responses/item threshold. Estimator from #1 auto-activates.
8. **Graph/DKT/attention KT** — deferred indefinitely. Not on the path.

Items 1–3 are the content of this audit session's commits.
