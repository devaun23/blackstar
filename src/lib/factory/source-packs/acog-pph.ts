import type { SourcePack } from './types';

export const PACK_ACOG_PPH_2017: SourcePack = {
  source_pack_id: 'PACK.ACOG.PPH.2017',
  source_name: 'ACOG Practice Bulletin No. 183: Postpartum Hemorrhage',
  source_registry_id: 'REG.ACOG.PPH',
  canonical_url: 'https://doi.org/10.1097/AOG.0000000000002351',
  publication_year: 2017,
  guideline_body: 'ACOG',

  topic_tags: ['Postpartum Hemorrhage', 'Uterine Atony', 'Obstetric Emergency', 'OB/GYN'],
  allowed_decision_scopes: [
    'PPH definition and recognition',
    'uterine atony management',
    'uterotonic selection',
    'balloon tamponade',
    'surgical management of PPH',
    'massive transfusion protocol',
    'PPH risk factor identification',
  ],
  excluded_decision_scopes: [
    'DIC management (detailed hematology)',
    'uterine artery embolization (interventional radiology details)',
    'delayed postpartum hemorrhage (>24h)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ACOG.PPH.2017.REC.01',
      display_id: 'ACOG-PPH-R1',
      statement: 'Active management of the third stage of labor (oxytocin after delivery of the anterior shoulder, controlled cord traction, uterine massage) reduces the risk of PPH.',
      normalized_claim: 'Active management of third stage (oxytocin after delivery, cord traction, uterine massage) reduces PPH incidence by ~60%.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Prevention', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.ACOG.PPH.2017.REC.02',
      display_id: 'ACOG-PPH-R2',
      statement: 'Quantitative blood loss measurement is more accurate than visual estimation and should be used to identify PPH early.',
      normalized_claim: 'Quantitative blood loss (QBL) is superior to visual estimation; PPH defined as cumulative blood loss >=1000 mL or signs of hypovolemia.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Recognition', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.ACOG.PPH.2017.REC.03',
      display_id: 'ACOG-PPH-R3',
      statement: 'Tranexamic acid (1g IV) should be administered within 3 hours of delivery for PPH treatment as an adjunct to uterotonics.',
      normalized_claim: 'TXA 1g IV within 3h of birth reduces death from PPH; give as adjunct to uterotonics, not replacement.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACOG.PPH.2017.DC.01',
      display_id: 'ACOG-PPH-DC1',
      name: 'Postpartum Hemorrhage Definition and 4 T Etiology',
      components: [
        'PPH: cumulative blood loss >=1000 mL or signs/symptoms of hypovolemia within 24h of delivery',
        'Tone (70%): uterine atony — boggy, poorly contracted uterus',
        'Trauma (20%): lacerations of cervix, vagina, or perineum; uterine rupture; uterine inversion',
        'Tissue (10%): retained placenta or placental fragments',
        'Thrombin (<1%): coagulopathy — DIC, von Willebrand disease, anticoagulant use',
      ],
      interpretation: 'Systematic 4 T evaluation identifies the cause and directs targeted treatment.',
      normalized_claim: 'PPH etiology: 4 Ts — Tone (atony, most common 70%), Trauma (lacerations), Tissue (retained placenta), Thrombin (coagulopathy).',
      provenance: { section: 'Etiology', page_or_location: 'Section 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ACOG.PPH.2017.T.01',
      display_id: 'ACOG-PPH-T1',
      parameter: 'Blood loss for PPH diagnosis',
      value: '1000',
      unit: 'mL',
      clinical_meaning: 'Cumulative blood loss >=1000 mL regardless of delivery route defines PPH and triggers escalation.',
      normalized_claim: 'PPH defined as blood loss >=1000 mL (vaginal or cesarean) or signs of hypovolemia with any amount of blood loss.',
      direction: 'above',
      provenance: { section: 'Definition', page_or_location: 'Section 1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ACOG.PPH.2017.TX.01',
      display_id: 'ACOG-PPH-TX1',
      action: 'Bimanual uterine massage and oxytocin for uterine atony',
      normalized_claim: 'First-line for atony: vigorous fundal massage + oxytocin 10-40 units in 1L NS IV infusion. Massage until uterus is firm.',
      timing: 'Immediately upon recognition of atony',
      condition: 'Uterine atony (boggy uterus) as cause of PPH',
      drug_details: { drug: 'Oxytocin', dose: '10-40 units in 1L NS', route: 'IV infusion' },
      escalation: 'If atony persists, add second-line uterotonics',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
    {
      step_id: 'PACK.ACOG.PPH.2017.TX.02',
      display_id: 'ACOG-PPH-TX2',
      action: 'Second-line uterotonics for refractory atony',
      normalized_claim: 'Second-line uterotonics: methylergonovine 0.2 mg IM (avoid in HTN), carboprost (15-methyl PGF2alpha) 250 mcg IM (avoid in asthma), misoprostol 800-1000 mcg PR.',
      timing: 'If oxytocin + massage fail to control bleeding',
      condition: 'Persistent uterine atony despite oxytocin and massage',
      drug_details: { drug: 'Methylergonovine / Carboprost / Misoprostol', dose: 'See normalized claim', route: 'IM/PR' },
      contraindications: ['Methylergonovine: hypertension, preeclampsia', 'Carboprost: asthma'],
      escalation: 'Intrauterine balloon tamponade if uterotonics fail',
      provenance: { section: 'Medical Management', page_or_location: 'Section 5' },
    },
    {
      step_id: 'PACK.ACOG.PPH.2017.TX.03',
      display_id: 'ACOG-PPH-TX3',
      action: 'Intrauterine balloon tamponade for refractory PPH',
      normalized_claim: 'Bakri or Foley balloon tamponade for PPH refractory to uterotonics; inflate with 300-500 mL saline. Positive tamponade test = bleeding stops.',
      timing: 'After failure of uterotonics',
      condition: 'PPH refractory to bimanual massage and uterotonics',
      escalation: 'If tamponade fails: uterine compression sutures (B-Lynch), uterine artery ligation, or hysterectomy',
      provenance: { section: 'Procedural Management', page_or_location: 'Section 6' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ACOG.PPH.2017.RF.01',
      display_id: 'ACOG-PPH-RF1',
      finding: 'Massive PPH: blood loss >1500 mL with hemodynamic instability (HR >110, SBP <90, altered mental status)',
      implication: 'Hemorrhagic shock. Mortality increases rapidly without massive transfusion and surgical intervention.',
      action: 'Activate massive transfusion protocol (1:1:1 PRBC:FFP:platelets), call for surgical backup, consider hysterectomy.',
      urgency: 'immediate',
      provenance: { section: 'Massive Hemorrhage', page_or_location: 'Section 7' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ACOG.PPH.2017.SEV.01',
      display_id: 'ACOG-PPH-SEV1',
      level: 'Stage 3-4 PPH (hemorrhagic shock)',
      criteria: [
        'Blood loss >1500 mL',
        'Heart rate >110 bpm',
        'Systolic BP <90 mmHg',
        'Altered mental status or decreased urine output',
        'Ongoing bleeding despite uterotonics',
      ],
      management_implications:
        'Massive transfusion protocol (1:1:1 ratio PRBC:FFP:platelets). TXA 1g IV. Surgical escalation: B-Lynch suture, uterine artery ligation, or peripartum hysterectomy. ICU admission. Interventional radiology for uterine artery embolization if available.',
      provenance: { section: 'Staged Management', page_or_location: 'Section 7' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'OB/GYN pack covering PPH: 4 Ts etiology, stepwise management (massage → uterotonics → tamponade → surgery), massive transfusion.',

  all_item_ids: [
    'PACK.ACOG.PPH.2017.REC.01', 'PACK.ACOG.PPH.2017.REC.02', 'PACK.ACOG.PPH.2017.REC.03',
    'PACK.ACOG.PPH.2017.DC.01', 'PACK.ACOG.PPH.2017.T.01',
    'PACK.ACOG.PPH.2017.TX.01', 'PACK.ACOG.PPH.2017.TX.02', 'PACK.ACOG.PPH.2017.TX.03',
    'PACK.ACOG.PPH.2017.RF.01', 'PACK.ACOG.PPH.2017.SEV.01',
  ],
  all_display_ids: [
    'ACOG-PPH-R1', 'ACOG-PPH-R2', 'ACOG-PPH-R3',
    'ACOG-PPH-DC1',
    'ACOG-PPH-T1',
    'ACOG-PPH-TX1', 'ACOG-PPH-TX2', 'ACOG-PPH-TX3',
    'ACOG-PPH-RF1',
    'ACOG-PPH-SEV1',
  ],
};
