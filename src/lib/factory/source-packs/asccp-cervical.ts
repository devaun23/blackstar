import type { SourcePack } from './types';

export const PACK_ASCCP_CERV_2019: SourcePack = {
  source_pack_id: 'PACK.ASCCP.CERV.2019',
  source_name: 'ASCCP 2019 Risk-Based Management Consensus Guidelines for Abnormal Cervical Cancer Screening Tests',
  source_registry_id: 'REG.ASCCP.CERV',
  canonical_url: 'https://doi.org/10.1097/LGT.0000000000000525',
  publication_year: 2019,
  guideline_body: 'ASCCP',

  topic_tags: ['Cervical Cancer Screening', 'Pap Smear', 'HPV', 'Colposcopy', 'LEEP', 'OB/GYN'],
  allowed_decision_scopes: [
    'cervical cancer screening initiation and intervals',
    'Pap smear result management',
    'HPV co-testing interpretation',
    'colposcopy indications',
    'LEEP and excisional procedures',
    'CIN management',
    'screening in special populations',
  ],
  excluded_decision_scopes: [
    'invasive cervical cancer staging and treatment',
    'HPV vaccination recommendations',
    'cervical cancer during pregnancy (detailed management)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ASCCP.CERV.2019.REC.01',
      display_id: 'ASCCP-CERV-R1',
      statement: 'Cervical cancer screening should begin at age 21 regardless of sexual activity onset. Screening before age 21 is not recommended.',
      normalized_claim: 'Start cervical cancer screening at age 21 with Pap cytology alone; do not screen before age 21.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Screening Initiation', page_or_location: 'Section 2' },
    },
    {
      rec_id: 'PACK.ASCCP.CERV.2019.REC.02',
      display_id: 'ASCCP-CERV-R2',
      statement: 'Ages 21-29: Pap cytology alone every 3 years. HPV testing is not recommended in this age group due to high transient HPV rates.',
      normalized_claim: 'Ages 21-29: Pap alone q3 years. No HPV testing (high transient infection rate would lead to overtreatment).',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Screening Strategy', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ASCCP.CERV.2019.REC.03',
      display_id: 'ASCCP-CERV-R3',
      statement: 'Ages 30-65: Pap + HPV co-testing every 5 years (preferred), Pap alone every 3 years, or primary HPV testing every 5 years.',
      normalized_claim: 'Ages 30-65: co-testing (Pap + HPV) q5y preferred; Pap alone q3y or HPV primary q5y acceptable alternatives.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Screening Strategy', page_or_location: 'Section 3' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ASCCP.CERV.2019.DC.01',
      display_id: 'ASCCP-CERV-DC1',
      name: 'Abnormal Pap Cytology Classification and Management',
      components: [
        'ASCUS (atypical squamous cells of undetermined significance): reflex HPV testing; if HPV+, colposcopy; if HPV-, repeat co-test in 3 years',
        'LSIL (low-grade squamous intraepithelial lesion): colposcopy for ages >=25; repeat Pap in 1 year for ages 21-24',
        'HSIL (high-grade squamous intraepithelial lesion): immediate colposcopy with biopsy; LEEP acceptable for non-pregnant women >=25',
        'ASC-H (atypical squamous cells, cannot exclude HSIL): colposcopy',
        'AGC (atypical glandular cells): colposcopy + endocervical curettage + endometrial biopsy if >=35 or abnormal bleeding',
      ],
      interpretation: 'Management escalates from surveillance to colposcopy to excision based on cytologic severity and HPV status.',
      normalized_claim: 'ASCUS: reflex HPV. LSIL: colposcopy (>=25). HSIL: colposcopy +/- LEEP. ASC-H: colposcopy. AGC: colposcopy + ECC + EMB if >=35.',
      provenance: { section: 'Cytology Management', page_or_location: 'Section 4' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ASCCP.CERV.2019.T.01',
      display_id: 'ASCCP-CERV-T1',
      parameter: 'Age to begin cervical cancer screening',
      value: '21',
      unit: 'years',
      clinical_meaning: 'No screening before age 21; cervical cancer is exceedingly rare in adolescents and most HPV infections clear spontaneously.',
      normalized_claim: 'Cervical cancer screening starts at 21; no screening before 21 regardless of sexual history.',
      direction: 'above',
      provenance: { section: 'Screening Initiation', page_or_location: 'Section 2' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ASCCP.CERV.2019.TX.01',
      display_id: 'ASCCP-CERV-TX1',
      action: 'Colposcopy with biopsy for abnormal screening',
      normalized_claim: 'Colposcopy: visualize cervix with acetic acid, biopsy acetowhite lesions, endocervical curettage if transformation zone not fully visualized.',
      timing: 'Within 4 weeks of abnormal result meeting colposcopy criteria',
      condition: 'HSIL, ASC-H, persistent ASCUS/HPV+, LSIL in women >=25',
      provenance: { section: 'Colposcopy', page_or_location: 'Section 5' },
    },
    {
      step_id: 'PACK.ASCCP.CERV.2019.TX.02',
      display_id: 'ASCCP-CERV-TX2',
      action: 'LEEP excision for CIN 2/3 (HSIL on histology)',
      normalized_claim: 'LEEP (loop electrosurgical excision procedure) is standard treatment for CIN 2-3; removes transformation zone for diagnosis and treatment.',
      condition: 'Histologically confirmed CIN 2 or CIN 3, non-pregnant',
      contraindications: ['Pregnancy (defer until postpartum)', 'Invasive cancer on biopsy (requires staging workup)'],
      provenance: { section: 'Excisional Treatment', page_or_location: 'Section 6' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ASCCP.CERV.2019.RF.01',
      display_id: 'ASCCP-CERV-RF1',
      finding: 'Cervical mass or visible lesion on speculum exam with contact bleeding, regardless of screening history',
      implication: 'May represent invasive cervical cancer. Pap smear alone is insufficient — biopsy of visible lesion is required.',
      action: 'Direct biopsy of visible lesion (not just Pap). Refer to gynecologic oncology if biopsy shows invasive cancer.',
      urgency: 'urgent',
      provenance: { section: 'Visible Lesions', page_or_location: 'Section 7' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ASCCP.CERV.2019.SEV.01',
      display_id: 'ASCCP-CERV-SEV1',
      level: 'CIN 3 / carcinoma in situ',
      criteria: [
        'Full-thickness dysplasia of cervical epithelium on biopsy',
        'No stromal invasion (distinguishes from invasive cancer)',
        'Often associated with HSIL cytology and high-risk HPV',
      ],
      management_implications:
        'LEEP or cone biopsy for definitive treatment and to exclude microinvasion. If margins positive, repeat excision or close surveillance. Hysterectomy acceptable if childbearing complete. Long-term surveillance: co-testing at 12 and 24 months post-treatment, then every 3 years for 25 years.',
      provenance: { section: 'CIN 3 Management', page_or_location: 'Section 6' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering cervical cancer screening: age-based strategy, Pap/HPV management algorithms, colposcopy, LEEP for CIN 2-3.',

  all_item_ids: [
    'PACK.ASCCP.CERV.2019.REC.01', 'PACK.ASCCP.CERV.2019.REC.02', 'PACK.ASCCP.CERV.2019.REC.03',
    'PACK.ASCCP.CERV.2019.DC.01', 'PACK.ASCCP.CERV.2019.T.01',
    'PACK.ASCCP.CERV.2019.TX.01', 'PACK.ASCCP.CERV.2019.TX.02',
    'PACK.ASCCP.CERV.2019.RF.01', 'PACK.ASCCP.CERV.2019.SEV.01',
  ],
  all_display_ids: [
    'ASCCP-CERV-R1', 'ASCCP-CERV-R2', 'ASCCP-CERV-R3',
    'ASCCP-CERV-DC1',
    'ASCCP-CERV-T1',
    'ASCCP-CERV-TX1', 'ASCCP-CERV-TX2',
    'ASCCP-CERV-RF1',
    'ASCCP-CERV-SEV1',
  ],
};
