/**
 * Seed Batch 1: 10 hand-crafted questions with full adaptive metadata.
 * Run with: npx tsx scripts/seed-batch1.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── New confusion sets needed ───
const NEW_CONFUSION_SETS = [
  {
    name: 'stemi_cardiogenic_shock_management',
    conditions: ['STEMI with stable hemodynamics', 'STEMI with cardiogenic shock'],
    discriminating_clues: [
      { condition: 'Stable STEMI', clue: 'Normal BP, standard door-to-balloon PCI pathway', clue_type: 'vital_sign_pattern' },
      { condition: 'Cardiogenic shock STEMI', clue: 'Hypotension + tachycardia, emergent PCI without delay for supportive measures', clue_type: 'vital_sign_pattern' },
    ],
    common_traps: ['Giving nitroglycerin to hypotensive patient', 'Giving beta-blockers in cardiogenic shock', 'Delaying cath lab for echo'],
  },
  {
    name: 'pregnancy_safe_vs_contraindicated_meds',
    conditions: ['Pregnancy-safe antibiotics', 'Contraindicated antibiotics in pregnancy'],
    discriminating_clues: [
      { condition: 'Safe', clue: 'Cephalosporins, penicillins, azithromycin — safe across trimesters', clue_type: 'drug_safety' },
      { condition: 'Contraindicated', clue: 'Fluoroquinolones (cartilage), tetracyclines (teeth/bone), TMP-SMX (folate/kernicterus)', clue_type: 'drug_safety' },
    ],
    common_traps: ['Pattern-matching UTI + pregnant = nitrofurantoin without distinguishing upper vs lower tract'],
  },
  {
    name: 'testicular_torsion_vs_epididymitis',
    conditions: ['Testicular torsion', 'Epididymitis', 'Inguinal hernia'],
    discriminating_clues: [
      { condition: 'Torsion', clue: 'Absent cremasteric reflex, high-riding testis, horizontal lie, acute onset', clue_type: 'physical_exam_sign' },
      { condition: 'Epididymitis', clue: 'Positive Prehn sign (pain relief with elevation), gradual onset, dysuria', clue_type: 'physical_exam_sign' },
      { condition: 'Inguinal hernia', clue: 'Reducible mass, cough impulse, bowel sounds in scrotum', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Ordering ultrasound when clinical presentation is classic torsion — delays surgery'],
  },
  {
    name: 'kawasaki_vs_scarlet_fever_vs_viral',
    conditions: ['Kawasaki disease', 'Scarlet fever', 'Viral exanthem'],
    discriminating_clues: [
      { condition: 'Kawasaki', clue: 'Fever ≥5 days + ≥4 of: non-exudative conjunctivitis, mucous membrane changes, extremity changes, rash, lymphadenopathy', clue_type: 'clinical_criteria' },
      { condition: 'Scarlet fever', clue: 'Sandpaper rash, strawberry tongue, positive rapid strep, responds to antibiotics', clue_type: 'lab_pattern' },
      { condition: 'Viral exanthem', clue: 'Self-limited, URI symptoms, resolves in days', clue_type: 'temporal_progression' },
    ],
    common_traps: ['Missing Kawasaki when not all 5 criteria present (incomplete Kawasaki)', 'Treating as bacterial when cultures are negative'],
  },
  {
    name: 'hepatitis_a_vs_b_vs_c_outcomes',
    conditions: ['Hepatitis A', 'Hepatitis B', 'Hepatitis C'],
    discriminating_clues: [
      { condition: 'Hepatitis A', clue: 'Self-limited, no chronic state, fecal-oral, anti-HAV IgM positive', clue_type: 'natural_history' },
      { condition: 'Hepatitis B', clue: '5-10% chronicity in adults, HBsAg positive, risk of HCC with chronic infection', clue_type: 'natural_history' },
      { condition: 'Hepatitis C', clue: '75-85% chronicity, anti-HCV positive, RNA confirms active infection', clue_type: 'natural_history' },
    ],
    common_traps: ['Assuming all hepatitis can become chronic', 'Confusing acute serology (IgM) with chronic markers'],
  },
  {
    name: 'primary_vs_secondary_hyperparathyroidism',
    conditions: ['Primary hyperparathyroidism', 'Secondary hyperparathyroidism', 'Vitamin D deficiency'],
    discriminating_clues: [
      { condition: 'Primary', clue: 'High calcium + high PTH = autonomous parathyroid adenoma', clue_type: 'lab_pattern' },
      { condition: 'Secondary', clue: 'Low calcium + high PTH = compensatory response to hypocalcemia (vitamin D deficiency, CKD)', clue_type: 'lab_pattern' },
      { condition: 'Vitamin D deficiency', clue: 'Low 25-OH D + low calcium + low phosphorus + high ALP = osteomalacia', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Confusing elevated PTH as the disease vs the compensation', 'Not checking vitamin D levels when PTH is high'],
  },
];

// ─── New transfer rules ───
const NEW_TRANSFER_RULES = [
  { rule_text: 'In acute coronary syndromes, tachycardia with hypotension mandates intervention-first, not diagnosis-first', category: 'management_priority', topic: 'Acute Coronary Syndrome' },
  { rule_text: 'When BNP and chest imaging suggest two diagnoses, the physical exam pattern breaks the tie', category: 'diagnostic_disambiguation', topic: 'COPD' },
  { rule_text: 'In pregnant patients, fluoroquinolones and tetracyclines are contraindicated regardless of clinical indication — always choose a pregnancy-safe alternative', category: 'drug_safety', topic: 'Pyelonephritis' },
  { rule_text: 'Acute scrotal pain with absent cremasteric reflex in a young male is torsion until proven otherwise — surgical exploration should not be delayed for imaging', category: 'time_critical', topic: 'Testicular Torsion' },
  { rule_text: 'For patients with advanced illness and declining status, clarifying goals of care takes precedence over escalating interventions', category: 'management_priority', topic: 'Palliative Care' },
  { rule_text: 'Prolonged fever in a child with mucous membrane changes, extremity changes, and elevated inflammatory markers — think Kawasaki even without all classic criteria', category: 'pattern_recognition', topic: 'Kawasaki Disease' },
  { rule_text: 'When BUN/Cr ratio and FENa disagree, FENa is the more reliable discriminator for classifying AKI', category: 'diagnostic_disambiguation', topic: 'Acute Kidney Injury' },
  { rule_text: 'Hepatitis A is self-limited and does not cause chronic infection — the expected outcome in immunocompetent adults is complete resolution', category: 'natural_history', topic: 'Hepatitis' },
  { rule_text: 'Trace the calcium-PTH axis from the PRIMARY deficiency — the elevated lab value is the body COMPENSATION, not the disease', category: 'pathophysiology_chain', topic: 'Hyperparathyroidism' },
  { rule_text: 'In a child with acute urticaria, angioedema, and wheezing following first exposure to a new food, treat as anaphylaxis first, then confirm the trigger with specific IgE testing', category: 'management_priority', topic: 'Anaphylaxis' },
];

// ─── Questions ───
interface QuestionSeed {
  vignette: string;
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: string;
  error_map: Record<string, string>;
  transfer_rule_text: string;
  explanation_decision: string;
  explanation_options: string;
  explanation_summary: string;
  system_topic: string;
  error_bucket: string;
  difficulty: string;
  confusion_set_name: string;
  transfer_rule_match: string; // substring to match
}

const QUESTIONS: QuestionSeed[] = [
  // Q1: STEMI with cardiogenic shock
  {
    system_topic: 'cardio',
    difficulty: 'hard',
    error_bucket: 'severity_miss',
    confusion_set_name: 'stemi_cardiogenic_shock_management',
    transfer_rule_match: 'tachycardia with hypotension',
    vignette: 'A 54-year-old man with hypertension and a 40-pack-year smoking history presents to the emergency department with crushing substernal chest pressure radiating to his jaw for the past 45 minutes. He is diaphoretic and anxious. His temperature is 36.8°C, pulse is 112/min, respirations are 22/min, and blood pressure is 82/58 mmHg. ECG shows 3mm ST elevations in V1-V4. Troponin I is 12.4 ng/mL (normal <0.04). He is given aspirin 325mg. IV access is established.',
    stem: 'Which of the following is the most appropriate next step in management?',
    option_a: 'Administer IV heparin and start a nitroglycerin drip',
    option_b: 'Obtain urgent cardiology consultation for cardiac catheterization',
    option_c: 'Administer metoprolol 5mg IV',
    option_d: 'Order an echocardiogram to assess wall motion abnormalities',
    option_e: 'Start dobutamine infusion for hemodynamic support',
    correct_answer: 'B',
    error_map: { A: 'severity_miss', C: 'severity_miss', D: 'premature_closure', E: 'next_step_error' },
    transfer_rule_text: 'In acute coronary syndromes, tachycardia with hypotension mandates intervention-first, not diagnosis-first.',
    explanation_decision: 'This patient has an anterior STEMI with cardiogenic shock (hypotension + tachycardia). The definitive treatment is emergent reperfusion via PCI. Vasopressors and supportive care are adjunctive — they do not replace the need for immediate catheterization.',
    explanation_options: 'The decision hinge is the combination of ST elevations in V1-V4 (anterior wall) with BP 82/58 and HR 112 — this is cardiogenic shock until proven otherwise. The ECG establishes the diagnosis; no further imaging is needed before acting. Nitroglycerin (A) and metoprolol (C) are both contraindicated in hypotension. An echo (D) confirms what the ECG already shows. Dobutamine (E) treats the symptom, not the cause.',
    explanation_summary: 'Cardiogenic shock complicates approximately 5-8% of STEMIs and carries mortality rates of 40-50% without intervention. The SHOCK trial demonstrated that early revascularization reduces 6-month mortality compared to initial medical stabilization. Door-to-balloon time remains critical — each 30-minute delay increases mortality.',
  },
  // Q2: COPD vs CHF exacerbation
  {
    system_topic: 'pulm',
    difficulty: 'hard',
    error_bucket: 'confusion_set_miss',
    confusion_set_name: 'copd_exacerbation_vs_chf',
    transfer_rule_match: 'BNP and chest imaging',
    vignette: 'A 72-year-old man with a history of COPD (on tiotropium and albuterol) and heart failure with reduced ejection fraction (last EF 35%) presents with 3 days of worsening dyspnea. He reports increased sputum production that has turned yellow-green. He sleeps on two pillows, unchanged from baseline. His temperature is 37.4°C, pulse is 96/min, respirations are 24/min, blood pressure is 148/86 mmHg, and oxygen saturation is 88% on room air. Examination shows diffuse expiratory wheezes bilaterally. There is no jugular venous distension. The lower extremities show trace bilateral edema unchanged from his last visit. BNP is 420 pg/mL (his baseline is 350 pg/mL). Chest x-ray shows hyperinflated lungs without pulmonary edema or infiltrates.',
    stem: 'Which of the following is the most appropriate initial treatment?',
    option_a: 'IV furosemide 40mg',
    option_b: 'Nebulized albuterol and oral prednisone',
    option_c: 'Bilevel positive airway pressure (BiPAP)',
    option_d: 'IV ceftriaxone and azithromycin',
    option_e: 'Increase home tiotropium dose',
    correct_answer: 'B',
    error_map: { A: 'confusion_set_miss', C: 'next_step_error', D: 'premature_closure', E: 'next_step_error' },
    transfer_rule_text: 'When BNP and chest imaging suggest two diagnoses, the physical exam pattern breaks the tie.',
    explanation_decision: 'This patient has both COPD and CHF, making every exacerbation a diagnostic puzzle. The key: his BNP is barely above his own baseline (420 vs 350), there is no JVD, no new edema, no pulmonary edema on CXR, but he HAS purulent sputum and diffuse wheezes. The physical exam pattern points to COPD exacerbation, not decompensated CHF.',
    explanation_options: 'The hinge is buried in three places: (1) the BNP is only 70 above baseline — a true CHF exacerbation typically doubles or triples the BNP, (2) no JVD — the most specific bedside sign of volume overload is absent, (3) CXR shows hyperinflation without edema. Each finding alone is ambiguous; together they clearly point to COPD. The purulent sputum change suggests infection-triggered exacerbation, but without an infiltrate on CXR, empiric antibiotics for pneumonia are premature.',
    explanation_summary: 'Acute exacerbation of COPD is defined by worsening dyspnea, increased sputum volume, and/or increased sputum purulence. GOLD guidelines recommend short-acting bronchodilators as first-line, with systemic corticosteroids (prednisone 40mg x 5 days) for moderate-severe exacerbations. BNP must be interpreted against the patient\'s own baseline in chronic CHF — an absolute value of 420 may be "normal" for a patient with EF 35%.',
  },
  // Q3: Pyelonephritis in pregnancy
  {
    system_topic: 'obgyn',
    difficulty: 'medium',
    error_bucket: 'severity_miss',
    confusion_set_name: 'pregnancy_safe_vs_contraindicated_meds',
    transfer_rule_match: 'fluoroquinolones and tetracyclines',
    vignette: 'A 28-year-old woman at 16 weeks\' gestation presents with a 2-day history of right flank pain, fever, and dysuria. She has no significant medical history and takes only prenatal vitamins. Her temperature is 38.9°C (102°F), pulse is 104/min, respirations are 18/min, and blood pressure is 118/72 mmHg. There is costovertebral angle tenderness on the right. Urinalysis shows pyuria and bacteriuria. Urine culture is pending.',
    stem: 'Which of the following is the most appropriate pharmacotherapy?',
    option_a: 'Ciprofloxacin 500mg orally twice daily',
    option_b: 'Trimethoprim-sulfamethoxazole twice daily',
    option_c: 'Ceftriaxone 1g IV daily',
    option_d: 'Doxycycline 100mg orally twice daily',
    option_e: 'Nitrofurantoin 100mg orally twice daily',
    correct_answer: 'C',
    error_map: { A: 'severity_miss', B: 'severity_miss', D: 'severity_miss', E: 'severity_miss' },
    transfer_rule_text: 'In pregnant patients, fluoroquinolones and tetracyclines are contraindicated regardless of clinical indication — always choose a pregnancy-safe alternative.',
    explanation_decision: 'This is pyelonephritis in pregnancy — a condition that requires IV antibiotics AND pregnancy-safe drug selection. Two constraints must be satisfied simultaneously. Nitrofurantoin treats the wrong site (bladder, not kidney). Fluoroquinolones and tetracyclines are categorically contraindicated in pregnancy.',
    explanation_options: 'The decision hinge is on the surface: fever + flank pain + CVA tenderness = pyelonephritis (not simple cystitis), and 16 weeks\' gestation = pregnancy drug constraints apply. The common error is choosing nitrofurantoin (E) — it is the right drug for lower UTI in pregnancy, so students pattern-match "UTI + pregnant = nitrofurantoin" without distinguishing upper from lower tract infection.',
    explanation_summary: 'Pyelonephritis complicates 1-2% of pregnancies and is the most common non-obstetric cause of hospitalization in pregnancy. It can trigger preterm labor, sepsis, and ARDS. ACOG recommends hospitalization with IV antibiotics — cephalosporins (ceftriaxone, cefazolin) or ampicillin/gentamicin are first-line. Fluoroquinolones are contraindicated due to cartilage toxicity. Nitrofurantoin achieves high urinary but low tissue concentrations, making it effective for cystitis but not pyelonephritis.',
  },
  // Q4: Testicular torsion
  {
    system_topic: 'surgery',
    difficulty: 'medium',
    error_bucket: 'next_step_error',
    confusion_set_name: 'testicular_torsion_vs_epididymitis',
    transfer_rule_match: 'absent cremasteric reflex',
    vignette: 'A 16-year-old boy is brought to the emergency department because of sudden onset of severe left scrotal pain that began 3 hours ago while playing basketball. He has had one episode of vomiting. He has no history of trauma, sexually transmitted infections, or prior episodes. His temperature is 37.0°C, pulse is 92/min, respirations are 16/min, and blood pressure is 128/78 mmHg. The left testis is swollen, tender, and positioned higher than the right with a horizontal lie. The cremasteric reflex is absent on the left. Prehn sign is negative.',
    stem: 'Which of the following is the most appropriate next step in management?',
    option_a: 'Color Doppler ultrasonography of the scrotum',
    option_b: 'Urine nucleic acid amplification testing',
    option_c: 'Manual detorsion followed by observation',
    option_d: 'Surgical exploration and orchiopexy',
    option_e: 'IV ceftriaxone and doxycycline',
    correct_answer: 'D',
    error_map: { A: 'next_step_error', B: 'premature_closure', C: 'next_step_error', E: 'confusion_set_miss' },
    transfer_rule_text: 'Acute scrotal pain with absent cremasteric reflex in a young male is torsion until proven otherwise — surgical exploration should not be delayed for imaging.',
    explanation_decision: 'High-riding testis + horizontal lie + absent cremasteric reflex + acute onset = testicular torsion. At 3 hours, the testis is still salvageable (>90% salvage rate within 6 hours). Every hour of delay reduces viability. Imaging is not needed when the clinical picture is this clear — go straight to the OR.',
    explanation_options: 'The hinge is on the surface — the triad of absent cremasteric reflex, high-riding testis, and horizontal lie is essentially pathognomonic for torsion. The most tempting wrong answer is Choice A (ultrasound) — it feels responsible to "confirm" before surgery, but the 6-hour window makes this a time-versus-certainty trade-off where time wins.',
    explanation_summary: 'Testicular torsion results from rotation of the spermatic cord, occluding venous then arterial flow. Salvage rates are >90% within 6 hours, 50% at 12 hours, and approach 0% beyond 24 hours. Surgical exploration involves detorsion and bilateral orchiopexy (fixation of both testes to prevent future torsion on either side). Doppler ultrasound has sensitivity of ~90% but is not 100% — a normal ultrasound does not exclude torsion.',
  },
  // Q5: Goals of care
  {
    system_topic: 'ethics',
    difficulty: 'medium',
    error_bucket: 'next_step_error',
    confusion_set_name: 'stemi_cardiogenic_shock_management', // reuse — ethics doesn't have a confusion set; we'll create a separate one
    transfer_rule_match: 'clarifying goals of care',
    vignette: 'A 78-year-old man with metastatic pancreatic cancer (diagnosed 8 months ago, now progressed through two lines of chemotherapy) is admitted with a small-bowel obstruction. CT shows carcinomatosis with multiple points of obstruction. The surgical team considers the obstruction inoperable. He is currently receiving IV fluids and a nasogastric tube for decompression. He is alert, oriented, and in moderate discomfort controlled with IV morphine. His wife and two adult children are present. He has not previously documented his care preferences.',
    stem: 'Which of the following is the most appropriate next step in management?',
    option_a: 'Recommend transfer to hospice care',
    option_b: 'Place a venting gastrostomy tube for long-term decompression',
    option_c: 'Facilitate a family meeting to discuss goals of care',
    option_d: 'Consult interventional radiology for percutaneous stent placement',
    option_e: 'Begin total parenteral nutrition',
    correct_answer: 'C',
    error_map: { A: 'next_step_error', B: 'next_step_error', D: 'severity_miss', E: 'premature_closure' },
    transfer_rule_text: 'For patients with advanced illness and declining status, clarifying goals of care takes precedence over escalating interventions.',
    explanation_decision: 'The patient is alert, his family is present, and he has never stated his care preferences. Before ANY procedural or disposition decision, the medical team must understand what HE wants. A family meeting to discuss goals of care is always the next step when preferences are unknown and the clinical situation has changed significantly.',
    explanation_options: 'The hinge is that he has not previously documented his care preferences. Every other option assumes a specific goal — hospice assumes comfort-only, TPN assumes life-prolongation, stenting assumes intervention. Only Choice C asks before acting.',
    explanation_summary: 'Malignant bowel obstruction occurs in 20-50% of patients with advanced ovarian or GI malignancies. When surgery is not feasible, options include NGT decompression, venting gastrostomy, octreotide for secretion reduction, and corticosteroids. In the absence of documented advance directives, a structured goals-of-care discussion should explore the patient\'s understanding of their illness, their values, and their preferences for intervention versus comfort.',
  },
  // Q6: Kawasaki disease
  {
    system_topic: 'pediatrics',
    difficulty: 'medium',
    error_bucket: 'severity_miss',
    confusion_set_name: 'kawasaki_vs_scarlet_fever_vs_viral',
    transfer_rule_match: 'Prolonged fever in a child',
    vignette: 'A 3-year-old boy is brought to the emergency department because of 6 days of fever to 39.5°C (103.1°F) that has not responded to ibuprofen. Three days ago he developed bilateral conjunctival injection without discharge. Two days ago his lips became cracked and erythematous. Today his mother noticed swelling of his hands and feet. He has no cough, rhinorrhea, or diarrhea. His temperature is 39.8°C, pulse is 130/min, respirations are 28/min, and blood pressure is 90/60 mmHg. Examination shows bilateral non-exudative conjunctival injection, fissured erythematous lips, edematous hands and feet with erythema of the palms, and a diffuse maculopapular rash on the trunk. There is no cervical lymphadenopathy. Laboratory studies show WBC 18,000/mm³, platelet count 480,000/mm³, ESR 68 mm/h, CRP 9.2 mg/dL, and albumin 2.8 g/dL.',
    stem: 'Which of the following is the most appropriate treatment?',
    option_a: 'Oral amoxicillin for 10 days',
    option_b: 'IV immunoglobulin and high-dose aspirin',
    option_c: 'Oral prednisolone for 5 days',
    option_d: 'Supportive care with antipyretics',
    option_e: 'IV ceftriaxone',
    correct_answer: 'B',
    error_map: { A: 'confusion_set_miss', C: 'next_step_error', D: 'severity_miss', E: 'confusion_set_miss' },
    transfer_rule_text: 'Prolonged fever in a child with mucous membrane changes, extremity changes, and elevated inflammatory markers — think Kawasaki even without all classic criteria.',
    explanation_decision: 'Six days of fever + bilateral conjunctivitis + oral mucous membrane changes + extremity changes + rash = 4 of 5 classic Kawasaki criteria (missing: cervical lymphadenopathy). This meets diagnostic criteria. Untreated, 25% develop coronary artery aneurysms. IVIG within 10 days of fever onset reduces this to <5%.',
    explanation_options: 'The hinge is the combination of prolonged fever duration (6 days, meeting the ≥5 day requirement) with the specific pattern: non-exudative conjunctivitis (not viral — which would be exudative), mucous membrane changes, and extremity edema. The thrombocytosis and hypoalbuminemia are supportive lab findings.',
    explanation_summary: 'Kawasaki disease is an acute systemic vasculitis of unknown etiology, primarily affecting children under 5 years. Diagnosis requires fever ≥5 days plus ≥4 of 5 criteria: bilateral conjunctival injection (non-exudative), oral mucous membrane changes, extremity changes, polymorphous rash, and cervical lymphadenopathy. Treatment is IVIG 2g/kg plus high-dose aspirin (80-100 mg/kg/day) until afebrile, then low-dose aspirin for 6-8 weeks.',
  },
  // Q7: AKI — FENa vs BUN/Cr
  {
    system_topic: 'renal',
    difficulty: 'hard',
    error_bucket: 'test_interpretation_miss',
    confusion_set_name: 'prerenal_vs_intrinsic_aki',
    transfer_rule_match: 'BUN/Cr ratio and FENa disagree',
    vignette: 'A 65-year-old man with congestive heart failure and type 2 diabetes is admitted for elective knee replacement. On postoperative day 2, his urine output has decreased to 15 mL/hour. He received ketorolac for pain control. His temperature is 37.2°C, pulse is 88/min, respirations are 16/min, and blood pressure is 132/78 mmHg. He appears comfortable. Laboratory studies show: Serum creatinine 2.4 mg/dL (preoperative 1.1 mg/dL), BUN 42 mg/dL, BUN/Cr ratio 17.5, Urine sodium 38 mEq/L, Fractional excretion of sodium (FENa) 2.8%, Urinalysis shows trace protein and no casts.',
    stem: 'Which of the following is the most likely cause of this patient\'s acute kidney injury?',
    option_a: 'Prerenal azotemia from inadequate fluid resuscitation',
    option_b: 'NSAID-induced acute tubular necrosis',
    option_c: 'Bilateral ureteral obstruction',
    option_d: 'Acute interstitial nephritis from perioperative antibiotics',
    option_e: 'Contrast-induced nephropathy',
    correct_answer: 'B',
    error_map: { A: 'test_interpretation_miss', C: 'premature_closure', D: 'premature_closure', E: 'premature_closure' },
    transfer_rule_text: 'When BUN/Cr ratio and FENa disagree, FENa is the more reliable discriminator for classifying AKI.',
    explanation_decision: 'The BUN/Cr ratio of 17.5 is borderline and could suggest prerenal — but the FENa of 2.8% definitively rules it out. When these two tests disagree, FENa wins. The ketorolac use in a patient with CHF and diabetes (two renal risk factors) is the cause.',
    explanation_options: 'The deep hinge: the BUN/Cr ratio (17.5) is a misleading middle value. Classic prerenal is >20; classic intrinsic is <15. At 17.5, students must look at FENa to break the tie. FENa <1% = prerenal; FENa >2% = intrinsic. At 2.8%, this is clearly intrinsic. The postoperative context tempts toward prerenal (dehydration) or postrenal (catheter), but ketorolac + CHF + diabetes is the explanation.',
    explanation_summary: 'NSAIDs inhibit cyclooxygenase, reducing prostaglandin synthesis that normally maintains afferent arteriolar vasodilation. Patients with reduced effective circulating volume (CHF, cirrhosis, CKD) are prostaglandin-dependent for maintaining GFR. FENa calculation: (Urine Na × Plasma Cr) / (Plasma Na × Urine Cr) × 100. FENa <1% suggests prerenal; >2% suggests intrinsic. Limitations: FENa unreliable with diuretics (use FEUrea instead).',
  },
  // Q8: Hepatitis A natural history
  {
    system_topic: 'GI',
    difficulty: 'easy',
    error_bucket: 'confusion_set_miss',
    confusion_set_name: 'hepatitis_a_vs_b_vs_c_outcomes',
    transfer_rule_match: 'Hepatitis A is self-limited',
    vignette: 'A 32-year-old woman presents with a 10-day history of fatigue, nausea, dark urine, and right upper quadrant discomfort. She returned from a 3-week trip to Southeast Asia 4 weeks ago where she ate street food regularly. She takes no medications and has no significant medical history. Her temperature is 37.6°C, pulse is 72/min, respirations are 14/min, and blood pressure is 122/76 mmHg. Examination shows scleral icterus and mild hepatomegaly. Laboratory studies show AST 1,840 U/L, ALT 2,100 U/L, total bilirubin 6.8 mg/dL, alkaline phosphatase 180 U/L, and INR 1.1. Anti-HAV IgM is positive.',
    stem: 'Without treatment, which of the following is the most likely outcome of this patient\'s condition?',
    option_a: 'Chronic active hepatitis',
    option_b: 'Complete resolution of symptoms',
    option_c: 'Fulminant hepatic failure',
    option_d: 'Progression to hepatocellular carcinoma',
    option_e: 'Development of chronic carrier state',
    correct_answer: 'B',
    error_map: { A: 'confusion_set_miss', C: 'severity_miss', D: 'confusion_set_miss', E: 'confusion_set_miss' },
    transfer_rule_text: 'Hepatitis A is self-limited and does not cause chronic infection — the expected outcome in immunocompetent adults is complete resolution.',
    explanation_decision: 'Hepatitis A is always self-limited in immunocompetent patients. It does not cause chronic hepatitis, does not have a carrier state, and does not lead to cirrhosis or hepatocellular carcinoma. Travel to endemic area + acute hepatitis + anti-HAV IgM positive = complete recovery expected.',
    explanation_options: 'The hinge is identifying the specific hepatitis virus and knowing its natural history. The confusion set is critical: Hep A = self-limited; Hep B = 5-10% chronicity in adults; Hep C = 75-85% chronicity. Students who don\'t distinguish between them default to "hepatitis can become chronic" without specifying WHICH hepatitis.',
    explanation_summary: 'Hepatitis A virus is an RNA picornavirus transmitted fecal-orally. Incubation is 15-50 days. Anti-HAV IgM confirms acute infection; anti-HAV IgG indicates prior infection or vaccination. HAV does not have a chronic phase and does not integrate into the host genome. Fulminant hepatic failure occurs in <0.5% of cases. INR 1.1 here shows intact synthetic function.',
  },
  // Q9: Secondary hyperparathyroidism
  {
    system_topic: 'endo',
    difficulty: 'hard',
    error_bucket: 'test_interpretation_miss',
    confusion_set_name: 'primary_vs_secondary_hyperparathyroidism',
    transfer_rule_match: 'calcium-PTH axis',
    vignette: 'An 84-year-old woman who lives in an assisted living facility is brought to the office because of progressive weakness, diffuse bone pain, and two falls in the past month. She has a history of Crohn disease with multiple small bowel resections. She is largely homebound and has limited sun exposure. Her diet consists primarily of soft foods with minimal dairy. Physical examination shows diffuse tenderness to palpation of the ribs and long bones. Skeletal survey shows bilateral pseudofractures of the femoral necks and diffuse osteopenia. Laboratory studies: Serum calcium 7.8 mg/dL (normal 8.5-10.5), Serum phosphorus 2.1 mg/dL (normal 2.5-4.5), 25-hydroxyvitamin D 8 ng/mL (normal 30-100), Alkaline phosphatase 340 U/L (normal 44-147).',
    stem: 'Which of the following serum levels is most likely to be increased in this patient?',
    option_a: 'Calcitonin',
    option_b: 'FGF-23',
    option_c: '1,25-dihydroxyvitamin D',
    option_d: 'Parathyroid hormone',
    option_e: 'Thyroid-stimulating hormone',
    correct_answer: 'D',
    error_map: { A: 'test_interpretation_miss', B: 'test_interpretation_miss', C: 'test_interpretation_miss', E: 'premature_closure' },
    transfer_rule_text: 'Trace the calcium-PTH axis from the PRIMARY deficiency — the elevated lab value is the body\'s COMPENSATION, not the disease.',
    explanation_decision: 'This is a multi-step pathophysiology chain: vitamin D deficiency (malabsorption from Crohn + limited sun + poor diet) → decreased intestinal calcium absorption → hypocalcemia → parathyroid glands sense low calcium → compensatory PTH elevation. The elevated PTH is the COMPENSATION, not the disease.',
    explanation_options: 'Students must trace the entire calcium-PTH axis. Low vitamin D → low calcium → HIGH PTH. The most tempting wrong answer is Choice C — students may reason that the body would produce more active vitamin D to compensate. While PTH does stimulate 1-alpha-hydroxylase, when substrate (25-OH D at 8 ng/mL) is severely depleted, 1,25-OH D remains low.',
    explanation_summary: 'Osteomalacia is the adult form of vitamin D deficiency. Risk factors include malabsorption (Crohn, celiac, gastric bypass), limited sun exposure, and poor dietary intake. Labs: low calcium, low phosphorus, low 25-OH D, elevated ALP, elevated PTH (secondary hyperparathyroidism). Pseudofractures (Looser zones) are pathognomonic. Treatment is oral vitamin D and calcium supplementation.',
  },
  // Q10: Pediatric anaphylaxis — egg allergy
  {
    system_topic: 'pediatrics',
    difficulty: 'medium',
    error_bucket: 'next_step_error',
    confusion_set_name: 'anaphylaxis_vs_angioedema',
    transfer_rule_match: 'urticaria, angioedema, and wheezing following first exposure',
    vignette: 'A 14-month-old girl is brought to the emergency department by her parents 45 minutes after developing facial swelling and a widespread rash. The parents report she was eating scrambled eggs for the first time when she developed perioral erythema, followed by generalized urticaria. Over the next 20 minutes, she developed lip swelling and audible wheezing. She has a history of mild eczema. She was breastfed for 12 months and has been tolerating cow\'s milk-based formula, wheat cereal, and pureed fruits and vegetables without issue. Her temperature is 37.0°C, pulse is 148/min, respirations are 36/min with mild subcostal retractions, blood pressure is 78/52 mmHg (low for age), and oxygen saturation is 93% on room air. After initial stabilization with intramuscular epinephrine:',
    stem: 'Which of the following is the most appropriate test to identify the causative allergen?',
    option_a: 'Serum tryptase level',
    option_b: 'Skin prick testing in the emergency department',
    option_c: 'Serum-specific IgE to egg white',
    option_d: 'Total serum IgE level',
    option_e: 'Complete blood count with differential',
    correct_answer: 'C',
    error_map: { A: 'next_step_error', B: 'severity_miss', D: 'test_interpretation_miss', E: 'premature_closure' },
    transfer_rule_text: 'In a child with acute urticaria, angioedema, and wheezing following first exposure to a new food, treat as anaphylaxis first, then confirm the trigger with specific IgE testing.',
    explanation_decision: 'The temporal relationship is clear: first egg exposure → perioral reaction → generalized urticaria → angioedema + wheezing + hypotension = anaphylaxis triggered by egg. After treating with epinephrine, the next step is identifying the specific trigger with allergen-specific IgE.',
    explanation_options: 'The hinge is buried in the feeding history — she has tolerated cow\'s milk, wheat, and fruits/vegetables, but this was her FIRST exposure to egg. Combined with the immediate-onset reaction pattern, egg is the clear trigger. The most tempting wrong answer is Choice A (tryptase) — students confuse "confirming anaphylaxis occurred" with "identifying what caused it."',
    explanation_summary: 'Egg allergy is one of the most common food allergies in children, affecting approximately 2% of young children. Specific IgE testing (ImmunoCAP) measures circulating IgE antibodies against specific allergens and can be drawn during the acute episode. Results >0.35 kU/L suggest sensitization. Skin prick testing is more sensitive but must be performed when stable and off antihistamines. Many children outgrow egg allergy by age 5.',
  },
];

async function main() {
  console.log('=== Batch 1 Seed: 10 Questions ===\n');

  // Step 1: Create new confusion sets
  console.log('Creating new confusion sets...');
  const csMap = new Map<string, string>();

  // First load existing ones
  const { data: existingCs } = await supabase.from('confusion_sets').select('id, name');
  for (const cs of existingCs ?? []) {
    csMap.set(cs.name, cs.id);
  }
  console.log(`  Loaded ${csMap.size} existing confusion sets`);

  for (const cs of NEW_CONFUSION_SETS) {
    if (csMap.has(cs.name)) {
      console.log(`  Skip (exists): ${cs.name}`);
      continue;
    }
    const { data, error } = await supabase
      .from('confusion_sets')
      .insert({
        name: cs.name,
        conditions: cs.conditions,
        discriminating_clues: cs.discriminating_clues,
        common_traps: cs.common_traps,
      })
      .select('id')
      .single();
    if (error) {
      console.error(`  FAIL: ${cs.name} — ${error.message}`);
    } else {
      csMap.set(cs.name, data.id);
      console.log(`  Created: ${cs.name} → ${data.id}`);
    }
  }

  // Step 2: Create new transfer rules
  console.log('\nCreating new transfer rules...');
  const trMap = new Map<string, string>();

  const { data: existingTr } = await supabase.from('transfer_rules').select('id, rule_text');
  for (const tr of existingTr ?? []) {
    trMap.set(tr.rule_text.toLowerCase().slice(0, 50), tr.id);
  }
  console.log(`  Loaded ${trMap.size} existing transfer rules`);

  for (const tr of NEW_TRANSFER_RULES) {
    const key = tr.rule_text.toLowerCase().slice(0, 50);
    if (trMap.has(key)) {
      console.log(`  Skip (exists): ${tr.rule_text.slice(0, 60)}...`);
      continue;
    }
    const { data, error } = await supabase
      .from('transfer_rules')
      .insert({
        rule_text: tr.rule_text,
        category: tr.category,
        topic: tr.topic,
      })
      .select('id')
      .single();
    if (error) {
      console.error(`  FAIL: ${tr.rule_text.slice(0, 40)} — ${error.message}`);
    } else {
      trMap.set(key, data.id);
      console.log(`  Created: ${tr.rule_text.slice(0, 60)}... → ${data.id}`);
    }
  }

  // Step 3: Insert questions
  console.log('\nInserting questions...');
  let inserted = 0;

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];

    // Resolve confusion_set_id
    const confusionSetId = csMap.get(q.confusion_set_name) ?? null;

    // Resolve transfer_rule_id by matching substring
    let transferRuleId: string | null = null;
    for (const [key, id] of trMap.entries()) {
      if (key.includes(q.transfer_rule_match.toLowerCase().slice(0, 30))) {
        transferRuleId = id;
        break;
      }
    }

    const { error } = await supabase.from('questions').insert({
      vignette: q.vignette,
      stem: q.stem,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      correct_answer: q.correct_answer,
      error_map: q.error_map,
      transfer_rule_text: q.transfer_rule_text,
      transfer_rule_id: transferRuleId,
      explanation_decision: q.explanation_decision,
      explanation_options: q.explanation_options,
      explanation_summary: q.explanation_summary,
      system_topic: q.system_topic,
      error_bucket: q.error_bucket,
      difficulty: q.difficulty,
      confusion_set_id: confusionSetId,
    });

    if (error) {
      console.error(`  Q${i + 1} FAIL: ${error.message}`);
    } else {
      inserted++;
      console.log(`  Q${i + 1} OK: [${q.system_topic}] ${q.stem.slice(0, 50)}... cs=${confusionSetId ? 'yes' : 'NO'} tr=${transferRuleId ? 'yes' : 'NO'}`);
    }
  }

  console.log(`\n=== Done: ${inserted}/${QUESTIONS.length} questions inserted ===`);

  // Step 4: Verify
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .not('confusion_set_id', 'is', null);
  console.log(`Total questions with confusion_set_id: ${count}`);
}

main().catch(console.error);
