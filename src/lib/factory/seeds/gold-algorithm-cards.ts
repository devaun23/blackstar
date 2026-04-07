/**
 * GOLD ALGORITHM CARDS — Hand-verified clinical truth for Tier 1 topics.
 *
 * These are NOT AI-generated. Every field is sourced from current guidelines.
 * The pipeline generates questions FROM these cards, not from Claude's training data.
 *
 * Phase 1: PE, ACS, AKI (3 cards, 3 confusion sets, 24 questions)
 */

// ═══════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════

export interface GoldAlgorithmCard {
  topic: string;
  shelf: string;
  system: string;

  // Core algorithm
  entry_presentation: string;
  competing_paths: string[];
  hinge_feature: string;
  correct_action: string;
  contraindications: string[];
  source_citations: string[];

  // Structured generation fields
  escalation_rule: string;
  nbme_trap: string;
  transfer_rule: string;

  // Discriminators (confusion set integration)
  discriminators: Record<string, string[]>;

  // Fact rows (each verified against source)
  fact_rows: GoldFactRow[];

  // Question blueprint (8 per topic)
  question_blueprints: QuestionBlueprint[];
}

export interface GoldFactRow {
  fact_type: 'threshold' | 'drug_choice' | 'contraindication' | 'diagnostic_criterion' | 'risk_factor' | 'complication' | 'management_step';
  fact_text: string;
  threshold_value: string | null;
  source_name: string;
  source_tier: 'A' | 'B';
  confidence: 'high';
}

export interface OptionFrame {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  meaning: string;             // What this option represents clinically
}

export interface QuestionBlueprint {
  task_type: 'diagnosis' | 'next_step' | 'management' | 'complication';
  scenario_seed: string;
  target_confusion: string[];  // Which competing diagnoses are in play
  hinge_clue: string;          // What makes the correct answer correct
  target_cognitive_error: string;
  transfer_rule: string;
  // Pre-specified answer set (optional — when present, writer renders, does not invent)
  option_action_class?: string;
  correct_option?: 'A' | 'B' | 'C' | 'D' | 'E';
  option_frames?: OptionFrame[];
}

// ═══════════════════════════════════════════════════════════
//  CONFUSION SETS
// ═══════════════════════════════════════════════════════════

export interface GoldConfusionSet {
  name: string;
  presenting_complaint: string;
  conditions: string[];
  discriminators: Record<string, string[]>;
  common_trap: string;
}

export const GOLD_CONFUSION_SETS: GoldConfusionSet[] = [
  // ─── CONFUSION SET 1: Chest Pain ───
  {
    name: 'chest_pain_emergency',
    presenting_complaint: 'Acute chest pain',
    conditions: ['STEMI', 'NSTEMI', 'Unstable Angina', 'Aortic Dissection', 'PE', 'Pericarditis'],
    discriminators: {
      'STEMI': ['ST elevation ≥1mm in 2+ contiguous leads', 'acute onset', 'crushing/pressure quality', 'diaphoresis'],
      'NSTEMI': ['troponin elevated', 'ST depression or T-wave inversion', 'crescendo pattern'],
      'Unstable Angina': ['troponin NORMAL', 'rest pain or crescendo', 'ECG may be normal or with ST depression'],
      'Aortic Dissection': ['tearing pain radiating to back', 'BP differential between arms ≥20mmHg', 'widened mediastinum', 'acute onset maximal at onset'],
      'PE': ['pleuritic', 'sudden onset', 'tachycardia with clear lungs', 'risk factors (immobility, DVT, OCP)'],
      'Pericarditis': ['pleuritic', 'positional (worse supine, better leaning forward)', 'diffuse ST elevation with PR depression', 'friction rub'],
    },
    common_trap: 'Treating NSTEMI as STEMI (giving fibrinolytics without ST elevation) or missing aortic dissection by anchoring on ACS',
  },

  // ─── CONFUSION SET 2: Dyspnea ───
  {
    name: 'acute_dyspnea',
    presenting_complaint: 'Acute dyspnea',
    conditions: ['PE', 'Pneumonia', 'CHF Exacerbation', 'COPD Exacerbation', 'Asthma Exacerbation', 'Pneumothorax'],
    discriminators: {
      'PE': ['sudden onset', 'clear lungs', 'tachycardia', 'pleuritic pain', 'risk factors', 'hypoxia out of proportion'],
      'Pneumonia': ['fever', 'productive cough', 'focal crackles/consolidation', 'leukocytosis'],
      'CHF Exacerbation': ['orthopnea', 'PND', 'bilateral crackles', 'JVD', 'peripheral edema', 'BNP elevated'],
      'COPD Exacerbation': ['known COPD', 'wheezing + rhonchi', 'increased sputum', 'barrel chest', 'hyperinflation on CXR'],
      'Asthma Exacerbation': ['wheezing', 'known asthma', 'trigger exposure', 'peak flow decreased', 'younger patient'],
      'Pneumothorax': ['sudden pleuritic pain', 'decreased breath sounds unilateral', 'tracheal deviation if tension', 'tall/thin habitus or trauma'],
    },
    common_trap: 'Ordering CXR for suspected PE (clear lungs + tachycardia) instead of going to CTA when pretest probability is high',
  },

  // ─── CONFUSION SET 3: Acute Kidney Injury ───
  {
    name: 'acute_kidney_injury',
    presenting_complaint: 'Rising creatinine / decreased urine output',
    conditions: ['Prerenal AKI', 'Intrinsic/ATN', 'Postrenal/Obstructive'],
    discriminators: {
      'Prerenal AKI': ['BUN:Cr >20:1', 'FENa <1%', 'urine Na <20', 'concentrated urine (>500 mOsm)', 'clinical hypovolemia (tachycardia, hypotension, dry mucosa)', 'responds to fluids'],
      'Intrinsic/ATN': ['BUN:Cr <15:1', 'FENa >2%', 'urine Na >40', 'muddy brown casts', 'fixed specific gravity ~1.010', 'does NOT respond to fluids'],
      'Postrenal/Obstructive': ['bilateral hydronephrosis on ultrasound', 'distended bladder', 'BPH history', 'post-void residual elevated', 'anuria or fluctuating output'],
    },
    common_trap: 'Starting fluids for ATN (FENa >2%) instead of recognizing intrinsic damage, or missing obstruction by not checking ultrasound',
  },
];

// ═══════════════════════════════════════════════════════════
//  GOLD CARD 1: PULMONARY EMBOLISM
// ═══════════════════════════════════════════════════════════

export const GOLD_CARD_PE: GoldAlgorithmCard = {
  topic: 'Pulmonary Embolism',
  shelf: 'medicine',
  system: 'Pulmonology',

  entry_presentation: 'Acute onset dyspnea and/or pleuritic chest pain with tachycardia, often with risk factors for VTE (recent surgery, immobility, malignancy, OCP use, long travel)',

  competing_paths: [
    'PE → anticoagulation (stable) or thrombolysis (massive)',
    'Pneumonia → antibiotics',
    'CHF exacerbation → diuretics',
    'Anxiety/panic → reassurance after workup',
  ],

  hinge_feature: 'Sudden onset dyspnea with clear lungs and tachycardia in a patient with VTE risk factors; hypoxia out of proportion to exam findings',

  correct_action: 'CT pulmonary angiography (if hemodynamically stable and high/intermediate pretest probability). If unstable: empiric heparin and consider thrombolysis.',

  contraindications: [
    'Thrombolytics contraindicated if: active bleeding, recent surgery <3 weeks, hemorrhagic stroke <3 months, intracranial neoplasm',
    'CTA contraindicated if: severe contrast allergy (use V/Q scan), severe renal failure (use V/Q scan), pregnancy first choice is V/Q or bilateral LE duplex',
  ],

  source_citations: [
    '2019 ESC Guidelines on Acute Pulmonary Embolism',
    '2016 ACCP Antithrombotic Therapy for VTE',
    'PIOPED II study (CTA sensitivity/specificity)',
    'UpToDate: Overview of acute PE in adults (2024)',
  ],

  escalation_rule: 'Hemodynamically unstable (SBP <90 for >15min, or requiring vasopressors) → empiric anticoagulation FIRST, then consider systemic thrombolysis or catheter-directed therapy',

  nbme_trap: 'Ordering D-dimer when pretest probability is HIGH (Wells ≥5). D-dimer is a rule-out test for LOW pretest probability only. High suspicion → go directly to CTA.',

  transfer_rule: 'When pretest probability for PE is high, skip screening tests (D-dimer) and go directly to definitive imaging (CTA). Screening tests only help when pretest probability is low.',

  discriminators: {
    'PE': ['sudden onset', 'clear lungs', 'tachycardia', 'pleuritic chest pain', 'VTE risk factors', 'hypoxia out of proportion to exam'],
    'Pneumonia': ['fever', 'productive cough', 'focal crackles or consolidation on exam', 'leukocytosis with left shift'],
    'CHF': ['orthopnea', 'PND', 'bilateral crackles', 'JVD', 'lower extremity edema', 'elevated BNP'],
    'Anxiety': ['normal vital signs', 'perioral/extremity paresthesias', 'hyperventilation', 'normal O2 sat', 'identifiable trigger'],
  },

  fact_rows: [
    { fact_type: 'diagnostic_criterion', fact_text: 'Wells score ≥5 = high probability; 2-4 = intermediate; <2 = low probability', threshold_value: 'Wells ≥5', source_name: '2019 ESC PE Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'diagnostic_criterion', fact_text: 'D-dimer is useful ONLY when pretest probability is LOW. Sensitivity ~95%, specificity ~40%. Negative D-dimer with low pretest probability rules out PE.', threshold_value: '<500 ng/mL (age-adjusted: age × 10 if >50)', source_name: '2019 ESC PE Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'diagnostic_criterion', fact_text: 'CTA is the gold standard imaging for PE. Sensitivity 83-100%, specificity 89-97% for main/lobar PE.', threshold_value: null, source_name: 'PIOPED II', source_tier: 'A', confidence: 'high' },
    { fact_type: 'management_step', fact_text: 'Initial anticoagulation: unfractionated heparin (UFH) bolus 80 U/kg then 18 U/kg/hr, OR LMWH (enoxaparin 1 mg/kg BID). UFH preferred if considering thrombolysis or if renal failure.', threshold_value: null, source_name: '2016 ACCP VTE Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'management_step', fact_text: 'Massive PE (hemodynamically unstable): systemic thrombolysis with alteplase 100mg IV over 2 hours. Consider if SBP <90 for >15min despite fluids/vasopressors.', threshold_value: 'SBP <90 mmHg for >15 min', source_name: '2019 ESC PE Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'contraindication', fact_text: 'Absolute contraindications to thrombolysis: active internal bleeding, hemorrhagic stroke <3mo, intracranial neoplasm, recent intracranial surgery <3mo, known bleeding diathesis', threshold_value: null, source_name: '2019 ESC PE Guidelines', source_tier: 'A', confidence: 'high' },
  ],

  question_blueprints: [
    // Diagnosis × 2
    {
      task_type: 'diagnosis',
      scenario_seed: 'Classic PE presentation: sudden dyspnea, pleuritic pain, clear lungs, tachycardia, recent immobility',
      target_confusion: ['PE', 'Pneumonia', 'CHF', 'Anxiety'],
      hinge_clue: 'Recent 8-hour flight + sudden onset + clear lungs (no fever, no crackles, no edema)',
      target_cognitive_error: 'premature_closure',
      transfer_rule: 'Sudden dyspnea with clear lungs and risk factors = PE until proven otherwise',
    },
    {
      task_type: 'diagnosis',
      scenario_seed: 'PE mimicking pneumonia: patient with cough and mild fever but pleuritic pain, sudden onset, and tachycardia out of proportion',
      target_confusion: ['PE', 'Pneumonia'],
      hinge_clue: 'Tachycardia out of proportion to fever + no consolidation on CXR + recent surgery',
      target_cognitive_error: 'anchoring',
      transfer_rule: 'When tachycardia is out of proportion to other findings, consider PE even if cough is present',
    },

    // Next step × 3
    {
      task_type: 'next_step',
      scenario_seed: 'High pretest probability PE: Wells score 7, physician considers D-dimer vs CTA',
      target_confusion: ['PE'],
      hinge_clue: 'Wells score 7 (high probability) — D-dimer is wrong here',
      target_cognitive_error: 'wrong_algorithm_branch',
      transfer_rule: 'When pretest probability for PE is high, skip D-dimer and go directly to CTA',
    },
    {
      task_type: 'next_step',
      scenario_seed: 'Low pretest probability PE: Wells score 1, young woman with pleuritic pain but no risk factors',
      target_confusion: ['PE', 'Anxiety', 'Pneumonia'],
      hinge_clue: 'Wells score 1 (low probability) — D-dimer IS appropriate here',
      target_cognitive_error: 'over_testing',
      transfer_rule: 'When pretest probability is low, D-dimer can safely rule out PE and avoid unnecessary CTA',
    },
    {
      task_type: 'next_step',
      scenario_seed: 'Massive PE: hypotension, tachycardia, known PE on CTA, question is heparin vs thrombolytics vs IVC filter',
      target_confusion: ['PE'],
      hinge_clue: 'SBP 78 mmHg despite IV fluids — hemodynamically unstable',
      target_cognitive_error: 'under_triage',
      transfer_rule: 'Hemodynamically unstable PE requires thrombolysis, not just anticoagulation — instability changes the treatment tier',
    },

    // Management × 2
    {
      task_type: 'management',
      scenario_seed: 'PE with absolute contraindication to anticoagulation: active GI bleed + confirmed PE',
      target_confusion: ['PE'],
      hinge_clue: 'Active GI bleeding = absolute contraindication to anticoagulation → IVC filter',
      target_cognitive_error: 'reflex_response_to_finding',
      transfer_rule: 'When anticoagulation is contraindicated in confirmed VTE, IVC filter is the mechanical alternative',
    },
    {
      task_type: 'management',
      scenario_seed: 'PE in pregnancy: confirmed PE, need to choose anticoagulant (LMWH vs warfarin vs DOAC)',
      target_confusion: ['PE'],
      hinge_clue: 'Pregnancy → warfarin and DOACs are teratogenic → LMWH is the only safe option',
      target_cognitive_error: 'wrong_algorithm_branch',
      transfer_rule: 'In pregnancy, LMWH is the only safe anticoagulant. Warfarin is teratogenic (especially T1). DOACs lack safety data.',
    },

    // Complication × 1
    {
      task_type: 'complication',
      scenario_seed: 'Chronic thromboembolic pulmonary hypertension: patient with prior PE presenting months later with progressive exertional dyspnea',
      target_confusion: ['PE', 'CHF'],
      hinge_clue: 'History of PE 6 months ago + progressive dyspnea + elevated PA pressures on echo',
      target_cognitive_error: 'premature_closure',
      transfer_rule: 'Progressive dyspnea after PE should raise suspicion for CTEPH — echo shows elevated PA pressure, V/Q scan is diagnostic',
    },
  ],
};

// ═══════════════════════════════════════════════════════════
//  GOLD CARD 2: ACUTE CORONARY SYNDROME
// ═══════════════════════════════════════════════════════════

export const GOLD_CARD_ACS: GoldAlgorithmCard = {
  topic: 'Acute Coronary Syndrome',
  shelf: 'medicine',
  system: 'Cardiology',

  entry_presentation: 'Substernal chest pain/pressure, often with radiation to jaw/left arm, diaphoresis, nausea. May be atypical in elderly, women, diabetics (dyspnea, fatigue, epigastric pain).',

  competing_paths: [
    'STEMI → emergent reperfusion (PCI or fibrinolytics)',
    'NSTEMI → anticoagulation + early invasive strategy (within 24-72h)',
    'Unstable Angina → risk stratification + medical management',
    'Aortic Dissection → emergent surgical consultation, NO anticoagulation',
    'Pericarditis → NSAIDs + colchicine',
  ],

  hinge_feature: 'ECG findings + troponin determine the ACS subtype: ST elevation = STEMI (emergent PCI). Troponin+ without ST elevation = NSTEMI. Troponin- with ischemic symptoms = UA.',

  correct_action: 'STEMI: emergent PCI if door-to-balloon <90min, else fibrinolytics within 30min. NSTEMI: dual antiplatelet + anticoagulation + early invasive strategy. UA: risk stratify with TIMI/HEART score.',

  contraindications: [
    'Fibrinolytics absolutely contraindicated if: active bleeding, prior hemorrhagic stroke, ischemic stroke <3mo, intracranial neoplasm, suspected aortic dissection, recent major surgery <3wk',
    'MUST rule out aortic dissection before starting anticoagulation — tearing pain + BP differential + widened mediastinum',
  ],

  source_citations: [
    '2021 ACC/AHA Chest Pain Guideline',
    '2013 ACC/AHA STEMI Guidelines (updated 2022)',
    '2014 ACC/AHA NSTE-ACS Guidelines (updated 2022)',
    'UpToDate: Overview of ACS (2024)',
  ],

  escalation_rule: 'STEMI = time is myocardium. Door-to-balloon <90min for PCI. Door-to-needle <30min for fibrinolytics. If neither available within window, transfer for PCI even if >120min.',

  nbme_trap: 'Waiting for troponin results before treating STEMI. ECG with ST elevation IS the diagnosis — do not delay reperfusion for serial troponins.',

  transfer_rule: 'In STEMI, the ECG IS the diagnosis. Do not wait for troponin to confirm before initiating reperfusion therapy. Time is myocardium.',

  discriminators: {
    'STEMI': ['ST elevation ≥1mm in 2+ contiguous leads', 'new LBBB', 'hyperacute T waves', 'reciprocal changes'],
    'NSTEMI': ['troponin elevated', 'ST depression or dynamic T-wave changes', 'no ST elevation'],
    'Unstable Angina': ['troponin NORMAL (×2)', 'rest pain or new/worsening angina', 'ECG may be normal or nonspecific'],
    'Aortic Dissection': ['tearing/ripping pain maximal at onset', 'BP differential >20mmHg between arms', 'widened mediastinum on CXR', 'pulse deficit'],
    'Pericarditis': ['positional pain (worse supine, better leaning forward)', 'diffuse ST elevation', 'PR depression', 'friction rub'],
  },

  fact_rows: [
    { fact_type: 'diagnostic_criterion', fact_text: 'STEMI criteria: new ST elevation ≥1mm in 2 contiguous leads (≥2mm in V2-V3 for men, ≥1.5mm in V2-V3 for women), or new LBBB with ischemic symptoms', threshold_value: '≥1mm (≥2mm in V2-V3 men)', source_name: '2013 ACC/AHA STEMI Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'management_step', fact_text: 'STEMI reperfusion targets: door-to-balloon (PCI) <90 minutes; door-to-needle (fibrinolytics) <30 minutes. If PCI not available within 120min of first medical contact, give fibrinolytics.', threshold_value: 'PCI <90min, lytic <30min', source_name: '2013 ACC/AHA STEMI Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'drug_choice', fact_text: 'All ACS: aspirin 325mg (chewed) + P2Y12 inhibitor (ticagrelor 180mg or clopidogrel 600mg loading). Add heparin (UFH or enoxaparin). Beta-blocker within 24h if no contraindication.', threshold_value: null, source_name: '2014 ACC/AHA NSTE-ACS Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'contraindication', fact_text: 'MUST exclude aortic dissection before anticoagulation/antiplatelet therapy. Tearing pain + BP differential + widened mediastinum = dissection until proven otherwise. Dissection + anticoagulation = catastrophic.', threshold_value: null, source_name: '2021 ACC/AHA Chest Pain Guideline', source_tier: 'A', confidence: 'high' },
    { fact_type: 'diagnostic_criterion', fact_text: 'Serial troponins (high-sensitivity): 0h and 3h (or 0/1h algorithm). Rise and/or fall pattern distinguishes acute MI from chronic troponin elevation.', threshold_value: '>99th percentile URL with rise/fall', source_name: '2021 ESC NSTE-ACS Guidelines', source_tier: 'A', confidence: 'high' },
    { fact_type: 'management_step', fact_text: 'NSTEMI early invasive strategy (within 24h) recommended if: GRACE score >140, dynamic ST changes, elevated troponin, diabetes, renal insufficiency, LVEF <40%, early post-infarct angina', threshold_value: 'GRACE >140', source_name: '2014 ACC/AHA NSTE-ACS Guidelines', source_tier: 'A', confidence: 'high' },
  ],

  question_blueprints: [
    // Diagnosis × 2
    {
      task_type: 'diagnosis',
      scenario_seed: 'Classic STEMI: crushing chest pain, diaphoresis, ST elevation in V1-V4',
      target_confusion: ['STEMI', 'Pericarditis', 'NSTEMI'],
      hinge_clue: 'Focal ST elevation in V1-V4 with reciprocal changes in inferior leads (pericarditis = diffuse, no reciprocal)',
      target_cognitive_error: 'premature_closure',
      transfer_rule: 'Reciprocal ST changes distinguish STEMI from pericarditis. Pericarditis = diffuse ST elevation without reciprocal depression.',
    },
    {
      task_type: 'diagnosis',
      scenario_seed: 'ACS vs aortic dissection: chest pain radiating to back, hypertensive, pulse asymmetry',
      target_confusion: ['Aortic Dissection', 'STEMI', 'PE'],
      hinge_clue: 'BP 190/110 in right arm, 150/90 in left + tearing pain maximal at onset + widened mediastinum on CXR',
      target_cognitive_error: 'anchoring',
      transfer_rule: 'Tearing pain maximal at onset + BP differential + widened mediastinum = aortic dissection. MUST exclude before anticoagulation.',
    },

    // Next step × 3
    {
      task_type: 'next_step',
      scenario_seed: 'STEMI patient arrives at hospital without PCI capability. Transfer time 2 hours.',
      target_confusion: ['STEMI'],
      hinge_clue: 'PCI not available within 120min → fibrinolytics indicated (if no contraindication)',
      target_cognitive_error: 'under_triage',
      transfer_rule: 'If PCI cannot be performed within 120min of first medical contact, give fibrinolytics within 30min. Do not wait for transfer.',
    },
    {
      task_type: 'next_step',
      scenario_seed: 'STEMI at rural hospital with no cath lab. Nearest PCI center is >2 hours away. Patient had major abdominal surgery 5 days ago. Fibrinolytics are absolutely contraindicated.',
      target_confusion: ['STEMI'],
      hinge_clue: 'Recent surgery <3wk = absolute contraindication to fibrinolytics → must transfer for PCI regardless of delay, even if >2 hours',
      target_cognitive_error: 'wrong_algorithm_branch',
      transfer_rule: 'When fibrinolytics are contraindicated in STEMI, transfer for PCI regardless of delay. Some reperfusion > no reperfusion. Contraindication overrides timing guidelines.',
      option_action_class: 'management_steps',
      correct_option: 'A',
      option_frames: [
        { id: 'A', meaning: 'Arrange transfer for emergent PCI' },
        { id: 'B', meaning: 'Administer intravenous fibrinolytic therapy' },
        { id: 'C', meaning: 'Begin anticoagulation with delayed catheterization' },
        { id: 'D', meaning: 'Initiate supportive care and monitoring' },
        { id: 'E', meaning: 'Obtain repeat ECG and troponin levels' },
      ],
    },
    {
      task_type: 'next_step',
      scenario_seed: 'Chest pain patient, ECG shows ST elevation. Physician considers waiting for troponin before calling cath lab.',
      target_confusion: ['STEMI', 'NSTEMI'],
      hinge_clue: 'ST elevation on ECG IS the diagnosis — troponin should not delay activation of cath lab',
      target_cognitive_error: 'skipping_required_diagnostic_step',
      transfer_rule: 'In STEMI, the ECG is the diagnosis. Do not wait for troponin. Activate cath lab immediately.',
    },

    // Management × 2
    {
      task_type: 'management',
      scenario_seed: 'NSTEMI patient, troponin elevated, ST depression in V4-V6. Hemodynamically stable. Question: timing of catheterization.',
      target_confusion: ['NSTEMI', 'Unstable Angina'],
      hinge_clue: 'Troponin positive + dynamic ST changes + GRACE >140 → early invasive strategy within 24h',
      target_cognitive_error: 'under_triage',
      transfer_rule: 'NSTEMI with high-risk features (dynamic ECG changes, elevated troponin, GRACE >140) should have early invasive strategy within 24h, not conservative management.',
    },
    {
      task_type: 'management',
      scenario_seed: 'ACS patient with aspirin allergy. Question: antiplatelet strategy.',
      target_confusion: ['NSTEMI', 'STEMI'],
      hinge_clue: 'True aspirin allergy (anaphylaxis) → desensitization protocol, then aspirin. NOT substitute with clopidogrel alone.',
      target_cognitive_error: 'wrong_algorithm_branch',
      transfer_rule: 'In ACS, aspirin is essential. True allergy → rapid desensitization, not avoidance. Dual antiplatelet requires aspirin.',
    },

    // Complication × 1
    {
      task_type: 'complication',
      scenario_seed: 'Day 3 post-MI: new holosystolic murmur, hemodynamic deterioration',
      target_confusion: ['STEMI'],
      hinge_clue: 'New murmur post-MI + acute deterioration → mechanical complication (VSD, papillary muscle rupture, free wall rupture)',
      target_cognitive_error: 'premature_closure',
      transfer_rule: 'New murmur + hemodynamic instability post-MI = mechanical complication until proven otherwise. Emergent echo → surgical consultation.',
    },
  ],
};

// ═══════════════════════════════════════════════════════════
//  GOLD CARD 3: ACUTE KIDNEY INJURY
// ═══════════════════════════════════════════════════════════

export const GOLD_CARD_AKI: GoldAlgorithmCard = {
  topic: 'Acute Kidney Injury',
  shelf: 'medicine',
  system: 'Nephrology',

  entry_presentation: 'Rising creatinine (≥0.3 mg/dL within 48h or ≥1.5× baseline within 7 days) and/or decreased urine output (<0.5 mL/kg/h for >6h). May be asymptomatic or present with volume overload, uremia, electrolyte derangements.',

  competing_paths: [
    'Prerenal → volume repletion (IV fluids)',
    'Intrinsic renal (ATN) → remove offending agent, supportive care',
    'Postrenal (obstruction) → bladder catheterization or ureteral stenting',
  ],

  hinge_feature: 'FENa + urine sodium + urine microscopy distinguish prerenal (<1%, concentrated urine) from ATN (>2%, muddy brown casts) from obstruction (hydronephrosis on ultrasound)',

  correct_action: 'Step 1: Renal ultrasound to rule out obstruction. Step 2: Urinalysis with microscopy + FENa calculation. Step 3: Treat based on etiology — fluids for prerenal, remove nephrotoxin for ATN, relieve obstruction for postrenal.',

  contraindications: [
    'Do NOT give IV fluids to ATN without volume depletion — will worsen pulmonary edema',
    'Do NOT use FENa if patient is on diuretics — use FEUrea instead (<35% = prerenal)',
    'Do NOT delay renal ultrasound if obstruction is suspected — bilateral obstruction causes anuria',
  ],

  source_citations: [
    'KDIGO 2012 AKI Clinical Practice Guideline',
    '2024 UpToDate: Diagnostic approach to AKI',
    'Lameire et al. Lancet 2023: AKI review',
  ],

  escalation_rule: 'Emergent dialysis indications (mnemonic AEIOU): Acidosis (pH <7.1 refractory), Electrolytes (K >6.5 refractory), Ingestion (toxic alcohol, lithium), Overload (pulmonary edema refractory to diuretics), Uremia (encephalopathy, pericarditis, bleeding)',

  nbme_trap: 'Giving IV fluids to a patient with ATN and volume overload. The FENa >2% tells you the kidneys are damaged — more fluid will not help and will cause pulmonary edema.',

  transfer_rule: 'Always check FENa and renal ultrasound before choosing AKI treatment. Prerenal and ATN look similar on basic labs but have opposite treatments (fluids vs fluid restriction).',

  discriminators: {
    'Prerenal': ['BUN:Cr >20:1', 'FENa <1%', 'urine Na <20 mEq/L', 'concentrated urine Osm >500', 'responds to fluid challenge', 'clinical hypovolemia'],
    'ATN': ['BUN:Cr 10-15:1', 'FENa >2%', 'urine Na >40 mEq/L', 'muddy brown casts', 'isosthenuria ~1.010', 'does not respond to fluids'],
    'Postrenal': ['hydronephrosis on ultrasound', 'elevated post-void residual', 'BPH or pelvic mass history', 'sudden anuria (bilateral obstruction)', 'fluctuating urine output'],
  },

  fact_rows: [
    { fact_type: 'diagnostic_criterion', fact_text: 'KDIGO AKI staging: Stage 1 = Cr increase ≥0.3 mg/dL in 48h or 1.5-1.9× baseline. Stage 2 = 2.0-2.9× baseline. Stage 3 = ≥3.0× baseline or Cr ≥4.0 or initiation of RRT.', threshold_value: '≥0.3 mg/dL in 48h or 1.5× in 7d', source_name: 'KDIGO 2012', source_tier: 'A', confidence: 'high' },
    { fact_type: 'diagnostic_criterion', fact_text: 'FENa = (urine Na × plasma Cr) / (plasma Na × urine Cr) × 100. FENa <1% = prerenal. FENa >2% = intrinsic/ATN. EXCEPTION: diuretics invalidate FENa — use FEUrea (<35% prerenal, >50% intrinsic).', threshold_value: '<1% prerenal, >2% intrinsic', source_name: 'KDIGO 2012', source_tier: 'A', confidence: 'high' },
    { fact_type: 'diagnostic_criterion', fact_text: 'Urine microscopy: muddy brown granular casts = ATN. RBC casts = glomerulonephritis. WBC casts = interstitial nephritis or pyelonephritis. Bland sediment = prerenal or postrenal.', threshold_value: null, source_name: 'UpToDate: AKI diagnosis 2024', source_tier: 'B', confidence: 'high' },
    { fact_type: 'management_step', fact_text: 'Renal ultrasound should be performed in all AKI patients when etiology is unclear. Primary purpose: rule out obstruction (hydronephrosis). Normal kidneys do not exclude AKI.', threshold_value: null, source_name: 'KDIGO 2012', source_tier: 'A', confidence: 'high' },
    { fact_type: 'management_step', fact_text: 'Prerenal AKI treatment: isotonic crystalloid (NS or LR) bolus, target MAP ≥65 mmHg, hold nephrotoxins (NSAIDs, ACE-i/ARBs, aminoglycosides), monitor urine output for response.', threshold_value: 'MAP ≥65 mmHg', source_name: 'KDIGO 2012', source_tier: 'A', confidence: 'high' },
    { fact_type: 'management_step', fact_text: 'Emergent dialysis indications (AEIOU): refractory Acidosis (pH <7.1), refractory hyperKalemia (K >6.5), toxic Ingestions, refractory fluid Overload, symptomatic Uremia (encephalopathy, pericarditis, bleeding)', threshold_value: null, source_name: 'KDIGO 2012', source_tier: 'A', confidence: 'high' },
  ],

  question_blueprints: [
    // Diagnosis × 2
    {
      task_type: 'diagnosis',
      scenario_seed: 'Prerenal vs ATN: post-surgical patient with rising Cr, hypotension, tachycardia, FENa 0.5%',
      target_confusion: ['Prerenal AKI', 'Intrinsic/ATN'],
      hinge_clue: 'FENa 0.5% + concentrated urine + responds to fluid bolus → prerenal',
      target_cognitive_error: 'premature_closure',
      transfer_rule: 'FENa <1% with concentrated urine = prerenal AKI. The kidney is working correctly — it is retaining sodium because of low perfusion.',
    },
    {
      task_type: 'diagnosis',
      scenario_seed: 'ATN presentation: patient on gentamicin for 10 days, Cr rising, muddy brown casts',
      target_confusion: ['Prerenal AKI', 'Intrinsic/ATN'],
      hinge_clue: 'FENa 3.5% + muddy brown casts + nephrotoxic drug exposure → ATN',
      target_cognitive_error: 'treating_labs_instead_of_patient',
      transfer_rule: 'FENa >2% with muddy brown casts = ATN. The kidney is damaged — do NOT give fluids if volume replete.',
    },

    // Next step × 3
    {
      task_type: 'next_step',
      scenario_seed: 'New AKI, unknown cause. Question: what to order first — FENa, renal US, or urine culture',
      target_confusion: ['Prerenal AKI', 'Postrenal/Obstructive', 'Intrinsic/ATN'],
      hinge_clue: 'Renal ultrasound first — must rule out obstruction (treatable and time-sensitive) before biochemical workup',
      target_cognitive_error: 'skipping_required_diagnostic_step',
      transfer_rule: 'In AKI of unknown cause, always get renal ultrasound first to rule out obstruction. Obstruction is reversible if caught early.',
    },
    {
      task_type: 'next_step',
      scenario_seed: 'AKI patient on furosemide. FENa is 2.8%. Question: is this prerenal or ATN?',
      target_confusion: ['Prerenal AKI', 'Intrinsic/ATN'],
      hinge_clue: 'Patient is on diuretics → FENa is unreliable → use FEUrea instead',
      target_cognitive_error: 'wrong_algorithm_branch',
      transfer_rule: 'Diuretics invalidate FENa by increasing urine sodium. Use FEUrea instead (<35% = prerenal, >50% = intrinsic).',
    },
    {
      task_type: 'next_step',
      scenario_seed: 'AKI with K 6.8, peaked T waves, widened QRS. Question: IV calcium vs insulin/glucose vs dialysis',
      target_confusion: ['Prerenal AKI', 'Intrinsic/ATN'],
      hinge_clue: 'K 6.8 with ECG changes → IV calcium FIRST (membrane stabilization), then insulin/glucose (K shift), then consider dialysis',
      target_cognitive_error: 'wrong_algorithm_branch',
      transfer_rule: 'Hyperkalemia with ECG changes: IV calcium gluconate first (stabilize membrane), then shift K with insulin/glucose. Calcium does NOT lower K — it prevents arrhythmia.',
    },

    // Management × 2
    {
      task_type: 'management',
      scenario_seed: 'Prerenal AKI: which fluid to give (NS vs LR vs albumin), and when to stop',
      target_confusion: ['Prerenal AKI'],
      hinge_clue: 'Isotonic crystalloid (NS or LR); stop when urine output improves and Cr trends down',
      target_cognitive_error: 'reflex_response_to_finding',
      transfer_rule: 'Fluid resuscitation for prerenal AKI uses isotonic crystalloid. Monitor urine output as the response indicator — not Cr (which lags).',
    },
    {
      task_type: 'management',
      scenario_seed: 'Contrast nephropathy prevention: patient with CKD needs CT with contrast',
      target_confusion: ['Prerenal AKI', 'Intrinsic/ATN'],
      hinge_clue: 'Pre-hydration with IV NS before and after contrast is the primary prevention strategy',
      target_cognitive_error: 'over_testing',
      transfer_rule: 'Contrast nephropathy prevention = IV hydration before and after. NAC has no proven benefit. Hold metformin. Minimize contrast volume.',
    },

    // Complication × 1
    {
      task_type: 'complication',
      scenario_seed: 'AKI patient develops pulmonary edema, pH 7.08, K 7.2, altered mental status despite medical management',
      target_confusion: ['Prerenal AKI', 'Intrinsic/ATN'],
      hinge_clue: 'Refractory acidosis + refractory hyperkalemia + volume overload + uremic encephalopathy → emergent dialysis (AEIOU)',
      target_cognitive_error: 'under_triage',
      transfer_rule: 'Emergent dialysis for AEIOU: refractory Acidosis, refractory Electrolytes (K), toxic Ingestion, refractory Overload, symptomatic Uremia.',
    },
  ],
};

// ═══════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════

export const GOLD_CARDS = [GOLD_CARD_PE, GOLD_CARD_ACS, GOLD_CARD_AKI];

export const TIER_1_TOPICS = [
  // Cardio
  'Acute Coronary Syndrome',
  'Aortic Dissection',
  'Heart Failure Exacerbation',
  'Arrhythmias (Afib)',
  'Syncope',
  // Pulm
  'Pulmonary Embolism',
  'Pneumonia',
  'COPD Exacerbation',
  'Asthma Exacerbation',
  'Pneumothorax',
  // Renal/Endo/GI
  'Acute Kidney Injury',
  'Electrolyte Disorders',
  'DKA vs HHS',
  'GI Bleed',
  'Pancreatitis',
];
