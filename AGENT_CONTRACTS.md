# Agent Contracts

## Purpose

Each agent has a bounded role. This document defines what each agent may and may not do, preventing role bleed. If an agent makes a decision outside its contract, the output is invalid.

---

## 1. Blueprint Selector

**Role:** Pick the most valuable blueprint node for the next question.

**Inputs:**
- Candidate blueprint nodes (filtered by shelf/tier, sorted by coverage gap)

**Outputs:**
- `blueprint_node_id` (UUID)
- `rationale` (string)

**May decide:**
- Which underserved node to prioritize
- How to weigh coverage gap vs yield tier vs recency

**May NOT decide:**
- Whether a topic belongs in the blueprint (that's SOURCE_POLICY)
- What the algorithm card should look like
- Any clinical content

**Pass criteria:** Selected node exists and has lowest coverage among candidates.
**Fail criteria:** Selected node doesn't exist. Selected node was recently used when less-served nodes were available.

---

## 2. Algorithm Extractor

**Role:** Construct the clinical decision algorithm (card + facts) for a blueprint node.

**Inputs:**
- Blueprint node (shelf, system, topic, subtopic, task_type, clinical_setting, age_group, time_horizon)

**Outputs:**
- `algorithm_card` (per ALGORITHM_CARD_SPEC.md)
- `fact_rows` (3-6 verified clinical micro-facts)

**May decide:**
- Fork structure (competing paths, hinge feature)
- Which facts are most relevant to the fork
- How to frame the entry presentation
- Severity marker selection

**May NOT decide:**
- Source hierarchy priority (guidelines > review notes for clinical facts)
- Whether the topic is in scope (blueprint says it is)
- Final publication readiness
- Question wording or answer choices

**Pass criteria:**
- Card satisfies ALGORITHM_CARD_SPEC.md acceptance criteria
- All facts cite Tier B sources by name
- Hinge is a concrete clinical datum
- 2-4 genuinely competing paths
- Correct action is specific and evidence-based

**Fail criteria:**
- Multiple hinges (ambiguous fork)
- Ambiguous correct action ("manage appropriately")
- Out-of-scope branch (topic drift)
- Guideline trivia instead of decision fork
- No Tier B source cited
- Fewer than 3 fact rows

---

## 3. Item Planner

**Role:** Design the question architecture — what cognitive error to exploit, how to structure distractors.

**Inputs:**
- Blueprint node
- Algorithm card (must be `generation_ready` status)
- Fact rows
- Error taxonomy

**Outputs:**
- `target_hinge` (string)
- `competing_options` (4-5 strings, same option class)
- `target_cognitive_error` (from error taxonomy)
- `noise_elements` (1-3 strings)
- `option_class` (string)
- `distractor_rationale` (string)

**May decide:**
- Which cognitive error to target
- What noise elements to include
- How to structure distractors
- Option class selection

**May NOT decide:**
- Whether the algorithm card is medically correct (that's the validator's job)
- The actual vignette text
- The correct answer (that comes from the card)

**Pass criteria:**
- All options from the same class
- Target cognitive error exists in taxonomy
- At least 4 competing options
- Distractor rationale explains why each wrong answer is tempting
- Noise elements are clinically plausible

**Fail criteria:**
- Options mix action classes (medications + tests)
- Cognitive error not in taxonomy
- Fewer than 4 options
- Distractor rationale is generic ("this is a common mistake")

---

## 4. Vignette Writer

**Role:** Write the NBME-style clinical vignette with cold chart style and late hinge.

**Inputs:**
- Blueprint node
- Algorithm card
- Item plan
- Fact rows

**Outputs:**
- Complete item draft (vignette, stem, 5 choices, correct answer, initial explanations)

**May decide:**
- Patient demographics (within blueprint constraints)
- Presentation order of clinical data
- Noise element placement
- Vignette pacing and length

**May NOT decide:**
- The correct answer (comes from algorithm card)
- The hinge feature (comes from algorithm card)
- The option class (comes from item plan)
- Clinical thresholds or values (come from fact rows)

**Pass criteria:**
- Vignette ≤ 120 words
- Cold chart style (no teaching voice)
- Hinge appears in final 1-2 sentences
- All 5 options from same class
- Stem is clear and unambiguous

**Fail criteria:**
- Teaching voice or hints
- Hinge revealed too early
- Options from mixed classes
- Vignette exceeds 120 words
- Classic buzzwords that make answer obvious
- Clinical values not matching fact rows

---

## 5. Medical Validator

**Role:** Adversarial medical accuracy check. Attack the question clinically.

**Inputs:**
- Item draft
- Algorithm card (source of truth)
- Fact rows

**Outputs:**
- `passed` (boolean)
- `score` (0-10)
- `issues_found` (string[])
- `repair_instructions` (string | null)

**May decide:**
- Whether clinical content is medically accurate
- Whether thresholds and values are correct
- Whether the correct answer is defensible

**May NOT decide:**
- NBME formatting quality (that's nbme_quality_validator)
- Blueprint alignment (that's blueprint_validator)
- Option symmetry (that's option_symmetry_validator)
- Whether the item is board-testable (that's exam_translation_validator)

**Pass criteria:** Score ≥ 7.0, no auto-kill conditions triggered.
**Fail criteria:** See REJECTION_RULES.md R-MED-01 through R-MED-06.

---

## 6. Blueprint Validator

**Role:** Verify the question targets the intended blueprint node.

**Inputs:**
- Item draft
- Blueprint node

**Outputs:**
- `passed`, `score`, `issues_found`, `repair_instructions`

**May decide:**
- Whether the question tests the specified topic
- Whether task type, setting, age group match

**May NOT decide:**
- Medical accuracy
- Question quality
- Option symmetry

**Pass criteria:** Score ≥ 7.0, topic/task_type/setting align.
**Fail criteria:** See REJECTION_RULES.md R-BP-01 through R-BP-03.

---

## 7. NBME Quality Validator

**Role:** Assess NBME item-writing standards compliance.

**Inputs:**
- Item draft

**Outputs:**
- `passed`, `score`, `issues_found`, `repair_instructions`

**May decide:**
- Late hinge placement quality
- Cold chart style adherence
- Stem clarity
- Plausibility distribution

**May NOT decide:**
- Medical accuracy
- Blueprint alignment

**Pass criteria:** Score ≥ 7.0, no auto-kill conditions.
**Fail criteria:** See REJECTION_RULES.md R-NBME-01 through R-NBME-04.

---

## 8. Option Symmetry Validator

**Role:** Ensure answer choices are well-constructed and internally consistent.

**Inputs:**
- Item draft
- Item plan

**Outputs:**
- `passed`, `score`, `issues_found`, `repair_instructions`

**May decide:**
- Whether options are from the same class
- Whether distractors are plausible
- Whether option lengths are balanced

**May NOT decide:**
- Medical accuracy
- Whether the correct answer is correct

**Pass criteria:** Score ≥ 7.0, no auto-kill conditions.
**Fail criteria:** See REJECTION_RULES.md R-OPT-01 through R-OPT-03.

---

## 9. Explanation Validator

**Role:** Assess whether explanations teach clinical reasoning, not disease facts.

**Inputs:**
- Item draft
- Algorithm card

**Outputs:**
- `passed`, `score`, `issues_found`, `repair_instructions`

**May decide:**
- Whether explanations focus on decisions vs disease lectures
- Whether why_wrong explanations are specific
- Whether high_yield_pearl is genuinely high-yield

**May NOT decide:**
- Medical accuracy of the explanation content
- Whether the correct answer is correct

**Pass criteria:** Score ≥ 7.0, no auto-kill conditions.
**Fail criteria:** See REJECTION_RULES.md R-EXP-01 through R-EXP-02.

---

## 10. Exam Translation Validator

**Role:** Verify the item is a board-style decision fork, not guideline recall or fact regurgitation.

**Inputs:**
- Item draft
- Algorithm card
- Blueprint node

**Outputs:**
- `passed`, `score`, `issues_found`, `repair_instructions`

**May decide:**
- Whether the item tests timing/priority/branch choice
- Whether the hinge is clinically meaningful but exam-compressed
- Whether the item feels like something Step 2 would do with this topic
- Whether the item is a decision fork vs a recall question

**May NOT decide:**
- Medical accuracy
- NBME formatting
- Option symmetry

**Pass criteria:** Score ≥ 7.0 and:
- Item tests a decision, not a fact
- Hinge requires clinical reasoning, not memorization
- The fork is between plausible clinical actions
- The scenario feels like a board exam, not a textbook quiz

**Fail criteria:**
- Item is guideline recall disguised as a question
- Hinge is a classic buzzword or pathognomonic finding
- Only one plausible action exists (no real decision)
- The question asks "what is" instead of "what do you do"

---

## 11. Repair Agent

**Role:** Make targeted repairs to failed items based on validator feedback.

**Inputs:**
- Failed item draft
- All validator reports (failed ones)
- Algorithm card
- Fact rows

**Outputs:**
- Updated complete item draft

**May decide:**
- How to rewrite specific flagged sections
- How to rebalance options
- How to adjust the vignette for late hinge placement

**May NOT decide:**
- The correct answer (must remain the same)
- The algorithm card content
- The fact rows
- Whether to abandon the item (that's the pipeline's job)

**Pass criteria:** Repaired draft addresses all flagged issues.
**Fail criteria:** Repair introduces new issues. Repair changes the correct answer. Repair output is identical to input.

**Priority order when validator instructions conflict:**
1. Medical accuracy
2. Exam translation quality
3. Blueprint alignment
4. NBME quality
5. Option symmetry
6. Explanation quality

---

## 12. Explanation Writer

**Role:** Write decision-focused explanations for passed items.

**Inputs:**
- Passed item draft
- Algorithm card
- Fact rows

**Outputs:**
- `why_correct`, `why_wrong_a-e`, `high_yield_pearl`, `reasoning_pathway`

**May decide:**
- Explanation framing and structure
- Which cognitive error to emphasize
- Reasoning pathway detail level

**May NOT decide:**
- The correct answer
- Clinical facts (must match fact rows)
- Whether the item should be published

**Pass criteria:** Explanations focus on decision logic, not disease teaching. Each why_wrong is specific to that option.
**Fail criteria:** Disease lecture instead of decision explanation. Generic why_wrong. Reasoning pathway is vague.

---

## Elite-Tutor Rule Contracts (additive to v1/v2 contracts above)

The following contract obligations layer on top of the existing v1/v2 agent roles and are enforced by the validators listed. See `ELITE_TUTOR_PRINCIPLES.md` for the full rule spec.

### Case Planner (additions)

Additional required outputs in `case_plan`:

- `reasoning_step_count: int (2–4)` — the number of sequential decisions the item requires (Rule 1).
- `reasoning_steps[]` — ordered array of `{ step_number, what_student_must_recognize, clinical_signal }`. Each `clinical_signal` must be a concrete datum resolvable from the vignette text.
- `difficulty_class: 'easy_recognition' | 'decision_fork' | 'hard_discrimination'` (Rule 2).
- `option_frames[].archetype: 'correct' | 'primary_competitor' | 'near_miss' | 'zebra' | 'implausible' | 'neutral'` — exactly one `correct`, exactly one `primary_competitor`, 0–1 `zebra` (Rule 3).

**May NOT decide:** whether a rule applies to this item (all rules apply to every item).
**Fail criteria:** R-REAS-01, R-OPT-04, R-OPT-05.

### Skeleton Writer (additions)

Additional required outputs in `question_skeleton`:

- `planned_details[].target_option_archetype` — mirrors the case_plan archetype tag so each hinge/competing/noise detail is allocated to a specific archetype.

**Fail criteria:** Archetype allocation inconsistent with `case_plan.option_frames` (e.g., hinge detail targets a `neutral` archetype instead of `primary_competitor`).

### Explanation Writer (additions)

Additional required outputs:

- `down_to_two_discrimination: { competitor_option, tipping_detail, counterfactual }` (Rule 4). `counterfactual` must state the modified scenario where `competitor_option` would be correct and must reference at least one concrete stem detail.
- `question_writer_intent: string (20–200 chars)` (Rule 10). Must follow the template "This question tests whether you prioritize X over Y when Z" and must not simply restate the transfer rule.
- `easy_recognition_check: string | null` — required when `case_plan.difficulty_class === 'easy_recognition'`; null otherwise. One-line pattern the competent student should recognize on sight.

**Pass criteria:** All three fields populated per their constraints; `medicine_deep_dive` passes the teachable-from-scratch rubric.
**Fail criteria:** R-EXP-03, R-EXP-04, R-EXP-05.

### New Validator Responsibilities

- **NBME Quality Validator** — enforces R-REAS-01, R-REAS-02; confirms hinge is at or after reasoning step 2.
- **Option Symmetry Validator** — enforces R-OPT-04, R-OPT-05; confirms `primary_competitor` length within 15% of `correct`; confirms `zebra` (if present) is recognizably exotic.
- **Explanation Validator** — enforces R-EXP-03, R-EXP-04, R-EXP-05; runs `teachable_from_scratch` rubric; validates `question_writer_intent` template.
