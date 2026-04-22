/**
 * USMLE Step 2 CK Content Systems (Jan 2026 outline)
 * 15 organ systems with exam weight ranges.
 * Source: USMLE Step 2 CK Content Outline and Specifications (last updated Jan 2026)
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
  { code: 'human_development', display_name: 'Human Development', usmle_label: 'Human Development', weight_min: 2, weight_max: 4, sort_order: 1 },
  { code: 'immune', display_name: 'Immune', usmle_label: 'Immune System', weight_min: 3, weight_max: 5, sort_order: 2 },
  { code: 'blood_lymph', display_name: 'Blood & Lymphoreticular', usmle_label: 'Blood & Lymphoreticular System', weight_min: 3, weight_max: 6, sort_order: 3 },
  { code: 'behavioral_health', display_name: 'Behavioral Health', usmle_label: 'Behavioral Health', weight_min: 5, weight_max: 10, sort_order: 4 },
  { code: 'nervous_system', display_name: 'Nervous System & Special Senses', usmle_label: 'Nervous System & Special Senses', weight_min: 5, weight_max: 10, sort_order: 5 },
  { code: 'musculoskeletal', display_name: 'Musculoskeletal, Skin & Subcutaneous Tissue', usmle_label: 'Musculoskeletal, Skin & Subcutaneous Tissue', weight_min: 6, weight_max: 12, sort_order: 6 },
  { code: 'cardiovascular', display_name: 'Cardiovascular', usmle_label: 'Cardiovascular System', weight_min: 6, weight_max: 12, sort_order: 7 },
  { code: 'respiratory', display_name: 'Respiratory', usmle_label: 'Respiratory System', weight_min: 5, weight_max: 10, sort_order: 8 },
  { code: 'gastrointestinal', display_name: 'Gastrointestinal', usmle_label: 'Gastrointestinal System', weight_min: 5, weight_max: 10, sort_order: 9 },
  { code: 'renal_urinary_reproductive', display_name: 'Renal, Urinary & Reproductive', usmle_label: 'Renal & Urinary System & Reproductive Systems', weight_min: 7, weight_max: 13, sort_order: 10 },
  { code: 'pregnancy', display_name: 'Pregnancy, Childbirth & Puerperium', usmle_label: 'Pregnancy, Childbirth & the Puerperium', weight_min: 3, weight_max: 7, sort_order: 11 },
  { code: 'endocrine', display_name: 'Endocrine', usmle_label: 'Endocrine System', weight_min: 3, weight_max: 7, sort_order: 12 },
  { code: 'multisystem', display_name: 'Multisystem Processes & Disorders', usmle_label: 'Multisystem Processes & Disorders', weight_min: 4, weight_max: 8, sort_order: 13 },
  { code: 'biostatistics', display_name: 'Biostatistics & Epidemiology', usmle_label: 'Biostatistics & Epidemiology/Population Health & Interpretation of Medical Literature', weight_min: 3, weight_max: 5, sort_order: 14 },
  { code: 'social_sciences', display_name: 'Social Sciences', usmle_label: 'Social Sciences: Legal/Ethical Issues & Professionalism/Systems-Based Practice & Patient Safety', weight_min: 10, weight_max: 15, sort_order: 15 },
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
  // Jan 2026 new system mappings
  'Behavioral Health': 'behavioral_health',
  'Psychiatry': 'behavioral_health',
  'Psychiatry-within-IM': 'behavioral_health',
  'Human Development': 'human_development',
  'Embryology': 'human_development',
  'Growth & Development': 'human_development',
};
