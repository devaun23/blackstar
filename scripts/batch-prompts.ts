export const SYSTEM_PROMPT = `You are an expert NBME item writer creating Internal Medicine shelf exam questions for Blackstar, an adaptive learning system. Every question you write must satisfy ALL of these requirements:

### CORE RULES
1. Test APPLICATION of knowledge, never recall of an isolated fact
2. The question must require integrating multiple data points — a student who anchors to any single detail should be led to a WRONG answer
3. The correct answer must be the single best answer, defensible by current clinical guidelines
4. All 5 options must be the SAME TYPE (all management steps, all diagnoses, all next investigations)
5. The decision hinge (the single piece of information that determines the correct answer) must be embedded in the vignette, not the stem
6. Naming the diagnosis must NOT give away the answer — the question must still require a management/priority/timing decision

### VIGNETTE RULES
- 80-150 words
- Follow NBME sequence: demographics → chief complaint → history → physical exam → labs/imaging
- Severity communicated through NUMBERS (vitals, labs), never adjectives ("acutely ill")
- No buzzword presentations unless the question tests something beyond recognition
- Every sentence must serve a purpose: supports correct path, supports a distractor path, or establishes setting

### OPTION RULES
- 5 options (A through E), all same type, similar length
- Each wrong option maps to a SPECIFIC reasoning error from this taxonomy:
  - severity_miss: student ignored instability/urgency
  - next_step_error: right diagnosis, wrong management step or sequence
  - premature_closure: anchored too early, ignored contradicting data
  - confusion_set_miss: confused two similar conditions
  - test_interpretation_miss: misread labs/imaging/data

### REQUIRED OUTPUT FORMAT
Respond with a JSON array. For each question, use this exact structure:

{
  "vignette": "...",
  "stem": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "option_e": "...",
  "correct_answer": "A",
  "error_map": {
    "B": "severity_miss",
    "C": "next_step_error",
    "D": "premature_closure",
    "E": "confusion_set_miss"
  },
  "transfer_rule_text": "One portable sentence — a triggerable heuristic that applies across many similar cases.",
  "explanation_decision": "60-100 words. State the transfer rule first. Then explain WHY the correct answer is correct, focused on the decision logic, not the disease facts. If this were a wrong answer, name the specific error type.",
  "explanation_options": "Per-option breakdown. For each wrong option: what it is, why it's wrong, and what reasoning error would lead to choosing it.",
  "explanation_summary": "3-4 sentences. Learning objective + how the NBME frames this type of question + what to watch for in similar questions.",
  "system_topic": "cardio|pulm|GI|renal|endo|neuro|heme|ID|rheum",
  "error_bucket": "severity_miss|next_step_error|premature_closure|confusion_set_miss|test_interpretation_miss",
  "confusion_set_name": "Name of confusion set if applicable, or null",
  "difficulty": "easy|medium|hard"
}`;

export const BATCH_PROMPTS: Record<number, string> = {
  1: `Generate 5 Internal Medicine shelf questions where the PRIMARY error being tested is SEVERITY MISS — the student must recognize hemodynamic instability, critical vital signs, or urgent red flags that change management priority.

Requirements for this batch:
- At least 2 different organ systems
- At least 1 question where the patient looks stable but has a subtle instability clue (e.g., low urine output, widened pulse pressure, lactate elevation)
- At least 1 question where multiple interventions are correct but the question tests which one is FIRST given instability
- Transfer rules must be about recognizing and acting on instability, not about the specific disease

Target confusion sets to incorporate: chest pain (ACS vs PE vs dissection), GI bleed (upper vs variceal), acute dyspnea (CHF vs PE)

Output a JSON array of 5 question objects.`,

  2: `Generate 5 Internal Medicine shelf questions where the PRIMARY error being tested is NEXT STEP ERROR — the student can identify the diagnosis but must choose the correct management step, timing, or sequence.

Requirements:
- At least 1 question where the "textbook treatment" is correct but the question tests something that must happen BEFORE it
- At least 1 question where the diagnosis is obvious and the question purely tests management priority
- Transfer rules must be about management sequences, not disease identification

Target topics: stroke management sequence, sepsis bundle timing, ACS management steps, DKA management

Output a JSON array of 5 question objects.`,

  3: `Generate 5 Internal Medicine shelf questions where the PRIMARY error being tested is PREMATURE CLOSURE — the most obvious diagnosis or detail is NOT the answer, and the student must look deeper.

Requirements:
- Each vignette must contain a prominent detail that LOOKS like it points to one diagnosis, but a less obvious detail redirects to the correct answer
- The "obvious" wrong answer must be a real distractor that a well-prepared student might pick if they stop reading too early
- Transfer rules must be about resisting anchoring and keeping the differential open

Target examples: chest pain that looks like GERD but is ACS, confusion that looks like dementia but is metabolic, abdominal pain with obvious finding but a subtle second diagnosis

Output a JSON array of 5 question objects.`,

  4: `Generate 8 Internal Medicine shelf questions where the PRIMARY error being tested is CONFUSION SET MISS — the student must discriminate between similar conditions within a confusable neighborhood.

Requirements:
- Cover at least 4 different confusion sets from this list:
  - Prerenal vs ATN vs nephritic vs nephrotic
  - SIADH vs psychogenic polydipsia vs diabetes insipidus
  - DKA vs HHS
  - ACS vs GERD vs PE vs aortic dissection
  - Cirrhosis complications: SBP vs hepatic encephalopathy vs hepatorenal
  - Cellulitis vs DVT vs necrotizing fasciitis
  - Iron deficiency vs thalassemia trait vs anemia of chronic disease
  - Bacterial vs viral vs HSV meningitis
- At least 2 questions per confusion set
- The discriminating clue must be present in the vignette but not obvious
- Wrong answers must be other members of the same confusion set

Output a JSON array of 8 question objects.`,

  5: `Generate 3 Internal Medicine shelf questions where the PRIMARY error being tested is TEST INTERPRETATION MISS — the student must correctly interpret lab values, imaging findings, or diagnostic data to reach the right answer.

Requirements:
- At least 1 ABG interpretation question
- At least 1 question involving renal indices (FENa, BUN:Cr ratio)
- Transfer rules about how to systematically interpret the specific data type
- The interpretation must lead to a clinical decision, not just identification of the abnormality

Output a JSON array of 3 question objects.`,

  6: `Review the distribution targets below and generate 4 questions to fill gaps:
- System coverage: ensure cardio, pulm, GI, renal, endo, neuro, heme, ID are all represented
- Difficulty distribution target: roughly 8 easy, 15 medium, 7 hard across all 30
- Error bucket targets: 8 severity_miss, 8 next_step_error, 5 premature_closure, 6 confusion_set_miss, 3 test_interpretation_miss

Generate 4 questions that balance any underrepresented systems, difficulties, or error types. Choose whichever error_bucket values best fill the gaps.

Output a JSON array of 4 question objects.`,
};

export const EXPECTED_COUNTS: Record<number, number> = {
  1: 5,
  2: 5,
  3: 5,
  4: 8,
  5: 3,
  6: 4,
};
