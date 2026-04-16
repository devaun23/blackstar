import type { SourcePack } from './types';

export const PACK_ACOG_GDM_2018: SourcePack = {
  source_pack_id: 'PACK.ACOG.GDM.2018',
  source_name: 'ACOG Practice Bulletin No. 190: Gestational Diabetes Mellitus',
  source_registry_id: 'REG.ACOG.GDM',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000002501',
  publication_year: 2018,
  guideline_body: 'ACOG',

  topic_tags: ['Gestational Diabetes', 'GDM', 'Pregnancy', 'Endocrine', 'OB/GYN'],
  allowed_decision_scopes: [
    'GDM screening strategy',
    'GDM diagnosis',
    'dietary and exercise management',
    'pharmacologic therapy for GDM',
    'fetal surveillance in GDM',
    'delivery timing in GDM',
    'postpartum glucose testing',
  ],
  excluded_decision_scopes: [
    'pregestational type 1 or type 2 diabetes management',
    'diabetic ketoacidosis in pregnancy',
    'long-term diabetes prevention counseling',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.GDM.2018.REC.01',
      display_id: 'ACOG-GDM-R1',
      statement: 'Universal screening for GDM is recommended at 24-28 weeks gestation using a two-step approach (1-hour GLT followed by 3-hour OGTT if abnormal).',
      normalized_claim: 'Screen all pregnant women for GDM at 24-28 wks with 50g 1h GLT; if >=130-140 mg/dL, confirm with 100g 3h OGTT.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Screening', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ACOG.GDM.2018.REC.02',
      display_id: 'ACOG-GDM-R2',
      statement: 'Nutritional counseling and exercise are first-line therapy for GDM. Most women achieve glycemic control with lifestyle modification alone.',
      normalized_claim: 'Diet and exercise are first-line GDM treatment; ~80% achieve adequate control without medication.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Management', page_or_location: 'Section 5' },
    },
    {
      rec_id: 'PACK.ACOG.GDM.2018.REC.03',
      display_id: 'ACOG-GDM-R3',
      statement: 'Insulin is the preferred pharmacologic agent when diet and exercise fail to achieve glycemic targets in GDM.',
      normalized_claim: 'Insulin is preferred pharmacotherapy for GDM when lifestyle modification fails; does not cross placenta.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Pharmacotherapy', page_or_location: 'Section 6' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.GDM.2018.DC.01',
      display_id: 'ACOG-GDM-DC1',
      name: 'GDM Diagnosis (Two-Step, Carpenter-Coustan)',
      components: [
        'Step 1: 50g 1-hour glucose load test (GLT) — abnormal if >=130-140 mg/dL',
        'Step 2: 100g 3-hour OGTT — GDM diagnosed if >=2 values meet/exceed thresholds',
        'Fasting >=95 mg/dL',
        '1-hour >=180 mg/dL',
        '2-hour >=155 mg/dL',
        '3-hour >=140 mg/dL',
      ],
      interpretation: 'Two or more abnormal values on 3h OGTT confirm GDM diagnosis.',
      normalized_claim: 'GDM diagnosed by 100g 3h OGTT with >=2 abnormal values (fasting >=95, 1h >=180, 2h >=155, 3h >=140 mg/dL).',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 4' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.GDM.2018.T.01',
      display_id: 'ACOG-GDM-T1',
      parameter: 'Fasting blood glucose target in GDM',
      value: '95',
      unit: 'mg/dL',
      clinical_meaning: 'Fasting glucose should be <95 mg/dL; values consistently above this target indicate need for pharmacotherapy.',
      normalized_claim: 'GDM glycemic target: fasting <95 mg/dL; 1h postprandial <140 mg/dL; 2h postprandial <120 mg/dL.',
      direction: 'below',
      provenance: { section: 'Glycemic Targets', page_or_location: 'Section 5' },
    },
    {
      threshold_id: 'PACK.ACOG.GDM.2018.T.02',
      display_id: 'ACOG-GDM-T2',
      parameter: '1-hour GLT screening cutoff',
      value: '140',
      unit: 'mg/dL',
      clinical_meaning: '1-hour GLT >=140 mg/dL warrants confirmatory 3-hour OGTT. Some institutions use >=130 mg/dL for higher sensitivity.',
      normalized_claim: '1h GLT >=140 mg/dL (or >=130 at some centers) is abnormal and requires 3h OGTT confirmation.',
      direction: 'above',
      provenance: { section: 'Screening', page_or_location: 'Section 3' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.GDM.2018.TX.01',
      display_id: 'ACOG-GDM-TX1',
      action: 'Dietary modification and exercise for GDM',
      normalized_claim: 'GDM first-line: carbohydrate-controlled diet (3 meals + 2-3 snacks), 30 min moderate exercise most days, self-monitoring of blood glucose 4x/day.',
      timing: 'Upon GDM diagnosis',
      condition: 'Newly diagnosed GDM',
      provenance: { section: 'Lifestyle Management', page_or_location: 'Section 5' },
    },
    {
      step_id: 'PACK.ACOG.GDM.2018.TX.02',
      display_id: 'ACOG-GDM-TX2',
      action: 'Insulin therapy for GDM failing dietary control',
      normalized_claim: 'Start insulin when >=30% of glucose values exceed targets after 1-2 weeks of diet; typical starting dose 0.7-1.0 units/kg/day divided.',
      timing: '1-2 weeks after diet initiation if targets not met',
      condition: 'GDM with persistent hyperglycemia despite lifestyle modification',
      drug_details: { drug: 'Insulin (NPH + rapid-acting)', dose: '0.7-1.0 units/kg/day', route: 'Subcutaneous' },
      escalation: 'Titrate insulin every 1-2 weeks based on glucose log',
      provenance: { section: 'Pharmacotherapy', page_or_location: 'Section 6' },
    },
    {
      step_id: 'PACK.ACOG.GDM.2018.TX.03',
      display_id: 'ACOG-GDM-TX3',
      action: 'Glyburide or metformin as alternative to insulin in GDM',
      normalized_claim: 'Glyburide and metformin are alternatives when patient refuses or cannot use insulin; both cross placenta. Glyburide associated with higher rates of neonatal hypoglycemia and macrosomia than insulin.',
      timing: 'When insulin is not feasible',
      condition: 'GDM with patient preference against insulin or resource limitations',
      drug_details: { drug: 'Glyburide', dose: '2.5-20 mg/day', route: 'PO' },
      provenance: { section: 'Pharmacotherapy', page_or_location: 'Section 6' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.GDM.2018.RF.01',
      display_id: 'ACOG-GDM-RF1',
      finding: 'Fasting glucose >=126 mg/dL or random glucose >=200 mg/dL at initial prenatal visit',
      implication: 'Suggests pregestational (overt) diabetes rather than GDM; associated with higher risk of congenital anomalies.',
      action: 'Diagnose overt DM, initiate insulin, obtain HbA1c, early fetal anatomy survey, ophthalmology referral.',
      urgency: 'urgent',
      provenance: { section: 'Pregestational Diabetes', page_or_location: 'Section 2' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.GDM.2018.SEV.01',
      display_id: 'ACOG-GDM-SEV1',
      level: 'GDM requiring pharmacotherapy (A2GDM)',
      criteria: [
        'Fasting glucose consistently >=95 mg/dL despite dietary modification',
        '1-hour postprandial glucose consistently >=140 mg/dL',
        '2-hour postprandial glucose consistently >=120 mg/dL',
        '>=30% of glucose values above target',
      ],
      management_implications:
        'Initiate insulin (preferred) or oral agent. Increase fetal surveillance (weekly NST/BPP from 32 wks). Deliver by 39 0/7 wks for medication-controlled GDM; consider 37-39 wks if poorly controlled.',
      provenance: { section: 'Classification', page_or_location: 'Section 4' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering GDM screening, diagnosis (two-step), management ladder (diet → insulin), and delivery timing.',

  all_item_ids: [
    'PACK.ACOG.GDM.2018.REC.01', 'PACK.ACOG.GDM.2018.REC.02', 'PACK.ACOG.GDM.2018.REC.03',
    'PACK.ACOG.GDM.2018.DC.01', 'PACK.ACOG.GDM.2018.T.01', 'PACK.ACOG.GDM.2018.T.02',
    'PACK.ACOG.GDM.2018.TX.01', 'PACK.ACOG.GDM.2018.TX.02', 'PACK.ACOG.GDM.2018.TX.03',
    'PACK.ACOG.GDM.2018.RF.01', 'PACK.ACOG.GDM.2018.SEV.01',
  ],
  all_display_ids: [
    'ACOG-GDM-R1', 'ACOG-GDM-R2', 'ACOG-GDM-R3',
    'ACOG-GDM-DC1',
    'ACOG-GDM-T1', 'ACOG-GDM-T2',
    'ACOG-GDM-TX1', 'ACOG-GDM-TX2', 'ACOG-GDM-TX3',
    'ACOG-GDM-RF1',
    'ACOG-GDM-SEV1',
  ],
};
