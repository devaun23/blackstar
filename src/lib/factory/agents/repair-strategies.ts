/**
 * Specialized repair prompt overrides per failure category.
 *
 * Research (TeamMedAgents, Aug 2025): adaptive component selection outperformed
 * comprehensive integration by 2-10 percentage points. Different failure types
 * benefit from different repair strategies — a monolithic repair prompt can't
 * optimize for all 10 simultaneously.
 *
 * These overrides are appended to the base repair_agent system prompt at runtime.
 * They are NOT separate agents — just targeted instruction blocks.
 */

import type { FailureCategory } from '../schemas/validator-report';

export const REPAIR_SYSTEM_OVERRIDES: Record<FailureCategory, string> = {
  multiple_correct: `
## SPECIALIZED REPAIR: MULTIPLE CORRECT ANSWERS
This item failed because more than one answer choice is clinically defensible.

YOUR PRIMARY TASK: Make the correct answer UNIQUELY defensible.

REPAIR CHECKLIST:
1. For EACH distractor (wrong option), identify the SPECIFIC cognitive error that makes it wrong.
   - If you cannot name a specific error, the distractor is too defensible — rewrite it.
2. Check each distractor against the algorithm card thresholds. A distractor that matches a valid management step (even in a different context) is dangerous.
3. Strengthen the vignette: add clinical details that make ONLY the correct answer appropriate.
   - Age, comorbidities, timing, lab values, or severity markers that rule out alternatives.
4. Verify the correct_action_class differentiates from distractor action classes.

COMMON PITFALL: Weakening distractors by making them absurd. Distractors must remain plausible but clearly wrong for a SPECIFIC clinical reason.`,

  wrong_answer_keyed: `
## SPECIALIZED REPAIR: WRONG ANSWER KEYED
This item failed because the declared correct answer is not the best clinical answer.

YOUR PRIMARY TASK: Determine the truly correct answer and fix the keying.

REPAIR CHECKLIST:
1. Re-derive the correct management from the algorithm card. Trace the decision tree step by step.
2. Compare the algorithm card's recommended action to the currently keyed answer.
3. If the algorithm card supports the current key:
   - The clinical scenario must be inconsistent with reaching that decision point. Fix the vignette.
4. If the algorithm card does NOT support the current key:
   - Re-key to the correct option. Update correct_option_frame_id.
   - Update the explanation to match the new correct answer.
   - Update error_mapping for all distractors relative to the new correct answer.
5. After re-keying, verify NO other option is now also defensible (cascading multiple_correct).

COMMON PITFALL: Changing the key without updating the explanation and error_mapping. All three must be consistent.`,

  no_correct_answer: `
## SPECIALIZED REPAIR: NO CORRECT ANSWER
This item failed because none of the answer choices is fully correct per current guidelines.

YOUR PRIMARY TASK: Ensure at least one option matches guideline-recommended management.

REPAIR CHECKLIST:
1. Review the algorithm card's treatment steps for this clinical scenario.
2. Identify which option is CLOSEST to the recommended management.
3. Either:
   a. Modify that option to exactly match the guideline recommendation, OR
   b. Replace one distractor with the guideline-correct management and re-key.
4. Verify the clinical scenario clearly leads to the guideline's decision point.
5. Update the explanation to reference the specific guideline recommendation.

COMMON PITFALL: Creating a correct option that's technically right but at the wrong step in management (e.g., definitive treatment when initial stabilization is needed).`,

  medical_error: `
## SPECIALIZED REPAIR: MEDICAL FACTUAL ERROR
This item contains a factual medical inaccuracy in the stem, options, or explanation.

YOUR PRIMARY TASK: Fix the specific factual error while preserving the question's testing logic.

REPAIR CHECKLIST:
1. Identify the EXACT factual claim that is incorrect (threshold, drug, timing, contraindication).
2. Cross-reference against the algorithm card and fact rows for the correct value.
3. Fix the error. If the error is in the stem, ensure the corrected fact doesn't change which answer is correct.
4. If the error is in the explanation, ensure the teaching point remains accurate.
5. Check for cascading errors: a wrong threshold in the stem may invalidate the correct answer.

COMMON PITFALL: Fixing the stated error but introducing a new one by changing clinical details.`,

  option_asymmetry: `
## SPECIALIZED REPAIR: OPTION ASYMMETRY
This item's answer choices are not parallel in structure, length, or specificity.

YOUR PRIMARY TASK: Make all options parallel while preserving their clinical meaning.

REPAIR CHECKLIST:
1. All options should use the same grammatical structure (all imperative, all noun phrases, etc.).
2. All options should be similar in length (no option should be >2x the length of the shortest).
3. All options should be from the same action class when possible (all treatments, all diagnostics, etc.).
4. Verify the correct answer doesn't stand out due to being more specific or detailed.
5. Ensure no option is a subset of another (e.g., "IV fluids" vs "IV fluids and vasopressors").`,

  stem_clue_leak: `
## SPECIALIZED REPAIR: STEM CLUE LEAK
The stem contains grammatical, logical, or structural cues that reveal the answer.

YOUR PRIMARY TASK: Remove all testwise cues while preserving the clinical scenario.

REPAIR CHECKLIST:
1. Check for grammatical agreement (article "an" matching only one option starting with a vowel).
2. Check for length imbalance (correct answer significantly longer/shorter than distractors).
3. Check for absolute qualifiers ("always", "never") only in distractors.
4. Check for convergence (3 options suggest one approach, 1 stands alone — the lone option shouldn't be correct).
5. Check the stem's last phrase: does it grammatically complete with only the correct option?`,

  scope_violation: `
## SPECIALIZED REPAIR: SCOPE VIOLATION
The question tests content outside the target shelf or content outline.

YOUR PRIMARY TASK: Adjust the clinical scenario to fall within the target content area.

REPAIR CHECKLIST:
1. Check the blueprint node's shelf, topic, and subtopic — the question must test within these bounds.
2. If the diagnosis is out of scope, change the presenting scenario to one within scope that tests the same decision type.
3. If the management is out of scope (e.g., surgical question on a medicine shelf), reframe to test the medicine-side decision (when to consult, initial stabilization, etc.).
4. Preserve the same cognitive error targets and hinge structure if possible.`,

  recall_not_decision: `
## SPECIALIZED REPAIR: RECALL INSTEAD OF DECISION
This item tests fact recall instead of clinical decision-making.

YOUR PRIMARY TASK: Rewrite to test a genuine clinical decision with competing plausible options.

REPAIR CHECKLIST:
1. Identify what DECISION the original question is trying to test (from the case plan).
2. Rewrite the stem to present a clinical scenario where the student must CHOOSE between plausible management options.
3. Each option should represent a different clinical reasoning path, not a different fact.
4. The correct answer should require synthesizing multiple clinical data points, not recalling a single fact.
5. Verify the question has a genuine hinge: a finding that changes which option is correct.

COMMON PITFALL: Adding clinical decoration to a recall question without changing the fundamental reasoning required.`,

  explanation_gap: `
## SPECIALIZED REPAIR: EXPLANATION GAP
The explanation fails to teach the reasoning pathway.

YOUR PRIMARY TASK: Ensure the explanation teaches WHY, not just WHAT.

REPAIR CHECKLIST:
1. why_correct must explain the REASONING CHAIN: what findings → what conclusion → what action, and WHY this sequence.
2. Each why_wrong must reference the SPECIFIC cognitive error that makes that option wrong (not just "this is incorrect").
3. The teaching_pearl must be a generalizable principle, not a restatement of the correct answer.
4. Verify the explanation references the decision hinge and explains why it's the pivotal finding.
5. The explanation should help a student who got it wrong understand their specific error.`,

  hinge_missing: `
## SPECIALIZED REPAIR: MISSING DECISION HINGE
The vignette lacks a clear pivotal finding that differentiates the correct answer.

YOUR PRIMARY TASK: Add or strengthen the decision hinge.

REPAIR CHECKLIST:
1. Review the case plan's hinge_placement and hinge_description.
2. Ensure the vignette contains a finding that, if changed, would change the correct answer.
3. The hinge should be present but not immediately obvious — buried among other clinical details per the hinge_depth target.
4. Verify that removing the hinge would make at least one other option equally defensible.
5. The hinge should be clinically realistic, not an artificial differentiator.

COMMON PITFALL: Making the hinge too obvious (surface-level hinge depth) or too obscure (irrelevant detail that only experts would catch).`,

  too_easy: `
## SPECIALIZED REPAIR: ITEM TOO EASY (estimated difficulty > 0.75)
Research shows AI-generated items average 0.76 difficulty vs 0.65 for human-authored (p=0.02).

YOUR PRIMARY TASK: Increase genuine difficulty by strengthening reasoning demands, NOT by adding medical ambiguity.

REPAIR CHECKLIST:
1. Strengthen the near-miss distractor — make it MORE tempting by adding competing clinical evidence.
2. Add competing signal: 2+ findings in the vignette that genuinely support the near-miss's diagnosis.
3. Bury the hinge deeper — move the distinguishing finding earlier or embed it within a detail.
4. Add noise: 1-2 irrelevant but plausible findings that dilute the signal.
5. Verify that covering the last 2 sentences leaves the near-miss equally defensible.

COMMON PITFALL: Making the question harder by introducing medical ambiguity (multiple correct answers) rather than reasoning difficulty (one correct answer that requires careful analysis to identify).`,

  non_functioning_distractor: `
## SPECIALIZED REPAIR: NON-FUNCTIONING DISTRACTOR (estimated <5% selection)
Research shows AI distractor efficiency is 39% vs 55% for humans (p=0.035). A non-functioning distractor is one no real student would choose.

YOUR PRIMARY TASK: Replace weak distractors with options that test genuine reasoning errors.

REPAIR CHECKLIST:
1. Replace the flagged distractor with an option that IS correct for a related but different clinical scenario.
2. The replacement must exploit a DIFFERENT cognitive error than other distractors.
3. The replacement must be from the same option_action_class (don't mix medications with diagnostics).
4. Verify the replacement would attract ≥10% of test-takers by confirming a real reasoning path leads to it.
5. Do NOT replace with an absurd option or one from a different clinical domain.

COMMON PITFALL: Creating "filler" distractors that look plausible on paper but no student with basic medical knowledge would choose.`,

  linguistic_tells: `
## SPECIALIZED REPAIR: AI LINGUISTIC TELLS (3+ prohibited phrases detected)
Research: redundancy OR 6.90, repetition OR 8.05, smooth coherence OR 6.62 in AI text detection.

YOUR PRIMARY TASK: Rewrite the vignette in chart-note style without changing any clinical content.

REPAIR CHECKLIST:
1. Remove all prohibited phrases: "presents with," "notably," "significant for," "consistent with," "upon examination," "reveals," "demonstrates," "was found to have."
2. Use replacement phrasing: "is brought to" (not "presents to"), "shows" (not "reveals"), state findings directly (not "the patient reports").
3. Vary sentence structure: mix short fragments ("Lungs clear.") with longer sentences. Do NOT start consecutive sentences the same way.
4. Remove smooth transitions: delete "additionally," "furthermore," "upon further evaluation." Just juxtapose findings.
5. Do NOT change any clinical data, lab values, physical findings, or the overall clinical scenario.

COMMON PITFALL: Changing clinical content while fixing style, or making the vignette too terse to contain the required competing signals and noise elements.`,

  near_miss_absent: `
## SPECIALIZED REPAIR: NO NEAR-MISS DISTRACTOR
The item has no distractor that would be correct under slightly modified conditions. This is the #1 cause of items being too easy.

YOUR PRIMARY TASK: Redesign one distractor as a near-miss with a single distinguishing detail.

REPAIR CHECKLIST:
1. Identify the strongest current distractor — the one most students would choose if they got this wrong.
2. Redesign it as a near-miss: make it correct if ONE clinical detail in the vignette were different.
3. Specify the pivot_detail: what single change (lab value, vital sign, history element, timing) makes this correct.
4. Ensure the hinge clue is what distinguishes the correct answer from the near-miss.
5. Add 2+ competing signals for the near-miss's diagnosis in the vignette (before the hinge).
6. Update distractor_rationale_by_frame to mark the near-miss with correct_when and distinguishing_detail.

COMMON PITFALL: Creating a near-miss that requires changing 2-3 details (that's just a different scenario, not a near-miss). The pivot must be EXACTLY one detail.`,
};
