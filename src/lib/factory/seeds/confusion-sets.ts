export interface ConfusionSetSeed {
  name: string;
  conditions: string[];
  discriminating_clues: {
    condition: string;
    clue: string;
    clue_type: string;
  }[];
  common_traps: string[];
}

export const confusionSets: ConfusionSetSeed[] = [
  // ─── CARDIOLOGY (4) ───
  {
    name: 'stemi_vs_pericarditis',
    conditions: ['STEMI', 'Pericarditis', 'Aortic Dissection'],
    discriminating_clues: [
      { condition: 'STEMI', clue: 'Territorial ST elevations (specific coronary distribution) with reciprocal depressions', clue_type: 'lab_pattern' },
      { condition: 'Pericarditis', clue: 'Diffuse concave-up ST elevations with PR depression, no reciprocal changes', clue_type: 'lab_pattern' },
      { condition: 'Aortic Dissection', clue: 'Tearing pain radiating to back, BP differential between arms, widened mediastinum', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Anchoring on ST elevation = STEMI without checking distribution pattern', 'Missing PR depression in pericarditis', 'Not considering dissection with back pain + hypertension'],
  },
  {
    name: 'chf_exacerbation_vs_pneumonia',
    conditions: ['Acute Decompensated CHF', 'Community-Acquired Pneumonia', 'COPD Exacerbation'],
    discriminating_clues: [
      { condition: 'Acute Decompensated CHF', clue: 'Bilateral crackles, elevated JVP, peripheral edema, BNP >400 pg/mL', clue_type: 'physical_exam_sign' },
      { condition: 'Community-Acquired Pneumonia', clue: 'Focal consolidation on CXR, fever, productive cough, elevated procalcitonin', clue_type: 'imaging_discriminator' },
      { condition: 'COPD Exacerbation', clue: 'Diffuse wheezing, hyperinflated lungs on CXR, history of COPD, no consolidation', clue_type: 'imaging_discriminator' },
    ],
    common_traps: ['Treating bilateral infiltrates as pneumonia when they are pulmonary edema', 'Giving IV fluids to CHF patient who looks dehydrated', 'Missing that CHF and pneumonia can coexist'],
  },
  {
    name: 'afib_rvr_vs_aflutter_vs_svt',
    conditions: ['Atrial Fibrillation with RVR', 'Atrial Flutter', 'SVT (AVNRT/AVRT)'],
    discriminating_clues: [
      { condition: 'Atrial Fibrillation with RVR', clue: 'Irregularly irregular rhythm, no discernible P waves, variable RR intervals', clue_type: 'lab_pattern' },
      { condition: 'Atrial Flutter', clue: 'Sawtooth flutter waves (leads II, III, aVF), regular ventricular rate often ~150 bpm', clue_type: 'lab_pattern' },
      { condition: 'SVT (AVNRT/AVRT)', clue: 'Regular narrow-complex tachycardia, abrupt onset/offset, responds to vagal maneuvers or adenosine', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Treating all narrow-complex tachycardias identically', 'Missing flutter waves hidden in the baseline', 'Giving adenosine for AFib instead of rate control'],
  },
  {
    name: 'hypertensive_emergency_vs_urgency',
    conditions: ['Hypertensive Emergency', 'Hypertensive Urgency'],
    discriminating_clues: [
      { condition: 'Hypertensive Emergency', clue: 'End-organ damage present: papilledema, AKI, troponin elevation, altered mental status, pulmonary edema', clue_type: 'physical_exam_sign' },
      { condition: 'Hypertensive Urgency', clue: 'Severely elevated BP (>180/120) WITHOUT evidence of acute end-organ damage', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Treating urgency with IV antihypertensives (oral is appropriate)', 'Lowering BP too rapidly in emergency (risk of watershed infarcts)', 'Anchoring on the BP number rather than assessing for end-organ damage'],
  },

  // ─── PULMONOLOGY (3) ───
  {
    name: 'pe_vs_pneumothorax_vs_pneumonia',
    conditions: ['Pulmonary Embolism', 'Pneumothorax', 'Pneumonia'],
    discriminating_clues: [
      { condition: 'Pulmonary Embolism', clue: 'Pleuritic chest pain + dyspnea, risk factors (DVT, immobilization, surgery), elevated D-dimer, clear CXR', clue_type: 'risk_factor_constellation' },
      { condition: 'Pneumothorax', clue: 'Absent breath sounds unilaterally, hyperresonance to percussion, tracheal deviation if tension', clue_type: 'physical_exam_sign' },
      { condition: 'Pneumonia', clue: 'Fever, productive cough, focal consolidation on CXR, leukocytosis', clue_type: 'imaging_discriminator' },
    ],
    common_traps: ['Ordering D-dimer in high-probability PE patients (go straight to CTPA)', 'Missing PE because CXR is normal', 'Delaying needle decompression for imaging in tension pneumothorax'],
  },
  {
    name: 'copd_exacerbation_vs_chf',
    conditions: ['COPD Exacerbation', 'Acute Decompensated CHF'],
    discriminating_clues: [
      { condition: 'COPD Exacerbation', clue: 'History of COPD/smoking, wheezing predominant, hyperinflated lungs, normal BNP', clue_type: 'history_pivot' },
      { condition: 'Acute Decompensated CHF', clue: 'History of CHF, bilateral crackles, elevated JVP, S3 gallop, BNP >400', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Both present with dyspnea and can have bilateral findings on CXR', 'Giving beta-agonists to CHF (can worsen tachycardia)', 'Missing that patients can have both COPD and CHF simultaneously'],
  },
  {
    name: 'cap_vs_hap_vs_aspiration',
    conditions: ['Community-Acquired Pneumonia', 'Hospital-Acquired Pneumonia', 'Aspiration Pneumonia'],
    discriminating_clues: [
      { condition: 'Community-Acquired Pneumonia', clue: 'Onset outside hospital, typical organisms (S. pneumoniae, H. influenzae), responds to standard CAP antibiotics', clue_type: 'history_pivot' },
      { condition: 'Hospital-Acquired Pneumonia', clue: 'Onset >48 hours after admission, risk for MDR organisms (MRSA, Pseudomonas), requires broad-spectrum coverage', clue_type: 'temporal_progression' },
      { condition: 'Aspiration Pneumonia', clue: 'Witnessed aspiration event or dysphagia risk factors, right lower lobe predilection, mixed anaerobic flora', clue_type: 'imaging_discriminator' },
    ],
    common_traps: ['Using CAP antibiotics for hospital-acquired infection', 'Treating aspiration pneumonitis (sterile) with antibiotics', 'Missing the 48-hour timeline that defines HAP'],
  },

  // ─── GI (4) ───
  {
    name: 'upper_vs_lower_gi_bleed',
    conditions: ['Upper GI Bleed', 'Lower GI Bleed'],
    discriminating_clues: [
      { condition: 'Upper GI Bleed', clue: 'Hematemesis, coffee-ground emesis, melena, elevated BUN:creatinine ratio >20:1, NG aspirate positive', clue_type: 'lab_pattern' },
      { condition: 'Lower GI Bleed', clue: 'Hematochezia (bright red blood per rectum), normal BUN:creatinine, no hematemesis', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Assuming hematochezia is always lower GI (brisk upper GI bleeds cause hematochezia)', 'Not checking BUN:creatinine ratio as a clue to location', 'Forgetting that melena can originate from as low as the right colon'],
  },
  {
    name: 'appendicitis_vs_ovarian_torsion',
    conditions: ['Acute Appendicitis', 'Ovarian Torsion', 'Ectopic Pregnancy'],
    discriminating_clues: [
      { condition: 'Acute Appendicitis', clue: 'RLQ pain with migration from periumbilical, McBurney point tenderness, leukocytosis, CT shows appendiceal wall thickening', clue_type: 'physical_exam_sign' },
      { condition: 'Ovarian Torsion', clue: 'Sudden-onset unilateral pelvic pain, nausea/vomiting, enlarged ovary on ultrasound with absent Doppler flow', clue_type: 'imaging_discriminator' },
      { condition: 'Ectopic Pregnancy', clue: 'Positive beta-hCG, adnexal mass, no intrauterine pregnancy on ultrasound, vaginal bleeding', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Not checking pregnancy test in reproductive-age female with abdominal pain', 'Missing that ovarian torsion is surgical emergency like appendicitis', 'Anchoring on RLQ pain = appendicitis without considering gynecologic causes'],
  },
  {
    name: 'pancreatitis_vs_cholecystitis',
    conditions: ['Acute Pancreatitis', 'Acute Cholecystitis', 'Choledocholithiasis'],
    discriminating_clues: [
      { condition: 'Acute Pancreatitis', clue: 'Epigastric pain radiating to back, lipase >3x ULN, nausea/vomiting', clue_type: 'lab_pattern' },
      { condition: 'Acute Cholecystitis', clue: 'RUQ pain, positive Murphy sign, gallbladder wall thickening and pericholecystic fluid on ultrasound', clue_type: 'physical_exam_sign' },
      { condition: 'Choledocholithiasis', clue: 'RUQ pain, jaundice, elevated conjugated bilirubin and ALP, dilated common bile duct on ultrasound', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Gallstone pancreatitis has features of both — check lipase', 'Missing ascending cholangitis (Charcot triad: fever + jaundice + RUQ pain)', 'Not ordering RUQ ultrasound as first imaging for both'],
  },
  {
    name: 'sbp_vs_secondary_peritonitis',
    conditions: ['Spontaneous Bacterial Peritonitis', 'Secondary Peritonitis'],
    discriminating_clues: [
      { condition: 'Spontaneous Bacterial Peritonitis', clue: 'Cirrhosis with ascites, ascitic fluid PMN >250/mm3, single organism on culture, no perforation on imaging', clue_type: 'lab_pattern' },
      { condition: 'Secondary Peritonitis', clue: 'Peritoneal signs, free air on imaging, polymicrobial culture, very high protein/LDH in ascitic fluid', clue_type: 'imaging_discriminator' },
    ],
    common_traps: ['Not performing diagnostic paracentesis in cirrhotic patients with new symptoms', 'Treating secondary peritonitis with antibiotics alone (needs surgery)', 'Missing that SBP can present with minimal symptoms in cirrhosis'],
  },

  // ─── ENDOCRINE (3) ───
  {
    name: 'dka_vs_hhs',
    conditions: ['Diabetic Ketoacidosis', 'Hyperosmolar Hyperglycemic State'],
    discriminating_clues: [
      { condition: 'Diabetic Ketoacidosis', clue: 'Glucose 250-600, pH <7.3, bicarbonate <18, positive ketones, anion gap metabolic acidosis', clue_type: 'lab_pattern' },
      { condition: 'Hyperosmolar Hyperglycemic State', clue: 'Glucose >600, serum osmolality >320, minimal or no ketones, pH >7.3, severe dehydration', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Treating both identically (HHS needs more aggressive fluid resuscitation)', 'Missing that DKA can occur with near-normal glucose (euglycemic DKA with SGLT2 inhibitors)', 'Not checking for overlap — some patients have features of both'],
  },
  {
    name: 'thyroid_storm_vs_pheochromocytoma',
    conditions: ['Thyroid Storm', 'Pheochromocytoma Crisis'],
    discriminating_clues: [
      { condition: 'Thyroid Storm', clue: 'Known hyperthyroidism or Graves, fever, tachycardia, altered mental status, elevated free T4/T3, suppressed TSH', clue_type: 'lab_pattern' },
      { condition: 'Pheochromocytoma Crisis', clue: 'Episodic hypertension with tachycardia, headache, diaphoresis (classic triad), elevated plasma metanephrines', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Both cause sympathetic hyperactivation — check thyroid function', 'Giving beta-blockers to pheo without alpha-blockade first (hypertensive crisis)', 'Missing thyroid storm precipitant (surgery, infection, iodine load)'],
  },
  {
    name: 'adrenal_crisis_vs_septic_shock',
    conditions: ['Adrenal Crisis', 'Septic Shock'],
    discriminating_clues: [
      { condition: 'Adrenal Crisis', clue: 'History of chronic steroid use or known adrenal insufficiency, hypotension refractory to fluids, hyponatremia + hyperkalemia, low cortisol', clue_type: 'history_pivot' },
      { condition: 'Septic Shock', clue: 'Fever, identified source of infection, elevated lactate, responds to fluids + vasopressors + antibiotics', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Not asking about steroid history in hypotensive patients', 'Missing that sepsis can precipitate adrenal crisis in at-risk patients', 'Forgetting stress-dose steroids when a chronic steroid user becomes critically ill'],
  },

  // ─── NEPHROLOGY (2) ───
  {
    name: 'prerenal_vs_intrinsic_aki',
    conditions: ['Prerenal AKI', 'Intrinsic (ATN) AKI', 'Postrenal AKI'],
    discriminating_clues: [
      { condition: 'Prerenal AKI', clue: 'BUN:Cr >20:1, FENa <1%, urine osmolality >500, bland urine sediment, responds to fluids', clue_type: 'lab_pattern' },
      { condition: 'Intrinsic (ATN) AKI', clue: 'BUN:Cr ~10:1, FENa >2%, muddy brown granular casts, urine osmolality ~300', clue_type: 'lab_pattern' },
      { condition: 'Postrenal AKI', clue: 'Hydronephrosis on ultrasound, distended bladder, history of BPH or pelvic malignancy', clue_type: 'imaging_discriminator' },
    ],
    common_traps: ['Not ordering renal ultrasound to rule out obstruction first', 'FENa is unreliable with diuretic use (use FEUrea instead)', 'Missing that prolonged prerenal can progress to ATN'],
  },
  {
    name: 'nephrotic_vs_nephritic',
    conditions: ['Nephrotic Syndrome', 'Nephritic Syndrome'],
    discriminating_clues: [
      { condition: 'Nephrotic Syndrome', clue: 'Proteinuria >3.5g/day, hypoalbuminemia, peripheral edema, hyperlipidemia, oval fat bodies in urine', clue_type: 'lab_pattern' },
      { condition: 'Nephritic Syndrome', clue: 'Hematuria with RBC casts, mild-moderate proteinuria, hypertension, oliguria, elevated creatinine', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Overlap exists — some diseases cause both (membranoproliferative GN)', 'Missing RBC casts (pathognomonic for glomerulonephritis)', 'Not checking complement levels to narrow the nephritic differential'],
  },

  // ─── NEUROLOGY (3) ───
  {
    name: 'ischemic_vs_hemorrhagic_stroke',
    conditions: ['Ischemic Stroke', 'Hemorrhagic Stroke (ICH)', 'Subarachnoid Hemorrhage'],
    discriminating_clues: [
      { condition: 'Ischemic Stroke', clue: 'Focal neurological deficit in vascular territory, CT head negative for bleed, onset <4.5h for tPA eligibility', clue_type: 'imaging_discriminator' },
      { condition: 'Hemorrhagic Stroke (ICH)', clue: 'Hyperdense lesion on non-contrast CT, often with surrounding edema, headache prominent', clue_type: 'imaging_discriminator' },
      { condition: 'Subarachnoid Hemorrhage', clue: 'Thunderclap headache (worst headache of life), blood in subarachnoid space on CT, nuchal rigidity', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Giving tPA before ruling out hemorrhage with CT', 'Missing SAH when CT is negative (need LP for xanthochromia)', 'Not checking onset time — tPA window is strict at 4.5 hours'],
  },
  {
    name: 'meningitis_vs_encephalitis',
    conditions: ['Bacterial Meningitis', 'Viral Encephalitis'],
    discriminating_clues: [
      { condition: 'Bacterial Meningitis', clue: 'Fever, nuchal rigidity, headache, CSF: high WBC with neutrophil predominance, low glucose, high protein, positive Gram stain', clue_type: 'lab_pattern' },
      { condition: 'Viral Encephalitis', clue: 'Altered mental status, behavioral changes, seizures, CSF: lymphocytic pleocytosis, normal glucose, temporal lobe abnormalities on MRI (HSV)', clue_type: 'imaging_discriminator' },
    ],
    common_traps: ['Delaying antibiotics for LP in suspected bacterial meningitis', 'Not adding acyclovir empirically when encephalitis is possible', 'Missing that both can coexist (meningoencephalitis)'],
  },
  {
    name: 'seizure_vs_psychogenic_nonepileptic',
    conditions: ['Generalized Tonic-Clonic Seizure', 'Psychogenic Nonepileptic Spell'],
    discriminating_clues: [
      { condition: 'Generalized Tonic-Clonic Seizure', clue: 'Post-ictal confusion, tongue biting (lateral), incontinence, elevated prolactin (if checked within 20 min), abnormal EEG', clue_type: 'physical_exam_sign' },
      { condition: 'Psychogenic Nonepileptic Spell', clue: 'Eyes closed during event (epileptic seizures: eyes open), waxing/waning movements, preserved awareness despite bilateral movements, normal EEG during event', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Assuming all convulsive episodes are epileptic', 'Missing that PNES patients can also have real epilepsy (dual diagnosis)', 'Treating PNES with escalating antiepileptics (no benefit, adds side effects)'],
  },

  // ─── INFECTIOUS DISEASE (3) ───
  {
    name: 'sepsis_vs_sirs',
    conditions: ['Sepsis', 'SIRS (non-infectious)'],
    discriminating_clues: [
      { condition: 'Sepsis', clue: 'SIRS criteria + suspected or confirmed infection, elevated lactate, end-organ dysfunction (Sepsis-3: SOFA score increase)', clue_type: 'lab_pattern' },
      { condition: 'SIRS (non-infectious)', clue: 'SIRS criteria met but from non-infectious cause (pancreatitis, burns, trauma, post-surgical), negative cultures, no infectious source identified', clue_type: 'history_pivot' },
    ],
    common_traps: ['Treating all SIRS as sepsis with antibiotics', 'Missing an occult infection source (abscess, endocarditis, C. diff)', 'Not recognizing that pancreatitis can mimic sepsis closely'],
  },
  {
    name: 'bacterial_vs_viral_meningitis',
    conditions: ['Bacterial Meningitis', 'Viral Meningitis'],
    discriminating_clues: [
      { condition: 'Bacterial Meningitis', clue: 'CSF: WBC >1000 with neutrophil predominance, glucose <40 mg/dL or CSF:serum glucose ratio <0.4, protein >250 mg/dL, positive Gram stain', clue_type: 'lab_pattern' },
      { condition: 'Viral Meningitis', clue: 'CSF: WBC <500 with lymphocyte predominance, normal glucose, mildly elevated protein, negative Gram stain', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Early viral meningitis can have neutrophil predominance (check repeat LP)', 'Withholding empiric antibiotics while waiting for CSF results', 'Not considering partially-treated bacterial meningitis (prior oral antibiotics)'],
  },
  {
    name: 'cellulitis_vs_necrotizing_fasciitis',
    conditions: ['Cellulitis', 'Necrotizing Fasciitis'],
    discriminating_clues: [
      { condition: 'Cellulitis', clue: 'Erythema, warmth, swelling with well-defined borders, responds to IV antibiotics, no crepitus', clue_type: 'physical_exam_sign' },
      { condition: 'Necrotizing Fasciitis', clue: 'Pain out of proportion to exam findings, crepitus on palpation, rapid spread, dusky/necrotic skin, systemic toxicity, gas in soft tissues on imaging', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Delaying surgical consultation for necrotizing fasciitis (surgical emergency)', 'Missing pain out of proportion as the key early sign', 'Waiting for imaging instead of going to OR when clinical suspicion is high'],
  },

  // ─── HEMATOLOGY (2) ───
  {
    name: 'ttp_vs_hus_vs_dic',
    conditions: ['TTP', 'HUS', 'DIC'],
    discriminating_clues: [
      { condition: 'TTP', clue: 'Pentad: thrombocytopenia + microangiopathic hemolytic anemia + neurological symptoms + renal impairment + fever; ADAMTS13 activity <10%', clue_type: 'lab_pattern' },
      { condition: 'HUS', clue: 'Triad: thrombocytopenia + microangiopathic hemolytic anemia + AKI; often following bloody diarrhea (STEC); predominantly renal involvement', clue_type: 'history_pivot' },
      { condition: 'DIC', clue: 'Low fibrinogen, elevated D-dimer, prolonged PT/PTT, schistocytes; occurs in setting of sepsis, trauma, malignancy, obstetric emergency', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Transfusing platelets in TTP (can worsen thrombosis)', 'Missing that TTP requires emergent plasma exchange', 'Not distinguishing TTP from HUS (neurological vs renal predominance)'],
  },
  {
    name: 'iron_deficiency_vs_thalassemia_trait',
    conditions: ['Iron Deficiency Anemia', 'Thalassemia Trait'],
    discriminating_clues: [
      { condition: 'Iron Deficiency Anemia', clue: 'Microcytic anemia, low ferritin, high TIBC, low iron, elevated RDW, response to iron supplementation', clue_type: 'lab_pattern' },
      { condition: 'Thalassemia Trait', clue: 'Microcytic anemia, normal or high ferritin, normal TIBC, low MCV with relatively high RBC count, normal RDW, Hb electrophoresis shows elevated HbA2', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Treating thalassemia trait with iron (no benefit, risk of iron overload)', 'Missing iron deficiency in a thalassemia trait patient (both can coexist)', 'Using MCV alone without checking RDW and ferritin'],
  },

  // ─── RHEUMATOLOGY (2) ───
  {
    name: 'gout_vs_septic_arthritis',
    conditions: ['Gout', 'Septic Arthritis', 'Pseudogout'],
    discriminating_clues: [
      { condition: 'Gout', clue: 'Negatively birefringent needle-shaped crystals on synovial fluid analysis, first MTP joint common, elevated uric acid', clue_type: 'lab_pattern' },
      { condition: 'Septic Arthritis', clue: 'Synovial WBC >50,000, positive Gram stain/culture, fever, cannot bear weight, recent instrumentation or bacteremia', clue_type: 'lab_pattern' },
      { condition: 'Pseudogout', clue: 'Positively birefringent rhomboid-shaped crystals (CPPD), large joints (knee, wrist), often older patients with chondrocalcinosis on X-ray', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Not aspirating the joint (arthrocentesis is diagnostic for all three)', 'Missing septic arthritis because gout is more common (both can coexist)', 'Serum uric acid can be normal during an acute gout flare'],
  },
  {
    name: 'sle_vs_drug_induced_lupus',
    conditions: ['Systemic Lupus Erythematosus', 'Drug-Induced Lupus'],
    discriminating_clues: [
      { condition: 'Systemic Lupus Erythematosus', clue: 'ANA positive + anti-dsDNA positive, low complement (C3/C4), renal involvement, CNS involvement possible', clue_type: 'lab_pattern' },
      { condition: 'Drug-Induced Lupus', clue: 'Anti-histone antibodies positive, anti-dsDNA usually negative, no renal or CNS involvement, resolves with drug discontinuation (hydralazine, procainamide, isoniazid)', clue_type: 'history_pivot' },
    ],
    common_traps: ['Not asking about medication history (especially hydralazine, procainamide)', 'Assuming anti-histone = drug-induced (also positive in ~50% of SLE)', 'Missing that complement levels help distinguish (low in SLE, normal in drug-induced)'],
  },

  // ─── EMERGENCY (4) ───
  {
    name: 'anaphylaxis_vs_angioedema',
    conditions: ['Anaphylaxis', 'ACE Inhibitor Angioedema', 'Hereditary Angioedema'],
    discriminating_clues: [
      { condition: 'Anaphylaxis', clue: 'Rapid onset after exposure, urticaria + bronchospasm + hypotension, responds to epinephrine', clue_type: 'temporal_progression' },
      { condition: 'ACE Inhibitor Angioedema', clue: 'Facial/lip/tongue swelling without urticaria or bronchospasm, on ACE inhibitor, does NOT respond to epinephrine/antihistamines', clue_type: 'medication_side_effect' },
      { condition: 'Hereditary Angioedema', clue: 'Recurrent episodes without urticaria, family history, low C4 level, does not respond to epinephrine or antihistamines', clue_type: 'history_pivot' },
    ],
    common_traps: ['Giving epinephrine for ACE inhibitor angioedema (not effective)', 'Missing the key distinction: urticaria present in anaphylaxis, absent in angioedema', 'Not stopping ACE inhibitor (can recur and worsen)'],
  },
  {
    name: 'tension_pneumo_vs_cardiac_tamponade',
    conditions: ['Tension Pneumothorax', 'Cardiac Tamponade'],
    discriminating_clues: [
      { condition: 'Tension Pneumothorax', clue: 'Absent breath sounds unilaterally, hyperresonance to percussion, tracheal deviation away from affected side, distended neck veins', clue_type: 'physical_exam_sign' },
      { condition: 'Cardiac Tamponade', clue: 'Beck triad (hypotension, muffled heart sounds, JVD), pulsus paradoxus >10 mmHg, electrical alternans on ECG', clue_type: 'physical_exam_sign' },
    ],
    common_traps: ['Both cause hypotension + JVD — check breath sounds and heart sounds', 'Delaying needle decompression for imaging in tension pneumo', 'Missing pulsus paradoxus as a key tamponade finding'],
  },
  {
    name: 'heat_stroke_vs_nms',
    conditions: ['Heat Stroke', 'Neuroleptic Malignant Syndrome', 'Serotonin Syndrome', 'Malignant Hyperthermia'],
    discriminating_clues: [
      { condition: 'Heat Stroke', clue: 'Environmental exposure, core temp >40C, altered mental status, anhidrosis (classic) or diaphoresis (exertional)', clue_type: 'history_pivot' },
      { condition: 'Neuroleptic Malignant Syndrome', clue: 'Recent antipsychotic use/dose change, lead-pipe rigidity, hyperthermia, altered mental status, elevated CK, develops over days', clue_type: 'medication_side_effect' },
      { condition: 'Serotonin Syndrome', clue: 'Serotonergic drug exposure, clonus/hyperreflexia, agitation, diarrhea, develops over hours (rapid onset)', clue_type: 'medication_side_effect' },
      { condition: 'Malignant Hyperthermia', clue: 'Exposure to volatile anesthetics or succinylcholine, acute onset during/after surgery, masseter rigidity, metabolic acidosis', clue_type: 'history_pivot' },
    ],
    common_traps: ['NMS = rigidity (lead-pipe), SS = clonus/hyperreflexia — key physical exam distinction', 'NMS develops over days, SS develops over hours', 'Missing medication history as the crucial discriminator'],
  },
  {
    name: 'hyperkalemia_vs_hypocalcemia_ecg',
    conditions: ['Hyperkalemia', 'Hypocalcemia'],
    discriminating_clues: [
      { condition: 'Hyperkalemia', clue: 'Peaked T waves, widened QRS, loss of P waves, sine wave pattern; K+ >5.5 mEq/L on labs', clue_type: 'lab_pattern' },
      { condition: 'Hypocalcemia', clue: 'Prolonged QT interval (specifically QTc), no T wave changes, positive Chvostek/Trousseau signs, low calcium on labs', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Both can cause cardiac arrhythmias but have opposite ECG signatures', 'Missing that hyperkalemia ECG changes require emergent treatment (calcium gluconate)', 'Not checking ionized calcium (total calcium can be falsely low with hypoalbuminemia)'],
  },
];
