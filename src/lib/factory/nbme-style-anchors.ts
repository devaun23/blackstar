// NBME Item-Writing Style Anchors
// Distilled from the official NBME Item-Writing Guide, 6th ed., October 2024.
// Full text at docs/nbme-item-writing-guide-2024.md.
//
// Injected as a BINDING style reference into vignette_writer and explanation_writer prompts.
// This is a STYLE/STRUCTURE source only — clinical truth still comes from guideline
// source packs and fact_rows. These anchors exist to eliminate AI tells and to make
// generated items indistinguishable from official NBME items.
//
// Companion: src/lib/factory/nbme-lead-in-templates.ts — task-type → authoritative lead-ins.

export const NBME_STEM_ANCHORS = `
═══ NBME OFFICIAL ITEM-WRITING STANDARDS (6th ed., 2024 — binding reference) ═══

THE 5 CORE RULES:

1. Each item focuses on ONE important concept. Usually derived from the blueprint (disease × task).
2. Each item tests APPLICATION of knowledge, not recall of an isolated fact. A clinical or experimental vignette provides context — without it, the item is pure recall.
3. The lead-in is focused, closed, and clear. A test-taker must be able to answer using only the vignette + lead-in (the "cover-the-options" test). Avoid open lead-ins like "The diagnosis in this patient is:".
4. All options are HOMOGENEOUS and PLAUSIBLE. Homogeneous = same category, same grammatical form, same level of specificity, rank-orderable on a single dimension. Plausible = each distractor entices someone who doesn't know the answer; no absurdities.
5. Review for technical flaws before accepting. Bulk of text (vignette) precedes the lead-in; vignette follows demographics → history → PE → lab data → initial treatment → subsequent findings.

VIGNETTE TEMPLATE (use components as relevant, in this order):
  age/gender (self-identified) → site of care → presenting symptoms → duration →
  past history / family / psychosocial / ROS → physical exam → diagnostic studies →
  initial treatment / subsequent findings

LEAD-IN:
- Single, closed, clear question.
- Canonical forms (match to task type):
    diagnosis      → "Which of the following is the most likely diagnosis?"
    next step      → "Which of the following is the most appropriate next step in management?"
    pharmacotherapy → "Which of the following is the most appropriate pharmacotherapy?"
    diagnostic test → "Which of the following is the most appropriate diagnostic study at this time?"
    mechanism      → "Which of the following is the most likely cause of this effect?"
    prognosis      → "This patient is most likely to develop which of the following?"
- Vignette_writer also receives a task-type-filtered list of NBME-authoritative lead-ins; pick one from that list verbatim when generating stems.

OPTION CONSTRUCTION (Rule 4):
- 5 options (A–E) for one-best-answer items. NBME uses A-type, F-type (sequential set, no backtrack), or G-type (sequential set, backtrack allowed) only.
- All options same category (all diagnoses, or all next steps — never mixed).
- Same grammatical form across all options. Start generating with the correct answer; then write parallel, plausible distractors.
- Distractors can be partially correct — they must be less correct than the key, not wrong.
- Correct answer MUST NOT be longer, more qualified, or more specific than distractors.
- No "all of the above," "none of the above," or compound options (A and C).

TECHNICAL FLAWS — IRRELEVANT DIFFICULTY (fix these):
- Long/complex options → put common text in stem; parallel construction; shorten.
- Tricky/overloaded stems → include only content needed to answer; no teaching statements.
- Inconsistent numeric data → no overlapping ranges; all ranges OR all specific values, never mixed.
- Vague frequency terms ("often," "usually") → avoid; different readers interpret differently.
- "None of the above" → replace with a specific action (e.g., "No intervention is indicated at this time").
- Nonparallel options → edit to parallel grammatical form and structure.
- Negatively phrased lead-ins ("EXCEPT," "NOT") → revise to positive structure.

TECHNICAL FLAWS — TESTWISE CUES (fix these):
- Collectively exhaustive subsets (increase/decrease/no change) → replace at least one option in the subset.
- Absolute terms ("always," "never") in options → eliminate; testwise examinees know these are rarely correct.
- Grammatical cues (option doesn't grammatically follow lead-in) → all options singular or all plural; use closed lead-ins.
- Correct option stands out (longer, more qualified, more specific) → equalize length; remove teaching-point language.
- Word repetition (stem word appears uniquely in correct answer — "clang clue") → remove the repeated word, or use it across all options.
- Convergence (correct answer shares the most elements with other options) → balance term use so no option has maximum overlap.

PATIENT CHARACTERISTICS (NEW in 6th ed. 2024 — CRITICAL):
Patient characteristics (PCs) = sex/gender identity, race/ethnicity/country of origin/native language, sexual orientation, occupation/military status, socioeconomic status, disability.

Include PCs when they:
  (a) add to overall exam representativeness, OR
  (b) are clinically relevant to the diagnosis or distractor quality, OR
  (c) are necessary context (item would be unreasonably difficult or misleading without them).

AVOID PCs that reflect stereotypes (race/ethnicity, country of origin, gender, sexual orientation behaviors).

Report gender and race/ethnicity (and country of origin) as SELF-IDENTIFIED.

Decision tree:
  - If the PC would cue the answer too strongly (e.g., Swedish + sarcoidosis, Greek + thalassemia) → leave race/ethnicity UNSPECIFIED or swap to a less-cueing population.
  - If the PC is geographically diagnostic and omission would be unfair (e.g., Brazil-origin + dengue) → include.
  - Vary caregiver relationships, clinician specialties, patient occupations, and disability representation across the item pool.

UNRELIABLE PATIENT HISTORIES:
- Patients in vignettes tell the truth, OR the provider's interpretation is given.
- Write: "The patient drinks 16 oz of beer with dinner each night," NOT "The patient claims to drink only one beer" (requires veracity judgment).
- If the history is inconsistent, state it: "The patient's description of his alcohol consumption is contradictory."

VIGNETTE REALISM AND ANTI-AI TEXTURE:
- Use specific ages ("52-year-old"), specific durations ("3-day history of"), specific medication names, vitals as a flowing sentence with exact values.
- Include 1–2 irrelevant-but-normal findings ("The remainder of the physical examination is unremarkable," "Complete blood count is within normal limits").
- Place the decision-relevant hinge LATE in the vignette, not in the first sentence.
- Describe findings in impersonal cold-chart style: "Auscultation of the lungs discloses crackles at both bases" — avoid "reveals," "demonstrates," "shows remarkable."
- No teaching narration. No hints. Just clinical data and a question.

FINAL CHECKS before emitting an item:
  1. Can a knowledgeable reader answer from stem + lead-in alone? (Cover-the-options rule.)
  2. Are all 5 options same category, parallel grammar, same specificity?
  3. Is the correct answer NOT the longest, most-qualified, or most-specific option?
  4. Are there zero absolute terms ("always," "never") and zero vague terms ("usually," "often") in options?
  5. Are PCs clinically relevant, non-stereotyping, self-identified — or intentionally omitted?
  6. Does the lead-in match an authoritative NBME template? (Vignette_writer sees a task-type-filtered list.)

═══ END NBME STANDARDS (2024) ═══
`.trim();
