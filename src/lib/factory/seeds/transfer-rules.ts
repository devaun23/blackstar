export interface TransferRuleSeed {
  rule_text: string;
  category: string;
  trigger_pattern: string;
  action_priority: string;
  suppressions: string[];
  wrong_pathways: {
    pathway: string;
    error: string;
    why_wrong: string;
  }[];
  contexts: {
    topic: string;
    clinical_setting: string;
    specific_example: string;
  }[];
  source_citation: string;
}

export const transferRules: TransferRuleSeed[] = [
  // ═══════════════════════════════════════
  //  MANAGEMENT PRIORITY (8)
  // ═══════════════════════════════════════
  {
    rule_text: 'Stabilize hemodynamically unstable patients before diagnostic workup',
    category: 'management_priority',
    trigger_pattern: 'SBP <90, HR >120, altered mental status, signs of shock',
    action_priority: '1-stabilize',
    suppressions: ['CT imaging', 'Elective procedures', 'Non-emergent consults'],
    wrong_pathways: [
      { pathway: 'Order CT before stabilizing', error: 'over_testing', why_wrong: 'Patient may decompensate during transport to scanner' },
      { pathway: 'Obtain full lab panel before intervention', error: 'skipping_required_diagnostic_step', why_wrong: 'Labs should not delay resuscitation' },
    ],
    contexts: [
      { topic: 'GI Bleed', clinical_setting: 'ed', specific_example: 'Massive upper GI bleed: IV access + fluids + type and cross before endoscopy' },
      { topic: 'Pulmonary Embolism', clinical_setting: 'ed', specific_example: 'Massive PE with hypotension: IV fluids + heparin before CTPA' },
      { topic: 'Sepsis', clinical_setting: 'ed', specific_example: 'Septic shock: 30 mL/kg crystalloid bolus + vasopressors before source imaging' },
    ],
    source_citation: 'ACLS Guidelines 2020, Surviving Sepsis Campaign 2021',
  },
  {
    rule_text: 'Secure the airway before addressing all other problems',
    category: 'management_priority',
    trigger_pattern: 'GCS ≤8, inability to protect airway, impending respiratory failure',
    action_priority: '1-stabilize',
    suppressions: ['Diagnostic imaging', 'Definitive treatment', 'Detailed history'],
    wrong_pathways: [
      { pathway: 'Order CT head before intubating GCS 6 patient', error: 'wrong_algorithm_branch', why_wrong: 'Airway loss kills faster than any diagnosis' },
      { pathway: 'Start antibiotics before securing airway in meningitis', error: 'wrong_algorithm_branch', why_wrong: 'Aspiration risk with altered mental status' },
    ],
    contexts: [
      { topic: 'Stroke', clinical_setting: 'ed', specific_example: 'Acute stroke with GCS 7: intubate before CT head' },
      { topic: 'Sepsis', clinical_setting: 'icu', specific_example: 'Septic patient with respiratory failure: intubate before central line' },
      { topic: 'GI Bleed', clinical_setting: 'ed', specific_example: 'Massive hematemesis with desaturation: intubate before endoscopy' },
    ],
    source_citation: 'ATLS 10th Edition, ACLS 2020',
  },
  {
    rule_text: 'Blood cultures before antibiotics, but antibiotics within 1 hour of sepsis recognition',
    category: 'management_priority',
    trigger_pattern: 'Suspected sepsis or septic shock',
    action_priority: '3-treat_emergent',
    suppressions: ['Waiting for culture results', 'Waiting for imaging to find source'],
    wrong_pathways: [
      { pathway: 'Wait for CT to identify source before giving antibiotics', error: 'skipping_required_diagnostic_step', why_wrong: 'Each hour of antibiotic delay increases mortality 7.6%' },
      { pathway: 'Give antibiotics without drawing cultures', error: 'skipping_required_diagnostic_step', why_wrong: 'Cultures guide de-escalation and organism identification' },
    ],
    contexts: [
      { topic: 'Pneumonia', clinical_setting: 'ed', specific_example: 'CAP with SIRS criteria: blood cultures then IV ceftriaxone + azithromycin within 1 hour' },
      { topic: 'Sepsis', clinical_setting: 'ed', specific_example: 'Urosepsis: blood cultures + urine culture then IV piperacillin-tazobactam' },
      { topic: 'Meningitis', clinical_setting: 'ed', specific_example: 'Suspected bacterial meningitis: blood cultures then empiric ceftriaxone + vancomycin + dexamethasone (do not delay for LP)' },
    ],
    source_citation: 'Surviving Sepsis Campaign Guidelines 2021',
  },
  {
    rule_text: 'Treat the patient, not the lab value',
    category: 'management_priority',
    trigger_pattern: 'Abnormal lab in asymptomatic patient without clinical indication for correction',
    action_priority: '7-observe',
    suppressions: ['Aggressive electrolyte correction', 'Emergent imaging for asymptomatic findings'],
    wrong_pathways: [
      { pathway: 'IV potassium for K 3.3 in asymptomatic patient without cardiac history', error: 'treating_labs_instead_of_patient', why_wrong: 'Oral replacement is appropriate for mild asymptomatic hypokalemia' },
      { pathway: 'Aggressive sodium correction for Na 131 without symptoms', error: 'treating_labs_instead_of_patient', why_wrong: 'Rapid correction risks osmotic demyelination syndrome' },
    ],
    contexts: [
      { topic: 'Electrolyte Disorders', clinical_setting: 'inpatient', specific_example: 'Asymptomatic Na 131 in euvolemic patient: fluid restrict, monitor' },
      { topic: 'Endocrine', clinical_setting: 'outpatient', specific_example: 'Mild asymptomatic hypercalcemia (10.8): monitor, not emergent parathyroidectomy' },
      { topic: 'Hematology', clinical_setting: 'inpatient', specific_example: 'Hb 7.5 in stable young patient without symptoms: do not transfuse' },
    ],
    source_citation: 'AABB Transfusion Guidelines 2016, ACG Electrolyte Management 2019',
  },
  {
    rule_text: 'In cardiac arrest, prioritize high-quality CPR over all other interventions',
    category: 'management_priority',
    trigger_pattern: 'Pulseless patient, cardiac arrest',
    action_priority: '1-stabilize',
    suppressions: ['Advanced airway before CPR', 'Lab draws during active arrest', 'Detailed history taking'],
    wrong_pathways: [
      { pathway: 'Pause CPR to obtain IV access', error: 'wrong_algorithm_branch', why_wrong: 'Chest compressions maintain perfusion; interruptions worsen outcomes' },
      { pathway: 'Intubate before starting compressions', error: 'wrong_algorithm_branch', why_wrong: 'BVM ventilation is adequate initially; compressions take priority' },
    ],
    contexts: [
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Witnessed VFib arrest: immediate CPR + defibrillation before epinephrine' },
      { topic: 'Pulmonary Embolism', clinical_setting: 'ed', specific_example: 'PE-related PEA arrest: CPR + consider thrombolytics' },
      { topic: 'Electrolyte Disorders', clinical_setting: 'icu', specific_example: 'Hyperkalemia-related arrest: CPR + IV calcium + sodium bicarb' },
    ],
    source_citation: 'AHA ACLS Guidelines 2020',
  },
  {
    rule_text: 'Decompress tension pneumothorax clinically, do not wait for imaging',
    category: 'management_priority',
    trigger_pattern: 'Unilateral absent breath sounds + hypotension + tracheal deviation',
    action_priority: '1-stabilize',
    suppressions: ['Chest X-ray', 'CT scan', 'ABG'],
    wrong_pathways: [
      { pathway: 'Order portable CXR to confirm diagnosis', error: 'over_testing', why_wrong: 'Tension pneumo is a clinical diagnosis; imaging delays decompression' },
      { pathway: 'Start IV fluids first for hypotension', error: 'wrong_algorithm_branch', why_wrong: 'Hypotension is obstructive, not hypovolemic; fluids will not help' },
    ],
    contexts: [
      { topic: 'Trauma', clinical_setting: 'ed', specific_example: 'Penetrating chest trauma with absent right breath sounds and hypotension: needle decompression' },
      { topic: 'Pulmonology', clinical_setting: 'icu', specific_example: 'Ventilated patient with sudden hypotension and absent left breath sounds: immediate decompression' },
    ],
    source_citation: 'ATLS 10th Edition',
  },
  {
    rule_text: 'Give epinephrine immediately in anaphylaxis, do not substitute antihistamines',
    category: 'management_priority',
    trigger_pattern: 'Acute allergic reaction with hypotension, airway swelling, or respiratory compromise',
    action_priority: '1-stabilize',
    suppressions: ['Oral antihistamines alone', 'Corticosteroids alone', 'Watchful waiting'],
    wrong_pathways: [
      { pathway: 'Give IV diphenhydramine instead of IM epinephrine', error: 'wrong_algorithm_branch', why_wrong: 'Antihistamines are adjunctive, not first-line for anaphylaxis' },
      { pathway: 'Give IV steroids and observe', error: 'under_triage', why_wrong: 'Steroids take hours to work; epinephrine is the only first-line agent' },
    ],
    contexts: [
      { topic: 'Allergy/Immunology', clinical_setting: 'ed', specific_example: 'Bee sting with lip swelling and wheeze: IM epinephrine 0.3mg' },
      { topic: 'Allergy/Immunology', clinical_setting: 'outpatient', specific_example: 'Food allergy with hives progressing to dyspnea: IM epi-pen, call 911' },
    ],
    source_citation: 'WAO Anaphylaxis Guidelines 2020, ACAAI Guidelines',
  },
  {
    rule_text: 'Target MAP ≥65 mmHg in septic shock with vasopressors after adequate fluid resuscitation',
    category: 'management_priority',
    trigger_pattern: 'Septic shock with hypotension refractory to 30 mL/kg fluid bolus',
    action_priority: '1-stabilize',
    suppressions: ['Continued fluid boluses beyond 30 mL/kg without reassessment', 'Withholding vasopressors'],
    wrong_pathways: [
      { pathway: 'Continue aggressive IV fluids without starting vasopressors', error: 'wrong_algorithm_branch', why_wrong: 'Fluid overload worsens outcomes; vasopressors should start if MAP remains <65 after initial bolus' },
      { pathway: 'Wait for CVP target before starting vasopressors', error: 'over_testing', why_wrong: 'CVP is unreliable for assessing volume status; clinical response guides therapy' },
    ],
    contexts: [
      { topic: 'Sepsis', clinical_setting: 'icu', specific_example: 'MAP 55 after 2L crystalloid: start norepinephrine (first-line vasopressor)' },
      { topic: 'Sepsis', clinical_setting: 'ed', specific_example: 'Urosepsis with persistent hypotension: norepinephrine via peripheral IV if central line will delay' },
    ],
    source_citation: 'Surviving Sepsis Campaign 2021',
  },

  // ═══════════════════════════════════════
  //  DIAGNOSTIC THRESHOLD (8)
  // ═══════════════════════════════════════
  {
    rule_text: 'D-dimer is only useful to EXCLUDE PE in LOW pre-test probability patients',
    category: 'diagnostic_threshold',
    trigger_pattern: 'Suspected PE with Wells score assessment',
    action_priority: '4-diagnose_standard',
    suppressions: ['D-dimer in high-probability patients', 'D-dimer when CTPA is indicated anyway'],
    wrong_pathways: [
      { pathway: 'Order D-dimer in Wells score >6 patient', error: 'over_testing', why_wrong: 'High pre-test probability requires CTPA regardless of D-dimer' },
      { pathway: 'Use standard D-dimer cutoff in 75-year-old', error: 'reflex_response_to_finding', why_wrong: 'Age-adjusted cutoff (age × 10 ng/mL) reduces false positives in elderly; but only valid in LOW probability patients' },
    ],
    contexts: [
      { topic: 'Pulmonary Embolism', clinical_setting: 'ed', specific_example: 'Wells 2 (low): D-dimer negative → PE excluded. Wells 2 with elevated D-dimer → CTPA' },
      { topic: 'Pulmonary Embolism', clinical_setting: 'ed', specific_example: 'Post-surgical patient with Wells 7 (high): skip D-dimer, go straight to CTPA' },
    ],
    source_citation: 'ACEP Clinical Policy on PE 2018, ESC PE Guidelines 2019',
  },
  {
    rule_text: 'Clinical override conditions (recent surgery, pregnancy, active cancer) supersede scoring thresholds',
    category: 'diagnostic_threshold',
    trigger_pattern: 'Patient with major risk factor AND clinical suspicion despite reassuring score',
    action_priority: '2-diagnose_emergent',
    suppressions: ['Dismissing clinical concern based on score alone'],
    wrong_pathways: [
      { pathway: 'Use age-adjusted D-dimer to rule out PE in post-surgical patient', error: 'reflex_response_to_finding', why_wrong: 'Recent major surgery is a strong PE risk factor that overrides D-dimer thresholds' },
      { pathway: 'Discharge chest pain patient with HEART score 3 who is 2 weeks post-CABG', error: 'under_triage', why_wrong: 'Post-surgical state elevates pre-test probability beyond what scores capture' },
    ],
    contexts: [
      { topic: 'Pulmonary Embolism', clinical_setting: 'ed', specific_example: '5 days post-knee replacement with dyspnea: CTPA regardless of Wells or D-dimer' },
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Pregnant woman with chest pain: standard troponin workup (pregnancy does not protect from ACS)' },
    ],
    source_citation: 'ACEP, AHA/ACC Guidelines, ACOG',
  },
  {
    rule_text: 'Two contiguous leads with ST elevation ≥1mm defines STEMI regardless of troponin',
    category: 'diagnostic_threshold',
    trigger_pattern: 'Chest pain + ECG with ST elevation pattern',
    action_priority: '2-diagnose_emergent',
    suppressions: ['Waiting for troponin results', 'Serial ECGs before cath lab activation'],
    wrong_pathways: [
      { pathway: 'Wait for troponin elevation before activating cath lab', error: 'over_testing', why_wrong: 'STEMI is an ECG diagnosis; troponin lags behind by hours' },
      { pathway: 'Repeat ECG in 15 minutes to confirm', error: 'skipping_required_diagnostic_step', why_wrong: 'Door-to-balloon time starts at first medical contact; delays worsen outcomes' },
    ],
    contexts: [
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Chest pain + 2mm ST elevation in V1-V4, troponin pending: activate cath lab NOW' },
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Chest pain + ST elevation in II, III, aVF with normal initial troponin: still STEMI, activate cath lab' },
    ],
    source_citation: 'AHA/ACC STEMI Guidelines 2013 (reaffirmed 2022)',
  },
  {
    rule_text: 'Lipase >3x upper limit of normal with characteristic pain confirms acute pancreatitis (2 of 3 criteria)',
    category: 'diagnostic_threshold',
    trigger_pattern: 'Epigastric pain with suspected pancreatic etiology',
    action_priority: '4-diagnose_standard',
    suppressions: ['CT abdomen for uncomplicated pancreatitis at presentation', 'ERCP without evidence of choledocholithiasis'],
    wrong_pathways: [
      { pathway: 'Order CT abdomen immediately for typical pancreatitis presentation', error: 'over_testing', why_wrong: 'CT is only indicated if diagnosis is uncertain or for suspected complications after 48-72 hours' },
      { pathway: 'Diagnose pancreatitis with lipase 1.5x ULN', error: 'wrong_algorithm_branch', why_wrong: 'Threshold is 3x ULN; lower elevations are nonspecific' },
    ],
    contexts: [
      { topic: 'Acute Pancreatitis', clinical_setting: 'ed', specific_example: 'Epigastric pain + lipase 5x ULN: confirmed pancreatitis, supportive care' },
      { topic: 'Acute Pancreatitis', clinical_setting: 'inpatient', specific_example: 'Day 3 with new fever and worsening pain: now CT abdomen is indicated (rule out necrosis)' },
    ],
    source_citation: 'ACG Guidelines on Acute Pancreatitis 2013 (revised 2024), Atlanta Classification',
  },
  {
    rule_text: 'CURB-65 ≥2 or PSI Class IV-V warrants hospital admission for CAP',
    category: 'diagnostic_threshold',
    trigger_pattern: 'Community-acquired pneumonia requiring disposition decision',
    action_priority: '9-disposition',
    suppressions: ['Discharging high-risk pneumonia patients'],
    wrong_pathways: [
      { pathway: 'Discharge 78-year-old with CAP, BUN 25, confused', error: 'under_triage', why_wrong: 'CURB-65 = 3 (confusion + urea + age) → ICU-level care' },
      { pathway: 'Admit young healthy patient with CURB-65 of 0', error: 'premature_escalation', why_wrong: 'Low-risk CAP should be treated as outpatient' },
    ],
    contexts: [
      { topic: 'Pneumonia', clinical_setting: 'ed', specific_example: 'CURB-65 = 0 in 35-year-old: outpatient amoxicillin or doxycycline' },
      { topic: 'Pneumonia', clinical_setting: 'ed', specific_example: 'CURB-65 = 3 in 72-year-old: ICU admission, IV ceftriaxone + azithromycin' },
    ],
    source_citation: 'ATS/IDSA CAP Guidelines 2019',
  },
  {
    rule_text: 'Glasgow Coma Scale ≤8 = definitive airway (intubation)',
    category: 'diagnostic_threshold',
    trigger_pattern: 'Altered mental status with depressed consciousness',
    action_priority: '1-stabilize',
    suppressions: ['Nasopharyngeal airway alone', 'Wait-and-see approach', 'Attempting to obtain history'],
    wrong_pathways: [
      { pathway: 'Place nasopharyngeal airway and observe GCS 7 patient', error: 'under_triage', why_wrong: 'GCS ≤8 indicates inability to protect airway; aspiration risk is high' },
      { pathway: 'Order CT head before intubating', error: 'wrong_algorithm_branch', why_wrong: 'Airway must be secured first; imaging after stabilization' },
    ],
    contexts: [
      { topic: 'Stroke', clinical_setting: 'ed', specific_example: 'Large MCA stroke with GCS 6: intubate, then CT' },
      { topic: 'Trauma', clinical_setting: 'ed', specific_example: 'TBI with GCS 7: intubate during primary survey' },
      { topic: 'Toxicology', clinical_setting: 'ed', specific_example: 'Opioid overdose unresponsive to naloxone, GCS 4: intubate' },
    ],
    source_citation: 'ATLS 10th Edition',
  },
  {
    rule_text: 'CHA2DS2-VASc score determines anticoagulation need in non-valvular atrial fibrillation',
    category: 'diagnostic_threshold',
    trigger_pattern: 'New or known atrial fibrillation, assessing stroke risk',
    action_priority: '6-treat_standard',
    suppressions: ['Anticoagulating without checking score', 'Withholding anticoagulation in high-risk patients'],
    wrong_pathways: [
      { pathway: 'Start anticoagulation reflexively for any new AFib', error: 'reflex_response_to_finding', why_wrong: 'Young patient with lone AFib (score 0) may not need anticoagulation' },
      { pathway: 'Use aspirin instead of anticoagulation for CHA2DS2-VASc ≥2', error: 'wrong_algorithm_branch', why_wrong: 'Aspirin is no longer recommended; DOAC or warfarin for score ≥2' },
    ],
    contexts: [
      { topic: 'Atrial Fibrillation', clinical_setting: 'outpatient', specific_example: 'CHA2DS2-VASc 0 in 45-year-old male: no anticoagulation needed' },
      { topic: 'Atrial Fibrillation', clinical_setting: 'inpatient', specific_example: 'CHA2DS2-VASc 4 in 72-year-old with HTN + diabetes: start apixaban' },
    ],
    source_citation: 'AHA/ACC/HRS AFib Guidelines 2023',
  },
  {
    rule_text: 'Lactate >4 mmol/L indicates tissue hypoperfusion and warrants aggressive resuscitation',
    category: 'diagnostic_threshold',
    trigger_pattern: 'Elevated lactate in critically ill patient',
    action_priority: '1-stabilize',
    suppressions: ['Dismissing elevated lactate as lab error', 'Waiting for repeat lactate before acting'],
    wrong_pathways: [
      { pathway: 'Repeat lactate before starting resuscitation', error: 'over_testing', why_wrong: 'Lactate >4 requires immediate action; delays worsen mortality' },
      { pathway: 'Attribute lactate to medication effect without clinical assessment', error: 'treating_labs_instead_of_patient', why_wrong: 'Must rule out tissue hypoperfusion before blaming medication' },
    ],
    contexts: [
      { topic: 'Sepsis', clinical_setting: 'ed', specific_example: 'Lactate 5.2 with suspected UTI: aggressive fluids + antibiotics + ICU admission' },
      { topic: 'GI Bleed', clinical_setting: 'ed', specific_example: 'Lactate 4.5 with melena: indicates significant blood loss, resuscitate aggressively' },
    ],
    source_citation: 'Surviving Sepsis Campaign 2021',
  },

  // ═══════════════════════════════════════
  //  CONTRAINDICATION OVERRIDE (6)
  // ═══════════════════════════════════════
  {
    rule_text: 'Beta-blockers are contraindicated in acute decompensated heart failure with cardiogenic shock',
    category: 'contraindication_override',
    trigger_pattern: 'CHF exacerbation with hypotension or signs of low cardiac output',
    action_priority: '1-stabilize',
    suppressions: ['Continuing home beta-blocker dose', 'Starting new beta-blocker'],
    wrong_pathways: [
      { pathway: 'Continue metoprolol because patient takes it at home', error: 'reflex_response_to_finding', why_wrong: 'Beta-blockers reduce cardiac output further in decompensated state' },
      { pathway: 'Start carvedilol for rate control', error: 'wrong_algorithm_branch', why_wrong: 'Rate control in acute decompensated CHF uses digoxin or amiodarone, not beta-blockers' },
    ],
    contexts: [
      { topic: 'Heart Failure', clinical_setting: 'icu', specific_example: 'Acute CHF with SBP 78: hold beta-blocker, start dobutamine' },
      { topic: 'Heart Failure', clinical_setting: 'ed', specific_example: 'Flash pulmonary edema with SBP 82: IV nitroglycerin + diuretics, hold all beta-blockers' },
    ],
    source_citation: 'AHA/ACC Heart Failure Guidelines 2022',
  },
  {
    rule_text: 'tPA is contraindicated in stroke if onset >4.5 hours or hemorrhage on CT',
    category: 'contraindication_override',
    trigger_pattern: 'Acute stroke with consideration for thrombolysis',
    action_priority: '3-treat_emergent',
    suppressions: ['tPA administration', 'Delaying CT to give tPA faster'],
    wrong_pathways: [
      { pathway: 'Give tPA for stroke with 6-hour symptom onset', error: 'wrong_algorithm_branch', why_wrong: 'tPA window is strictly ≤4.5 hours; beyond this, risk outweighs benefit' },
      { pathway: 'Give tPA before non-contrast CT head', error: 'skipping_required_diagnostic_step', why_wrong: 'Must rule out hemorrhagic stroke first — tPA would be fatal' },
    ],
    contexts: [
      { topic: 'Stroke', clinical_setting: 'ed', specific_example: 'Ischemic stroke, last seen normal 3 hours ago, negative CT: give tPA' },
      { topic: 'Stroke', clinical_setting: 'ed', specific_example: 'ICH on CT: no tPA, reverse anticoagulation if applicable, neurosurgery consult' },
    ],
    source_citation: 'AHA/ASA Stroke Guidelines 2019',
  },
  {
    rule_text: 'ACE inhibitors are contraindicated in pregnancy (teratogenic)',
    category: 'contraindication_override',
    trigger_pattern: 'Pregnant patient needing antihypertensive or patient planning pregnancy',
    action_priority: '6-treat_standard',
    suppressions: ['ACE inhibitors', 'ARBs', 'Direct renin inhibitors'],
    wrong_pathways: [
      { pathway: 'Continue lisinopril in newly pregnant hypertensive patient', error: 'reflex_response_to_finding', why_wrong: 'ACE inhibitors cause renal agenesis, oligohydramnios, skull defects in fetus' },
      { pathway: 'Switch to losartan (ARB) in pregnancy', error: 'wrong_algorithm_branch', why_wrong: 'ARBs carry the same teratogenic risk as ACE inhibitors' },
    ],
    contexts: [
      { topic: 'Obstetrics', clinical_setting: 'outpatient', specific_example: 'Switch lisinopril to labetalol or nifedipine in pregnancy' },
      { topic: 'Nephrology', clinical_setting: 'outpatient', specific_example: 'Woman planning pregnancy with CKD on ACEi: switch before conception' },
    ],
    source_citation: 'ACOG Practice Bulletin, FDA Category D',
  },
  {
    rule_text: 'Metformin must be held before and after iodinated contrast administration with eGFR <30',
    category: 'contraindication_override',
    trigger_pattern: 'Diabetic patient on metformin requiring contrast-enhanced imaging',
    action_priority: '7-observe',
    suppressions: ['Continuing metformin through contrast study without renal check'],
    wrong_pathways: [
      { pathway: 'Give contrast CT without checking renal function in metformin patient', error: 'skipping_required_diagnostic_step', why_wrong: 'Contrast + metformin + renal impairment → lactic acidosis risk' },
      { pathway: 'Refuse all contrast imaging in metformin patients', error: 'premature_escalation', why_wrong: 'If eGFR >30, contrast can be given safely; hold metformin 48h post-contrast and recheck creatinine' },
    ],
    contexts: [
      { topic: 'Endocrine', clinical_setting: 'inpatient', specific_example: 'Diabetic with eGFR 25 needing CT: hold metformin, use contrast cautiously' },
      { topic: 'Pulmonary Embolism', clinical_setting: 'ed', specific_example: 'Metformin patient needing CTPA: check creatinine first, hold metformin if eGFR <30' },
    ],
    source_citation: 'ACR Manual on Contrast Media 2023',
  },
  {
    rule_text: 'NSAIDs are contraindicated in AKI and advanced CKD',
    category: 'contraindication_override',
    trigger_pattern: 'Pain management in patient with renal impairment',
    action_priority: '6-treat_standard',
    suppressions: ['NSAIDs', 'COX-2 inhibitors'],
    wrong_pathways: [
      { pathway: 'Prescribe ibuprofen for gout flare in patient with Cr 3.5', error: 'reflex_response_to_finding', why_wrong: 'NSAIDs cause afferent arteriole vasoconstriction, worsening renal function' },
      { pathway: 'Use celecoxib thinking COX-2 selectivity protects kidneys', error: 'wrong_algorithm_branch', why_wrong: 'COX-2 inhibitors carry the same renal risk as non-selective NSAIDs' },
    ],
    contexts: [
      { topic: 'Rheumatology', clinical_setting: 'inpatient', specific_example: 'Gout flare + AKI: colchicine or steroids, NOT NSAIDs' },
      { topic: 'Nephrology', clinical_setting: 'outpatient', specific_example: 'CKD stage 4 with osteoarthritis: acetaminophen, not naproxen' },
    ],
    source_citation: 'KDIGO AKI Guidelines 2012, ACR Gout Guidelines 2020',
  },
  {
    rule_text: 'Do not give succinylcholine in hyperkalemia, burns >24h, crush injury, or denervation injuries',
    category: 'contraindication_override',
    trigger_pattern: 'Rapid sequence intubation in patient with risk for succinylcholine-induced hyperkalemia',
    action_priority: '1-stabilize',
    suppressions: ['Succinylcholine'],
    wrong_pathways: [
      { pathway: 'Use succinylcholine for RSI in burn patient day 3', error: 'reflex_response_to_finding', why_wrong: 'Upregulated acetylcholine receptors → massive potassium release → cardiac arrest' },
      { pathway: 'Use succinylcholine in patient with K 6.5', error: 'under_triage', why_wrong: 'Succinylcholine raises K by 0.5-1.0 mEq/L; fatal in hyperkalemia' },
    ],
    contexts: [
      { topic: 'Anesthesia', clinical_setting: 'ed', specific_example: 'RSI in hyperkalemic patient: use rocuronium instead of succinylcholine' },
      { topic: 'Trauma', clinical_setting: 'ed', specific_example: 'Crush injury 48h old needing intubation: rocuronium (not succinylcholine)' },
    ],
    source_citation: 'Miller\'s Anesthesia, ACLS Guidelines',
  },

  // ═══════════════════════════════════════
  //  TIMING RULE (6)
  // ═══════════════════════════════════════
  {
    rule_text: 'Door-to-balloon time for primary PCI must be <90 minutes',
    category: 'timing_rule',
    trigger_pattern: 'STEMI diagnosis at PCI-capable facility',
    action_priority: '3-treat_emergent',
    suppressions: ['Serial troponins', 'Echocardiography before cath', 'Transfer to another facility if PCI available'],
    wrong_pathways: [
      { pathway: 'Wait for troponin confirmation before cath lab activation', error: 'over_testing', why_wrong: 'STEMI is an ECG diagnosis; troponin confirmation wastes critical time' },
      { pathway: 'Obtain echo to assess wall motion before cath', error: 'over_testing', why_wrong: 'Echo adds no value when ECG already shows STEMI' },
    ],
    contexts: [
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Inferior STEMI at PCI center: activate cath lab from ED, bypass CCU' },
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Anterior STEMI: single-call cath lab activation, target <90 min door-to-balloon' },
    ],
    source_citation: 'AHA/ACC STEMI Guidelines 2013 (reaffirmed 2022)',
  },
  {
    rule_text: 'IV tPA for ischemic stroke must be given within 4.5 hours of symptom onset',
    category: 'timing_rule',
    trigger_pattern: 'Acute ischemic stroke within treatment window',
    action_priority: '3-treat_emergent',
    suppressions: ['MRI before tPA', 'Cardiology consult before tPA', 'Complete lab panel before tPA'],
    wrong_pathways: [
      { pathway: 'Order MRI to characterize infarct before giving tPA', error: 'over_testing', why_wrong: 'Non-contrast CT is sufficient to exclude hemorrhage; MRI delays treatment' },
      { pathway: 'Wait for complete CBC and BMP before tPA', error: 'over_testing', why_wrong: 'Only glucose and CT are required before tPA; other labs can result after' },
    ],
    contexts: [
      { topic: 'Stroke', clinical_setting: 'ed', specific_example: 'Left MCA stroke, 2 hours from onset, negative CT: give tPA immediately' },
      { topic: 'Stroke', clinical_setting: 'ed', specific_example: 'Wake-up stroke with unknown onset time: consider MRI DWI-FLAIR mismatch for extended window' },
    ],
    source_citation: 'AHA/ASA Guidelines 2019',
  },
  {
    rule_text: 'Antibiotics within 1 hour for sepsis, within 45 minutes if meningitis suspected',
    category: 'timing_rule',
    trigger_pattern: 'Suspected severe infection with SIRS criteria or meningeal signs',
    action_priority: '3-treat_emergent',
    suppressions: ['Waiting for LP results in meningitis', 'Waiting for CT before antibiotics in meningitis with no focal neuro deficits'],
    wrong_pathways: [
      { pathway: 'Delay antibiotics until after LP in suspected meningitis', error: 'skipping_required_diagnostic_step', why_wrong: 'If LP will be delayed (CT needed first, or coagulopathy), give antibiotics BEFORE LP' },
      { pathway: 'Wait for blood culture results before choosing antibiotics', error: 'wrong_algorithm_branch', why_wrong: 'Empiric coverage first; narrow based on culture results later' },
    ],
    contexts: [
      { topic: 'Meningitis', clinical_setting: 'ed', specific_example: 'Fever + nuchal rigidity + altered mental status: blood cultures → antibiotics → CT → LP' },
      { topic: 'Sepsis', clinical_setting: 'ed', specific_example: 'Septic shock from unknown source: blood cultures → broad-spectrum antibiotics within 1 hour' },
    ],
    source_citation: 'IDSA Meningitis Guidelines 2017, Surviving Sepsis Campaign 2021',
  },
  {
    rule_text: 'Fibrinolytics within 30 minutes when PCI is not available within 120 minutes',
    category: 'timing_rule',
    trigger_pattern: 'STEMI at non-PCI capable facility',
    action_priority: '3-treat_emergent',
    suppressions: ['Transfer for PCI if >120 min anticipated', 'Waiting for cardiology consult'],
    wrong_pathways: [
      { pathway: 'Transfer for PCI despite 2.5-hour estimated transport', error: 'wrong_algorithm_branch', why_wrong: 'PCI superiority lost when first-medical-contact-to-device time >120 minutes' },
      { pathway: 'Give heparin only and observe', error: 'under_triage', why_wrong: 'STEMI requires reperfusion therapy; anticoagulation alone is insufficient' },
    ],
    contexts: [
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Rural ED, PCI center 2 hours away: fibrinolytics within 30 min of arrival' },
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'Community hospital, transfer time 90 min: consider PCI if total <120 min' },
    ],
    source_citation: 'AHA/ACC STEMI Guidelines 2013 (reaffirmed 2022)',
  },
  {
    rule_text: 'Appendectomy within 24 hours of diagnosis for uncomplicated appendicitis',
    category: 'timing_rule',
    trigger_pattern: 'Confirmed acute appendicitis on imaging or clinical criteria',
    action_priority: '3-treat_emergent',
    suppressions: ['Serial imaging', 'Prolonged antibiotic trial without surgical plan'],
    wrong_pathways: [
      { pathway: 'Discharge with oral antibiotics for confirmed appendicitis', error: 'under_triage', why_wrong: 'Uncomplicated appendicitis requires surgery; antibiotics-alone approach has high recurrence rate' },
      { pathway: 'Wait 48 hours for surgical scheduling', error: 'under_triage', why_wrong: 'Delay beyond 24 hours increases perforation risk' },
    ],
    contexts: [
      { topic: 'Surgery', clinical_setting: 'ed', specific_example: 'CT-confirmed appendicitis in 25-year-old: surgical consult for appendectomy within 24h' },
      { topic: 'Surgery', clinical_setting: 'inpatient', specific_example: 'Perforated appendicitis with abscess: antibiotics + IR drainage first, interval appendectomy later' },
    ],
    source_citation: 'SAGES/EAES Guidelines on Appendicitis 2021',
  },
  {
    rule_text: 'Therapeutic hypothermia (TTM) within 6 hours post-cardiac arrest for comatose survivors',
    category: 'timing_rule',
    trigger_pattern: 'Return of spontaneous circulation after cardiac arrest, patient remains comatose',
    action_priority: '3-treat_emergent',
    suppressions: ['Waiting for EEG before starting TTM', 'Waiting for full neurological assessment'],
    wrong_pathways: [
      { pathway: 'Wait for EEG before initiating cooling', error: 'over_testing', why_wrong: 'TTM should start within 6 hours; EEG can be obtained during cooling' },
      { pathway: 'Skip TTM because patient has some purposeful movements', error: 'under_triage', why_wrong: 'Incomplete neurological recovery still benefits from temperature management' },
    ],
    contexts: [
      { topic: 'Critical Care', clinical_setting: 'icu', specific_example: 'VFib arrest → ROSC → GCS 6: initiate TTM targeting 33-36°C for 24 hours' },
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'icu', specific_example: 'STEMI arrest → PCI → ROSC → comatose: cath + TTM simultaneously' },
    ],
    source_citation: 'AHA Post-Cardiac Arrest Care Guidelines 2020, TTM2 Trial 2021',
  },

  // ═══════════════════════════════════════
  //  SEVERITY ESCALATION (6)
  // ═══════════════════════════════════════
  {
    rule_text: 'ICU admission for any organ failure in sepsis (Sepsis-3 criteria)',
    category: 'severity_escalation',
    trigger_pattern: 'Sepsis with acute organ dysfunction (SOFA increase ≥2)',
    action_priority: '9-disposition',
    suppressions: ['Floor admission for sepsis with organ failure', 'Observation unit for septic shock'],
    wrong_pathways: [
      { pathway: 'Admit sepsis patient with lactate 5.0 and AKI to general medicine floor', error: 'under_triage', why_wrong: 'Organ dysfunction in sepsis requires ICU-level monitoring and intervention' },
      { pathway: 'Discharge patient with qSOFA 2 and improving vitals after 2L fluids', error: 'under_triage', why_wrong: 'Early improvement does not exclude subsequent deterioration' },
    ],
    contexts: [
      { topic: 'Sepsis', clinical_setting: 'ed', specific_example: 'Urosepsis + AKI + lactate 4.8: ICU admission for vasopressor access and monitoring' },
      { topic: 'Pneumonia', clinical_setting: 'ed', specific_example: 'Severe CAP + hypotension + new confusion: ICU admission' },
    ],
    source_citation: 'Surviving Sepsis Campaign 2021, Sepsis-3 Definitions 2016',
  },
  {
    rule_text: 'Intubate for respiratory failure: PaO2 <60 on supplemental O2, PaCO2 >50 with pH <7.25, or severe respiratory distress',
    category: 'severity_escalation',
    trigger_pattern: 'Acute respiratory failure with impending respiratory arrest',
    action_priority: '1-stabilize',
    suppressions: ['Increasing supplemental O2 alone', 'Prolonged BiPAP trial in deteriorating patient'],
    wrong_pathways: [
      { pathway: 'Continue increasing FiO2 on high-flow nasal cannula in patient with worsening work of breathing', error: 'under_triage', why_wrong: 'Exhaustion and crash are imminent; intubate before decompensation' },
      { pathway: 'Trial of BiPAP for 2 hours in patient with pH 7.15', error: 'under_triage', why_wrong: 'Severe acidosis with respiratory failure needs definitive airway' },
    ],
    contexts: [
      { topic: 'COPD', clinical_setting: 'ed', specific_example: 'COPD exacerbation with PaCO2 65, pH 7.22, tiring: intubate' },
      { topic: 'Heart Failure', clinical_setting: 'icu', specific_example: 'Flash pulmonary edema with SpO2 78% on 15L NRB: intubate' },
    ],
    source_citation: 'GOLD Guidelines 2024, ATS/ERS Guidelines',
  },
  {
    rule_text: 'Emergent surgery consult for peritonitis with free air on imaging',
    category: 'severity_escalation',
    trigger_pattern: 'Abdominal pain with signs of peritonitis and free intraperitoneal air',
    action_priority: '1-stabilize',
    suppressions: ['Conservative management', 'Continued diagnostic workup', 'Waiting for cultures'],
    wrong_pathways: [
      { pathway: 'Start IV antibiotics and observe for 24 hours', error: 'under_triage', why_wrong: 'Free air = perforation = surgical emergency; antibiotics alone insufficient' },
      { pathway: 'Order CT abdomen to confirm before calling surgery', error: 'over_testing', why_wrong: 'Free air on upright CXR with peritonitis is sufficient; surgery should be called immediately' },
    ],
    contexts: [
      { topic: 'Surgery', clinical_setting: 'ed', specific_example: 'Perforated duodenal ulcer: free air on CXR → emergent surgery' },
      { topic: 'GI', clinical_setting: 'inpatient', specific_example: 'Toxic megacolon with free air: emergent colectomy' },
    ],
    source_citation: 'WSES Guidelines on Perforated Viscus 2020',
  },
  {
    rule_text: 'Massive transfusion protocol for hemorrhagic shock with ongoing bleeding',
    category: 'severity_escalation',
    trigger_pattern: 'Hemorrhagic shock (SBP <90 despite fluids) with evidence of ongoing blood loss',
    action_priority: '1-stabilize',
    suppressions: ['Waiting for type and cross', 'Giving crystalloid alone for hemorrhagic shock'],
    wrong_pathways: [
      { pathway: 'Continue giving normal saline boluses for hemorrhagic shock', error: 'wrong_algorithm_branch', why_wrong: 'Crystalloid dilutes clotting factors; massive transfusion (1:1:1 ratio) is needed' },
      { pathway: 'Wait for type-specific blood before transfusing', error: 'skipping_required_diagnostic_step', why_wrong: 'Use O-negative uncrossmatched blood immediately; type-specific when available' },
    ],
    contexts: [
      { topic: 'Trauma', clinical_setting: 'ed', specific_example: 'Blunt abdominal trauma + SBP 70: activate MTP, uncrossmatched O-neg blood' },
      { topic: 'GI Bleed', clinical_setting: 'ed', specific_example: 'Variceal bleed + Hb 5 + SBP 78: MTP + octreotide + emergent EGD' },
    ],
    source_citation: 'EAST Practice Management Guidelines, ATLS 10th Edition',
  },
  {
    rule_text: 'Transfer to PCI-capable center for NSTEMI with high-risk features',
    category: 'severity_escalation',
    trigger_pattern: 'NSTEMI with TIMI risk score ≥5, or hemodynamic instability, or refractory chest pain',
    action_priority: '9-disposition',
    suppressions: ['Keeping high-risk NSTEMI at non-PCI capable facility', 'Medical management alone for high-risk NSTEMI'],
    wrong_pathways: [
      { pathway: 'Manage high-risk NSTEMI medically at community hospital without cath capability', error: 'under_triage', why_wrong: 'High-risk NSTEMI benefits from early invasive strategy (cath within 24 hours)' },
      { pathway: 'Treat as STEMI and give thrombolytics', error: 'wrong_algorithm_branch', why_wrong: 'NSTEMI does not benefit from thrombolytics; needs catheterization' },
    ],
    contexts: [
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'ed', specific_example: 'NSTEMI + TIMI 6 + ongoing chest pain: transfer for cath within 24h' },
      { topic: 'Acute Coronary Syndrome', clinical_setting: 'inpatient', specific_example: 'NSTEMI + new heart failure: urgent cath within 2 hours (very high risk)' },
    ],
    source_citation: 'AHA/ACC NSTEMI Guidelines 2014 (updated 2021)',
  },
  {
    rule_text: 'Ranson score ≥3 or BISAP ≥3 in acute pancreatitis warrants ICU admission',
    category: 'severity_escalation',
    trigger_pattern: 'Acute pancreatitis with predicted severe course',
    action_priority: '9-disposition',
    suppressions: ['Floor admission for predicted severe pancreatitis', 'Early ERCP without clear choledocholithiasis'],
    wrong_pathways: [
      { pathway: 'Admit predicted severe pancreatitis to general medicine floor', error: 'under_triage', why_wrong: 'Severe pancreatitis can rapidly develop SIRS, organ failure, and necrosis requiring ICU care' },
      { pathway: 'Perform ERCP within 24 hours for all gallstone pancreatitis', error: 'over_testing', why_wrong: 'Early ERCP only indicated if concurrent cholangitis or persistent biliary obstruction' },
    ],
    contexts: [
      { topic: 'Acute Pancreatitis', clinical_setting: 'ed', specific_example: 'Ranson 4 on admission: ICU admission, aggressive IV hydration, monitor for organ failure' },
      { topic: 'Acute Pancreatitis', clinical_setting: 'inpatient', specific_example: 'BISAP 4 with respiratory distress: ICU for possible intubation' },
    ],
    source_citation: 'ACG Guidelines on Acute Pancreatitis 2013, Atlanta Classification Revised 2012',
  },

  // ═══════════════════════════════════════
  //  TREATMENT SELECTION (6)
  // ═══════════════════════════════════════
  {
    rule_text: 'First-line treatment for CHF with reduced EF: ACE inhibitor/ARB + beta-blocker + diuretic',
    category: 'treatment_selection',
    trigger_pattern: 'Newly diagnosed HFrEF (EF ≤40%) for chronic management',
    action_priority: '6-treat_standard',
    suppressions: ['Calcium channel blockers (verapamil/diltiazem) in HFrEF', 'Digoxin as first-line'],
    wrong_pathways: [
      { pathway: 'Start amlodipine for HFrEF management', error: 'wrong_algorithm_branch', why_wrong: 'Non-dihydropyridine CCBs (verapamil/diltiazem) are contraindicated in HFrEF; amlodipine is safe but not first-line' },
      { pathway: 'Start digoxin before ACEi + beta-blocker', error: 'wrong_algorithm_branch', why_wrong: 'Digoxin is additive therapy, not first-line; mortality benefit comes from ACEi + BB' },
    ],
    contexts: [
      { topic: 'Heart Failure', clinical_setting: 'outpatient', specific_example: 'New HFrEF EF 30%: lisinopril + carvedilol + furosemide' },
      { topic: 'Heart Failure', clinical_setting: 'inpatient', specific_example: 'Stable post-CHF exacerbation: start GDMT before discharge (ACEi + BB + MRA + SGLT2i)' },
    ],
    source_citation: 'AHA/ACC Heart Failure Guidelines 2022, GDMT Protocol',
  },
  {
    rule_text: 'Empiric antibiotics for CAP: outpatient = amoxicillin or doxycycline; inpatient = ceftriaxone + azithromycin',
    category: 'treatment_selection',
    trigger_pattern: 'Community-acquired pneumonia requiring antibiotic selection',
    action_priority: '6-treat_standard',
    suppressions: ['Fluoroquinolone as first-line (reserve for PCN allergy)', 'Vancomycin for uncomplicated CAP'],
    wrong_pathways: [
      { pathway: 'Start levofloxacin for all inpatient CAP', error: 'reflex_response_to_finding', why_wrong: 'Fluoroquinolones reserved for PCN allergy or treatment failure; ceftriaxone + azithromycin is preferred' },
      { pathway: 'Give amoxicillin alone for inpatient pneumonia', error: 'under_triage', why_wrong: 'Inpatient CAP needs broader coverage including atypicals (add azithromycin)' },
    ],
    contexts: [
      { topic: 'Pneumonia', clinical_setting: 'outpatient', specific_example: 'Healthy 35-year-old with CAP: amoxicillin 1g TID or doxycycline' },
      { topic: 'Pneumonia', clinical_setting: 'ed', specific_example: 'Elderly with CAP + CURB-65 = 2: admit, ceftriaxone + azithromycin IV' },
      { topic: 'Pneumonia', clinical_setting: 'icu', specific_example: 'Severe CAP + ICU: ceftriaxone + azithromycin + consider MRSA coverage if risk factors' },
    ],
    source_citation: 'ATS/IDSA CAP Guidelines 2019',
  },
  {
    rule_text: 'IV insulin drip for DKA; do not switch to subcutaneous until anion gap closes',
    category: 'treatment_selection',
    trigger_pattern: 'DKA management with insulin therapy',
    action_priority: '3-treat_emergent',
    suppressions: ['Subcutaneous insulin before gap closure', 'Stopping insulin when glucose normalizes'],
    wrong_pathways: [
      { pathway: 'Stop insulin drip when glucose reaches 200 mg/dL', error: 'wrong_algorithm_branch', why_wrong: 'Glucose normalizes before acidosis resolves; add dextrose to IV fluids and continue insulin' },
      { pathway: 'Switch to subcutaneous insulin when glucose is 180 with AG still 22', error: 'wrong_algorithm_branch', why_wrong: 'Anion gap must close (AG <12) and bicarbonate must recover before transitioning' },
    ],
    contexts: [
      { topic: 'Diabetic Ketoacidosis', clinical_setting: 'icu', specific_example: 'DKA with glucose 450, AG 28: insulin drip 0.1 U/kg/hr + aggressive IV fluids' },
      { topic: 'Diabetic Ketoacidosis', clinical_setting: 'icu', specific_example: 'Glucose 190 but AG still 20: add D5 1/2NS to IVF, continue insulin drip' },
    ],
    source_citation: 'ADA DKA Management Guidelines 2024',
  },
  {
    rule_text: 'Colchicine or steroids (not NSAIDs) for gout in patients with renal impairment',
    category: 'treatment_selection',
    trigger_pattern: 'Acute gout flare in patient with CKD or AKI',
    action_priority: '6-treat_standard',
    suppressions: ['NSAIDs', 'COX-2 inhibitors'],
    wrong_pathways: [
      { pathway: 'Indomethacin for gout flare in patient with Cr 4.0', error: 'reflex_response_to_finding', why_wrong: 'NSAIDs worsen renal function; contraindicated in CKD/AKI' },
      { pathway: 'Allopurinol to treat acute gout flare', error: 'wrong_algorithm_branch', why_wrong: 'Allopurinol is for prophylaxis, not acute treatment; can worsen acute flare' },
    ],
    contexts: [
      { topic: 'Rheumatology', clinical_setting: 'inpatient', specific_example: 'Gout flare + CKD stage 4: low-dose colchicine (adjust for renal) or prednisone' },
      { topic: 'Rheumatology', clinical_setting: 'ed', specific_example: 'Monoarticular arthritis + AKI: joint aspiration (rule out septic) → steroids for gout if confirmed' },
    ],
    source_citation: 'ACR Guidelines for Management of Gout 2020',
  },
  {
    rule_text: 'Norepinephrine is first-line vasopressor for septic shock',
    category: 'treatment_selection',
    trigger_pattern: 'Septic shock requiring vasopressor support',
    action_priority: '1-stabilize',
    suppressions: ['Dopamine as first-line (higher arrhythmia risk)', 'Phenylephrine as first-line'],
    wrong_pathways: [
      { pathway: 'Start dopamine as first-line vasopressor for septic shock', error: 'wrong_algorithm_branch', why_wrong: 'Dopamine has higher arrhythmia risk vs norepinephrine; only preferred in bradycardia' },
      { pathway: 'Start phenylephrine for septic shock', error: 'wrong_algorithm_branch', why_wrong: 'Phenylephrine is pure alpha-agonist; may reduce cardiac output in sepsis' },
    ],
    contexts: [
      { topic: 'Sepsis', clinical_setting: 'icu', specific_example: 'Septic shock after 30mL/kg fluids, MAP 55: start norepinephrine, target MAP ≥65' },
      { topic: 'Sepsis', clinical_setting: 'ed', specific_example: 'Refractory septic shock: norepinephrine + vasopressin (second-line) + stress-dose hydrocortisone' },
    ],
    source_citation: 'Surviving Sepsis Campaign 2021',
  },
  {
    rule_text: 'DOAC over warfarin for non-valvular AFib anticoagulation (unless mechanical valve or severe MS)',
    category: 'treatment_selection',
    trigger_pattern: 'Non-valvular atrial fibrillation requiring anticoagulation',
    action_priority: '6-treat_standard',
    suppressions: ['Warfarin as first-line for non-valvular AFib', 'Aspirin monotherapy for stroke prevention in AFib'],
    wrong_pathways: [
      { pathway: 'Start warfarin for new non-valvular AFib', error: 'wrong_algorithm_branch', why_wrong: 'DOACs (apixaban, rivaroxaban) have better safety profile and no INR monitoring needed' },
      { pathway: 'Prescribe aspirin for stroke prevention in AFib with CHA2DS2-VASc ≥2', error: 'wrong_algorithm_branch', why_wrong: 'Aspirin no longer recommended for AFib stroke prevention; anticoagulation required' },
    ],
    contexts: [
      { topic: 'Atrial Fibrillation', clinical_setting: 'outpatient', specific_example: 'Non-valvular AFib + CHA2DS2-VASc 3: start apixaban 5mg BID' },
      { topic: 'Atrial Fibrillation', clinical_setting: 'inpatient', specific_example: 'Mechanical mitral valve + AFib: warfarin (DOACs contraindicated with mechanical valves)' },
    ],
    source_citation: 'AHA/ACC/HRS AFib Guidelines 2023',
  },
];
