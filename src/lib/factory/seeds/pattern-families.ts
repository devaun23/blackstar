export interface PatternFamilySeed {
  name: string;
  display_name: string;
  description: string;
  structure: string;
  hinge_type: string;
  cognitive_trap: string;
  frequency: 'high' | 'medium';
  examples: {
    topic: string;
    scenario: string;
    hinge: string;
    correct_action: string;
  }[];
  reverse_pattern?: string;
}

export const patternFamilies: PatternFamilySeed[] = [
  // ──────────────────────────────────────────────
  // HIGH FREQUENCY (1–20)
  // ──────────────────────────────────────────────

  {
    name: 'the_stable_mimic',
    display_name: 'The Stable Mimic',
    description:
      'A benign or lower-acuity condition presents with features that closely resemble a dangerous diagnosis. The student must recognize the discriminating detail that rules out the emergency.',
    structure:
      'Vignette presents alarming chief complaint with classic-sounding features. One or two findings break the pattern and point to the benign mimic. Distractors are the emergent workup or treatment.',
    hinge_type: 'physical_exam_sign',
    cognitive_trap: 'premature_closure',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'Young male with sharp pleuritic chest pain and diffuse ST elevations.',
        hinge: 'ST elevations are diffuse and concave-up with PR depression — pericarditis pattern, not territorial STEMI.',
        correct_action: 'NSAIDs and colchicine, not emergent catheterization.',
      },
      {
        topic: 'Neurology',
        scenario: 'Woman with sudden severe headache and neck stiffness after vigorous exercise.',
        hinge: 'CT head and LP are both negative; headache is exertional/benign thunderclap.',
        correct_action: 'Reassurance and follow-up, not angiography for SAH.',
      },
      {
        topic: 'Pulmonology',
        scenario: 'Post-surgical patient with pleuritic chest pain, tachycardia, and mild hypoxia.',
        hinge: 'CT angiogram is negative; presentation is atelectasis with splinting.',
        correct_action: 'Incentive spirometry and mobilization, not anticoagulation.',
      },
    ],
    reverse_pattern: 'the_dangerous_mimic',
  },

  {
    name: 'the_dangerous_mimic',
    display_name: 'The Dangerous Mimic',
    description:
      'A life-threatening condition presents with features that resemble a common, benign diagnosis. The student must catch the subtle red flag that elevates the differential.',
    structure:
      'Vignette reads like a routine complaint. One finding is inconsistent with the benign explanation and points to the dangerous diagnosis. Correct answer is urgent workup or treatment.',
    hinge_type: 'history_pivot',
    cognitive_trap: 'anchoring',
    frequency: 'high',
    examples: [
      {
        topic: 'Vascular Surgery',
        scenario: 'Middle-aged man with acute-onset "tearing" back pain attributed to muscle strain.',
        hinge: 'Blood pressure differential >20 mmHg between arms — aortic dissection.',
        correct_action: 'Stat CT angiography of the chest and IV esmolol.',
      },
      {
        topic: 'Gastroenterology',
        scenario: 'Elderly woman with mild epigastric discomfort and nausea diagnosed as gastritis.',
        hinge: 'ECG shows ST depression in inferior leads — inferior MI with atypical presentation.',
        correct_action: 'Troponins, heparin, and cardiology consult.',
      },
      {
        topic: 'Orthopedics',
        scenario: 'Young athlete with calf pain after long flight, thought to be a muscle cramp.',
        hinge: 'Unilateral leg swelling with pitting edema — deep vein thrombosis.',
        correct_action: 'Compression ultrasound and anticoagulation.',
      },
    ],
    reverse_pattern: 'the_stable_mimic',
  },

  {
    name: 'the_time_fork',
    display_name: 'The Time Fork',
    description:
      'The same condition requires different management depending on when in its course the patient presents. Timing is the hinge that determines the correct branch.',
    structure:
      'Vignette establishes a clear diagnosis. A specific time marker (onset, duration, window) is embedded. Two answer choices represent correct treatments for different time windows.',
    hinge_type: 'temporal_progression',
    cognitive_trap: 'wrong_algorithm_branch',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'Patient with STEMI presenting 90 minutes after symptom onset at a PCI-capable center.',
        hinge: 'Within 120-minute door-to-balloon window at a PCI center.',
        correct_action: 'Primary PCI, not fibrinolytics.',
      },
      {
        topic: 'Neurology',
        scenario: 'Patient with acute ischemic stroke, last known well 5 hours ago.',
        hinge: 'Outside the 4.5-hour tPA window but within the thrombectomy window for large vessel occlusion.',
        correct_action: 'CT angiography to evaluate for mechanical thrombectomy.',
      },
      {
        topic: 'Infectious Disease',
        scenario: 'Patient with HIV exposure 60 hours ago from a known positive source.',
        hinge: 'Within the 72-hour post-exposure prophylaxis window.',
        correct_action: 'Initiate PEP immediately with tenofovir/emtricitabine + raltegravir.',
      },
    ],
  },

  {
    name: 'the_contraindication_override',
    display_name: 'The Contraindication Override',
    description:
      'The standard first-line treatment is blocked by a specific patient factor — allergy, comorbidity, pregnancy, or drug interaction. The student must select the appropriate alternative.',
    structure:
      'Vignette presents a straightforward diagnosis with a clear first-line treatment. A contraindication is embedded in the history. The first-line drug appears as a distractor.',
    hinge_type: 'contraindication',
    cognitive_trap: 'reflex_response_to_finding',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'Post-MI patient with EF 35% and severe reactive airway disease needs rate control.',
        hinge: 'Severe asthma is a contraindication to beta-blockers.',
        correct_action: 'Non-dihydropyridine calcium channel blocker (diltiazem) for rate control.',
      },
      {
        topic: 'Infectious Disease',
        scenario: 'Patient with strep pharyngitis and documented penicillin anaphylaxis.',
        hinge: 'True IgE-mediated penicillin allergy precludes amoxicillin and cephalosporins.',
        correct_action: 'Azithromycin or clindamycin.',
      },
      {
        topic: 'Rheumatology',
        scenario: 'Acute gout flare in a patient with CKD stage 4 and active peptic ulcer disease.',
        hinge: 'NSAIDs contraindicated by CKD; colchicine dose-limited; PUD limits steroids.',
        correct_action: 'Low-dose colchicine or intra-articular corticosteroid injection.',
      },
    ],
  },

  {
    name: 'the_severity_escalator',
    display_name: 'The Severity Escalator',
    description:
      'The same disease exists at two severity tiers, and management fundamentally changes at the threshold. The question tests whether the student correctly classifies severity.',
    structure:
      'Vignette gives a known diagnosis with severity markers embedded in labs, vitals, or exam. One answer is correct for mild disease, another for severe. The severity indicator is the hinge.',
    hinge_type: 'lab_pattern',
    cognitive_trap: 'misreading_severity',
    frequency: 'high',
    examples: [
      {
        topic: 'Gastroenterology',
        scenario: 'Patient with acute pancreatitis, WBC 18k, BUN 28, and two SIRS criteria.',
        hinge: 'Persistent organ failure criteria met — severe pancreatitis, not mild.',
        correct_action: 'ICU admission, aggressive IV fluids, and close monitoring — not floor admission.',
      },
      {
        topic: 'Pulmonology',
        scenario: 'Asthma patient using rescue inhaler 4 times/week with nighttime awakenings twice/month.',
        hinge: 'Symptoms >2 days/week and nighttime symptoms >2x/month = moderate persistent.',
        correct_action: 'Medium-dose ICS + LABA, not just a rescue inhaler.',
      },
      {
        topic: 'Hepatology',
        scenario: 'Alcoholic hepatitis patient with Maddrey discriminant function of 38.',
        hinge: 'MDF >= 32 defines severe alcoholic hepatitis.',
        correct_action: 'Prednisolone 40 mg daily for 28 days (or pentoxifylline if contraindicated).',
      },
    ],
  },

  {
    name: 'the_age_switcher',
    display_name: 'The Age Switcher',
    description:
      'The patient\'s age changes either the expected presentation or the standard management of a condition. Students must adjust their mental model for the age group.',
    structure:
      'Vignette describes a condition in an age group where the classic teaching changes. The age is stated early. Distractors are answers that would be correct for the typical age group.',
    hinge_type: 'age_specific_presentation',
    cognitive_trap: 'anchoring',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: '82-year-old woman with acute dyspnea, diaphoresis, and nausea but no chest pain.',
        hinge: 'Elderly patients with MI frequently present without chest pain — atypical MI.',
        correct_action: 'ECG and troponins, not just a chest X-ray for presumed CHF.',
      },
      {
        topic: 'Infectious Disease',
        scenario: 'Neonate with fever, irritability, and poor feeding but no nuchal rigidity.',
        hinge: 'Neonates with meningitis lack classic meningeal signs.',
        correct_action: 'Full sepsis workup including LP, blood cultures, and empiric antibiotics.',
      },
      {
        topic: 'Psychiatry',
        scenario: 'Elderly man with new-onset depression, weight loss, and cognitive decline.',
        hinge: 'New psychiatric symptoms in the elderly require organic workup — pseudodementia vs dementia vs malignancy.',
        correct_action: 'Brain imaging and metabolic workup before starting antidepressants.',
      },
    ],
  },

  {
    name: 'the_pregnant_exception',
    display_name: 'The Pregnant Exception',
    description:
      'Pregnancy changes the standard diagnostic or therapeutic approach. A medication, imaging study, or procedure that is otherwise first-line becomes contraindicated or requires modification.',
    structure:
      'Vignette presents a common condition and mentions pregnancy (or positive hCG). Standard treatment appears as a distractor. Correct answer is the pregnancy-safe alternative.',
    hinge_type: 'contraindication',
    cognitive_trap: 'reflex_response_to_finding',
    frequency: 'high',
    examples: [
      {
        topic: 'Endocrinology',
        scenario: 'Pregnant woman at 10 weeks with new-onset hyperthyroidism.',
        hinge: 'Radioactive iodine and methimazole are contraindicated in first trimester.',
        correct_action: 'Propylthiouracil (PTU) in the first trimester.',
      },
      {
        topic: 'Dermatology',
        scenario: 'Pregnant woman with severe cystic acne previously controlled with isotretinoin.',
        hinge: 'Isotretinoin is category X — absolute contraindication in pregnancy.',
        correct_action: 'Topical erythromycin or azelaic acid; defer isotretinoin until postpartum.',
      },
      {
        topic: 'Cardiology',
        scenario: 'Pregnant woman with chronic hypertension on lisinopril at her first prenatal visit.',
        hinge: 'ACE inhibitors are teratogenic — contraindicated in all trimesters.',
        correct_action: 'Switch to labetalol or nifedipine.',
      },
    ],
  },

  {
    name: 'the_lab_trap',
    display_name: 'The Lab Trap',
    description:
      'An abnormal laboratory value is presented that does not require treatment in the given clinical context. The correct answer is to monitor or address the underlying cause, not to chase the number.',
    structure:
      'Vignette includes a mildly abnormal lab in an asymptomatic or clinically stable patient. Distractors aggressively correct the lab. Correct answer is observation or treating the root cause.',
    hinge_type: 'lab_pattern',
    cognitive_trap: 'treating_labs_instead_of_patient',
    frequency: 'high',
    examples: [
      {
        topic: 'Nephrology',
        scenario: 'Asymptomatic patient on SSRI with sodium of 131 mEq/L and normal mental status.',
        hinge: 'Mild chronic hyponatremia in a stable patient does not need emergent correction.',
        correct_action: 'Fluid restriction and consider SSRI as the cause; do not give hypertonic saline.',
      },
      {
        topic: 'Endocrinology',
        scenario: 'Asymptomatic patient found to have TSH 6.2 with normal free T4.',
        hinge: 'Subclinical hypothyroidism with TSH <10 and no symptoms often does not need treatment.',
        correct_action: 'Repeat TSH in 6-8 weeks; do not start levothyroxine.',
      },
      {
        topic: 'Hematology',
        scenario: 'Post-surgical patient with platelet count of 90,000 and no bleeding.',
        hinge: 'Mild thrombocytopenia post-op without bleeding is often dilutional or consumptive and self-limited.',
        correct_action: 'Monitor and recheck; do not transfuse platelets.',
      },
    ],
  },

  {
    name: 'the_reflex_blocker',
    display_name: 'The Reflex Blocker',
    description:
      'A clinical finding triggers a standard reflex action, but the full context makes that action inappropriate. The student must pause and check whether the reflex applies.',
    structure:
      'Vignette includes a classic trigger finding (e.g., new AFib, positive culture, abnormal screening test). A modifying detail changes whether the reflex action is indicated. Correct answer defers or modifies the reflex.',
    hinge_type: 'risk_factor_constellation',
    cognitive_trap: 'reflex_response_to_finding',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'New atrial fibrillation in a 42-year-old man with no hypertension, diabetes, or heart failure.',
        hinge: 'CHA2DS2-VASc score is 0 — anticoagulation is not indicated.',
        correct_action: 'Rate or rhythm control only; no anticoagulation needed.',
      },
      {
        topic: 'Infectious Disease',
        scenario: 'Asymptomatic bacteriuria found on routine urine culture in a non-pregnant adult.',
        hinge: 'Asymptomatic bacteriuria should not be treated except in pregnancy or before urologic procedures.',
        correct_action: 'No antibiotics; reassurance.',
      },
      {
        topic: 'Oncology',
        scenario: 'Incidental 2-cm adrenal mass found on CT for unrelated complaint, normal labs.',
        hinge: 'Non-functional adrenal incidentaloma <4 cm requires monitoring, not surgery.',
        correct_action: 'Biochemical workup to confirm non-functional, then interval imaging.',
      },
    ],
  },

  {
    name: 'the_priority_sorter',
    display_name: 'The Priority Sorter',
    description:
      'Multiple answer choices are technically correct actions, but the question asks for the MOST appropriate next step. The student must prioritize correctly.',
    structure:
      'Vignette presents a scenario where several actions are reasonable. All distractors are real things you would do. The correct answer is the one that should come first based on urgency, diagnostic yield, or safety.',
    hinge_type: 'instability_clue',
    cognitive_trap: 'wrong_priority_sequence',
    frequency: 'high',
    examples: [
      {
        topic: 'Emergency Medicine',
        scenario: 'Trauma patient with GCS 7, tachycardia, and obvious femur fracture.',
        hinge: 'Airway takes priority over fracture management in ABC sequence.',
        correct_action: 'Secure the airway with intubation before addressing the femur.',
      },
      {
        topic: 'Gastroenterology',
        scenario: 'Patient with hematemesis, HR 120, BP 88/60, and melena.',
        hinge: 'Hemodynamic instability means resuscitation before endoscopy.',
        correct_action: 'IV access, fluid resuscitation, and type-and-cross before upper endoscopy.',
      },
      {
        topic: 'Obstetrics',
        scenario: 'Pregnant woman at 34 weeks with severe preeclampsia, headache, and BP 175/110.',
        hinge: 'Maternal seizure prevention takes immediate priority.',
        correct_action: 'IV magnesium sulfate before antihypertensives or delivery planning.',
      },
    ],
  },

  {
    name: 'the_dont_delay',
    display_name: 'The Don\'t Delay',
    description:
      'The clinical situation demands immediate action before complete diagnostic information is available. Waiting for results would cause harm.',
    structure:
      'Vignette describes a critically ill patient with a probable diagnosis. One distractor is a confirmatory test that would delay treatment. Correct answer is empiric treatment started now.',
    hinge_type: 'instability_clue',
    cognitive_trap: 'over_testing',
    frequency: 'high',
    examples: [
      {
        topic: 'Infectious Disease',
        scenario: 'Febrile patient with hypotension, tachycardia, and lactate 4.8. Blood cultures pending.',
        hinge: 'Sepsis bundle requires antibiotics within 1 hour — do not wait for culture results.',
        correct_action: 'Empiric broad-spectrum antibiotics and IV fluids immediately.',
      },
      {
        topic: 'Neurology',
        scenario: 'Patient with fever, neck stiffness, and altered mental status. LP scheduled.',
        hinge: 'If LP will be delayed (e.g., for CT), antibiotics must not wait.',
        correct_action: 'Blood cultures then empiric antibiotics and dexamethasone before LP.',
      },
      {
        topic: 'Pulmonology',
        scenario: 'Patient with tension pneumothorax: absent breath sounds, tracheal deviation, hypotension.',
        hinge: 'Tension pneumothorax is a clinical diagnosis — do not wait for chest X-ray.',
        correct_action: 'Needle decompression immediately, followed by chest tube.',
      },
    ],
  },

  {
    name: 'the_watchful_wait',
    display_name: 'The Watchful Wait',
    description:
      'The correct management is observation or conservative care, not intervention. Students must resist the urge to "do something" when the evidence supports monitoring.',
    structure:
      'Vignette presents a condition that sounds concerning but meets criteria for conservative management. Distractors are invasive or premature interventions. Correct answer is observation with defined follow-up.',
    hinge_type: 'temporal_progression',
    cognitive_trap: 'premature_escalation',
    frequency: 'high',
    examples: [
      {
        topic: 'Surgery',
        scenario: 'Patient with uncomplicated acute diverticulitis (no abscess, no peritonitis) on CT.',
        hinge: 'Uncomplicated diverticulitis is managed with antibiotics and bowel rest, not surgery.',
        correct_action: 'Outpatient antibiotics, clear liquid diet, and follow-up in 2-3 days.',
      },
      {
        topic: 'Urology',
        scenario: 'Man with 4-mm ureteral stone, moderate pain controlled with ketorolac, no infection.',
        hinge: 'Stones <5 mm pass spontaneously >90% of the time.',
        correct_action: 'Medical expulsive therapy (tamsulosin), hydration, pain control, and strain urine.',
      },
      {
        topic: 'Oncology',
        scenario: 'Incidental 8-mm pulmonary nodule in a 40-year-old non-smoker.',
        hinge: 'Low-risk patient with sub-centimeter nodule — surveillance CT, not biopsy.',
        correct_action: 'Follow-up CT in 6-12 months per Fleischner criteria.',
      },
    ],
  },

  {
    name: 'the_subtle_discriminator',
    display_name: 'The Subtle Discriminator',
    description:
      'Two conditions share nearly identical presentations, and a single clinical finding is the only differentiator. The question tests whether the student notices it.',
    structure:
      'Vignette describes overlapping features of two conditions. One discriminating finding is embedded in the history, exam, or labs. Distractors treat the wrong condition of the pair.',
    hinge_type: 'physical_exam_sign',
    cognitive_trap: 'premature_closure',
    frequency: 'high',
    examples: [
      {
        topic: 'Rheumatology',
        scenario: 'Young woman with symmetric polyarthritis of the hands. X-ray shows erosions.',
        hinge: 'Erosions at the DIP joints with pencil-in-cup deformity = psoriatic arthritis, not RA (which spares DIPs).',
        correct_action: 'Evaluate for psoriatic arthritis; check skin and nails.',
      },
      {
        topic: 'Nephrology',
        scenario: 'Patient with nephrotic syndrome: edema, proteinuria >3.5g, hypoalbuminemia.',
        hinge: 'Low complement levels point to membranoproliferative GN or lupus nephritis, not minimal change disease.',
        correct_action: 'Check complement levels and ANA; renal biopsy.',
      },
      {
        topic: 'Pulmonology',
        scenario: 'Patient with bilateral hilar lymphadenopathy and non-caseating granulomas on biopsy.',
        hinge: 'Elevated ACE level and hypercalcemia favor sarcoidosis over lymphoma.',
        correct_action: 'Diagnose sarcoidosis; start corticosteroids if symptomatic.',
      },
    ],
  },

  {
    name: 'the_cascade_error',
    display_name: 'The Cascade Error',
    description:
      'The question presents a scenario where an initial wrong step has already occurred, and the student must recognize the error or avoid compounding it. Alternatively, a wrong first answer choice triggers a chain of incorrect downstream actions.',
    structure:
      'Vignette describes a patient whose prior management was suboptimal. The question asks for the best next step, which requires recognizing the upstream error. Distractors continue down the wrong path.',
    hinge_type: 'history_pivot',
    cognitive_trap: 'wrong_algorithm_branch',
    frequency: 'high',
    examples: [
      {
        topic: 'Endocrinology',
        scenario: 'Patient started on levothyroxine for TSH 5.8 without symptoms or repeat testing; now has palpitations.',
        hinge: 'The original levothyroxine was unnecessary — the cascade started with overtreating subclinical hypothyroidism.',
        correct_action: 'Reduce or discontinue levothyroxine and recheck TSH.',
      },
      {
        topic: 'Infectious Disease',
        scenario: 'Patient treated for asymptomatic bacteriuria, now has C. difficile colitis.',
        hinge: 'Treating asymptomatic bacteriuria was the initial error that caused the cascade.',
        correct_action: 'Treat C. difficile with oral vancomycin; document that initial antibiotics were not indicated.',
      },
      {
        topic: 'Hematology',
        scenario: 'Patient started on warfarin without bridging heparin; develops skin necrosis on day 3.',
        hinge: 'Warfarin without heparin bridging can cause protein C/S-mediated skin necrosis.',
        correct_action: 'Discontinue warfarin, start heparin, administer vitamin K.',
      },
    ],
  },

  {
    name: 'the_wrong_direction',
    display_name: 'The Wrong Direction',
    description:
      'The student identifies the correct diagnosis but selects management that worsens the condition rather than improving it — the therapeutic direction is inverted.',
    structure:
      'Vignette presents a clear diagnosis. Two answer choices treat the same condition but in opposite physiologic directions. The wrong-direction answer makes pathophysiologic sense only if the diagnosis is inverted.',
    hinge_type: 'lab_pattern',
    cognitive_trap: 'wrong_algorithm_branch',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'Patient with acute decompensated heart failure, bilateral crackles, and JVD.',
        hinge: 'Patient is volume overloaded — needs diuresis, not IV fluids.',
        correct_action: 'IV furosemide and oxygen, not normal saline.',
      },
      {
        topic: 'Endocrinology',
        scenario: 'Patient in DKA with glucose 480, pH 7.1, and potassium 3.2.',
        hinge: 'Potassium is low despite acidosis — giving insulin before correcting K+ causes fatal hypokalemia.',
        correct_action: 'Replace potassium to >3.3 before starting insulin drip.',
      },
      {
        topic: 'Nephrology',
        scenario: 'Patient with severe hypernatremia (Na 168) and altered mental status.',
        hinge: 'Rapid correction causes cerebral edema — must correct slowly (<10 mEq/L per 24h).',
        correct_action: 'D5W infusion targeting slow correction, not rapid free water bolus.',
      },
    ],
  },

  {
    name: 'the_threshold_test',
    display_name: 'The Threshold Test',
    description:
      'Management changes at a specific numeric cutoff. The question provides a value just above or just below the threshold and tests whether the student applies the correct protocol.',
    structure:
      'Vignette includes a specific numeric value (lab, score, measurement). The number is positioned near a known management threshold. One answer is correct above the cutoff, another below.',
    hinge_type: 'lab_pattern',
    cognitive_trap: 'misreading_severity',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'Asymptomatic patient with aortic stenosis. Echocardiogram shows valve area 0.9 cm2 and mean gradient 42 mmHg.',
        hinge: 'Valve area <1.0 cm2 and mean gradient >40 = severe aortic stenosis.',
        correct_action: 'Refer for surgical aortic valve replacement.',
      },
      {
        topic: 'Obstetrics',
        scenario: 'Pregnant woman at 37 weeks with BP readings of 148/96 and 150/98 four hours apart, no proteinuria.',
        hinge: 'BP >= 140/90 on two occasions = gestational hypertension; >= 160/110 = severe features.',
        correct_action: 'Diagnose gestational hypertension without severe features; plan delivery at 37 weeks.',
      },
      {
        topic: 'Hematology',
        scenario: 'Patient with acute upper GI bleed, hemoglobin 6.8 g/dL, and active bleeding.',
        hinge: 'Transfusion threshold is Hgb <7 in most patients (or <8 with cardiac disease).',
        correct_action: 'Transfuse packed red blood cells with a target of Hgb >7.',
      },
    ],
  },

  {
    name: 'the_incomplete_picture',
    display_name: 'The Incomplete Picture',
    description:
      'Enough clinical information is already available to act. The wrong answer orders additional testing that delays appropriate management. The student must recognize sufficiency.',
    structure:
      'Vignette gives a clinical picture that meets criteria for a specific action. One distractor is an additional test that seems reasonable but is unnecessary given existing data. Correct answer acts on what is known.',
    hinge_type: 'risk_factor_constellation',
    cognitive_trap: 'over_testing',
    frequency: 'high',
    examples: [
      {
        topic: 'Pulmonology',
        scenario: 'Patient with high clinical probability of PE (Wells 7), tachycardia, and pleuritic chest pain.',
        hinge: 'Wells >6 = high probability; D-dimer is not useful (sensitivity-only test). Go to CT angiography.',
        correct_action: 'CT pulmonary angiography, not D-dimer.',
      },
      {
        topic: 'Surgery',
        scenario: 'Young woman with RLQ pain, fever, elevated WBC, and classic McBurney point tenderness.',
        hinge: 'Clinical diagnosis of appendicitis is sufficient in classic presentation; imaging may delay surgery.',
        correct_action: 'Surgical consultation for appendectomy.',
      },
      {
        topic: 'Endocrinology',
        scenario: 'Patient with classic Cushing features, elevated 24h urine cortisol, and elevated midnight salivary cortisol.',
        hinge: 'Two positive screening tests confirm Cushing syndrome — next step is localization, not more screening.',
        correct_action: 'Check ACTH level to determine ACTH-dependent vs independent source.',
      },
    ],
  },

  {
    name: 'the_red_herring',
    display_name: 'The Red Herring',
    description:
      'A prominent but clinically irrelevant finding is embedded in the vignette to distract from the true diagnosis or correct management. The student must filter signal from noise.',
    structure:
      'Vignette includes a dramatic or unusual finding alongside the actual clinical problem. Distractors address the dramatic finding. Correct answer addresses the real issue.',
    hinge_type: 'history_pivot',
    cognitive_trap: 'anchoring',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'Patient presenting with syncope. Incidental murmur is noted. ECG shows complete heart block.',
        hinge: 'The murmur is a distractor — complete heart block explains the syncope.',
        correct_action: 'Cardiology consultation for pacemaker placement.',
      },
      {
        topic: 'Psychiatry',
        scenario: 'Patient with depression and fatigue. History of remote, treated hepatitis C is mentioned prominently.',
        hinge: 'Sustained virologic response means HCV is cured — the hepatitis history is irrelevant.',
        correct_action: 'Treat the depression with SSRI; the hepatitis history does not change management.',
      },
      {
        topic: 'Nephrology',
        scenario: 'Patient with AKI. The vignette emphasizes a benign renal cyst found on ultrasound.',
        hinge: 'Simple renal cysts are incidental and do not cause AKI.',
        correct_action: 'Evaluate for prerenal, intrinsic, or postrenal causes of AKI; ignore the cyst.',
      },
    ],
  },

  {
    name: 'the_two_problem_patient',
    display_name: 'The Two-Problem Patient',
    description:
      'A comorbid condition changes the standard management of the primary presenting problem. The student must integrate both conditions to select the optimal answer.',
    structure:
      'Vignette establishes a primary condition and an important comorbidity. Standard treatment for the primary condition is suboptimal or dangerous given the comorbidity. Correct answer accounts for both.',
    hinge_type: 'contraindication',
    cognitive_trap: 'reflex_response_to_finding',
    frequency: 'high',
    examples: [
      {
        topic: 'Cardiology',
        scenario: 'Patient with new-onset hypertension and type 2 diabetes with proteinuria.',
        hinge: 'ACE inhibitors are first-line for hypertension WITH diabetic nephropathy — dual benefit.',
        correct_action: 'Start an ACE inhibitor (not a thiazide or CCB as monotherapy).',
      },
      {
        topic: 'Rheumatology',
        scenario: 'Patient with acute gout flare who is also on tacrolimus after kidney transplant.',
        hinge: 'Colchicine interacts with tacrolimus (CYP3A4); NSAIDs harm the transplant kidney.',
        correct_action: 'Corticosteroids (oral or intra-articular) as the safest option.',
      },
      {
        topic: 'Psychiatry',
        scenario: 'Depressed patient with chronic pain syndrome needing antidepressant therapy.',
        hinge: 'Dual benefit: duloxetine (SNRI) treats both depression and neuropathic pain.',
        correct_action: 'Start duloxetine rather than an SSRI or tricyclic.',
      },
    ],
  },

  {
    name: 'the_stabilize_first',
    display_name: 'The Stabilize First',
    description:
      'The patient is hemodynamically unstable or clinically deteriorating. Definitive diagnosis or targeted treatment is tempting, but the first step must be stabilization.',
    structure:
      'Vignette describes an unstable patient with abnormal vitals. Distractors are diagnostic tests or definitive treatments. Correct answer addresses the instability (fluids, airway, blood products).',
    hinge_type: 'instability_clue',
    cognitive_trap: 'skipping_required_diagnostic_step',
    frequency: 'high',
    examples: [
      {
        topic: 'Emergency Medicine',
        scenario: 'Patient with massive hematemesis, BP 78/50, HR 130, altered mental status.',
        hinge: 'Hemodynamic instability requires resuscitation before endoscopy.',
        correct_action: 'Two large-bore IVs, crystalloid bolus, type-and-cross, and activate massive transfusion protocol.',
      },
      {
        topic: 'Toxicology',
        scenario: 'Overdose patient found unresponsive with respiratory rate 6 and pinpoint pupils.',
        hinge: 'Respiratory failure kills before you identify the toxin — secure the airway.',
        correct_action: 'Naloxone and airway management; toxicology screen can wait.',
      },
      {
        topic: 'Trauma',
        scenario: 'Polytrauma patient with pelvic fracture, HR 140, BP 82/60, and FAST-positive abdomen.',
        hinge: 'Hemorrhagic shock requires volume resuscitation; pelvic binder before OR.',
        correct_action: 'Pelvic binder, massive transfusion, and emergent surgical consultation.',
      },
    ],
  },

  // ──────────────────────────────────────────────
  // MEDIUM FREQUENCY (21–30)
  // ──────────────────────────────────────────────

  {
    name: 'the_informed_refusal',
    display_name: 'The Informed Refusal',
    description:
      'A competent patient declines the standard recommended treatment. The question tests ethical management: respect autonomy while ensuring the patient is truly informed.',
    structure:
      'Vignette describes a recommended intervention that the patient refuses. Patient has decision-making capacity. Distractors override autonomy or abandon the patient. Correct answer respects the refusal while providing alternatives.',
    hinge_type: 'history_pivot',
    cognitive_trap: 'reflex_response_to_finding',
    frequency: 'medium',
    examples: [
      {
        topic: 'Surgery',
        scenario: 'Patient with acute appendicitis who refuses surgery after informed consent discussion.',
        hinge: 'Patient has capacity and understands the risks — autonomy must be respected.',
        correct_action: 'Document informed refusal, offer IV antibiotics as non-operative alternative, arrange close follow-up.',
      },
      {
        topic: 'Hematology/Oncology',
        scenario: 'Jehovah\'s Witness with GI bleed and hemoglobin 5.2 refusing blood transfusion.',
        hinge: 'Competent adult refusal of blood products must be honored even in life-threatening situations.',
        correct_action: 'Maximize non-blood alternatives (IV iron, erythropoietin, cell saver if accepted); document refusal.',
      },
    ],
  },

  {
    name: 'the_chronic_on_acute',
    display_name: 'The Chronic-on-Acute',
    description:
      'A patient with a known chronic condition presents with an acute exacerbation that changes the management tier. The student must recognize when chronic management is no longer sufficient.',
    structure:
      'Vignette establishes a chronic diagnosis with baseline treatment. New symptoms or findings indicate acute worsening. Distractors continue chronic management. Correct answer escalates appropriately.',
    hinge_type: 'temporal_progression',
    cognitive_trap: 'under_triage',
    frequency: 'medium',
    examples: [
      {
        topic: 'Pulmonology',
        scenario: 'COPD patient on home O2 presenting with worsening dyspnea, purulent sputum, and CO2 retention.',
        hinge: 'Acute exacerbation with respiratory acidosis — needs more than outpatient management.',
        correct_action: 'Systemic corticosteroids, antibiotics, and BiPAP; consider ICU if not improving.',
      },
      {
        topic: 'Cardiology',
        scenario: 'Stable heart failure patient now with acute dyspnea, orthopnea, and new bilateral crackles.',
        hinge: 'Acute decompensation on top of chronic HF requires IV diuretics, not just uptitrating oral meds.',
        correct_action: 'Admission, IV furosemide, daily weights, and I/O monitoring.',
      },
      {
        topic: 'Hepatology',
        scenario: 'Known cirrhosis patient with new confusion, asterixis, and elevated ammonia.',
        hinge: 'Hepatic encephalopathy is an acute complication requiring treatment and precipitant search.',
        correct_action: 'Lactulose and rifaximin; identify and treat the precipitant (infection, GI bleed, constipation).',
      },
    ],
  },

  {
    name: 'the_drug_culprit',
    display_name: 'The Drug Culprit',
    description:
      'The patient\'s presenting symptoms are caused by a medication listed in their history. The correct answer is to identify and discontinue the offending drug, not to add another treatment.',
    structure:
      'Vignette includes a medication list. Presenting symptoms match a known adverse effect of one listed drug. Distractors add new medications or order unnecessary workup. Correct answer is to stop the offending drug.',
    hinge_type: 'medication_side_effect',
    cognitive_trap: 'anchoring',
    frequency: 'medium',
    examples: [
      {
        topic: 'Nephrology',
        scenario: 'Patient on lisinopril for 2 weeks presenting with creatinine rise from 1.1 to 2.4 and potassium 5.8.',
        hinge: 'ACE inhibitor-induced AKI and hyperkalemia — bilateral renal artery stenosis unmasked.',
        correct_action: 'Discontinue lisinopril, IV fluids, and renal artery duplex ultrasound.',
      },
      {
        topic: 'Neurology',
        scenario: 'Patient on metoclopramide for 6 months now with involuntary tongue movements and lip smacking.',
        hinge: 'Tardive dyskinesia from chronic dopamine antagonist use.',
        correct_action: 'Discontinue metoclopramide; consider valbenazine if symptoms persist.',
      },
      {
        topic: 'Endocrinology',
        scenario: 'Patient on amiodarone with new fatigue, weight gain, and TSH 28.',
        hinge: 'Amiodarone-induced hypothyroidism (contains iodine, blocks T4-to-T3 conversion).',
        correct_action: 'Start levothyroxine; continue amiodarone if still needed for arrhythmia.',
      },
    ],
  },

  {
    name: 'the_screening_question',
    display_name: 'The Screening Question',
    description:
      'An asymptomatic patient is presented, and the question tests whether screening is indicated based on age, sex, risk factors, or guidelines. The student must know when screening is and is not appropriate.',
    structure:
      'Vignette describes a healthy patient at a wellness visit with specific demographics and risk factors. Distractors include screening tests that are not indicated for this population. Correct answer matches guideline criteria.',
    hinge_type: 'age_specific_presentation',
    cognitive_trap: 'over_testing',
    frequency: 'medium',
    examples: [
      {
        topic: 'Preventive Medicine',
        scenario: '55-year-old man with 30 pack-year smoking history, still smoking.',
        hinge: 'USPSTF recommends annual low-dose CT for lung cancer screening in adults 50-80 with >= 20 pack-year history.',
        correct_action: 'Annual low-dose CT chest for lung cancer screening.',
      },
      {
        topic: 'Gastroenterology',
        scenario: '45-year-old average-risk patient with no family history of colon cancer.',
        hinge: 'USPSTF lowered colorectal cancer screening start age to 45 for average-risk adults.',
        correct_action: 'Offer colonoscopy or other approved screening modality.',
      },
      {
        topic: 'Cardiology',
        scenario: '35-year-old woman with no risk factors asking about cardiac stress testing.',
        hinge: 'Screening stress tests are not recommended in asymptomatic low-risk individuals.',
        correct_action: 'Reassurance and cardiovascular risk factor counseling; no stress test indicated.',
      },
    ],
  },

  {
    name: 'the_counseling_question',
    display_name: 'The Counseling Question',
    description:
      'The correct answer is patient education, counseling, or behavioral intervention rather than a prescription or procedure. The student must recognize when non-pharmacologic management is first-line.',
    structure:
      'Vignette presents an early-stage or lifestyle-related condition. Distractors are medications or procedures. Correct answer is counseling, education, or lifestyle modification.',
    hinge_type: 'risk_factor_constellation',
    cognitive_trap: 'premature_escalation',
    frequency: 'medium',
    examples: [
      {
        topic: 'Preventive Medicine',
        scenario: 'Overweight patient with fasting glucose 108 mg/dL (prediabetes) and sedentary lifestyle.',
        hinge: 'Lifestyle modification is first-line for prediabetes and more effective than metformin in trials.',
        correct_action: 'Structured counseling on diet and 150 min/week of moderate exercise.',
      },
      {
        topic: 'Orthopedics',
        scenario: 'Patient with chronic low back pain for 3 weeks, no red flags, normal neuro exam.',
        hinge: 'Acute mechanical low back pain without red flags is managed conservatively.',
        correct_action: 'Activity modification, NSAIDs as needed, and reassurance that most cases resolve in 4-6 weeks.',
      },
      {
        topic: 'Pediatrics',
        scenario: 'Mother concerned about 18-month-old with frequent tantrums and food refusal.',
        hinge: 'Behavioral phase of toddlerhood — normal developmental stage.',
        correct_action: 'Anticipatory guidance on normal toddler behavior and positive parenting strategies.',
      },
    ],
  },

  {
    name: 'the_handoff_error',
    display_name: 'The Handoff Error',
    description:
      'A systems-based question about care transitions, communication failures, or safety protocols. The question tests whether the student prioritizes safe handoff practices.',
    structure:
      'Vignette describes a care transition scenario (discharge, shift change, transfer). A communication gap or safety risk is embedded. Correct answer addresses the system-level risk.',
    hinge_type: 'history_pivot',
    cognitive_trap: 'wrong_priority_sequence',
    frequency: 'medium',
    examples: [
      {
        topic: 'Patient Safety',
        scenario: 'Night team receives a patient transferred from an outside hospital. Transfer summary does not mention active anticoagulation.',
        hinge: 'Incomplete handoff missed critical medication — risk of bleeding during planned procedure.',
        correct_action: 'Independently verify medication list and check coagulation studies before any procedure.',
      },
      {
        topic: 'Hospital Medicine',
        scenario: 'Patient being discharged on warfarin. No INR follow-up or dose instructions in the discharge summary.',
        hinge: 'Anticoagulation without follow-up plan is a high-risk discharge.',
        correct_action: 'Arrange INR check within 3-5 days, provide written dosing instructions, and ensure PCP notification.',
      },
    ],
  },

  {
    name: 'the_cost_effective_choice',
    display_name: 'The Cost-Effective Choice',
    description:
      'Two diagnostic or therapeutic options are clinically equivalent, but one is simpler, cheaper, or more widely available. NBME favors the standard, less invasive approach unless there is a specific reason to choose otherwise.',
    structure:
      'Vignette presents a scenario with two valid approaches. One is the standard/simpler option; the other is more advanced or expensive. No clinical factor justifies the more complex choice.',
    hinge_type: 'risk_factor_constellation',
    cognitive_trap: 'premature_escalation',
    frequency: 'medium',
    examples: [
      {
        topic: 'Gastroenterology',
        scenario: 'Young patient with classic GERD symptoms and no alarm features.',
        hinge: 'Empiric PPI trial is first-line; EGD is not needed without alarm symptoms.',
        correct_action: 'Trial of PPI for 8 weeks, not upper endoscopy.',
      },
      {
        topic: 'Radiology',
        scenario: 'Child with suspected long bone fracture after a fall.',
        hinge: 'Plain radiograph is the first-line imaging for suspected fracture; MRI is unnecessary as initial study.',
        correct_action: 'X-ray of the affected extremity.',
      },
      {
        topic: 'Infectious Disease',
        scenario: 'Uncomplicated lower UTI in a young, non-pregnant woman.',
        hinge: 'Empiric antibiotics based on symptoms; urine culture is not needed for uncomplicated UTI.',
        correct_action: 'Nitrofurantoin or TMP-SMX for 3-5 days without culture.',
      },
    ],
  },

  {
    name: 'the_shared_decision',
    display_name: 'The Shared Decision',
    description:
      'There is no single objectively correct answer. Multiple evidence-based options exist, and the best next step is to discuss the options with the patient and incorporate their preferences.',
    structure:
      'Vignette presents a clinical scenario with genuinely equivalent options (e.g., lumpectomy vs mastectomy, watchful waiting vs treatment). Correct answer is shared decision-making, not unilateral action.',
    hinge_type: 'history_pivot',
    cognitive_trap: 'reflex_response_to_finding',
    frequency: 'medium',
    examples: [
      {
        topic: 'Oncology',
        scenario: 'Woman with early-stage breast cancer eligible for either lumpectomy with radiation or mastectomy.',
        hinge: 'Survival outcomes are equivalent — patient preference determines the approach.',
        correct_action: 'Discuss both options with risks and benefits; elicit patient preferences.',
      },
      {
        topic: 'Urology',
        scenario: 'Man with low-risk prostate cancer (Gleason 6, PSA 5, T1c) discussing management options.',
        hinge: 'Active surveillance, radiation, and surgery have similar long-term outcomes for low-risk disease.',
        correct_action: 'Present all three options and engage in shared decision-making.',
      },
      {
        topic: 'Cardiology',
        scenario: 'Patient with stable angina refractory to one antianginal agent.',
        hinge: 'Adding a second medical agent vs PCI — both are reasonable next steps per guidelines.',
        correct_action: 'Discuss medical optimization vs catheterization with the patient.',
      },
    ],
  },

  {
    name: 'the_complication_of_treatment',
    display_name: 'The Complication of Treatment',
    description:
      'The patient\'s current problem is an iatrogenic complication of a prior intervention. The student must connect the current presentation to the prior treatment and manage the complication.',
    structure:
      'Vignette describes a patient who recently underwent a procedure or started a medication. New symptoms are a known complication of that intervention. Correct answer addresses the iatrogenic cause.',
    hinge_type: 'medication_side_effect',
    cognitive_trap: 'anchoring',
    frequency: 'medium',
    examples: [
      {
        topic: 'Surgery',
        scenario: 'Patient develops hoarseness and difficulty swallowing 1 day after thyroidectomy.',
        hinge: 'Recurrent laryngeal nerve injury is a known complication of thyroid surgery.',
        correct_action: 'Direct laryngoscopy to assess vocal cord function.',
      },
      {
        topic: 'Nephrology',
        scenario: 'Patient develops severe hyponatremia (Na 118) 3 days after starting SSRI.',
        hinge: 'SIADH is a known side effect of SSRIs.',
        correct_action: 'Discontinue SSRI, fluid restriction, and monitor sodium closely.',
      },
      {
        topic: 'Gastroenterology',
        scenario: 'Patient with watery diarrhea 5 days after starting clindamycin for cellulitis.',
        hinge: 'Antibiotic-associated C. difficile colitis.',
        correct_action: 'Stop clindamycin, test for C. difficile toxin, and start oral vancomycin if positive.',
      },
    ],
  },

  {
    name: 'the_presentation_shift',
    display_name: 'The Presentation Shift',
    description:
      'A classic disease presents atypically in a specific population (immunocompromised, elderly, pediatric, diabetic). The student must recognize the disease despite the altered presentation.',
    structure:
      'Vignette describes a patient in a population known for atypical presentations. Classic features are absent or altered. Enough clues remain to make the diagnosis if the student adjusts their mental model.',
    hinge_type: 'age_specific_presentation',
    cognitive_trap: 'premature_closure',
    frequency: 'medium',
    examples: [
      {
        topic: 'Infectious Disease',
        scenario: 'Immunocompromised patient with subtle cough and ground-glass opacities on CT, but no fever.',
        hinge: 'Immunosuppressed patients may not mount a febrile response — PCP pneumonia presents subtly.',
        correct_action: 'Induced sputum for PCP staining or bronchoscopy; start empiric TMP-SMX.',
      },
      {
        topic: 'Surgery',
        scenario: 'Diabetic patient with vague abdominal discomfort and mildly elevated WBC, no peritoneal signs.',
        hinge: 'Diabetic neuropathy blunts peritoneal signs — may have perforated appendicitis without guarding.',
        correct_action: 'CT abdomen/pelvis; maintain high suspicion for surgical abdomen despite benign exam.',
      },
      {
        topic: 'Cardiology',
        scenario: 'Diabetic woman presenting with nausea, fatigue, and jaw pain without chest pain.',
        hinge: 'Diabetic patients and women have higher rates of atypical MI presentation.',
        correct_action: 'ECG and troponins; treat as acute coronary syndrome until ruled out.',
      },
    ],
  },
];
