import type { SourcePack } from './types';

export const PACK_AAP_PUTI_2016: SourcePack = {
  source_pack_id: 'PACK.AAP.PUTI.2016',
  source_name: 'AAP 2011/2016 Clinical Practice Guideline: Urinary Tract Infection in Febrile Infants and Children 2-24 Months',
  source_registry_id: 'REG.AAP.PUTI',
  canonical_url: 'https://doi.org/10.1542/peds.2011-1330',
  publication_year: 2016,
  guideline_body: 'AAP',

  topic_tags: ['Pediatric UTI', 'Febrile UTI', 'Vesicoureteral Reflux', 'VCUG', 'Renal Ultrasound'],
  allowed_decision_scopes: [
    'febrile UTI diagnosis in infants',
    'urine collection method',
    'empiric antibiotic selection for pediatric UTI',
    'VCUG indications',
    'renal ultrasound indications',
    'VUR grading and management',
  ],
  excluded_decision_scopes: [
    'afebrile UTI in older children',
    'neurogenic bladder management',
    'renal transplant UTI',
    'urosepsis in neonates <2 months',
  ],

  recommendations: [
    {
      rec_id: 'PACK.AAP.PUTI.2016.REC.01',
      display_id: 'AAP-PUTI-R1',
      statement: 'Clinicians should obtain a urine specimen via catheterization or suprapubic aspiration for urinalysis and culture in febrile infants 2-24 months with suspected UTI. Bag specimens are acceptable for screening UA but not for culture.',
      normalized_claim: 'Catheterized or SPA urine specimen required for culture in febrile infants 2-24 months; bag specimens only acceptable for UA screening.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2.1' },
    },
    {
      rec_id: 'PACK.AAP.PUTI.2016.REC.02',
      display_id: 'AAP-PUTI-R2',
      statement: 'UTI diagnosis requires both a positive urinalysis (pyuria and/or bacteriuria) AND a positive culture (>=50,000 CFU/mL of a single uropathogen from catheterized specimen).',
      normalized_claim: 'Febrile UTI requires BOTH positive UA (pyuria/bacteriuria) AND culture >=50,000 CFU/mL of single uropathogen from catheterized specimen.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Diagnostic Criteria', page_or_location: 'Section 2.2' },
    },
    {
      rec_id: 'PACK.AAP.PUTI.2016.REC.03',
      display_id: 'AAP-PUTI-R3',
      statement: 'Renal and bladder ultrasound should be performed after the first febrile UTI in children 2-24 months to detect anatomic abnormalities.',
      normalized_claim: 'Renal/bladder ultrasound recommended after first febrile UTI in children 2-24 months.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Imaging', page_or_location: 'Section 4.1' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.AAP.PUTI.2016.DC.01',
      display_id: 'AAP-PUTI-DC1',
      name: 'Febrile UTI Diagnostic Criteria (2-24 months)',
      components: [
        'Temperature >=38C (100.4F) without clear source',
        'Positive urinalysis: pyuria (>=5 WBC/hpf or positive LE) AND/OR bacteriuria (any bacteria on Gram stain)',
        'Positive urine culture: >=50,000 CFU/mL of single uropathogen from catheterized specimen',
        'Both UA and culture must be positive for definitive diagnosis',
      ],
      interpretation: 'A positive UA alone is insufficient. A positive culture with negative UA may represent asymptomatic bacteriuria. Both are required for febrile UTI diagnosis.',
      normalized_claim: 'Febrile UTI = fever >=38C + positive UA (pyuria/bacteriuria) + culture >=50,000 CFU/mL single pathogen from catheterized specimen.',
      provenance: { section: 'Diagnostic Criteria', page_or_location: 'Section 2.2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.AAP.PUTI.2016.T.01',
      display_id: 'AAP-PUTI-T1',
      parameter: 'Urine culture colony count for UTI diagnosis (catheterized)',
      value: '50000',
      unit: 'CFU/mL',
      clinical_meaning: '>=50,000 CFU/mL of a single uropathogen from catheterized specimen confirms UTI. Lower counts may represent contamination.',
      normalized_claim: 'Catheterized urine culture >=50,000 CFU/mL of single uropathogen confirms UTI.',
      direction: 'above',
      provenance: { section: 'Diagnostic Criteria', page_or_location: 'Section 2.2' },
    },
    {
      threshold_id: 'PACK.AAP.PUTI.2016.T.02',
      display_id: 'AAP-PUTI-T2',
      parameter: 'VUR grade threshold for surgical consideration',
      value: '3',
      unit: 'grade (I-V scale)',
      clinical_meaning: 'VUR grades I-II are low-grade and usually managed conservatively (antibiotic prophylaxis optional). Grades III-V are high-grade with higher risk of renal scarring and may require surgical correction.',
      normalized_claim: 'VUR grade III-V is high-grade with higher renal scarring risk; may warrant surgical correction. Grades I-II usually resolve spontaneously.',
      direction: 'above',
      provenance: { section: 'VUR Management', page_or_location: 'Section 5.1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.AAP.PUTI.2016.TX.01',
      display_id: 'AAP-PUTI-TX1',
      action: 'Oral antibiotic therapy for uncomplicated febrile UTI',
      normalized_claim: 'Oral antibiotics (cephalexin, cefixime, or amoxicillin-clavulanate) for 7-14 days are as effective as IV-to-oral for uncomplicated febrile UTI in children 2-24 months.',
      timing: 'After UA obtained, empiric therapy pending culture',
      condition: 'Well-appearing febrile infant 2-24 months with suspected UTI',
      drug_details: { drug: 'Cephalexin', dose: '50-100 mg/kg/day', route: 'PO divided TID-QID', duration: '7-14 days' },
      provenance: { section: 'Treatment', page_or_location: 'Section 3.1' },
    },
    {
      step_id: 'PACK.AAP.PUTI.2016.TX.02',
      display_id: 'AAP-PUTI-TX2',
      action: 'Parenteral antibiotic therapy for ill-appearing infant',
      normalized_claim: 'IV ceftriaxone (50 mg/kg/day) for ill-appearing or vomiting infants with febrile UTI; transition to oral when clinically improved.',
      timing: 'At presentation for ill-appearing infants',
      condition: 'Ill-appearing, vomiting, or unable to tolerate oral antibiotics',
      drug_details: { drug: 'Ceftriaxone', dose: '50 mg/kg/day', route: 'IV/IM', duration: 'Until oral tolerated, then complete 7-14 days total' },
      provenance: { section: 'Treatment', page_or_location: 'Section 3.2' },
    },
    {
      step_id: 'PACK.AAP.PUTI.2016.TX.03',
      display_id: 'AAP-PUTI-TX3',
      action: 'VCUG after first febrile UTI with abnormal findings',
      normalized_claim: 'VCUG recommended after first febrile UTI if renal ultrasound shows hydronephrosis, scarring, or other abnormalities, or after second febrile UTI.',
      timing: 'After acute infection treated; when child is asymptomatic',
      condition: 'Abnormal renal US after first febrile UTI, or recurrent febrile UTI',
      provenance: { section: 'Imaging', page_or_location: 'Section 4.2' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.AAP.PUTI.2016.RF.01',
      display_id: 'AAP-PUTI-RF1',
      finding: 'Febrile infant <2 months with positive UA suggestive of UTI',
      implication: 'High risk of urosepsis and bacteremia. Neonates require more aggressive workup including blood culture and consideration of LP.',
      action: 'Hospital admission, IV antibiotics (ampicillin + gentamicin or ceftriaxone), blood culture, urine culture. Consider LP. Full sepsis evaluation.',
      urgency: 'immediate',
      provenance: { section: 'Young Infant Considerations', page_or_location: 'Section 6.1' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.AAP.PUTI.2016.SEV.01',
      display_id: 'AAP-PUTI-SEV1',
      level: 'Uncomplicated febrile UTI',
      criteria: [
        'Well-appearing infant 2-24 months',
        'Fever without other source',
        'Positive UA and culture',
        'Normal or mildly abnormal renal US',
        'No obstructive uropathy',
      ],
      management_implications:
        'Oral antibiotics for 7-14 days. Renal/bladder US. VCUG only if US abnormal or recurrent UTI. Follow-up culture not routinely needed if clinical improvement. Educate on recurrence signs.',
      provenance: { section: 'Management', page_or_location: 'Section 3.1' },
    },
    {
      severity_id: 'PACK.AAP.PUTI.2016.SEV.02',
      display_id: 'AAP-PUTI-SEV2',
      level: 'Complicated febrile UTI with high-grade VUR',
      criteria: [
        'Confirmed febrile UTI',
        'VCUG showing VUR grade III-V',
        'Renal scarring on DMSA scan',
        'Recurrent febrile UTIs',
        'Obstructive uropathy on imaging',
      ],
      management_implications:
        'Continuous antibiotic prophylaxis (TMP-SMX or nitrofurantoin). Pediatric urology referral. Consider surgical correction (ureteral reimplantation or STING procedure) for persistent high-grade VUR with breakthrough UTIs. Serial DMSA to monitor renal scarring.',
      provenance: { section: 'VUR Management', page_or_location: 'Section 5.1' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Pediatrics pack for febrile UTI in infants 2-24 months per AAP guidelines. Covers diagnosis, urine collection, imaging workup (US/VCUG), and VUR management.',

  all_item_ids: [
    'PACK.AAP.PUTI.2016.REC.01', 'PACK.AAP.PUTI.2016.REC.02', 'PACK.AAP.PUTI.2016.REC.03',
    'PACK.AAP.PUTI.2016.DC.01',
    'PACK.AAP.PUTI.2016.T.01', 'PACK.AAP.PUTI.2016.T.02',
    'PACK.AAP.PUTI.2016.TX.01', 'PACK.AAP.PUTI.2016.TX.02', 'PACK.AAP.PUTI.2016.TX.03',
    'PACK.AAP.PUTI.2016.RF.01',
    'PACK.AAP.PUTI.2016.SEV.01', 'PACK.AAP.PUTI.2016.SEV.02',
  ],
  all_display_ids: [
    'AAP-PUTI-R1', 'AAP-PUTI-R2', 'AAP-PUTI-R3',
    'AAP-PUTI-DC1',
    'AAP-PUTI-T1', 'AAP-PUTI-T2',
    'AAP-PUTI-TX1', 'AAP-PUTI-TX2', 'AAP-PUTI-TX3',
    'AAP-PUTI-RF1',
    'AAP-PUTI-SEV1', 'AAP-PUTI-SEV2',
  ],
};
