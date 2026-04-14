# Blackstar Research Foundations
## Evidence Base for Architectural Decisions

**Purpose**: This document synthesizes findings from three peer-reviewed studies into actionable specifications. Use it to validate that every component of Blackstar's technical architecture is grounded in published evidence. Every claim includes the source paper and the specific finding.

---

## Source Papers

| ID | Paper | Published | Key Contribution |
|----|-------|-----------|-----------------|
| P1 | Shaikh et al. "Collaborative intelligence in AI: Council of AIs on the USMLE" | PLOS Digital Health, Oct 2025 | Multi-agent deliberation framework achieving 93-97% accuracy on USMLE |
| P2 | Bedi et al. "QUEST-AI: Question Generation, Verification, and Refinement" | Pacific Symposium on Biocomputing, 2025 (Stanford) | Generate → Verify → Refine pipeline for USMLE-style questions |
| P3 | Siam et al. "Benchmarking LLMs on USMLE for clinical reasoning" | Scientific Reports, Dec 2025 | Multi-model comparison across all USMLE steps and question types |

---

## SECTION 1: MULTI-MODEL JURY ARCHITECTURE

### Finding: Multi-agent deliberation outperforms single-model generation

**Source**: P1 — Council of AIs

**Evidence**:
- Single GPT-4 instances answered correctly ~78% of the time on initial pass (Step 1: 79%, Step 2 CK: 78%, Step 3: 77%)
- Council consensus after deliberation: Step 1: 97%, Step 2 CK: 93%, Step 3: 94%
- The deliberation process corrected errors 83% of the time when at least one member initially proposed the correct answer
- The odds of flipping an incorrect majority to a correct consensus were 5x higher than the reverse (95% CI: 1.1, 22.8)
- Universal failures (all models wrong) were NEVER corrected through deliberation — if no member initially proposes the correct answer, consensus cannot rescue it

**Architectural Implication for Blackstar**:
- The multi-model jury is NOT optional — it is the mechanism that closes the quality gap from ~78% to ~93%+
- The jury must include at minimum 3 independent model instances (P1 used 5; diminishing returns after 5)
- The generation prompt (case planner + skeleton writer) must be strong enough that at least one model instance produces a correct answer — the jury cannot fix universally wrong generations
- A facilitator/aggregator step must synthesize disagreements, not just take majority vote — P1 showed deliberation outperformed simple majority voting (95% vs 91% overall)

**Spec Check**: Does Blackstar's jury architecture include:
- [ ] Multiple independent model instances (minimum 3)?
- [ ] A facilitator/aggregator that synthesizes reasoning, not just votes?
- [ ] A structured deliberation protocol when instances disagree?
- [ ] Rejection logic when all instances agree on different wrong answers (no rescue possible)?

---

### Finding: Ensemble verification catches invalid questions with 83% recall

**Source**: P2 — QUEST-AI (Stanford)

**Evidence**:
- An ensemble of 5 diverse LLMs was used to verify generated questions
- Flagging rule: if ANY model in the ensemble disagreed with the generator's answer, the question was flagged
- This achieved AUROC of 0.79 for detecting invalid questions
- Recall: 83% (15 of 18 invalid questions caught)
- Precision: 60% (15 of 25 flagged questions were truly invalid)
- Of 50 generated questions, 36% (18) were deemed invalid by physician reviewers

**Architectural Implication for Blackstar**:
- Expect ~35% of first-pass generated questions to be invalid — this is the baseline, not a failure
- The "any disagrees" flagging rule is simple and effective — implement as the minimum viable jury
- Use diverse models in the ensemble (P2 used: Meta-Llama-3-70B, Mixtral-8x22B, Phi-3-medium, Qwen2-72B, Llama-2-70b) — diversity matters more than using the "best" single model
- Invalid questions fall into specific categories: "Multiple correct answer choices" (50%), "AI-chosen answer is incorrect" (33%), "No correct answer choice" (17%)
- Physician review time averaged 3.21 minutes per question — human review is feasible at scale

**Spec Check**: Does Blackstar's validation pipeline include:
- [ ] At least 3 diverse models in the jury (not all from the same family)?
- [ ] "Any disagrees" flagging as minimum detection rule?
- [ ] Categorized rejection reasons (multiple correct, no correct, wrong answer selected, stem error)?
- [ ] Expected invalid rate of ~35% built into generation planning (need to generate ~77 to get 50 valid)?

---

### Finding: Model diversity creates complementary error coverage

**Source**: P3 — Benchmarking LLMs

**Evidence**:
- Across 376 USMLE questions, universal failures (all models wrong) were extremely rare: 0% in Step 1, 0.83% in Step 2 CK, 3.65% in Step 3
- Inter-model agreement on incorrect answers was near-zero (Fleiss' Kappa: 0.0027 for ChatGPT/DeepSeek pair, -0.0023 for Grok/Qwen pair)
- Each model makes unique types of errors — when one model fails, others often succeed
- ChatGPT and DeepSeek showed higher individual accuracy but higher variability (ICC: 0.2994)
- Grok and Qwen showed lower accuracy but higher consistency (ICC: 0.4290)

**Architectural Implication for Blackstar**:
- Use models from DIFFERENT families in the jury — the value comes from diverse reasoning paths, not redundant ones
- Optimal jury composition: pair a high-accuracy model (Claude/DeepSeek) with a high-consistency model (for stable baseline) plus a third from a different family
- The near-zero inter-model agreement on errors means an ensemble/voting system can theoretically catch almost all errors that any single model misses
- This validates the architectural choice of multi-model jury over single-model self-refinement

**Spec Check**: Does Blackstar's jury use:
- [ ] Models from at least 2 different model families?
- [ ] A scoring mechanism that weights agreement/disagreement?
- [ ] Logging of which jury member flagged which issue (for jury calibration over time)?

---

## SECTION 2: QUESTION GENERATION PIPELINE

### Finding: AI-generated questions are indistinguishable from human-written ones

**Source**: P2 — QUEST-AI (Stanford)

**Evidence**:
- Physicians and medical students achieved 51.8% accuracy (95% CI: 46.1-57.5%) in distinguishing AI-generated from human-generated questions — statistically equivalent to random guessing
- Pearson correlation between performance on AI-generated vs human-generated questions was 0.952 (P = 0.012) — nearly perfect correlation
- This means AI-generated questions test the same constructs as human-generated questions

**Architectural Implication for Blackstar**:
- The face validity bar is already cleared by current frontier models — the questions LOOK right
- Blackstar's competitive advantage is NOT face validity (looking like NBME) — that's commodity
- The advantage must come from construct validity (testing the same THINKING as NBME) — error-mapped distractors, cognitive operation targeting, and transfer rules
- Generation quality is a solved problem at the surface level; the unsolved problem is ensuring each question tests a specific cognitive operation with named error traps

**Spec Check**: Does Blackstar's generation pipeline go beyond face validity:
- [ ] Each question targets a named cognitive operation (not just a topic)?
- [ ] Each distractor maps to a specific cognitive error from the taxonomy?
- [ ] The case plan declares the transfer rule BEFORE the question is written?
- [ ] The decision hinge is specified with depth level (surface/buried/deep_buried)?

---

### Finding: Generate → Verify → Refine loop is the validated pipeline pattern

**Source**: P2 — QUEST-AI (Stanford)

**Evidence**:
- Pipeline: (1) Generate questions using GPT-4 with in-context examples, (2) Verify using ensemble of LLMs, (3) Refine flagged questions using GPT-4
- Post-hoc editing by GPT-4 successfully corrected most flagged questions when given specific error categorization
- The in-context example approach (providing a real USMLE question as a template) produced higher quality than zero-shot generation
- Category assignment by GPT-4 was 92% accurate (92 of 100 questions correctly categorized)

**Architectural Implication for Blackstar**:
- Blackstar's pipeline maps to this validated pattern:
  - Generate = case planner → skeleton writer → vignette writer → explanation writer
  - Verify = multi-model jury (skeleton validator + 6 domain validators)
  - Refine = self-refine loop (flagged questions re-enter generation with specific error feedback)
- In-context examples are critical — the blueprint/quintet input system serves this purpose
- The refinement step MUST receive specific error categorization, not just "this is wrong" — the jury must say WHY it's wrong for the refinement to work

**Spec Check**: Does Blackstar's pipeline include:
- [ ] A structured generation phase with constrained output schema?
- [ ] In-context examples or blueprints as input to the generator?
- [ ] A multi-model verification phase that produces specific error categories?
- [ ] A refinement phase that receives categorized errors and re-generates?
- [ ] A maximum retry limit (to avoid infinite refinement loops)?

---

## SECTION 3: MODEL PERFORMANCE BENCHMARKS

### Finding: Current frontier models achieve 84-93% on Step 2 CK

**Source**: P3 — Benchmarking LLMs

**Evidence**:
- DeepSeek V3: Step 1: 89%, Step 2 CK: 93%, Step 3: 84%
- ChatGPT (GPT-4o mini): Step 1: 87%, Step 2 CK: 85%, Step 3: 80%
- Grok 3: Step 1: 76%, Step 2 CK: 77%, Step 3: 73%
- Qwen 2.5-Max: Step 1: 71%, Step 2 CK: 78%, Step 3: 72%
- Human benchmark: Step 1: ~78%, Step 2 CK: ~82%, Step 3: ~76%
- DeepSeek achieved 98% on text-only Step 2 CK questions
- Performance dropped significantly on multimodal (text + image) questions across ALL models

**Architectural Implication for Blackstar**:
- For text-only question generation, frontier models are already performing above human average
- Step 2 CK is where models perform BEST — this is Blackstar's target exam
- Avoid image-dependent questions initially — all models struggle with multimodal reasoning
- The generation model choice matters: DeepSeek/Claude for primary generation, diverse models for jury
- The 93% accuracy ceiling on Step 2 CK means ~7% of generated content will have reasoning errors even from the best models — the jury and human review layer are essential

**Spec Check**: Does Blackstar's model selection account for:
- [ ] Using a frontier model (Claude Opus/Sonnet, DeepSeek) as primary generator?
- [ ] Avoiding image-dependent question stems in v1?
- [ ] Planning for ~7% base error rate from even the best generator?
- [ ] Human review as the final quality gate before questions enter the bank?

---

### Finding: Error types cluster into three categories

**Source**: P3 — Benchmarking LLMs

**Evidence**:
- Conceptual misunderstandings: fundamental inaccuracies in medical knowledge (most common in Step 1)
- Misinterpretations: incorrect understanding of question intent or clinical context (most dangerous — the SVT + hypotension example where all models except one chose adenosine instead of cardioversion because they failed to integrate hemodynamic instability)
- Reasoning errors: logical inconsistencies or flawed deductions (the SIADH example where ALL models failed multi-step reasoning: cancer history → paraneoplastic syndrome → euvolemic hyponatremia → SIADH)
- Universal failure case: ALL five models missed the SIADH question — this represents the type of multi-step clinical reasoning that current models cannot reliably perform

**Architectural Implication for Blackstar**:
- Blackstar's error taxonomy for STUDENTS should mirror these categories — they map to the same cognitive failure modes
- "Misinterpretation" errors (failing to integrate all clinical data) are the most clinically dangerous and most testable — these are ideal targets for Blackstar questions
- Multi-step reasoning questions (3+ inferential steps) are where current models struggle — these questions will need more careful human review
- The decision hinge concept directly addresses the misinterpretation category: the hinge is the one data point that, if integrated correctly, changes the answer

**Spec Check**: Does Blackstar's error taxonomy include:
- [ ] Knowledge gap (conceptual misunderstanding)?
- [ ] Data integration failure (misinterpretation — failed to synthesize all available information)?
- [ ] Reasoning chain failure (correct data, wrong logical conclusion)?
- [ ] Premature closure (stopped reasoning before integrating contradictory evidence)?
- [ ] Severity miss (failed to prioritize unstable vital signs over diagnosis)?

---

## SECTION 4: DELIBERATION AND CONSENSUS MECHANICS

### Finding: Semantic entropy decreases predictably during deliberation

**Source**: P1 — Council of AIs

**Evidence**:
- Entropy (diversity of responses) consistently decreased with each deliberation round
- Entropy always converged to zero by the final round — even when the final consensus was INCORRECT
- Questions requiring 2-3 rounds showed steep, predictable entropy decline (slopes: -0.29 to -0.09)
- Questions requiring 5+ rounds showed shallow, erratic patterns (slopes: -0.07 to -0.02)
- A critical transition occurred around 4-5 rounds — after this point, deliberation became less productive
- Some questions showed temporary entropy INCREASES mid-deliberation before final convergence
- Initial entropy level did NOT predict how many rounds would be needed

**Architectural Implication for Blackstar**:
- Cap jury deliberation at 4-5 rounds — beyond this, the process is unlikely to converge productively
- Track semantic entropy (agreement level) across jury rounds as a quality signal
- High entropy after 3 rounds = flag for human review (the question is ambiguous or the models have genuine disagreement)
- Entropy converging to zero does NOT guarantee correctness — the jury can confidently agree on a wrong answer
- This means the jury needs at least one external anchor (the structured schema, the blueprint constraints) to prevent confident-but-wrong consensus

**Spec Check**: Does Blackstar's jury include:
- [ ] A maximum deliberation round limit (4-5)?
- [ ] Agreement tracking across rounds?
- [ ] Escalation to human review when agreement doesn't converge within limit?
- [ ] External constraints (schema, blueprint) that anchor the jury's reasoning?

---

### Finding: The deliberation architecture matters — facilitator-mediated outperforms direct voting

**Source**: P1 — Council of AIs

**Evidence**:
- The Council used a Facilitator AI that: (1) summarized each member's reasoning, (2) identified points of disagreement, (3) formulated clarifying questions, (4) re-presented the question with context
- This facilitator-mediated approach outperformed simple majority voting (95% vs 91% overall)
- The facilitator was NOT a gating mechanism or task planner — it was a "meta-reasoner" that curated, critiqued, and synthesized responses
- Members received the facilitator's summary (not each other's raw outputs) — this was more token-efficient and possibly supported more coherent deliberation
- Temperature setting was 1 for all instances (maximum diversity in initial responses)

**Architectural Implication for Blackstar**:
- Blackstar's jury should include a synthesis/aggregation step, not just a vote counter
- The jury facilitator prompt should: (1) extract each model's answer and reasoning, (2) identify where they disagree and why, (3) re-query with the disagreement context
- Use high temperature for initial jury passes (maximize response diversity) and lower temperature for the facilitator synthesis (maximize coherence)
- Pass summaries between rounds, not raw outputs (saves tokens, improves coherence)

**Spec Check**: Does Blackstar's jury pipeline include:
- [ ] A facilitator/synthesis step between jury rounds?
- [ ] Structured extraction of each juror's answer + reasoning?
- [ ] Disagreement identification and targeted re-query?
- [ ] Token-efficient summary passing (not raw output forwarding)?

---

## SECTION 5: QUESTION QUALITY AND VALIDATION

### Finding: 64% of first-pass AI questions are fully valid; specific failure modes are predictable

**Source**: P2 — QUEST-AI (Stanford)

**Evidence**:
- 32 of 50 (64%) AI-generated questions were deemed valid by all physician reviewers
- 18 of 50 (36%) were deemed invalid by at least one reviewer
- Invalid question categories:
  - Multiple correct answer choices: 50% of invalid questions (9/18)
  - AI-chosen answer is incorrect: 33% of invalid questions (6/18)
  - No correct answer choice: 17% of invalid questions (3/18)
- GPT-4 was able to refine flagged questions when given specific error feedback
- Category assignment (mapping questions to USMLE content outline) was 92% accurate

**Architectural Implication for Blackstar**:
- The most common generation failure is "multiple correct answers" — this is a DISTRACTOR DESIGN problem
- Blackstar's structured schema (requiring a named cognitive error per distractor) directly addresses this — if each wrong answer must be wrong for a SPECIFIC, NAMED reason, it's harder to accidentally create two correct answers
- The "AI-chosen answer is incorrect" failure is the label mapping bug — exactly what Blackstar's frame-to-letter mapping fix addresses
- The refinement step works, but ONLY when the error category is specific — "this question has multiple correct answers, specifically options B and D are both defensible because..." is actionable; "this question is wrong" is not

**Spec Check**: Does Blackstar's generation schema prevent each failure mode:
- [ ] Multiple correct answers → each distractor has a required cognitive_error_id explaining why it's WRONG?
- [ ] AI-chosen answer incorrect → frame-to-letter mapping validates position after rendering?
- [ ] No correct answer → skeleton validator checks that the declared correct answer is clinically defensible?
- [ ] Stem errors → case planner constraints ensure the clinical scenario is internally consistent?

---

### Finding: "Are you sure?" follow-up prompts do NOT reliably improve accuracy

**Source**: P3 — Benchmarking LLMs

**Evidence**:
- Follow-up prompt "Are you sure?" led to answer changes in 4-8% of questions
- Most changes did NOT improve accuracy — in several cases, models flipped correct answers to incorrect ones
- This is not a reliable self-correction mechanism

**Architectural Implication for Blackstar**:
- Do NOT use simple "are you sure?" self-reflection in the pipeline — it's unreliable
- Self-correction works ONLY with structured feedback: specific error categories, schema violations, or targeted questions about points of disagreement (as in the Council approach)
- The self-refine step in Blackstar's pipeline must provide structured, specific critique — not generic "review your answer"

**Spec Check**: Does Blackstar avoid unreliable self-correction patterns:
- [ ] No generic "are you sure?" prompts in the pipeline?
- [ ] Self-refine steps always include specific, structured feedback?
- [ ] Critique prompts reference schema requirements, not just "check again"?

---

## SECTION 6: PERFORMANCE ACROSS QUESTION TYPES

### Finding: Step 2 CK is where AI performs best — Blackstar's target is the optimal use case

**Source**: P3 — Benchmarking LLMs

**Evidence**:
- DeepSeek achieved 93% overall on Step 2 CK, with 98% on text-only questions
- Step 2 CK focuses on clinical knowledge application — diagnosis, treatment, prevention
- Step 1 (basic science) and Step 3 (independent practice) had lower performance
- Text-only questions had the highest accuracy across ALL models
- Mathematical reasoning questions: 76.47% combined accuracy
- Multimodal (text + image) questions: 70.31% combined accuracy — lowest category

**Architectural Implication for Blackstar**:
- Blackstar is targeting the exact exam type where AI generation is strongest — Step 2 CK
- Prioritize text-only vignettes in v1 — avoid image-dependent stems
- Mathematical reasoning questions (dosage calculations, anion gap, etc.) are viable but need additional validation
- The 98% text-only accuracy on Step 2 CK means the base generation quality is extremely high for Blackstar's use case
- Multimodal questions should be deferred to v2+ when image generation/interpretation tools mature

**Spec Check**: Does Blackstar's v1 scope align with evidence:
- [ ] Targeting Step 2 CK as primary exam?
- [ ] Text-only vignettes in v1 (no image-dependent stems)?
- [ ] Mathematical reasoning questions included but flagged for extra validation?
- [ ] Image-based questions explicitly deferred to v2+?

---

## SECTION 7: COST AND EFFICIENCY

### Finding: Generation cost is manageable; physician review is fast

**Source**: P1, P2, P3

**Evidence (P1)**:
- Average 3.6-4.1 rounds of deliberation per question requiring discussion
- ~22% of questions required deliberation (the rest achieved immediate consensus)
- Time per question with deliberation: 3-15 minutes depending on rounds needed

**Evidence (P2)**:
- Physician review time averaged 3.21 minutes per question (95% CI: 2.73-3.69)
- This is substantially faster than drafting questions from scratch
- The generate-then-review workflow is more efficient than manual creation

**Evidence (P3)**:
- 5 models × 376 questions = large-scale evaluation is feasible
- The cost concern is real but manageable for a question bank of 50-500 questions

**Architectural Implication for Blackstar**:
- Budget ~10-15 API calls per question through the full pipeline (case planner + skeleton writer + skeleton validator + item planner + vignette writer + validators + explanation writer)
- At Anthropic API rates, expect $0.50-$2.00 per question through the full pipeline
- For 50 questions (minimum viable bank): ~$25-100 in API costs
- For 500 questions (full shelf coverage): ~$250-1000 in API costs
- Human review at 3 minutes per question means 50 questions = ~2.5 hours of review
- Build the review interface BEFORE scaling generation — reviewing in Supabase admin panel works for 50, not for 500

**Spec Check**: Does Blackstar's generation planning account for:
- [ ] Realistic per-question cost estimates in the pipeline config?
- [ ] A human review interface or workflow (not just raw database inspection)?
- [ ] Batch generation with quality checkpoints (generate 10, review, tune, generate next 10)?
- [ ] Mock mode for testing pipeline plumbing without API costs?

---

## SECTION 8: WHAT THE RESEARCH DOES NOT COVER (Blackstar's Moat)

None of the three papers address the following — these are Blackstar's unique contributions:

1. **Cognitive operation taxonomy**: No published system classifies WHICH cognitive operation each question tests (pattern recognition vs. severity prioritization vs. differential narrowing, etc.)

2. **Error-mapped distractors**: No published system requires each wrong answer to map to a NAMED cognitive error from a taxonomy — distractors are evaluated for plausibility but not for diagnostic specificity

3. **Transfer rules**: No published system generates or tracks one-sentence transferable principles that generalize beyond the specific case

4. **Adaptive sequencing based on error classification**: No published system uses the specific cognitive error a student makes to select the next question — existing adaptive systems use topic-level mastery, not error-type-level targeting

5. **Decision hinge depth**: No published system formally specifies or varies where in the stem the critical differentiating information appears (surface vs. buried vs. deep-buried)

6. **Confusion set routing**: No published system defines pairs of commonly confused conditions and routes students between them to build discrimination ability

7. **Spaced repetition on transfer rules**: No published system spaces the review of transferable principles (as opposed to spacing individual questions or topics)

8. **3-layer progressive disclosure explanation**: No published system structures explanations as Fix → Breakdown → Medicine with progressive disclosure — existing systems present monolithic explanations

9. **Predictive validity tracking**: No published system correlates AI-generated question performance with actual NBME exam scores

10. **Behavioral error data over self-report**: No published system uses forced metacognitive labeling (what error type did you make?) as the primary adaptive signal instead of confidence self-report

---

## SECTION 9: VALIDATION CHECKLIST

Use this checklist to verify Blackstar's architecture against the research:

### Generation Pipeline
- [ ] Structured input (blueprint/quintet) feeds the generator — not zero-shot (P2)
- [ ] Case planner declares cognitive operation, transfer rule, confusion set, and hinge depth BEFORE question writing (Blackstar unique)
- [ ] Skeleton requires cognitive_error_id on every distractor — non-nullable (Blackstar unique)
- [ ] Multi-model jury with 3+ diverse models validates output (P1, P2, P3)
- [ ] Jury uses facilitator-mediated deliberation, not simple majority vote (P1)
- [ ] Jury capped at 4-5 deliberation rounds (P1)
- [ ] Expected 35% rejection rate on first pass, built into generation planning (P2)
- [ ] Refinement step receives specific error categorization, not generic rejection (P1, P2)
- [ ] Human review as final quality gate at 3 min/question (P2)
- [ ] Text-only vignettes in v1; image-dependent deferred to v2+ (P3)

### Error Classification (Student-Facing)
- [ ] Error taxonomy maps to research-validated categories: conceptual misunderstanding, misinterpretation/integration failure, reasoning error (P3)
- [ ] Premature closure specifically tracked (P3 — SVT/hypotension example)
- [ ] Severity miss specifically tracked (P3 — failure to prioritize unstable vitals)
- [ ] Multi-step reasoning failures tracked (P3 — SIADH universal failure)
- [ ] Error classification drives adaptive sequencing (Blackstar unique)

### Adaptive Engine
- [ ] Confusion set routing connects to seeded confusion_sets table (Blackstar unique)
- [ ] Transfer rule testing confirms generalization, not just recall (Blackstar unique)
- [ ] Spaced repetition on mastered concepts with expanding intervals (Blackstar unique)
- [ ] Error frequency tracking surfaces repeated patterns to the student (Blackstar unique)

### Explanation Architecture
- [ ] 3-layer progressive disclosure: Fix (error + transfer rule) → Breakdown (reasoning + per-option) → Medicine (content teaching) (Blackstar unique, informed by Amboss/UWorld user research)
- [ ] Fix layer shown first by default; others collapsed (Blackstar unique)
- [ ] Explanation writer anchored to pre-declared transfer rule from case plan (Blackstar unique)
- [ ] Label mapping validated: explanation labels match rendered option positions (P2 — "AI-chosen answer is incorrect" failure mode)

---

## HOW TO USE THIS DOCUMENT

Feed this document to Claude Code with the prompt:

> "Read BLACKSTAR_RESEARCH_FOUNDATIONS.md. This is our evidence base. For every component you build or modify, check the relevant spec checklist in this document. If our implementation doesn't match a research-validated requirement, flag it. If our implementation goes beyond what the research covers (Section 8), note that it's a Blackstar-unique feature that can't be validated against published evidence yet."

This ensures every technical decision is traceable to either published evidence or an explicitly identified novel contribution.
