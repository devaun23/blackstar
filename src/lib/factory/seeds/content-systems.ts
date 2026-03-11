/**
 * USMLE Step 2 CK Content Systems (2025 outline)
 * 15 organ systems with exam weight ranges.
 * Source: USMLE Step 2 CK Content Description and General Information Booklet
 */
export interface ContentSystemSeed {
  code: string;
  display_name: string;
  usmle_label: string;
  weight_min: number;
  weight_max: number;
  sort_order: number;
}

export const contentSystems: ContentSystemSeed[] = [
  { code: 'blood_lymph', display_name: 'Blood & Lymphoreticular', usmle_label: 'Blood & Lymphoreticular System', weight_min: 3, weight_max: 7, sort_order: 1 },
  { code: 'cardiovascular', display_name: 'Cardiovascular', usmle_label: 'Cardiovascular System', weight_min: 6, weight_max: 12, sort_order: 2 },
  { code: 'endocrine', display_name: 'Endocrine', usmle_label: 'Endocrine System', weight_min: 4, weight_max: 8, sort_order: 3 },
  { code: 'gastrointestinal', display_name: 'Gastrointestinal', usmle_label: 'Gastrointestinal System', weight_min: 5, weight_max: 10, sort_order: 4 },
  { code: 'general_principles', display_name: 'General Principles', usmle_label: 'General Principles of Foundational Science', weight_min: 1, weight_max: 5, sort_order: 5 },
  { code: 'immune', display_name: 'Immune', usmle_label: 'Immune System', weight_min: 3, weight_max: 7, sort_order: 6 },
  { code: 'multisystem', display_name: 'Multisystem Processes & Disorders', usmle_label: 'Multisystem Processes & Disorders', weight_min: 3, weight_max: 7, sort_order: 7 },
  { code: 'musculoskeletal', display_name: 'Musculoskeletal & Connective Tissue', usmle_label: 'Musculoskeletal, Skin & Subcutaneous Tissue', weight_min: 4, weight_max: 8, sort_order: 8 },
  { code: 'nervous_system', display_name: 'Nervous System & Special Senses', usmle_label: 'Nervous System & Special Senses', weight_min: 5, weight_max: 10, sort_order: 9 },
  { code: 'nutritional', display_name: 'Nutritional & Digestive', usmle_label: 'Nutritional & Digestive Disorders', weight_min: 1, weight_max: 3, sort_order: 10 },
  { code: 'pregnancy', display_name: 'Pregnancy, Childbirth & Puerperium', usmle_label: 'Pregnancy, Childbirth & the Puerperium', weight_min: 5, weight_max: 10, sort_order: 11 },
  { code: 'renal_urinary_reproductive', display_name: 'Renal, Urinary & Male Reproductive', usmle_label: 'Renal, Urinary & Male Reproductive System', weight_min: 4, weight_max: 8, sort_order: 12 },
  { code: 'respiratory', display_name: 'Respiratory', usmle_label: 'Respiratory System', weight_min: 5, weight_max: 10, sort_order: 13 },
  { code: 'biostatistics', display_name: 'Biostatistics & Epidemiology', usmle_label: 'Biostatistics & Epidemiology/Population Health', weight_min: 3, weight_max: 7, sort_order: 14 },
  { code: 'social_sciences', display_name: 'Social Sciences', usmle_label: 'Social Sciences: Communication, Ethics, & Law', weight_min: 5, weight_max: 10, sort_order: 15 },
];

/**
 * Maps freeform blueprint_node.system values to content_system.code.
 * Used during seed to backfill content_system_id on existing blueprint_nodes.
 */
export const systemToCodeMap: Record<string, string> = {
  // Legacy mappings (from original 20 blueprint nodes)
  'Cardiovascular': 'cardiovascular',
  'Vascular': 'cardiovascular',
  'Renal': 'renal_urinary_reproductive',
  'Neurology': 'nervous_system',
  // Canonical subsystem names (from MedicineNodeSpec)
  'Cardiology': 'cardiovascular',
  'Pulmonary': 'respiratory',
  'Gastroenterology': 'gastrointestinal',
  'Hepatology': 'gastrointestinal',
  'Nephrology': 'renal_urinary_reproductive',
  'Endocrinology': 'endocrine',
  'Hematology/Oncology': 'blood_lymph',
  'Infectious Disease': 'multisystem',
  'Rheumatology': 'musculoskeletal',
  'Electrolytes/Acid-Base': 'renal_urinary_reproductive',
  'Neurology-within-IM': 'nervous_system',
  'Preventive/Screening': 'biostatistics',
  'Dermatology-within-IM': 'musculoskeletal',
  'Toxicology-within-IM': 'multisystem',
  'Critical Care/Shock': 'multisystem',
};
