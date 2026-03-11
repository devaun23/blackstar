// Exam content specs — spec-layer metadata for Medicine blueprint nodes (Block B1).
// This file defines the MedicineNodeSpec interface, subsystem defaults,
// presentation funnels, and exemplar nodes for 3 subsystems.
//
// Nodes are compact: subsystem defaults supply common values, and each node
// only specifies what differs from its subsystem's defaults.

import type { TaskType, ClinicalSetting, AgeGroup, TimeHorizon, YieldTier } from '@/lib/types/database';
import type {
  DiseaseFamily,
  PresentationPattern,
  AcuityBand,
  DifficultyTier,
  SuppressionStyle,
  NoiseBudget,
  ConfirmatoryDelay,
  HingeSentenceType,
  MisdirectionVector,
} from '@/lib/types/canonical-vocab';

// ---------------------------------------------------------------------------
// Negative space — what NOT to test
// ---------------------------------------------------------------------------

export interface NegativeSpace {
  excluded_content: string[];
  common_non_nbme_pitfalls: string[];
}

// ---------------------------------------------------------------------------
// Subsystem defaults — applied to all nodes in a subsystem unless overridden
// ---------------------------------------------------------------------------

export interface SubsystemDefaults {
  system: string;
  default_negative_space: NegativeSpace;
  default_clinical_settings: ClinicalSetting[];
  default_age_groups: AgeGroup[];
  common_disease_families: DiseaseFamily[];
  common_presentations: PresentationPattern[];
}

// ---------------------------------------------------------------------------
// MedicineNodeSpec — the full spec-layer shape for a blueprint node
//
// FIELD ORDER CONVENTION (all nodes MUST follow this order):
//
//   GROUP 1: IDENTITY      — node_id, canonical_id
//   GROUP 2: DB CORE       — shelf, system, topic, subtopic, task_type,
//                             clinical_setting, age_group, time_horizon,
//                             yield_tier
//   GROUP 3: SCORING       — exam_frequency, clinical_frequency, frequency_score
//   GROUP 4: CLINICAL SPEC — disease_family, presentation_patterns, acuity_band,
//                             difficulty_tier, algorithm_concept,
//                             competing_diagnoses, key_distinguishing_features
//   GROUP 5: SUPPRESSION   — suppression_style, noise_budget, confirmatory_delay,
//                             hinge_sentence_type, misdirection_vectors,
//                             plausible_distractor_families,
//                             required_reconciliation_steps
//   GROUP 6: LINKS         — negative_space_override, nbme_sample_item_ids,
//                             gold_topic_id
// ---------------------------------------------------------------------------

export interface MedicineNodeSpec {
  // GROUP 1: IDENTITY
  node_id: string;         // Immutable short key, e.g. "N_CARD001". Machines use this.
  canonical_id: string;    // Human-readable, e.g. "MED.CARD.ACS.STEMI.NXT.ED.MID"

  // GROUP 2: DB CORE
  shelf: 'medicine';
  system: string;
  topic: string;
  subtopic: string | null;
  task_type: TaskType;
  clinical_setting: ClinicalSetting;
  age_group: AgeGroup;
  time_horizon: TimeHorizon;
  yield_tier: YieldTier;

  // GROUP 3: SCORING
  exam_frequency: number;      // 0–100: how often this appears on boards
  clinical_frequency: number;  // 0–100: how common in clinical practice
  frequency_score: number;     // Computed: weighted blend stored in DB

  // GROUP 4: CLINICAL SPEC
  disease_family: DiseaseFamily;
  presentation_patterns: PresentationPattern[];
  acuity_band: AcuityBand;
  difficulty_tier: DifficultyTier;
  algorithm_concept: string;
  competing_diagnoses: string[];
  key_distinguishing_features: string[];

  // GROUP 5: SUPPRESSION
  suppression_style: SuppressionStyle;
  noise_budget: NoiseBudget;
  confirmatory_delay: ConfirmatoryDelay;
  hinge_sentence_type: HingeSentenceType;
  misdirection_vectors: MisdirectionVector[];
  plausible_distractor_families: DiseaseFamily[];
  required_reconciliation_steps: number;

  // GROUP 6: LINKS
  negative_space_override?: Partial<NegativeSpace>;
  nbme_sample_item_ids: string[];
  gold_topic_id?: string;
}

// ---------------------------------------------------------------------------
// Node ID generator — deterministic short IDs from subsystem code + counter
// Format: N_{SUBSYSTEM_CODE}{3-digit seq} — e.g. N_CARD001, N_GI005
// Deterministic: same node always gets same ID. No random generation.
// ---------------------------------------------------------------------------

const _nodeCounters: Record<string, number> = {};

export function generateNodeId(subsystemCode: string): string {
  const count = (_nodeCounters[subsystemCode] ?? 0) + 1;
  _nodeCounters[subsystemCode] = count;
  return `N_${subsystemCode}${String(count).padStart(3, '0')}`;
}

export function resetNodeCounters(): void {
  for (const key of Object.keys(_nodeCounters)) {
    delete _nodeCounters[key];
  }
}

// ---------------------------------------------------------------------------
// Presentation funnel — maps a presenting complaint to its weighted differential
// ---------------------------------------------------------------------------

export interface PresentationFunnel {
  pattern: PresentationPattern;
  competing_diagnoses: {
    name: string;
    prevalence_weight: number;  // 0.0–1.0, within-funnel relative weight
    disease_family: DiseaseFamily;
  }[];
}

// ---------------------------------------------------------------------------
// Frequency score computation — dual-axis input, single DB output
// ---------------------------------------------------------------------------

export function computeFrequencyScore(params: {
  exam_frequency: number;      // 0–100: primary driver (70% weight)
  clinical_frequency: number;  // 0–100: secondary (30% weight)
}): number {
  return Math.round(params.exam_frequency * 0.7 + params.clinical_frequency * 0.3);
}

// ===========================================================================
// SUBSYSTEM DEFAULTS — all 15 Medicine subsystems
// ===========================================================================

// ---------------------------------------------------------------------------
// Subsystem defaults — Cardiology
// ---------------------------------------------------------------------------

export const CARDIOLOGY_DEFAULTS: SubsystemDefaults = {
  system: 'Cardiology',
  default_negative_space: {
    excluded_content: [
      'PCI technique details',
      'Stent type selection',
      'Device programming',
      'Cardiac rehab protocols',
      'Surgical valve repair technique',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing Vaughan-Williams antiarrhythmic classes',
      'Obscure murmur grading scales',
      'Hemodynamic waveform interpretation',
    ],
  },
  default_clinical_settings: ['ed', 'inpatient', 'outpatient'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'coronary_artery_disease',
    'heart_failure',
    'arrhythmia',
    'valvular_heart_disease',
    'hypertension',
    'pericardial_disease',
    'aortic_disease',
    'endocarditis',
  ],
  common_presentations: ['chest_pain', 'dyspnea', 'syncope', 'palpitations', 'edema'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — GI / Hepatology
// ---------------------------------------------------------------------------

export const GI_DEFAULTS: SubsystemDefaults = {
  system: 'Gastroenterology',
  default_negative_space: {
    excluded_content: [
      'Endoscopic technique details',
      'Surgical anastomosis types',
      'Motility study interpretation',
      'Specific chemotherapy regimens for GI cancers',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing Rome criteria subcategories',
      'Obscure GI hormone pathways',
    ],
  },
  default_clinical_settings: ['ed', 'inpatient', 'outpatient'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'peptic_ulcer_disease',
    'inflammatory_bowel_disease',
    'gi_hemorrhage',
    'pancreatic_disease',
    'biliary_disease',
    'bowel_obstruction',
    'malabsorption',
  ],
  common_presentations: ['abdominal_pain', 'gi_bleed', 'diarrhea', 'vomiting', 'weight_loss'],
};

export const HEPATOLOGY_DEFAULTS: SubsystemDefaults = {
  system: 'Hepatology',
  default_negative_space: {
    excluded_content: [
      'TIPS procedure technique',
      'Transplant immunosuppression protocols',
      'Liver biopsy scoring systems beyond METAVIR',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing Child-Pugh vs MELD component details',
      'Obscure viral hepatitis genotype treatments',
    ],
  },
  default_clinical_settings: ['inpatient', 'outpatient'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'chronic_liver_disease',
    'viral_hepatitis',
    'hepatic_complications',
  ],
  common_presentations: ['jaundice', 'abdominal_pain', 'gi_bleed', 'altered_mental_status', 'edema'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Endocrine
// ---------------------------------------------------------------------------

export const ENDOCRINE_DEFAULTS: SubsystemDefaults = {
  system: 'Endocrinology',
  default_negative_space: {
    excluded_content: [
      'Insulin pump programming',
      'CGM device specifics',
      'Surgical thyroidectomy technique',
      'Adrenal surgery approach',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing insulin brand names',
      'Rare MEN syndrome subtypes',
      'Obscure pituitary staining patterns',
    ],
  },
  default_clinical_settings: ['outpatient', 'ed', 'icu'],
  default_age_groups: ['young_adult', 'middle_aged', 'elderly'],
  common_disease_families: [
    'diabetes_mellitus',
    'thyroid_disorders',
    'adrenal_disorders',
    'pituitary_disorders',
    'calcium_metabolism',
    'osteoporosis',
  ],
  common_presentations: ['polyuria_polydipsia', 'weight_loss', 'weakness_fatigue', 'altered_mental_status'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Pulmonary
// ---------------------------------------------------------------------------

export const PULM_DEFAULTS: SubsystemDefaults = {
  system: 'Pulmonary',
  default_negative_space: {
    excluded_content: [
      'Ventilator waveform analysis',
      'Bronchoscopy technique',
      'Pulmonary function test machine calibration',
      'Thoracic surgery approach details',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing flow-volume loop subtypes beyond classic patterns',
      'Obscure ILD histopathology classification',
    ],
  },
  default_clinical_settings: ['ed', 'inpatient', 'outpatient'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'obstructive_airway_disease',
    'venous_thromboembolism',
    'pneumonia',
    'pleural_disease',
    'interstitial_lung_disease',
    'lung_neoplasm',
  ],
  common_presentations: ['dyspnea', 'cough_fever', 'chest_pain'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Nephrology
// ---------------------------------------------------------------------------

export const NEPH_DEFAULTS: SubsystemDefaults = {
  system: 'Nephrology',
  default_negative_space: {
    excluded_content: [
      'Dialysis machine settings',
      'Renal biopsy technique',
      'Transplant crossmatch details',
      'Specific immunosuppressant dosing protocols',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing all tubular defect eponyms',
      'Obscure complement pathway details in GN',
    ],
  },
  default_clinical_settings: ['inpatient', 'outpatient', 'icu'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'acute_kidney_injury',
    'chronic_kidney_disease',
    'glomerular_disease',
    'nephrolithiasis',
    'tubular_disease',
  ],
  common_presentations: ['renal_failure', 'edema', 'electrolyte_abnormality', 'acid_base_disorder'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Hematology/Oncology
// ---------------------------------------------------------------------------

export const HEME_DEFAULTS: SubsystemDefaults = {
  system: 'Hematology/Oncology',
  default_negative_space: {
    excluded_content: [
      'Specific chemotherapy regimen dosing',
      'Bone marrow transplant conditioning protocols',
      'Flow cytometry interpretation beyond basics',
      'Cytogenetic nomenclature details',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing all hemoglobin variant electrophoresis patterns',
      'Obscure coagulation factor cascade details',
    ],
  },
  default_clinical_settings: ['inpatient', 'outpatient', 'ed'],
  default_age_groups: ['young_adult', 'middle_aged', 'elderly'],
  common_disease_families: [
    'anemia_family',
    'coagulopathy',
    'leukemia_lymphoma',
    'paraneoplastic',
  ],
  common_presentations: ['anemia', 'weakness_fatigue', 'fever_unknown_source', 'weight_loss'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Infectious Disease
// ---------------------------------------------------------------------------

export const ID_DEFAULTS: SubsystemDefaults = {
  system: 'Infectious Disease',
  default_negative_space: {
    excluded_content: [
      'Antibiotic synthesis mechanisms',
      'Viral replication cycle details',
      'Specific resistance gene nomenclature',
      'Microbiology culture technique',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing every antibiotic spectrum detail',
      'Obscure tropical parasite life cycles',
    ],
  },
  default_clinical_settings: ['inpatient', 'ed', 'outpatient'],
  default_age_groups: ['young_adult', 'middle_aged', 'elderly'],
  common_disease_families: [
    'systemic_infection',
    'respiratory_infection',
    'urinary_infection',
    'cns_infection',
    'sexually_transmitted_infection',
    'opportunistic_infection',
  ],
  common_presentations: ['fever_unknown_source', 'cough_fever', 'altered_mental_status', 'rash_systemic'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Rheumatology
// ---------------------------------------------------------------------------

export const RHEUM_DEFAULTS: SubsystemDefaults = {
  system: 'Rheumatology',
  default_negative_space: {
    excluded_content: [
      'Biologic mechanism of action details beyond class',
      'Joint injection technique',
      'Specific radiographic scoring systems',
      'Nailfold capillaroscopy interpretation',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing all ANA subtypes beyond high-yield associations',
      'Obscure classification criteria point systems',
    ],
  },
  default_clinical_settings: ['outpatient', 'inpatient', 'ed'],
  default_age_groups: ['young_adult', 'middle_aged', 'elderly'],
  common_disease_families: [
    'autoimmune_connective_tissue',
    'crystal_arthropathy',
    'vasculitis',
    'spondyloarthropathy',
  ],
  common_presentations: ['joint_pain_autoimmune', 'rash_systemic', 'renal_failure', 'weakness_fatigue'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Electrolytes/Acid-Base
// ---------------------------------------------------------------------------

export const LYTE_DEFAULTS: SubsystemDefaults = {
  system: 'Electrolytes/Acid-Base',
  default_negative_space: {
    excluded_content: [
      'Renal tubular transporter molecular biology',
      'Detailed Henderson-Hasselbalch derivation',
      'IV fluid manufacturing details',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing every cause of SIADH',
      'Obscure RTA subtype biochemistry beyond clinical presentation',
    ],
  },
  default_clinical_settings: ['inpatient', 'icu', 'ed'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'sodium_disorder',
    'potassium_disorder',
    'calcium_disorder',
    'acid_base_disorder_family',
  ],
  common_presentations: ['electrolyte_abnormality', 'acid_base_disorder', 'altered_mental_status', 'weakness_fatigue'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Neurology-within-IM
// ---------------------------------------------------------------------------

export const NEURO_DEFAULTS: SubsystemDefaults = {
  system: 'Neurology-within-IM',
  default_negative_space: {
    excluded_content: [
      'Neurosurgical technique',
      'Detailed EEG interpretation beyond seizure localization',
      'Advanced neuroimaging sequences',
      'Rare genetic neurological conditions',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing detailed cranial nerve nuclei anatomy',
      'Obscure spinal cord tract localization',
    ],
  },
  default_clinical_settings: ['ed', 'inpatient', 'outpatient'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'cerebrovascular',
    'demyelinating',
    'neuromuscular',
    'movement_disorder',
    'seizure_disorder',
  ],
  common_presentations: ['headache_focal_deficit', 'weakness_fatigue', 'altered_mental_status', 'syncope'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Preventive/Screening
// ---------------------------------------------------------------------------

export const PREV_DEFAULTS: SubsystemDefaults = {
  system: 'Preventive/Screening',
  default_negative_space: {
    excluded_content: [
      'Screening test sensitivity/specificity calculations',
      'Epidemiologic study design details',
      'Public health policy implementation',
      'Insurance coverage details',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing exact screening interval exceptions',
      'Obscure USPSTF grade definitions beyond A/B/D',
    ],
  },
  default_clinical_settings: ['outpatient'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'preventive_care',
  ],
  common_presentations: ['weakness_fatigue'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Dermatology-within-IM
// ---------------------------------------------------------------------------

export const DERM_DEFAULTS: SubsystemDefaults = {
  system: 'Dermatology-within-IM',
  default_negative_space: {
    excluded_content: [
      'Dermatopathology staining details',
      'Surgical excision margin specifics',
      'Cosmetic dermatology procedures',
      'Rare genodermatoses',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing Fitzpatrick skin type details',
      'Obscure dermatitis subtypes beyond IM relevance',
    ],
  },
  default_clinical_settings: ['outpatient', 'inpatient'],
  default_age_groups: ['young_adult', 'middle_aged', 'elderly'],
  common_disease_families: [
    'skin_neoplasm',
    'drug_reaction',
    'autoimmune_connective_tissue',
  ],
  common_presentations: ['rash_systemic', 'fever_unknown_source'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Toxicology-within-IM
// ---------------------------------------------------------------------------

export const TOX_DEFAULTS: SubsystemDefaults = {
  system: 'Toxicology-within-IM',
  default_negative_space: {
    excluded_content: [
      'Toxicokinetic modeling',
      'Industrial chemical exposure thresholds',
      'Forensic toxicology chain of custody',
      'Drug rehabilitation program specifics',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing every toxidrome medication cause',
      'Obscure antidote dosing beyond initial management',
    ],
  },
  default_clinical_settings: ['ed', 'icu'],
  default_age_groups: ['young_adult', 'middle_aged'],
  common_disease_families: [
    'toxicology',
  ],
  common_presentations: ['altered_mental_status', 'acid_base_disorder', 'vomiting'],
};

// ---------------------------------------------------------------------------
// Subsystem defaults — Critical Care/Shock
// ---------------------------------------------------------------------------

export const CRIT_DEFAULTS: SubsystemDefaults = {
  system: 'Critical Care/Shock',
  default_negative_space: {
    excluded_content: [
      'Ventilator mode programming details',
      'Hemodynamic catheter waveform subtleties',
      'ICU nursing protocols',
      'Organ procurement procedures',
    ],
    common_non_nbme_pitfalls: [
      'Memorizing specific vasopressor receptor profiles',
      'Obscure ARDS ventilator trial protocol details',
    ],
  },
  default_clinical_settings: ['icu', 'ed'],
  default_age_groups: ['middle_aged', 'elderly'],
  common_disease_families: [
    'shock',
    'systemic_infection',
    'venous_thromboembolism',
  ],
  common_presentations: ['altered_mental_status', 'dyspnea', 'chest_pain'],
};

// ---------------------------------------------------------------------------
// Presentation funnels — all 23 canonical patterns (weighted differentials)
// ---------------------------------------------------------------------------

export const MEDICINE_FUNNELS: PresentationFunnel[] = [
  {
    pattern: 'chest_pain',
    competing_diagnoses: [
      { name: 'STEMI', prevalence_weight: 0.15, disease_family: 'coronary_artery_disease' },
      { name: 'NSTEMI', prevalence_weight: 0.20, disease_family: 'coronary_artery_disease' },
      { name: 'Unstable angina', prevalence_weight: 0.10, disease_family: 'coronary_artery_disease' },
      { name: 'Stable angina', prevalence_weight: 0.10, disease_family: 'coronary_artery_disease' },
      { name: 'Aortic dissection', prevalence_weight: 0.05, disease_family: 'aortic_disease' },
      { name: 'Pericarditis', prevalence_weight: 0.08, disease_family: 'pericardial_disease' },
      { name: 'PE', prevalence_weight: 0.07, disease_family: 'venous_thromboembolism' },
      { name: 'GERD', prevalence_weight: 0.12, disease_family: 'peptic_ulcer_disease' },
      { name: 'Costochondritis', prevalence_weight: 0.10, disease_family: 'peptic_ulcer_disease' },
      { name: 'Esophageal rupture', prevalence_weight: 0.03, disease_family: 'peptic_ulcer_disease' },
    ],
  },
  {
    pattern: 'dyspnea',
    competing_diagnoses: [
      { name: 'CHF exacerbation', prevalence_weight: 0.20, disease_family: 'heart_failure' },
      { name: 'COPD exacerbation', prevalence_weight: 0.18, disease_family: 'obstructive_airway_disease' },
      { name: 'Asthma exacerbation', prevalence_weight: 0.12, disease_family: 'obstructive_airway_disease' },
      { name: 'PE', prevalence_weight: 0.10, disease_family: 'venous_thromboembolism' },
      { name: 'Pneumonia', prevalence_weight: 0.15, disease_family: 'pneumonia' },
      { name: 'ARDS', prevalence_weight: 0.05, disease_family: 'pneumonia' },
      { name: 'Pleural effusion', prevalence_weight: 0.08, disease_family: 'pleural_disease' },
      { name: 'ILD', prevalence_weight: 0.05, disease_family: 'interstitial_lung_disease' },
      { name: 'Severe anemia', prevalence_weight: 0.07, disease_family: 'anemia_family' },
    ],
  },
  {
    pattern: 'syncope',
    competing_diagnoses: [
      { name: 'Vasovagal syncope', prevalence_weight: 0.35, disease_family: 'arrhythmia' },
      { name: 'Arrhythmia', prevalence_weight: 0.25, disease_family: 'arrhythmia' },
      { name: 'Aortic stenosis', prevalence_weight: 0.15, disease_family: 'valvular_heart_disease' },
      { name: 'Orthostatic hypotension', prevalence_weight: 0.15, disease_family: 'arrhythmia' },
      { name: 'Massive PE', prevalence_weight: 0.10, disease_family: 'venous_thromboembolism' },
    ],
  },
  {
    pattern: 'abdominal_pain',
    competing_diagnoses: [
      { name: 'Acute pancreatitis', prevalence_weight: 0.18, disease_family: 'pancreatic_disease' },
      { name: 'Cholecystitis', prevalence_weight: 0.20, disease_family: 'biliary_disease' },
      { name: 'PUD/perforation', prevalence_weight: 0.15, disease_family: 'peptic_ulcer_disease' },
      { name: 'SBO', prevalence_weight: 0.15, disease_family: 'bowel_obstruction' },
      { name: 'Diverticulitis', prevalence_weight: 0.12, disease_family: 'inflammatory_bowel_disease' },
      { name: 'Mesenteric ischemia', prevalence_weight: 0.10, disease_family: 'aortic_disease' },
      { name: 'SBP', prevalence_weight: 0.10, disease_family: 'hepatic_complications' },
    ],
  },
  {
    pattern: 'gi_bleed',
    competing_diagnoses: [
      { name: 'Variceal bleed', prevalence_weight: 0.25, disease_family: 'chronic_liver_disease' },
      { name: 'PUD bleed', prevalence_weight: 0.30, disease_family: 'peptic_ulcer_disease' },
      { name: 'Diverticular bleed', prevalence_weight: 0.20, disease_family: 'gi_hemorrhage' },
      { name: 'Mallory-Weiss tear', prevalence_weight: 0.15, disease_family: 'gi_hemorrhage' },
      { name: 'Colon cancer', prevalence_weight: 0.10, disease_family: 'gi_hemorrhage' },
    ],
  },
  {
    pattern: 'jaundice',
    competing_diagnoses: [
      { name: 'Viral hepatitis', prevalence_weight: 0.20, disease_family: 'viral_hepatitis' },
      { name: 'Alcoholic hepatitis', prevalence_weight: 0.18, disease_family: 'chronic_liver_disease' },
      { name: 'Choledocholithiasis', prevalence_weight: 0.18, disease_family: 'biliary_disease' },
      { name: 'Cholangitis', prevalence_weight: 0.12, disease_family: 'biliary_disease' },
      { name: 'DILI', prevalence_weight: 0.12, disease_family: 'chronic_liver_disease' },
      { name: 'Hemolysis', prevalence_weight: 0.10, disease_family: 'anemia_family' },
      { name: 'Gilbert syndrome', prevalence_weight: 0.10, disease_family: 'chronic_liver_disease' },
    ],
  },
  {
    pattern: 'polyuria_polydipsia',
    competing_diagnoses: [
      { name: 'DM type 2', prevalence_weight: 0.30, disease_family: 'diabetes_mellitus' },
      { name: 'DKA', prevalence_weight: 0.20, disease_family: 'diabetes_mellitus' },
      { name: 'HHS', prevalence_weight: 0.10, disease_family: 'diabetes_mellitus' },
      { name: 'Diabetes insipidus', prevalence_weight: 0.15, disease_family: 'pituitary_disorders' },
      { name: 'Hypercalcemia', prevalence_weight: 0.15, disease_family: 'calcium_metabolism' },
      { name: 'Primary polydipsia', prevalence_weight: 0.10, disease_family: 'pituitary_disorders' },
    ],
  },
  {
    pattern: 'altered_mental_status',
    competing_diagnoses: [
      { name: 'Sepsis', prevalence_weight: 0.20, disease_family: 'systemic_infection' },
      { name: 'Hepatic encephalopathy', prevalence_weight: 0.15, disease_family: 'hepatic_complications' },
      { name: 'Hypoglycemia', prevalence_weight: 0.12, disease_family: 'diabetes_mellitus' },
      { name: 'DKA', prevalence_weight: 0.10, disease_family: 'diabetes_mellitus' },
      { name: 'Hyponatremia', prevalence_weight: 0.12, disease_family: 'sodium_disorder' },
      { name: 'Uremia', prevalence_weight: 0.10, disease_family: 'chronic_kidney_disease' },
      { name: 'Wernicke encephalopathy', prevalence_weight: 0.08, disease_family: 'toxicology' },
      { name: 'Stroke', prevalence_weight: 0.13, disease_family: 'cerebrovascular' },
    ],
  },
  // --- 15 new funnels below ---
  {
    pattern: 'palpitations',
    competing_diagnoses: [
      { name: 'Atrial fibrillation', prevalence_weight: 0.25, disease_family: 'arrhythmia' },
      { name: 'SVT', prevalence_weight: 0.20, disease_family: 'arrhythmia' },
      { name: 'Premature beats (PAC/PVC)', prevalence_weight: 0.15, disease_family: 'arrhythmia' },
      { name: 'Hyperthyroidism', prevalence_weight: 0.12, disease_family: 'thyroid_disorders' },
      { name: 'Panic/anxiety disorder', prevalence_weight: 0.13, disease_family: 'arrhythmia' },
      { name: 'Pheochromocytoma', prevalence_weight: 0.05, disease_family: 'adrenal_disorders' },
      { name: 'Anemia', prevalence_weight: 0.10, disease_family: 'anemia_family' },
    ],
  },
  {
    pattern: 'edema',
    competing_diagnoses: [
      { name: 'Heart failure', prevalence_weight: 0.25, disease_family: 'heart_failure' },
      { name: 'Nephrotic syndrome', prevalence_weight: 0.15, disease_family: 'glomerular_disease' },
      { name: 'Cirrhosis', prevalence_weight: 0.15, disease_family: 'chronic_liver_disease' },
      { name: 'DVT', prevalence_weight: 0.15, disease_family: 'venous_thromboembolism' },
      { name: 'CKD volume overload', prevalence_weight: 0.10, disease_family: 'chronic_kidney_disease' },
      { name: 'Medication-induced', prevalence_weight: 0.10, disease_family: 'heart_failure' },
      { name: 'Lymphedema', prevalence_weight: 0.10, disease_family: 'venous_thromboembolism' },
    ],
  },
  {
    pattern: 'diarrhea',
    competing_diagnoses: [
      { name: 'C. difficile colitis', prevalence_weight: 0.18, disease_family: 'systemic_infection' },
      { name: 'Inflammatory bowel disease', prevalence_weight: 0.15, disease_family: 'inflammatory_bowel_disease' },
      { name: 'Infectious gastroenteritis', prevalence_weight: 0.20, disease_family: 'systemic_infection' },
      { name: 'Celiac disease', prevalence_weight: 0.12, disease_family: 'malabsorption' },
      { name: 'Microscopic colitis', prevalence_weight: 0.08, disease_family: 'inflammatory_bowel_disease' },
      { name: 'Hyperthyroidism', prevalence_weight: 0.07, disease_family: 'thyroid_disorders' },
      { name: 'Osmotic (lactose intolerance)', prevalence_weight: 0.10, disease_family: 'malabsorption' },
      { name: 'Carcinoid syndrome', prevalence_weight: 0.05, disease_family: 'paraneoplastic' },
      { name: 'Medication-induced', prevalence_weight: 0.05, disease_family: 'malabsorption' },
    ],
  },
  {
    pattern: 'vomiting',
    competing_diagnoses: [
      { name: 'SBO', prevalence_weight: 0.20, disease_family: 'bowel_obstruction' },
      { name: 'Gastroparesis', prevalence_weight: 0.12, disease_family: 'diabetes_mellitus' },
      { name: 'DKA', prevalence_weight: 0.12, disease_family: 'diabetes_mellitus' },
      { name: 'Pancreatitis', prevalence_weight: 0.15, disease_family: 'pancreatic_disease' },
      { name: 'Cholecystitis', prevalence_weight: 0.15, disease_family: 'biliary_disease' },
      { name: 'Uremia', prevalence_weight: 0.08, disease_family: 'chronic_kidney_disease' },
      { name: 'Adrenal crisis', prevalence_weight: 0.05, disease_family: 'adrenal_disorders' },
      { name: 'Raised intracranial pressure', prevalence_weight: 0.08, disease_family: 'cerebrovascular' },
      { name: 'Medication-induced', prevalence_weight: 0.05, disease_family: 'toxicology' },
    ],
  },
  {
    pattern: 'weight_loss',
    competing_diagnoses: [
      { name: 'Malignancy', prevalence_weight: 0.25, disease_family: 'lung_neoplasm' },
      { name: 'Hyperthyroidism', prevalence_weight: 0.15, disease_family: 'thyroid_disorders' },
      { name: 'DM type 1/poorly controlled DM', prevalence_weight: 0.12, disease_family: 'diabetes_mellitus' },
      { name: 'HIV/AIDS', prevalence_weight: 0.10, disease_family: 'opportunistic_infection' },
      { name: 'Celiac disease', prevalence_weight: 0.08, disease_family: 'malabsorption' },
      { name: 'IBD', prevalence_weight: 0.10, disease_family: 'inflammatory_bowel_disease' },
      { name: 'Adrenal insufficiency', prevalence_weight: 0.07, disease_family: 'adrenal_disorders' },
      { name: 'Tuberculosis', prevalence_weight: 0.08, disease_family: 'respiratory_infection' },
      { name: 'Depression', prevalence_weight: 0.05, disease_family: 'preventive_care' },
    ],
  },
  {
    pattern: 'weakness_fatigue',
    competing_diagnoses: [
      { name: 'Anemia', prevalence_weight: 0.20, disease_family: 'anemia_family' },
      { name: 'Hypothyroidism', prevalence_weight: 0.15, disease_family: 'thyroid_disorders' },
      { name: 'Adrenal insufficiency', prevalence_weight: 0.08, disease_family: 'adrenal_disorders' },
      { name: 'Heart failure', prevalence_weight: 0.12, disease_family: 'heart_failure' },
      { name: 'CKD', prevalence_weight: 0.10, disease_family: 'chronic_kidney_disease' },
      { name: 'Myasthenia gravis', prevalence_weight: 0.07, disease_family: 'neuromuscular' },
      { name: 'Hypokalemia', prevalence_weight: 0.08, disease_family: 'potassium_disorder' },
      { name: 'Multiple sclerosis', prevalence_weight: 0.06, disease_family: 'demyelinating' },
      { name: 'Malignancy', prevalence_weight: 0.09, disease_family: 'paraneoplastic' },
      { name: 'Depression', prevalence_weight: 0.05, disease_family: 'preventive_care' },
    ],
  },
  {
    pattern: 'anemia',
    competing_diagnoses: [
      { name: 'Iron deficiency anemia', prevalence_weight: 0.30, disease_family: 'anemia_family' },
      { name: 'Anemia of chronic disease', prevalence_weight: 0.18, disease_family: 'anemia_family' },
      { name: 'B12/folate deficiency', prevalence_weight: 0.15, disease_family: 'anemia_family' },
      { name: 'Hemolytic anemia', prevalence_weight: 0.12, disease_family: 'anemia_family' },
      { name: 'Sickle cell disease', prevalence_weight: 0.08, disease_family: 'anemia_family' },
      { name: 'Thalassemia', prevalence_weight: 0.07, disease_family: 'anemia_family' },
      { name: 'Myelodysplastic syndrome', prevalence_weight: 0.05, disease_family: 'leukemia_lymphoma' },
      { name: 'Aplastic anemia', prevalence_weight: 0.05, disease_family: 'anemia_family' },
    ],
  },
  {
    pattern: 'fever_unknown_source',
    competing_diagnoses: [
      { name: 'Endocarditis', prevalence_weight: 0.12, disease_family: 'endocarditis' },
      { name: 'Occult abscess', prevalence_weight: 0.15, disease_family: 'systemic_infection' },
      { name: 'Tuberculosis', prevalence_weight: 0.10, disease_family: 'respiratory_infection' },
      { name: 'Lymphoma', prevalence_weight: 0.12, disease_family: 'leukemia_lymphoma' },
      { name: 'Autoimmune (SLE, vasculitis)', prevalence_weight: 0.12, disease_family: 'autoimmune_connective_tissue' },
      { name: 'Drug fever', prevalence_weight: 0.10, disease_family: 'drug_reaction' },
      { name: 'UTI/pyelonephritis', prevalence_weight: 0.12, disease_family: 'urinary_infection' },
      { name: 'Osteomyelitis', prevalence_weight: 0.08, disease_family: 'systemic_infection' },
      { name: 'HIV', prevalence_weight: 0.09, disease_family: 'opportunistic_infection' },
    ],
  },
  {
    pattern: 'headache_focal_deficit',
    competing_diagnoses: [
      { name: 'Ischemic stroke', prevalence_weight: 0.25, disease_family: 'cerebrovascular' },
      { name: 'Hemorrhagic stroke/SAH', prevalence_weight: 0.15, disease_family: 'cerebrovascular' },
      { name: 'TIA', prevalence_weight: 0.15, disease_family: 'cerebrovascular' },
      { name: 'Brain tumor', prevalence_weight: 0.10, disease_family: 'paraneoplastic' },
      { name: 'Meningitis', prevalence_weight: 0.12, disease_family: 'cns_infection' },
      { name: 'Migraine with aura', prevalence_weight: 0.10, disease_family: 'cerebrovascular' },
      { name: 'Hypertensive emergency', prevalence_weight: 0.08, disease_family: 'hypertension' },
      { name: 'Giant cell arteritis', prevalence_weight: 0.05, disease_family: 'vasculitis' },
    ],
  },
  {
    pattern: 'rash_systemic',
    competing_diagnoses: [
      { name: 'Drug reaction/DRESS', prevalence_weight: 0.20, disease_family: 'drug_reaction' },
      { name: 'SLE', prevalence_weight: 0.15, disease_family: 'autoimmune_connective_tissue' },
      { name: 'Vasculitis', prevalence_weight: 0.12, disease_family: 'vasculitis' },
      { name: 'Erythema nodosum', prevalence_weight: 0.08, disease_family: 'autoimmune_connective_tissue' },
      { name: 'SJS/TEN', prevalence_weight: 0.10, disease_family: 'drug_reaction' },
      { name: 'Psoriasis', prevalence_weight: 0.10, disease_family: 'autoimmune_connective_tissue' },
      { name: 'Secondary syphilis', prevalence_weight: 0.08, disease_family: 'sexually_transmitted_infection' },
      { name: 'Meningococcemia', prevalence_weight: 0.07, disease_family: 'systemic_infection' },
      { name: 'Pemphigus/pemphigoid', prevalence_weight: 0.05, disease_family: 'autoimmune_connective_tissue' },
      { name: 'Dermatomyositis', prevalence_weight: 0.05, disease_family: 'autoimmune_connective_tissue' },
    ],
  },
  {
    pattern: 'joint_pain_autoimmune',
    competing_diagnoses: [
      { name: 'Rheumatoid arthritis', prevalence_weight: 0.20, disease_family: 'autoimmune_connective_tissue' },
      { name: 'Gout', prevalence_weight: 0.20, disease_family: 'crystal_arthropathy' },
      { name: 'Pseudogout (CPPD)', prevalence_weight: 0.10, disease_family: 'crystal_arthropathy' },
      { name: 'SLE', prevalence_weight: 0.12, disease_family: 'autoimmune_connective_tissue' },
      { name: 'Septic arthritis', prevalence_weight: 0.10, disease_family: 'systemic_infection' },
      { name: 'Reactive arthritis', prevalence_weight: 0.08, disease_family: 'spondyloarthropathy' },
      { name: 'Ankylosing spondylitis', prevalence_weight: 0.07, disease_family: 'spondyloarthropathy' },
      { name: 'Osteoarthritis', prevalence_weight: 0.08, disease_family: 'crystal_arthropathy' },
      { name: 'PMR', prevalence_weight: 0.05, disease_family: 'vasculitis' },
    ],
  },
  {
    pattern: 'renal_failure',
    competing_diagnoses: [
      { name: 'Prerenal AKI (volume depletion)', prevalence_weight: 0.25, disease_family: 'acute_kidney_injury' },
      { name: 'ATN', prevalence_weight: 0.20, disease_family: 'acute_kidney_injury' },
      { name: 'Obstructive uropathy', prevalence_weight: 0.12, disease_family: 'acute_kidney_injury' },
      { name: 'Glomerulonephritis', prevalence_weight: 0.12, disease_family: 'glomerular_disease' },
      { name: 'Interstitial nephritis', prevalence_weight: 0.10, disease_family: 'tubular_disease' },
      { name: 'CKD progression', prevalence_weight: 0.10, disease_family: 'chronic_kidney_disease' },
      { name: 'HRS', prevalence_weight: 0.06, disease_family: 'hepatic_complications' },
      { name: 'TTP/HUS', prevalence_weight: 0.05, disease_family: 'coagulopathy' },
    ],
  },
  {
    pattern: 'acid_base_disorder',
    competing_diagnoses: [
      { name: 'DKA', prevalence_weight: 0.18, disease_family: 'diabetes_mellitus' },
      { name: 'Lactic acidosis', prevalence_weight: 0.15, disease_family: 'shock' },
      { name: 'Toxic ingestion (methanol, ethylene glycol)', prevalence_weight: 0.10, disease_family: 'toxicology' },
      { name: 'Uremic acidosis', prevalence_weight: 0.10, disease_family: 'chronic_kidney_disease' },
      { name: 'RTA', prevalence_weight: 0.10, disease_family: 'tubular_disease' },
      { name: 'Contraction alkalosis (vomiting/diuretics)', prevalence_weight: 0.15, disease_family: 'sodium_disorder' },
      { name: 'Respiratory acidosis (COPD)', prevalence_weight: 0.12, disease_family: 'obstructive_airway_disease' },
      { name: 'Salicylate toxicity', prevalence_weight: 0.10, disease_family: 'toxicology' },
    ],
  },
  {
    pattern: 'electrolyte_abnormality',
    competing_diagnoses: [
      { name: 'SIADH', prevalence_weight: 0.18, disease_family: 'sodium_disorder' },
      { name: 'Hypovolemic hyponatremia', prevalence_weight: 0.12, disease_family: 'sodium_disorder' },
      { name: 'Hyperkalemia (CKD/meds)', prevalence_weight: 0.15, disease_family: 'potassium_disorder' },
      { name: 'Hypokalemia (diuretics/GI loss)', prevalence_weight: 0.12, disease_family: 'potassium_disorder' },
      { name: 'Hypercalcemia', prevalence_weight: 0.12, disease_family: 'calcium_disorder' },
      { name: 'Hypocalcemia', prevalence_weight: 0.08, disease_family: 'calcium_disorder' },
      { name: 'Hypernatremia', prevalence_weight: 0.08, disease_family: 'sodium_disorder' },
      { name: 'Adrenal insufficiency', prevalence_weight: 0.08, disease_family: 'adrenal_disorders' },
      { name: 'Tumor lysis syndrome', prevalence_weight: 0.07, disease_family: 'leukemia_lymphoma' },
    ],
  },
  {
    pattern: 'cough_fever',
    competing_diagnoses: [
      { name: 'Community-acquired pneumonia', prevalence_weight: 0.25, disease_family: 'pneumonia' },
      { name: 'Acute bronchitis', prevalence_weight: 0.15, disease_family: 'respiratory_infection' },
      { name: 'COPD exacerbation with infection', prevalence_weight: 0.15, disease_family: 'obstructive_airway_disease' },
      { name: 'Tuberculosis', prevalence_weight: 0.10, disease_family: 'respiratory_infection' },
      { name: 'Influenza', prevalence_weight: 0.12, disease_family: 'respiratory_infection' },
      { name: 'Lung abscess', prevalence_weight: 0.06, disease_family: 'pneumonia' },
      { name: 'HAP/VAP', prevalence_weight: 0.08, disease_family: 'pneumonia' },
      { name: 'Fungal pneumonia', prevalence_weight: 0.05, disease_family: 'opportunistic_infection' },
      { name: 'Lung cancer with post-obstructive PNA', prevalence_weight: 0.04, disease_family: 'lung_neoplasm' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Medicine nodes — 135 nodes across all 15 subsystems
// All nodes follow the 6-group field order convention.
// ---------------------------------------------------------------------------

export const MEDICINE_NODES: MedicineNodeSpec[] = [
  // =========================================================================
  // CARDIOLOGY (11 nodes)
  // =========================================================================
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD001',
    canonical_id: 'MED.CARD.ACS.STEMI.NXT.ED.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Acute Coronary Syndrome', subtopic: 'STEMI',
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 85, clinical_frequency: 60,
    frequency_score: computeFrequencyScore({ exam_frequency: 85, clinical_frequency: 60 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'coronary_artery_disease',
    presentation_patterns: ['chest_pain'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize STEMI on ECG and decide between PCI and fibrinolysis based on door-to-balloon time',
    competing_diagnoses: ['STEMI', 'NSTEMI', 'Aortic dissection', 'Pericarditis'],
    key_distinguishing_features: ['ST elevation in contiguous leads', 'Reciprocal ST depression', 'Troponin rise pattern'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'vital_sign_mismatch'],
    plausible_distractor_families: ['pericardial_disease', 'aortic_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
    gold_topic_id: 'GOLD.MED.ACS.01',
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD002',
    canonical_id: 'MED.CARD.ACS.NSTEMI.NXT.ED.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Acute Coronary Syndrome', subtopic: 'NSTEMI',
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 80, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 55 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'coronary_artery_disease',
    presentation_patterns: ['chest_pain'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Risk-stratify NSTEMI using TIMI/GRACE and decide timing of invasive strategy',
    competing_diagnoses: ['NSTEMI', 'Unstable angina', 'Demand ischemia', 'PE'],
    key_distinguishing_features: ['Troponin elevation without ST elevation', 'Dynamic ECG changes', 'Risk score calculation'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'demographic_mismatch'],
    plausible_distractor_families: ['venous_thromboembolism', 'pericardial_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD003',
    canonical_id: 'MED.CARD.CHF.ACUTE.NXT.INP.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Heart Failure', subtopic: 'Acute Decompensated',
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 78, clinical_frequency: 70,
    frequency_score: computeFrequencyScore({ exam_frequency: 78, clinical_frequency: 70 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'heart_failure',
    presentation_patterns: ['dyspnea', 'edema'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Classify wet/warm vs wet/cold and choose diuresis vs inotropes',
    competing_diagnoses: ['Acute decompensated HF', 'COPD exacerbation', 'PE', 'Nephrotic syndrome'],
    key_distinguishing_features: ['Elevated BNP', 'Pulmonary edema on CXR', 'JVD', 'S3 gallop'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'imaging_red_herring'],
    plausible_distractor_families: ['obstructive_airway_disease', 'venous_thromboembolism'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
    gold_topic_id: 'GOLD.MED.CHF.01',
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD004',
    canonical_id: 'MED.CARD.CHF.CHRONIC.NXT.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Heart Failure', subtopic: 'Chronic Management',
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 70, clinical_frequency: 65,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 65 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'heart_failure',
    presentation_patterns: ['dyspnea', 'edema'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Titrate GDMT (ACEi/ARB/ARNI, BB, MRA, SGLT2i) based on EF and symptoms',
    competing_diagnoses: ['HFrEF medication optimization', 'HFpEF workup', 'Valvular disease requiring surgery'],
    key_distinguishing_features: ['Ejection fraction', 'NYHA class', 'Medication tolerance'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['valvular_heart_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD005',
    canonical_id: 'MED.CARD.AFIB.DX.OUT.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Atrial Fibrillation', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'days', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 75, clinical_frequency: 70,
    frequency_score: computeFrequencyScore({ exam_frequency: 75, clinical_frequency: 70 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'arrhythmia',
    presentation_patterns: ['palpitations'],
    acuity_band: 'subacute', difficulty_tier: 'straightforward',
    algorithm_concept: 'Diagnose AF on ECG and decide rate vs rhythm control + CHA₂DS₂-VASc anticoagulation',
    competing_diagnoses: ['Atrial fibrillation', 'Atrial flutter', 'SVT', 'Sinus tachycardia with PACs'],
    key_distinguishing_features: ['Irregularly irregular rhythm', 'Absent P waves', 'Variable RR intervals'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['vital_sign_mismatch'],
    plausible_distractor_families: ['thyroid_disorders'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD006',
    canonical_id: 'MED.CARD.ENDOCARD.DXT.INP.YA',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Infective Endocarditis', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'young_adult',
    time_horizon: 'days', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 70, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 25 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'endocarditis',
    presentation_patterns: ['fever_unknown_source'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Apply modified Duke criteria: blood cultures + echocardiography to diagnose IE',
    competing_diagnoses: ['Endocarditis', 'Bacteremia without endocarditis', 'Rheumatic fever', 'Marantic endocarditis'],
    key_distinguishing_features: ['Persistent bacteremia', 'New murmur', 'Embolic phenomena', 'Osler nodes/Janeway lesions'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['social_history_bait', 'symptom_overlap', 'timeline_conflict'],
    plausible_distractor_families: ['systemic_infection'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD007',
    canonical_id: 'MED.CARD.SYNC.DXT.ED.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Syncope', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 55 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'arrhythmia',
    presentation_patterns: ['syncope'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Risk-stratify syncope: cardiac (ECG, monitor) vs vasovagal vs orthostatic',
    competing_diagnoses: ['Arrhythmia', 'Vasovagal', 'Orthostatic', 'Aortic stenosis', 'PE'],
    key_distinguishing_features: ['ECG abnormalities', 'Exertional syncope', 'Murmur', 'Orthostatic vitals'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch', 'demographic_mismatch'],
    plausible_distractor_families: ['valvular_heart_disease', 'venous_thromboembolism'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD008',
    canonical_id: 'MED.CARD.HTN.NXT.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Hypertension', subtopic: 'Resistant',
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    // GROUP 3: SCORING
    exam_frequency: 35, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 35, clinical_frequency: 40 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'hypertension',
    presentation_patterns: ['headache_focal_deficit'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Evaluate for secondary causes of resistant hypertension (RAS, pheo, Conn)',
    competing_diagnoses: ['Primary hypertension non-adherence', 'Renal artery stenosis', 'Primary aldosteronism', 'Pheochromocytoma'],
    key_distinguishing_features: ['Aldosterone-renin ratio', 'Renal artery duplex', '24h urine catecholamines'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['adrenal_disorders'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD009',
    canonical_id: 'MED.CARD.PERICARD.DX.ED.YA',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Pericarditis', subtopic: 'Acute',
    task_type: 'diagnosis', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 30 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'pericardial_disease',
    presentation_patterns: ['chest_pain'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Distinguish pericarditis from ACS: pleuritic pain, friction rub, diffuse ST elevation',
    competing_diagnoses: ['Acute pericarditis', 'STEMI', 'Myocarditis', 'PE'],
    key_distinguishing_features: ['Pleuritic chest pain relieved by sitting forward', 'Friction rub', 'Diffuse ST elevation with PR depression'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'demographic_mismatch'],
    plausible_distractor_families: ['coronary_artery_disease', 'venous_thromboembolism'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },

  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD010',
    canonical_id: 'MED.CARD.AORTDISS.DX.ED.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Aortic Dissection', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 72, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 72, clinical_frequency: 15 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'aortic_disease',
    presentation_patterns: ['chest_pain'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish aortic dissection from ACS: tearing pain, BP differential, widened mediastinum; type A vs B management',
    competing_diagnoses: ['Type A dissection', 'Type B dissection', 'STEMI', 'PE', 'Esophageal rupture'],
    key_distinguishing_features: ['Tearing chest pain radiating to back', 'BP differential between arms', 'Widened mediastinum on CXR', 'CT angiography findings'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['symptom_overlap', 'vital_sign_mismatch'],
    plausible_distractor_families: ['coronary_artery_disease', 'venous_thromboembolism'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_CARD011',
    canonical_id: 'MED.CARD.AS.NXT.OUT.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Cardiology', topic: 'Aortic Stenosis', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 68, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 68, clinical_frequency: 45 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'valvular_heart_disease',
    presentation_patterns: ['syncope', 'dyspnea'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Identify symptomatic severe AS (syncope, angina, HF) and determine timing of valve replacement vs surveillance',
    competing_diagnoses: ['Severe AS requiring intervention', 'Moderate AS for surveillance', 'HCM', 'Aortic sclerosis'],
    key_distinguishing_features: ['Crescendo-decrescendo systolic murmur', 'Delayed carotid upstroke', 'Echocardiographic valve area/gradient', 'Symptom onset'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'demographic_mismatch'],
    plausible_distractor_families: ['coronary_artery_disease', 'heart_failure'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // GASTROENTEROLOGY (8 nodes)
  // =========================================================================
  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI001',
    canonical_id: 'MED.GI.PANC.ACUTE.DXT.ED.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'Acute Pancreatitis', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 75, clinical_frequency: 50,
    frequency_score: computeFrequencyScore({ exam_frequency: 75, clinical_frequency: 50 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'pancreatic_disease',
    presentation_patterns: ['abdominal_pain'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Diagnose pancreatitis (2 of 3: pain, lipase >3x, imaging) and assess severity',
    competing_diagnoses: ['Acute pancreatitis', 'PUD perforation', 'Cholecystitis', 'Mesenteric ischemia'],
    key_distinguishing_features: ['Lipase >3x ULN', 'Epigastric pain radiating to back', 'CT necrotizing features'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'social_history_bait'],
    plausible_distractor_families: ['peptic_ulcer_disease', 'biliary_disease'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
    gold_topic_id: 'GOLD.MED.PANC.01',
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI002',
    canonical_id: 'MED.GI.GIB.UPPER.STAB.ED.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'GI Bleed', subtopic: 'Upper',
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 80, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 55 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'gi_hemorrhage',
    presentation_patterns: ['gi_bleed'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Resuscitate upper GI bleed, risk-stratify (Glasgow-Blatchford), timing of endoscopy',
    competing_diagnoses: ['Variceal bleed', 'PUD bleed', 'Mallory-Weiss', 'Dieulafoy lesion'],
    key_distinguishing_features: ['Hemodynamic status', 'Variceal stigmata', 'BUN/Cr ratio', 'NG aspirate'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch', 'medication_confounder'],
    plausible_distractor_families: ['chronic_liver_disease', 'peptic_ulcer_disease'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
    gold_topic_id: 'GOLD.MED.GIB.01',
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI003',
    canonical_id: 'MED.GI.IBD.DX.OUT.YA',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'Inflammatory Bowel Disease', subtopic: 'Crohn vs UC',
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 70, clinical_frequency: 35,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 35 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'inflammatory_bowel_disease',
    presentation_patterns: ['diarrhea', 'abdominal_pain'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish Crohn from UC using location, depth, extraintestinal manifestations',
    competing_diagnoses: ['Crohn disease', 'Ulcerative colitis', 'Infectious colitis', 'Celiac disease', 'Microscopic colitis'],
    key_distinguishing_features: ['Skip lesions vs continuous', 'Transmural vs mucosal', 'Fistulae', 'Bloody diarrhea pattern'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['symptom_overlap', 'timeline_conflict'],
    plausible_distractor_families: ['malabsorption'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI004',
    canonical_id: 'MED.GI.PUD.COMP.INP.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'Peptic Ulcer Disease', subtopic: 'Perforation',
    task_type: 'complication_recognition', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 30 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'peptic_ulcer_disease',
    presentation_patterns: ['abdominal_pain'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Recognize PUD perforation (free air, rigidity) and differentiate from pancreatitis/cholecystitis',
    competing_diagnoses: ['PUD perforation', 'Acute pancreatitis', 'Mesenteric ischemia', 'Ruptured AAA'],
    key_distinguishing_features: ['Free air under diaphragm', 'Board-like rigidity', 'Sudden onset', 'NSAID/H pylori history'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['imaging_red_herring', 'medication_confounder'],
    plausible_distractor_families: ['pancreatic_disease', 'aortic_disease'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI005',
    canonical_id: 'MED.GI.SBO.NXT.ED.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'Small Bowel Obstruction', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 60, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 45 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'bowel_obstruction',
    presentation_patterns: ['abdominal_pain', 'vomiting'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish partial vs complete SBO, adhesive vs strangulated, surgical vs conservative',
    competing_diagnoses: ['Adhesive SBO', 'Incarcerated hernia', 'Ileus', 'Large bowel obstruction'],
    key_distinguishing_features: ['Air-fluid levels on X-ray', 'Prior surgical history', 'Transition point on CT', 'Signs of strangulation'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['imaging_red_herring', 'timeline_conflict'],
    plausible_distractor_families: ['pancreatic_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },

  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI006',
    canonical_id: 'MED.GI.GERD.NXT.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'GERD', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    // GROUP 3: SCORING
    exam_frequency: 50, clinical_frequency: 80,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 80 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'peptic_ulcer_disease',
    presentation_patterns: ['chest_pain', 'abdominal_pain'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Manage GERD stepwise: lifestyle → PPI → alarm symptoms trigger EGD; distinguish from cardiac chest pain',
    competing_diagnoses: ['GERD', 'PUD', 'Eosinophilic esophagitis', 'Esophageal motility disorder', 'Angina'],
    key_distinguishing_features: ['Heartburn worse postprandially/supine', 'Relief with PPI', 'Alarm symptoms (dysphagia, weight loss)', 'Normal cardiac workup'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'management_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'response_to_treatment',
    misdirection_vectors: ['symptom_overlap'],
    plausible_distractor_families: ['coronary_artery_disease'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI007',
    canonical_id: 'MED.GI.CELIAC.DX.OUT.YA',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'Celiac Disease', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 60, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 30 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'malabsorption',
    presentation_patterns: ['diarrhea', 'anemia', 'weight_loss'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose celiac disease: tTG-IgA serology while on gluten-containing diet, confirm with duodenal biopsy',
    competing_diagnoses: ['Celiac disease', 'IBD', 'IBS', 'Tropical sprue', 'Whipple disease'],
    key_distinguishing_features: ['tTG-IgA elevation', 'IgA deficiency check', 'Villous atrophy on biopsy', 'Dermatitis herpetiformis', 'Iron deficiency anemia'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'lab_ambiguity'],
    plausible_distractor_families: ['inflammatory_bowel_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_GI008',
    canonical_id: 'MED.GI.DIVERT.NXT.ED.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Gastroenterology', topic: 'Diverticulitis', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 55, clinical_frequency: 50,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 50 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'inflammatory_bowel_disease',
    presentation_patterns: ['abdominal_pain'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Diagnose diverticulitis on CT, stratify complicated vs uncomplicated, decide antibiotics vs drainage vs surgery',
    competing_diagnoses: ['Uncomplicated diverticulitis', 'Complicated diverticulitis (abscess)', 'Colon cancer', 'Ovarian pathology', 'IBD flare'],
    key_distinguishing_features: ['LLQ pain', 'CT showing pericolic fat stranding', 'Fever/leukocytosis', 'Abscess or perforation on imaging'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['imaging_red_herring', 'demographic_mismatch'],
    plausible_distractor_families: ['gi_hemorrhage'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // HEPATOLOGY (6 nodes)
  // =========================================================================
  {
    // GROUP 1: IDENTITY
    node_id: 'N_HEPA001',
    canonical_id: 'MED.HEPA.CIRRH.SBP.NXT.INP.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Hepatology', topic: 'Cirrhosis', subtopic: 'SBP',
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 80, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 40 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'hepatic_complications',
    presentation_patterns: ['abdominal_pain', 'altered_mental_status'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose SBP (PMN >250) and manage with cefotaxime + albumin, distinguish from secondary peritonitis',
    competing_diagnoses: ['SBP', 'Secondary peritonitis', 'Hepatorenal syndrome', 'Hepatic encephalopathy flare'],
    key_distinguishing_features: ['Ascitic fluid PMN >250', 'Single organism on culture', 'Total protein <1 g/dL'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'symptom_overlap'],
    plausible_distractor_families: ['chronic_liver_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
    gold_topic_id: 'GOLD.MED.SBP.01',
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_HEPA002',
    canonical_id: 'MED.HEPA.CIRRH.HEPENC.NXT.INP.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Hepatology', topic: 'Cirrhosis', subtopic: 'Hepatic Encephalopathy',
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 72, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 72, clinical_frequency: 45 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'hepatic_complications',
    presentation_patterns: ['altered_mental_status'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Identify and treat precipitants of hepatic encephalopathy (GI bleed, infection, meds, constipation)',
    competing_diagnoses: ['Hepatic encephalopathy', 'Intracranial hemorrhage', 'Hyponatremia', 'Wernicke encephalopathy'],
    key_distinguishing_features: ['Asterixis', 'Ammonia level', 'Precipitant identification', 'Cirrhosis history'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['medication_confounder', 'timeline_conflict'],
    plausible_distractor_families: ['cerebrovascular', 'sodium_disorder'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_HEPA003',
    canonical_id: 'MED.HEPA.HEPB.NXT.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Hepatology', topic: 'Hepatitis B', subtopic: 'Chronic Management',
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 60, clinical_frequency: 35,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 35 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'viral_hepatitis',
    presentation_patterns: ['jaundice'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Interpret HBV serologies and decide treatment initiation based on phase',
    competing_diagnoses: ['Chronic HBV immune active', 'Chronic HBV immune tolerant', 'NAFLD', 'Autoimmune hepatitis'],
    key_distinguishing_features: ['HBsAg/HBeAg/anti-HBe pattern', 'HBV DNA level', 'ALT level', 'Fibrosis stage'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'timeline_conflict'],
    plausible_distractor_families: ['chronic_liver_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_HEPA004',
    canonical_id: 'MED.HEPA.ALCHEP.DX.INP.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Hepatology', topic: 'Alcoholic Hepatitis', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 40 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'chronic_liver_disease',
    presentation_patterns: ['jaundice'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose alcoholic hepatitis (AST:ALT >2:1, drinking history) and assess severity (Maddrey DF)',
    competing_diagnoses: ['Alcoholic hepatitis', 'Viral hepatitis', 'DILI', 'Autoimmune hepatitis', 'Cholangitis'],
    key_distinguishing_features: ['AST:ALT ratio >2:1', 'Leukocytosis', 'Recent heavy drinking', 'Maddrey discriminant function'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['social_history_bait', 'lab_ambiguity'],
    plausible_distractor_families: ['viral_hepatitis', 'biliary_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },

  {
    // GROUP 1: IDENTITY
    node_id: 'N_HEPA005',
    canonical_id: 'MED.HEPA.NAFLD.RISK.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Hepatology', topic: 'NAFLD/NASH', subtopic: null,
    task_type: 'risk_identification', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    // GROUP 3: SCORING
    exam_frequency: 50, clinical_frequency: 70,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 70 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'chronic_liver_disease',
    presentation_patterns: ['jaundice', 'weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Risk-stratify NAFLD using FIB-4/NAFLD fibrosis score; decide who needs hepatology referral vs lifestyle modification',
    competing_diagnoses: ['NAFLD/NASH', 'Alcoholic liver disease', 'Autoimmune hepatitis', 'Hemochromatosis', 'Drug-induced steatosis'],
    key_distinguishing_features: ['Metabolic syndrome features', 'Hepatic steatosis on imaging', 'FIB-4 score', 'Absence of other liver disease causes'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['social_history_bait', 'lab_ambiguity'],
    plausible_distractor_families: ['viral_hepatitis'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_HEPA006',
    canonical_id: 'MED.HEPA.DILI.DX.INP.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Hepatology', topic: 'Drug-Induced Liver Injury', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 58, clinical_frequency: 35,
    frequency_score: computeFrequencyScore({ exam_frequency: 58, clinical_frequency: 35 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'chronic_liver_disease',
    presentation_patterns: ['jaundice'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Identify DILI pattern (hepatocellular vs cholestatic vs mixed), determine causative agent, assess severity (Hy law)',
    competing_diagnoses: ['DILI hepatocellular', 'DILI cholestatic', 'Viral hepatitis', 'Autoimmune hepatitis', 'Biliary obstruction'],
    key_distinguishing_features: ['Temporal relationship to drug initiation', 'R ratio (ALT/ALP)', 'Improvement after drug withdrawal', 'Hy law criteria (bilirubin + ALT)'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder', 'timeline_conflict', 'lab_ambiguity'],
    plausible_distractor_families: ['viral_hepatitis', 'biliary_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // ENDOCRINE (10 nodes)
  // =========================================================================
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO001',
    canonical_id: 'MED.ENDO.DKA.STAB.ED.YA',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'DKA', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 85, clinical_frequency: 50,
    frequency_score: computeFrequencyScore({ exam_frequency: 85, clinical_frequency: 50 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'diabetes_mellitus',
    presentation_patterns: ['polyuria_polydipsia', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Manage DKA: IV fluids → check K+ before insulin → insulin drip → monitor anion gap closure',
    competing_diagnoses: ['DKA', 'HHS', 'Alcoholic ketoacidosis', 'Starvation ketosis'],
    key_distinguishing_features: ['AG metabolic acidosis', 'Ketonemia', 'Glucose >250 but not extreme', 'K+ level before insulin'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'social_history_bait'],
    plausible_distractor_families: ['acid_base_disorder_family'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
    gold_topic_id: 'GOLD.MED.DKA.01',
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO002',
    canonical_id: 'MED.ENDO.HHS.STAB.ICU.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'HHS', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'icu', age_group: 'elderly',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 70, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 25 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'diabetes_mellitus',
    presentation_patterns: ['altered_mental_status', 'polyuria_polydipsia'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish HHS from DKA (extreme hyperglycemia, minimal acidosis, profound dehydration)',
    competing_diagnoses: ['HHS', 'DKA', 'Sepsis with hyperglycemia', 'Stroke'],
    key_distinguishing_features: ['Glucose >600', 'Osmolality >320', 'Minimal/no ketosis', 'Profound dehydration'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'demographic_mismatch'],
    plausible_distractor_families: ['cerebrovascular', 'systemic_infection'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO003',
    canonical_id: 'MED.ENDO.DM2.NXT.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Type 2 Diabetes', subtopic: 'Medication Intensification',
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 90,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 90 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'diabetes_mellitus',
    presentation_patterns: ['polyuria_polydipsia'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Choose next agent after metformin based on comorbidities (ASCVD → GLP-1, HF → SGLT2i, CKD → SGLT2i)',
    competing_diagnoses: ['ASCVD-driven choice', 'HF-driven choice', 'CKD-driven choice', 'Weight-driven choice'],
    key_distinguishing_features: ['A1c level', 'Comorbidity profile', 'eGFR', 'BMI'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['heart_failure', 'chronic_kidney_disease'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO004',
    canonical_id: 'MED.ENDO.THYROID.HYPER.DXT.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Hyperthyroidism', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 70, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 40 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'thyroid_disorders',
    presentation_patterns: ['palpitations', 'weight_loss'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Work up hyperthyroidism: TSH → free T4/T3 → RAIU to distinguish Graves vs thyroiditis vs toxic nodule',
    competing_diagnoses: ['Graves disease', 'Toxic multinodular goiter', 'Thyroiditis', 'Exogenous thyroid hormone'],
    key_distinguishing_features: ['RAIU uptake pattern', 'TSI antibodies', 'Thyroid exam', 'Onset pattern'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'timeline_conflict'],
    plausible_distractor_families: ['arrhythmia'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO005',
    canonical_id: 'MED.ENDO.THYROID.HYPO.NXT.OUT.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Hypothyroidism', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'chronic', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 55, clinical_frequency: 65,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 65 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'thyroid_disorders',
    presentation_patterns: ['weakness_fatigue', 'weight_loss'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Diagnose and manage primary hypothyroidism: levothyroxine dosing, monitoring, subclinical management',
    competing_diagnoses: ['Primary hypothyroidism', 'Central hypothyroidism', 'Sick euthyroid', 'Depression'],
    key_distinguishing_features: ['Elevated TSH', 'Low free T4', 'Anti-TPO antibodies'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['demographic_mismatch'],
    plausible_distractor_families: ['adrenal_disorders'],
    required_reconciliation_steps: 2,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO006',
    canonical_id: 'MED.ENDO.ADRENAL.INSUFF.DX.INP.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Adrenal Insufficiency', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 20 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'adrenal_disorders',
    presentation_patterns: ['weakness_fatigue', 'altered_mental_status'],
    acuity_band: 'urgent', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Recognize adrenal crisis in a stressed patient, distinguish primary (Addison) from secondary (steroid withdrawal)',
    competing_diagnoses: ['Primary adrenal insufficiency', 'Secondary adrenal insufficiency', 'Sepsis', 'Hypothyroidism'],
    key_distinguishing_features: ['Hyperpigmentation (primary)', 'Hyponatremia + hyperkalemia (primary)', 'Low cortisol + ACTH level', 'Steroid use history'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity', 'demographic_mismatch'],
    plausible_distractor_families: ['systemic_infection', 'thyroid_disorders'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO007',
    canonical_id: 'MED.ENDO.HYPERCALC.DXT.INP.ELD',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Hypercalcemia', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 30 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'calcium_metabolism',
    presentation_patterns: ['weakness_fatigue', 'altered_mental_status'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish PTH-mediated (hyperparathyroidism) from PTH-independent (malignancy, granulomatous) hypercalcemia',
    competing_diagnoses: ['Primary hyperparathyroidism', 'Malignancy-related', 'Sarcoidosis', 'Thiazide-induced', 'Vitamin D toxicity'],
    key_distinguishing_features: ['PTH level (high vs suppressed)', 'PTHrP', 'Age/cancer history', '1,25-dihydroxyvitamin D'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['paraneoplastic'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  // =========================================================================
  // ENDOCRINE — 3 additional nodes (ENDO008–010)
  // =========================================================================
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO008',
    canonical_id: 'MED.ENDO.PHEO.DXT.INP.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Pheochromocytoma', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_2',
    // GROUP 3: SCORING
    exam_frequency: 55, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 10 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'adrenal_disorders',
    presentation_patterns: ['palpitations', 'headache_focal_deficit'],
    acuity_band: 'urgent', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Suspect pheochromocytoma in episodic hypertension with triad (headache, diaphoresis, palpitations); confirm with plasma free metanephrines before imaging',
    competing_diagnoses: ['Pheochromocytoma', 'Essential hypertension', 'Panic disorder', 'Hyperthyroidism', 'Carcinoid syndrome'],
    key_distinguishing_features: ['Episodic hypertension with triad', 'Plasma free metanephrines', 'Adrenal mass on CT/MRI', '24h urine catecholamines'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['symptom_overlap', 'vital_sign_mismatch'],
    plausible_distractor_families: ['thyroid_disorders', 'arrhythmia'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO009',
    canonical_id: 'MED.ENDO.THYSTORM.STAB.ICU.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Thyroid Storm', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'icu', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    // GROUP 3: SCORING
    exam_frequency: 65, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 10 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'thyroid_disorders',
    presentation_patterns: ['palpitations', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize thyroid storm (Burch-Wartofsky score) and treat with sequential therapy: PTU → iodine → beta-blocker → steroids',
    competing_diagnoses: ['Thyroid storm', 'Sepsis', 'Sympathomimetic toxicity', 'Malignant hyperthermia', 'NMS'],
    key_distinguishing_features: ['Severe thyrotoxicosis with fever', 'Altered mental status', 'Burch-Wartofsky score >45', 'Known Graves disease history'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch', 'symptom_overlap'],
    plausible_distractor_families: ['systemic_infection', 'toxicology'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },
  {
    // GROUP 1: IDENTITY
    node_id: 'N_ENDO010',
    canonical_id: 'MED.ENDO.CUSHING.DXT.OUT.MID',
    // GROUP 2: DB CORE
    shelf: 'medicine', system: 'Endocrinology', topic: 'Cushing Syndrome', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    // GROUP 3: SCORING
    exam_frequency: 55, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 10 }),
    // GROUP 4: CLINICAL SPEC
    disease_family: 'adrenal_disorders',
    presentation_patterns: ['weight_loss', 'weakness_fatigue'],
    acuity_band: 'subacute', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Screen for Cushing with 24h UFC/late-night salivary cortisol/1mg DST; distinguish ACTH-dependent (pituitary vs ectopic) from ACTH-independent',
    competing_diagnoses: ['Cushing disease (pituitary)', 'Ectopic ACTH', 'Adrenal adenoma', 'Exogenous steroid use', 'Metabolic syndrome'],
    key_distinguishing_features: ['Centripetal obesity with striae', 'ACTH level', 'High-dose DST response', 'Inferior petrosal sinus sampling'],
    // GROUP 5: SUPPRESSION
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'demographic_mismatch'],
    plausible_distractor_families: ['diabetes_mellitus', 'pituitary_disorders'],
    required_reconciliation_steps: 3,
    // GROUP 6: LINKS
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // PULMONARY (11 nodes)
  // =========================================================================
  {
    node_id: 'N_PULM001',
    canonical_id: 'MED.PULM.COPD.EXAC.NXT.ED.ELD',
    shelf: 'medicine', system: 'Pulmonary', topic: 'COPD Exacerbation', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 80, clinical_frequency: 70,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 70 }),
    disease_family: 'obstructive_airway_disease',
    presentation_patterns: ['dyspnea', 'cough_fever'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Manage COPD exacerbation: bronchodilators + systemic steroids + antibiotics if purulent sputum; decide NIV vs intubation',
    competing_diagnoses: ['COPD exacerbation', 'CHF exacerbation', 'Pneumonia', 'PE', 'Pneumothorax'],
    key_distinguishing_features: ['Wheezing with prolonged expiration', 'Known COPD history', 'ABG showing chronic respiratory acidosis', 'Response to bronchodilators'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'imaging_red_herring'],
    plausible_distractor_families: ['heart_failure', 'pneumonia'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM002',
    canonical_id: 'MED.PULM.ASTHMA.EXAC.NXT.ED.YA',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Asthma Exacerbation', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 70, clinical_frequency: 65,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 65 }),
    disease_family: 'obstructive_airway_disease',
    presentation_patterns: ['dyspnea'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Classify asthma exacerbation severity and escalate therapy: continuous nebs → IV magnesium → consider intubation for silent chest',
    competing_diagnoses: ['Asthma exacerbation', 'Anaphylaxis', 'Foreign body aspiration', 'Vocal cord dysfunction', 'PE'],
    key_distinguishing_features: ['Wheezing with accessory muscle use', 'Peak flow measurement', 'Response to albuterol', 'Silent chest as ominous sign'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['vital_sign_mismatch'],
    plausible_distractor_families: ['venous_thromboembolism'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM003',
    canonical_id: 'MED.PULM.PE.DXT.ED.MID',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Pulmonary Embolism', subtopic: 'Diagnosis',
    task_type: 'diagnostic_test', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 85, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 85, clinical_frequency: 40 }),
    disease_family: 'venous_thromboembolism',
    presentation_patterns: ['dyspnea', 'chest_pain'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Apply Wells score to risk-stratify PE: low risk → D-dimer; moderate/high → CT-PA; PERC rule for very low risk',
    competing_diagnoses: ['PE', 'Pneumonia', 'COPD exacerbation', 'Anxiety', 'Musculoskeletal chest pain'],
    key_distinguishing_features: ['Sudden-onset dyspnea', 'Pleuritic chest pain', 'Risk factors (immobilization, OCP, surgery)', 'CT-PA filling defect'],
    suppression_style: 'competing_pattern', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['symptom_overlap', 'social_history_bait', 'lab_ambiguity'],
    plausible_distractor_families: ['pneumonia', 'coronary_artery_disease'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM004',
    canonical_id: 'MED.PULM.PE.MGMT.NXT.INP.MID',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Pulmonary Embolism', subtopic: 'Management',
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 75, clinical_frequency: 35,
    frequency_score: computeFrequencyScore({ exam_frequency: 75, clinical_frequency: 35 }),
    disease_family: 'venous_thromboembolism',
    presentation_patterns: ['dyspnea', 'chest_pain'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Choose PE treatment: anticoagulation for stable; thrombolytics for massive PE with hemodynamic instability; IVC filter indications',
    competing_diagnoses: ['Submassive PE (anticoagulate)', 'Massive PE (thrombolyse)', 'Anticoagulation contraindication (IVC filter)', 'Chronic thromboembolic PH'],
    key_distinguishing_features: ['Hemodynamic stability', 'RV strain on echo/CT', 'Troponin/BNP elevation', 'Bleeding risk assessment'],
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch', 'lab_ambiguity'],
    plausible_distractor_families: ['heart_failure'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM005',
    canonical_id: 'MED.PULM.CAP.NXT.INP.ELD',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Community-Acquired Pneumonia', subtopic: null,
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 75, clinical_frequency: 75,
    frequency_score: computeFrequencyScore({ exam_frequency: 75, clinical_frequency: 75 }),
    disease_family: 'pneumonia',
    presentation_patterns: ['cough_fever', 'dyspnea'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Risk-stratify CAP (CURB-65/PSI) for disposition; choose empiric antibiotics based on setting (outpatient vs floor vs ICU)',
    competing_diagnoses: ['Typical CAP', 'Atypical pneumonia', 'Aspiration pneumonia', 'PE', 'CHF'],
    key_distinguishing_features: ['Lobar consolidation on CXR', 'Fever + productive cough', 'CURB-65 score', 'Sputum culture organism'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['imaging_red_herring', 'demographic_mismatch'],
    plausible_distractor_families: ['heart_failure', 'venous_thromboembolism'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM006',
    canonical_id: 'MED.PULM.PLEFF.DXT.INP.ELD',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Pleural Effusion', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 50,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 50 }),
    disease_family: 'pleural_disease',
    presentation_patterns: ['dyspnea'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Apply Light criteria to thoracentesis fluid to distinguish transudative (CHF, cirrhosis) from exudative (infection, malignancy)',
    competing_diagnoses: ['Transudative (CHF)', 'Parapneumonic/empyema', 'Malignant effusion', 'TB pleuritis', 'Pulmonary embolism'],
    key_distinguishing_features: ['Light criteria (protein ratio, LDH ratio, LDH level)', 'Cell count and differential', 'Glucose level', 'Cytology'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'imaging_red_herring'],
    plausible_distractor_families: ['heart_failure', 'pneumonia'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM007',
    canonical_id: 'MED.PULM.LUNGCA.RISK.OUT.ELD',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Lung Cancer Screening', subtopic: null,
    task_type: 'risk_identification', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 50, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 45 }),
    disease_family: 'lung_neoplasm',
    presentation_patterns: ['cough_fever', 'weight_loss'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Apply USPSTF lung cancer screening criteria (age 50-80, 20 pack-year history) and manage pulmonary nodule with Fleischner criteria',
    competing_diagnoses: ['Lung adenocarcinoma', 'Squamous cell carcinoma', 'Small cell lung cancer', 'Benign nodule', 'Metastatic disease'],
    key_distinguishing_features: ['Smoking pack-year history', 'Age criteria', 'Nodule characteristics on LDCT', 'Fleischner follow-up intervals'],
    suppression_style: 'negative_space_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'social_history',
    misdirection_vectors: ['social_history_bait', 'imaging_red_herring'],
    plausible_distractor_families: ['pneumonia', 'interstitial_lung_disease'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM008',
    canonical_id: 'MED.PULM.PTX.STAB.ED.YA',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Pneumothorax', subtopic: 'Spontaneous',
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 25 }),
    disease_family: 'pleural_disease',
    presentation_patterns: ['dyspnea', 'chest_pain'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Classify pneumothorax size and decide observation vs aspiration vs chest tube; recognize tension pneumothorax requiring needle decompression',
    competing_diagnoses: ['Primary spontaneous PTX', 'Secondary spontaneous PTX', 'Tension pneumothorax', 'PE', 'Pericardial tamponade'],
    key_distinguishing_features: ['Absent breath sounds unilaterally', 'CXR showing visceral pleural line', 'Tall thin young male', 'Hypotension + JVD in tension'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['demographic_mismatch', 'vital_sign_mismatch'],
    plausible_distractor_families: ['pericardial_disease', 'venous_thromboembolism'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM009',
    canonical_id: 'MED.PULM.ILD.DXT.OUT.MID',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Interstitial Lung Disease', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 25 }),
    disease_family: 'interstitial_lung_disease',
    presentation_patterns: ['dyspnea', 'cough_fever'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Evaluate ILD with HRCT pattern recognition (UIP vs NSIP vs HP), PFTs showing restriction, and exposure/medication history',
    competing_diagnoses: ['IPF (UIP pattern)', 'Hypersensitivity pneumonitis', 'Sarcoidosis', 'Drug-induced ILD', 'Connective tissue disease-ILD'],
    key_distinguishing_features: ['HRCT pattern (honeycombing vs ground glass)', 'Restrictive PFTs with low DLCO', 'Exposure history', 'Autoimmune serologies'],
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['social_history_bait', 'imaging_red_herring'],
    plausible_distractor_families: ['heart_failure', 'autoimmune_connective_tissue'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM010',
    canonical_id: 'MED.PULM.OSA.DXT.OUT.MID',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Obstructive Sleep Apnea', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 60,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 60 }),
    disease_family: 'obstructive_airway_disease',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Suspect OSA with STOP-BANG, confirm with polysomnography, treat with CPAP; recognize cardiovascular complications',
    competing_diagnoses: ['OSA', 'Central sleep apnea', 'Narcolepsy', 'Hypothyroidism', 'Depression'],
    key_distinguishing_features: ['Daytime hypersomnolence', 'Witnessed apneas', 'BMI >30', 'AHI on polysomnography'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'social_history',
    misdirection_vectors: ['demographic_mismatch'],
    plausible_distractor_families: ['thyroid_disorders'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PULM011',
    canonical_id: 'MED.PULM.TB.DXT.OUT.YA',
    shelf: 'medicine', system: 'Pulmonary', topic: 'Tuberculosis Screening', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 25 }),
    disease_family: 'respiratory_infection',
    presentation_patterns: ['cough_fever', 'weight_loss'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish latent TB from active TB; interpret TST/IGRA with CXR; decide LTBI treatment (rifampin vs INH) vs active TB regimen (RIPE)',
    competing_diagnoses: ['Active pulmonary TB', 'Latent TB infection', 'MAC infection', 'Sarcoidosis', 'Lung cancer'],
    key_distinguishing_features: ['Endemic exposure history', 'TST induration thresholds by risk', 'IGRA result', 'CXR upper lobe cavitary lesion'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'social_history',
    misdirection_vectors: ['social_history_bait', 'imaging_red_herring'],
    plausible_distractor_families: ['lung_neoplasm', 'pneumonia'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // NEPHROLOGY (9 nodes)
  // =========================================================================
  {
    node_id: 'N_NEPH001',
    canonical_id: 'MED.NEPH.AKI.DXT.INP.ELD',
    shelf: 'medicine', system: 'Nephrology', topic: 'Acute Kidney Injury', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 80, clinical_frequency: 70,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 70 }),
    disease_family: 'acute_kidney_injury',
    presentation_patterns: ['renal_failure'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Classify AKI as prerenal vs intrinsic vs postrenal using FENa, urine sediment, and renal ultrasound',
    competing_diagnoses: ['Prerenal AKI', 'ATN', 'AIN', 'Obstructive uropathy', 'GN'],
    key_distinguishing_features: ['FENa <1% (prerenal) vs >2% (ATN)', 'Urine sediment (muddy brown casts)', 'Renal ultrasound for hydronephrosis', 'BUN/Cr ratio'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'medication_confounder'],
    plausible_distractor_families: ['chronic_kidney_disease', 'glomerular_disease'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH002',
    canonical_id: 'MED.NEPH.CKD.NXT.OUT.ELD',
    shelf: 'medicine', system: 'Nephrology', topic: 'Chronic Kidney Disease', subtopic: 'Management',
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'chronic', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 75,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 75 }),
    disease_family: 'chronic_kidney_disease',
    presentation_patterns: ['renal_failure', 'edema'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Stage CKD by GFR/albuminuria and manage: ACEi/ARB + SGLT2i for proteinuria, BP control, anemia, mineral bone disease',
    competing_diagnoses: ['Diabetic nephropathy', 'Hypertensive nephrosclerosis', 'GN-related CKD', 'PKD', 'Reflux nephropathy'],
    key_distinguishing_features: ['eGFR staging', 'Albuminuria quantification', 'Kidney size on ultrasound', 'Medication adjustment for GFR'],
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['diabetes_mellitus', 'hypertension'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH003',
    canonical_id: 'MED.NEPH.NEPH.NEPHROTIC.DXT.INP.YA',
    shelf: 'medicine', system: 'Nephrology', topic: 'Nephrotic Syndrome', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'young_adult',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 70, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 20 }),
    disease_family: 'glomerular_disease',
    presentation_patterns: ['edema', 'renal_failure'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose nephrotic syndrome (proteinuria >3.5g, hypoalbuminemia, edema, hyperlipidemia) and determine etiology (MCD vs FSGS vs membranous)',
    competing_diagnoses: ['Minimal change disease', 'FSGS', 'Membranous nephropathy', 'Diabetic nephropathy', 'Amyloidosis'],
    key_distinguishing_features: ['Proteinuria >3.5g/24h', 'Hypoalbuminemia', 'Lipiduria (oval fat bodies)', 'Renal biopsy findings'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'demographic_mismatch'],
    plausible_distractor_families: ['chronic_liver_disease', 'heart_failure'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH004',
    canonical_id: 'MED.NEPH.NEPHRITIC.DXT.INP.MID',
    shelf: 'medicine', system: 'Nephrology', topic: 'Nephritic Syndrome', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 15 }),
    disease_family: 'glomerular_disease',
    presentation_patterns: ['renal_failure', 'edema'],
    acuity_band: 'urgent', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Distinguish nephritic syndrome etiologies using complement levels, ANCA, anti-GBM, and biopsy pattern',
    competing_diagnoses: ['IgA nephropathy', 'Post-strep GN', 'Lupus nephritis', 'ANCA vasculitis', 'Anti-GBM disease'],
    key_distinguishing_features: ['RBC casts in urine', 'Complement levels (low in lupus/PSGN)', 'ANCA positivity', 'Temporal relation to infection'],
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'timeline_conflict'],
    plausible_distractor_families: ['autoimmune_connective_tissue', 'vasculitis'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH005',
    canonical_id: 'MED.NEPH.RAS.DXT.OUT.ELD',
    shelf: 'medicine', system: 'Nephrology', topic: 'Renal Artery Stenosis', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 20 }),
    disease_family: 'acute_kidney_injury',
    presentation_patterns: ['renal_failure'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Suspect RAS in resistant HTN with AKI after ACEi; confirm with renal duplex or MRA; atherosclerotic vs fibromuscular dysplasia',
    competing_diagnoses: ['Atherosclerotic RAS', 'Fibromuscular dysplasia', 'Resistant essential HTN', 'CKD from other cause'],
    key_distinguishing_features: ['Cr rise >30% after ACEi', 'Renal bruit', 'Asymmetric kidney size', 'Renal artery duplex findings'],
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'late',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder', 'demographic_mismatch'],
    plausible_distractor_families: ['hypertension', 'chronic_kidney_disease'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH006',
    canonical_id: 'MED.NEPH.STONE.NXT.ED.MID',
    shelf: 'medicine', system: 'Nephrology', topic: 'Nephrolithiasis', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 55 }),
    disease_family: 'nephrolithiasis',
    presentation_patterns: ['abdominal_pain'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Manage renal colic: CT KUB for diagnosis, pain control, decide observation vs urology intervention based on stone size and location',
    competing_diagnoses: ['Calcium oxalate stone', 'Uric acid stone', 'Struvite stone', 'AAA', 'Renal infarct'],
    key_distinguishing_features: ['Colicky flank pain radiating to groin', 'Hematuria', 'Non-contrast CT findings', 'Stone size >10mm needing intervention'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['symptom_overlap'],
    plausible_distractor_families: ['aortic_disease'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH007',
    canonical_id: 'MED.NEPH.DIAL.NXT.INP.ELD',
    shelf: 'medicine', system: 'Nephrology', topic: 'Dialysis Indications', subtopic: null,
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 40 }),
    disease_family: 'acute_kidney_injury',
    presentation_patterns: ['renal_failure', 'electrolyte_abnormality'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Recognize emergent dialysis indications (AEIOU): Acidosis refractory, Electrolytes (K+), Ingestions, Overload, Uremia symptoms',
    competing_diagnoses: ['Urgent dialysis indication', 'Medical management sufficient', 'CRRT for hemodynamic instability', 'Peritoneal dialysis'],
    key_distinguishing_features: ['Refractory hyperkalemia', 'Severe metabolic acidosis', 'Volume overload refractory to diuretics', 'Uremic pericarditis/encephalopathy'],
    suppression_style: 'management_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity'],
    plausible_distractor_families: ['potassium_disorder', 'acid_base_disorder_family'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH008',
    canonical_id: 'MED.NEPH.RPGN.DXT.INP.MID',
    shelf: 'medicine', system: 'Nephrology', topic: 'RPGN', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_2',
    exam_frequency: 50, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 10 }),
    disease_family: 'glomerular_disease',
    presentation_patterns: ['renal_failure'],
    acuity_band: 'urgent', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Rapidly progressive GN requires urgent biopsy; classify by IF pattern: linear (anti-GBM), granular (immune complex), pauci-immune (ANCA)',
    competing_diagnoses: ['Anti-GBM disease', 'ANCA vasculitis', 'Lupus nephritis', 'IgA nephropathy crescentic', 'Post-infectious GN'],
    key_distinguishing_features: ['Rapid Cr rise over days-weeks', 'Crescents on biopsy', 'ANCA/anti-GBM/complement levels', 'Pulmonary hemorrhage (Goodpasture)'],
    suppression_style: 'competing_pattern', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'timeline_conflict'],
    plausible_distractor_families: ['vasculitis', 'autoimmune_connective_tissue'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEPH009',
    canonical_id: 'MED.NEPH.PKD.COMP.OUT.MID',
    shelf: 'medicine', system: 'Nephrology', topic: 'Polycystic Kidney Disease', subtopic: null,
    task_type: 'complication_recognition', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 40, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 40, clinical_frequency: 15 }),
    disease_family: 'chronic_kidney_disease',
    presentation_patterns: ['abdominal_pain', 'renal_failure'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Manage ADPKD complications: HTN, cyst infection, intracranial aneurysm screening in family history, tolvaptan for rapid progressors',
    competing_diagnoses: ['ADPKD', 'Simple renal cysts', 'Renal cell carcinoma', 'Tuberous sclerosis'],
    key_distinguishing_features: ['Bilateral enlarged kidneys with cysts', 'Family history', 'Hepatic cysts', 'Berry aneurysm association'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['imaging_red_herring'],
    plausible_distractor_families: ['nephrolithiasis'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // HEMATOLOGY/ONCOLOGY (9 nodes)
  // =========================================================================
  {
    node_id: 'N_HEME001',
    canonical_id: 'MED.HEME.IDA.DXT.OUT.YA',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'Iron Deficiency Anemia', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 75, clinical_frequency: 70,
    frequency_score: computeFrequencyScore({ exam_frequency: 75, clinical_frequency: 70 }),
    disease_family: 'anemia_family',
    presentation_patterns: ['anemia', 'weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Confirm IDA with iron studies (low ferritin, high TIBC) and investigate cause: menstrual loss in young women, GI source in men/postmenopausal',
    competing_diagnoses: ['IDA from GI blood loss', 'IDA from menstrual loss', 'Anemia of chronic disease', 'Thalassemia trait', 'Sideroblastic anemia'],
    key_distinguishing_features: ['Microcytic hypochromic anemia', 'Low ferritin', 'High TIBC/low iron saturation', 'RDW elevated'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'demographic_mismatch'],
    plausible_distractor_families: ['gi_hemorrhage'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME002',
    canonical_id: 'MED.HEME.B12.DX.OUT.ELD',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'B12 Deficiency', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 40 }),
    disease_family: 'anemia_family',
    presentation_patterns: ['anemia', 'weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose B12 deficiency: macrocytic anemia + hypersegmented neutrophils + neuropsychiatric symptoms; distinguish from folate deficiency with methylmalonic acid',
    competing_diagnoses: ['Pernicious anemia', 'Dietary B12 deficiency', 'Folate deficiency', 'MDS', 'Hypothyroidism'],
    key_distinguishing_features: ['Macrocytic anemia (MCV >100)', 'Hypersegmented neutrophils', 'Elevated methylmalonic acid', 'Subacute combined degeneration'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'lab_ambiguity'],
    plausible_distractor_families: ['thyroid_disorders', 'leukemia_lymphoma'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME003',
    canonical_id: 'MED.HEME.HEMOLYTIC.DXT.INP.MID',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'Hemolytic Anemia', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 20 }),
    disease_family: 'anemia_family',
    presentation_patterns: ['anemia', 'jaundice'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Confirm hemolysis (LDH, haptoglobin, indirect bilirubin, reticulocytes) then classify: Coombs positive (autoimmune) vs negative (TTP, DIC, mechanical)',
    competing_diagnoses: ['Warm AIHA', 'Cold agglutinin disease', 'G6PD deficiency', 'Hereditary spherocytosis', 'TTP/HUS'],
    key_distinguishing_features: ['Low haptoglobin', 'Elevated LDH and indirect bilirubin', 'DAT (Coombs) positive vs negative', 'Peripheral smear morphology'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'medication_confounder'],
    plausible_distractor_families: ['coagulopathy'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME004',
    canonical_id: 'MED.HEME.SCD.COMP.INP.YA',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'Sickle Cell Disease', subtopic: 'Complications',
    task_type: 'complication_recognition', clinical_setting: 'inpatient', age_group: 'young_adult',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 25 }),
    disease_family: 'anemia_family',
    presentation_patterns: ['chest_pain', 'dyspnea'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize acute chest syndrome (fever, new infiltrate, hypoxia in SCD) and manage with exchange transfusion; distinguish from vaso-occlusive crisis',
    competing_diagnoses: ['Acute chest syndrome', 'Vaso-occlusive crisis', 'Pneumonia', 'PE', 'Splenic sequestration'],
    key_distinguishing_features: ['New pulmonary infiltrate + SCD', 'Hypoxia', 'Fever', 'Exchange transfusion threshold'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['symptom_overlap', 'imaging_red_herring'],
    plausible_distractor_families: ['pneumonia', 'venous_thromboembolism'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME005',
    canonical_id: 'MED.HEME.DVT.NXT.OUT.MID',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'DVT Anticoagulation', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 70, clinical_frequency: 50,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 50 }),
    disease_family: 'coagulopathy',
    presentation_patterns: ['edema'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Choose anticoagulation for DVT: DOAC preferred; warfarin if antiphospholipid; determine duration (provoked 3mo vs unprovoked extended)',
    competing_diagnoses: ['Provoked DVT', 'Unprovoked DVT', 'Cancer-associated VTE', 'Superficial thrombophlebitis', 'Baker cyst rupture'],
    key_distinguishing_features: ['Duplex ultrasound findings', 'Provoked vs unprovoked status', 'Cancer screening in unprovoked', 'Anticoagulant choice factors'],
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder', 'social_history_bait'],
    plausible_distractor_families: ['venous_thromboembolism'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME006',
    canonical_id: 'MED.HEME.HIT.DX.INP.ELD',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'HIT', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 15 }),
    disease_family: 'coagulopathy',
    presentation_patterns: ['edema'],
    acuity_band: 'urgent', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Suspect HIT when platelet count drops >50% 5-10 days after heparin; use 4T score, confirm with PF4 antibody/SRA; stop all heparin, start argatroban',
    competing_diagnoses: ['HIT type II', 'Sepsis-related thrombocytopenia', 'DIC', 'Drug-induced thrombocytopenia', 'ITP'],
    key_distinguishing_features: ['Platelet drop >50% on day 5-10 of heparin', '4T score', 'Thrombosis despite thrombocytopenia', 'PF4-heparin antibody'],
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['medication_confounder', 'timeline_conflict'],
    plausible_distractor_families: ['systemic_infection'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME007',
    canonical_id: 'MED.HEME.TTP.STAB.ICU.MID',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'TTP', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'icu', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 5,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 5 }),
    disease_family: 'coagulopathy',
    presentation_patterns: ['anemia', 'renal_failure', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize TTP pentad and initiate plasma exchange immediately; PLASMIC score; NEVER transfuse platelets',
    competing_diagnoses: ['TTP', 'HUS', 'DIC', 'HELLP syndrome', 'Evans syndrome'],
    key_distinguishing_features: ['MAHA with schistocytes', 'Severe thrombocytopenia', 'Normal coagulation studies', 'ADAMTS13 activity <10%'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'symptom_overlap'],
    plausible_distractor_families: ['acute_kidney_injury'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME008',
    canonical_id: 'MED.HEME.DIC.DX.ICU.MID',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'DIC', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'icu', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 20 }),
    disease_family: 'coagulopathy',
    presentation_patterns: ['anemia'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose DIC (elevated PT/PTT, low fibrinogen, elevated D-dimer, thrombocytopenia, schistocytes) and treat underlying cause',
    competing_diagnoses: ['Acute DIC', 'Chronic DIC', 'TTP', 'Severe liver disease coagulopathy', 'Massive transfusion dilutional'],
    key_distinguishing_features: ['Prolonged PT/PTT', 'Low fibrinogen', 'Elevated D-dimer', 'Schistocytes on smear', 'Underlying trigger (sepsis, malignancy)'],
    suppression_style: 'classic', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity'],
    plausible_distractor_families: ['chronic_liver_disease'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_HEME009',
    canonical_id: 'MED.HEME.THROMBCYT.DXT.INP.YA',
    shelf: 'medicine', system: 'Hematology/Oncology', topic: 'Thrombocytopenia', subtopic: 'ITP',
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'young_adult',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 25 }),
    disease_family: 'coagulopathy',
    presentation_patterns: ['rash_systemic'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Evaluate isolated thrombocytopenia: ITP is diagnosis of exclusion; check for secondary causes (HIV, HCV, H. pylori); treat with steroids +/- IVIG if bleeding',
    competing_diagnoses: ['ITP', 'Drug-induced thrombocytopenia', 'TTP', 'MDS', 'Pseudothrombocytopenia'],
    key_distinguishing_features: ['Isolated thrombocytopenia with normal WBC/Hgb', 'Petechiae/purpura', 'Peripheral smear (large platelets)', 'Exclusion of secondary causes'],
    suppression_style: 'negative_space_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['leukemia_lymphoma'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  // =========================================================================
  // INFECTIOUS DISEASE (10 nodes)
  // =========================================================================
  {
    node_id: 'N_ID001',
    canonical_id: 'MED.ID.SEPSIS.STAB.ED.ELD',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'Sepsis', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 85, clinical_frequency: 70,
    frequency_score: computeFrequencyScore({ exam_frequency: 85, clinical_frequency: 70 }),
    disease_family: 'systemic_infection',
    presentation_patterns: ['fever_unknown_source', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Recognize sepsis (qSOFA/SOFA), initiate 1-hour bundle: lactate, blood cultures, broad-spectrum antibiotics, 30mL/kg crystalloid; identify source',
    competing_diagnoses: ['Sepsis', 'Septic shock', 'SIRS without infection', 'Cardiogenic shock', 'Adrenal crisis'],
    key_distinguishing_features: ['SOFA score criteria', 'Lactate elevation', 'Identified source of infection', 'Response to fluid resuscitation'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch', 'symptom_overlap'],
    plausible_distractor_families: ['shock', 'adrenal_disorders'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID002',
    canonical_id: 'MED.ID.UTI.NXT.OUT.YA',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'UTI/Pyelonephritis', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 80,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 80 }),
    disease_family: 'urinary_infection',
    presentation_patterns: ['fever_unknown_source'],
    acuity_band: 'subacute', difficulty_tier: 'straightforward',
    algorithm_concept: 'Distinguish uncomplicated cystitis (empiric TMP-SMX/nitrofurantoin) from pyelonephritis (fluoroquinolone/CTX); identify complicated UTI requiring imaging',
    competing_diagnoses: ['Uncomplicated cystitis', 'Pyelonephritis', 'Complicated UTI', 'Urethritis (STI)', 'Vaginitis'],
    key_distinguishing_features: ['Dysuria + frequency (cystitis)', 'Fever + flank pain (pyelo)', 'CVA tenderness', 'UA + culture results'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'demographic_mismatch'],
    plausible_distractor_families: ['sexually_transmitted_infection'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID003',
    canonical_id: 'MED.ID.CELLUL.NXT.ED.MID',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'Cellulitis', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 60,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 60 }),
    disease_family: 'systemic_infection',
    presentation_patterns: ['rash_systemic', 'fever_unknown_source'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Classify skin infection severity: purulent (I&D + anti-MRSA) vs non-purulent (anti-strep); distinguish cellulitis from necrotizing fasciitis',
    competing_diagnoses: ['Non-purulent cellulitis', 'Purulent cellulitis/abscess', 'Necrotizing fasciitis', 'DVT', 'Stasis dermatitis'],
    key_distinguishing_features: ['Unilateral warmth/erythema/tenderness', 'Purulence/fluctuance', 'Crepitus (necrotizing)', 'Pain out of proportion'],
    suppression_style: 'competing_pattern', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap'],
    plausible_distractor_families: ['venous_thromboembolism'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID004',
    canonical_id: 'MED.ID.OSTEO.DXT.INP.MID',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'Osteomyelitis', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 20 }),
    disease_family: 'systemic_infection',
    presentation_patterns: ['fever_unknown_source'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose osteomyelitis: MRI is gold standard imaging; obtain bone biopsy/culture before antibiotics when possible; ESR/CRP for monitoring',
    competing_diagnoses: ['Hematogenous osteomyelitis', 'Contiguous osteomyelitis (diabetic foot)', 'Septic arthritis', 'Gout', 'Charcot arthropathy'],
    key_distinguishing_features: ['MRI bone marrow edema', 'Elevated ESR/CRP', 'Probe-to-bone test (diabetic foot)', 'Blood/bone culture organism'],
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'late',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['imaging_red_herring', 'timeline_conflict'],
    plausible_distractor_families: ['crystal_arthropathy'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID005',
    canonical_id: 'MED.ID.HIV.NXT.OUT.YA',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'HIV', subtopic: 'Initial Management',
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 70, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 30 }),
    disease_family: 'opportunistic_infection',
    presentation_patterns: ['fever_unknown_source', 'weight_loss'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Initiate ART for all HIV+ regardless of CD4; choose OI prophylaxis thresholds (PCP <200, MAC <50, toxo <100); recognize immune reconstitution syndrome',
    competing_diagnoses: ['Newly diagnosed HIV', 'AIDS-defining illness', 'IRIS', 'Acute retroviral syndrome', 'Non-HIV immunodeficiency'],
    key_distinguishing_features: ['CD4 count', 'Viral load', 'OI prophylaxis thresholds', 'Genotype resistance testing before ART'],
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['social_history_bait', 'lab_ambiguity'],
    plausible_distractor_families: ['leukemia_lymphoma'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID006',
    canonical_id: 'MED.ID.TB.NXT.INP.YA',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'Tuberculosis', subtopic: 'Active',
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'young_adult',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 15 }),
    disease_family: 'respiratory_infection',
    presentation_patterns: ['cough_fever', 'weight_loss'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Manage active TB: airborne isolation, sputum AFB smear x3, initiate RIPE therapy; monitor hepatotoxicity; contact tracing',
    competing_diagnoses: ['Pulmonary TB', 'MAC infection', 'Lung cancer', 'Sarcoidosis', 'Fungal pneumonia'],
    key_distinguishing_features: ['Upper lobe cavitary lesion', 'AFB smear/culture', 'Endemic exposure', 'Night sweats + weight loss'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['social_history_bait', 'imaging_red_herring'],
    plausible_distractor_families: ['lung_neoplasm', 'pneumonia'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID007',
    canonical_id: 'MED.ID.MENING.STAB.ED.YA',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'Meningitis', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 70, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 10 }),
    disease_family: 'cns_infection',
    presentation_patterns: ['headache_focal_deficit', 'fever_unknown_source'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Empiric antibiotics + dexamethasone before LP results; CT before LP only if focal deficits/papilledema; CSF analysis to distinguish bacterial vs viral vs fungal',
    competing_diagnoses: ['Bacterial meningitis', 'Viral meningitis', 'TB meningitis', 'Cryptococcal meningitis', 'SAH'],
    key_distinguishing_features: ['Nuchal rigidity + fever + AMS', 'CSF profile (WBC, glucose, protein, gram stain)', 'CT head indications before LP', 'Empiric antibiotic choice by age'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'timeline_conflict'],
    plausible_distractor_families: ['cerebrovascular'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID008',
    canonical_id: 'MED.ID.CDIFF.NXT.INP.ELD',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'C. difficile', subtopic: null,
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 50,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 50 }),
    disease_family: 'systemic_infection',
    presentation_patterns: ['diarrhea', 'fever_unknown_source'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Diagnose C. diff (toxin assay), stop offending antibiotic, treat with oral vancomycin (not metronidazole) for initial episode; fidaxomicin for recurrence',
    competing_diagnoses: ['C. difficile colitis', 'Antibiotic-associated diarrhea', 'IBD flare', 'Ischemic colitis', 'CMV colitis'],
    key_distinguishing_features: ['Recent antibiotic use', 'Watery diarrhea with leukocytosis', 'C. diff toxin PCR positive', 'Pseudomembranes on colonoscopy'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder'],
    plausible_distractor_families: ['inflammatory_bowel_disease'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID009',
    canonical_id: 'MED.ID.HAP.NXT.ICU.ELD',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'HAP/VAP', subtopic: null,
    task_type: 'next_step', clinical_setting: 'icu', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 40 }),
    disease_family: 'pneumonia',
    presentation_patterns: ['cough_fever', 'dyspnea'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish HAP/VAP from CAP for empiric coverage: anti-pseudomonal + MRSA coverage based on risk factors and local antibiogram',
    competing_diagnoses: ['HAP', 'VAP', 'Aspiration pneumonia', 'ARDS', 'PE'],
    key_distinguishing_features: ['Onset >48h after admission', 'New infiltrate + fever/leukocytosis', 'Endotracheal aspirate culture', 'MRSA/Pseudomonas risk factors'],
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['timeline_conflict', 'imaging_red_herring'],
    plausible_distractor_families: ['venous_thromboembolism'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_ID010',
    canonical_id: 'MED.ID.FUO.DXT.INP.MID',
    shelf: 'medicine', system: 'Infectious Disease', topic: 'Fever of Unknown Origin', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 15 }),
    disease_family: 'systemic_infection',
    presentation_patterns: ['fever_unknown_source', 'weight_loss'],
    acuity_band: 'subacute', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Systematic FUO workup: infection (endocarditis, abscess, TB), malignancy (lymphoma), autoimmune (adult-onset Still, GCA); CT chest/abd/pelvis + echo',
    competing_diagnoses: ['Occult abscess', 'Endocarditis', 'Lymphoma', 'Adult-onset Still disease', 'Drug fever'],
    key_distinguishing_features: ['Fever >38.3 for >3 weeks', 'No diagnosis after initial workup', 'CT + echo findings', 'Ferritin >10000 (Still disease)'],
    suppression_style: 'delayed_reveal', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'social_history_bait', 'lab_ambiguity'],
    plausible_distractor_families: ['leukemia_lymphoma', 'autoimmune_connective_tissue'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // RHEUMATOLOGY (7 nodes)
  // =========================================================================
  {
    node_id: 'N_RHEUM001',
    canonical_id: 'MED.RHEUM.RA.DX.OUT.MID',
    shelf: 'medicine', system: 'Rheumatology', topic: 'Rheumatoid Arthritis', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 45 }),
    disease_family: 'autoimmune_connective_tissue',
    presentation_patterns: ['joint_pain_autoimmune'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose RA with symmetric small joint synovitis, RF/anti-CCP, and initiate early DMARD therapy (methotrexate); distinguish from OA and SLE',
    competing_diagnoses: ['Rheumatoid arthritis', 'Osteoarthritis', 'SLE', 'Psoriatic arthritis', 'Viral arthritis'],
    key_distinguishing_features: ['Symmetric MCP/PIP involvement', 'Morning stiffness >1 hour', 'RF and anti-CCP positivity', 'Erosions on X-ray'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'demographic_mismatch'],
    plausible_distractor_families: ['crystal_arthropathy'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_RHEUM002',
    canonical_id: 'MED.RHEUM.SLE.DX.OUT.YA',
    shelf: 'medicine', system: 'Rheumatology', topic: 'SLE', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 70, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 15 }),
    disease_family: 'autoimmune_connective_tissue',
    presentation_patterns: ['joint_pain_autoimmune', 'rash_systemic', 'renal_failure'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose SLE with multi-system involvement (skin, joints, serositis, renal, heme, neuro); ANA → anti-dsDNA/anti-Smith; monitor for lupus nephritis',
    competing_diagnoses: ['SLE', 'Drug-induced lupus', 'Mixed connective tissue disease', 'RA', 'Vasculitis'],
    key_distinguishing_features: ['ANA positive', 'Anti-dsDNA (specific)', 'Low complement (C3/C4)', 'Malar rash', 'Multi-system involvement'],
    suppression_style: 'competing_pattern', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'lab_ambiguity', 'demographic_mismatch'],
    plausible_distractor_families: ['vasculitis', 'glomerular_disease'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_RHEUM003',
    canonical_id: 'MED.RHEUM.GOUT.NXT.ED.MID',
    shelf: 'medicine', system: 'Rheumatology', topic: 'Gout', subtopic: 'Acute Flare',
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 55 }),
    disease_family: 'crystal_arthropathy',
    presentation_patterns: ['joint_pain_autoimmune'],
    acuity_band: 'urgent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Treat acute gout flare (NSAIDs/colchicine/steroids), NOT allopurinol during flare; joint aspiration shows negatively birefringent crystals; rule out septic arthritis',
    competing_diagnoses: ['Acute gout', 'Pseudogout', 'Septic arthritis', 'Reactive arthritis', 'Trauma'],
    key_distinguishing_features: ['1st MTP involvement', 'Negatively birefringent needle-shaped crystals', 'Elevated uric acid (unreliable in acute flare)', 'Rapid onset monoarthritis'],
    suppression_style: 'competing_pattern', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'lab_ambiguity'],
    plausible_distractor_families: ['systemic_infection'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_RHEUM004',
    canonical_id: 'MED.RHEUM.CPPD.DX.INP.ELD',
    shelf: 'medicine', system: 'Rheumatology', topic: 'Pseudogout', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 30 }),
    disease_family: 'crystal_arthropathy',
    presentation_patterns: ['joint_pain_autoimmune'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose pseudogout: rhomboid positively birefringent CPPD crystals on arthrocentesis; chondrocalcinosis on X-ray; evaluate for metabolic causes (hyperparathyroidism, hemochromatosis)',
    competing_diagnoses: ['Pseudogout (CPPD)', 'Gout', 'Septic arthritis', 'RA flare', 'OA flare'],
    key_distinguishing_features: ['Rhomboid positively birefringent crystals', 'Chondrocalcinosis on X-ray', 'Knee/wrist most common', 'Associated metabolic conditions'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'demographic_mismatch'],
    plausible_distractor_families: ['systemic_infection'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_RHEUM005',
    canonical_id: 'MED.RHEUM.PMRGCA.DXT.OUT.ELD',
    shelf: 'medicine', system: 'Rheumatology', topic: 'PMR/GCA', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 25 }),
    disease_family: 'vasculitis',
    presentation_patterns: ['joint_pain_autoimmune', 'headache_focal_deficit', 'weakness_fatigue'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose PMR (bilateral shoulder/hip stiffness, elevated ESR, dramatic steroid response) and screen for GCA (temporal headache, jaw claudication, vision loss → urgent biopsy)',
    competing_diagnoses: ['PMR', 'GCA', 'RA (elderly onset)', 'Hypothyroidism', 'Malignancy'],
    key_distinguishing_features: ['Age >50 with bilateral shoulder girdle pain', 'ESR >40', 'Rapid response to low-dose prednisone (PMR)', 'Temporal artery biopsy for GCA'],
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'response_to_treatment',
    misdirection_vectors: ['symptom_overlap', 'demographic_mismatch'],
    plausible_distractor_families: ['autoimmune_connective_tissue'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_RHEUM006',
    canonical_id: 'MED.RHEUM.AS.DX.OUT.YA',
    shelf: 'medicine', system: 'Rheumatology', topic: 'Ankylosing Spondylitis', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    exam_frequency: 50, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 20 }),
    disease_family: 'spondyloarthropathy',
    presentation_patterns: ['joint_pain_autoimmune'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose AS in young male with inflammatory back pain (improves with exercise, worse at night); HLA-B27; sacroiliitis on MRI/X-ray',
    competing_diagnoses: ['Ankylosing spondylitis', 'Mechanical back pain', 'Reactive arthritis', 'Psoriatic arthritis', 'Diffuse idiopathic skeletal hyperostosis'],
    key_distinguishing_features: ['Inflammatory back pain pattern', 'HLA-B27 positive', 'Sacroiliitis on imaging', 'Reduced spinal mobility', 'Anterior uveitis'],
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'late',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['demographic_mismatch', 'symptom_overlap'],
    plausible_distractor_families: ['autoimmune_connective_tissue'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_RHEUM007',
    canonical_id: 'MED.RHEUM.VASC.DXT.INP.MID',
    shelf: 'medicine', system: 'Rheumatology', topic: 'Vasculitis', subtopic: 'ANCA-associated',
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 10 }),
    disease_family: 'vasculitis',
    presentation_patterns: ['renal_failure', 'cough_fever', 'rash_systemic'],
    acuity_band: 'urgent', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Classify ANCA vasculitis: GPA (c-ANCA/PR3, upper/lower respiratory + renal), MPA (p-ANCA/MPO, renal + pulmonary), EGPA (eosinophilia + asthma)',
    competing_diagnoses: ['GPA (Wegener)', 'MPA', 'EGPA (Churg-Strauss)', 'Anti-GBM disease', 'Polyarteritis nodosa'],
    key_distinguishing_features: ['ANCA pattern (c-ANCA vs p-ANCA)', 'Organ involvement pattern', 'Pauci-immune GN on biopsy', 'Eosinophilia in EGPA'],
    suppression_style: 'competing_pattern', noise_budget: 'high', confirmatory_delay: 'late',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['symptom_overlap', 'lab_ambiguity'],
    plausible_distractor_families: ['glomerular_disease', 'pneumonia'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // ELECTROLYTES/ACID-BASE (6 nodes)
  // =========================================================================
  {
    node_id: 'N_LYTE001',
    canonical_id: 'MED.LYTE.HYPONATR.DXT.INP.ELD',
    shelf: 'medicine', system: 'Electrolytes/Acid-Base', topic: 'Hyponatremia', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 80, clinical_frequency: 60,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 60 }),
    disease_family: 'sodium_disorder',
    presentation_patterns: ['electrolyte_abnormality', 'altered_mental_status'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Classify hyponatremia by volume status and osmolality: hypovolemic (give NS) vs euvolemic/SIADH (fluid restrict) vs hypervolemic (diuretics); avoid overcorrection (ODS)',
    competing_diagnoses: ['SIADH', 'Hypovolemic hyponatremia', 'Heart failure', 'Cirrhosis', 'Beer potomania', 'Adrenal insufficiency'],
    key_distinguishing_features: ['Serum osmolality', 'Urine sodium and osmolality', 'Volume status assessment', 'Correction rate <8 mEq/24h'],
    suppression_style: 'competing_pattern', noise_budget: 'high', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'medication_confounder'],
    plausible_distractor_families: ['heart_failure', 'chronic_liver_disease'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_LYTE002',
    canonical_id: 'MED.LYTE.HYPERK.STAB.ED.ELD',
    shelf: 'medicine', system: 'Electrolytes/Acid-Base', topic: 'Hyperkalemia', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 80, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 55 }),
    disease_family: 'potassium_disorder',
    presentation_patterns: ['electrolyte_abnormality'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Manage hyperkalemia: cardiac membrane stabilization (calcium gluconate) → shift K+ intracellularly (insulin/glucose, bicarb, albuterol) → eliminate K+ (kayexalate, diuretics, dialysis)',
    competing_diagnoses: ['CKD-related hyperkalemia', 'Medication-induced (ACEi, spironolactone)', 'Rhabdomyolysis', 'Adrenal insufficiency', 'Pseudohyperkalemia'],
    key_distinguishing_features: ['ECG changes (peaked T waves, widened QRS)', 'K+ level', 'Renal function', 'Medication review'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['chronic_kidney_disease'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_LYTE003',
    canonical_id: 'MED.LYTE.HYPOK.DXT.INP.MID',
    shelf: 'medicine', system: 'Electrolytes/Acid-Base', topic: 'Hypokalemia', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 60,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 60 }),
    disease_family: 'potassium_disorder',
    presentation_patterns: ['electrolyte_abnormality', 'weakness_fatigue'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Evaluate hypokalemia cause: check urine K+; renal losses (diuretics, RTA, hyperaldosteronism) vs GI losses (vomiting, diarrhea); check Mg2+ and replete both',
    competing_diagnoses: ['Diuretic-induced', 'GI losses', 'Primary aldosteronism', 'RTA', 'Hypomagnesemia-driven'],
    key_distinguishing_features: ['Urine potassium (>20 = renal loss)', 'Acid-base status', 'Blood pressure (high in Conn)', 'Magnesium level'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['adrenal_disorders'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_LYTE004',
    canonical_id: 'MED.LYTE.AGMA.DXT.ED.MID',
    shelf: 'medicine', system: 'Electrolytes/Acid-Base', topic: 'AG Metabolic Acidosis', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 75, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 75, clinical_frequency: 40 }),
    disease_family: 'acid_base_disorder_family',
    presentation_patterns: ['acid_base_disorder'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Calculate anion gap; if elevated use MUDPILES mnemonic; calculate osmolal gap for toxic alcohols; check delta-delta ratio for concurrent disorders',
    competing_diagnoses: ['DKA', 'Lactic acidosis', 'Uremia', 'Methanol/ethylene glycol ingestion', 'Salicylate toxicity'],
    key_distinguishing_features: ['Anion gap calculation', 'Osmolal gap (toxic alcohols)', 'Delta-delta ratio', 'Lactate level', 'Ketones'],
    suppression_style: 'competing_pattern', noise_budget: 'high', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'social_history_bait'],
    plausible_distractor_families: ['diabetes_mellitus', 'toxicology'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_LYTE005',
    canonical_id: 'MED.LYTE.METALK.DXT.INP.ELD',
    shelf: 'medicine', system: 'Electrolytes/Acid-Base', topic: 'Metabolic Alkalosis', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'hours', yield_tier: 'tier_2',
    exam_frequency: 50, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 40 }),
    disease_family: 'acid_base_disorder_family',
    presentation_patterns: ['acid_base_disorder', 'electrolyte_abnormality'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Classify metabolic alkalosis by urine chloride: saline-responsive (<20, vomiting/NG suction/diuretics) vs saline-resistant (>20, hyperaldosteronism, Bartter/Gitelman)',
    competing_diagnoses: ['Contraction alkalosis (vomiting)', 'Diuretic-induced', 'Primary aldosteronism', 'Bartter/Gitelman syndrome', 'Milk-alkali syndrome'],
    key_distinguishing_features: ['Urine chloride <20 vs >20', 'Volume status', 'Blood pressure', 'Potassium level'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'medication_confounder'],
    plausible_distractor_families: ['adrenal_disorders'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_LYTE006',
    canonical_id: 'MED.LYTE.HYPOCALC.NXT.INP.MID',
    shelf: 'medicine', system: 'Electrolytes/Acid-Base', topic: 'Hypocalcemia', subtopic: null,
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 30 }),
    disease_family: 'calcium_disorder',
    presentation_patterns: ['electrolyte_abnormality'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Manage symptomatic hypocalcemia (tetany, seizures, QT prolongation): IV calcium gluconate; determine etiology (hypoparathyroidism, vitamin D deficiency, hypomagnesemia)',
    competing_diagnoses: ['Post-surgical hypoparathyroidism', 'Vitamin D deficiency', 'Hypomagnesemia-driven', 'CKD-related', 'Pseudohypoparathyroidism'],
    key_distinguishing_features: ['Chvostek/Trousseau signs', 'Prolonged QTc', 'PTH level', 'Magnesium level', 'Phosphorus level (high in hypopara)'],
    suppression_style: 'classic', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'medication_confounder'],
    plausible_distractor_families: ['potassium_disorder'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // NEUROLOGY-WITHIN-IM (9 nodes)
  // =========================================================================
  {
    node_id: 'N_NEURO001',
    canonical_id: 'MED.NEURO.STROKE.NXT.ED.ELD',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Ischemic Stroke', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 80, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 55 }),
    disease_family: 'cerebrovascular',
    presentation_patterns: ['headache_focal_deficit', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Acute ischemic stroke: non-contrast CT head → tPA if <4.5h (check exclusions) → thrombectomy if LVO <24h; secondary prevention with antiplatelets + statin',
    competing_diagnoses: ['Ischemic stroke', 'Hemorrhagic stroke', 'TIA', 'Todd paralysis', 'Hypoglycemia'],
    key_distinguishing_features: ['Sudden focal neurological deficit', 'CT head to exclude hemorrhage', 'Time from symptom onset', 'NIHSS score'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['timeline_conflict', 'symptom_overlap'],
    plausible_distractor_families: ['seizure_disorder'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO002',
    canonical_id: 'MED.NEURO.TIA.NXT.ED.MID',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'TIA', subtopic: null,
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 40 }),
    disease_family: 'cerebrovascular',
    presentation_patterns: ['headache_focal_deficit'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Risk-stratify TIA with ABCD2 score; urgent carotid imaging; start dual antiplatelet (aspirin + clopidogrel for 21 days); statin; evaluate for AF',
    competing_diagnoses: ['TIA', 'Migraine with aura', 'Seizure with Todd paralysis', 'Hypoglycemia', 'Peripheral vertigo'],
    key_distinguishing_features: ['Resolved focal deficit', 'ABCD2 score', 'MRI DWI for completed infarct', 'Carotid stenosis on duplex'],
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['timeline_conflict', 'symptom_overlap'],
    plausible_distractor_families: ['seizure_disorder'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO003',
    canonical_id: 'MED.NEURO.SEIZURE.NXT.ED.YA',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Seizure', subtopic: 'New-Onset',
    task_type: 'next_step', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 35,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 35 }),
    disease_family: 'seizure_disorder',
    presentation_patterns: ['altered_mental_status'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Evaluate first seizure: metabolic workup, CT/MRI head, EEG; decide whether to start AED (recurrence risk factors); status epilepticus management (benzos → fosphenytoin → propofol)',
    competing_diagnoses: ['New-onset epilepsy', 'Provoked seizure (metabolic)', 'Syncope with convulsive movements', 'Psychogenic non-epileptic event', 'Brain tumor'],
    key_distinguishing_features: ['Witnessed tonic-clonic activity', 'Post-ictal confusion', 'MRI/CT findings', 'EEG abnormalities'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['symptom_overlap', 'social_history_bait'],
    plausible_distractor_families: ['cerebrovascular', 'toxicology'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO004',
    canonical_id: 'MED.NEURO.MS.DX.OUT.YA',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Multiple Sclerosis', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 15 }),
    disease_family: 'demyelinating',
    presentation_patterns: ['weakness_fatigue', 'headache_focal_deficit'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose MS with dissemination in time and space (McDonald criteria); MRI white matter lesions; CSF oligoclonal bands; treat acute relapse with IV steroids',
    competing_diagnoses: ['MS (relapsing-remitting)', 'Neuromyelitis optica', 'CNS lymphoma', 'Sarcoidosis', 'B12 deficiency myelopathy'],
    key_distinguishing_features: ['Young woman with episodic neuro deficits', 'MRI periventricular white matter lesions', 'CSF oligoclonal bands', 'Optic neuritis/INO'],
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'late',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['symptom_overlap', 'timeline_conflict', 'demographic_mismatch'],
    plausible_distractor_families: ['autoimmune_connective_tissue'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO005',
    canonical_id: 'MED.NEURO.MG.DXT.OUT.MID',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Myasthenia Gravis', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 10 }),
    disease_family: 'neuromuscular',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose MG: fatigable weakness (ptosis, diplopia, proximal); AChR antibodies → anti-MuSK if negative; CT chest for thymoma; crisis management (avoid precipitants)',
    competing_diagnoses: ['Myasthenia gravis', 'Lambert-Eaton syndrome', 'Botulism', 'MS', 'GBS'],
    key_distinguishing_features: ['Fatigable weakness worsening with use', 'Ptosis and diplopia', 'AChR antibody positive', 'Edrophonium/ice pack test'],
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'late',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'timeline_conflict'],
    plausible_distractor_families: ['demyelinating'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO006',
    canonical_id: 'MED.NEURO.GBS.COMP.INP.MID',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Guillain-Barre Syndrome', subtopic: null,
    task_type: 'complication_recognition', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 10 }),
    disease_family: 'neuromuscular',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize GBS: ascending paralysis after infection, areflexia, CSF albuminocytologic dissociation; monitor FVC for respiratory failure; treat with IVIG or plasmapheresis',
    competing_diagnoses: ['GBS', 'Transverse myelitis', 'Spinal cord compression', 'MG crisis', 'Botulism'],
    key_distinguishing_features: ['Ascending symmetric weakness', 'Areflexia', 'CSF elevated protein with normal WBC', 'FVC monitoring for intubation'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'timeline_conflict'],
    plausible_distractor_families: ['demyelinating'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO007',
    canonical_id: 'MED.NEURO.PARKIN.NXT.OUT.ELD',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Parkinson Disease', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 50, clinical_frequency: 35,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 35 }),
    disease_family: 'movement_disorder',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Diagnose Parkinson (resting tremor, bradykinesia, rigidity, postural instability); initiate carbidopa-levodopa; distinguish from essential tremor, drug-induced parkinsonism',
    competing_diagnoses: ['Parkinson disease', 'Essential tremor', 'Drug-induced parkinsonism', 'Lewy body dementia', 'MSA/PSP'],
    key_distinguishing_features: ['Asymmetric resting tremor', 'Bradykinesia', 'Cogwheel rigidity', 'Response to levodopa'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['medication_confounder', 'demographic_mismatch'],
    plausible_distractor_families: ['cerebrovascular'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO008',
    canonical_id: 'MED.NEURO.DELDEM.DXT.OUT.ELD',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Delirium vs Dementia', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'days', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 65,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 65 }),
    disease_family: 'cerebrovascular',
    presentation_patterns: ['altered_mental_status'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish delirium (acute, fluctuating, reversible) from dementia (chronic, progressive); identify delirium precipitants; Alzheimer vs vascular vs Lewy body dementia',
    competing_diagnoses: ['Delirium (metabolic/infectious)', 'Alzheimer dementia', 'Vascular dementia', 'Lewy body dementia', 'Normal pressure hydrocephalus', 'Depression pseudodementia'],
    key_distinguishing_features: ['Acute vs insidious onset', 'Fluctuating attention (delirium)', 'CAM criteria', 'Reversible causes (UTI, meds, metabolic)'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['medication_confounder', 'timeline_conflict'],
    plausible_distractor_families: ['toxicology', 'systemic_infection'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_NEURO009',
    canonical_id: 'MED.NEURO.SAH.STAB.ED.MID',
    shelf: 'medicine', system: 'Neurology-within-IM', topic: 'Subarachnoid Hemorrhage', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 10 }),
    disease_family: 'cerebrovascular',
    presentation_patterns: ['headache_focal_deficit'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Thunderclap headache → non-contrast CT head (sensitive <6h) → LP for xanthochromia if CT negative; CTA for aneurysm; manage with nimodipine + neurosurgery consult',
    competing_diagnoses: ['Aneurysmal SAH', 'Thunderclap migraine', 'Meningitis', 'ICH', 'Cervical artery dissection'],
    key_distinguishing_features: ['Worst headache of life, sudden onset', 'CT head showing subarachnoid blood', 'Xanthochromia on LP', 'Aneurysm on CTA'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['symptom_overlap', 'timeline_conflict'],
    plausible_distractor_families: ['cns_infection'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // PREVENTIVE/SCREENING (6 nodes)
  // =========================================================================
  {
    node_id: 'N_PREV001',
    canonical_id: 'MED.PREV.COLCA.RISK.OUT.MID',
    shelf: 'medicine', system: 'Preventive/Screening', topic: 'Colon Cancer Screening', subtopic: null,
    task_type: 'risk_identification', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 60,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 60 }),
    disease_family: 'preventive_care',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Average risk: colonoscopy q10yr starting age 45; high-risk (family hx, IBD, Lynch): earlier and more frequent; FIT as alternative; know when to stop (age 85)',
    competing_diagnoses: ['Average-risk screening', 'High-risk surveillance (family hx)', 'Lynch syndrome screening', 'IBD surveillance', 'Post-polypectomy surveillance'],
    key_distinguishing_features: ['Age eligibility', 'Family history of CRC', 'Prior polyp history', 'Screening modality choice'],
    suppression_style: 'negative_space_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'social_history',
    misdirection_vectors: ['demographic_mismatch', 'social_history_bait'],
    plausible_distractor_families: ['gi_hemorrhage'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PREV002',
    canonical_id: 'MED.PREV.BRCA.RISK.OUT.MID',
    shelf: 'medicine', system: 'Preventive/Screening', topic: 'Breast Cancer Screening', subtopic: null,
    task_type: 'risk_identification', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 50, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 55 }),
    disease_family: 'preventive_care',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Mammography screening guidelines by risk: average risk biennial 50-74 (USPSTF) or annual 40+ (ACS); BRCA carriers add MRI; know dense breast tissue management',
    competing_diagnoses: ['Average-risk mammography', 'High-risk screening (BRCA)', 'BI-RADS follow-up', 'Abnormal mammogram workup'],
    key_distinguishing_features: ['Age and risk stratification', 'BRCA mutation status', 'BI-RADS classification', 'Supplemental MRI indications'],
    suppression_style: 'negative_space_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'social_history',
    misdirection_vectors: ['demographic_mismatch'],
    plausible_distractor_families: ['paraneoplastic'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PREV003',
    canonical_id: 'MED.PREV.CERVCA.RISK.OUT.YA',
    shelf: 'medicine', system: 'Preventive/Screening', topic: 'Cervical Cancer Screening', subtopic: null,
    task_type: 'risk_identification', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 50, clinical_frequency: 50,
    frequency_score: computeFrequencyScore({ exam_frequency: 50, clinical_frequency: 50 }),
    disease_family: 'preventive_care',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Cervical cancer screening: Pap q3yr ages 21-29, Pap+HPV co-test q5yr ages 30-65; no screening <21 or after hysterectomy for benign disease; HPV vaccination',
    competing_diagnoses: ['Routine Pap screening', 'Abnormal Pap follow-up', 'HPV-positive management', 'Post-hysterectomy screening decision'],
    key_distinguishing_features: ['Age-based screening intervals', 'HPV co-testing indications', 'ASCUS management algorithm', 'When to stop screening'],
    suppression_style: 'negative_space_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'social_history',
    misdirection_vectors: ['demographic_mismatch'],
    plausible_distractor_families: ['sexually_transmitted_infection'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PREV004',
    canonical_id: 'MED.PREV.IMMUN.NXT.OUT.ELD',
    shelf: 'medicine', system: 'Preventive/Screening', topic: 'Adult Immunizations', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 55,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 55 }),
    disease_family: 'preventive_care',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Recommend age-appropriate immunizations: PCV20 for 65+, shingles (Shingrix) 50+, Tdap/Td, annual influenza; special populations (asplenia, HIV)',
    competing_diagnoses: ['Age-appropriate vaccination', 'High-risk vaccination (asplenia)', 'Immunocompromised vaccination', 'Travel vaccination'],
    key_distinguishing_features: ['Age thresholds for vaccines', 'Live vaccine contraindications', 'Asplenia vaccination panel', 'Catch-up schedules'],
    suppression_style: 'negative_space_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'social_history',
    misdirection_vectors: ['demographic_mismatch'],
    plausible_distractor_families: ['opportunistic_infection'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PREV005',
    canonical_id: 'MED.PREV.LIPID.NXT.OUT.MID',
    shelf: 'medicine', system: 'Preventive/Screening', topic: 'Lipid Management', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 75,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 75 }),
    disease_family: 'preventive_care',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Statin therapy by risk: high-intensity for ASCVD/DM/LDL>190; moderate for 10-yr ASCVD risk >7.5%; calculate pooled cohort equation; add ezetimibe/PCSK9i if not at goal',
    competing_diagnoses: ['Primary prevention statin', 'Secondary prevention high-intensity statin', 'Statin intolerance management', 'Familial hypercholesterolemia'],
    key_distinguishing_features: ['10-year ASCVD risk score', 'LDL goal based on risk category', 'Statin intensity selection', 'Risk enhancers (CAC score, hsCRP)'],
    suppression_style: 'management_hinge', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['medication_confounder', 'lab_ambiguity'],
    plausible_distractor_families: ['coronary_artery_disease'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_PREV006',
    canonical_id: 'MED.PREV.OSTEO.RISK.OUT.ELD',
    shelf: 'medicine', system: 'Preventive/Screening', topic: 'Osteoporosis Screening', subtopic: null,
    task_type: 'risk_identification', clinical_setting: 'outpatient', age_group: 'elderly',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 45 }),
    disease_family: 'preventive_care',
    presentation_patterns: ['weakness_fatigue'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'DEXA screening: women 65+, men 70+, younger with risk factors; T-score interpretation; treat with bisphosphonates if T-score <-2.5 or FRAX >20%/3%',
    competing_diagnoses: ['Osteoporosis requiring treatment', 'Osteopenia for monitoring', 'Secondary osteoporosis (steroids)', 'Vitamin D deficiency'],
    key_distinguishing_features: ['T-score interpretation', 'FRAX score thresholds', 'DEXA screening criteria', 'Bisphosphonate indications and duration'],
    suppression_style: 'negative_space_hinge', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['demographic_mismatch', 'medication_confounder'],
    plausible_distractor_families: ['calcium_metabolism'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // DERMATOLOGY-WITHIN-IM (5 nodes)
  // =========================================================================
  {
    node_id: 'N_DERM001',
    canonical_id: 'MED.DERM.MELAN.RISK.OUT.MID',
    shelf: 'medicine', system: 'Dermatology-within-IM', topic: 'Melanoma', subtopic: null,
    task_type: 'risk_identification', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 20 }),
    disease_family: 'skin_neoplasm',
    presentation_patterns: ['rash_systemic'],
    acuity_band: 'subacute', difficulty_tier: 'straightforward',
    algorithm_concept: 'Apply ABCDE criteria for concerning lesions; Breslow depth determines staging; sentinel lymph node biopsy for >1mm; know risk factors (UV, dysplastic nevi, family hx)',
    competing_diagnoses: ['Melanoma', 'Dysplastic nevus', 'Seborrheic keratosis', 'Basal cell carcinoma', 'Squamous cell carcinoma'],
    key_distinguishing_features: ['Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution', 'Breslow depth', 'Ulceration', 'Sentinel node status'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['demographic_mismatch'],
    plausible_distractor_families: ['drug_reaction'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_DERM002',
    canonical_id: 'MED.DERM.SJSTEN.STAB.ICU.YA',
    shelf: 'medicine', system: 'Dermatology-within-IM', topic: 'SJS/TEN', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'icu', age_group: 'young_adult',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 5,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 5 }),
    disease_family: 'drug_reaction',
    presentation_patterns: ['rash_systemic', 'fever_unknown_source'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize SJS/TEN: mucocutaneous blistering after drug exposure; distinguish by BSA (<10% SJS, >30% TEN); stop offending drug; burn unit transfer; common culprits (allopurinol, sulfa, carbamazepine, lamotrigine)',
    competing_diagnoses: ['SJS', 'TEN', 'DRESS syndrome', 'Staphylococcal scalded skin syndrome', 'Pemphigus vulgaris'],
    key_distinguishing_features: ['Mucosal involvement', 'Nikolsky sign positive', 'BSA of detachment', 'Temporal drug relationship', 'Target lesions (SJS)'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder', 'symptom_overlap'],
    plausible_distractor_families: ['autoimmune_connective_tissue'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_DERM003',
    canonical_id: 'MED.DERM.PSORIASIS.NXT.OUT.MID',
    shelf: 'medicine', system: 'Dermatology-within-IM', topic: 'Psoriasis', subtopic: null,
    task_type: 'next_step', clinical_setting: 'outpatient', age_group: 'middle_aged',
    time_horizon: 'chronic', yield_tier: 'tier_2',
    exam_frequency: 40, clinical_frequency: 35,
    frequency_score: computeFrequencyScore({ exam_frequency: 40, clinical_frequency: 35 }),
    disease_family: 'autoimmune_connective_tissue',
    presentation_patterns: ['rash_systemic', 'joint_pain_autoimmune'],
    acuity_band: 'chronic', difficulty_tier: 'straightforward',
    algorithm_concept: 'Diagnose plaque psoriasis clinically; recognize psoriatic arthritis (DIP involvement, dactylitis, nail pitting); screen for metabolic syndrome; treatment ladder: topicals → phototherapy → DMARDs → biologics',
    competing_diagnoses: ['Plaque psoriasis', 'Psoriatic arthritis', 'Eczema', 'Seborrheic dermatitis', 'Secondary syphilis'],
    key_distinguishing_features: ['Well-demarcated silvery plaques on extensor surfaces', 'Auspitz sign', 'Nail pitting/onycholysis', 'DIP joint involvement'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap'],
    plausible_distractor_families: ['spondyloarthropathy'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_DERM004',
    canonical_id: 'MED.DERM.EN.DXT.OUT.YA',
    shelf: 'medicine', system: 'Dermatology-within-IM', topic: 'Erythema Nodosum', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'outpatient', age_group: 'young_adult',
    time_horizon: 'weeks', yield_tier: 'tier_2',
    exam_frequency: 40, clinical_frequency: 15,
    frequency_score: computeFrequencyScore({ exam_frequency: 40, clinical_frequency: 15 }),
    disease_family: 'autoimmune_connective_tissue',
    presentation_patterns: ['rash_systemic', 'joint_pain_autoimmune'],
    acuity_band: 'subacute', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize erythema nodosum (tender nodules on anterior shins) and work up underlying cause: sarcoidosis, IBD, infection (strep, TB, coccidioidomycosis), medications (OCPs)',
    competing_diagnoses: ['Sarcoidosis-related EN', 'IBD-related EN', 'Streptococcal infection-related EN', 'Drug-induced EN', 'Idiopathic EN'],
    key_distinguishing_features: ['Tender erythematous nodules on shins', 'Bilateral and symmetric', 'Panniculitis on biopsy', 'CXR for bilateral hilar lymphadenopathy (sarcoidosis)'],
    suppression_style: 'delayed_reveal', noise_budget: 'medium', confirmatory_delay: 'late',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'imaging_red_herring'],
    plausible_distractor_families: ['inflammatory_bowel_disease', 'respiratory_infection'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_DERM005',
    canonical_id: 'MED.DERM.PEMPH.DX.INP.ELD',
    shelf: 'medicine', system: 'Dermatology-within-IM', topic: 'Pemphigus/Pemphigoid', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'inpatient', age_group: 'elderly',
    time_horizon: 'days', yield_tier: 'tier_2',
    exam_frequency: 45, clinical_frequency: 5,
    frequency_score: computeFrequencyScore({ exam_frequency: 45, clinical_frequency: 5 }),
    disease_family: 'autoimmune_connective_tissue',
    presentation_patterns: ['rash_systemic'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Distinguish pemphigus vulgaris (flaccid blisters, mucosal, Nikolsky+, anti-desmoglein) from bullous pemphigoid (tense blisters, no mucosal, anti-BP180/BP230)',
    competing_diagnoses: ['Pemphigus vulgaris', 'Bullous pemphigoid', 'Dermatitis herpetiformis', 'Linear IgA disease', 'SJS/TEN'],
    key_distinguishing_features: ['Flaccid vs tense blisters', 'Mucosal involvement (PV)', 'Nikolsky sign', 'Immunofluorescence pattern', 'Anti-desmoglein vs anti-BP180'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'demographic_mismatch'],
    plausible_distractor_families: ['drug_reaction'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // TOXICOLOGY-WITHIN-IM (5 nodes)
  // =========================================================================
  {
    node_id: 'N_TOX001',
    canonical_id: 'MED.TOX.APAP.STAB.ED.YA',
    shelf: 'medicine', system: 'Toxicology-within-IM', topic: 'Acetaminophen Overdose', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 70, clinical_frequency: 30,
    frequency_score: computeFrequencyScore({ exam_frequency: 70, clinical_frequency: 30 }),
    disease_family: 'toxicology',
    presentation_patterns: ['vomiting', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Use Rumack-Matthew nomogram at 4h post-ingestion to determine NAC indication; start NAC if any doubt; recognize late presentation with hepatic failure',
    competing_diagnoses: ['Acute APAP overdose', 'Chronic APAP supratherapeutic', 'Other hepatotoxin', 'Viral hepatitis', 'Alcoholic hepatitis'],
    key_distinguishing_features: ['APAP level at 4h post-ingestion', 'Rumack-Matthew nomogram', 'AST/ALT rise pattern', 'INR elevation in severe cases'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['social_history_bait', 'timeline_conflict'],
    plausible_distractor_families: ['chronic_liver_disease'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_TOX002',
    canonical_id: 'MED.TOX.SALICYLATE.DXT.ED.MID',
    shelf: 'medicine', system: 'Toxicology-within-IM', topic: 'Salicylate Toxicity', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 10 }),
    disease_family: 'toxicology',
    presentation_patterns: ['acid_base_disorder', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Recognize salicylate toxicity: mixed respiratory alkalosis + AG metabolic acidosis; tinnitus; treat with sodium bicarbonate for urinary alkalinization; dialysis for severe',
    competing_diagnoses: ['Salicylate overdose', 'DKA', 'Sepsis', 'Methanol/ethylene glycol', 'Uremia'],
    key_distinguishing_features: ['Mixed acid-base disorder (resp alkalosis + AG met acidosis)', 'Tinnitus', 'Salicylate level', 'Elevated anion gap with respiratory alkalosis'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'lab_result',
    misdirection_vectors: ['lab_ambiguity', 'social_history_bait'],
    plausible_distractor_families: ['acid_base_disorder_family'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_TOX003',
    canonical_id: 'MED.TOX.OPIOID.STAB.ED.YA',
    shelf: 'medicine', system: 'Toxicology-within-IM', topic: 'Opioid Overdose', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 40 }),
    disease_family: 'toxicology',
    presentation_patterns: ['altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Recognize opioid toxidrome (miosis, respiratory depression, AMS) and treat with naloxone; titrate to respiratory effort; observe for re-sedation with long-acting opioids',
    competing_diagnoses: ['Opioid overdose', 'Benzodiazepine overdose', 'Pontine stroke', 'Hypoglycemia', 'Organophosphate poisoning (also miosis)'],
    key_distinguishing_features: ['Pinpoint pupils (miosis)', 'Respiratory depression', 'Response to naloxone', 'Needle track marks'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['social_history_bait', 'symptom_overlap'],
    plausible_distractor_families: ['cerebrovascular'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_TOX004',
    canonical_id: 'MED.TOX.ETOHWD.NXT.INP.MID',
    shelf: 'medicine', system: 'Toxicology-within-IM', topic: 'Alcohol Withdrawal', subtopic: null,
    task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 45 }),
    disease_family: 'toxicology',
    presentation_patterns: ['altered_mental_status'],
    acuity_band: 'urgent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Grade alcohol withdrawal severity (CIWA); benzodiazepines for moderate-severe; recognize delirium tremens (48-96h); thiamine before glucose; seizure prophylaxis',
    competing_diagnoses: ['Alcohol withdrawal', 'Delirium tremens', 'Wernicke encephalopathy', 'Hepatic encephalopathy', 'Seizure disorder'],
    key_distinguishing_features: ['CIWA score', 'Autonomic hyperactivity (tremor, tachycardia, diaphoresis)', 'Timeline from last drink', 'Visual hallucinations'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'temporal_pattern',
    misdirection_vectors: ['social_history_bait', 'timeline_conflict'],
    plausible_distractor_families: ['hepatic_complications', 'seizure_disorder'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_TOX005',
    canonical_id: 'MED.TOX.SEROTONNMS.DX.ICU.MID',
    shelf: 'medicine', system: 'Toxicology-within-IM', topic: 'Serotonin Syndrome vs NMS', subtopic: null,
    task_type: 'diagnosis', clinical_setting: 'icu', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 10 }),
    disease_family: 'toxicology',
    presentation_patterns: ['altered_mental_status', 'fever_unknown_source'],
    acuity_band: 'emergent', difficulty_tier: 'trap_heavy',
    algorithm_concept: 'Distinguish serotonin syndrome (rapid onset, clonus, hyperreflexia, serotonergic drug) from NMS (slow onset, lead-pipe rigidity, antipsychotic) and malignant hyperthermia',
    competing_diagnoses: ['Serotonin syndrome', 'Neuroleptic malignant syndrome', 'Malignant hyperthermia', 'Anticholinergic toxicity', 'Thyroid storm'],
    key_distinguishing_features: ['Clonus/hyperreflexia (serotonin) vs rigidity (NMS)', 'Rapid vs slow onset', 'Offending medication class', 'Treatment (cyproheptadine vs dantrolene/bromocriptine)'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'medication_history',
    misdirection_vectors: ['medication_confounder', 'symptom_overlap'],
    plausible_distractor_families: ['thyroid_disorders'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },

  // =========================================================================
  // CRITICAL CARE/SHOCK (8 nodes)
  // =========================================================================
  {
    node_id: 'N_CRIT001',
    canonical_id: 'MED.CRIT.SEPTSHK.STAB.ICU.ELD',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'Septic Shock', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'icu', age_group: 'elderly',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 80, clinical_frequency: 45,
    frequency_score: computeFrequencyScore({ exam_frequency: 80, clinical_frequency: 45 }),
    disease_family: 'shock',
    presentation_patterns: ['altered_mental_status', 'fever_unknown_source'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Manage septic shock: fluid resuscitation → norepinephrine if MAP <65 after fluids → vasopressin as adjunct → hydrocortisone if refractory; source control',
    competing_diagnoses: ['Septic shock', 'Cardiogenic shock', 'Distributive shock (non-septic)', 'Hypovolemic shock', 'Adrenal crisis'],
    key_distinguishing_features: ['Hypotension refractory to 30mL/kg fluids', 'Lactate >2', 'Warm/vasodilated extremities (early)', 'Source of infection identified'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch'],
    plausible_distractor_families: ['adrenal_disorders'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_CRIT002',
    canonical_id: 'MED.CRIT.CARDIOSHK.DXT.ICU.ELD',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'Cardiogenic Shock', subtopic: null,
    task_type: 'diagnostic_test', clinical_setting: 'icu', age_group: 'elderly',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 20 }),
    disease_family: 'shock',
    presentation_patterns: ['dyspnea', 'chest_pain', 'altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose cardiogenic shock: bedside echo (poor EF, wall motion abnormalities); distinguish from septic shock by cold extremities, elevated SVR, pulmonary edema; inotropes + revascularization for MI',
    competing_diagnoses: ['Cardiogenic shock (MI)', 'Septic shock', 'Massive PE', 'Cardiac tamponade', 'Tension pneumothorax'],
    key_distinguishing_features: ['Cold/clammy extremities', 'Elevated JVP', 'Pulmonary edema', 'Low cardiac output on echo', 'Elevated PCWP'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['vital_sign_mismatch', 'symptom_overlap'],
    plausible_distractor_families: ['systemic_infection', 'venous_thromboembolism'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_CRIT003',
    canonical_id: 'MED.CRIT.ANAPHY.STAB.ED.YA',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'Anaphylaxis', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'young_adult',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 20,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 20 }),
    disease_family: 'shock',
    presentation_patterns: ['dyspnea', 'rash_systemic'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Recognize anaphylaxis (multi-system: skin + respiratory/cardiovascular); IM epinephrine is first-line; adjuncts: H1/H2 blockers, steroids, fluids; observe for biphasic reaction',
    competing_diagnoses: ['Anaphylaxis', 'Severe asthma', 'Angioedema (ACEi)', 'Carcinoid crisis', 'Panic attack'],
    key_distinguishing_features: ['Rapid onset multi-system involvement', 'Urticaria/angioedema', 'Hypotension', 'Allergen exposure history', 'Tryptase elevation'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['symptom_overlap', 'medication_confounder'],
    plausible_distractor_families: ['obstructive_airway_disease'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_CRIT004',
    canonical_id: 'MED.CRIT.ARDS.NXT.ICU.MID',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'ARDS', subtopic: null,
    task_type: 'next_step', clinical_setting: 'icu', age_group: 'middle_aged',
    time_horizon: 'hours', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 25 }),
    disease_family: 'shock',
    presentation_patterns: ['dyspnea'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Diagnose ARDS (Berlin criteria: acute onset, bilateral infiltrates, PaO2/FiO2 <300, not cardiogenic); manage with low tidal volume ventilation (6mL/kg IBW), prone positioning, conservative fluids',
    competing_diagnoses: ['ARDS', 'Cardiogenic pulmonary edema', 'Diffuse alveolar hemorrhage', 'Acute eosinophilic pneumonia', 'Bilateral pneumonia'],
    key_distinguishing_features: ['PaO2/FiO2 ratio', 'Bilateral infiltrates not explained by effusions', 'Normal PCWP', 'Acute onset with known trigger (sepsis, aspiration, pancreatitis)'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'imaging_finding',
    misdirection_vectors: ['imaging_red_herring', 'lab_ambiguity'],
    plausible_distractor_families: ['heart_failure', 'pneumonia'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_CRIT005',
    canonical_id: 'MED.CRIT.TENSPTX.STAB.ED.MID',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'Tension Pneumothorax', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 10 }),
    disease_family: 'shock',
    presentation_patterns: ['dyspnea', 'chest_pain'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Tension pneumothorax is a clinical diagnosis: do NOT wait for CXR; needle decompression 2nd ICS midclavicular followed by chest tube; distinguish from cardiac tamponade',
    competing_diagnoses: ['Tension pneumothorax', 'Cardiac tamponade', 'Massive PE', 'Hemothorax', 'Simple pneumothorax'],
    key_distinguishing_features: ['Hypotension + JVD + absent breath sounds unilateral', 'Tracheal deviation', 'Clinical diagnosis (no CXR needed)', 'Needle decompression relief'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'physical_exam_finding',
    misdirection_vectors: ['vital_sign_mismatch'],
    plausible_distractor_families: ['pericardial_disease', 'venous_thromboembolism'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_CRIT006',
    canonical_id: 'MED.CRIT.MASSPE.STAB.ICU.MID',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'Massive PE', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'icu', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 65, clinical_frequency: 10,
    frequency_score: computeFrequencyScore({ exam_frequency: 65, clinical_frequency: 10 }),
    disease_family: 'venous_thromboembolism',
    presentation_patterns: ['dyspnea', 'syncope', 'chest_pain'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Massive PE with hemodynamic instability: systemic thrombolytics (alteplase); if contraindicated, surgical embolectomy or catheter-directed therapy; bedside echo shows RV dilation',
    competing_diagnoses: ['Massive PE', 'Cardiogenic shock', 'Cardiac tamponade', 'Tension pneumothorax', 'Aortic dissection'],
    key_distinguishing_features: ['Acute RV failure on bedside echo', 'Hemodynamic instability', 'CT-PA saddle embolus', 'McConnell sign'],
    suppression_style: 'competing_pattern', noise_budget: 'medium', confirmatory_delay: 'mid',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch', 'symptom_overlap'],
    plausible_distractor_families: ['heart_failure', 'pericardial_disease'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_CRIT007',
    canonical_id: 'MED.CRIT.HYPOVOL.STAB.ED.MID',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'Hypovolemic Shock', subtopic: null,
    task_type: 'stabilization', clinical_setting: 'ed', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 55, clinical_frequency: 40,
    frequency_score: computeFrequencyScore({ exam_frequency: 55, clinical_frequency: 40 }),
    disease_family: 'shock',
    presentation_patterns: ['altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'straightforward',
    algorithm_concept: 'Classify hypovolemic shock: hemorrhagic (source control + transfusion) vs non-hemorrhagic (fluid resuscitation); assess class of hemorrhagic shock by HR/BP/mental status',
    competing_diagnoses: ['Hemorrhagic shock', 'Dehydration/volume depletion', 'Septic shock (early)', 'Adrenal crisis', 'Third-spacing (pancreatitis)'],
    key_distinguishing_features: ['Tachycardia with flat JVP', 'Cool/clammy extremities', 'Narrow pulse pressure', 'Hgb drop (hemorrhagic)', 'Response to fluid challenge'],
    suppression_style: 'classic', noise_budget: 'low', confirmatory_delay: 'early',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch'],
    plausible_distractor_families: ['gi_hemorrhage'],
    required_reconciliation_steps: 2,
    nbme_sample_item_ids: [],
  },
  {
    node_id: 'N_CRIT008',
    canonical_id: 'MED.CRIT.DISTSHK.DXT.ICU.MID',
    shelf: 'medicine', system: 'Critical Care/Shock', topic: 'Distributive Shock', subtopic: 'Differential',
    task_type: 'diagnostic_test', clinical_setting: 'icu', age_group: 'middle_aged',
    time_horizon: 'immediate', yield_tier: 'tier_1',
    exam_frequency: 60, clinical_frequency: 25,
    frequency_score: computeFrequencyScore({ exam_frequency: 60, clinical_frequency: 25 }),
    disease_family: 'shock',
    presentation_patterns: ['altered_mental_status'],
    acuity_band: 'emergent', difficulty_tier: 'moderate_ambiguity',
    algorithm_concept: 'Classify shock by hemodynamic profile: distributive (low SVR, high CO) includes septic, anaphylactic, neurogenic, adrenal crisis; distinguish from cardiogenic (high SVR, low CO) and hypovolemic',
    competing_diagnoses: ['Septic shock', 'Anaphylactic shock', 'Neurogenic shock', 'Adrenal crisis', 'Cardiogenic shock'],
    key_distinguishing_features: ['Warm extremities (vasodilation)', 'Low SVR', 'High cardiac output (early)', 'Central venous O2 saturation', 'Specific etiology markers'],
    suppression_style: 'competing_pattern', noise_budget: 'high', confirmatory_delay: 'mid',
    hinge_sentence_type: 'vital_sign',
    misdirection_vectors: ['vital_sign_mismatch', 'symptom_overlap'],
    plausible_distractor_families: ['heart_failure', 'adrenal_disorders'],
    required_reconciliation_steps: 3,
    nbme_sample_item_ids: [],
  },
];

