import type { SourcePack } from './types';

export const PACK_APA_EAT_2023: SourcePack = {
  source_pack_id: 'PACK.APA.EAT.2023',
  source_name: 'APA Practice Guidelines for the Treatment of Eating Disorders (4th Edition)',
  source_registry_id: 'REG.APA.EAT',
  canonical_url: 'https://doi.org/10.1176/appi.books.9780890424865',
  publication_year: 2023,
  guideline_body: 'APA',

  topic_tags: ['Anorexia Nervosa', 'Bulimia Nervosa', 'Binge Eating Disorder', 'Refeeding Syndrome', 'Psychiatry'],
  allowed_decision_scopes: [
    'anorexia nervosa medical stabilization',
    'refeeding syndrome prevention',
    'bulimia nervosa treatment (CBT + SSRI)',
    'binge eating disorder pharmacotherapy',
    'medical complications of eating disorders',
    'family-based treatment for adolescents',
    'hospitalization criteria',
  ],
  excluded_decision_scopes: [
    'avoidant/restrictive food intake disorder (ARFID)',
    'rumination disorder',
    'pica',
    'obesity management without binge eating',
  ],

  recommendations: [
    {
      rec_id: 'PACK.APA.EAT.2023.REC.01',
      display_id: 'APA-EAT-R1',
      statement: 'Family-based treatment (FBT/Maudsley approach) is recommended as first-line treatment for adolescents with anorexia nervosa.',
      normalized_claim: 'Family-based treatment (FBT) is first-line for adolescent anorexia nervosa. Parents take temporary control of refeeding.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Anorexia Nervosa Treatment', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.APA.EAT.2023.REC.02',
      display_id: 'APA-EAT-R2',
      statement: 'CBT (specifically CBT-E: enhanced) is recommended as first-line psychotherapy for bulimia nervosa, with SSRIs (fluoxetine 60mg) as pharmacological adjunct.',
      normalized_claim: 'CBT-E is first-line for bulimia nervosa. Fluoxetine 60mg is the only FDA-approved medication (higher dose than for depression).',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Bulimia Nervosa Treatment', page_or_location: 'Section 4.1' },
    },
    {
      rec_id: 'PACK.APA.EAT.2023.REC.03',
      display_id: 'APA-EAT-R3',
      statement: 'Lisdexamfetamine is FDA-approved for moderate-to-severe binge eating disorder. CBT is also effective as first-line psychotherapy.',
      normalized_claim: 'Lisdexamfetamine (Vyvanse) is FDA-approved for moderate-to-severe BED. CBT is first-line psychotherapy for BED.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Binge Eating Disorder', page_or_location: 'Section 5.1' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.APA.EAT.2023.DC.01',
      display_id: 'APA-EAT-DC1',
      name: 'DSM-5 Anorexia Nervosa',
      components: [
        'Restriction of energy intake leading to significantly low body weight (BMI <18.5 in adults, or below expected in children/adolescents)',
        'Intense fear of gaining weight or persistent behavior interfering with weight gain, despite being underweight',
        'Disturbance in body image, undue influence of weight/shape on self-evaluation, or lack of recognition of seriousness of low weight',
        'Restricting subtype: no binge-purge behavior',
        'Binge-eating/purging subtype: recurrent binge eating or purging (vomiting, laxatives, diuretics)',
      ],
      interpretation: 'DSM-5 removed amenorrhea criterion. Severity by BMI: mild >=17, moderate 16-16.99, severe 15-15.99, extreme <15.',
      normalized_claim: 'Anorexia nervosa: restricted intake + low BMI + fear of weight gain + body image disturbance. Severity graded by BMI.',
      provenance: { section: 'Diagnosis', page_or_location: 'DSM-5 Section II' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.APA.EAT.2023.T.01',
      display_id: 'APA-EAT-T1',
      parameter: 'BMI for severe anorexia nervosa',
      value: '15',
      unit: 'kg/m2',
      clinical_meaning: 'BMI <15 indicates extreme severity anorexia nervosa. High risk for cardiac arrhythmia, organ failure, and death. Inpatient treatment typically required.',
      normalized_claim: 'BMI <15 = extreme anorexia nervosa severity; requires inpatient medical stabilization.',
      direction: 'below',
      provenance: { section: 'Severity', page_or_location: 'Section 2.2' },
    },
    {
      threshold_id: 'PACK.APA.EAT.2023.T.02',
      display_id: 'APA-EAT-T2',
      parameter: 'Phosphate level for refeeding syndrome risk',
      value: '2.5',
      unit: 'mg/dL',
      clinical_meaning: 'Phosphate <2.5 mg/dL during refeeding indicates refeeding syndrome. Can cause cardiac arrest, respiratory failure, rhabdomyolysis.',
      normalized_claim: 'Phosphate <2.5 mg/dL during nutritional rehabilitation = refeeding syndrome. Monitor daily. Supplement aggressively.',
      direction: 'below',
      provenance: { section: 'Refeeding', page_or_location: 'Section 3.3' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.APA.EAT.2023.TX.01',
      display_id: 'APA-EAT-TX1',
      action: 'Medical stabilization for severe anorexia nervosa',
      normalized_claim: 'Inpatient medical stabilization: start refeeding at 1200-1500 kcal/day (low to prevent refeeding syndrome). Monitor electrolytes (phosphate, potassium, magnesium) daily. Advance calories by 200-300 kcal every 2-3 days.',
      condition: 'Anorexia nervosa with BMI <15, vital sign instability, or electrolyte abnormalities',
      timing: 'Immediately upon admission',
      provenance: { section: 'Medical Stabilization', page_or_location: 'Section 3.2' },
    },
    {
      step_id: 'PACK.APA.EAT.2023.TX.02',
      display_id: 'APA-EAT-TX2',
      action: 'Fluoxetine for bulimia nervosa',
      normalized_claim: 'Fluoxetine 60mg/day (not standard 20mg depression dose) is first-line medication for bulimia nervosa. Reduces binge-purge frequency. Combine with CBT-E.',
      condition: 'Bulimia nervosa, especially if CBT alone insufficient',
      drug_details: { drug: 'Fluoxetine', dose: '60mg', route: 'PO daily' },
      contraindications: ['Concurrent MAOI use', 'Severe hepatic impairment'],
      provenance: { section: 'Bulimia Pharmacotherapy', page_or_location: 'Section 4.2' },
    },
    {
      step_id: 'PACK.APA.EAT.2023.TX.03',
      display_id: 'APA-EAT-TX3',
      action: 'Lisdexamfetamine for binge eating disorder',
      normalized_claim: 'Lisdexamfetamine 50-70mg/day for moderate-to-severe BED. Reduces binge days/week. Schedule II controlled substance; not for weight loss.',
      condition: 'Moderate-to-severe binge eating disorder',
      drug_details: { drug: 'Lisdexamfetamine', dose: '50-70mg', route: 'PO daily' },
      contraindications: ['Concurrent MAOI use', 'Symptomatic cardiovascular disease', 'History of stimulant abuse'],
      provenance: { section: 'BED Treatment', page_or_location: 'Section 5.2' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.APA.EAT.2023.RF.01',
      display_id: 'APA-EAT-RF1',
      finding: 'Refeeding syndrome: hypophosphatemia, hypokalemia, hypomagnesemia with cardiac arrhythmia, edema, confusion, or respiratory distress during nutritional rehabilitation',
      implication: 'Can cause cardiac arrest and death within days of refeeding. Risk highest in first 5 days of nutritional rehabilitation in severely malnourished patients.',
      action: 'Check phosphate, potassium, magnesium before and daily during refeeding. Supplement aggressively. Slow caloric advancement. Telemetry monitoring.',
      urgency: 'immediate',
      provenance: { section: 'Refeeding Syndrome', page_or_location: 'Section 3.3' },
    },
    {
      flag_id: 'PACK.APA.EAT.2023.RF.02',
      display_id: 'APA-EAT-RF2',
      finding: 'Cardiac complications in anorexia: bradycardia <50, QTc prolongation, orthostatic hypotension, syncope',
      implication: 'Malnutrition causes myocardial atrophy and conduction abnormalities. Sudden cardiac death is leading cause of mortality in anorexia nervosa.',
      action: 'ECG monitoring, telemetry if QTc >500ms, electrolyte correction (K+, Mg2+), inpatient medical stabilization.',
      urgency: 'immediate',
      provenance: { section: 'Medical Complications', page_or_location: 'Section 3.4' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.APA.EAT.2023.SEV.01',
      display_id: 'APA-EAT-SEV1',
      level: 'Extreme anorexia nervosa (BMI <15)',
      criteria: [
        'BMI <15 kg/m2',
        'Vital sign instability (bradycardia <50, hypothermia <36C, orthostatic changes)',
        'Electrolyte abnormalities (hypokalemia, hypophosphatemia)',
        'Muscle wasting, lanugo hair, peripheral edema',
        'Unable to maintain weight with outpatient intervention',
      ],
      management_implications:
        'Mandatory inpatient medical stabilization. Refeeding protocol with daily electrolytes. Cardiac monitoring. Suicide risk assessment (AN has highest mortality of any psychiatric disorder). Nasogastric feeding if patient refuses oral intake. Target 1-2 kg/week weight gain.',
      provenance: { section: 'Severity and Disposition', page_or_location: 'Section 2.3' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 psychiatry pack for eating disorders. Covers AN (refeeding, FBT), BN (CBT + fluoxetine), BED (lisdexamfetamine), medical complications.',

  all_item_ids: [
    'PACK.APA.EAT.2023.REC.01', 'PACK.APA.EAT.2023.REC.02', 'PACK.APA.EAT.2023.REC.03',
    'PACK.APA.EAT.2023.DC.01', 'PACK.APA.EAT.2023.T.01', 'PACK.APA.EAT.2023.T.02',
    'PACK.APA.EAT.2023.TX.01', 'PACK.APA.EAT.2023.TX.02', 'PACK.APA.EAT.2023.TX.03',
    'PACK.APA.EAT.2023.RF.01', 'PACK.APA.EAT.2023.RF.02', 'PACK.APA.EAT.2023.SEV.01',
  ],
  all_display_ids: [
    'APA-EAT-R1', 'APA-EAT-R2', 'APA-EAT-R3',
    'APA-EAT-DC1',
    'APA-EAT-T1', 'APA-EAT-T2',
    'APA-EAT-TX1', 'APA-EAT-TX2', 'APA-EAT-TX3',
    'APA-EAT-RF1', 'APA-EAT-RF2',
    'APA-EAT-SEV1',
  ],
};
