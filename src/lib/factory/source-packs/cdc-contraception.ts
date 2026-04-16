import type { SourcePack } from './types';

export const PACK_CDC_CONTRA_2024: SourcePack = {
  source_pack_id: 'PACK.CDC.CONTRA.2024',
  source_name: 'US Medical Eligibility Criteria for Contraceptive Use (US MEC) 2024 and Selected Practice Recommendations',
  source_registry_id: 'REG.CDC.CONTRA',
  canonical_url: 'https://www.cdc.gov/reproductivehealth/contraception/mmwr/mec/summary.html',
  publication_year: 2024,
  guideline_body: 'CDC',

  topic_tags: ['Contraception', 'IUD', 'OCP', 'Emergency Contraception', 'US MEC', 'OB/GYN'],
  allowed_decision_scopes: [
    'contraceptive method selection',
    'US MEC category interpretation',
    'combined OCP contraindications',
    'LARC counseling',
    'emergency contraception',
    'postpartum contraception timing',
    'contraception in medical conditions',
  ],
  excluded_decision_scopes: [
    'infertility evaluation and treatment',
    'permanent sterilization counseling',
    'natural family planning methods (detailed)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.CDC.CONTRA.2024.REC.01',
      display_id: 'CDC-CONTRA-R1',
      statement: 'Long-acting reversible contraception (LARC) — IUDs and the etonogestrel implant — should be offered as first-line options to all women, including nulliparous women and adolescents.',
      normalized_claim: 'LARC (IUD, implant) is first-line contraception: >99% efficacy, no adherence requirement, safe in nulliparous women and adolescents.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'LARC Recommendations', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.CDC.CONTRA.2024.REC.02',
      display_id: 'CDC-CONTRA-R2',
      statement: 'Combined hormonal contraceptives (CHC) are US MEC Category 4 (contraindicated) in women with migraine with aura at any age due to stroke risk.',
      normalized_claim: 'CHC absolutely contraindicated (MEC 4) in migraine with aura due to increased ischemic stroke risk.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'US MEC', page_or_location: 'CHC Section' },
    },
    {
      rec_id: 'PACK.CDC.CONTRA.2024.REC.03',
      display_id: 'CDC-CONTRA-R3',
      statement: 'The copper IUD is the most effective form of emergency contraception and can be inserted up to 5 days after unprotected intercourse.',
      normalized_claim: 'Copper IUD is most effective EC (>99%); can be placed up to 5 days post-unprotected intercourse and provides ongoing contraception.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Emergency Contraception', page_or_location: 'Section 8' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.CDC.CONTRA.2024.DC.01',
      display_id: 'CDC-CONTRA-DC1',
      name: 'US MEC Categories for Contraceptive Use',
      components: [
        'Category 1: No restriction — method can be used in any circumstance',
        'Category 2: Advantages generally outweigh risks — method generally can be used',
        'Category 3: Risks usually outweigh advantages — method not usually recommended unless other methods unavailable',
        'Category 4: Unacceptable health risk — method should not be used',
      ],
      interpretation: 'Categories 1-2 allow use; Category 3 requires clinical judgment; Category 4 is an absolute contraindication.',
      normalized_claim: 'US MEC: Cat 1 = no restriction, Cat 2 = generally use, Cat 3 = risks outweigh benefits, Cat 4 = contraindicated.',
      provenance: { section: 'MEC Framework', page_or_location: 'Section 1' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.CDC.CONTRA.2024.T.01',
      display_id: 'CDC-CONTRA-T1',
      parameter: 'Age for CHC contraindication in smokers',
      value: '35',
      unit: 'years',
      clinical_meaning: 'CHC is MEC Category 4 in women >=35 who smoke >=15 cigarettes/day (MEC 3 if <15/day). Smoking + CHC dramatically increases VTE and MI risk.',
      normalized_claim: 'CHC contraindicated (MEC 4) in smokers >=35 years old (>=15 cig/day); MEC 3 if <15 cig/day.',
      direction: 'above',
      provenance: { section: 'Smoking and CHC', page_or_location: 'CHC Section' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.CDC.CONTRA.2024.TX.01',
      display_id: 'CDC-CONTRA-TX1',
      action: 'Ulipristal acetate for emergency contraception',
      normalized_claim: 'Ulipristal 30 mg PO x1 within 120 hours (5 days) of unprotected intercourse; most effective oral EC. Delays ovulation even after LH surge begins.',
      timing: 'Within 120 hours of unprotected intercourse',
      condition: 'Request for emergency contraception, oral route preferred',
      drug_details: { drug: 'Ulipristal acetate (ella)', dose: '30 mg', route: 'PO' },
      contraindications: ['Known or suspected pregnancy', 'Do not use with hormonal contraceptives for 5 days after'],
      provenance: { section: 'Emergency Contraception', page_or_location: 'Section 8' },
    },
    {
      step_id: 'PACK.CDC.CONTRA.2024.TX.02',
      display_id: 'CDC-CONTRA-TX2',
      action: 'Levonorgestrel emergency contraception',
      normalized_claim: 'Levonorgestrel 1.5 mg PO x1 (Plan B) within 72 hours; efficacy decreases with time and is reduced in women >75 kg.',
      timing: 'Within 72 hours of unprotected intercourse (up to 120h with reduced efficacy)',
      condition: 'Emergency contraception needed, over-the-counter access',
      drug_details: { drug: 'Levonorgestrel', dose: '1.5 mg', route: 'PO' },
      provenance: { section: 'Emergency Contraception', page_or_location: 'Section 8' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.CDC.CONTRA.2024.RF.01',
      display_id: 'CDC-CONTRA-RF1',
      finding: 'New onset of severe headache with focal neurologic symptoms, chest pain, or leg swelling/pain in a woman taking combined hormonal contraceptives',
      implication: 'May represent CHC-related VTE (DVT/PE), stroke, or MI. CHC increases VTE risk 3-4x baseline.',
      action: 'Discontinue CHC immediately. Evaluate for stroke (CT/MRI), PE (CTA), or DVT (duplex US). Anticoagulate if VTE confirmed.',
      urgency: 'immediate',
      provenance: { section: 'CHC Complications', page_or_location: 'Section 6' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.CDC.CONTRA.2024.SEV.01',
      display_id: 'CDC-CONTRA-SEV1',
      level: 'US MEC Category 4 conditions for combined hormonal contraceptives',
      criteria: [
        'Migraine with aura (any age)',
        'Current or history of VTE (DVT/PE)',
        'Known thrombogenic mutations (Factor V Leiden, etc.)',
        'Current breast cancer',
        'Smoker age >=35 (>=15 cigarettes/day)',
        'Uncontrolled hypertension (SBP >=160 or DBP >=100)',
        'Complicated valvular heart disease',
        'Peripartum cardiomyopathy',
        '<21 days postpartum (VTE risk)',
      ],
      management_implications:
        'CHC absolutely contraindicated. Offer progestin-only methods (POP, DMPA, implant, LNG-IUD) or copper IUD as alternatives. All progestin-only methods are MEC 1-2 for most of these conditions. Counsel on VTE signs/symptoms.',
      provenance: { section: 'US MEC Category 4', page_or_location: 'Summary Table' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering contraception: US MEC categories, LARC as first-line, CHC contraindications, emergency contraception options.',

  all_item_ids: [
    'PACK.CDC.CONTRA.2024.REC.01', 'PACK.CDC.CONTRA.2024.REC.02', 'PACK.CDC.CONTRA.2024.REC.03',
    'PACK.CDC.CONTRA.2024.DC.01', 'PACK.CDC.CONTRA.2024.T.01',
    'PACK.CDC.CONTRA.2024.TX.01', 'PACK.CDC.CONTRA.2024.TX.02',
    'PACK.CDC.CONTRA.2024.RF.01', 'PACK.CDC.CONTRA.2024.SEV.01',
  ],
  all_display_ids: [
    'CDC-CONTRA-R1', 'CDC-CONTRA-R2', 'CDC-CONTRA-R3',
    'CDC-CONTRA-DC1',
    'CDC-CONTRA-T1',
    'CDC-CONTRA-TX1', 'CDC-CONTRA-TX2',
    'CDC-CONTRA-RF1',
    'CDC-CONTRA-SEV1',
  ],
};
