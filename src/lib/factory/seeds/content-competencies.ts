/**
 * USMLE Step 2 CK Physician Task/Competency Areas (Jan 2026 outline)
 * 11 competencies with exam weight ranges and task_type mappings.
 * Source: USMLE Step 2 CK Content Outline and Specifications (last updated Jan 2026)
 *
 * The Jan 2026 outline restructured competencies under "Patient Care" as the
 * primary category. Medical knowledge (foundational science) is no longer
 * directly tested (0%) but remains as context for clinical questions.
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
    display_name: 'Applying Foundational Science',
    usmle_label: 'Medical Knowledge: Applying Foundational Science Concepts',
    weight_min: 0, weight_max: 0,
    maps_to_task_types: ['diagnosis'],
    sort_order: 1,
  },
  {
    code: 'history_physical',
    display_name: 'History & Physical Exam',
    usmle_label: 'Patient Care: History and Physical Exam',
    weight_min: 13, weight_max: 17,
    maps_to_task_types: ['diagnosis', 'risk_identification'],
    sort_order: 2,
  },
  {
    code: 'lab_diagnostic',
    display_name: 'Laboratory/Diagnostic Studies',
    usmle_label: 'Patient Care: Laboratory/Diagnostic Studies',
    weight_min: 16, weight_max: 20,
    maps_to_task_types: ['diagnostic_test'],
    sort_order: 3,
  },
  {
    code: 'diagnosis',
    display_name: 'Diagnosis',
    usmle_label: 'Patient Care: Diagnosis',
    weight_min: 5, weight_max: 9,
    maps_to_task_types: ['diagnosis'],
    sort_order: 4,
  },
  {
    code: 'prognosis_outcome',
    display_name: 'Prognosis/Outcome',
    usmle_label: 'Patient Care: Prognosis/Outcome',
    weight_min: 8, weight_max: 12,
    maps_to_task_types: ['complication_recognition', 'risk_identification'],
    sort_order: 5,
  },
  {
    code: 'health_maintenance',
    display_name: 'Health Maintenance/Disease Prevention',
    usmle_label: 'Patient Care: Health Maintenance/Disease Prevention',
    weight_min: 8, weight_max: 12,
    maps_to_task_types: ['risk_identification', 'diagnostic_test'],
    sort_order: 6,
  },
  {
    code: 'pharmacotherapy',
    display_name: 'Pharmacotherapy',
    usmle_label: 'Patient Care: Pharmacotherapy',
    weight_min: 6, weight_max: 10,
    maps_to_task_types: ['next_step'],
    sort_order: 7,
  },
  {
    code: 'clinical_interventions',
    display_name: 'Clinical Interventions',
    usmle_label: 'Patient Care: Clinical Interventions',
    weight_min: 12, weight_max: 16,
    maps_to_task_types: ['next_step', 'stabilization'],
    sort_order: 8,
  },
  {
    code: 'practice_based_learning',
    display_name: 'Practice-Based Learning & Improvement',
    usmle_label: 'Practice-Based Learning & Improvement',
    weight_min: 3, weight_max: 5,
    maps_to_task_types: [],
    sort_order: 9,
  },
  {
    code: 'professionalism',
    display_name: 'Professionalism',
    usmle_label: 'Professionalism',
    weight_min: 5, weight_max: 7,
    maps_to_task_types: [],
    sort_order: 10,
  },
  {
    code: 'systems_based_practice',
    display_name: 'Systems-Based Practice & Patient Safety',
    usmle_label: 'Systems-Based Practice & Patient Safety',
    weight_min: 5, weight_max: 7,
    maps_to_task_types: [],
    sort_order: 11,
  },
];
