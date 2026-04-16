import type { SourcePack } from './types';

export const PACK_ACOG_RH_2018: SourcePack = {
  source_pack_id: 'PACK.ACOG.RH.2018',
  source_name: 'ACOG Practice Bulletin No. 192: Management of Alloimmunization During Pregnancy',
  source_registry_id: 'REG.ACOG.RH',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000002528',
  publication_year: 2018,
  guideline_body: 'ACOG',

  topic_tags: ['Rh Isoimmunization', 'RhoGAM', 'Fetal Anemia', 'Alloimmunization', 'OB/GYN'],
  allowed_decision_scopes: [
    'RhD typing and antibody screen',
    'RhoGAM administration indications',
    'Kleihauer-Betke test interpretation',
    'fetal anemia surveillance',
    'MCA Doppler for fetal anemia',
    'intrauterine transfusion indications',
  ],
  excluded_decision_scopes: [
    'non-RhD alloantibodies (detailed management)',
    'neonatal exchange transfusion',
    'hydrops fetalis from non-immune causes',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.RH.2018.REC.01',
      display_id: 'ACOG-RH-R1',
      statement: 'All pregnant women should have ABO blood type, RhD status, and antibody screen determined at the first prenatal visit.',
      normalized_claim: 'Type, RhD, and antibody screen at first prenatal visit for all pregnancies; repeat antibody screen at 28 wks for Rh-negative women.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Screening', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ACOG.RH.2018.REC.02',
      display_id: 'ACOG-RH-R2',
      statement: 'Anti-D immune globulin (RhoGAM) 300 mcg IM should be administered at 28 weeks gestation and within 72 hours of delivery of an Rh-positive newborn to unsensitized Rh-negative women.',
      normalized_claim: 'RhoGAM 300 mcg IM at 28 wks and within 72h postpartum prevents Rh alloimmunization in Rh-negative unsensitized women.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Prevention', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.ACOG.RH.2018.REC.03',
      display_id: 'ACOG-RH-R3',
      statement: 'RhoGAM should also be administered after any sensitizing event: miscarriage, ectopic pregnancy, amniocentesis, CVS, abdominal trauma, external cephalic version, or vaginal bleeding.',
      normalized_claim: 'RhoGAM required after any potential fetomaternal hemorrhage event in unsensitized Rh-negative women.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Sensitizing Events', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.ACOG.RH.2018.REC.04',
      display_id: 'ACOG-RH-R4',
      statement: 'MCA peak systolic velocity Doppler is the standard non-invasive method to detect fetal anemia in alloimmunized pregnancies, replacing amniocentesis for delta OD450.',
      normalized_claim: 'MCA-PSV >1.5 MoM indicates moderate-to-severe fetal anemia; superior to amniocentesis for fetal anemia detection.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Fetal Surveillance', page_or_location: 'Section 6' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.RH.2018.DC.01',
      display_id: 'ACOG-RH-DC1',
      name: 'Rh Alloimmunization Diagnosis',
      components: [
        'Rh-negative maternal blood type',
        'Positive indirect Coombs test (anti-D antibody detected)',
        'Antibody titer >=1:16 (critical titer) warrants fetal surveillance',
      ],
      interpretation: 'Rh alloimmunization confirmed by positive anti-D antibodies; critical titer >=1:16 triggers MCA Doppler surveillance.',
      normalized_claim: 'Rh alloimmunization = Rh-negative mother with anti-D antibodies; critical titer >=1:16 requires MCA Doppler monitoring for fetal anemia.',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 5' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.RH.2018.T.01',
      display_id: 'ACOG-RH-T1',
      parameter: 'Critical anti-D antibody titer',
      value: '1:16',
      clinical_meaning: 'Titer >=1:16 indicates significant risk of fetal hemolytic disease requiring MCA Doppler surveillance.',
      normalized_claim: 'Anti-D titer >=1:16 is the critical threshold triggering fetal anemia surveillance with serial MCA Doppler.',
      direction: 'above',
      provenance: { section: 'Monitoring', page_or_location: 'Section 5' },
    },
    {
      threshold_id: 'PACK.ACOG.RH.2018.T.02',
      display_id: 'ACOG-RH-T2',
      parameter: 'MCA peak systolic velocity for fetal anemia',
      value: '1.5',
      unit: 'MoM',
      clinical_meaning: 'MCA-PSV >1.5 MoM indicates moderate-to-severe fetal anemia and need for cordocentesis or intrauterine transfusion.',
      normalized_claim: 'MCA-PSV >1.5 MoM predicts moderate-severe fetal anemia with high sensitivity; triggers cordocentesis/intrauterine transfusion.',
      direction: 'above',
      provenance: { section: 'Fetal Surveillance', page_or_location: 'Section 6' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.RH.2018.TX.01',
      display_id: 'ACOG-RH-TX1',
      action: 'RhoGAM prophylaxis at 28 weeks',
      normalized_claim: 'Administer RhoGAM 300 mcg IM at 28 wks to all unsensitized Rh-negative pregnant women to prevent alloimmunization.',
      timing: '28 weeks gestation',
      condition: 'Rh-negative, antibody screen negative',
      drug_details: { drug: 'Rh(D) immune globulin (RhoGAM)', dose: '300 mcg', route: 'IM' },
      provenance: { section: 'Prevention', page_or_location: 'Section 4' },
    },
    {
      step_id: 'PACK.ACOG.RH.2018.TX.02',
      display_id: 'ACOG-RH-TX2',
      action: 'Intrauterine transfusion for severe fetal anemia',
      normalized_claim: 'Intrauterine transfusion of packed RBCs via cordocentesis for fetal anemia (MCA-PSV >1.5 MoM or fetal Hb <2 SD below mean for GA).',
      timing: 'When MCA-PSV >1.5 MoM, typically 18-35 weeks',
      condition: 'Confirmed severe fetal anemia in alloimmunized pregnancy',
      provenance: { section: 'Treatment', page_or_location: 'Section 7' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.RH.2018.RF.01',
      display_id: 'ACOG-RH-RF1',
      finding: 'Hydrops fetalis on ultrasound: skin edema, ascites, pleural/pericardial effusions, placentomegaly',
      implication: 'Late sign of severe fetal anemia with high perinatal mortality. Indicates hemoglobin deficit >7 g/dL.',
      action: 'Emergent cordocentesis and intrauterine transfusion at a tertiary center, consider early delivery if near term.',
      urgency: 'immediate',
      provenance: { section: 'Hydrops Fetalis', page_or_location: 'Section 8' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.RH.2018.SEV.01',
      display_id: 'ACOG-RH-SEV1',
      level: 'Severe Rh alloimmunization with fetal anemia',
      criteria: [
        'Anti-D titer >=1:16 (critical titer)',
        'MCA-PSV >1.5 MoM',
        'Prior affected pregnancy with hydrops or neonatal exchange transfusion',
        'Rising antibody titers across serial measurements',
      ],
      management_implications:
        'Serial MCA Doppler every 1-2 weeks. Cordocentesis if MCA-PSV >1.5 MoM. Intrauterine transfusion for confirmed anemia. Delivery at 37-38 wks if stable, earlier if anemia refractory. Transfer to tertiary center with IUT capability.',
      provenance: { section: 'Severe Disease Management', page_or_location: 'Section 7' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering Rh isoimmunization: screening, RhoGAM prophylaxis, MCA Doppler surveillance, intrauterine transfusion.',

  all_item_ids: [
    'PACK.ACOG.RH.2018.REC.01', 'PACK.ACOG.RH.2018.REC.02', 'PACK.ACOG.RH.2018.REC.03',
    'PACK.ACOG.RH.2018.REC.04', 'PACK.ACOG.RH.2018.DC.01', 'PACK.ACOG.RH.2018.T.01',
    'PACK.ACOG.RH.2018.T.02', 'PACK.ACOG.RH.2018.TX.01', 'PACK.ACOG.RH.2018.TX.02',
    'PACK.ACOG.RH.2018.RF.01', 'PACK.ACOG.RH.2018.SEV.01',
  ],
  all_display_ids: [
    'ACOG-RH-R1', 'ACOG-RH-R2', 'ACOG-RH-R3', 'ACOG-RH-R4',
    'ACOG-RH-DC1',
    'ACOG-RH-T1', 'ACOG-RH-T2',
    'ACOG-RH-TX1', 'ACOG-RH-TX2',
    'ACOG-RH-RF1',
    'ACOG-RH-SEV1',
  ],
};
