import type { SourcePack } from './types';

export const PACK_ACOG_PROM_2020: SourcePack = {
  source_pack_id: 'PACK.ACOG.PROM.2020',
  source_name: 'ACOG Practice Bulletin No. 217: Prelabor Rupture of Membranes',
  source_registry_id: 'REG.ACOG.PROM',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000003700',
  publication_year: 2020,
  guideline_body: 'ACOG',

  topic_tags: ['PROM', 'PPROM', 'Premature Rupture of Membranes', 'OB/GYN'],
  allowed_decision_scopes: [
    'PROM diagnosis',
    'term PROM management',
    'preterm PROM management',
    'latency antibiotics',
    'GBS prophylaxis with PROM',
    'delivery timing in PPROM',
    'chorioamnionitis recognition',
  ],
  excluded_decision_scopes: [
    'periviable PPROM <23 weeks (detailed counseling)',
    'cerclage management with PPROM',
    'outpatient PPROM management',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.PROM.2020.REC.01',
      display_id: 'ACOG-PROM-R1',
      statement: 'For term PROM (>=37 weeks), induction of labor is recommended, typically within 12-24 hours if labor does not begin spontaneously, to reduce infectious morbidity.',
      normalized_claim: 'Term PROM: induce labor within 12-24 hours; delayed induction increases risk of chorioamnionitis without improving outcomes.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Term PROM', page_or_location: 'Section 5' },
    },
    {
      rec_id: 'PACK.ACOG.PROM.2020.REC.02',
      display_id: 'ACOG-PROM-R2',
      statement: 'For PPROM between 24 and 33 6/7 weeks, expectant management with latency antibiotics and antenatal corticosteroids is recommended.',
      normalized_claim: 'PPROM 24-34 wks: expectant management with betamethasone + latency antibiotics (ampicillin/amoxicillin + azithromycin) to prolong pregnancy.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Preterm PROM', page_or_location: 'Section 6' },
    },
    {
      rec_id: 'PACK.ACOG.PROM.2020.REC.03',
      display_id: 'ACOG-PROM-R3',
      statement: 'For PPROM at 34 0/7 to 36 6/7 weeks, delivery is recommended rather than expectant management.',
      normalized_claim: 'PPROM at 34-37 wks: deliver (induce or cesarean per obstetric indications); expectant management does not improve neonatal outcomes at this GA.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Late Preterm PROM', page_or_location: 'Section 7' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.PROM.2020.DC.01',
      display_id: 'ACOG-PROM-DC1',
      name: 'PROM Diagnosis',
      components: [
        'Sterile speculum exam showing pooling of amniotic fluid in vaginal fornix',
        'Nitrazine test: positive (blue) indicates alkaline pH of amniotic fluid (pH 7.1-7.3)',
        'Ferning: arborization pattern on air-dried slide under microscopy',
        'AmniSure or ROM Plus test (placental alpha microglobulin-1 or IGFBP-1) if standard tests equivocal',
      ],
      interpretation: 'PROM confirmed by any of: pooling + nitrazine + ferning, or positive immunoassay. Avoid digital exam until labor confirmed.',
      normalized_claim: 'PROM diagnosis: sterile speculum exam showing pooling, positive nitrazine (blue/alkaline), ferning on microscopy. Avoid digital exam.',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 3' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.PROM.2020.T.01',
      display_id: 'ACOG-PROM-T1',
      parameter: 'Gestational age threshold for PPROM delivery',
      value: '34',
      unit: 'weeks',
      clinical_meaning: 'At >=34 weeks with PPROM, delivery is recommended. Below 34 weeks, expectant management is preferred.',
      normalized_claim: 'PPROM management pivot: <34 wks = expectant management; >=34 wks = delivery recommended.',
      direction: 'above',
      provenance: { section: 'Management Decision Point', page_or_location: 'Section 6-7' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.PROM.2020.TX.01',
      display_id: 'ACOG-PROM-TX1',
      action: 'Latency antibiotics for PPROM',
      normalized_claim: 'PPROM latency antibiotics: ampicillin 2g IV q6h + erythromycin 250mg IV q6h x48h, then amoxicillin 250mg PO q8h + erythromycin 250mg PO q6h x5 days. OR azithromycin-based regimen.',
      timing: 'Upon admission for PPROM <34 weeks',
      condition: 'PPROM with expectant management',
      drug_details: { drug: 'Ampicillin + erythromycin/azithromycin', dose: 'See normalized claim', route: 'IV then PO' },
      provenance: { section: 'Latency Antibiotics', page_or_location: 'Section 6' },
    },
    {
      step_id: 'PACK.ACOG.PROM.2020.TX.02',
      display_id: 'ACOG-PROM-TX2',
      action: 'Induction of labor for term PROM',
      normalized_claim: 'Term PROM with favorable cervix: oxytocin induction. Unfavorable cervix: may use prostaglandins (misoprostol, dinoprostone) or oxytocin.',
      timing: 'Within 12-24 hours of membrane rupture at term',
      condition: 'Term PROM (>=37 weeks) without spontaneous labor onset',
      drug_details: { drug: 'Oxytocin', dose: 'Per institutional protocol', route: 'IV' },
      provenance: { section: 'Term PROM Management', page_or_location: 'Section 5' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.PROM.2020.RF.01',
      display_id: 'ACOG-PROM-RF1',
      finding: 'Clinical chorioamnionitis with PROM: maternal fever >=38.0C (100.4F) plus any of uterine tenderness, maternal tachycardia, fetal tachycardia >160, purulent amniotic fluid',
      implication: 'Intraamniotic infection requires delivery regardless of gestational age. Tocolysis contraindicated.',
      action: 'Broad-spectrum antibiotics (ampicillin + gentamicin), delivery (induction preferred; cesarean only for obstetric indication), antipyretics.',
      urgency: 'immediate',
      provenance: { section: 'Chorioamnionitis', page_or_location: 'Section 8' },
    },
    {
      flag_id: 'PACK.ACOG.PROM.2020.RF.02',
      display_id: 'ACOG-PROM-RF2',
      finding: 'Umbilical cord prolapse after rupture of membranes: palpable cord on exam, sudden prolonged fetal bradycardia',
      implication: 'Cord compression causes fetal hypoxia and death if not relieved immediately.',
      action: 'Elevate presenting part off cord (hand in vagina), Trendelenburg/knee-chest position, emergent cesarean delivery.',
      urgency: 'immediate',
      provenance: { section: 'Complications of PROM', page_or_location: 'Section 9' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.PROM.2020.SEV.01',
      display_id: 'ACOG-PROM-SEV1',
      level: 'PPROM with clinical chorioamnionitis',
      criteria: [
        'Confirmed PPROM (pooling, nitrazine, ferning)',
        'Maternal temperature >=38.0C (100.4F)',
        'Maternal or fetal tachycardia',
        'Uterine tenderness',
        'Purulent or foul-smelling amniotic fluid',
        'Elevated maternal WBC (supportive but not diagnostic alone)',
      ],
      management_implications:
        'Deliver regardless of gestational age. Broad-spectrum antibiotics before delivery. Tocolysis absolutely contraindicated. Neonatology at bedside for delivery. Avoid expectant management — infection progresses to sepsis and fetal compromise.',
      provenance: { section: 'Chorioamnionitis Management', page_or_location: 'Section 8' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering PROM/PPROM: diagnosis (pooling, nitrazine, ferning), term management, PPROM latency, chorioamnionitis.',

  all_item_ids: [
    'PACK.ACOG.PROM.2020.REC.01', 'PACK.ACOG.PROM.2020.REC.02', 'PACK.ACOG.PROM.2020.REC.03',
    'PACK.ACOG.PROM.2020.DC.01', 'PACK.ACOG.PROM.2020.T.01',
    'PACK.ACOG.PROM.2020.TX.01', 'PACK.ACOG.PROM.2020.TX.02',
    'PACK.ACOG.PROM.2020.RF.01', 'PACK.ACOG.PROM.2020.RF.02', 'PACK.ACOG.PROM.2020.SEV.01',
  ],
  all_display_ids: [
    'ACOG-PROM-R1', 'ACOG-PROM-R2', 'ACOG-PROM-R3',
    'ACOG-PROM-DC1',
    'ACOG-PROM-T1',
    'ACOG-PROM-TX1', 'ACOG-PROM-TX2',
    'ACOG-PROM-RF1', 'ACOG-PROM-RF2',
    'ACOG-PROM-SEV1',
  ],
};
