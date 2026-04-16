import type { SourcePack } from './types';

export const PACK_NAMS_MENO_2022: SourcePack = {
  source_pack_id: 'PACK.NAMS.MENO.2022',
  source_name: 'NAMS 2022 Hormone Therapy Position Statement',
  source_registry_id: 'REG.NAMS.MENO',
  canonical_url: 'https://doi.org/10.1097/GME.0000000000002028',
  publication_year: 2022,
  guideline_body: 'NAMS',

  topic_tags: ['Menopause', 'Hormone Replacement Therapy', 'HRT', 'Vasomotor Symptoms', 'OB/GYN'],
  allowed_decision_scopes: [
    'menopause diagnosis',
    'HRT indications and contraindications',
    'estrogen-only vs combined HRT',
    'vasomotor symptom management',
    'genitourinary syndrome of menopause',
    'HRT timing and duration',
    'non-hormonal alternatives',
  ],
  excluded_decision_scopes: [
    'premature ovarian insufficiency (detailed)',
    'osteoporosis pharmacotherapy (beyond HRT)',
    'breast cancer risk assessment models',
  ],

  recommendations: [
    {
      rec_id: 'PACK.NAMS.MENO.2022.REC.01',
      display_id: 'NAMS-MENO-R1',
      statement: 'Hormone therapy is the most effective treatment for vasomotor symptoms and should be considered for symptomatic women within 10 years of menopause onset or before age 60.',
      normalized_claim: 'HRT is most effective for vasomotor symptoms; initiate within 10 years of menopause or age <60 ("timing hypothesis") for favorable risk-benefit.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Indications', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.NAMS.MENO.2022.REC.02',
      display_id: 'NAMS-MENO-R2',
      statement: 'Women with an intact uterus require a progestogen in addition to estrogen to prevent endometrial hyperplasia and cancer.',
      normalized_claim: 'Intact uterus = combined estrogen + progestogen (EPT). Hysterectomy = estrogen-only (ET) is sufficient and preferred.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Regimen Selection', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.NAMS.MENO.2022.REC.03',
      display_id: 'NAMS-MENO-R3',
      statement: 'Low-dose vaginal estrogen is effective for genitourinary syndrome of menopause (vulvovaginal atrophy) and does not require concomitant progestogen.',
      normalized_claim: 'Low-dose vaginal estrogen for GSM (atrophic vaginitis, dyspareunia, urinary symptoms); minimal systemic absorption, no progestogen needed.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'GSM Management', page_or_location: 'Section 6' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.NAMS.MENO.2022.DC.01',
      display_id: 'NAMS-MENO-DC1',
      name: 'Menopause Diagnosis',
      components: [
        '12 consecutive months of amenorrhea in a woman of appropriate age (typically 45-55) with no other pathologic cause',
        'Average age of menopause: 51 years',
        'FSH >40 mIU/mL supports diagnosis but is not required if clinical criteria met',
        'Perimenopause: irregular menses with vasomotor symptoms, variable cycle length',
      ],
      interpretation: 'Menopause is a clinical diagnosis based on 12 months amenorrhea. Lab confirmation with FSH is optional in typical-age women.',
      normalized_claim: 'Menopause = 12 months amenorrhea in appropriate-age woman. Clinical diagnosis; FSH >40 supportive but not required if age 45-55.',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.NAMS.MENO.2022.T.01',
      display_id: 'NAMS-MENO-T1',
      parameter: 'Age cutoff for HRT initiation',
      value: '60',
      unit: 'years',
      clinical_meaning: 'HRT initiation after age 60 or >10 years post-menopause carries increased cardiovascular and stroke risk; not recommended for primary prevention.',
      normalized_claim: 'HRT should not be initiated in women >60 or >10 years post-menopause due to increased CVD, stroke, and VTE risk.',
      direction: 'below',
      provenance: { section: 'Timing Hypothesis', page_or_location: 'Section 3' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.NAMS.MENO.2022.TX.01',
      display_id: 'NAMS-MENO-TX1',
      action: 'Systemic estrogen therapy for vasomotor symptoms',
      normalized_claim: 'Systemic estrogen (oral CEE 0.3-0.625 mg/day, or transdermal estradiol 0.025-0.05 mg/day) for moderate-severe vasomotor symptoms. Transdermal preferred (lower VTE risk).',
      condition: 'Moderate-severe vasomotor symptoms within 10 years of menopause or age <60',
      drug_details: { drug: 'Estradiol (transdermal)', dose: '0.025-0.05 mg/day', route: 'Transdermal patch' },
      contraindications: ['Breast cancer (current or history)', 'Active VTE or PE', 'Active liver disease', 'Unexplained vaginal bleeding', 'Known thrombophilia'],
      provenance: { section: 'Estrogen Therapy', page_or_location: 'Section 4' },
    },
    {
      step_id: 'PACK.NAMS.MENO.2022.TX.02',
      display_id: 'NAMS-MENO-TX2',
      action: 'Combined estrogen-progestogen for women with intact uterus',
      normalized_claim: 'Add progestogen to estrogen if uterus intact: MPA 2.5 mg/day continuous, or micronized progesterone 100-200 mg/day cyclically or continuously.',
      condition: 'Symptomatic menopausal woman with intact uterus on systemic estrogen',
      drug_details: { drug: 'Micronized progesterone', dose: '100-200 mg/day', route: 'PO' },
      provenance: { section: 'Progestogen Addition', page_or_location: 'Section 4' },
    },
    {
      step_id: 'PACK.NAMS.MENO.2022.TX.03',
      display_id: 'NAMS-MENO-TX3',
      action: 'Non-hormonal alternatives for vasomotor symptoms',
      normalized_claim: 'Non-hormonal options: SSRIs/SNRIs (paroxetine 7.5 mg is FDA-approved for hot flashes), gabapentin, clonidine, fezolinetant (NK3 receptor antagonist).',
      condition: 'Vasomotor symptoms in women with contraindications to HRT or who decline hormones',
      drug_details: { drug: 'Paroxetine (Brisdelle)', dose: '7.5 mg/day', route: 'PO' },
      provenance: { section: 'Non-hormonal Therapy', page_or_location: 'Section 7' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.NAMS.MENO.2022.RF.01',
      display_id: 'NAMS-MENO-RF1',
      finding: 'Postmenopausal vaginal bleeding in a woman on HRT that is unexpected, heavy, or occurs after initial adjustment period',
      implication: 'Must exclude endometrial hyperplasia or cancer. Breakthrough bleeding is common in first 6 months of combined HRT but should be evaluated if persistent.',
      action: 'TVUS to assess endometrial thickness; EMB if endometrial stripe >4 mm or if bleeding persists beyond 6 months on HRT.',
      urgency: 'urgent',
      provenance: { section: 'Monitoring on HRT', page_or_location: 'Section 5' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.NAMS.MENO.2022.SEV.01',
      display_id: 'NAMS-MENO-SEV1',
      level: 'Contraindications to systemic hormone therapy',
      criteria: [
        'Current or history of breast cancer',
        'Active or recent VTE (DVT, PE)',
        'Active arterial thromboembolic disease (stroke, MI)',
        'Active liver disease or hepatic dysfunction',
        'Unexplained vaginal bleeding (must be evaluated first)',
        'Known or suspected pregnancy',
      ],
      management_implications:
        'Systemic HRT contraindicated. Use non-hormonal alternatives (SSRIs/SNRIs, gabapentin, fezolinetant). Low-dose vaginal estrogen may still be considered for GSM in breast cancer survivors in consultation with oncology. Ospemifene (SERM) is an alternative for dyspareunia.',
      provenance: { section: 'Contraindications', page_or_location: 'Section 8' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering menopause/HRT: timing hypothesis, ET vs EPT, GSM, non-hormonal alternatives, contraindications.',

  all_item_ids: [
    'PACK.NAMS.MENO.2022.REC.01', 'PACK.NAMS.MENO.2022.REC.02', 'PACK.NAMS.MENO.2022.REC.03',
    'PACK.NAMS.MENO.2022.DC.01', 'PACK.NAMS.MENO.2022.T.01',
    'PACK.NAMS.MENO.2022.TX.01', 'PACK.NAMS.MENO.2022.TX.02', 'PACK.NAMS.MENO.2022.TX.03',
    'PACK.NAMS.MENO.2022.RF.01', 'PACK.NAMS.MENO.2022.SEV.01',
  ],
  all_display_ids: [
    'NAMS-MENO-R1', 'NAMS-MENO-R2', 'NAMS-MENO-R3',
    'NAMS-MENO-DC1',
    'NAMS-MENO-T1',
    'NAMS-MENO-TX1', 'NAMS-MENO-TX2', 'NAMS-MENO-TX3',
    'NAMS-MENO-RF1',
    'NAMS-MENO-SEV1',
  ],
};
