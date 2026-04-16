import type { SourcePack } from './types';

export const PACK_ASAM_OUD_2020: SourcePack = {
  source_pack_id: 'PACK.ASAM.OUD.2020',
  source_name: 'ASAM National Practice Guideline for the Treatment of Opioid Use Disorder (2020 Focused Update)',
  source_registry_id: 'REG.ASAM.OUD',
  canonical_url: 'https://doi.org/10.1097/ADM.0000000000000633',
  publication_year: 2020,
  guideline_body: 'ASAM',

  topic_tags: ['Opioid Use Disorder', 'Buprenorphine', 'Methadone', 'Naloxone', 'Substance Use', 'Psychiatry'],
  allowed_decision_scopes: [
    'opioid use disorder diagnosis',
    'medication for opioid use disorder (MOUD) selection',
    'buprenorphine induction',
    'methadone maintenance',
    'opioid overdose reversal',
    'opioid withdrawal management',
    'tobacco cessation pharmacotherapy',
    'stimulant use disorder management',
  ],
  excluded_decision_scopes: [
    'chronic pain management',
    'opioid prescribing guidelines',
    'neonatal abstinence syndrome treatment details',
    'cannabis use disorder',
  ],

  recommendations: [
    {
      rec_id: 'PACK.ASAM.OUD.2020.REC.01',
      display_id: 'ASAM-OUD-R1',
      statement: 'Medication for opioid use disorder (buprenorphine, methadone, or naltrexone) is the standard of care for OUD. Medication should be offered to all patients with moderate-to-severe OUD.',
      normalized_claim: 'MOUD (buprenorphine, methadone, or naltrexone) is standard of care for moderate-to-severe OUD.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Pharmacotherapy', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.ASAM.OUD.2020.REC.02',
      display_id: 'ASAM-OUD-R2',
      statement: 'Naloxone should be prescribed or dispensed to all patients with OUD and their close contacts for emergency reversal of opioid overdose.',
      normalized_claim: 'Prescribe naloxone to all OUD patients and close contacts for overdose reversal.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Harm Reduction', page_or_location: 'Section 5.1' },
    },
    {
      rec_id: 'PACK.ASAM.OUD.2020.REC.03',
      display_id: 'ASAM-OUD-R3',
      statement: 'Varenicline is the most effective pharmacotherapy for tobacco cessation, superior to nicotine replacement therapy alone.',
      normalized_claim: 'Varenicline is first-line for tobacco cessation; more effective than NRT monotherapy.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Tobacco Use Disorder', page_or_location: 'Section 6.1' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ASAM.OUD.2020.DC.01',
      display_id: 'ASAM-OUD-DC1',
      name: 'DSM-5 Opioid Use Disorder',
      components: [
        'Problematic opioid use leading to clinically significant impairment or distress',
        '>=2 of 11 criteria within 12-month period: larger amounts/longer than intended, persistent desire/unsuccessful efforts to cut down, excessive time obtaining/using/recovering, craving, failure to fulfill role obligations, continued use despite social problems, activities given up, use in hazardous situations, continued despite physical/psychological problems, tolerance, withdrawal',
        'Mild: 2-3 criteria; Moderate: 4-5 criteria; Severe: >=6 criteria',
      ],
      threshold: '>=2 of 11 criteria in 12 months',
      interpretation: 'Severity grading guides treatment intensity. Moderate-to-severe OUD strongly benefits from MOUD.',
      normalized_claim: 'OUD diagnosed by >=2 of 11 DSM-5 criteria in 12 months. Severity: mild (2-3), moderate (4-5), severe (>=6).',
      provenance: { section: 'Diagnosis', page_or_location: 'DSM-5 Section II' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.ASAM.OUD.2020.T.01',
      display_id: 'ASAM-OUD-T1',
      parameter: 'COWS score for buprenorphine induction',
      value: '>=8',
      clinical_meaning: 'Clinical Opiate Withdrawal Scale score >=8 indicates mild withdrawal; buprenorphine induction should begin when COWS >=8-12 to avoid precipitated withdrawal.',
      normalized_claim: 'Begin buprenorphine induction when COWS >=8-12 (mild withdrawal). Starting too early precipitates withdrawal.',
      direction: 'above',
      provenance: { section: 'Buprenorphine Induction', page_or_location: 'Section 3.2' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.ASAM.OUD.2020.TX.01',
      display_id: 'ASAM-OUD-TX1',
      action: 'Buprenorphine/naloxone induction for OUD',
      normalized_claim: 'Induce buprenorphine/naloxone when COWS >=8-12. Start 2-4mg, titrate to 8-16mg/day (max 24mg). Patient must be in withdrawal to avoid precipitated withdrawal.',
      condition: 'Opioid use disorder, patient in mild-moderate withdrawal (COWS >=8)',
      drug_details: { drug: 'Buprenorphine/naloxone', dose: '8-16mg/day sublingual', route: 'SL' },
      contraindications: ['Active sedative-hypnotic withdrawal', 'Severe hepatic impairment'],
      provenance: { section: 'Buprenorphine', page_or_location: 'Section 3.2' },
    },
    {
      step_id: 'PACK.ASAM.OUD.2020.TX.02',
      display_id: 'ASAM-OUD-TX2',
      action: 'Methadone maintenance for OUD',
      normalized_claim: 'Methadone for OUD: start 20-30mg/day, titrate to 60-120mg/day. Must be dispensed at federally certified OTP. Prevents withdrawal and reduces cravings.',
      condition: 'Opioid use disorder, especially severe OUD or buprenorphine-inadequate response',
      drug_details: { drug: 'Methadone', dose: '60-120mg/day target', route: 'PO daily at OTP' },
      contraindications: ['Severe respiratory depression', 'Acute bronchial asthma', 'Known QTc prolongation'],
      provenance: { section: 'Methadone', page_or_location: 'Section 3.3' },
    },
    {
      step_id: 'PACK.ASAM.OUD.2020.TX.03',
      display_id: 'ASAM-OUD-TX3',
      action: 'Naloxone for opioid overdose reversal',
      normalized_claim: 'Administer naloxone 0.4-2mg IV/IM/IN for opioid overdose (respiratory depression, pinpoint pupils, unresponsiveness). Repeat every 2-3 minutes. Short half-life requires monitoring for renarcotization.',
      timing: 'Immediately upon suspected opioid overdose',
      condition: 'Suspected opioid overdose with respiratory depression',
      drug_details: { drug: 'Naloxone', dose: '0.4-2mg', route: 'IV/IM/IN' },
      provenance: { section: 'Overdose Management', page_or_location: 'Section 5.1' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.ASAM.OUD.2020.RF.01',
      display_id: 'ASAM-OUD-RF1',
      finding: 'Opioid overdose: unresponsiveness, respiratory rate <12, pinpoint pupils, cyanosis',
      implication: 'Respiratory arrest and death within minutes without intervention.',
      action: 'Call emergency services, administer naloxone, initiate rescue breathing/CPR, continue monitoring (naloxone wears off in 30-90 min, may need repeat dosing).',
      urgency: 'immediate',
      provenance: { section: 'Overdose Recognition', page_or_location: 'Section 5.1' },
    },
    {
      flag_id: 'PACK.ASAM.OUD.2020.RF.02',
      display_id: 'ASAM-OUD-RF2',
      finding: 'Precipitated withdrawal: severe agitation, vomiting, diarrhea, piloerection, mydriasis occurring within minutes of buprenorphine administration',
      implication: 'Caused by giving buprenorphine (partial agonist) while full agonist still on receptors. Extremely uncomfortable, can cause treatment dropout.',
      action: 'Supportive care (clonidine, ondansetron, loperamide). Do not discontinue buprenorphine. Consider additional buprenorphine to saturate receptors.',
      urgency: 'urgent',
      provenance: { section: 'Buprenorphine Induction', page_or_location: 'Section 3.2.2' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.ASAM.OUD.2020.SEV.01',
      display_id: 'ASAM-OUD-SEV1',
      level: 'Severe opioid withdrawal',
      criteria: [
        'COWS score >=25',
        'Severe myalgias, abdominal cramping, profuse diarrhea',
        'Piloerection, rhinorrhea, lacrimation, yawning',
        'Tachycardia, hypertension, fever',
        'Severe anxiety, restlessness, insomnia',
      ],
      management_implications:
        'Initiate buprenorphine immediately (COWS well above threshold). Alternatively, comfort medications (clonidine, loperamide, dicyclomine, ondansetron). Methadone if inpatient setting available. IV fluids if dehydrated. Unlike alcohol/benzo withdrawal, opioid withdrawal is rarely life-threatening.',
      provenance: { section: 'Withdrawal Management', page_or_location: 'Section 2.3' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 substance use pack. Covers OUD (buprenorphine, methadone, naltrexone), overdose reversal, withdrawal, tobacco cessation.',

  all_item_ids: [
    'PACK.ASAM.OUD.2020.REC.01', 'PACK.ASAM.OUD.2020.REC.02', 'PACK.ASAM.OUD.2020.REC.03',
    'PACK.ASAM.OUD.2020.DC.01', 'PACK.ASAM.OUD.2020.T.01',
    'PACK.ASAM.OUD.2020.TX.01', 'PACK.ASAM.OUD.2020.TX.02', 'PACK.ASAM.OUD.2020.TX.03',
    'PACK.ASAM.OUD.2020.RF.01', 'PACK.ASAM.OUD.2020.RF.02', 'PACK.ASAM.OUD.2020.SEV.01',
  ],
  all_display_ids: [
    'ASAM-OUD-R1', 'ASAM-OUD-R2', 'ASAM-OUD-R3',
    'ASAM-OUD-DC1',
    'ASAM-OUD-T1',
    'ASAM-OUD-TX1', 'ASAM-OUD-TX2', 'ASAM-OUD-TX3',
    'ASAM-OUD-RF1', 'ASAM-OUD-RF2',
    'ASAM-OUD-SEV1',
  ],
};
