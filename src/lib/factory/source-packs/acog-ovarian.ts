import type { SourcePack } from './types';

export const PACK_ACOG_OVAR_2016: SourcePack = {
  source_pack_id: 'PACK.ACOG.OVAR.2016',
  source_name: 'ACOG Practice Bulletin No. 174: Evaluation and Management of Adnexal Masses',
  source_registry_id: 'REG.ACOG.OVAR',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000001768',
  publication_year: 2016,
  guideline_body: 'ACOG',

  topic_tags: ['Ovarian Mass', 'Ovarian Cyst', 'Ovarian Torsion', 'CA-125', 'OB/GYN'],
  allowed_decision_scopes: [
    'ovarian mass evaluation',
    'simple cyst management',
    'complex mass workup',
    'CA-125 interpretation',
    'ovarian torsion diagnosis and management',
    'surgical vs observation decision',
    'malignancy risk assessment',
  ],
  excluded_decision_scopes: [
    'ovarian cancer staging and chemotherapy',
    'borderline ovarian tumors (detailed management)',
    'fertility preservation in ovarian malignancy',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.OVAR.2016.REC.01',
      display_id: 'ACOG-OVAR-R1',
      statement: 'Transvaginal ultrasound is the preferred initial imaging modality for evaluating adnexal masses.',
      normalized_claim: 'TVUS is first-line imaging for adnexal masses; characterizes size, complexity (simple vs solid vs mixed), and vascularity.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Imaging', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ACOG.OVAR.2016.REC.02',
      display_id: 'ACOG-OVAR-R2',
      statement: 'Simple ovarian cysts <5 cm in premenopausal women are almost universally benign and can be observed without intervention.',
      normalized_claim: 'Simple cyst <5 cm in premenopausal woman: observe, repeat US in 6-8 weeks. Most resolve spontaneously. Surgery not indicated.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Simple Cyst Management', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.ACOG.OVAR.2016.REC.03',
      display_id: 'ACOG-OVAR-R3',
      statement: 'CA-125 should be obtained for postmenopausal women with adnexal masses. In premenopausal women, CA-125 has limited specificity and should be interpreted with caution.',
      normalized_claim: 'CA-125 useful in postmenopausal adnexal mass evaluation; limited in premenopausal (elevated by endometriosis, fibroids, PID, pregnancy).',
      strength: 'conditional',
      evidence_quality: 'moderate',
      provenance: { section: 'Tumor Markers', page_or_location: 'Section 3' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.OVAR.2016.DC.01',
      display_id: 'ACOG-OVAR-DC1',
      name: 'Ultrasound Features Suggesting Malignancy',
      components: [
        'Solid components within a cystic mass',
        'Thick septations (>2-3 mm)',
        'Papillary projections or excrescences',
        'Internal vascularity on Doppler (low-resistance flow)',
        'Ascites',
        'Bilateral masses',
        'Size >10 cm',
      ],
      interpretation: 'Presence of solid components, thick septations, papillary projections, or ascites increases suspicion for malignancy and warrants surgical evaluation.',
      normalized_claim: 'Concerning US features: solid components, thick septations >3 mm, papillary projections, ascites, bilateral masses, size >10 cm suggest malignancy.',
      provenance: { section: 'Malignancy Risk Assessment', page_or_location: 'Section 3' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.OVAR.2016.T.01',
      display_id: 'ACOG-OVAR-T1',
      parameter: 'Simple cyst size for observation in premenopausal women',
      value: '5',
      unit: 'cm',
      clinical_meaning: 'Simple cysts <5 cm in premenopausal women can be safely observed. Cysts >5-7 cm or with complex features warrant further evaluation.',
      normalized_claim: 'Simple ovarian cyst <5 cm premenopausal: observe. >=5-7 cm or complex features: surgical evaluation or advanced imaging.',
      direction: 'below',
      provenance: { section: 'Management Thresholds', page_or_location: 'Section 4' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.OVAR.2016.TX.01',
      display_id: 'ACOG-OVAR-TX1',
      action: 'Observation with serial ultrasound for benign-appearing cysts',
      normalized_claim: 'Simple cyst <5 cm: repeat TVUS in 6-8 weeks. If resolved, no further follow-up. If persistent but unchanged, annual surveillance.',
      condition: 'Simple cyst <5 cm in premenopausal woman',
      provenance: { section: 'Conservative Management', page_or_location: 'Section 4' },
    },
    {
      step_id: 'PACK.ACOG.OVAR.2016.TX.02',
      display_id: 'ACOG-OVAR-TX2',
      action: 'Surgical evaluation for complex or suspicious adnexal masses',
      normalized_claim: 'Complex or suspicious mass: laparoscopic evaluation. If malignancy suspected (high CA-125, complex US features, ascites), refer to gynecologic oncologist for staging surgery.',
      condition: 'Complex adnexal mass with concerning features or persistent/growing mass',
      provenance: { section: 'Surgical Management', page_or_location: 'Section 5' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.OVAR.2016.RF.01',
      display_id: 'ACOG-OVAR-RF1',
      finding: 'Ovarian torsion: acute onset severe unilateral pelvic pain, nausea/vomiting, tender adnexal mass, absent or diminished Doppler flow',
      implication: 'Surgical emergency. Ovarian necrosis occurs within 6-12 hours without intervention.',
      action: 'Emergent laparoscopy for detorsion. Assess ovarian viability; detorse and preserve if viable (even if appears dusky). Oophorectomy only if frankly necrotic.',
      urgency: 'immediate',
      provenance: { section: 'Ovarian Torsion', page_or_location: 'Section 6' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.OVAR.2016.SEV.01',
      display_id: 'ACOG-OVAR-SEV1',
      level: 'High-risk adnexal mass (suspected malignancy)',
      criteria: [
        'Postmenopausal with complex or solid adnexal mass',
        'CA-125 >200 U/mL (postmenopausal) or >200 with ascites (premenopausal)',
        'Solid components with internal vascularity',
        'Ascites or peritoneal nodularity',
        'Fixed, immobile mass on exam',
      ],
      management_implications:
        'Refer to gynecologic oncologist for surgical staging. Do not perform simple cystectomy — risk of cancer cell spillage. Full staging includes TAH/BSO, omentectomy, peritoneal biopsies, pelvic/para-aortic lymph node sampling. CT chest/abdomen/pelvis for preoperative planning.',
      provenance: { section: 'Malignancy Management', page_or_location: 'Section 5' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering ovarian masses: TVUS evaluation, simple cyst observation, malignancy features, CA-125, torsion emergency.',

  all_item_ids: [
    'PACK.ACOG.OVAR.2016.REC.01', 'PACK.ACOG.OVAR.2016.REC.02', 'PACK.ACOG.OVAR.2016.REC.03',
    'PACK.ACOG.OVAR.2016.DC.01', 'PACK.ACOG.OVAR.2016.T.01',
    'PACK.ACOG.OVAR.2016.TX.01', 'PACK.ACOG.OVAR.2016.TX.02',
    'PACK.ACOG.OVAR.2016.RF.01', 'PACK.ACOG.OVAR.2016.SEV.01',
  ],
  all_display_ids: [
    'ACOG-OVAR-R1', 'ACOG-OVAR-R2', 'ACOG-OVAR-R3',
    'ACOG-OVAR-DC1',
    'ACOG-OVAR-T1',
    'ACOG-OVAR-TX1', 'ACOG-OVAR-TX2',
    'ACOG-OVAR-RF1',
    'ACOG-OVAR-SEV1',
  ],
};
