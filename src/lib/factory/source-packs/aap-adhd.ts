import type { SourcePack } from './types';

export const PACK_AAP_ADHD_2019: SourcePack = {
  source_pack_id: 'PACK.AAP.ADHD.2019',
  source_name: 'AAP 2019 Clinical Practice Guideline: Diagnosis, Evaluation, and Treatment of ADHD in Children and Adolescents',
  source_registry_id: 'REG.AAP.ADHD',
  canonical_url: 'https://doi.org/10.1542/peds.2019-2528',
  publication_year: 2019,
  guideline_body: 'AAP',

  topic_tags: ['ADHD', 'Behavioral Health', 'Methylphenidate', 'Developmental Pediatrics'],
  allowed_decision_scopes: [
    'ADHD diagnosis in children and adolescents',
    'behavioral therapy for preschool ADHD',
    'stimulant medication initiation',
    'medication selection and titration',
    'comorbidity screening in ADHD',
    'growth monitoring on stimulants',
  ],
  excluded_decision_scopes: [
    'adult ADHD management',
    'ADHD in intellectual disability',
    'substance abuse treatment in ADHD',
    'detailed psychopharmacology beyond first-line agents',
  ],

  recommendations: [
    {
      rec_id: 'PACK.AAP.ADHD.2019.REC.01',
      display_id: 'AAP-ADHD-R1',
      statement: 'For preschool-aged children (4-5 years), parent- and/or teacher-administered behavior therapy is recommended as first-line treatment before medication.',
      normalized_claim: 'Behavioral therapy is first-line for ADHD in children aged 4-5 years; medication only if behavioral interventions insufficient.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Preschool Treatment', page_or_location: 'Section 4.1' },
    },
    {
      rec_id: 'PACK.AAP.ADHD.2019.REC.02',
      display_id: 'AAP-ADHD-R2',
      statement: 'For elementary school-aged children (6-11 years), FDA-approved stimulant medication AND/OR behavioral therapy should be prescribed. Combined treatment is preferred.',
      normalized_claim: 'For children 6-11 years: stimulant medication (methylphenidate or amphetamine) and/or behavioral therapy; combined treatment preferred.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'School-Age Treatment', page_or_location: 'Section 4.2' },
    },
    {
      rec_id: 'PACK.AAP.ADHD.2019.REC.03',
      display_id: 'AAP-ADHD-R3',
      statement: 'Clinicians should screen for comorbid conditions including anxiety, depression, oppositional defiant disorder, conduct disorder, learning disabilities, and sleep disorders.',
      normalized_claim: 'Screen all ADHD patients for comorbidities: anxiety, depression, ODD/CD, learning disabilities, tic disorders, and sleep problems.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Comorbidity Assessment', page_or_location: 'Section 3.2' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.AAP.ADHD.2019.DC.01',
      display_id: 'AAP-ADHD-DC1',
      name: 'ADHD Diagnostic Criteria (DSM-5)',
      components: [
        '>=6 symptoms of inattention AND/OR >=6 symptoms of hyperactivity-impulsivity (>=5 for age >=17)',
        'Symptoms present for >=6 months',
        'Several symptoms present before age 12',
        'Symptoms present in >=2 settings (home, school, work)',
        'Clear evidence symptoms interfere with or reduce quality of functioning',
        'Symptoms not better explained by another mental disorder',
        'Presentations: predominantly inattentive, predominantly hyperactive-impulsive, or combined',
      ],
      interpretation: 'Diagnosis requires information from multiple sources (parent, teacher, clinician observation). Rating scales (Vanderbilt, Conners) assist but do not replace clinical judgment.',
      normalized_claim: 'ADHD diagnosis: >=6 symptoms in >=2 settings for >=6 months, onset before age 12, with functional impairment, using multi-source information.',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2.1' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.AAP.ADHD.2019.T.01',
      display_id: 'AAP-ADHD-T1',
      parameter: 'Age threshold for behavioral therapy first vs medication',
      value: '6',
      unit: 'years',
      clinical_meaning: 'Children <6 years should receive behavioral therapy as first-line. Children >=6 years may receive stimulant medication as first-line or in combination with behavioral therapy.',
      normalized_claim: 'Age 6 is the threshold: <6 years = behavioral therapy first; >=6 years = stimulant medication acceptable as first-line.',
      direction: 'below',
      provenance: { section: 'Treatment Algorithm', page_or_location: 'Section 4.1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.AAP.ADHD.2019.TX.01',
      display_id: 'AAP-ADHD-TX1',
      action: 'Behavioral therapy for preschool ADHD',
      normalized_claim: 'Parent training in behavior management (PTBM) is the evidence-based first-line for preschool ADHD (4-5 years); includes positive reinforcement, consistent consequences, and structured routines.',
      timing: 'At diagnosis for children 4-5 years',
      condition: 'ADHD diagnosis in child aged 4-5 years',
      provenance: { section: 'Preschool Treatment', page_or_location: 'Section 4.1' },
    },
    {
      step_id: 'PACK.AAP.ADHD.2019.TX.02',
      display_id: 'AAP-ADHD-TX2',
      action: 'Stimulant medication initiation for school-age children',
      normalized_claim: 'Methylphenidate is recommended first-line stimulant for children >=6 years. Start low, titrate to optimal dose. Monitor heart rate, blood pressure, appetite, sleep, and growth.',
      timing: 'At diagnosis for children >=6 years, or after behavioral therapy insufficient for 4-5 years',
      condition: 'ADHD in children >=6 years or refractory preschool ADHD',
      drug_details: { drug: 'Methylphenidate', dose: 'Start 5mg daily, titrate weekly', route: 'PO' },
      contraindications: ['Structural cardiac abnormalities', 'Uncontrolled hypertension', 'Glaucoma', 'MAOI use'],
      escalation: 'If methylphenidate insufficient: try amphetamine-based stimulant. If stimulants fail or contraindicated: atomoxetine, guanfacine ER, or clonidine ER.',
      provenance: { section: 'Medication', page_or_location: 'Section 4.2' },
    },
    {
      step_id: 'PACK.AAP.ADHD.2019.TX.03',
      display_id: 'AAP-ADHD-TX3',
      action: 'Growth and cardiovascular monitoring on stimulants',
      normalized_claim: 'Monitor height, weight, BMI, heart rate, and blood pressure at each medication visit. Plot growth curves. Routine ECG not required unless cardiac history.',
      timing: 'At each medication management visit (monthly during titration, then every 3-6 months)',
      condition: 'Child on stimulant medication for ADHD',
      provenance: { section: 'Monitoring', page_or_location: 'Section 4.3' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.AAP.ADHD.2019.RF.01',
      display_id: 'AAP-ADHD-RF1',
      finding: 'Suicidal ideation, severe mood lability, or psychotic symptoms emerging after stimulant initiation',
      implication: 'May indicate undiagnosed bipolar disorder unmasked by stimulant, or adverse drug effect. Stimulants can exacerbate tics and anxiety.',
      action: 'Discontinue or reduce stimulant. Urgent psychiatric evaluation. Screen for bipolar disorder and other mood disorders. Consider non-stimulant alternative.',
      urgency: 'urgent',
      provenance: { section: 'Adverse Effects', page_or_location: 'Section 4.4' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.AAP.ADHD.2019.SEV.01',
      display_id: 'AAP-ADHD-SEV1',
      level: 'Mild ADHD',
      criteria: [
        'Meets minimum symptom criteria (6 symptoms)',
        'Impairment in 1-2 settings but manageable',
        'No significant comorbidities',
        'Academic functioning mildly affected',
      ],
      management_implications:
        'Behavioral therapy alone may be sufficient, especially for preschoolers. School accommodations (504 plan or IEP). Parent education. Reassess in 4-6 weeks and add medication if insufficient improvement.',
      provenance: { section: 'Severity Assessment', page_or_location: 'Section 3.3' },
    },
    {
      severity_id: 'PACK.AAP.ADHD.2019.SEV.02',
      display_id: 'AAP-ADHD-SEV2',
      level: 'Severe ADHD with comorbidities',
      criteria: [
        'Many symptoms beyond threshold',
        'Marked impairment across multiple settings',
        'Comorbid ODD/CD, anxiety, depression, or learning disability',
        'Academic failure or significant social impairment',
        'Safety concerns (impulsivity leading to injury risk)',
      ],
      management_implications:
        'Combined treatment (medication + behavioral therapy) strongly recommended. Address comorbidities concurrently. Consider multimodal team (pediatrician, psychologist, school). More frequent follow-up. May need non-stimulant adjunct for comorbid anxiety/tics.',
      provenance: { section: 'Complex ADHD', page_or_location: 'Section 5.1' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Pediatrics pack for ADHD per AAP 2019 guideline. Covers age-based treatment approach, DSM-5 criteria, stimulant prescribing, and comorbidity screening.',

  all_item_ids: [
    'PACK.AAP.ADHD.2019.REC.01', 'PACK.AAP.ADHD.2019.REC.02', 'PACK.AAP.ADHD.2019.REC.03',
    'PACK.AAP.ADHD.2019.DC.01',
    'PACK.AAP.ADHD.2019.T.01',
    'PACK.AAP.ADHD.2019.TX.01', 'PACK.AAP.ADHD.2019.TX.02', 'PACK.AAP.ADHD.2019.TX.03',
    'PACK.AAP.ADHD.2019.RF.01',
    'PACK.AAP.ADHD.2019.SEV.01', 'PACK.AAP.ADHD.2019.SEV.02',
  ],
  all_display_ids: [
    'AAP-ADHD-R1', 'AAP-ADHD-R2', 'AAP-ADHD-R3',
    'AAP-ADHD-DC1',
    'AAP-ADHD-T1',
    'AAP-ADHD-TX1', 'AAP-ADHD-TX2', 'AAP-ADHD-TX3',
    'AAP-ADHD-RF1',
    'AAP-ADHD-SEV1', 'AAP-ADHD-SEV2',
  ],
};
