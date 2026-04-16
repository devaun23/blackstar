import type { SourcePack } from './types';

export const PACK_ACOG_PLAC_2019: SourcePack = {
  source_pack_id: 'PACK.ACOG.PLAC.2019',
  source_name: 'ACOG Practice Bulletins on Placenta Previa, Placental Abruption, and Placenta Accreta Spectrum',
  source_registry_id: 'REG.ACOG.PLAC',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000003016',
  publication_year: 2019,
  guideline_body: 'ACOG',

  topic_tags: ['Placenta Previa', 'Placental Abruption', 'Placenta Accreta', 'Vasa Previa', 'OB/GYN'],
  allowed_decision_scopes: [
    'placenta previa diagnosis and management',
    'placental abruption recognition',
    'vasa previa identification',
    'placenta accreta spectrum planning',
    'antepartum hemorrhage workup',
    'delivery timing for placental disorders',
  ],
  excluded_decision_scopes: [
    'interventional radiology for accreta (procedural details)',
    'neonatal resuscitation after abruption',
    'chronic abruption management',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.PLAC.2019.REC.01',
      display_id: 'ACOG-PLAC-R1',
      statement: 'Digital cervical examination is absolutely contraindicated in patients with known or suspected placenta previa.',
      normalized_claim: 'Never perform digital cervical exam in placenta previa; use TVUS for cervical assessment (safe and more accurate than transabdominal).',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Placenta Previa', page_or_location: 'PB 200' },
    },
    {
      rec_id: 'PACK.ACOG.PLAC.2019.REC.02',
      display_id: 'ACOG-PLAC-R2',
      statement: 'Planned cesarean delivery at 36-37 weeks is recommended for asymptomatic placenta previa after a course of antenatal corticosteroids.',
      normalized_claim: 'Placenta previa: scheduled cesarean at 36-37 wks after late preterm corticosteroids; earlier if significant bleeding.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Delivery Timing', page_or_location: 'PB 200' },
    },
    {
      rec_id: 'PACK.ACOG.PLAC.2019.REC.03',
      display_id: 'ACOG-PLAC-R3',
      statement: 'Suspected placenta accreta spectrum should be managed at a center of excellence with a multidisciplinary team including MFM, gynecologic oncology, urology, and anesthesia.',
      normalized_claim: 'Placenta accreta spectrum: deliver at tertiary center with multidisciplinary team; planned cesarean hysterectomy at 34-35 wks.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Accreta Spectrum', page_or_location: 'PB 7' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.PLAC.2019.DC.01',
      display_id: 'ACOG-PLAC-DC1',
      name: 'Placenta Previa vs Abruption vs Vasa Previa',
      components: [
        'Previa: painless bright red vaginal bleeding in 2nd/3rd trimester, placenta covering or near cervical os on ultrasound',
        'Abruption: painful vaginal bleeding (or concealed), rigid/tender uterus, fetal distress, retroplacental clot on US (may be absent)',
        'Vasa previa: painless vaginal bleeding at ROM, fetal vessels crossing the internal os, sinusoidal FHR pattern',
      ],
      interpretation: 'Key differentiating features: previa = painless, abruption = painful with rigid uterus, vasa previa = bleeding at ROM with fetal distress.',
      normalized_claim: 'Previa: painless bleeding, placenta over os. Abruption: painful bleeding, rigid uterus, fetal distress. Vasa previa: bleeding at ROM, fetal vessel rupture, sinusoidal FHR.',
      provenance: { section: 'Differential Diagnosis', page_or_location: 'PB 200' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.PLAC.2019.T.01',
      display_id: 'ACOG-PLAC-T1',
      parameter: 'Placental edge distance from internal os for previa diagnosis',
      value: '20',
      unit: 'mm',
      clinical_meaning: 'Placental edge overlapping or within 20 mm of internal os in third trimester is placenta previa or low-lying placenta requiring cesarean delivery.',
      normalized_claim: 'Placenta previa: placental edge overlapping internal os. Low-lying: edge within 20 mm of os. Both preclude vaginal delivery.',
      direction: 'below',
      provenance: { section: 'Ultrasound Diagnosis', page_or_location: 'PB 200' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.PLAC.2019.TX.01',
      display_id: 'ACOG-PLAC-TX1',
      action: 'Expectant management for stable placenta previa with antepartum bleeding',
      normalized_claim: 'Stable previa with resolved bleeding: hospitalization, IV access, type and screen, betamethasone if <34 wks, pelvic rest, serial Hgb.',
      timing: 'Upon presentation with bleeding',
      condition: 'Placenta previa with bleeding that has resolved, hemodynamically stable',
      provenance: { section: 'Previa Management', page_or_location: 'PB 200' },
    },
    {
      step_id: 'PACK.ACOG.PLAC.2019.TX.02',
      display_id: 'ACOG-PLAC-TX2',
      action: 'Emergency cesarean for placental abruption with fetal distress',
      normalized_claim: 'Abruption with non-reassuring FHR: emergent cesarean delivery regardless of gestational age. Abruption with fetal demise: vaginal delivery preferred if maternal status allows.',
      timing: 'Immediate upon recognition',
      condition: 'Placental abruption with live fetus showing non-reassuring heart rate tracing',
      provenance: { section: 'Abruption Management', page_or_location: 'PB 227' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.PLAC.2019.RF.01',
      display_id: 'ACOG-PLAC-RF1',
      finding: 'Massive antepartum hemorrhage with hemodynamic instability: tachycardia, hypotension, altered consciousness',
      implication: 'Hemorrhagic shock from previa or abruption. Life-threatening for mother and fetus.',
      action: 'Activate massive transfusion, emergent cesarean delivery, prepare for possible hysterectomy if accreta.',
      urgency: 'immediate',
      provenance: { section: 'Emergency Management', page_or_location: 'PB 200' },
    },
    {
      flag_id: 'PACK.ACOG.PLAC.2019.RF.02',
      display_id: 'ACOG-PLAC-RF2',
      finding: 'Vasa previa with ruptured membranes: fetal bradycardia or sinusoidal heart rate pattern after ROM',
      implication: 'Fetal exsanguination from ruptured fetal vessels. Fetal mortality approaches 60% if undiagnosed.',
      action: 'Emergent cesarean delivery. Every minute of delay increases fetal mortality.',
      urgency: 'immediate',
      provenance: { section: 'Vasa Previa', page_or_location: 'PB 200' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.PLAC.2019.SEV.01',
      display_id: 'ACOG-PLAC-SEV1',
      level: 'Severe placental abruption',
      criteria: [
        'Painful vaginal bleeding (may be concealed)',
        'Tetanic uterine contractions or rigid board-like uterus',
        'Non-reassuring fetal heart rate pattern or fetal demise',
        'Coagulopathy (elevated PT/PTT, low fibrinogen <200 mg/dL)',
        'Hemodynamic instability',
      ],
      management_implications:
        'Emergent delivery (cesarean if live fetus with distress, vaginal if fetal demise and maternal stable). Massive transfusion protocol. Monitor for DIC — check fibrinogen, PT/PTT, platelet count. Replace fibrinogen (cryoprecipitate) if <200 mg/dL.',
      provenance: { section: 'Severe Abruption', page_or_location: 'PB 227' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering placental disorders: previa, abruption, vasa previa, accreta spectrum with diagnostic features and management.',

  all_item_ids: [
    'PACK.ACOG.PLAC.2019.REC.01', 'PACK.ACOG.PLAC.2019.REC.02', 'PACK.ACOG.PLAC.2019.REC.03',
    'PACK.ACOG.PLAC.2019.DC.01', 'PACK.ACOG.PLAC.2019.T.01',
    'PACK.ACOG.PLAC.2019.TX.01', 'PACK.ACOG.PLAC.2019.TX.02',
    'PACK.ACOG.PLAC.2019.RF.01', 'PACK.ACOG.PLAC.2019.RF.02', 'PACK.ACOG.PLAC.2019.SEV.01',
  ],
  all_display_ids: [
    'ACOG-PLAC-R1', 'ACOG-PLAC-R2', 'ACOG-PLAC-R3',
    'ACOG-PLAC-DC1',
    'ACOG-PLAC-T1',
    'ACOG-PLAC-TX1', 'ACOG-PLAC-TX2',
    'ACOG-PLAC-RF1', 'ACOG-PLAC-RF2',
    'ACOG-PLAC-SEV1',
  ],
};
