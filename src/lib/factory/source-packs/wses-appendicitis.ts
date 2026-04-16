import type { SourcePack } from './types';

export const PACK_WSES_APPY_2020: SourcePack = {
  source_pack_id: 'PACK.WSES.APPY.2020',
  source_name: 'WSES/SAGES 2020 Guidelines for Diagnosis and Treatment of Acute Appendicitis',
  canonical_url: 'https://doi.org/10.1186/s13017-020-00306-3',
  publication_year: 2020,
  guideline_body: 'WSES/SAGES',

  topic_tags: ['Appendicitis', 'Acute Abdomen', 'Appendectomy', 'Surgery'],
  allowed_decision_scopes: [
    'appendicitis diagnosis and imaging',
    'Alvarado score interpretation',
    'uncomplicated vs complicated appendicitis classification',
    'laparoscopic appendectomy timing',
    'antibiotics-first strategy for uncomplicated appendicitis',
    'complicated appendicitis management (abscess, phlegmon)',
    'interval appendectomy timing',
  ],
  excluded_decision_scopes: [
    'chronic appendicitis',
    'appendiceal tumors (neuroendocrine, mucinous)',
    'pediatric appendicitis (age <5)',
    'appendicitis in pregnancy (obstetric considerations)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.WSES.APPY.2020.REC.01',
      display_id: 'WSES-APPY-R1',
      statement: 'CT scan with IV contrast is the gold standard imaging modality for diagnosing acute appendicitis in adults with pre-test probability >5%. Ultrasound may be used as first-line in young adults and women of childbearing age.',
      normalized_claim: 'CT with IV contrast is gold standard for appendicitis diagnosis in adults (>5% pretest probability). US first-line for young/reproductive-age women.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2' },
    },
    {
      rec_id: 'PACK.WSES.APPY.2020.REC.02',
      display_id: 'WSES-APPY-R2',
      statement: 'Laparoscopic appendectomy is the preferred surgical approach for both uncomplicated and complicated appendicitis. It should be performed within 24 hours of diagnosis for uncomplicated cases.',
      normalized_claim: 'Laparoscopic appendectomy preferred over open. Perform within 24 hours of diagnosis for uncomplicated appendicitis.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Surgical Treatment', page_or_location: 'Section 4' },
    },
    {
      rec_id: 'PACK.WSES.APPY.2020.REC.03',
      display_id: 'WSES-APPY-R3',
      statement: 'Antibiotics-first (non-operative) strategy may be considered for uncomplicated appendicitis in select patients who wish to avoid surgery, but carries a 20-40% recurrence rate at 1 year.',
      normalized_claim: 'Antibiotics-first for uncomplicated appendicitis is an option but has 20-40% recurrence at 1 year. Not standard of care.',
      strength: 'conditional',
      evidence_quality: 'moderate',
      context: 'APPAC, CODA trials; shared decision-making required',
      provenance: { section: 'Non-operative Management', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.WSES.APPY.2020.REC.04',
      display_id: 'WSES-APPY-R4',
      statement: 'Complicated appendicitis with periappendicular abscess >5cm should be managed with percutaneous drainage plus IV antibiotics, followed by interval appendectomy at 6-8 weeks.',
      normalized_claim: 'Appendiceal abscess >5cm: percutaneous drainage + IV antibiotics → interval appendectomy at 6-8 weeks.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Complicated Appendicitis', page_or_location: 'Section 5' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.WSES.APPY.2020.DC.01',
      display_id: 'WSES-APPY-DC1',
      name: 'Alvarado Score for Appendicitis',
      components: [
        'Migration of pain to RLQ (1 point)',
        'Anorexia (1 point)',
        'Nausea/vomiting (1 point)',
        'RLQ tenderness (2 points)',
        'Rebound tenderness (1 point)',
        'Elevated temperature >37.3°C (1 point)',
        'Leukocytosis >10,000 (2 points)',
        'Left shift (neutrophilia) (1 point)',
      ],
      threshold: 'Score ≥7 = high probability; 5-6 = equivocal (imaging recommended); ≤4 = low probability',
      interpretation: 'Alvarado ≥7 has high specificity for appendicitis. Score 5-6 warrants CT confirmation. Score ≤4 can generally be observed.',
      normalized_claim: 'Alvarado score ≥7 = high probability appendicitis. Score 5-6 = equivocal, get CT. Score ≤4 = low probability, observe.',
      provenance: { section: 'Clinical Scoring', page_or_location: 'Section 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.WSES.APPY.2020.T.01',
      display_id: 'WSES-APPY-T1',
      parameter: 'Appendiceal diameter on CT',
      value: '6',
      unit: 'mm',
      clinical_meaning: 'Appendiceal diameter >6mm with periappendiceal fat stranding on CT is diagnostic of acute appendicitis.',
      normalized_claim: 'Appendix >6mm diameter with fat stranding on CT = acute appendicitis.',
      direction: 'above',
      provenance: { section: 'Imaging', page_or_location: 'Section 2' },
    },
    {
      threshold_id: 'PACK.WSES.APPY.2020.T.02',
      display_id: 'WSES-APPY-T2',
      parameter: 'Abscess size for percutaneous drainage',
      value: '5',
      unit: 'cm',
      clinical_meaning: 'Periappendicular abscesses >5cm benefit from percutaneous drainage in addition to antibiotics, compared to antibiotics alone.',
      normalized_claim: 'Appendiceal abscess >5cm should undergo percutaneous drainage rather than antibiotics alone.',
      direction: 'above',
      provenance: { section: 'Complicated Appendicitis', page_or_location: 'Section 5' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.WSES.APPY.2020.TX.01',
      display_id: 'WSES-APPY-TX1',
      action: 'Laparoscopic appendectomy for uncomplicated appendicitis',
      normalized_claim: 'Uncomplicated appendicitis: laparoscopic appendectomy within 24 hours. Single-dose preoperative antibiotics (cefazolin + metronidazole). No postoperative antibiotics needed.',
      timing: 'Within 24 hours of diagnosis',
      condition: 'Uncomplicated acute appendicitis',
      drug_details: { drug: 'Cefazolin + Metronidazole', dose: '2g + 500mg', route: 'IV preoperative' },
      provenance: { section: 'Surgical Treatment', page_or_location: 'Section 4' },
    },
    {
      step_id: 'PACK.WSES.APPY.2020.TX.02',
      display_id: 'WSES-APPY-TX2',
      action: 'Percutaneous drainage + interval appendectomy for appendiceal abscess',
      normalized_claim: 'Appendiceal abscess: CT-guided percutaneous drainage + IV antibiotics (pip-tazo or ceftriaxone + metronidazole). Interval appendectomy at 6-8 weeks to rule out neoplasm.',
      timing: 'Drainage acutely; interval appendectomy at 6-8 weeks',
      condition: 'Complicated appendicitis with abscess >5cm',
      drug_details: { drug: 'Piperacillin-tazobactam', dose: '4.5g q6h', route: 'IV', duration: '5-7 days then oral step-down' },
      provenance: { section: 'Complicated Appendicitis', page_or_location: 'Section 5' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.WSES.APPY.2020.RF.01',
      display_id: 'WSES-APPY-RF1',
      finding: 'Diffuse peritonitis with free air on imaging in suspected appendicitis',
      implication: 'Indicates perforated appendicitis with generalized contamination. Higher morbidity and mortality than contained perforation.',
      action: 'Emergent laparoscopic or open appendectomy with peritoneal washout. Broad-spectrum IV antibiotics. Do not pursue percutaneous drainage or interval approach.',
      urgency: 'immediate',
      provenance: { section: 'Complicated Appendicitis', page_or_location: 'Section 5' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.WSES.APPY.2020.SEV.01',
      display_id: 'WSES-APPY-SEV1',
      level: 'Uncomplicated Appendicitis',
      criteria: [
        'Inflamed appendix without perforation',
        'No periappendicular abscess or phlegmon',
        'No appendicolith (debated)',
        'No free fluid beyond peri-appendiceal region',
      ],
      management_implications:
        'Laparoscopic appendectomy within 24 hours is standard. Antibiotics-first may be offered with shared decision-making (20-40% recurrence). Single preoperative antibiotic dose; no postoperative course needed.',
      provenance: { section: 'Classification', page_or_location: 'Section 3' },
    },
    {
      severity_id: 'PACK.WSES.APPY.2020.SEV.02',
      display_id: 'WSES-APPY-SEV2',
      level: 'Complicated Appendicitis (abscess/phlegmon)',
      criteria: [
        'Perforated appendix on imaging or clinical findings',
        'Periappendicular abscess or phlegmon present',
        'Possible contained free fluid or localized peritonitis',
        'May have systemic inflammatory response',
      ],
      management_implications:
        'Abscess >5cm: percutaneous drainage + IV antibiotics → interval appendectomy at 6-8 weeks. Phlegmon without drainable collection: IV antibiotics alone → interval appendectomy. Diffuse peritonitis: emergent surgery.',
      provenance: { section: 'Classification', page_or_location: 'Section 3' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Surgery pack: Acute appendicitis. Covers Alvarado scoring, CT diagnosis, uncomplicated vs complicated classification, appendectomy timing, interval approach.',

  all_item_ids: [
    'PACK.WSES.APPY.2020.REC.01', 'PACK.WSES.APPY.2020.REC.02', 'PACK.WSES.APPY.2020.REC.03',
    'PACK.WSES.APPY.2020.REC.04',
    'PACK.WSES.APPY.2020.DC.01',
    'PACK.WSES.APPY.2020.T.01', 'PACK.WSES.APPY.2020.T.02',
    'PACK.WSES.APPY.2020.TX.01', 'PACK.WSES.APPY.2020.TX.02',
    'PACK.WSES.APPY.2020.RF.01',
    'PACK.WSES.APPY.2020.SEV.01', 'PACK.WSES.APPY.2020.SEV.02',
  ],
  all_display_ids: [
    'WSES-APPY-R1', 'WSES-APPY-R2', 'WSES-APPY-R3', 'WSES-APPY-R4',
    'WSES-APPY-DC1',
    'WSES-APPY-T1', 'WSES-APPY-T2',
    'WSES-APPY-TX1', 'WSES-APPY-TX2',
    'WSES-APPY-RF1',
    'WSES-APPY-SEV1', 'WSES-APPY-SEV2',
  ],
};
