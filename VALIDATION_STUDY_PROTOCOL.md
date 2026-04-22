# Blackstar Validation Study Protocol (v0.1)

## One-sentence summary

A 4-week, within-subject feasibility + preliminary-efficacy study with ~20 M3/M4 medical students, designed to test whether Blackstar's repair loop measurably reduces within-student error repetition (primary) and whether there is a detectable shelf-score signal (secondary, exploratory at this n).

**Status:** Draft v0.1 — not yet executable. See **Blockers** at end.

---

## Why this study exists

The Blackstar thesis is *construct validity > face validity*: questions that look like NBME items are common; questions that *train NBME-style reasoning and measurably reduce error repetition* are rare. That claim is currently unevidenced. Without a study, everything downstream — recruitment, pricing, PR, investor conversations, the decision to push through intern year vs. pivot — rests on belief.

The study has three jobs:

1. **Kill-switch**: if the error-repetition signal isn't real, we learn that on a 4-week timescale for ~$1k, not on a 12-month build timescale for a year of the founder's life.
2. **Evidence artifact**: a pre-registered result with a signed protocol is the single most durable trust object in a trust-starved market. It unlocks blockers 3 and 4 (content trust, distribution).
3. **Beta recruitment vehicle**: the study *is* the beta recruitment pitch. Students get free access, a personalized weakness report, and a $50 gift card in exchange for opting in. The recruitment funnel and the validation funnel are the same funnel.

---

## Hypotheses

### Primary (H1) — within-Blackstar error repetition

> Among enrolled students who complete ≥ 3 training sessions, the rate of 3×-repeated cognitive errors (same `cognitive_error_id` missed ≥3 times) in week 4 is **≤ 50% of the rate in week 1** (paired, within-subject).

Why this endpoint: maps directly onto the stated product mission ("stop missing NBME questions for the same reason twice"). Every student produces dozens of attempts per week, so within-subject power is high even at n=20. This is the endpoint that can be **well-powered** at this cohort size.

### Secondary (H2, exploratory) — external-instrument score delta

> Pre/post score on a standardized external instrument (UWorld Self-Assessment or NBME Medicine Comprehensive Self-Assessment) shows a paired mean delta of **≥ +6 scaled points** in the treatment-adherent group.

Why explicitly exploratory: at n=20 the external-instrument delta needs Cohen's *d* ≈ 0.7 for 80% power — a large effect. A positive signal is a green light for a larger Phase 2; a null signal is not disqualifying because the study is underpowered for anything smaller.

### Qualitative (H3) — learner report

> ≥ 70% of completers agree with "Blackstar helped me understand *why* I was making a particular mistake" on a 5-point Likert.

---

## Design

- **Arm structure:** Single-arm, within-subject, paired pre/post (week 1 vs week 4 for H1; pre/post external assessment for H2).
- **Blinding:** None feasible at this stage; acknowledged confounder.
- **Co-intervention:** Students will continue using UWorld/AMBOSS; we will not interfere. Self-reported hours-per-week on each platform is captured weekly and treated as a covariate.
- **Inclusion:** US-MD or US-DO students in M3 or M4; studying for Step 2 CK within the next 12 months; commits to ≥ 30 min/day of Blackstar practice for 4 weeks.
- **Exclusion:** Step 2 CK exam within the 4-week study window (confounds with terminal cram); current Blackstar team members.

## Measurements

| Timepoint | Instrument | Captures |
|---|---|---|
| Week -1 (baseline) | UWorld Self-Assessment 1 OR NBME Self-Assessment | Pre score (H2) |
| Week -1 (baseline) | Demographics + study habits survey | Covariates |
| Weeks 0–4 (continuous) | Blackstar attempt stream | H1 endpoint, time per item, self-labeled error, free-text reasoning |
| Weekly | Hours-on-platform self-report | Covariate |
| Week 4 (post) | UWorld Self-Assessment 2 OR NBME | Post score (H2) |
| Week 4 (post) | Exit survey (Likert + free response) | H3, UX feedback |

## Sample size & power

- **H1 (primary):** 20 students × ~50 wrong-answer attempts/week × 4 weeks ≈ 4,000 error observations. Within-subject paired comparison on error-repetition rate. Even a 50% relative reduction at baseline rates of ~30% (observed in alpha) is detectable at *p* < 0.01 with 15 completers.
- **H2 (secondary):** n=20 provides ~80% power only for *d* ≈ 0.7. This is the honest limitation. Report as exploratory with 95% CI; use to power a Phase 2 (n≈70).
- **Attrition buffer:** Enroll 25 to land ≥ 20 completers.

## Go / no-go decision rule

Pre-registered before the first participant is enrolled:

| Outcome | Interpretation | Action |
|---|---|---|
| H1 passes, H2 point estimate positive, H3 ≥70% | Strong signal | Phase 2 (n≈70), consider press |
| H1 passes, H2 null/flat, H3 ≥70% | Repair loop works, external transfer unclear | Phase 2 with better external instrument |
| H1 fails, H3 ≥70% | Students like it, but the adaptive engine isn't doing what it claims | **Stop and redesign the repair engine before scaling** |
| H1 fails, H3 <70% | No signal and no love | **Kill switch engaged.** Consider pivot. |

This rule is the entire point of the study. It has to be written down *before* data arrives to be credible to you later.

## Timeline

| Week | Work |
|---|---|
| −8 to −6 | Finalize protocol, IRB exempt determination, lock primary/secondary endpoints |
| −6 to −4 | Pre-register protocol (OSF or equivalent); draft recruitment copy |
| −4 to −1 | Recruit 25 students; administer baseline assessment; onboard |
| 0 to 4 | Intervention — students self-pace; weekly check-in survey |
| 4 | Administer post-assessment; exit survey |
| 5 to 6 | Analyze, write up |

In parallel (Weeks −8 through 4): clinician audit (below) + content generation to reach ≥ 200 published items.

## Confounders acknowledged

- **Selection bias:** volunteers are motivated. Report as feasibility limitation.
- **Co-intervention (UWorld, AMBOSS, etc.):** uncontrolled; covariate-adjusted.
- **Novelty effect:** first 2 weeks may show exaggerated engagement; H1 compares week 1 to week 4 *specifically* to dampen this.
- **Hawthorne effect:** being observed improves effort. Phase 2 can add an active-comparator arm.
- **Cold-start on the adaptive engine:** first ~15 attempts per student are calibration, not truly adaptive. H1 specifically ignores the first 15 attempts per student.

## IRB / ethics

This study is almost certainly **IRB-exempt under 45 CFR 46.104(d)(1)** (research on regular and special education instructional strategies) but must still receive an exempt determination. Plan:

1. File exempt determination request with the target medical school's IRB during Week −8.
2. Prepare informed-consent language (voluntary, withdrawable, no clinical decisions, anonymized data).
3. Data storage: no PHI captured. NetID → study ID mapping held in a separate encrypted file.

If the target cohort spans multiple schools, a central IRB (WCG / Advarra) route becomes necessary and adds ~4 weeks.

## Content prerequisites

To run a 4-week protocol at 30 min/day ≈ 15 items/day × 28 days ≈ 420 items per student, with variant avoidance and system rotation:

- **Minimum published corpus:** ~200 items, concentrated in Internal Medicine (~150) with secondary coverage in surgery / peds / OB-GYN (~50).
- **Current corpus:** ~5 published (per memory, as of 2026-04-22). **Gap: ~195 items.**
- **Throughput needed:** At the post-fix target publish rate (TBD once v5/v6 prompts are stable), 195 items is ~4 weeks of continuous batch generation at concurrency 3–5.

This is the **hardest single prerequisite** and makes the content-trust audit more tractable (see below).

## Clinician audit (content trust — blocker 3)

Run the audit *during* content generation, not after:

- Recruit one PGY-2+ internal medicine resident at $100/week for 2 hrs/week × 8 weeks = $800.
- Structured sampling: stratified random sample of 100 published items across the 4 Difficulty × Topic cells.
- Red-flag checklist (10 items): medical accuracy, guideline currency, option plausibility, hinge validity, explanation correctness, absence of harmful recommendations, etc.
- Target: < 5% red-flag rate before launch. Every flagged item is reviewed, repaired or retired.
- Audit report is a publishable artifact in its own right and addresses the "one wrong answer ends you" risk directly.

## Recruitment plan

- **Channel 1 — your own cohort:** direct outreach to ~30 M3s at your school. Conversion: ~30–50% (high trust).
- **Channel 2 — r/medicalschool:** one post framed as a research study, not a product launch. Conversion: low (~1–3%) but wide reach; good for diversity of institutions.
- **Channel 3 — adjacent programs:** reach out to the 2 nearest medical schools' class officers.
- **Compensation:** free 4-week access + personalized weakness report + $50 Amazon gift card contingent on completion.
- **Funnel expectation:** to land 25 enrolled we'll need ~80 expressions of interest — plan recruitment reach accordingly.

## Budget (worst case)

| Item | Cost |
|---|---|
| External assessment access (25 × $60) | $1,500 |
| Completion gift cards (20 × $50) | $1,000 |
| Clinician audit (8 weeks × $100) | $800 |
| IRB fee (school-dependent, often waived for exempt) | $0–500 |
| **Total** | **~$3,300–3,800** |

## Bandwidth (blocker 5)

This protocol is designed to fit the ~5–10 hrs/week ceiling:

- Weeks −8 to −4 (protocol + IRB + content prereq): ~8 hrs/week (the spike)
- Weeks −4 to 0 (recruitment): ~6 hrs/week
- Weeks 0 to 4 (monitoring): ~3 hrs/week (mostly automated)
- Weeks 5 to 6 (analysis + writeup): ~10 hrs/week (second spike)

Total ≈ 120 hrs over 14 weeks. Fits the window.

## Blockers to start

| # | Blocker | Owner | Unblocks |
|---|---|---|---|
| B1 | Fix v5 case_planner prompt — archetype field not being emitted (observed in smoke test 2026-04-22) | Builder | Content generation |
| B2 | Stabilize v6 explanation_writer output at non-trivial publish rate | Builder | Content generation |
| B3 | Generate ≥ 200 published items | Builder + pipeline | Study start |
| B4 | IRB exempt determination | Builder | Recruitment |
| B5 | Recruit + onboard resident auditor | Builder | Parallel content trust |
| B6 | Select external assessment instrument (UWorld SA vs NBME SA) | Builder | Baseline measurement |

B1 is the immediate next task — the smoke test run on 2026-04-22 killed 4/5 items in 3.5 minutes because Claude was omitting the new required fields (`archetype`, and regressing on `ambiguity_level` / `distractor_strength` / `clinical_complexity`). Until B1 is resolved, nothing downstream moves.

## What this document is *not*

- Not a commitment to publish. The choice of internal-vs-publishable can be made after the data is in hand.
- Not a Phase 2 design. This study's job is to decide *whether* a Phase 2 is warranted.
- Not a product launch plan. Students in this study are research participants, not early customers. Blurring that line is a trust-destruction risk.
