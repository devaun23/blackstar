/**
 * USMLE Step 2 CK Physician Task/Competency Areas (2025 outline)
 * 12 competencies with exam weight ranges and task_type mappings.
 * Source: USMLE Step 2 CK Content Description and General Information Booklet
 */
export interface ContentCompetencySeed {
  code: string;
  display_name: string;
  usmle_label: string;
  weight_min: number;
  weight_max: number;
  maps_to_task_types: string[];
  sort_order: number;
}

export const contentCompetencies: ContentCompetencySeed[] = [
  {
    code: 'medical_knowledge',
    display_name: 'Applying Foundational Science Concepts',
    usmle_label: 'Medical Knowledge: Applying Foundational Science Concepts',
    weight_min: 8, weight_max: 14,
    maps_to_task_types: ['diagnosis', 'diagnostic_test'],
    sort_order: 1,
  },
  {
    code: 'diagnosis',
    display_name: 'Diagnosis',
    usmle_label: 'Diagnosis: Knowledge, Skills, & Abilities',
    weight_min: 16, weight_max: 20,
    maps_to_task_types: ['diagnosis', 'diagnostic_test'],
    sort_order: 2,
  },
  {
    code: 'pharmacotherapy',
    display_name: 'Pharmacotherapy',
    usmle_label: 'Pharmacotherapy',
    weight_min: 10, weight_max: 16,
    maps_to_task_types: ['next_step'],
    sort_order: 3,
  },
  {
    code: 'management',
    display_name: 'Clinical Interventions',
    usmle_label: 'Management: Clinical Interventions',
    weight_min: 12, weight_max: 18,
    maps_to_task_types: ['next_step', 'stabilization'],
    sort_order: 4,
  },
  {
    code: 'clinical_informatics',
    display_name: 'Clinical Informatics',
    usmle_label: 'Clinical Informatics/Health Information Technology',
    weight_min: 1, weight_max: 3,
    maps_to_task_types: [],
    sort_order: 5,
  },
  {
    code: 'health_maintenance',
    display_name: 'Health Maintenance & Disease Prevention',
    usmle_label: 'Health Maintenance, Screening & Disease Prevention',
    weight_min: 6, weight_max: 12,
    maps_to_task_types: ['risk_identification', 'diagnostic_test'],
    sort_order: 6,
  },
  {
    code: 'mixed_competency',
    display_name: 'Mixed Competency',
    usmle_label: 'Applying Basic Science and Clinical Knowledge Across Systems',
    weight_min: 2, weight_max: 6,
    maps_to_task_types: ['diagnosis', 'next_step'],
    sort_order: 7,
  },
  {
    code: 'patient_care_systems',
    display_name: 'Systems-Based Practice',
    usmle_label: 'Patient Care: Systems-Based Practice & Patient Safety',
    weight_min: 3, weight_max: 7,
    maps_to_task_types: [],
    sort_order: 8,
  },
  {
    code: 'communication',
    display_name: 'Communication & Interpersonal Skills',
    usmle_label: 'Practice-Based Learning: Communication & Interpersonal Skills',
    weight_min: 5, weight_max: 10,
    maps_to_task_types: [],
    sort_order: 9,
  },
  {
    code: 'professionalism',
    display_name: 'Professionalism',
    usmle_label: 'Professionalism',
    weight_min: 2, weight_max: 6,
    maps_to_task_types: [],
    sort_order: 10,
  },
  {
    code: 'biostatistics_epi',
    display_name: 'Biostatistics & Epidemiology',
    usmle_label: 'Biostatistics, Epidemiology & Population Health',
    weight_min: 3, weight_max: 7,
    maps_to_task_types: [],
    sort_order: 11,
  },
  {
    code: 'emergency_medicine_comp',
    display_name: 'Emergency Medicine Competency',
    usmle_label: 'Recognition & Initial Management of Life-Threatening Conditions',
    weight_min: 4, weight_max: 8,
    maps_to_task_types: ['stabilization', 'next_step'],
    sort_order: 12,
  },
];
