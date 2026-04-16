import type { SourcePack } from './types';

export const PACK_ACOG_PRENA_2020: SourcePack = {
  source_pack_id: 'PACK.ACOG.PRENA.2020',
  source_name: 'ACOG Committee Opinions and Practice Bulletins on Routine Prenatal Screening',
  source_registry_id: 'REG.ACOG.PRENA',
  canonical_url: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin',
  publication_year: 2020,
  guideline_body: 'ACOG',

  topic_tags: ['Prenatal Screening', 'Aneuploidy', 'NIPT', 'GBS', 'Prenatal Care', 'OB/GYN'],
  allowed_decision_scopes: [
    'initial prenatal lab panel',
    'first trimester screening',
    'second trimester screening (quad screen)',
    'cell-free DNA / NIPT',
    'anatomy ultrasound timing',
    'GBS screening and prophylaxis',
    'aneuploidy screening counseling',
  ],
  excluded_decision_scopes: [
    'detailed fetal echocardiography indications',
    'amniocentesis/CVS procedural technique',
    'carrier screening for genetic disorders (detailed)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.PRENA.2020.REC.01',
      display_id: 'ACOG-PRENA-R1',
      statement: 'All pregnant women should be offered aneuploidy screening or diagnostic testing regardless of maternal age.',
      normalized_claim: 'Aneuploidy screening (first trimester screen, quad screen, or NIPT) should be offered to all pregnant women regardless of age.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Aneuploidy Screening', page_or_location: 'PB 226' },
    },
    {
      rec_id: 'PACK.ACOG.PRENA.2020.REC.02',
      display_id: 'ACOG-PRENA-R2',
      statement: 'Cell-free DNA (NIPT) is the most sensitive screening test for trisomies 21, 18, and 13 and can be offered to all pregnant women.',
      normalized_claim: 'NIPT has >99% sensitivity for trisomy 21; it is a screening test, not diagnostic. Positive NIPT requires confirmatory amniocentesis or CVS.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'NIPT', page_or_location: 'CO 640' },
    },
    {
      rec_id: 'PACK.ACOG.PRENA.2020.REC.03',
      display_id: 'ACOG-PRENA-R3',
      statement: 'Universal GBS screening by vaginal-rectal culture should be performed at 36 0/7 to 37 6/7 weeks gestation.',
      normalized_claim: 'Screen all pregnant women for GBS at 36-37 wks with vaginal-rectal swab; give intrapartum penicillin G if positive.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'GBS Prevention', page_or_location: 'CO 797' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.PRENA.2020.DC.01',
      display_id: 'ACOG-PRENA-DC1',
      name: 'First Trimester Screen Components',
      components: [
        'Nuchal translucency (NT) measurement on ultrasound at 11-14 weeks',
        'Maternal serum PAPP-A (low in trisomy 21)',
        'Maternal serum free beta-hCG (elevated in trisomy 21)',
        'Combined detection rate ~82-87% for trisomy 21 with 5% FPR',
      ],
      interpretation: 'Combined first trimester screen provides risk assessment for trisomy 21, 18, and 13.',
      normalized_claim: 'First trimester screen = NT + PAPP-A + beta-hCG at 11-14 wks; detects ~85% of trisomy 21 at 5% FPR.',
      provenance: { section: 'First Trimester Screening', page_or_location: 'PB 226' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.PRENA.2020.T.01',
      display_id: 'ACOG-PRENA-T1',
      parameter: 'Nuchal translucency for increased aneuploidy risk',
      value: '3.0',
      unit: 'mm',
      clinical_meaning: 'NT >=3.0 mm (or >99th percentile) is associated with increased risk of aneuploidy and structural anomalies, warrants diagnostic testing.',
      normalized_claim: 'NT >=3.0 mm is abnormal; associated with trisomy 21, cardiac defects, and other anomalies.',
      direction: 'above',
      provenance: { section: 'Ultrasound Markers', page_or_location: 'PB 226' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.PRENA.2020.TX.01',
      display_id: 'ACOG-PRENA-TX1',
      action: 'Initial prenatal laboratory panel',
      normalized_claim: 'First prenatal visit labs: CBC, blood type/Rh/antibody screen, RPR/VDRL, rubella IgG, HBsAg, HIV, urinalysis/culture, Pap smear (if due), STI screening.',
      timing: 'First prenatal visit (ideally <10 weeks)',
      condition: 'All pregnant women at initial visit',
      provenance: { section: 'Routine Prenatal Labs', page_or_location: 'Section 2' },
    },
    {
      step_id: 'PACK.ACOG.PRENA.2020.TX.02',
      display_id: 'ACOG-PRENA-TX2',
      action: 'GBS intrapartum prophylaxis with penicillin G',
      normalized_claim: 'GBS+ women receive penicillin G 5 million units IV load then 2.5-3 million units IV q4h until delivery. Adequate prophylaxis requires >=4h before delivery.',
      timing: 'Upon admission in labor or ROM',
      condition: 'Positive GBS culture at 36-37 wks, GBS bacteriuria this pregnancy, or prior infant with GBS disease',
      drug_details: { drug: 'Penicillin G', dose: '5M units load, 2.5-3M units q4h', route: 'IV' },
      contraindications: ['Penicillin allergy — use cefazolin or clindamycin/vancomycin based on sensitivity'],
      provenance: { section: 'GBS Prophylaxis', page_or_location: 'CO 797' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.PRENA.2020.RF.01',
      display_id: 'ACOG-PRENA-RF1',
      finding: 'Markedly elevated MSAFP (>2.5 MoM) on second trimester quad screen',
      implication: 'Associated with open neural tube defects (spina bifida, anencephaly), abdominal wall defects, or multiple gestation.',
      action: 'Targeted ultrasound for fetal anatomy; if normal, consider amniocentesis for amniotic fluid AFP and acetylcholinesterase.',
      urgency: 'urgent',
      provenance: { section: 'Quad Screen Interpretation', page_or_location: 'PB 226' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.PRENA.2020.SEV.01',
      display_id: 'ACOG-PRENA-SEV1',
      level: 'High-risk aneuploidy screening result',
      criteria: [
        'First trimester screen risk >=1:270 for trisomy 21',
        'Positive NIPT for trisomy 21, 18, or 13',
        'NT >=3.0 mm',
        'Quad screen with multiple marker abnormalities',
      ],
      management_implications:
        'Offer genetic counseling and diagnostic testing (CVS at 10-13 wks or amniocentesis at 15-20 wks). NIPT positive results require confirmation — do not make irreversible decisions based on screening alone. Detailed anatomy scan at 18-22 weeks.',
      provenance: { section: 'Follow-up of Abnormal Screening', page_or_location: 'PB 226' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering prenatal screening: initial labs, first trimester screen, NIPT, quad screen, anatomy scan, GBS.',

  all_item_ids: [
    'PACK.ACOG.PRENA.2020.REC.01', 'PACK.ACOG.PRENA.2020.REC.02', 'PACK.ACOG.PRENA.2020.REC.03',
    'PACK.ACOG.PRENA.2020.DC.01', 'PACK.ACOG.PRENA.2020.T.01',
    'PACK.ACOG.PRENA.2020.TX.01', 'PACK.ACOG.PRENA.2020.TX.02',
    'PACK.ACOG.PRENA.2020.RF.01', 'PACK.ACOG.PRENA.2020.SEV.01',
  ],
  all_display_ids: [
    'ACOG-PRENA-R1', 'ACOG-PRENA-R2', 'ACOG-PRENA-R3',
    'ACOG-PRENA-DC1',
    'ACOG-PRENA-T1',
    'ACOG-PRENA-TX1', 'ACOG-PRENA-TX2',
    'ACOG-PRENA-RF1',
    'ACOG-PRENA-SEV1',
  ],
};
