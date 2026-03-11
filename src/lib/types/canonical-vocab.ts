// Canonical vocabulary for the Blackstar production system.
// These registries define the closed set of valid values for spec-layer fields.
// Source of truth for presentation funnels, disease families, and suppression types.

// ---------------------------------------------------------------------------
// Subsystem codes — used in canonical IDs
// ---------------------------------------------------------------------------

export const SUBSYSTEM_CODES = {
  Cardiology: 'CARD',
  Pulmonary: 'PULM',
  Gastroenterology: 'GI',
  Hepatology: 'HEPA',
  Nephrology: 'NEPH',
  Endocrinology: 'ENDO',
  'Hematology/Oncology': 'HEME',
  'Infectious Disease': 'ID',
  Rheumatology: 'RHEUM',
  'Electrolytes/Acid-Base': 'LYTE',
  'Neurology-within-IM': 'NEURO',
  'Preventive/Screening': 'PREV',
  'Dermatology-within-IM': 'DERM',
  'Toxicology-within-IM': 'TOX',
  'Critical Care/Shock': 'CRIT',
} as const;

export type SubsystemName = keyof typeof SUBSYSTEM_CODES;
export type SubsystemCode = (typeof SUBSYSTEM_CODES)[SubsystemName];

// ---------------------------------------------------------------------------
// Task type abbreviations — used in canonical IDs
// ---------------------------------------------------------------------------

export const TASK_TYPE_ABBREVS = {
  diagnosis: 'DX',
  diagnostic_test: 'DXT',
  next_step: 'NXT',
  stabilization: 'STAB',
  risk_identification: 'RISK',
  complication_recognition: 'COMP',
} as const;

// ---------------------------------------------------------------------------
// Setting and age abbreviations — used in canonical IDs
// ---------------------------------------------------------------------------

export const SETTING_ABBREVS = {
  outpatient: 'OUT',
  inpatient: 'INP',
  ed: 'ED',
  icu: 'ICU',
} as const;

export const AGE_ABBREVS = {
  young_adult: 'YA',
  middle_aged: 'MID',
  elderly: 'ELD',
} as const;

// ---------------------------------------------------------------------------
// Presentation patterns — 23 canonical funnels
// ---------------------------------------------------------------------------

export const PRESENTATION_PATTERNS = [
  'chest_pain',
  'dyspnea',
  'syncope',
  'palpitations',
  'edema',
  'abdominal_pain',
  'gi_bleed',
  'jaundice',
  'diarrhea',
  'vomiting',
  'weight_loss',
  'polyuria_polydipsia',
  'weakness_fatigue',
  'anemia',
  'fever_unknown_source',
  'altered_mental_status',
  'headache_focal_deficit',
  'rash_systemic',
  'joint_pain_autoimmune',
  'renal_failure',
  'acid_base_disorder',
  'electrolyte_abnormality',
  'cough_fever',
] as const;

export type PresentationPattern = (typeof PRESENTATION_PATTERNS)[number];

// ---------------------------------------------------------------------------
// Presentation synonym resolver
// ---------------------------------------------------------------------------

export const PRESENTATION_SYNONYMS: Record<string, PresentationPattern> = {
  ams: 'altered_mental_status',
  confusion: 'altered_mental_status',
  sob: 'dyspnea',
  shortness_of_breath: 'dyspnea',
  hematochezia: 'gi_bleed',
  melena: 'gi_bleed',
  hematemesis: 'gi_bleed',
  transaminitis: 'jaundice',
  elevated_lfts: 'jaundice',
  hematuria: 'renal_failure',
  proteinuria: 'renal_failure',
  arthralgia: 'joint_pain_autoimmune',
  irregular_heartbeat: 'palpitations',
};

export function resolvePresentation(input: string): PresentationPattern | null {
  const normalized = input.toLowerCase().replace(/[\s-]+/g, '_');
  if ((PRESENTATION_PATTERNS as readonly string[]).includes(normalized)) {
    return normalized as PresentationPattern;
  }
  return PRESENTATION_SYNONYMS[normalized] ?? null;
}

// ---------------------------------------------------------------------------
// Disease families — ~55 groupings of related conditions
// ---------------------------------------------------------------------------

export const DISEASE_FAMILIES = [
  // Cardiology
  'coronary_artery_disease', 'heart_failure', 'arrhythmia', 'valvular_heart_disease',
  'hypertension', 'pericardial_disease', 'aortic_disease', 'endocarditis',
  // Pulmonary
  'obstructive_airway_disease', 'venous_thromboembolism', 'pneumonia',
  'pleural_disease', 'interstitial_lung_disease', 'lung_neoplasm',
  // GI
  'peptic_ulcer_disease', 'inflammatory_bowel_disease', 'gi_hemorrhage',
  'pancreatic_disease', 'biliary_disease', 'bowel_obstruction', 'malabsorption',
  // Hepatology
  'chronic_liver_disease', 'viral_hepatitis', 'hepatic_complications',
  // Nephrology
  'acute_kidney_injury', 'chronic_kidney_disease', 'glomerular_disease',
  'nephrolithiasis', 'tubular_disease',
  // Endocrine
  'diabetes_mellitus', 'thyroid_disorders', 'adrenal_disorders',
  'pituitary_disorders', 'calcium_metabolism', 'osteoporosis',
  // Heme/Onc
  'anemia_family', 'coagulopathy', 'leukemia_lymphoma', 'paraneoplastic',
  // ID
  'systemic_infection', 'respiratory_infection', 'urinary_infection',
  'cns_infection', 'sexually_transmitted_infection', 'opportunistic_infection',
  // Rheum
  'autoimmune_connective_tissue', 'crystal_arthropathy', 'vasculitis', 'spondyloarthropathy',
  // Electrolytes
  'sodium_disorder', 'potassium_disorder', 'calcium_disorder', 'acid_base_disorder_family',
  // Neuro-IM
  'cerebrovascular', 'demyelinating', 'neuromuscular', 'movement_disorder', 'seizure_disorder',
  // Other
  'toxicology', 'shock', 'skin_neoplasm', 'drug_reaction', 'preventive_care',
] as const;

export type DiseaseFamily = (typeof DISEASE_FAMILIES)[number];

// ---------------------------------------------------------------------------
// Spec-layer field types
// ---------------------------------------------------------------------------

export type AcuityBand = 'emergent' | 'urgent' | 'subacute' | 'chronic';

export type DifficultyTier = 'straightforward' | 'moderate_ambiguity' | 'trap_heavy';

export type SuppressionStyle =
  | 'classic'
  | 'competing_pattern'
  | 'misleading_context'
  | 'delayed_reveal'
  | 'management_hinge'
  | 'negative_space_hinge';

export type NoiseBudget = 'low' | 'medium' | 'high';

export type ConfirmatoryDelay = 'early' | 'mid' | 'late';

export type HingeSentenceType =
  | 'physical_exam_finding'
  | 'lab_result'
  | 'temporal_pattern'
  | 'medication_history'
  | 'social_history'
  | 'vital_sign'
  | 'imaging_finding'
  | 'response_to_treatment';

// ---------------------------------------------------------------------------
// Misdirection vectors — taxonomy of vignette tricks for suppression control
// ---------------------------------------------------------------------------

export type MisdirectionVector =
  | 'symptom_overlap'       // Symptoms shared between correct and distractor
  | 'demographic_mismatch'  // Age/sex doesn't match classic presentation
  | 'timeline_conflict'     // Temporal pattern suggests wrong diagnosis
  | 'lab_ambiguity'         // Lab values consistent with multiple diagnoses
  | 'imaging_red_herring'   // Incidental imaging finding distracts
  | 'medication_confounder' // Medication side effects mimic disease
  | 'social_history_bait'   // Social history suggests wrong etiology
  | 'vital_sign_mismatch';  // Vitals point one way, diagnosis is another
