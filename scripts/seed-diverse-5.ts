/**
 * Seed Diverse 5: Replace all legacy questions with 5 scope-diverse IM questions.
 * Proves the system can reach beyond ACS/PE/HF/Sepsis into the full NBME scope.
 *
 * Topics: Sarcoidosis, Renal Tubular Acidosis, Autoimmune Hepatitis,
 *         Pheochromocytoma, PMR/Giant Cell Arteritis
 *
 * Run with: npx tsx scripts/seed-diverse-5.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── Confusion sets for these topics ───
const CONFUSION_SETS = [
  {
    name: 'bilateral_hilar_lymphadenopathy_differential',
    conditions: ['Sarcoidosis', 'Lymphoma', 'Tuberculosis', 'Fungal infection'],
    discriminating_clues: [
      { condition: 'Sarcoidosis', clue: 'Non-caseating granulomas, elevated ACE, hypercalcemia, erythema nodosum, bilateral hilar LAD on CXR in young Black woman', clue_type: 'clinical_criteria' },
      { condition: 'Lymphoma', clue: 'B symptoms (fever, night sweats, weight loss), asymmetric LAD, Reed-Sternberg cells on biopsy', clue_type: 'histology' },
      { condition: 'Tuberculosis', clue: 'Caseating granulomas, positive PPD/IGRA, upper lobe cavitation, exposure history', clue_type: 'histology' },
      { condition: 'Fungal infection', clue: 'Geographic exposure (Ohio/Mississippi valley = histo, Southwest = cocci), budding yeast on KOH', clue_type: 'exposure_history' },
    ],
    common_traps: ['Treating bilateral hilar LAD as lymphoma without biopsy — sarcoidosis is far more common in the right demographic'],
  },
  {
    name: 'non_anion_gap_metabolic_acidosis',
    conditions: ['Type 1 RTA (distal)', 'Type 2 RTA (proximal)', 'Type 4 RTA (hyperkalemic)', 'Diarrhea'],
    discriminating_clues: [
      { condition: 'Type 1 RTA', clue: 'Urine pH >5.5 despite systemic acidosis, hypokalemia, nephrocalcinosis/stones, cannot acidify urine', clue_type: 'lab_pattern' },
      { condition: 'Type 2 RTA', clue: 'Urine pH <5.5 once serum bicarb falls below threshold, hypokalemia, Fanconi syndrome (glucosuria, phosphaturia, aminoaciduria)', clue_type: 'lab_pattern' },
      { condition: 'Type 4 RTA', clue: 'HYPERkalemia (not hypokalemia), low renin/low aldosterone, seen in diabetic nephropathy, ACEi/ARB use', clue_type: 'lab_pattern' },
      { condition: 'Diarrhea', clue: 'GI losses of bicarb, appropriate urine acidification (pH <5.5), hypokalemia, positive urine anion gap (negative in diarrhea)', clue_type: 'clinical_context' },
    ],
    common_traps: ['Confusing Type 1 and Type 2 RTA — the key is urine pH: Type 1 cannot acidify (pH always >5.5), Type 2 can acidify once below threshold'],
  },
  {
    name: 'autoimmune_hepatitis_vs_other_liver_disease',
    conditions: ['Autoimmune hepatitis', 'Primary biliary cholangitis', 'Primary sclerosing cholangitis', 'Drug-induced liver injury'],
    discriminating_clues: [
      { condition: 'Autoimmune hepatitis', clue: 'Young woman, ANA/anti-smooth muscle antibody positive, elevated IgG, interface hepatitis on biopsy, responds to steroids', clue_type: 'serologic_pattern' },
      { condition: 'Primary biliary cholangitis', clue: 'Middle-aged woman, anti-mitochondrial antibody (AMA) positive, elevated ALP >> AST/ALT, pruritus, xanthomas', clue_type: 'serologic_pattern' },
      { condition: 'Primary sclerosing cholangitis', clue: 'Young male with IBD (usually UC), beading on MRCP, elevated ALP, p-ANCA positive', clue_type: 'imaging' },
      { condition: 'Drug-induced liver injury', clue: 'Temporal relationship with drug initiation, no autoantibodies, resolves with drug withdrawal', clue_type: 'temporal_progression' },
    ],
    common_traps: ['Missing autoimmune hepatitis because patient is on a hepatotoxic drug — check autoantibodies before assuming DILI'],
  },
  {
    name: 'episodic_hypertension_differential',
    conditions: ['Pheochromocytoma', 'Panic disorder', 'Thyroid storm', 'Cocaine/amphetamine use'],
    discriminating_clues: [
      { condition: 'Pheochromocytoma', clue: 'Episodic triad: headache + diaphoresis + palpitations, paroxysmal HTN, elevated 24h urine metanephrines/catecholamines, adrenal mass on CT', clue_type: 'clinical_criteria' },
      { condition: 'Panic disorder', clue: 'Fear/dread, paresthesias, no sustained HTN between episodes, normal catecholamines, responds to anxiolytics', clue_type: 'psych_criteria' },
      { condition: 'Thyroid storm', clue: 'Fever + tachycardia + altered mental status, elevated free T4/T3, suppressed TSH, precipitant (surgery/infection/iodine)', clue_type: 'lab_pattern' },
      { condition: 'Cocaine/amphetamine use', clue: 'Urine tox screen positive, mydriasis, recent drug use timeline correlates with episodes', clue_type: 'exposure_history' },
    ],
    common_traps: ['Diagnosing panic disorder without ruling out pheochromocytoma — the episodic triad (headache + sweating + palpitations) demands biochemical testing'],
  },
  {
    name: 'elderly_bilateral_shoulder_pain',
    conditions: ['PMR', 'Rheumatoid arthritis', 'Bilateral rotator cuff tendinopathy', 'Hypothyroidism-related myalgia'],
    discriminating_clues: [
      { condition: 'PMR', clue: 'Age >50, bilateral shoulder/hip girdle stiffness, dramatically elevated ESR (>40-50), no joint erosions, dramatic response to low-dose prednisone', clue_type: 'clinical_criteria' },
      { condition: 'Rheumatoid arthritis', clue: 'Small joint involvement (MCP/PIP), RF/anti-CCP positive, erosions on X-ray, morning stiffness >1 hour', clue_type: 'joint_pattern' },
      { condition: 'Bilateral rotator cuff tendinopathy', clue: 'Pain with overhead activities, positive impingement signs, normal ESR/CRP, MRI shows tendon pathology', clue_type: 'physical_exam_sign' },
      { condition: 'Hypothyroidism-related myalgia', clue: 'Elevated TSH, diffuse muscle aches (not girdle-specific), delayed relaxation of reflexes, fatigue', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Not checking for GCA in every PMR patient — 15-20% of PMR patients develop GCA, always ask about headache/jaw claudication/visual symptoms'],
  },
];

// ─── Transfer rules ───
const TRANSFER_RULES = [
  { rule_text: 'Bilateral hilar lymphadenopathy in a young patient with erythema nodosum and elevated ACE — think sarcoidosis first, not lymphoma. Biopsy confirms non-caseating granulomas.', category: 'pattern_recognition', topic: 'Sarcoidosis' },
  { rule_text: 'In non-anion gap metabolic acidosis, urine pH is the discriminator: if the kidney cannot acidify urine (pH >5.5 despite acidemia), it is distal (Type 1) RTA. If it can acidify (pH <5.5), check potassium — high K = Type 4, low K = diarrhea or Type 2.', category: 'diagnostic_disambiguation', topic: 'Renal Tubular Acidosis' },
  { rule_text: 'Elevated transaminases in a young woman with positive ANA and anti-smooth muscle antibody — autoimmune hepatitis must be considered before attributing to other causes. The diagnosis changes management: steroids, not just monitoring.', category: 'pattern_recognition', topic: 'Autoimmune Hepatitis' },
  { rule_text: 'Episodic headache + diaphoresis + palpitations with paroxysmal hypertension = pheochromocytoma until proven otherwise. The screening test is plasma free metanephrines or 24-hour urine metanephrines — NOT a single catecholamine level.', category: 'diagnostic_disambiguation', topic: 'Pheochromocytoma' },
  { rule_text: 'PMR is a clinical diagnosis confirmed by treatment response: bilateral proximal stiffness + age >50 + ESR >40 + dramatic response to low-dose prednisone (15-20mg). Always screen for GCA — temporal headache, jaw claudication, or visual changes mandate urgent ESR + temporal artery biopsy.', category: 'pattern_recognition', topic: 'PMR/GCA' },
];

// ─── The 5 Questions ───
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
  transfer_rule_match: string;
}

const QUESTIONS: QuestionSeed[] = [
  // ═══ Q1: SARCOIDOSIS — Pulmonary, tier_1, "high yield but AI skips it" ═══
  // FIXES: compound option B split, demographic language, dual temp, mm Hg spacing,
  //        process-before-conclusion explanation, 2-sentence pearl, "what would change" added
  {
    system_topic: 'pulm',
    difficulty: 'medium',
    error_bucket: 'premature_closure',
    confusion_set_name: 'bilateral_hilar_lymphadenopathy_differential',
    transfer_rule_match: 'bilateral hilar lymphadenopathy',
    vignette: 'A 32-year-old woman presents with a 6-week history of dry cough, progressive exertional dyspnea, and painful raised lesions on her shins. She has no significant medical history and does not take any medications. She denies fevers, night sweats, or weight loss. Her temperature is 37.1°C (98.8°F), pulse is 78/min, respirations are 16/min, and blood pressure is 122/76 mm Hg. Pulse oximetry on room air shows an oxygen saturation of 96%. Physical examination reveals bilateral tender, erythematous, subcutaneous nodules on the anterior aspects of both shins, each approximately 3 cm in diameter. Lung examination is clear to auscultation. Serum calcium is 11.2 mg/dL (normal 8.5–10.5). Chest x-ray shows bilateral hilar lymphadenopathy with clear lung fields.',
    stem: 'Which of the following is the most appropriate next step in diagnosis?',
    option_a: 'CT-guided biopsy of a hilar lymph node',
    option_b: 'Bronchoscopy with transbronchial biopsy',
    option_c: 'Positron emission tomography (PET) scan',
    option_d: 'Sputum acid-fast bacilli culture',
    option_e: 'Peripheral blood flow cytometry',
    correct_answer: 'B',
    error_map: { A: 'next_step_error', C: 'premature_closure', D: 'confusion_set_miss', E: 'premature_closure' },
    transfer_rule_text: 'When bilateral hilar lymphadenopathy occurs with extrapulmonary findings (skin lesions, hypercalcemia) in a young patient, tissue biopsy via the least invasive route is the priority — bronchoscopy before CT-guided or surgical biopsy.',
    explanation_decision: 'What is the clinical pattern? A young woman with bilateral hilar lymphadenopathy, erythematous shin nodules (erythema nodosum), and hypercalcemia. What does this narrow to? The combination of non-caseating granulomatous disease with extrapulmonary manifestations — sarcoidosis is the leading diagnosis. The absence of fevers, night sweats, and weight loss argues against lymphoma and tuberculosis. What is the discriminating feature? Tissue confirmation is required, and bronchoscopy with transbronchial biopsy is the standard least-invasive approach to obtain tissue showing non-caseating granulomas.',
    explanation_options: 'CT-guided hilar biopsy (A) obtains the same tissue but is more invasive than bronchoscopy — it carries higher risk of pneumothorax and is reserved for cases where bronchoscopy is non-diagnostic. PET scan (C) shows metabolic activity but cannot distinguish granulomatous inflammation from malignancy — tissue diagnosis is still required regardless of PET result. AFB culture (D) is reasonable to exclude tuberculosis, which also causes granulomas, but TB granulomas are caseating, and the overall picture (no systemic symptoms, hypercalcemia, erythema nodosum) favors sarcoidosis over TB. Flow cytometry (E) evaluates for hematologic malignancy and would be appropriate if lymphoma were the primary suspicion, but the extrapulmonary findings point away from lymphoma.',
    explanation_summary: 'Hypercalcemia in sarcoidosis results from granuloma 1α-hydroxylase converting 25-OH vitamin D to active 1,25-dihydroxyvitamin D — this mechanism is unique to granulomatous disease and helps distinguish it from malignancy-related hypercalcemia. If this patient had presented with B symptoms (fevers, drenching night sweats, 10% weight loss), the differential would shift toward lymphoma and the initial workup would prioritize excisional biopsy over bronchoscopy.',
  },

  // ═══ Q2: RENAL TUBULAR ACIDOSIS — Nephrology, tier_2, "medium yield" ═══
  // FIXES: option E replaced (urease UTI → acetazolamide), removed "(normal)" from AG,
  //        PCO2 capitalized, process-before-conclusion explanation, 2-sentence pearl
  {
    system_topic: 'nephro',
    difficulty: 'hard',
    error_bucket: 'test_interpretation_miss',
    confusion_set_name: 'non_anion_gap_metabolic_acidosis',
    transfer_rule_match: 'urine pH is the discriminator',
    vignette: 'A 45-year-old woman presents for evaluation of recurrent nephrolithiasis. She has passed three calcium phosphate stones in the past 2 years. She has no other medical history and does not take any medications. Physical examination is unremarkable. Laboratory studies show: sodium 140 mEq/L (normal 136–145), potassium 3.1 mEq/L (normal 3.5–5.0), chloride 112 mEq/L (normal 98–106), bicarbonate 16 mEq/L (normal 22–28), BUN 14 mg/dL (normal 7–20), creatinine 0.9 mg/dL (normal 0.6–1.2). Arterial blood gas: pH 7.31, PCO2 32 mm Hg. Urinalysis shows pH 6.8.',
    stem: 'Which of the following is the most likely diagnosis?',
    option_a: 'Type 1 (distal) renal tubular acidosis',
    option_b: 'Type 2 (proximal) renal tubular acidosis',
    option_c: 'Type 4 (hyperkalemic) renal tubular acidosis',
    option_d: 'Chronic diarrhea with metabolic acidosis',
    option_e: 'Acetazolamide-induced metabolic acidosis',
    correct_answer: 'A',
    error_map: { B: 'confusion_set_miss', C: 'test_interpretation_miss', D: 'premature_closure', E: 'premature_closure' },
    transfer_rule_text: 'In non-anion gap metabolic acidosis, the urine pH separates renal from extrarenal causes: if the kidney cannot acidify urine below 5.5 despite systemic acidemia, the defect is in the distal tubule — not the proximal tubule, not the gut.',
    explanation_decision: 'Step 1: Is the anion gap elevated? Na − (Cl + HCO3) = 140 − (112 + 16) = 12 — normal. This is a non-anion gap metabolic acidosis. Step 2: Is the urine pH appropriate? Normal response to acidemia is maximal urine acidification (pH <5.5). This patient\'s urine pH is 6.8 despite a serum pH of 7.31 — the kidney cannot acidify. Step 3: Is the potassium high or low? Potassium is 3.1 (low). Low potassium + inability to acidify urine = Type 1 (distal) RTA. Step 4: The recurrent calcium phosphate stones confirm — alkaline urine promotes calcium phosphate precipitation, which is characteristic of distal RTA.',
    explanation_options: 'Type 2 (proximal) RTA (B) vs Type 1: the key difference is that in Type 2, the proximal tubule wastes bicarbonate but the distal tubule CAN still acidify once serum bicarb falls below the reabsorption threshold — urine pH would be <5.5 at this degree of acidemia. Type 4 RTA (C) vs Type 1: Type 4 presents with HYPERkalemia (this patient has HYPOkalemia) because aldosterone deficiency/resistance impairs both K+ secretion and H+ secretion. Diarrhea (D) vs Type 1: diarrhea causes bicarbonate loss through the gut, but the kidney responds appropriately by maximally acidifying urine (pH <5.5) — the urine anion gap would also be negative. Acetazolamide (E) vs Type 1: acetazolamide inhibits carbonic anhydrase in the proximal tubule, creating a Type 2-like picture — but this patient takes no medications.',
    explanation_summary: 'The algorithm for non-anion gap metabolic acidosis: check anion gap → check urine pH → check potassium. Urine pH >5.5 with acidemia = distal tubule defect (Type 1); potassium distinguishes Type 1 (low K) from Type 4 (high K). If this patient had presented with hyperkalemia instead of hypokalemia, the diagnosis would shift to Type 4 RTA, and the workup would focus on aldosterone levels and causes of hypoaldosteronism.',
  },

  // ═══ Q3: AUTOIMMUNE HEPATITIS — Hepatology, tier_1, "less common" ═══
  // FIXES: option D updated (interferon → DAA), lab reference ranges added, dual temp,
  //        medication specificity, mm Hg spacing, process-before-conclusion, 2-sentence pearl
  {
    system_topic: 'hepato',
    difficulty: 'medium',
    error_bucket: 'premature_closure',
    confusion_set_name: 'autoimmune_hepatitis_vs_other_liver_disease',
    transfer_rule_match: 'young woman with positive ANA',
    vignette: 'A 24-year-old woman presents with a 3-week history of fatigue, nausea, and right upper quadrant discomfort. She does not take any medications and does not drink alcoholic beverages. She has never used intravenous drugs and has not received blood transfusions. She has a history of Hashimoto thyroiditis, for which she takes levothyroxine 75 mcg daily. Her temperature is 37.0°C (98.6°F), pulse is 72/min, and blood pressure is 118/68 mm Hg. Physical examination reveals mild hepatomegaly and no stigmata of chronic liver disease. Laboratory studies show: AST 480 U/L (normal 8–33), ALT 520 U/L (normal 7–56), total bilirubin 3.2 mg/dL (normal 0.1–1.2), alkaline phosphatase 95 U/L (normal 44–147), albumin 3.5 g/dL (normal 3.5–5.5). Hepatitis A IgM, hepatitis B surface antigen, hepatitis B core IgM, and hepatitis C antibody are all negative. ANA titer is 1:640 (positive). Anti-smooth muscle antibody is positive. Serum IgG is 2,800 mg/dL (normal 700–1,600).',
    stem: 'Which of the following is the most appropriate next step in management?',
    option_a: 'Observation with repeat liver function tests in 4 weeks',
    option_b: 'Liver biopsy to confirm diagnosis and guide treatment',
    option_c: 'Ursodeoxycholic acid',
    option_d: 'Direct-acting antiviral therapy',
    option_e: 'Abdominal ultrasound with Doppler',
    correct_answer: 'B',
    error_map: { A: 'severity_miss', C: 'confusion_set_miss', D: 'premature_closure', E: 'premature_closure' },
    transfer_rule_text: 'When hepatocellular injury (AST/ALT >> ALP) occurs with positive ANA, anti-smooth muscle antibody, and elevated IgG after viral causes are excluded, autoimmune hepatitis requires tissue confirmation and immunosuppression — observation risks progression to cirrhosis.',
    explanation_decision: 'What is the clinical pattern? A young woman with markedly elevated aminotransferases in a hepatocellular pattern (AST/ALT >> ALP), negative viral serologies, and positive autoantibodies. What does this narrow to? The combination of ANA (1:640) + anti-smooth muscle antibody + elevated IgG + negative viral panel is classic for Type 1 autoimmune hepatitis. The coexisting Hashimoto thyroiditis supports an autoimmune diathesis. What is the discriminating feature? Liver biopsy is needed to confirm the diagnosis (interface hepatitis with plasma cell infiltration), grade disease severity, and guide the decision to start immunosuppression with prednisone and azathioprine.',
    explanation_options: 'Observation (A) vs liver biopsy: untreated autoimmune hepatitis progresses to cirrhosis in 40% of patients within 10 years — the serologic pattern here demands tissue confirmation and treatment, not watchful waiting. Ursodeoxycholic acid (C) vs immunosuppression: UDCA is the treatment for primary biliary cholangitis, which presents with elevated ALP (cholestatic pattern) and positive anti-mitochondrial antibody — a completely different serologic and biochemical pattern from this patient. Direct-acting antivirals (D) vs immunosuppression: DAAs treat hepatitis C, which was already excluded by negative anti-HCV antibody. Abdominal ultrasound with Doppler (E) vs biopsy: Doppler evaluates for hepatic vein thrombosis (Budd-Chiari syndrome), which presents with acute hepatic congestion, ascites, and pain — not this autoantibody pattern.',
    explanation_summary: 'Autoimmune hepatitis remission exceeds 80% with prednisone and azathioprine — this is one of the few liver diseases where immunosuppression dramatically alters the natural history. If this patient\'s alkaline phosphatase had been elevated instead of the transaminases (cholestatic rather than hepatocellular pattern), the diagnosis would shift to primary biliary cholangitis and the treatment would be ursodeoxycholic acid instead of steroids.',
  },

  // ═══ Q4: PHEOCHROMOCYTOMA — Endocrinology, tier_2, "low yield zebra" ═══
  // FIXES: option E replaced (ambulatory BP → plasma catecholamines), dual temp, mm Hg spacing,
  //        named specific drug (sertraline not SSRI), transfer rule as decision principle,
  //        process-before-conclusion, 2-sentence pearl
  {
    system_topic: 'endo',
    difficulty: 'medium',
    error_bucket: 'confusion_set_miss',
    confusion_set_name: 'episodic_hypertension_differential',
    transfer_rule_match: 'episodic headache',
    vignette: 'A 38-year-old woman is referred for evaluation of difficult-to-control hypertension. Over the past 8 months, she has experienced episodic headaches, profuse sweating, and rapid heartbeat occurring 2–3 times per week, each lasting 20–30 minutes. Between episodes, she feels well. Her temperature is 36.9°C (98.4°F). Blood pressure is 158/94 mm Hg; during a witnessed episode it rises to 210/120 mm Hg with a pulse of 118/min. She has a history of panic disorder, for which sertraline was prescribed 4 months ago without improvement. Her mother had a thyroid tumor removed at age 42. Physical examination between episodes is unremarkable except for hypertension.',
    stem: 'Which of the following is the most appropriate initial diagnostic study?',
    option_a: 'Plasma free metanephrines',
    option_b: 'CT scan of the abdomen with contrast',
    option_c: 'Urine vanillylmandelic acid (VMA)',
    option_d: 'Serum TSH and free T4',
    option_e: 'Plasma catecholamines',
    correct_answer: 'A',
    error_map: { B: 'next_step_error', C: 'next_step_error', D: 'confusion_set_miss', E: 'test_interpretation_miss' },
    transfer_rule_text: 'When episodic sympathetic activation does not respond to psychiatric treatment, the differential must include catecholamine-secreting tumors before the episodic pattern is attributed to anxiety. Screen with the metabolite (metanephrines), not the parent compound (catecholamines), because metabolites are continuously elevated while catecholamines are episodic.',
    explanation_decision: 'What is the clinical pattern? Episodic triad of headache + diaphoresis + palpitations with documented paroxysmal hypertension (inter-episode 158/94, episode 210/120). What does this narrow to? The failure to respond to sertraline argues against panic disorder. The sustained inter-episode hypertension and family history (mother with thyroid tumor at 42 — raising suspicion for MEN2 syndrome) point to pheochromocytoma. What is the discriminating feature? Plasma free metanephrines is the recommended initial screening test because metanephrines are continuously produced by tumor metabolism (sensitivity ~99%), while catecholamines are released episodically and can be normal between attacks.',
    explanation_options: 'CT abdomen (B) vs plasma metanephrines: CT is the correct imaging modality to localize a pheo, but the diagnostic sequence is always screen biochemically first, then image — imaging without biochemical confirmation risks incidentaloma confusion. VMA (C) vs plasma metanephrines: VMA is a downstream metabolite requiring 24-hour urine collection with sensitivity of only ~65%, compared to 99% for plasma metanephrines — VMA is no longer the preferred screening test. TSH/free T4 (D) vs plasma metanephrines: hyperthyroidism causes sustained tachycardia and heat intolerance but does not cause episodic hypertensive crises with inter-episode normalization. Plasma catecholamines (E) vs plasma metanephrines: this is the most tempting near-miss — catecholamines are the parent compound, but they are released episodically and may be completely normal between attacks, creating a false-negative. Metanephrines are the continuously produced metabolites, making them a far more reliable screening test.',
    explanation_summary: 'Plasma free metanephrines have 99% sensitivity — a negative result essentially rules out pheochromocytoma. Never beta-block before alpha-block in confirmed pheo: unopposed alpha stimulation causes hypertensive crisis. If this patient\'s symptoms had been continuous rather than episodic, the differential would shift toward essential hypertension or renovascular disease, and the initial workup would be different.',
  },

  // ═══ Q5: PMR / GIANT CELL ARTERITIS — Rheumatology, tier_1, "medium yield" ═══
  // FIXES: compound option B split (dose only, biopsy in explanation), dual temp, mm Hg spacing,
  //        jaw claudication named, process-before-conclusion, 2-sentence pearl
  {
    system_topic: 'rheum',
    difficulty: 'medium',
    error_bucket: 'severity_miss',
    confusion_set_name: 'elderly_bilateral_shoulder_pain',
    transfer_rule_match: 'PMR is a clinical diagnosis',
    vignette: 'A 72-year-old woman presents with a 4-week history of bilateral shoulder and hip stiffness that is worst in the morning, lasting approximately 2 hours before improving. She reports difficulty raising her arms to comb her hair and getting out of a chair. She denies joint swelling, rash, or muscle weakness. Over the past 3 days, she has developed a new right-sided temporal headache and jaw claudication. Her temperature is 37.6°C (99.7°F), pulse is 82/min, and blood pressure is 136/78 mm Hg. Physical examination reveals limited active range of motion at both shoulders due to pain, but passive range of motion and strength are full. The right temporal artery is prominent and tender to palpation. ESR is 88 mm/hr (normal <30). CRP is 62 mg/L (normal <3). Complete blood count and comprehensive metabolic panel are normal.',
    stem: 'Which of the following is the most appropriate next step in management?',
    option_a: 'Prednisone 15 mg daily',
    option_b: 'Prednisone 60 mg daily',
    option_c: 'Methotrexate 15 mg weekly',
    option_d: 'MRI of bilateral shoulders',
    option_e: 'Rheumatoid factor and anti-CCP antibody testing',
    correct_answer: 'B',
    error_map: { A: 'severity_miss', C: 'next_step_error', D: 'premature_closure', E: 'confusion_set_miss' },
    transfer_rule_text: 'When a patient with polymyalgia rheumatica develops new-onset temporal headache, jaw claudication, or visual symptoms, the clinical picture has escalated from PMR to suspected giant cell arteritis — a medical emergency requiring immediate high-dose steroids to prevent irreversible vision loss.',
    explanation_decision: 'What is the clinical pattern? A 72-year-old woman with bilateral proximal morning stiffness, markedly elevated inflammatory markers (ESR 88, CRP 62), and now NEW temporal headache with jaw claudication. What does this narrow to? The initial 4-week history is classic PMR (age >50 + bilateral proximal stiffness + elevated ESR). But the 3-day-old headache and jaw claudication represent a NEW development that escalates the diagnosis to suspected GCA. What is the discriminating feature? The temporal evolution — PMR alone would warrant low-dose prednisone (15 mg), but the addition of GCA symptoms demands high-dose prednisone (40–60 mg daily) to prevent anterior ischemic optic neuropathy. Temporal artery biopsy should follow urgently but must NOT delay steroid initiation — biopsy remains positive for up to 2 weeks after starting steroids.',
    explanation_options: 'Prednisone 15 mg (A) vs 60 mg (B): 15 mg is the correct dose for isolated PMR but is dangerously insufficient for GCA — the risk is permanent, irreversible blindness from anterior ischemic optic neuropathy. The near-miss here is recognizing that the right drug at the wrong dose can be as dangerous as the wrong drug. Methotrexate (C) vs high-dose prednisone: methotrexate is a steroid-sparing agent used in maintenance after disease control — it has no role in acute GCA management. Shoulder MRI (D) vs prednisone: MRI might show bursitis or tenosynovitis consistent with PMR, but it completely misses the GCA emergency — the urgent finding is the temporal headache and jaw claudication, not the shoulder pain. RF/anti-CCP (E) vs prednisone: these evaluate for rheumatoid arthritis, which causes small joint synovitis (MCP, PIP joints) rather than proximal girdle stiffness.',
    explanation_summary: 'Untreated GCA causes permanent vision loss in 15–20% of patients — once ischemic optic neuropathy occurs, it is irreversible, making this a true medical emergency. If this patient had presented with the same shoulder and hip stiffness but WITHOUT headache, jaw claudication, or visual symptoms, the correct answer would be prednisone 15 mg daily (isolated PMR), and the management would be entirely different.',
  },
];

// ─── Main ───
async function main() {
  console.log('=== Seed Diverse 5: Scope-Proving Questions ===\n');

  // Step 0: Delete all existing questions (clear FK dependencies first)
  console.log('Clearing FK dependencies...');
  await supabase.from('attempt_v2').delete().not('question_id', 'is', null);
  await supabase.from('cognitive_error_tag').delete().not('question_id', 'is', null);

  console.log('Deleting existing questions...');
  const { error: delError } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match all rows
  if (delError) {
    console.error(`  DELETE failed: ${delError.message}`);
  } else {
    console.log(`  Deleted existing questions`);
  }

  // Step 1: Insert confusion sets
  console.log('\nInserting confusion sets...');
  const csMap = new Map<string, string>();

  for (const cs of CONFUSION_SETS) {
    const { data, error } = await supabase
      .from('confusion_sets')
      .upsert(
        {
          name: cs.name,
          conditions: cs.conditions,
          discriminating_clues: cs.discriminating_clues,
          common_traps: cs.common_traps,
        },
        { onConflict: 'name' }
      )
      .select('id')
      .single();

    if (error) {
      console.error(`  FAIL: ${cs.name} — ${error.message}`);
    } else {
      csMap.set(cs.name, data.id);
      console.log(`  Created: ${cs.name} → ${data.id}`);
    }
  }

  // Step 2: Insert transfer rules
  console.log('\nInserting transfer rules...');
  const trMap = new Map<string, string>();

  for (const tr of TRANSFER_RULES) {
    const key = tr.rule_text.toLowerCase().slice(0, 40);
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
  console.log('\nInserting 5 scope-diverse questions...');
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
      console.log(`  Q${i + 1} OK: [${q.system_topic}] ${q.stem.slice(0, 60)}... cs=${confusionSetId ? 'yes' : 'NO'} tr=${transferRuleId ? 'yes' : 'NO'}`);
    }
  }

  console.log(`\n=== Done: ${inserted}/${QUESTIONS.length} questions inserted ===`);

  // Step 4: Verify
  const { data: verify, count } = await supabase
    .from('questions')
    .select('system_topic, difficulty, stem', { count: 'exact' });
  console.log(`\nTotal questions in DB: ${count}`);
  if (verify) {
    for (const q of verify) {
      console.log(`  [${q.system_topic}] ${q.difficulty} — ${q.stem.slice(0, 60)}...`);
    }
  }
}

main().catch(console.error);
