import type { SourcePack } from './types';

export const PACK_ACOG_PTL_2021: SourcePack = {
  source_pack_id: 'PACK.ACOG.PTL.2021',
  source_name: 'ACOG Practice Bulletin No. 234: Prediction and Prevention of Spontaneous Preterm Birth',
  source_registry_id: 'REG.ACOG.PTL',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000004479',
  publication_year: 2021,
  guideline_body: 'ACOG',

  topic_tags: ['Preterm Labor', 'Tocolysis', 'Betamethasone', 'Neuroprotection', 'OB/GYN'],
  allowed_decision_scopes: [
    'preterm labor diagnosis',
    'tocolytic agent selection',
    'antenatal corticosteroids',
    'magnesium sulfate for neuroprotection',
    'progesterone for PTB prevention',
    'cervical cerclage indications',
    'fetal fibronectin testing',
  ],
  excluded_decision_scopes: [
    'preterm PROM management (see PROM pack)',
    'iatrogenic preterm delivery indications',
    'NICU management of premature infants',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.PTL.2021.REC.01',
      display_id: 'ACOG-PTL-R1',
      statement: 'A single course of betamethasone is recommended for pregnant women between 24 0/7 and 33 6/7 weeks at risk of preterm delivery within 7 days.',
      normalized_claim: 'Betamethasone (12 mg IM x2 doses, 24h apart) given 24-34 wks reduces RDS, IVH, and neonatal death.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Antenatal Corticosteroids', page_or_location: 'Section 5' },
    },
    {
      rec_id: 'PACK.ACOG.PTL.2021.REC.02',
      display_id: 'ACOG-PTL-R2',
      statement: 'Magnesium sulfate for fetal neuroprotection should be administered when delivery is anticipated before 32 weeks gestation.',
      normalized_claim: 'MgSO4 for neuroprotection before 32 wks reduces cerebral palsy risk in surviving preterm infants.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Neuroprotection', page_or_location: 'Section 6' },
    },
    {
      rec_id: 'PACK.ACOG.PTL.2021.REC.03',
      display_id: 'ACOG-PTL-R3',
      statement: 'Vaginal progesterone is recommended for women with a short cervix (<=25 mm) found on mid-trimester ultrasound to reduce spontaneous preterm birth.',
      normalized_claim: 'Vaginal progesterone (200 mg daily) for cervical length <=25 mm at 16-24 wks reduces PTB in singleton gestations.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Prevention', page_or_location: 'Section 3' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.PTL.2021.DC.01',
      display_id: 'ACOG-PTL-DC1',
      name: 'Preterm Labor Diagnosis',
      components: [
        'Regular uterine contractions (>=4 per 20 minutes or >=8 per 60 minutes)',
        'Cervical change: dilation >=2 cm or effacement >=80%',
        'Gestational age 20 0/7 to 36 6/7 weeks',
      ],
      interpretation: 'PTL confirmed by regular contractions with documented cervical change between 20-37 weeks.',
      normalized_claim: 'Preterm labor = regular contractions + cervical dilation >=2 cm or effacement >=80% at 20-37 weeks gestation.',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 4' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.PTL.2021.T.01',
      display_id: 'ACOG-PTL-T1',
      parameter: 'Cervical length for short cervix intervention',
      value: '25',
      unit: 'mm',
      clinical_meaning: 'Cervical length <=25 mm on TVUS at 16-24 weeks is threshold for progesterone therapy in singletons.',
      normalized_claim: 'Cervical length <=25 mm at 16-24 wks triggers vaginal progesterone in singletons; <=15 mm may warrant cerclage if prior PTB.',
      direction: 'below',
      provenance: { section: 'Cervical Length Screening', page_or_location: 'Section 3' },
    },
    {
      threshold_id: 'PACK.ACOG.PTL.2021.T.02',
      display_id: 'ACOG-PTL-T2',
      parameter: 'Gestational age for neuroprotective MgSO4',
      value: '32',
      unit: 'weeks',
      clinical_meaning: 'MgSO4 for neuroprotection is indicated when preterm delivery anticipated before 32 0/7 weeks.',
      normalized_claim: 'MgSO4 neuroprotection threshold: <32 wks gestation when delivery expected within 24 hours.',
      direction: 'below',
      provenance: { section: 'Neuroprotection', page_or_location: 'Section 6' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.PTL.2021.TX.01',
      display_id: 'ACOG-PTL-TX1',
      action: 'Nifedipine tocolysis for acute preterm labor',
      normalized_claim: 'Nifedipine (loading 20-30 mg PO, then 10-20 mg q4-6h) is a first-line tocolytic; delays delivery 48h for steroid administration.',
      timing: 'Upon confirmed preterm labor 24-34 weeks',
      condition: 'Active preterm labor requiring tocolysis',
      drug_details: { drug: 'Nifedipine', dose: '20-30mg loading, then 10-20mg q4-6h', route: 'PO' },
      contraindications: ['Maternal hypotension', 'Concurrent magnesium (relative)'],
      provenance: { section: 'Tocolysis', page_or_location: 'Section 7' },
    },
    {
      step_id: 'PACK.ACOG.PTL.2021.TX.02',
      display_id: 'ACOG-PTL-TX2',
      action: 'Indomethacin tocolysis for preterm labor <32 weeks',
      normalized_claim: 'Indomethacin (50-100 mg loading, then 25-50 mg q6h for max 48h) is effective tocolytic; avoid after 32 wks due to premature ductus arteriosus closure.',
      timing: 'Upon confirmed preterm labor <32 weeks',
      condition: 'Active preterm labor <32 weeks gestation',
      drug_details: { drug: 'Indomethacin', dose: '50-100mg load, 25-50mg q6h', route: 'PO/PR', duration: 'Max 48 hours' },
      contraindications: ['Gestational age >=32 weeks', 'Oligohydramnios', 'Renal dysfunction', 'Platelet dysfunction'],
      provenance: { section: 'Tocolysis', page_or_location: 'Section 7' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.PTL.2021.RF.01',
      display_id: 'ACOG-PTL-RF1',
      finding: 'Preterm labor with signs of chorioamnionitis (maternal fever, uterine tenderness, fetal tachycardia, purulent discharge)',
      implication: 'Tocolysis is contraindicated in the setting of intraamniotic infection. Delivery should proceed.',
      action: 'Discontinue tocolytics, initiate broad-spectrum antibiotics (ampicillin + gentamicin), deliver regardless of gestational age.',
      urgency: 'immediate',
      provenance: { section: 'Contraindications to Tocolysis', page_or_location: 'Section 7' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.PTL.2021.SEV.01',
      display_id: 'ACOG-PTL-SEV1',
      level: 'Periviable preterm labor (22-25 weeks)',
      criteria: [
        'Gestational age 22 0/7 to 25 6/7 weeks',
        'Active preterm labor with cervical change',
        'Intact membranes or PPROM',
      ],
      management_implications:
        'Requires multidisciplinary counseling (obstetrics + neonatology). Discuss resuscitation goals. Antenatal corticosteroids may be considered starting at 23 wks. Tocolysis for steroid benefit if resuscitation planned. Neuroprotective MgSO4 if <32 wks.',
      provenance: { section: 'Periviable Delivery', page_or_location: 'Section 8' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering preterm labor: diagnosis, tocolysis, corticosteroids, MgSO4 neuroprotection, progesterone prevention.',

  all_item_ids: [
    'PACK.ACOG.PTL.2021.REC.01', 'PACK.ACOG.PTL.2021.REC.02', 'PACK.ACOG.PTL.2021.REC.03',
    'PACK.ACOG.PTL.2021.DC.01', 'PACK.ACOG.PTL.2021.T.01', 'PACK.ACOG.PTL.2021.T.02',
    'PACK.ACOG.PTL.2021.TX.01', 'PACK.ACOG.PTL.2021.TX.02', 'PACK.ACOG.PTL.2021.RF.01',
    'PACK.ACOG.PTL.2021.SEV.01',
  ],
  all_display_ids: [
    'ACOG-PTL-R1', 'ACOG-PTL-R2', 'ACOG-PTL-R3',
    'ACOG-PTL-DC1',
    'ACOG-PTL-T1', 'ACOG-PTL-T2',
    'ACOG-PTL-TX1', 'ACOG-PTL-TX2',
    'ACOG-PTL-RF1',
    'ACOG-PTL-SEV1',
  ],
};
