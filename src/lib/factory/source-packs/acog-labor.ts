import type { SourcePack } from './types';

export const PACK_ACOG_LABOR_2019: SourcePack = {
  source_pack_id: 'PACK.ACOG.LABOR.2019',
  source_name: 'ACOG Practice Bulletin No. 205: Vaginal Birth After Cesarean and Safe Prevention of the Primary Cesarean / ACOG Committee Opinion on Labor Management',
  source_registry_id: 'REG.ACOG.LABOR',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000003078',
  publication_year: 2019,
  guideline_body: 'ACOG',

  topic_tags: ['Labor Management', 'Cesarean Section', 'Shoulder Dystocia', 'Oxytocin', 'OB/GYN'],
  allowed_decision_scopes: [
    'stages of labor definition',
    'arrest disorder diagnosis',
    'oxytocin augmentation',
    'cesarean section indications',
    'failed induction criteria',
    'shoulder dystocia management',
    'operative vaginal delivery',
  ],
  excluded_decision_scopes: [
    'elective cesarean without medical indication',
    'VBAC counseling (detailed)',
    'neonatal resuscitation',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.LABOR.2019.REC.01',
      display_id: 'ACOG-LABOR-R1',
      statement: 'Active labor should not be diagnosed until cervical dilation of 6 cm. Slow progress before 6 cm should not be an indication for cesarean delivery.',
      normalized_claim: 'Active labor begins at 6 cm dilation; cesarean for arrest should not be performed before 6 cm.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Safe Prevention of Primary Cesarean', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ACOG.LABOR.2019.REC.02',
      display_id: 'ACOG-LABOR-R2',
      statement: 'Arrest of active phase (first stage) requires >=6 cm dilation with ruptured membranes and no cervical change for >=4 hours with adequate contractions or >=6 hours with inadequate contractions and oxytocin.',
      normalized_claim: 'First stage arrest: >=6 cm, ROM, no change for >=4h with adequate contractions or >=6h with oxytocin before cesarean.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Arrest Disorders', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.ACOG.LABOR.2019.REC.03',
      display_id: 'ACOG-LABOR-R3',
      statement: 'Failed induction should not be diagnosed until at least 24 hours of oxytocin after membrane rupture if the maternal and fetal status allow.',
      normalized_claim: 'Failed induction requires >=24h of oxytocin after amniotomy without entering active labor before cesarean is indicated.',
      strength: 'conditional',
      evidence_quality: 'moderate',
      provenance: { section: 'Induction of Labor', page_or_location: 'Section 5' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.LABOR.2019.DC.01',
      display_id: 'ACOG-LABOR-DC1',
      name: 'Stages of Labor',
      components: [
        'First stage: onset of regular contractions to complete cervical dilation (10 cm). Latent phase: 0-6 cm. Active phase: 6-10 cm.',
        'Second stage: complete dilation to delivery of infant. Nulliparous: up to 3h without epidural, 4h with. Multiparous: up to 2h without, 3h with.',
        'Third stage: delivery of infant to delivery of placenta. Normally <30 minutes.',
      ],
      interpretation: 'Labor stages define normal progression and thresholds for diagnosing arrest disorders.',
      normalized_claim: 'Labor stages: 1st (contractions to 10 cm), 2nd (10 cm to delivery), 3rd (delivery to placenta). Active phase begins at 6 cm.',
      provenance: { section: 'Normal Labor', page_or_location: 'Section 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.LABOR.2019.T.01',
      display_id: 'ACOG-LABOR-T1',
      parameter: 'Active labor dilation threshold',
      value: '6',
      unit: 'cm',
      clinical_meaning: 'Active phase of labor begins at 6 cm. Arrest diagnosis and cesarean for failure to progress should not occur before this threshold.',
      normalized_claim: 'Active labor starts at 6 cm; cesarean for arrest inappropriate before 6 cm dilation.',
      direction: 'above',
      provenance: { section: 'Labor Progression', page_or_location: 'Section 3' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.LABOR.2019.TX.01',
      display_id: 'ACOG-LABOR-TX1',
      action: 'Oxytocin augmentation for inadequate labor progress',
      normalized_claim: 'Oxytocin augmentation: start 0.5-2 mU/min, increase every 15-40 min; goal is adequate contractions (>=200 Montevideo units) to achieve cervical change.',
      timing: 'When labor progress is inadequate',
      condition: 'Protracted or arrested labor with inadequate contractions',
      drug_details: { drug: 'Oxytocin', dose: '0.5-2 mU/min initial, titrate upward', route: 'IV infusion' },
      contraindications: ['Prior classical/T-incision cesarean', 'Active genital herpes', 'Placenta previa', 'Vasa previa', 'Non-reassuring fetal status'],
      provenance: { section: 'Augmentation', page_or_location: 'Section 6' },
    },
    {
      step_id: 'PACK.ACOG.LABOR.2019.TX.02',
      display_id: 'ACOG-LABOR-TX2',
      action: 'Shoulder dystocia management: McRoberts maneuver and suprapubic pressure',
      normalized_claim: 'Shoulder dystocia first-line: McRoberts maneuver (hyperflexion of maternal thighs) + suprapubic pressure. Do NOT apply fundal pressure.',
      timing: 'Immediately upon recognition of shoulder dystocia',
      condition: 'Shoulder dystocia (turtle sign, failure of restitution after head delivery)',
      provenance: { section: 'Shoulder Dystocia', page_or_location: 'Section 8' },
    },
    {
      step_id: 'PACK.ACOG.LABOR.2019.TX.03',
      display_id: 'ACOG-LABOR-TX3',
      action: 'Cesarean delivery for arrest of descent',
      normalized_claim: 'Arrest of descent in second stage: no progress for >=3h with epidural or >=2h without in nulliparas (1h less for multiparas) warrants operative delivery.',
      condition: 'Complete dilation with no descent despite adequate pushing',
      escalation: 'Consider operative vaginal delivery (vacuum/forceps) before cesarean if criteria met',
      provenance: { section: 'Second Stage Management', page_or_location: 'Section 7' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.LABOR.2019.RF.01',
      display_id: 'ACOG-LABOR-RF1',
      finding: 'Non-reassuring fetal heart rate: recurrent late decelerations, absent variability, prolonged bradycardia <110 bpm for >10 minutes',
      implication: 'Indicates fetal hypoxia/acidosis. Category III tracing requires immediate intervention.',
      action: 'Intrauterine resuscitation (position change, IV fluids, stop oxytocin, oxygen), if no improvement proceed to emergent cesarean delivery.',
      urgency: 'immediate',
      provenance: { section: 'Fetal Monitoring', page_or_location: 'Section 9' },
    },
    {
      flag_id: 'PACK.ACOG.LABOR.2019.RF.02',
      display_id: 'ACOG-LABOR-RF2',
      finding: 'Uterine rupture: sudden onset severe abdominal pain, loss of fetal station, change in uterine contour, fetal bradycardia, vaginal hemorrhage',
      implication: 'Life-threatening emergency for mother and fetus. Most common in TOLAC with prior cesarean.',
      action: 'Emergent cesarean delivery, resuscitate, prepare for hysterectomy if needed.',
      urgency: 'immediate',
      provenance: { section: 'Uterine Rupture', page_or_location: 'Section 10' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.LABOR.2019.SEV.01',
      display_id: 'ACOG-LABOR-SEV1',
      level: 'Obstructed labor with fetal compromise',
      criteria: [
        'Arrest of dilation or descent meeting time criteria',
        'Non-reassuring fetal heart rate pattern (Category II or III)',
        'Adequate contractions (>=200 Montevideo units) without progress',
        'Failed operative vaginal delivery attempt',
      ],
      management_implications:
        'Proceed to cesarean delivery without further delay. Ensure anesthesia, pediatrics, and nursing are present. Type and screen/crossmatch. Prepare for possible postpartum hemorrhage.',
      provenance: { section: 'Emergency Cesarean', page_or_location: 'Section 9' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering labor management: stages, arrest disorders, oxytocin, cesarean indications, shoulder dystocia.',

  all_item_ids: [
    'PACK.ACOG.LABOR.2019.REC.01', 'PACK.ACOG.LABOR.2019.REC.02', 'PACK.ACOG.LABOR.2019.REC.03',
    'PACK.ACOG.LABOR.2019.DC.01', 'PACK.ACOG.LABOR.2019.T.01',
    'PACK.ACOG.LABOR.2019.TX.01', 'PACK.ACOG.LABOR.2019.TX.02', 'PACK.ACOG.LABOR.2019.TX.03',
    'PACK.ACOG.LABOR.2019.RF.01', 'PACK.ACOG.LABOR.2019.RF.02', 'PACK.ACOG.LABOR.2019.SEV.01',
  ],
  all_display_ids: [
    'ACOG-LABOR-R1', 'ACOG-LABOR-R2', 'ACOG-LABOR-R3',
    'ACOG-LABOR-DC1',
    'ACOG-LABOR-T1',
    'ACOG-LABOR-TX1', 'ACOG-LABOR-TX2', 'ACOG-LABOR-TX3',
    'ACOG-LABOR-RF1', 'ACOG-LABOR-RF2',
    'ACOG-LABOR-SEV1',
  ],
};
