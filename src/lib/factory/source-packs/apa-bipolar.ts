import type { SourcePack } from './types';

export const PACK_APA_BPD_2023: SourcePack = {
  source_pack_id: 'PACK.APA.BPD.2023',
  source_name: 'APA Practice Guidelines for the Treatment of Bipolar Disorder (3rd Edition)',
  source_registry_id: 'REG.APA.BPD',
  canonical_url: 'https://doi.org/10.1176/appi.books.9780890424988',
  publication_year: 2023,
  guideline_body: 'APA',

  topic_tags: ['Bipolar Disorder', 'Mania', 'Lithium', 'Mood Stabilizer', 'Psychiatry'],
  allowed_decision_scopes: [
    'bipolar I vs bipolar II differentiation',
    'acute mania pharmacotherapy',
    'bipolar depression management',
    'mood stabilizer selection',
    'lithium monitoring',
    'antidepressant precautions in bipolar disorder',
    'maintenance therapy',
  ],
  excluded_decision_scopes: [
    'unipolar depression management',
    'cyclothymic disorder specifics',
    'pediatric bipolar disorder',
    'substance-induced bipolar symptoms',
  ],

  recommendations: [
    {
      rec_id: 'PACK.APA.BPD.2023.REC.01',
      display_id: 'APA-BPD-R1',
      statement: 'Lithium is recommended as first-line monotherapy for classic euphoric mania and for long-term maintenance in bipolar I disorder.',
      normalized_claim: 'Lithium is first-line for classic euphoric mania and bipolar I maintenance.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Acute Mania', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.APA.BPD.2023.REC.02',
      display_id: 'APA-BPD-R2',
      statement: 'Valproate (divalproex) is an alternative first-line agent for acute mania, particularly mixed episodes or rapid cycling.',
      normalized_claim: 'Valproate is first-line alternative for acute mania, preferred for mixed features or rapid cycling.',
      strength: 'strong',
      evidence_quality: 'high',
      context: 'Contraindicated in pregnancy (teratogen); monitor LFTs and CBC',
      provenance: { section: 'Acute Mania', page_or_location: 'Section 3.2' },
    },
    {
      rec_id: 'PACK.APA.BPD.2023.REC.03',
      display_id: 'APA-BPD-R3',
      statement: 'Antidepressant monotherapy should be avoided in bipolar disorder due to risk of inducing mania or rapid cycling. If antidepressants are used, they must be combined with a mood stabilizer.',
      normalized_claim: 'Avoid antidepressant monotherapy in bipolar disorder; risk of triggering mania. Always pair with mood stabilizer.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Bipolar Depression', page_or_location: 'Section 4.2' },
    },
    {
      rec_id: 'PACK.APA.BPD.2023.REC.04',
      display_id: 'APA-BPD-R4',
      statement: 'Atypical antipsychotics (quetiapine, olanzapine, aripiprazole) are effective for acute mania and may be used as monotherapy or adjunctive therapy.',
      normalized_claim: 'Atypical antipsychotics (quetiapine, olanzapine, aripiprazole) effective as monotherapy or adjunct for acute mania.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Acute Mania', page_or_location: 'Section 3.3' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.APA.BPD.2023.DC.01',
      display_id: 'APA-BPD-DC1',
      name: 'DSM-5 Manic Episode Criteria',
      components: [
        'Distinct period of abnormally and persistently elevated, expansive, or irritable mood AND increased goal-directed activity or energy',
        'Lasting >=1 week (or any duration if hospitalization required)',
        '>=3 of: inflated self-esteem/grandiosity, decreased need for sleep, pressured speech, flight of ideas, distractibility, increased goal-directed activity or psychomotor agitation, excessive involvement in risky activities',
        'Mood disturbance causes marked impairment, necessitates hospitalization, or includes psychotic features',
        'Not attributable to substance use or another medical condition',
      ],
      threshold: '>=3 symptoms (>=4 if mood is only irritable) for >=1 week with functional impairment',
      interpretation: 'One manic episode is sufficient for bipolar I diagnosis. Distinguishes from hypomania (bipolar II) by duration >=1 week and functional impairment or psychosis.',
      normalized_claim: 'Manic episode: elevated/irritable mood + increased energy for >=1 week with >=3 DIGFAST symptoms and functional impairment. One episode = bipolar I.',
      provenance: { section: 'Diagnostic Criteria', page_or_location: 'DSM-5 Section II' },
    },
    {
      criterion_id: 'PACK.APA.BPD.2023.DC.02',
      display_id: 'APA-BPD-DC2',
      name: 'Bipolar II vs Bipolar I Distinction',
      components: [
        'Bipolar I: at least one manic episode (>=1 week or hospitalized); may have depressive episodes',
        'Bipolar II: at least one hypomanic episode (>=4 days, no marked impairment) AND at least one major depressive episode',
        'Bipolar II is never diagnosed if a full manic episode has occurred',
      ],
      interpretation: 'Bipolar II is not a milder form — depression burden is often greater. Key distinction is mania (I) vs hypomania (II).',
      normalized_claim: 'Bipolar I requires >=1 manic episode. Bipolar II requires hypomania (>=4 days, no impairment) + major depression. Prior mania excludes bipolar II.',
      provenance: { section: 'Classification', page_or_location: 'DSM-5 Section II' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.APA.BPD.2023.T.01',
      display_id: 'APA-BPD-T1',
      parameter: 'Therapeutic lithium level',
      value: '0.6-1.2',
      unit: 'mEq/L',
      clinical_meaning: 'Therapeutic range for lithium in acute mania (0.8-1.2) and maintenance (0.6-1.0). Levels >1.5 mEq/L are toxic.',
      normalized_claim: 'Lithium therapeutic level 0.6-1.2 mEq/L; toxicity at >1.5 mEq/L.',
      direction: 'range',
      provenance: { section: 'Lithium Monitoring', page_or_location: 'Section 3.1.2' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.APA.BPD.2023.TX.01',
      display_id: 'APA-BPD-TX1',
      action: 'Initiate lithium for acute mania',
      normalized_claim: 'Start lithium for acute mania; target serum level 0.8-1.2 mEq/L. Check BMP, TSH, calcium, ECG before starting.',
      condition: 'Acute manic episode in bipolar I disorder',
      drug_details: { drug: 'Lithium carbonate', dose: '900-1800mg/day divided', route: 'PO' },
      contraindications: ['Severe renal impairment', 'Severe dehydration', 'Significant cardiac disease'],
      provenance: { section: 'Acute Mania Treatment', page_or_location: 'Section 3.1' },
    },
    {
      step_id: 'PACK.APA.BPD.2023.TX.02',
      display_id: 'APA-BPD-TX2',
      action: 'Quetiapine for bipolar depression',
      normalized_claim: 'Quetiapine (300mg/day) is first-line for acute bipolar depression (both bipolar I and II).',
      condition: 'Acute bipolar depressive episode',
      drug_details: { drug: 'Quetiapine', dose: '300mg', route: 'PO daily at bedtime' },
      contraindications: ['Uncontrolled diabetes'],
      provenance: { section: 'Bipolar Depression', page_or_location: 'Section 4.1' },
    },
    {
      step_id: 'PACK.APA.BPD.2023.TX.03',
      display_id: 'APA-BPD-TX3',
      action: 'Lithium monitoring schedule',
      normalized_claim: 'Monitor lithium levels, renal function (BMP/creatinine), and thyroid (TSH) every 6 months during maintenance. Check level 12h post-dose.',
      timing: 'Every 6 months during maintenance; more frequently during titration',
      condition: 'Patient on lithium maintenance therapy',
      provenance: { section: 'Monitoring', page_or_location: 'Section 3.1.2' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.APA.BPD.2023.RF.01',
      display_id: 'APA-BPD-RF1',
      finding: 'Lithium toxicity: coarse tremor, ataxia, slurred speech, vomiting, altered mental status at levels >1.5 mEq/L',
      implication: 'Can progress to seizures, renal failure, and death. Often precipitated by dehydration, NSAIDs, ACE inhibitors, or thiazide diuretics.',
      action: 'Hold lithium, aggressive IV hydration, check level, consider hemodialysis if level >2.5 or severe symptoms.',
      urgency: 'immediate',
      provenance: { section: 'Lithium Toxicity', page_or_location: 'Section 3.1.3' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.APA.BPD.2023.SEV.01',
      display_id: 'APA-BPD-SEV1',
      level: 'Severe mania with psychotic features',
      criteria: [
        'Meets full manic episode criteria',
        'Presence of delusions (often grandiose) or hallucinations',
        'Severely impaired judgment and functioning',
        'May include dangerous behavior (spending sprees, sexual indiscretions, violent behavior)',
        'Unable to care for self',
      ],
      management_implications:
        'Requires inpatient hospitalization. Mood stabilizer + antipsychotic combination. ECT if refractory. Capacity assessment. Involuntary hold if danger to self/others.',
      provenance: { section: 'Severity Classification', page_or_location: 'Section 3.4' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 psychiatry pack for bipolar disorder. Covers bipolar I vs II, lithium, valproate, antidepressant precautions, monitoring.',

  all_item_ids: [
    'PACK.APA.BPD.2023.REC.01', 'PACK.APA.BPD.2023.REC.02', 'PACK.APA.BPD.2023.REC.03',
    'PACK.APA.BPD.2023.REC.04', 'PACK.APA.BPD.2023.DC.01', 'PACK.APA.BPD.2023.DC.02',
    'PACK.APA.BPD.2023.T.01', 'PACK.APA.BPD.2023.TX.01', 'PACK.APA.BPD.2023.TX.02',
    'PACK.APA.BPD.2023.TX.03', 'PACK.APA.BPD.2023.RF.01', 'PACK.APA.BPD.2023.SEV.01',
  ],
  all_display_ids: [
    'APA-BPD-R1', 'APA-BPD-R2', 'APA-BPD-R3', 'APA-BPD-R4',
    'APA-BPD-DC1', 'APA-BPD-DC2',
    'APA-BPD-T1',
    'APA-BPD-TX1', 'APA-BPD-TX2', 'APA-BPD-TX3',
    'APA-BPD-RF1',
    'APA-BPD-SEV1',
  ],
};
