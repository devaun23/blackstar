export interface HingeClueTypeSeed {
  name: string;
  description: string;
  example: string;
  sort_order: number;
}

export const hingeClueTypes: HingeClueTypeSeed[] = [
  {
    name: 'instability_clue',
    description: 'Vital sign or hemodynamic finding that changes urgency of management.',
    example: 'Systolic BP 82, HR 124 → stabilize before diagnose',
    sort_order: 1,
  },
  {
    name: 'temporal_progression',
    description: 'Time course that distinguishes acute from chronic or early from late.',
    example: '3 days of worsening vs 3 months of stable symptoms',
    sort_order: 2,
  },
  {
    name: 'contraindication',
    description: 'Finding that rules out an otherwise standard treatment.',
    example: 'Allergy to penicillin → cannot use amoxicillin for strep pharyngitis',
    sort_order: 3,
  },
  {
    name: 'lab_pattern',
    description: 'Laboratory value or pattern that pivots the diagnosis or management.',
    example: 'Troponin positive + ST depression → NSTEMI not unstable angina',
    sort_order: 4,
  },
  {
    name: 'imaging_discriminator',
    description: 'Imaging finding that distinguishes between competing diagnoses.',
    example: 'Air under diaphragm → perforation, not uncomplicated diverticulitis',
    sort_order: 5,
  },
  {
    name: 'history_pivot',
    description: 'Historical detail that redirects the differential diagnosis.',
    example: 'Recent travel to endemic area → consider tropical infections',
    sort_order: 6,
  },
  {
    name: 'physical_exam_sign',
    description: 'Physical exam finding that is the key discriminator.',
    example: 'Janeway lesions → endocarditis, not simple bacteremia',
    sort_order: 7,
  },
  {
    name: 'medication_side_effect',
    description: 'Drug effect that explains current presentation or contraindicates next step.',
    example: 'Patient on lithium with tremor and polyuria → lithium toxicity',
    sort_order: 8,
  },
  {
    name: 'age_specific_presentation',
    description: 'Age-dependent variation in disease presentation or management.',
    example: 'Elderly MI presenting with dyspnea rather than chest pain',
    sort_order: 9,
  },
  {
    name: 'risk_factor_constellation',
    description: 'Combination of risk factors that changes pre-test probability.',
    example: 'Smoker + hemoptysis + weight loss → lung cancer higher than pneumonia',
    sort_order: 10,
  },
];
