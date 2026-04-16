import type { SourcePack } from './types';

export const PACK_ACOG_AUB_2021: SourcePack = {
  source_pack_id: 'PACK.ACOG.AUB.2021',
  source_name: 'ACOG Practice Bulletin No. 128 (Reaffirmed 2021): Diagnosis of Abnormal Uterine Bleeding in Reproductive-Aged Women',
  source_registry_id: 'REG.ACOG.AUB',
  canonical_url: 'https://doi.org/10.1097/AOG.0b013e318262e320',
  publication_year: 2021,
  guideline_body: 'ACOG',

  topic_tags: ['Abnormal Uterine Bleeding', 'AUB', 'PALM-COEIN', 'Endometrial Biopsy', 'OB/GYN'],
  allowed_decision_scopes: [
    'AUB classification (PALM-COEIN)',
    'AUB initial workup',
    'endometrial biopsy indications',
    'hormonal management of AUB',
    'acute uterine bleeding management',
    'structural cause evaluation',
  ],
  excluded_decision_scopes: [
    'endometrial cancer staging and treatment',
    'uterine fibroid embolization (interventional details)',
    'postmenopausal bleeding workup (separate guideline)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.AUB.2021.REC.01',
      display_id: 'ACOG-AUB-R1',
      statement: 'All reproductive-aged women presenting with AUB should have pregnancy excluded as the first step in evaluation.',
      normalized_claim: 'First step in AUB workup: pregnancy test (urine or serum hCG). Then CBC, TSH, TVUS.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Initial Evaluation', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ACOG.AUB.2021.REC.02',
      display_id: 'ACOG-AUB-R2',
      statement: 'Endometrial biopsy should be performed in women >=45 years with AUB or in women <45 with risk factors for endometrial hyperplasia/cancer (obesity, chronic anovulation, PCOS, tamoxifen use).',
      normalized_claim: 'EMB indicated for AUB if age >=45, or <45 with risk factors (obesity, anovulation, PCOS, tamoxifen, unopposed estrogen).',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Endometrial Biopsy', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.ACOG.AUB.2021.REC.03',
      display_id: 'ACOG-AUB-R3',
      statement: 'Levonorgestrel IUD is the most effective medical treatment for heavy menstrual bleeding and should be considered first-line for AUB-O and AUB without structural pathology.',
      normalized_claim: 'LNG-IUD is first-line medical treatment for heavy menstrual bleeding; reduces blood loss by ~90%.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.AUB.2021.DC.01',
      display_id: 'ACOG-AUB-DC1',
      name: 'PALM-COEIN Classification of AUB',
      components: [
        'PALM (structural): Polyp, Adenomyosis, Leiomyoma, Malignancy/hyperplasia',
        'COEIN (non-structural): Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not yet classified',
        'Diagnosis requires TVUS to evaluate structural causes',
        'Labs: pregnancy test, CBC, TSH, +/- coagulation studies, prolactin',
      ],
      interpretation: 'PALM-COEIN provides systematic classification. Multiple etiologies may coexist.',
      normalized_claim: 'PALM-COEIN: structural (Polyp, Adenomyosis, Leiomyoma, Malignancy) + non-structural (Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not classified).',
      provenance: { section: 'Classification', page_or_location: 'Section 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.AUB.2021.T.01',
      display_id: 'ACOG-AUB-T1',
      parameter: 'Age for endometrial biopsy in AUB',
      value: '45',
      unit: 'years',
      clinical_meaning: 'Women >=45 with AUB require endometrial biopsy to exclude hyperplasia or cancer. Women <45 need EMB only if risk factors present.',
      normalized_claim: 'Age >=45 with AUB = mandatory endometrial biopsy. <45 = EMB if risk factors (obesity, anovulation, PCOS).',
      direction: 'above',
      provenance: { section: 'Endometrial Biopsy Indications', page_or_location: 'Section 4' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.AUB.2021.TX.01',
      display_id: 'ACOG-AUB-TX1',
      action: 'Hormonal therapy for chronic AUB without structural pathology',
      normalized_claim: 'Medical options for AUB: LNG-IUD (first-line), combined OCPs, cyclic progestins (medroxyprogesterone 10 mg x10-14 days/month), tranexamic acid during menses.',
      condition: 'Chronic AUB without structural cause or after structural cause treated',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
    {
      step_id: 'PACK.ACOG.AUB.2021.TX.02',
      display_id: 'ACOG-AUB-TX2',
      action: 'Acute heavy uterine bleeding management',
      normalized_claim: 'Acute AUB: IV conjugated estrogen 25 mg q4-6h (max 6 doses) OR high-dose combined OCP (monophasic, 3x/day tapered). D&C if medical management fails or hemodynamically unstable.',
      timing: 'Immediate upon presentation',
      condition: 'Acute heavy uterine bleeding with hemodynamic compromise or Hgb <7',
      drug_details: { drug: 'Conjugated estrogen', dose: '25 mg IV q4-6h', route: 'IV' },
      escalation: 'D&C (dilation and curettage) if medical therapy fails',
      provenance: { section: 'Acute Management', page_or_location: 'Section 6' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.AUB.2021.RF.01',
      display_id: 'ACOG-AUB-RF1',
      finding: 'Postmenopausal bleeding: any vaginal bleeding occurring after 12 months of amenorrhea in a menopausal woman',
      implication: 'Must be considered endometrial cancer until proven otherwise. ~10% of postmenopausal bleeding is caused by endometrial cancer.',
      action: 'TVUS to measure endometrial thickness (>4 mm requires EMB) or proceed directly to EMB. Refer to gynecologic oncology if cancer confirmed.',
      urgency: 'urgent',
      provenance: { section: 'Postmenopausal Bleeding', page_or_location: 'Section 7' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.AUB.2021.SEV.01',
      display_id: 'ACOG-AUB-SEV1',
      level: 'Acute life-threatening uterine hemorrhage',
      criteria: [
        'Active heavy vaginal bleeding',
        'Hemodynamic instability (tachycardia, hypotension)',
        'Hemoglobin <7 g/dL or rapidly falling',
        'Ongoing bleeding despite initial hormonal therapy',
      ],
      management_implications:
        'Resuscitate (IV access, crystalloid, transfuse PRBCs). IV estrogen or high-dose OCPs. Uterine tamponade (Foley balloon). Emergent D&C if medical management fails. TXA 1g IV as adjunct. Consider interventional radiology or hysterectomy for refractory cases.',
      provenance: { section: 'Acute Hemorrhage', page_or_location: 'Section 6' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering AUB: PALM-COEIN classification, EMB indications, hormonal management, acute hemorrhage.',

  all_item_ids: [
    'PACK.ACOG.AUB.2021.REC.01', 'PACK.ACOG.AUB.2021.REC.02', 'PACK.ACOG.AUB.2021.REC.03',
    'PACK.ACOG.AUB.2021.DC.01', 'PACK.ACOG.AUB.2021.T.01',
    'PACK.ACOG.AUB.2021.TX.01', 'PACK.ACOG.AUB.2021.TX.02',
    'PACK.ACOG.AUB.2021.RF.01', 'PACK.ACOG.AUB.2021.SEV.01',
  ],
  all_display_ids: [
    'ACOG-AUB-R1', 'ACOG-AUB-R2', 'ACOG-AUB-R3',
    'ACOG-AUB-DC1',
    'ACOG-AUB-T1',
    'ACOG-AUB-TX1', 'ACOG-AUB-TX2',
    'ACOG-AUB-RF1',
    'ACOG-AUB-SEV1',
  ],
};
