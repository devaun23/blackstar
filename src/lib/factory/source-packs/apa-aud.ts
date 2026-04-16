import type { SourcePack } from './types';

export const PACK_APA_AUD_2018: SourcePack = {
  source_pack_id: 'PACK.APA.AUD.2018',
  source_name: 'APA Practice Guideline for the Pharmacological Treatment of Patients with Alcohol Use Disorder',
  source_registry_id: 'REG.APA.AUD',
  canonical_url: 'https://doi.org/10.1176/appi.ajp.2018.1750101',
  publication_year: 2018,
  guideline_body: 'APA',

  topic_tags: ['Alcohol Use Disorder', 'Alcohol Withdrawal', 'Delirium Tremens', 'Wernicke', 'Psychiatry'],
  allowed_decision_scopes: [
    'alcohol withdrawal assessment and management',
    'benzodiazepine protocol for withdrawal',
    'CIWA-Ar monitoring',
    'delirium tremens recognition',
    'thiamine administration',
    'relapse prevention pharmacotherapy',
    'Wernicke encephalopathy diagnosis',
  ],
  excluded_decision_scopes: [
    'alcoholic liver disease management',
    'alcohol-related cardiomyopathy',
    'fetal alcohol spectrum disorder',
    'social/behavioral interventions beyond pharmacotherapy',
  ],

  recommendations: [
    {
      rec_id: 'PACK.APA.AUD.2018.REC.01',
      display_id: 'APA-AUD-R1',
      statement: 'Naltrexone (oral or injectable) is recommended for relapse prevention in patients with moderate-to-severe AUD who have a goal of reducing or abstaining from alcohol use.',
      normalized_claim: 'Naltrexone (oral 50mg daily or IM 380mg monthly) is first-line for AUD relapse prevention.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Relapse Prevention', page_or_location: 'Section 4.1' },
    },
    {
      rec_id: 'PACK.APA.AUD.2018.REC.02',
      display_id: 'APA-AUD-R2',
      statement: 'Acamprosate is recommended as an alternative for relapse prevention, particularly in patients who cannot tolerate naltrexone or have hepatic impairment.',
      normalized_claim: 'Acamprosate is an alternative to naltrexone for AUD relapse prevention; preferred when hepatic impairment present.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Relapse Prevention', page_or_location: 'Section 4.2' },
    },
    {
      rec_id: 'PACK.APA.AUD.2018.REC.03',
      display_id: 'APA-AUD-R3',
      statement: 'Benzodiazepines are the gold standard for treatment of alcohol withdrawal syndrome. Symptom-triggered dosing (using CIWA-Ar) is preferred over fixed-schedule dosing.',
      normalized_claim: 'Benzodiazepines are first-line for alcohol withdrawal; symptom-triggered dosing via CIWA-Ar preferred over fixed schedule.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Withdrawal Management', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.APA.AUD.2018.REC.04',
      display_id: 'APA-AUD-R4',
      statement: 'Thiamine should be administered before or concurrent with glucose-containing fluids in all patients with suspected alcohol withdrawal to prevent Wernicke encephalopathy.',
      normalized_claim: 'Give thiamine before glucose in alcohol withdrawal to prevent Wernicke encephalopathy. IV thiamine 500mg TID x3 days for suspected Wernicke.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Nutritional Support', page_or_location: 'Section 3.3' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.APA.AUD.2018.DC.01',
      display_id: 'APA-AUD-DC1',
      name: 'Wernicke Encephalopathy Clinical Triad',
      components: [
        'Encephalopathy/confusion (altered mental status)',
        'Oculomotor dysfunction (nystagmus, lateral rectus palsy/CN VI palsy, conjugate gaze palsies)',
        'Cerebellar ataxia (wide-based gait)',
        'Classic triad present in only ~10-16% of cases; any one component with alcohol history warrants treatment',
      ],
      interpretation: 'Clinical diagnosis — do not wait for labs or imaging. Caused by thiamine (B1) deficiency. Untreated progresses to Korsakoff syndrome (irreversible amnesia with confabulation).',
      normalized_claim: 'Wernicke encephalopathy: confusion + oculomotor dysfunction + ataxia (full triad in only ~16%). Treat empirically with IV thiamine.',
      provenance: { section: 'Wernicke Encephalopathy', page_or_location: 'Section 3.4' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.APA.AUD.2018.T.01',
      display_id: 'APA-AUD-T1',
      parameter: 'CIWA-Ar score for benzodiazepine administration',
      value: '>=8',
      clinical_meaning: 'CIWA-Ar >=8 indicates moderate withdrawal requiring pharmacological treatment. Score >=20 indicates severe withdrawal with high seizure/DT risk.',
      normalized_claim: 'CIWA-Ar >=8 triggers benzodiazepine dosing. Score >=20 = severe withdrawal, high seizure/DT risk.',
      direction: 'above',
      provenance: { section: 'CIWA Protocol', page_or_location: 'Section 3.1' },
    },
    {
      threshold_id: 'PACK.APA.AUD.2018.T.02',
      display_id: 'APA-AUD-T2',
      parameter: 'Alcohol withdrawal seizure window',
      value: '12-48',
      unit: 'hours after last drink',
      clinical_meaning: 'Withdrawal seizures typically occur 12-48 hours after last drink. Generalized tonic-clonic. Brief, may cluster. Status epilepticus rare but possible.',
      normalized_claim: 'Alcohol withdrawal seizures peak 12-48h after last drink. Generalized tonic-clonic, may cluster.',
      direction: 'range',
      provenance: { section: 'Withdrawal Timeline', page_or_location: 'Section 3.2' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.APA.AUD.2018.TX.01',
      display_id: 'APA-AUD-TX1',
      action: 'Symptom-triggered benzodiazepine protocol for alcohol withdrawal',
      normalized_claim: 'Administer chlordiazepoxide 25-100mg or lorazepam 2-4mg when CIWA-Ar >=8. Reassess hourly. Lorazepam preferred in hepatic impairment (no hepatic metabolism).',
      condition: 'Alcohol withdrawal with CIWA-Ar score >=8',
      drug_details: { drug: 'Chlordiazepoxide', dose: '25-100mg', route: 'PO q4-6h PRN' },
      provenance: { section: 'Withdrawal Protocol', page_or_location: 'Section 3.1' },
    },
    {
      step_id: 'PACK.APA.AUD.2018.TX.02',
      display_id: 'APA-AUD-TX2',
      action: 'Naltrexone for AUD relapse prevention',
      normalized_claim: 'Start naltrexone 50mg PO daily (or 380mg IM monthly) after completing withdrawal. Reduces heavy drinking days and cravings. Contraindicated with active opioid use.',
      condition: 'Post-withdrawal AUD patient with goal of reduced drinking or abstinence',
      drug_details: { drug: 'Naltrexone', dose: '50mg', route: 'PO daily' },
      contraindications: ['Active opioid use or opioid dependence', 'Acute hepatitis or liver failure', 'Current opioid analgesic requirement'],
      provenance: { section: 'Relapse Prevention', page_or_location: 'Section 4.1' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.APA.AUD.2018.RF.01',
      display_id: 'APA-AUD-RF1',
      finding: 'Delirium tremens: confusion, visual hallucinations, agitation, tachycardia, hypertension, hyperthermia, diaphoresis, occurring 48-96 hours after last drink',
      implication: 'Mortality 5-15% without treatment. Medical emergency. Peak onset 48-96h but can occur up to 7 days after last drink.',
      action: 'ICU admission, high-dose IV benzodiazepines (diazepam 10-20mg IV q10-15min until calm), continuous monitoring, IV fluids, electrolyte repletion, thiamine.',
      urgency: 'immediate',
      provenance: { section: 'Delirium Tremens', page_or_location: 'Section 3.5' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.APA.AUD.2018.SEV.01',
      display_id: 'APA-AUD-SEV1',
      level: 'Severe alcohol withdrawal (high DT risk)',
      criteria: [
        'CIWA-Ar >=20',
        'History of prior withdrawal seizures or delirium tremens',
        'Heavy prolonged use (>10 drinks/day)',
        'Concurrent acute illness or comorbid medical conditions',
        'Markedly abnormal vitals (HR >120, SBP >180, fever >38.3C)',
      ],
      management_implications:
        'ICU-level monitoring. Aggressive benzodiazepine dosing (symptom-triggered with low threshold). IV access mandatory. Continuous telemetry. Anticipate DT onset 48-96h. Phenobarbital if benzodiazepine-resistant. Daily labs (BMP, Mg, Phos).',
      provenance: { section: 'Risk Stratification', page_or_location: 'Section 3.2' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 substance use pack for AUD. Covers withdrawal timeline, CIWA protocol, benzodiazepines, DT, thiamine, relapse prevention.',

  all_item_ids: [
    'PACK.APA.AUD.2018.REC.01', 'PACK.APA.AUD.2018.REC.02', 'PACK.APA.AUD.2018.REC.03',
    'PACK.APA.AUD.2018.REC.04', 'PACK.APA.AUD.2018.DC.01', 'PACK.APA.AUD.2018.T.01',
    'PACK.APA.AUD.2018.T.02', 'PACK.APA.AUD.2018.TX.01', 'PACK.APA.AUD.2018.TX.02',
    'PACK.APA.AUD.2018.RF.01', 'PACK.APA.AUD.2018.SEV.01',
  ],
  all_display_ids: [
    'APA-AUD-R1', 'APA-AUD-R2', 'APA-AUD-R3', 'APA-AUD-R4',
    'APA-AUD-DC1',
    'APA-AUD-T1', 'APA-AUD-T2',
    'APA-AUD-TX1', 'APA-AUD-TX2',
    'APA-AUD-RF1',
    'APA-AUD-SEV1',
  ],
};
