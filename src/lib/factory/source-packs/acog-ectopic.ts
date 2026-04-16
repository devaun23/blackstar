import type { SourcePack } from './types';

export const PACK_ACOG_ECTOP_2018: SourcePack = {
  source_pack_id: 'PACK.ACOG.ECTOP.2018',
  source_name: 'ACOG Practice Bulletin No. 193: Tubal Ectopic Pregnancy',
  source_registry_id: 'REG.ACOG.ECTOP',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000002560',
  publication_year: 2018,
  guideline_body: 'ACOG',

  topic_tags: ['Ectopic Pregnancy', 'Methotrexate', 'Salpingectomy', 'OB/GYN'],
  allowed_decision_scopes: [
    'ectopic pregnancy diagnosis',
    'methotrexate eligibility',
    'surgical management of ectopic',
    'ruptured ectopic emergency management',
    'beta-hCG monitoring',
    'expectant management criteria',
  ],
  excluded_decision_scopes: [
    'heterotopic pregnancy in IVF',
    'interstitial or cervical ectopic (rare locations)',
    'chronic ectopic pregnancy',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.ECTOP.2018.REC.01',
      display_id: 'ACOG-ECTOP-R1',
      statement: 'Transvaginal ultrasound is the primary imaging modality for diagnosing ectopic pregnancy. An empty uterus with beta-hCG above the discriminatory zone (1500-3500 mIU/mL) suggests ectopic.',
      normalized_claim: 'Empty uterus on TVUS with beta-hCG above discriminatory zone (1500-3500) is presumptive ectopic pregnancy.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ACOG.ECTOP.2018.REC.02',
      display_id: 'ACOG-ECTOP-R2',
      statement: 'Methotrexate is an effective non-surgical treatment for hemodynamically stable patients with unruptured ectopic pregnancy meeting selection criteria.',
      normalized_claim: 'Methotrexate is first-line medical treatment for unruptured ectopic: hemodynamically stable, no fetal cardiac activity, beta-hCG <5000, mass <3.5 cm.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
    {
      rec_id: 'PACK.ACOG.ECTOP.2018.REC.03',
      display_id: 'ACOG-ECTOP-R3',
      statement: 'Salpingectomy is the surgical treatment of choice for ectopic pregnancy in patients who have completed childbearing or have a significantly damaged tube.',
      normalized_claim: 'Salpingectomy preferred over salpingostomy when contralateral tube is healthy or fertility not desired.',
      strength: 'conditional',
      evidence_quality: 'moderate',
      provenance: { section: 'Surgical Management', page_or_location: 'Section 6' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.ECTOP.2018.DC.01',
      display_id: 'ACOG-ECTOP-DC1',
      name: 'Ectopic Pregnancy Diagnostic Algorithm',
      components: [
        'Positive pregnancy test (urine or serum beta-hCG)',
        'No intrauterine pregnancy on transvaginal ultrasound',
        'Beta-hCG above discriminatory zone (1500-3500 mIU/mL)',
        'Abnormal beta-hCG rise (<53% in 48 hours for early pregnancy)',
        'Adnexal mass or extraovarian mass with tubal ring sign',
      ],
      interpretation: 'Ectopic pregnancy confirmed by extrauterine gestational sac/mass with positive hCG, or presumed when IUP absent above discriminatory zone.',
      normalized_claim: 'Ectopic diagnosis: positive hCG + no IUP on TVUS above discriminatory zone + adnexal mass or abnormal hCG trend.',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 3' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.ECTOP.2018.T.01',
      display_id: 'ACOG-ECTOP-T1',
      parameter: 'Beta-hCG for methotrexate eligibility',
      value: '5000',
      unit: 'mIU/mL',
      clinical_meaning: 'Beta-hCG <5000 mIU/mL is associated with higher methotrexate success rates. Higher levels predict treatment failure.',
      normalized_claim: 'Methotrexate success rate highest when beta-hCG <5000 mIU/mL; success drops significantly above this level.',
      direction: 'below',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
    {
      threshold_id: 'PACK.ACOG.ECTOP.2018.T.02',
      display_id: 'ACOG-ECTOP-T2',
      parameter: 'Ectopic mass size for methotrexate',
      value: '3.5',
      unit: 'cm',
      clinical_meaning: 'Ectopic mass <3.5 cm without fetal cardiac activity is favorable for methotrexate treatment.',
      normalized_claim: 'Ectopic mass <3.5 cm is criterion for methotrexate eligibility; larger masses have higher failure/rupture rates.',
      direction: 'below',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.ECTOP.2018.TX.01',
      display_id: 'ACOG-ECTOP-TX1',
      action: 'Single-dose methotrexate for ectopic pregnancy',
      normalized_claim: 'Methotrexate 50 mg/m2 IM single dose; recheck beta-hCG days 4 and 7; >=15% decline between days 4-7 indicates adequate response.',
      timing: 'Day 1 after meeting eligibility criteria',
      condition: 'Unruptured ectopic, hemodynamically stable, beta-hCG <5000, mass <3.5 cm, no fetal cardiac activity',
      drug_details: { drug: 'Methotrexate', dose: '50 mg/m2', route: 'IM' },
      contraindications: ['Hepatic dysfunction', 'Renal insufficiency', 'Immunodeficiency', 'Active pulmonary disease', 'Breastfeeding'],
      escalation: 'Second dose if <15% decline in beta-hCG between days 4-7',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
    {
      step_id: 'PACK.ACOG.ECTOP.2018.TX.02',
      display_id: 'ACOG-ECTOP-TX2',
      action: 'Surgical management: laparoscopic salpingectomy',
      normalized_claim: 'Laparoscopic salpingectomy is definitive surgical treatment for ectopic pregnancy; preferred when tube is damaged or fertility not desired.',
      condition: 'Ruptured ectopic, methotrexate failure, contraindications to methotrexate, or patient preference',
      contraindications: ['Hemodynamic instability requiring laparotomy instead of laparoscopy'],
      provenance: { section: 'Surgical Management', page_or_location: 'Section 6' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.ECTOP.2018.RF.01',
      display_id: 'ACOG-ECTOP-RF1',
      finding: 'Ruptured ectopic pregnancy: acute abdomen, hypotension, tachycardia, peritoneal signs, positive FAST or culdocentesis',
      implication: 'Life-threatening hemorrhagic shock from hemoperitoneum. Leading cause of first-trimester maternal death.',
      action: 'Immediate surgical intervention (laparoscopy or laparotomy), aggressive fluid resuscitation, type and crossmatch.',
      urgency: 'immediate',
      provenance: { section: 'Ruptured Ectopic', page_or_location: 'Section 7' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.ECTOP.2018.SEV.01',
      display_id: 'ACOG-ECTOP-SEV1',
      level: 'Ruptured ectopic pregnancy',
      criteria: [
        'Signs of peritoneal irritation (rebound, guarding)',
        'Hemodynamic instability (tachycardia, hypotension)',
        'Free fluid in pelvis/abdomen on ultrasound',
        'Positive pregnancy test with acute abdominal pain',
      ],
      management_implications:
        'Surgical emergency. Proceed directly to OR without delay for imaging or lab confirmation. Laparotomy if hemodynamically unstable, laparoscopy if stable enough. Massive transfusion protocol as needed.',
      provenance: { section: 'Ruptured Ectopic', page_or_location: 'Section 7' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering ectopic pregnancy: diagnosis (hCG + TVUS), methotrexate criteria, surgical options, ruptured ectopic emergency.',

  all_item_ids: [
    'PACK.ACOG.ECTOP.2018.REC.01', 'PACK.ACOG.ECTOP.2018.REC.02', 'PACK.ACOG.ECTOP.2018.REC.03',
    'PACK.ACOG.ECTOP.2018.DC.01', 'PACK.ACOG.ECTOP.2018.T.01', 'PACK.ACOG.ECTOP.2018.T.02',
    'PACK.ACOG.ECTOP.2018.TX.01', 'PACK.ACOG.ECTOP.2018.TX.02', 'PACK.ACOG.ECTOP.2018.RF.01',
    'PACK.ACOG.ECTOP.2018.SEV.01',
  ],
  all_display_ids: [
    'ACOG-ECTOP-R1', 'ACOG-ECTOP-R2', 'ACOG-ECTOP-R3',
    'ACOG-ECTOP-DC1',
    'ACOG-ECTOP-T1', 'ACOG-ECTOP-T2',
    'ACOG-ECTOP-TX1', 'ACOG-ECTOP-TX2',
    'ACOG-ECTOP-RF1',
    'ACOG-ECTOP-SEV1',
  ],
};
