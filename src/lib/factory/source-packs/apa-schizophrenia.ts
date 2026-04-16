import type { SourcePack } from './types';

export const PACK_APA_SCZ_2020: SourcePack = {
  source_pack_id: 'PACK.APA.SCZ.2020',
  source_name: 'APA Practice Guidelines for the Treatment of Schizophrenia (3rd Edition)',
  source_registry_id: 'REG.APA.SCZ',
  canonical_url: 'https://doi.org/10.1176/appi.books.9780890424841',
  publication_year: 2020,
  guideline_body: 'APA',

  topic_tags: ['Schizophrenia', 'Antipsychotics', 'Clozapine', 'NMS', 'Psychosis', 'Psychiatry'],
  allowed_decision_scopes: [
    'schizophrenia diagnosis',
    'first-line antipsychotic selection',
    'treatment-resistant schizophrenia (clozapine)',
    'metabolic monitoring on antipsychotics',
    'NMS recognition and management',
    'negative symptom management',
    'long-acting injectable antipsychotics',
  ],
  excluded_decision_scopes: [
    'schizoaffective disorder specifics',
    'brief psychotic disorder',
    'delusional disorder management',
    'substance-induced psychosis beyond differential',
  ],

  recommendations: [
    {
      rec_id: 'PACK.APA.SCZ.2020.REC.01',
      display_id: 'APA-SCZ-R1',
      statement: 'Second-generation (atypical) antipsychotics are recommended as first-line treatment for schizophrenia due to lower risk of extrapyramidal symptoms compared to first-generation agents.',
      normalized_claim: 'Atypical antipsychotics (risperidone, olanzapine, quetiapine, aripiprazole) are first-line for schizophrenia.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Pharmacotherapy', page_or_location: 'Section 4.1' },
    },
    {
      rec_id: 'PACK.APA.SCZ.2020.REC.02',
      display_id: 'APA-SCZ-R2',
      statement: 'Clozapine is recommended for treatment-resistant schizophrenia, defined as failure to respond to >=2 adequate trials of different antipsychotics.',
      normalized_claim: 'Clozapine is the treatment of choice for treatment-resistant schizophrenia (failed >=2 antipsychotic trials).',
      strength: 'strong',
      evidence_quality: 'high',
      context: 'Requires REMS program enrollment and regular ANC monitoring due to agranulocytosis risk',
      provenance: { section: 'Treatment-Resistant Schizophrenia', page_or_location: 'Section 4.5' },
    },
    {
      rec_id: 'PACK.APA.SCZ.2020.REC.03',
      display_id: 'APA-SCZ-R3',
      statement: 'Long-acting injectable (LAI) antipsychotics should be considered for patients with recurrent non-adherence or frequent relapse.',
      normalized_claim: 'Long-acting injectable antipsychotics (paliperidone palmitate, aripiprazole lauroxil) for non-adherent patients or frequent relapse.',
      strength: 'conditional',
      evidence_quality: 'moderate',
      provenance: { section: 'Adherence Strategies', page_or_location: 'Section 4.3' },
    },
    {
      rec_id: 'PACK.APA.SCZ.2020.REC.04',
      display_id: 'APA-SCZ-R4',
      statement: 'Metabolic monitoring (fasting glucose, lipid panel, weight, waist circumference, blood pressure) should be performed at baseline, 3 months, and annually for all patients on antipsychotics.',
      normalized_claim: 'Metabolic monitoring (glucose, lipids, weight, BP) at baseline, 3 months, then annually on antipsychotics.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Monitoring', page_or_location: 'Section 4.7' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.APA.SCZ.2020.DC.01',
      display_id: 'APA-SCZ-DC1',
      name: 'DSM-5 Schizophrenia Criteria',
      components: [
        'Two or more of: delusions, hallucinations, disorganized speech, grossly disorganized or catatonic behavior, negative symptoms (diminished emotional expression, avolition)',
        'At least one must be delusions, hallucinations, or disorganized speech',
        'Continuous signs for >=6 months (including >=1 month of active-phase symptoms)',
        'Significant impairment in work, interpersonal relations, or self-care',
        'Schizoaffective disorder and mood disorders with psychotic features ruled out',
        'Not attributable to substance use or another medical condition',
      ],
      threshold: '>=2 core symptoms for >=6 months; >=1 month active phase',
      interpretation: 'Distinguishes from brief psychotic disorder (<1 month), schizophreniform (1-6 months), and schizoaffective disorder (concurrent mood episodes).',
      normalized_claim: 'Schizophrenia requires >=2 symptoms (including >=1 of delusions/hallucinations/disorganized speech) for >=6 months with >=1 month active phase.',
      provenance: { section: 'Diagnostic Criteria', page_or_location: 'DSM-5 Section II' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.APA.SCZ.2020.T.01',
      display_id: 'APA-SCZ-T1',
      parameter: 'Clozapine ANC monitoring threshold',
      value: '1500',
      unit: 'cells/microL',
      clinical_meaning: 'ANC must be >=1500/microL (general population) or >=1000/microL (benign ethnic neutropenia) before initiating and continuing clozapine. ANC <500 = discontinue.',
      normalized_claim: 'Clozapine requires ANC >=1500/microL (or >=1000 for BEN). ANC <500 mandates discontinuation.',
      direction: 'above',
      provenance: { section: 'Clozapine REMS', page_or_location: 'Section 4.5.2' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.APA.SCZ.2020.TX.01',
      display_id: 'APA-SCZ-TX1',
      action: 'First-line atypical antipsychotic for new-onset schizophrenia',
      normalized_claim: 'Start low-dose atypical antipsychotic (risperidone 2-6mg, aripiprazole 10-15mg, or olanzapine 10-20mg). Titrate over 2-4 weeks.',
      condition: 'First episode psychosis or new schizophrenia diagnosis',
      drug_details: { drug: 'Risperidone', dose: '2-6mg', route: 'PO daily' },
      provenance: { section: 'First-Episode Treatment', page_or_location: 'Section 4.1' },
    },
    {
      step_id: 'PACK.APA.SCZ.2020.TX.02',
      display_id: 'APA-SCZ-TX2',
      action: 'Clozapine for treatment-resistant schizophrenia',
      normalized_claim: 'Initiate clozapine after failure of >=2 adequate antipsychotic trials. Start 12.5mg, titrate slowly to 300-450mg/day. Monitor ANC weekly x6 months, then biweekly x6 months, then monthly.',
      condition: 'Treatment-resistant schizophrenia (failed >=2 antipsychotic trials at adequate dose x6 weeks)',
      drug_details: { drug: 'Clozapine', dose: '300-450mg/day target', route: 'PO divided' },
      contraindications: ['ANC <1500/microL', 'History of clozapine-induced agranulocytosis', 'Uncontrolled seizures'],
      provenance: { section: 'Clozapine', page_or_location: 'Section 4.5' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.APA.SCZ.2020.RF.01',
      display_id: 'APA-SCZ-RF1',
      finding: 'Neuroleptic malignant syndrome (NMS): fever >38C, severe rigidity (lead-pipe), altered mental status, autonomic instability (tachycardia, labile BP, diaphoresis), elevated CK',
      implication: 'Life-threatening reaction to antipsychotics. Mortality 10-20% if untreated. Can occur at any point during treatment.',
      action: 'Immediately discontinue antipsychotic. Aggressive cooling, IV hydration, dantrolene for rigidity, bromocriptine for dopaminergic support. ICU admission.',
      urgency: 'immediate',
      provenance: { section: 'Adverse Effects', page_or_location: 'Section 4.8' },
    },
    {
      flag_id: 'PACK.APA.SCZ.2020.RF.02',
      display_id: 'APA-SCZ-RF2',
      finding: 'Clozapine-associated agranulocytosis: ANC <500/microL with fever, sore throat, or signs of infection',
      implication: 'Life-threatening neutropenia. Most common in first 6 months of treatment.',
      action: 'Immediately discontinue clozapine (never rechallenge after agranulocytosis). Reverse isolation, broad-spectrum antibiotics, G-CSF. Hematology consult.',
      urgency: 'immediate',
      provenance: { section: 'Clozapine Safety', page_or_location: 'Section 4.5.3' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.APA.SCZ.2020.SEV.01',
      display_id: 'APA-SCZ-SEV1',
      level: 'First-episode psychosis',
      criteria: [
        'First presentation of psychotic symptoms meeting schizophrenia criteria',
        'No prior antipsychotic treatment',
        'Duration of untreated psychosis varies',
        'Often presents in late adolescence to early adulthood',
      ],
      management_implications:
        'Lower antipsychotic doses effective (higher sensitivity and side-effect risk). Start at half standard dose. Intensive psychosocial support (coordinated specialty care). Better prognosis with early treatment. Shorter duration of untreated psychosis correlates with better outcomes.',
      provenance: { section: 'First Episode', page_or_location: 'Section 4.1' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 psychiatry pack for schizophrenia. Covers DSM-5 diagnosis, atypical antipsychotics, clozapine, NMS, metabolic monitoring.',

  all_item_ids: [
    'PACK.APA.SCZ.2020.REC.01', 'PACK.APA.SCZ.2020.REC.02', 'PACK.APA.SCZ.2020.REC.03',
    'PACK.APA.SCZ.2020.REC.04', 'PACK.APA.SCZ.2020.DC.01', 'PACK.APA.SCZ.2020.T.01',
    'PACK.APA.SCZ.2020.TX.01', 'PACK.APA.SCZ.2020.TX.02', 'PACK.APA.SCZ.2020.RF.01',
    'PACK.APA.SCZ.2020.RF.02', 'PACK.APA.SCZ.2020.SEV.01',
  ],
  all_display_ids: [
    'APA-SCZ-R1', 'APA-SCZ-R2', 'APA-SCZ-R3', 'APA-SCZ-R4',
    'APA-SCZ-DC1',
    'APA-SCZ-T1',
    'APA-SCZ-TX1', 'APA-SCZ-TX2',
    'APA-SCZ-RF1', 'APA-SCZ-RF2',
    'APA-SCZ-SEV1',
  ],
};
