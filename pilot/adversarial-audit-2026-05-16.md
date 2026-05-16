# Adversarial-student audit — 2026-05-16

Items audited: **15**  ·  Pass: **5**  ·  Fail: **10**  ·  Mean score: **5.67/10**
Total tokens: 24,286.

## Per-item results

| # | Topic | System | Verdict | Score | Eliminable | Cues flagged |
|---|-------|--------|---------|-------|------------|--------------|
| 1 | Sepsis | Infectious Disease | FAIL | 5/10 | C,E | specificity, implausibility |
| 2 | TTP | Hematology/Oncology | FAIL | 5/10 | C,E | implausibility, category_mismatch |
| 3 | Diabetic Ketoacidosis | Endocrine | FAIL | 2.5/10 | B,C,E | specificity, absolute_language |
| 4 | Massive PE | Critical Care/Shock | FAIL | 5/10 | B,C | specificity |
| 5 | Hyperosmolar Hyperglycemic State | Endocrine | FAIL | 5/10 | B,E | absolute_language |
| 6 | Diabetic Ketoacidosis | Endocrine | PASS | 7.5/10 | D | specificity, implausibility |
| 7 | Massive PE | Critical Care/Shock | FAIL | 5/10 | B,C | specificity, vocabulary |
| 8 | COPD Exacerbation | Pulmonary | FAIL | 2.5/10 | B,C,E | specificity |
| 9 | Thyroid Storm | Endocrinology | PASS | 7.5/10 | C | category_mismatch |
| 10 | Status Epilepticus | Neurology-within-IM | FAIL | 5/10 | A,E | specificity |
| 11 | Small Bowel Obstruction | Gastroenterology | FAIL | 5/10 | C,E | specificity |
| 12 | Ischemic Stroke | Neurology-within-IM | PASS | 7.5/10 | A | absolute_language |
| 13 | Septic Shock | Critical Care/Shock | PASS | 7.5/10 | D | category_mismatch |
| 14 | Sepsis | Infectious Disease | PASS | 10/10 | — | — |
| 15 | Community-Acquired Pneumonia | Pulmonary | FAIL | 5/10 | B,C | specificity, implausibility |

## Failing items — repair instructions

### Sepsis (0c191e28)
- score **5/10**, eliminable: C, E, weakest: E
- cues: specificity, implausibility

> Rewrite option C to be more comprehensive (add additional management components) and replace option E with a plausible but incorrect vasopressor/fluid management approach to remove the safety-based elimination cue.

### TTP (e0b51862)
- score **5/10**, eliminable: C, E, weakest: C
- cues: implausibility, category_mismatch

> Rewrite options C and E to match the hematologic/thrombotic management category of other options and remove clinical safety red flags. Option C should avoid contraindicated interventions, and option E should focus on blood disorder treatments rather than renal management.

### Diabetic Ketoacidosis (a8763f26)
- score **2.5/10**, eliminable: B, C, E, weakest: B
- cues: specificity, absolute_language

> Rewrite options B, C, and E to remove surface cues. For B: split into single intervention. For C: remove 'immediately'. For E: remove 'first' and absolute sequencing language.

### Massive PE (e5d16ae6)
- score **5/10**, eliminable: B, C, weakest: B
- cues: specificity

> Rewrite options B and C to remove excessive clinical specificity. Consider simpler phrasing like 'Interventional thrombolysis' for B and 'Modified systemic thrombolysis' for C to match the register of other options.

### Hyperosmolar Hyperglycemic State (50cf25bc)
- score **5/10**, eliminable: B, E, weakest: B
- cues: absolute_language

> Rewrite options B and E to remove absolute language. For B, replace 'immediately' with more measured phrasing. For E, remove 'alone initially' and use less absolute terminology.

### Massive PE (cc6b1ab0)
- score **5/10**, eliminable: B, C, weakest: C
- cues: specificity, vocabulary

> Rewrite options B and C to match the concise, standard phrasing of options D and E. Remove excessive procedural details and technical specifications that make them stand out as distractors.

### COPD Exacerbation (b5db2366)
- score **2.5/10**, eliminable: B, C, E, weakest: B
- cues: specificity

> Rewrite options B, C, and E to remove excessive clinical specificity. Option B should list fewer medications or use generic phrasing, option C should remove the specific SpO2 range, and option E should remove the specific FiO2 percentage to match the conciseness of surviving options.

### Status Epilepticus (e078697b)
- score **5/10**, eliminable: A, E, weakest: A
- cues: specificity

> Rewrite options A and E to use standard single-value mg/kg dosing without technical abbreviations or ranges to match the format consistency of other options

### Small Bowel Obstruction (f9a4cb2e)
- score **5/10**, eliminable: C, E, weakest: C
- cues: specificity

> Rewrite options C and E to contain single, simpler interventions without combining multiple treatments. Remove the specificity cue by making them parallel to the single-action structure of other options.

### Community-Acquired Pneumonia (67809a44)
- score **5/10**, eliminable: B, C, weakest: C
- cues: specificity, implausibility

> Rewrite option B to remove the specific timeframe and make it a general observation category. Rewrite option C to be a more plausible but still incorrect disposition that doesn't violate basic safety principles.

## Ship gate

Per plan: ≤4 of 15 failing → ship.
Result: **10** failing → **FAIL** — regenerate distractors before posting.
