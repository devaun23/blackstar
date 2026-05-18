# Jury battle-test audit — 2026-05-18

Jury model: `gpt-5` · Classifier: Claude (default)
Items audited: **15** · PASS: **9** · WRONG-REASON: **2** · WRONG-ANSWER: **4**
Mean score: **6.67/10** · Total tokens: 35,583.

## Per-item verdicts

| # | Topic | System | Keyed | Jury | Verdict | Score | Archetype |
|---|-------|--------|-------|------|---------|-------|-----------|
| 1 | Sepsis | Infectious Disease | (see DB) | A | right-reason | 10/10 | — |
| 2 | TTP | Hematology/Oncology | (see DB) | A | right-reason | 10/10 | — |
| 3 | Diabetic Ketoacidosis | Endocrine | (see DB) | D | wrong-answer | 0/10 | — |
| 4 | Hyperosmolar Hyperglycemic State | Endocrine | (see DB) | A | right-reason | 10/10 | — |
| 5 | Diabetic Ketoacidosis | Endocrine | (see DB) | C | wrong-answer | 0/10 | — |
| 6 | Massive PE | Critical Care/Shock | (see DB) | A | right-reason | 10/10 | — |
| 7 | DKA | Endocrinology | (see DB) | D | wrong-answer | 0/10 | — |
| 8 | COPD Exacerbation | Pulmonary | (see DB) | A | right-reason | 10/10 | — |
| 9 | Thyroid Storm | Endocrinology | (see DB) | D | wrong-answer | 0/10 | — |
| 10 | Status Epilepticus | Neurology-within-IM | (see DB) | C | right-reason | 10/10 | — |
| 11 | Small Bowel Obstruction | Gastroenterology | (see DB) | B | right-reason | 10/10 | — |
| 12 | Ischemic Stroke | Neurology-within-IM | (see DB) | D | wrong-reason | 5/10 | — |
| 13 | Septic Shock | Critical Care/Shock | (see DB) | E | right-reason | 10/10 | — |
| 14 | Sepsis | Infectious Disease | (see DB) | C | wrong-reason | 5/10 | — |
| 15 | Community-Acquired Pneumonia | Pulmonary | (see DB) | A | right-reason | 10/10 | — |

## Failing items — reasoning traces

### Diabetic Ketoacidosis (a8763f26)
- verdict: **wrong-answer**, jury chose **D** (matched archetype: —)
- issues:
  - Jury picked answer D instead of keyed answer A
  - Jury correctly identified DKA management principles but applied incorrect potassium threshold - used 3.1 mEq/L as contraindication to insulin when keyed rule specifies >3.3 mEq/L threshold
  - Jury reasoning shows understanding of fluid resuscitation priority but selected wrong answer choice

**Jury reasoning:**

> This patient has diabetic ketoacidosis (glucose 420 mg/dL, anion gap 29, bicarbonate 8 mEq/L, pH 7.15, ketonuria) with severe volume depletion and hypotension (BP 88/54, dry mucosa, poor turgor, tachycardia, Kussmaul respirations). The immediate priority in DKA is aggressive isotonic fluid resuscitation to restore perfusion and improve renal function. Her potassium is 3.1 mEq/L, so insulin should be withheld initially because it will drive K intracellularly and can precipitate life-threatening hypokalemia. Therefore, begin aggressive fluid resuscitation and monitor response while planning potassium repletion before starting insulin. Options B and C are inappropriate because they include immediate insulin despite hypokalemia. Bicarbonate (E) is not indicated unless pH <6.9, and A alone neglects the urgent need for volume resuscitation in shock.

**Repair:** Review the potassium threshold for insulin initiation in DKA - insulin can be started when K+ >3.3 mEq/L, not when K+ >3.1 mEq/L. Ensure answer choices clearly distinguish between appropriate fluid resuscitation with concurrent insulin (when K+ adequate) versus fluid-only approach (when K+ too low).

### Diabetic Ketoacidosis (b305c552)
- verdict: **wrong-answer**, jury chose **C** (matched archetype: —)
- issues:
  - Jury chose option C instead of the keyed correct answer A
  - Jury acknowledged the potassium correction rule but incorrectly prioritized fluid resuscitation over potassium correction
  - Jury misunderstood the clinical priority - potassium correction must come before insulin regardless of fluid status when K+ <3.3

**Jury reasoning:**

> This patient has DKA with severe dehydration and hypotension (tachycardia, dry mucous membranes, poor turgor, BUN/Cr elevation), so the first priority is aggressive isotonic fluid resuscitation. Deep, labored respirations, pH 7.18, HCO3− 8 mEq/L, and urine ketones confirm DKA. Although the serum potassium is 2.8 mEq/L—meaning insulin must be delayed until K+ is ≥3.3—initial management in DKA is volume repletion to restore perfusion and improve renal function. Therefore, starting with a rapid normal saline bolus is most appropriate, followed by reassessment and potassium repletion before initiating insulin. This makes options B and E unsafe (insulin with K+ <3.3), and bicarbonate (D) is not indicated at this pH. Option A (correct K+ before insulin) is true but is not the initial step; fluids come first.

**Repair:** Clarify in the item stem or answer choices that when potassium is dangerously low (<3.3 mEq/L) in DKA, potassium correction takes absolute priority over fluid resuscitation to prevent life-threatening arrhythmias. The rule is non-negotiable regardless of volume status.

### DKA (4f101aa0)
- verdict: **wrong-answer**, jury chose **D** (matched archetype: —)
- issues:
  - Jury chose answer D instead of keyed correct answer A
  - While jury mentions the potassium rule correctly ('Insulin should be started after initial fluids and only once potassium is known to be ≥3.3 mEq/L'), they prioritized fluid resuscitation over checking potassium levels

**Jury reasoning:**

> This patient has diabetic ketoacidosis (hyperglycemia, anion-gap metabolic acidosis with low bicarbonate, Kussmaul respirations, and positive ketones) precipitated by missed insulin and illness. She is markedly volume depleted and hypotensive (95/60 mm Hg) with tachycardia, dry mucous membranes, poor skin turgor, and elevated BUN/creatinine, so the immediate priority is aggressive isotonic fluid resuscitation with normal saline. Insulin should be started after initial fluids and only once potassium is known to be ≥3.3 mEq/L; her potassium is still pending. Sodium bicarbonate is not indicated unless pH <6.9 (her pH is 7.21). An ECG may be useful if hyperkalemia is suspected, but it is not the first, most lifesaving step here. Therefore, starting IV normal saline at 1000 mL/hr is the most appropriate next step.

**Repair:** The item may need clearer answer choices or clinical scenario adjustments to ensure the keyed rule about checking potassium before insulin takes precedence over fluid management considerations

### Thyroid Storm (ee6f080b)
- verdict: **wrong-answer**, jury chose **D** (matched archetype: —)
- issues:
  - Jury selected answer D instead of the keyed correct answer B

**Jury reasoning:**

> She has thyroid storm (high fever to 40.1°C, severe tachycardia with AFib, CNS agitation/confusion, GI symptoms) precipitated by stopping methimazole. In thyroid storm, PTU is preferred initially because it inhibits peripheral T4→T3 conversion in addition to blocking organification. Iodine should then be given after a delay (at least 1 hour) to block hormone release; giving iodine before a thionamide can worsen hormone synthesis. Beta-blockade and glucocorticoids are also indicated, but the key immediate step with correct sequencing is PTU followed by delayed iodine. Methimazole is not preferred acutely and Lugol’s before a thionamide is contraindicated. Thus, PTU with delayed iodine is the most appropriate next step.

**Repair:** Review the answer choices to ensure the correct option (B) corresponds to the appropriate treatment sequence of PTU followed by delayed iodine that the jury correctly identified in their reasoning

### Ischemic Stroke (d332b9ab)
- verdict: **wrong-reason**, jury chose **D** (matched archetype: —)
- issues:
  - Jury reasoning contradicts the keyed transfer rule by stating BP must be lowered first before alteplase, when the rule specifies 'controllable blood pressure' allows immediate alteplase administration

**Jury reasoning:**

> She has an acute ischemic stroke with sudden-onset focal deficits (right gaze deviation, left facial droop and hemiparesis, dysarthria), CT shows no hemorrhage, and symptom onset was 4 hours ago—within the 4.5-hour window for IV alteplase. Her glucose and platelets are acceptable and there are no listed contraindications. However, her blood pressure is 195/110 mm Hg, which exceeds the threshold for thrombolysis; guidelines require BP <185/110 mm Hg before giving alteplase. Therefore, the next step is to lower BP and then administer IV alteplase. Option A is incorrect because alteplase should not be given above 185/110 mm Hg; Option C should not delay thrombolysis; Option B (DAPT) is for minor stroke/TIA; and Option E (aspirin) is for patients not receiving tPA or after 24 hours post-tPA.

**Repair:** Clarify in the keyed rule whether 'controllable blood pressure' means BP can be managed during/alongside alteplase administration, or revise the clinical scenario to have BP already within acceptable range to avoid confusion about timing of interventions

### Sepsis (7bd2bb64)
- verdict: **wrong-reason**, jury chose **C** (matched archetype: —)
- issues:
  - The jury's reasoning does not invoke the keyed transfer rule about initiating aggressive fluid resuscitation before vasopressor therapy
  - The reasoning assumes adequate fluid resuscitation has already occurred ('after adequate fluid resuscitation') without addressing the specific decision principle being tested
  - The reasoning focuses on vasopressor selection rather than the timing/sequencing rule that fluid resuscitation must come first

**Jury reasoning:**

> She has septic shock: suspected infection (fever, leukocytosis with bands), hypotension (88/52 mm Hg) persisting after 3 L of fluids, and elevated lactate (4.2 mmol/L) with altered mental status. After adequate fluid resuscitation and antibiotics, the next step is a vasopressor to target MAP ≥65 mm Hg. Norepinephrine is the first-line vasopressor in septic shock due to strong alpha-1 with some beta-1 effects and lower risk of arrhythmias. Dopamine is avoided given higher arrhythmia risk, especially with her tachycardia. Phenylephrine (pure alpha) and vasopressin are not first-line; vasopressin is used as an adjunct to reduce norepinephrine requirements. Epinephrine is typically second-line or adjunct and can increase lactate, complicating monitoring.

**Repair:** Modify the scenario or answer choices to clearly test whether the jury recognizes that aggressive fluid resuscitation must be attempted before initiating vasopressors in septic shock, rather than testing vasopressor selection after fluids have already been given

