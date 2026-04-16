import type { SourcePack } from './types';

export const PACK_ES_HCALC_2022: SourcePack = {
  source_pack_id: 'PACK.ES.HCALC.2022',
  source_name: 'Endocrine Society 2022 Clinical Practice Guideline: Management of Primary Hyperparathyroidism and Hypercalcemia',
  canonical_url: 'https://doi.org/10.1210/clinem/dgac106',
  publication_year: 2022,
  guideline_body: 'Endocrine Society',

  topic_tags: ['Hypercalcemia', 'Hyperparathyroidism', 'PHPT', 'Malignancy Hypercalcemia', 'Endocrinology'],
  allowed_decision_scopes: [
    'PTH-mediated vs PTH-independent hypercalcemia differentiation',
    'acute hypercalcemia management',
    'surgical indications for primary hyperparathyroidism',
    'surveillance criteria for asymptomatic PHPT',
    'hypercalcemia of malignancy treatment',
  ],
  excluded_decision_scopes: [
    'secondary hyperparathyroidism in CKD',
    'tertiary hyperparathyroidism management',
    'familial hypocalciuric hypercalcemia',
    'hypercalcemia in pediatric patients',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ES.HCALC.2022.REC.01',
      display_id: 'ES-HCALC-R1',
      statement: 'The initial workup for hypercalcemia should include intact PTH, calcium (corrected for albumin or ionized), phosphorus, creatinine, and 25-OH vitamin D.',
      normalized_claim: 'Hypercalcemia workup: intact PTH is the critical branch point. PTH high/normal = PTH-mediated. PTH low = PTH-independent (malignancy, granulomatous, vitamin D).',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Diagnostic Evaluation', page_or_location: 'Section 2.1' },
    },
    {
      rec_id: 'PACK.ES.HCALC.2022.REC.02',
      display_id: 'ES-HCALC-R2',
      statement: 'Parathyroidectomy is recommended for all symptomatic patients with primary hyperparathyroidism and for asymptomatic patients meeting surgical criteria.',
      normalized_claim: 'Parathyroidectomy is curative and recommended for symptomatic PHPT and asymptomatic PHPT meeting any surgical criterion.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Surgical Management', page_or_location: 'Recommendation 5' },
    },
    {
      rec_id: 'PACK.ES.HCALC.2022.REC.03',
      display_id: 'ES-HCALC-R3',
      statement: 'Acute severe hypercalcemia (Ca >14 mg/dL or symptomatic) requires aggressive IV normal saline hydration as the immediate first step, followed by calcitonin for rapid onset and IV bisphosphonate for sustained effect.',
      normalized_claim: 'Acute severe hypercalcemia: IV NS 200-300 mL/h first, then calcitonin (rapid but transient) and zoledronic acid (delayed but sustained).',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Acute Management', page_or_location: 'Section 4.1' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ES.HCALC.2022.DC.01',
      display_id: 'ES-HCALC-DC1',
      name: 'PTH-mediated vs PTH-independent Hypercalcemia',
      components: [
        'PTH elevated or inappropriately normal + high calcium = primary hyperparathyroidism (most common outpatient cause)',
        'PTH suppressed (<20 pg/mL) + high calcium = PTH-independent: malignancy (most common inpatient cause), granulomatous disease, vitamin D intoxication, milk-alkali',
        'PTHrP elevated + PTH suppressed = humoral hypercalcemia of malignancy (squamous cell, renal, breast)',
        '1,25-OH vitamin D elevated + PTH suppressed = granulomatous disease (sarcoidosis, TB) or lymphoma',
      ],
      interpretation: 'PTH is the single most important branch point. PHPT = most common cause in outpatients. Malignancy = most common in hospitalized patients.',
      normalized_claim: 'PTH high + Ca high = PHPT. PTH low + Ca high = malignancy or granulomatous disease. PTH is the critical diagnostic branch point.',
      provenance: { section: 'Differential Diagnosis', page_or_location: 'Figure 1' },
    },
    {
      criterion_id: 'PACK.ES.HCALC.2022.DC.02',
      display_id: 'ES-HCALC-DC2',
      name: 'Surgical Criteria for Asymptomatic PHPT',
      components: [
        'Serum calcium >1.0 mg/dL above upper limit of normal',
        'T-score <=-2.5 at any site (lumbar spine, total hip, femoral neck, or distal 1/3 radius)',
        'Vertebral fracture on imaging',
        'GFR <60 mL/min',
        'Age <50 years',
        '24-hour urine calcium >400 mg/day or elevated stone risk',
        'Nephrolithiasis or nephrocalcinosis on imaging',
      ],
      interpretation: 'Meeting ANY ONE criterion is sufficient indication for parathyroidectomy. Patients not meeting criteria can be monitored with annual calcium, creatinine, and DEXA every 1-2 years.',
      normalized_claim: 'Surgery for asymptomatic PHPT if ANY: Ca >1 above normal, T-score <=-2.5, GFR <60, age <50, kidney stones, or vertebral fracture.',
      provenance: { section: 'Surgical Indications', page_or_location: 'Table 3' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ES.HCALC.2022.T.01',
      display_id: 'ES-HCALC-T1',
      parameter: 'Serum calcium for severe hypercalcemia',
      value: '14',
      unit: 'mg/dL',
      clinical_meaning: 'Calcium >14 mg/dL constitutes severe/crisis-level hypercalcemia requiring emergent treatment. Risk of cardiac arrhythmia, renal failure, and altered mental status.',
      normalized_claim: 'Calcium >14 mg/dL = hypercalcemic crisis requiring emergent IV fluids, calcitonin, and bisphosphonate.',
      direction: 'above',
      provenance: { section: 'Severity Classification', page_or_location: 'Section 4.1' },
    },
    {
      threshold_id: 'PACK.ES.HCALC.2022.T.02',
      display_id: 'ES-HCALC-T2',
      parameter: 'Calcium above normal for surgical indication',
      value: '1.0',
      unit: 'mg/dL above ULN',
      clinical_meaning: 'Serum calcium exceeding the upper limit of normal by >1.0 mg/dL is a surgical indication in asymptomatic PHPT.',
      normalized_claim: 'Calcium >1.0 mg/dL above upper normal limit triggers surgical referral in asymptomatic PHPT.',
      direction: 'above',
      provenance: { section: 'Surgical Criteria', page_or_location: 'Table 3' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ES.HCALC.2022.TX.01',
      display_id: 'ES-HCALC-TX1',
      action: 'Acute hypercalcemia: IV normal saline resuscitation',
      normalized_claim: 'First step in acute hypercalcemia: IV normal saline 200-300 mL/h to restore intravascular volume and promote calciuresis.',
      timing: 'Immediately upon diagnosis of symptomatic or severe hypercalcemia',
      condition: 'Acute symptomatic hypercalcemia or Ca >14 mg/dL',
      drug_details: { drug: 'Normal saline', dose: '200-300 mL/h', route: 'IV' },
      contraindications: ['Decompensated heart failure (adjust rate)', 'Volume overload'],
      provenance: { section: 'Acute Management', page_or_location: 'Section 4.1' },
    },
    {
      step_id: 'PACK.ES.HCALC.2022.TX.02',
      display_id: 'ES-HCALC-TX2',
      action: 'Acute hypercalcemia: Calcitonin for rapid effect',
      normalized_claim: 'Calcitonin 4 IU/kg SC/IM q12h lowers calcium within 4-6 hours but has tachyphylaxis within 48 hours. Bridge to bisphosphonate effect.',
      timing: 'After initiating IV fluids',
      condition: 'Severe hypercalcemia requiring rapid reduction',
      drug_details: { drug: 'Calcitonin (salmon)', dose: '4 IU/kg', route: 'SC or IM every 12 hours', duration: 'Effective for 48 hours (tachyphylaxis)' },
      provenance: { section: 'Acute Management', page_or_location: 'Section 4.1' },
    },
    {
      step_id: 'PACK.ES.HCALC.2022.TX.03',
      display_id: 'ES-HCALC-TX3',
      action: 'Acute hypercalcemia: IV bisphosphonate for sustained effect',
      normalized_claim: 'Zoledronic acid 4mg IV over 15 min is the preferred bisphosphonate for hypercalcemia of malignancy. Onset 2-4 days, duration 2-4 weeks.',
      timing: '2-4 days to take effect; given concurrently with calcitonin',
      condition: 'Hypercalcemia of malignancy or severe PHPT-related hypercalcemia',
      drug_details: { drug: 'Zoledronic acid', dose: '4mg', route: 'IV over 15 minutes' },
      contraindications: ['GFR <35 mL/min (consider denosumab instead)'],
      provenance: { section: 'Bisphosphonate Therapy', page_or_location: 'Section 4.2' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ES.HCALC.2022.RF.01',
      display_id: 'ES-HCALC-RF1',
      finding: 'Hypercalcemic crisis: Ca >14 mg/dL with altered mental status, oliguria, severe dehydration, and QTc shortening on ECG',
      implication: 'Life-threatening emergency. Risk of cardiac arrest, acute kidney injury, and coma. Most commonly due to malignancy or severe PHPT.',
      action: 'Aggressive IV NS (200-500 mL/h initially), calcitonin 4 IU/kg q12h, zoledronic acid 4mg IV, cardiac monitoring, treat underlying cause.',
      urgency: 'immediate',
      provenance: { section: 'Hypercalcemic Crisis', page_or_location: 'Section 4.1' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ES.HCALC.2022.SEV.01',
      display_id: 'ES-HCALC-SEV1',
      level: 'Mild hypercalcemia',
      criteria: [
        'Serum calcium 10.5-12.0 mg/dL',
        'Usually asymptomatic or mild fatigue, constipation',
        'Most commonly PHPT',
      ],
      management_implications:
        'Workup with PTH, phosphorus, vitamin D. If PHPT confirmed, assess for surgical criteria. If not meeting criteria, observe with annual labs and DEXA every 1-2 years. Ensure adequate hydration.',
      provenance: { section: 'Severity Classification', page_or_location: 'Section 1.2' },
    },
    {
      severity_id: 'PACK.ES.HCALC.2022.SEV.02',
      display_id: 'ES-HCALC-SEV2',
      level: 'Severe hypercalcemia / hypercalcemic crisis',
      criteria: [
        'Serum calcium >14 mg/dL',
        'Altered mental status (confusion to coma)',
        'Acute kidney injury (oliguria, rising creatinine)',
        'ECG changes: shortened QTc, bradycardia, heart block',
        'Severe dehydration, nausea, vomiting',
      ],
      management_implications:
        'Emergency: IV NS 200-300 mL/h, calcitonin for rapid reduction (works in hours), zoledronic acid for sustained effect (works in days). Cardiac monitoring. Hemodialysis if refractory or renal failure. Identify and treat underlying cause (malignancy workup if PTH suppressed).',
      provenance: { section: 'Hypercalcemic Crisis', page_or_location: 'Section 4.1' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 pack for hypercalcemia. Covers PTH-mediated vs PTH-independent differentiation, acute management, and PHPT surgical criteria.',

  all_item_ids: [
    'PACK.ES.HCALC.2022.REC.01', 'PACK.ES.HCALC.2022.REC.02', 'PACK.ES.HCALC.2022.REC.03',
    'PACK.ES.HCALC.2022.DC.01', 'PACK.ES.HCALC.2022.DC.02',
    'PACK.ES.HCALC.2022.T.01', 'PACK.ES.HCALC.2022.T.02',
    'PACK.ES.HCALC.2022.TX.01', 'PACK.ES.HCALC.2022.TX.02', 'PACK.ES.HCALC.2022.TX.03',
    'PACK.ES.HCALC.2022.RF.01',
    'PACK.ES.HCALC.2022.SEV.01', 'PACK.ES.HCALC.2022.SEV.02',
  ],
  all_display_ids: [
    'ES-HCALC-R1', 'ES-HCALC-R2', 'ES-HCALC-R3',
    'ES-HCALC-DC1', 'ES-HCALC-DC2',
    'ES-HCALC-T1', 'ES-HCALC-T2',
    'ES-HCALC-TX1', 'ES-HCALC-TX2', 'ES-HCALC-TX3',
    'ES-HCALC-RF1',
    'ES-HCALC-SEV1', 'ES-HCALC-SEV2',
  ],
};
