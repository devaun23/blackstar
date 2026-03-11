// Gold evaluation harness (Block B6).
// 10 IM topics that serve as a frozen regression suite.
// Every pipeline update runs against this set; pass rate >= 90%.

import type { TaskType } from './database';
import type { SuppressionStyle } from './canonical-vocab';

// ---------------------------------------------------------------------------
// Gold proving topic — what a topic must specify
// ---------------------------------------------------------------------------

export interface GoldProvingTopic {
  gold_id: string;                         // GOLD.MED.{TOPIC}.{SEQ}
  topic: string;
  system: string;
  required_source_refs: string[];          // canonical IDs of required sources
  algorithm_card_requirements: {
    entry_presentation: string;
    competing_paths: string[];
    hinge_feature: string;
    correct_action: string;
  };
  target_item_plans: {
    task_type: TaskType;
    suppression_style: SuppressionStyle;
    expected_distractor_families: string[];
    expected_hinge: string;
  }[];
  rejection_examples: {
    description: string;
    rule: string;
    why: string;
  }[];
  approved_example: {
    vignette_summary: string;
    correct_answer: string;
    quality_notes: string;
  } | null;
}

// ---------------------------------------------------------------------------
// 10-topic gold set — stubs to be filled during proving ground
// ---------------------------------------------------------------------------

export const GOLD_TOPICS: GoldProvingTopic[] = [
  {
    gold_id: 'GOLD.MED.ACS.01',
    topic: 'Acute Coronary Syndrome',
    system: 'Cardiology',
    required_source_refs: ['SRC.B.AHA_ACC_ACS.2023'],
    algorithm_card_requirements: {
      entry_presentation: 'Acute chest pain with diaphoresis',
      competing_paths: ['STEMI', 'NSTEMI', 'Unstable Angina', 'Aortic Dissection', 'Pericarditis'],
      hinge_feature: 'ST-segment elevation on ECG',
      correct_action: 'Emergent PCI / fibrinolysis',
    },
    target_item_plans: [
      { task_type: 'next_step', suppression_style: 'classic', expected_distractor_families: ['pericardial_disease', 'aortic_disease'], expected_hinge: 'ECG findings' },
      { task_type: 'diagnosis', suppression_style: 'competing_pattern', expected_distractor_families: ['coronary_artery_disease', 'venous_thromboembolism'], expected_hinge: 'Troponin timeline' },
    ],
    rejection_examples: [
      { description: 'Stem names STEMI in the question', rule: 'R-NBME-01', why: 'Diagnosis named in stem removes clinical reasoning' },
      { description: 'Only aspirin is plausible among choices', rule: 'R-NBME-02', why: 'Single plausible answer = no decision fork' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.PE.01',
    topic: 'Pulmonary Embolism',
    system: 'Pulmonary',
    required_source_refs: ['SRC.B.ATS_PE.2019'],
    algorithm_card_requirements: {
      entry_presentation: 'Acute dyspnea and pleuritic chest pain post-surgery',
      competing_paths: ['PE', 'Pneumonia', 'CHF Exacerbation', 'Pneumothorax'],
      hinge_feature: 'Wells score + D-dimer result',
      correct_action: 'CT angiography → anticoagulation',
    },
    target_item_plans: [
      { task_type: 'diagnostic_test', suppression_style: 'competing_pattern', expected_distractor_families: ['pneumonia', 'heart_failure'], expected_hinge: 'Risk stratification score' },
    ],
    rejection_examples: [
      { description: 'CT angiography ordered without risk stratification', rule: 'R-MED-04', why: 'Skips clinical reasoning step' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.CHF.01',
    topic: 'CHF Exacerbation',
    system: 'Cardiology',
    required_source_refs: ['SRC.B.AHA_ACC_HF.2022'],
    algorithm_card_requirements: {
      entry_presentation: 'Progressive dyspnea on exertion, orthopnea, lower extremity edema',
      competing_paths: ['Acute decompensated HF', 'COPD exacerbation', 'PE', 'Nephrotic syndrome'],
      hinge_feature: 'BNP level + chest X-ray findings',
      correct_action: 'IV diuresis + afterload reduction',
    },
    target_item_plans: [
      { task_type: 'next_step', suppression_style: 'classic', expected_distractor_families: ['obstructive_airway_disease', 'venous_thromboembolism'], expected_hinge: 'Volume status assessment' },
    ],
    rejection_examples: [
      { description: 'Correct answer is furosemide but stem describes dry lungs', rule: 'R-MED-01', why: 'Clinical picture contradicts treatment' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.PANC.01',
    topic: 'Acute Pancreatitis',
    system: 'Gastroenterology',
    required_source_refs: ['SRC.B.ACG_PANC.2024'],
    algorithm_card_requirements: {
      entry_presentation: 'Epigastric pain radiating to the back after heavy drinking',
      competing_paths: ['Acute pancreatitis', 'PUD perforation', 'Cholecystitis', 'Mesenteric ischemia'],
      hinge_feature: 'Lipase > 3x ULN',
      correct_action: 'Aggressive IV fluids + pain control + NPO',
    },
    target_item_plans: [
      { task_type: 'diagnostic_test', suppression_style: 'classic', expected_distractor_families: ['peptic_ulcer_disease', 'biliary_disease'], expected_hinge: 'Lipase vs amylase sensitivity' },
      { task_type: 'next_step', suppression_style: 'management_hinge', expected_distractor_families: ['pancreatic_disease'], expected_hinge: 'Severity assessment timing' },
    ],
    rejection_examples: [
      { description: 'Stem says "the patient has pancreatitis, what is next"', rule: 'R-NBME-01', why: 'Diagnosis given, no reasoning required' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.SBP.01',
    topic: 'Cirrhosis / SBP',
    system: 'Hepatology',
    required_source_refs: ['SRC.B.AASLD_CIRRH.2023'],
    algorithm_card_requirements: {
      entry_presentation: 'Cirrhotic patient with fever, abdominal pain, and ascites',
      competing_paths: ['SBP', 'Secondary peritonitis', 'Hepatorenal syndrome', 'Hepatic encephalopathy'],
      hinge_feature: 'Ascitic fluid PMN count > 250/mm³',
      correct_action: 'IV cefotaxime + albumin',
    },
    target_item_plans: [
      { task_type: 'next_step', suppression_style: 'competing_pattern', expected_distractor_families: ['chronic_liver_disease', 'hepatic_complications'], expected_hinge: 'Paracentesis results' },
    ],
    rejection_examples: [
      { description: 'Lists "SBP" as a choice label', rule: 'R-NBME-03', why: 'Abbreviation reveals diagnosis pattern' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.GIB.01',
    topic: 'GI Bleed',
    system: 'Gastroenterology',
    required_source_refs: ['SRC.B.ACG_GIB.2023'],
    algorithm_card_requirements: {
      entry_presentation: 'Hematemesis in a patient with known cirrhosis',
      competing_paths: ['Variceal bleed', 'PUD bleed', 'Mallory-Weiss tear', 'Gastric cancer'],
      hinge_feature: 'Hemodynamic status + history of varices',
      correct_action: 'Resuscitate → octreotide + antibiotics → urgent EGD',
    },
    target_item_plans: [
      { task_type: 'stabilization', suppression_style: 'classic', expected_distractor_families: ['gi_hemorrhage', 'chronic_liver_disease'], expected_hinge: 'Initial resuscitation vs endoscopy timing' },
    ],
    rejection_examples: [
      { description: 'All distractors are medications, correct is a procedure', rule: 'R-NBME-03', why: 'Answers not same abstraction level' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.DKA.01',
    topic: 'DKA',
    system: 'Endocrine',
    required_source_refs: ['SRC.B.ADA_SOC.2024'],
    algorithm_card_requirements: {
      entry_presentation: 'Young patient with polyuria, polydipsia, abdominal pain, Kussmaul breathing',
      competing_paths: ['DKA', 'HHS', 'Alcoholic ketoacidosis', 'Lactic acidosis'],
      hinge_feature: 'Anion gap metabolic acidosis + ketonemia + hyperglycemia',
      correct_action: 'IV fluids → insulin drip → potassium monitoring',
    },
    target_item_plans: [
      { task_type: 'stabilization', suppression_style: 'competing_pattern', expected_distractor_families: ['diabetes_mellitus', 'acid_base_disorder_family'], expected_hinge: 'Potassium level before insulin' },
      { task_type: 'complication_recognition', suppression_style: 'delayed_reveal', expected_distractor_families: ['diabetes_mellitus'], expected_hinge: 'Cerebral edema risk' },
    ],
    rejection_examples: [
      { description: 'Stem gives pH, glucose, and ketones but asks for diagnosis', rule: 'R-NBME-02', why: 'Only one plausible answer with all labs given' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.SEPSIS.01',
    topic: 'Sepsis',
    system: 'Critical Care',
    required_source_refs: ['SRC.B.SSC.2021'],
    algorithm_card_requirements: {
      entry_presentation: 'Fever, tachycardia, hypotension, altered mental status after UTI',
      competing_paths: ['Sepsis/septic shock', 'Cardiogenic shock', 'Anaphylaxis', 'Adrenal crisis'],
      hinge_feature: 'Lactate level + fluid responsiveness',
      correct_action: 'Cultures → IV antibiotics within 1 hour → fluid resuscitation → vasopressors if refractory',
    },
    target_item_plans: [
      { task_type: 'stabilization', suppression_style: 'classic', expected_distractor_families: ['systemic_infection', 'shock'], expected_hinge: 'Hour-1 bundle completion' },
    ],
    rejection_examples: [
      { description: 'Correct answer is "start antibiotics" but no source is identified', rule: 'R-MED-05', why: 'Antibiotic choice without source grounding' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.AKI.01',
    topic: 'AKI',
    system: 'Nephrology',
    required_source_refs: ['SRC.B.KDIGO_AKI.2012'],
    algorithm_card_requirements: {
      entry_presentation: 'Elderly patient with rising creatinine after surgery',
      competing_paths: ['Prerenal AKI', 'ATN', 'Post-renal obstruction', 'Glomerulonephritis', 'AIN'],
      hinge_feature: 'FENa + urine sediment + renal ultrasound',
      correct_action: 'Volume resuscitation (if prerenal) → identify and treat cause',
    },
    target_item_plans: [
      { task_type: 'diagnostic_test', suppression_style: 'competing_pattern', expected_distractor_families: ['acute_kidney_injury', 'tubular_disease'], expected_hinge: 'FENa interpretation' },
      { task_type: 'diagnosis', suppression_style: 'delayed_reveal', expected_distractor_families: ['acute_kidney_injury', 'glomerular_disease'], expected_hinge: 'Urine sediment findings' },
    ],
    rejection_examples: [
      { description: 'All labs point to one diagnosis with no ambiguity', rule: 'R-NBME-02', why: 'No clinical reasoning required' },
    ],
    approved_example: null,
  },
  {
    gold_id: 'GOLD.MED.IDA.01',
    topic: 'Iron Deficiency Anemia',
    system: 'Hematology',
    required_source_refs: ['SRC.B.ASH_IDA.2020'],
    algorithm_card_requirements: {
      entry_presentation: 'Fatigue and pallor in a premenopausal woman',
      competing_paths: ['Iron deficiency', 'B12 deficiency', 'Anemia of chronic disease', 'Thalassemia trait', 'Hypothyroidism'],
      hinge_feature: 'Low ferritin + low MCV + high TIBC',
      correct_action: 'Oral iron supplementation + identify source of blood loss',
    },
    target_item_plans: [
      { task_type: 'diagnosis', suppression_style: 'classic', expected_distractor_families: ['anemia_family', 'thyroid_disorders'], expected_hinge: 'Iron studies interpretation' },
    ],
    rejection_examples: [
      { description: 'Stem gives ferritin < 10, only IDA is plausible', rule: 'R-NBME-02', why: 'Pathognomonic lab removes clinical reasoning' },
    ],
    approved_example: null,
  },
];
