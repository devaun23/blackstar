export interface ActionClassSeed {
  name: string;
  priority_rank: number;
  description: string;
  example_actions: string[];
}

export const actionClasses: ActionClassSeed[] = [
  {
    name: 'stabilize',
    priority_rank: 1,
    description: 'Immediate life-saving intervention to stabilize the patient.',
    example_actions: ['intubate', 'IV fluids for shock', 'needle decompression', 'cardioversion'],
  },
  {
    name: 'diagnose_emergent',
    priority_rank: 2,
    description: 'Urgent diagnostic action needed to guide emergent treatment.',
    example_actions: ['STAT CT head', 'ECG for chest pain', 'bedside echo', 'blood cultures before antibiotics'],
  },
  {
    name: 'treat_emergent',
    priority_rank: 3,
    description: 'Time-sensitive treatment that must not be delayed.',
    example_actions: ['tPA for acute stroke', 'PCI for STEMI', 'broad-spectrum antibiotics for sepsis', 'epinephrine for anaphylaxis'],
  },
  {
    name: 'diagnose_standard',
    priority_rank: 4,
    description: 'Standard diagnostic workup for non-emergent conditions.',
    example_actions: ['colonoscopy for iron deficiency anemia', 'TSH for fatigue', 'HbA1c for diabetes screening'],
  },
  {
    name: 'confirm',
    priority_rank: 5,
    description: 'Confirmatory test or assessment to verify a suspected diagnosis.',
    example_actions: ['tissue biopsy', 'genetic testing', 'provocative testing', 'repeat labs to confirm'],
  },
  {
    name: 'treat_standard',
    priority_rank: 6,
    description: 'Standard first-line treatment for a confirmed diagnosis.',
    example_actions: ['metformin for T2DM', 'ACE inhibitor for CHF', 'PPI for GERD', 'SSRI for MDD'],
  },
  {
    name: 'observe',
    priority_rank: 7,
    description: 'Watchful waiting or monitoring without immediate intervention.',
    example_actions: ['serial abdominal exams', 'repeat troponin in 6 hours', 'observation for 24 hours', 'follow-up imaging in 3 months'],
  },
  {
    name: 'counsel',
    priority_rank: 8,
    description: 'Patient education, lifestyle modification, or shared decision-making.',
    example_actions: ['smoking cessation counseling', 'dietary changes', 'exercise prescription', 'advance directive discussion'],
  },
  {
    name: 'disposition',
    priority_rank: 9,
    description: 'Determine appropriate level of care or discharge planning.',
    example_actions: ['admit to ICU', 'transfer to higher level of care', 'discharge with follow-up', 'refer to specialist'],
  },
];
