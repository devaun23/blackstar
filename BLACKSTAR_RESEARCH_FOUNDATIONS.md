# Blackstar Research Foundations
## Evidence Base for Architectural Decisions

**Purpose**: This document synthesizes findings from four peer-reviewed studies into actionable specifications. Use it to validate that every component of Blackstar's technical architecture is grounded in published evidence. Every claim includes the source paper and the specific finding.

---

## Source Papers

| ID | Paper | Published | Key Contribution |
|----|-------|-----------|-----------------|
| P1 | Shaikh et al. "Collaborative intelligence in AI: Council of AIs on the USMLE" | PLOS Digital Health, Oct 2025 | Multi-agent deliberation framework achieving 93-97% accuracy on USMLE |
| P2 | Bedi et al. "QUEST-AI: Question Generation, Verification, and Refinement" | Pacific Symposium on Biocomputing, 2025 (Stanford) | Generate -> Verify -> Refine pipeline for USMLE-style questions |
| P3 | Siam et al. "Benchmarking LLMs on USMLE for clinical reasoning" | Scientific Reports, Dec 2025 | Multi-model comparison across all USMLE steps and question types |
| P4 | Jia et al. "Agentic memory-augmented retrieval and evidence grounding for medical QA" | Int J Medical Informatics, Jun 2026 | RAG + agentic orchestration + memory bank outperforms standalone LLMs on USMLE |

Additionally references learning science literature: Dunlosky et al. (2013), Maye et al. (2026), Ryan & Kulasegaram (2024), O'Reilly et al. (1998), BMC Medical Education (2024), CORD/AMEE feedback guidelines.

---

## SECTION 1: MULTI-MODEL JURY ARCHITECTURE

### Finding: Multi-agent deliberation outperforms single-model generation

**Source**: P1 -- Council of AIs

**Evidence**:
- Single GPT-4 instances answered correctly ~78% of the time on initial pass (Step 1: 79%, Step 2 CK: 78%, Step 3: 77%)
- Council consensus after deliberation: Step 1: 97%, Step 2 CK: 93%, Step 3: 94%
- The deliberation process corrected errors 83% of the time when at least one member initially proposed the correct answer
- The odds of flipping an incorrect majority to a correct consensus were 5x higher than the reverse (95% CI: 1.1, 22.8)
- Universal failures (all models wrong) were NEVER corrected through deliberation

**Spec Check**:
- [ ] Multiple independent model instances (minimum 3)?
- [ ] A facilitator/aggregator that synthesizes reasoning, not just votes?
- [ ] A structured deliberation protocol when instances disagree?
- [ ] Rejection logic when all instances agree on different wrong answers?

---

### Finding: Ensemble verification catches invalid questions with 83% recall

**Source**: P2 -- QUEST-AI (Stanford)

**Evidence**:
- Flagging rule: if ANY model disagreed, the question was flagged (AUROC 0.79)
- Recall: 83% (15/18 invalid caught). Precision: 60%
- 36% of first-pass questions were invalid
- Invalid categories: Multiple correct (50%), Wrong answer keyed (33%), No correct (17%)
- Physician review: 3.21 min/question

**Spec Check**:
- [ ] At least 3 diverse models in the jury?
- [ ] "Any disagrees" flagging as minimum detection rule?
- [ ] Categorized rejection reasons?
- [ ] Expected 35% invalid rate built into generation planning?

---

### Finding: Model diversity creates complementary error coverage

**Source**: P3 -- Benchmarking LLMs

**Evidence**:
- Universal failures extremely rare: 0% Step 1, 0.83% Step 2 CK, 3.65% Step 3
- Inter-model agreement on errors near-zero (Fleiss' Kappa ~0.003)
- Each model makes unique error types

**Spec Check**:
- [ ] Models from at least 2 different families?
- [ ] Scoring mechanism weighting agreement/disagreement?
- [ ] Logging of which jury member flagged which issue?

---

## SECTION 2: QUESTION GENERATION PIPELINE

### Finding: AI-generated questions indistinguishable from human-written

**Source**: P2

**Evidence**:
- Physicians achieved 51.8% accuracy distinguishing AI vs human (= random guessing)
- Correlation between performance on AI vs human questions: r = 0.952

**Spec Check**:
- [ ] Each question targets a named cognitive operation?
- [ ] Each distractor maps to a specific cognitive error?
- [ ] Case plan declares transfer rule BEFORE question writing?
- [ ] Decision hinge specified with depth level?

---

### Finding: Generate -> Verify -> Refine is the validated pattern

**Source**: P2

**Evidence**:
- In-context examples outperform zero-shot. Refinement works ONLY with specific error categorization.

**Spec Check**:
- [ ] Structured generation with constrained output schema?
- [ ] Blueprints as input to generator?
- [ ] Multi-model verification producing specific error categories?
- [ ] Refinement receiving categorized errors?
- [ ] Maximum retry limit?
- [ ] Evidence grounding before generation (P4)?

---

## SECTION 3: MODEL PERFORMANCE BENCHMARKS

### Finding: Frontier models achieve 84-93% on Step 2 CK

**Source**: P3

**Evidence**:
- DeepSeek V3: Step 2 CK 93% (98% text-only)
- Step 2 CK is where models perform BEST
- Multimodal questions: 70.31% -- lowest category

### Finding: Error types cluster into three categories

**Source**: P3

**Evidence**:
- Conceptual misunderstandings, misinterpretations (most dangerous), reasoning errors
- SVT + hypotension: all models except one chose adenosine over cardioversion
- SIADH: ALL models failed multi-step reasoning (universal failure)

**Spec Check**:
- [ ] Knowledge gap, data integration failure, reasoning chain failure, premature closure, severity miss all tracked?

---

## SECTION 4: DELIBERATION AND CONSENSUS MECHANICS

### Finding: Semantic entropy converges predictably; facilitator-mediated outperforms voting

**Source**: P1

**Evidence**:
- Cap at 4-5 rounds (diminishing returns beyond)
- Entropy converges to zero even when INCORRECT -- jury needs external anchors
- Facilitator-mediated: 95% vs majority voting: 91%
- Pass summaries between rounds, not raw outputs

**Spec Check**:
- [ ] Maximum 4-5 deliberation rounds?
- [ ] Agreement tracking across rounds?
- [ ] Escalation to human review when convergence fails?
- [ ] Facilitator/synthesis step between rounds?

---

## SECTION 5: QUESTION QUALITY AND VALIDATION

### Finding: 64% first-pass valid; "are you sure?" is unreliable

**Source**: P2, P3

**Evidence**:
- Most common failure: multiple correct answers (DISTRACTOR DESIGN problem)
- "Are you sure?" flipped correct to incorrect -- NOT reliable self-correction
- Self-correction works ONLY with structured feedback

**Spec Check**:
- [ ] cognitive_error_id on every distractor?
- [ ] Frame-to-letter mapping validated post-render?
- [ ] No generic self-reflection prompts?
- [ ] All critique uses structured feedback?

---

## SECTION 6: PERFORMANCE ACROSS QUESTION TYPES

### Finding: Step 2 CK is optimal; text-only is strongest

**Source**: P3

**Spec Check**:
- [ ] Targeting Step 2 CK? Text-only in v1? Image-based deferred to v2+?

---

## SECTION 7: COST AND EFFICIENCY

### Finding: $0.50-2.00/question; physician review 3.21 min/question

**Source**: P1, P2, P3

**Spec Check**:
- [ ] Human review interface built? Mock mode for testing? Batch generation with checkpoints?

---

## SECTION 8: EVIDENCE GROUNDING AND RAG

### Finding: Agentic RAG outperforms standalone LLMs on medical QA

**Source**: P4 -- Jia et al. (2026)

**Evidence**:
- USMLE Step 2: 86.24% (agentic) vs 81.67% (standalone) -- 5.6% improvement
- Evidence grounding reduces hallucination
- "Cache-and-prune" memory bank preserves critical insights across steps
- Agentic orchestration > brittle fixed pipelines

**Architectural Implication**: Blackstar should ground generation and explanation in retrievable evidence. Source packs + algorithm cards + fact rows serve this role. Learner model is already a cache-and-prune memory. Fixed pipeline is fine for v1; agentic orchestration is v2+ evolution.

**Spec Check**:
- [ ] Retrievable evidence corpus for generation pipeline?
- [ ] Case planner retrieves evidence BEFORE writing blueprint?
- [ ] Explanation Layer 1 (Medicine) grounded in retrieved evidence?
- [ ] Evidence sources are citable/traceable?
- [ ] Pipeline has clear error handling at each stage (P4)?

---

## SECTION 9: LEARNING SCIENCE -- EXPLANATION DESIGN, FEEDBACK, AND RETENTION

### Finding: Practice testing and spaced repetition are the two highest-utility learning techniques

**Source**: Dunlosky et al. (2013); Maye et al. (2026)

**Evidence**:
- Only TWO techniques received "high utility": practice testing + distributed practice (spaced repetition)
- Spaced repetition meta-analysis (21,415 learners): SMD 0.78 (95% CI: 0.56-0.99, p < 0.0001) -- large effect
- Highlighting, rereading, summarization: LOW utility -- the most common strategies are least effective
- Interleaving improves discrimination ability -- directly relevant to confusion set routing

**Spec Check**:
- [ ] Every interaction is retrieval practice, never passive review?
- [ ] Spaced repetition with expanding intervals (1->3->7->14->30 days)?
- [ ] Block composer interleaves topics?
- [ ] No passive content consumption screens?

---

### Finding: Immediate feedback is optimal for error correction

**Source**: Ryan & Kulasegaram (2024); Persky (2008)

**Evidence**:
- Immediate feedback more effective for ERROR CORRECTION specifically
- Delayed feedback may overwhelm cognitively (all errors at once)
- Feedback must be "targeted, actionable, and meaningful" -- not just correct/incorrect

**Spec Check**:
- [ ] Default mode shows explanation immediately after each question (tutor mode)?
- [ ] Assessment mode delays feedback (exam simulation only)?
- [ ] Error-specific feedback (Layer 3) prioritized over general review (Layer 1)?
- [ ] Feedback never just "correct/incorrect" -- always includes explanation?

---

### Finding: Self-explanation outperforms passive review for medical learning

**Source**: O'Reilly et al. (1998); Dunlosky et al. (2013)

**Evidence**:
- Self-explanation forces integration of new info with existing knowledge
- Students who GENERATE explanations learn more than those PROVIDED explanations
- Forced error labeling IS a self-explanation prompt

**Spec Check**:
- [ ] Forced error labeling as self-explanation prompt?
- [ ] Transfer rules phrased as generalizable principles?
- [ ] Occasional "why does this rule apply?" prompts?
- [ ] Self-explanation friction minimal -- one prompt, not a series?

---

### Finding: Detrimental question bank patterns must be designed against

**Source**: BMC Medical Education (2024) -- "Question banks: credit? Or debit?"

**Evidence**:
- Three detrimental patterns: cueing (surface pattern matching), avoidance (skipping weaknesses), memorizing (question-answer pairs without understanding)
- Students had zero skepticism about QBank content accuracy

**Spec Check**:
- [ ] Hinge depth varies across same concept (anti-cueing)?
- [ ] Sequencer overrides student preferences to target weaknesses (anti-avoidance)?
- [ ] Spaced review serves DIFFERENT questions on same transfer rule (anti-memorizing)?
- [ ] Progressive disclosure respects speed while ensuring transfer rule visibility?

---

### Finding: Feedback quality matters more than quantity

**Source**: CORD Best Practices (2023); AMEE Guide No. 189 (2025)

**Evidence**:
- "Learners value quality over quantity in feedback"
- Acknowledge what was done RIGHT first, then address improvement
- Co-creation of learning goals increases benefit

**Spec Check**:
- [ ] Correct reasoning acknowledged even on wrong answers?
- [ ] Layer 3 (Fix) is 2-3 sentences max?
- [ ] Transfer rule always ONE sentence?
- [ ] Depth available but never forced?
- [ ] Student error patterns inform adaptive priorities?

---

## SECTION 10: WHAT THE RESEARCH DOES NOT COVER (Blackstar's Moat)

1. **Cognitive operation taxonomy**: No system classifies WHICH cognitive operation each question tests
2. **Error-mapped distractors**: No system requires each wrong answer to map to a NAMED cognitive error
3. **Transfer rules**: No system generates/tracks one-sentence transferable principles
4. **Adaptive sequencing based on error classification**: No system uses specific cognitive error to select next question
5. **Decision hinge depth**: No system formally specifies/varies where the critical info appears
6. **Confusion set routing**: No system routes between commonly confused conditions
7. **Spaced repetition on transfer rules**: No system spaces review of transferable principles
8. **3-layer progressive disclosure explanation**: No system uses Fix -> Breakdown -> Medicine
9. **Predictive validity tracking**: No system correlates AI-generated question performance with actual NBME scores
10. **Behavioral error data over self-report**: No system uses forced metacognitive labeling as primary adaptive signal

---

## SECTION 11: VALIDATION CHECKLIST

### Generation Pipeline
- [ ] Structured input (blueprint) feeds generator -- not zero-shot (P2)
- [ ] Case planner declares cognitive operation, transfer rule, confusion set, hinge depth BEFORE writing (unique)
- [ ] Skeleton requires cognitive_error_id on every distractor (unique)
- [ ] Multi-model jury with 3+ models (P1, P2, P3)
- [ ] Facilitator-mediated deliberation (P1)
- [ ] Jury capped at 4-5 rounds (P1)
- [ ] 35% rejection rate built into planning (P2)
- [ ] Refinement receives specific error categorization (P1, P2)
- [ ] Human review as final gate (P2)
- [ ] Text-only in v1 (P3)
- [ ] Evidence grounding before generation (P4)
- [ ] Clear error handling at each stage (P4)

### Evidence Grounding
- [ ] Retrievable evidence corpus exists (P4)
- [ ] Explanation Layer 1 grounded in retrieved evidence (P4)
- [ ] Evidence sources traceable (P4)
- [ ] Retrieval -> reasoning -> grounding -> generation pattern (P4)

### Error Classification
- [ ] Taxonomy maps to research categories (P3)
- [ ] Premature closure, severity miss, multi-step failures tracked (P3)
- [ ] Error classification drives adaptive sequencing (unique)

### Adaptive Engine
- [ ] Confusion set routing (unique)
- [ ] Transfer rule testing for generalization (unique)
- [ ] Spaced repetition with expanding intervals (unique + Maye 2026)
- [ ] Error frequency tracking (unique)
- [ ] Learner state as cache-and-prune memory (P4)

### Explanation Architecture
- [ ] 3-layer progressive disclosure (unique)
- [ ] Fix layer shown first by default (unique)
- [ ] Anchored to pre-declared transfer rule (unique)
- [ ] Label mapping validated post-render (P2)
- [ ] Medicine layer grounded in evidence (P4)
- [ ] Correct reasoning acknowledged on wrong answers (feedback research)
- [ ] Layer 3 is 2-3 sentences max (CORD/AMEE)
- [ ] Transfer rule is ONE sentence (self-explanation research)

### Learning Science & Feedback
- [ ] Every interaction is retrieval practice (Dunlosky -- high utility)
- [ ] Spaced repetition expanding intervals 1->3->7->14->30 days (SMD 0.78)
- [ ] Block composer interleaves topics (interleaving research)
- [ ] Default is immediate per-question feedback (Ryan 2024)
- [ ] Assessment mode delays feedback for exam simulation only
- [ ] Forced error labeling as self-explanation prompt (O'Reilly 1998)
- [ ] Hinge depth varies to prevent cueing (BMC 2024)
- [ ] Sequencer overrides preferences to target weaknesses (BMC 2024)
- [ ] Spaced review uses DIFFERENT questions on same transfer rule (BMC 2024)
- [ ] Progressive disclosure respects speed-seekers

---

## HOW TO USE THIS DOCUMENT

> "Read BLACKSTAR_RESEARCH_FOUNDATIONS.md. This is our evidence base. For every component you build or modify, check the relevant spec checklist. If implementation doesn't match a research-validated requirement, flag it. If it goes beyond research (Section 10), note it's a Blackstar-unique feature."
