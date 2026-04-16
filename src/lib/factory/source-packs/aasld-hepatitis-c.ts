import type { SourcePack } from './types';

export const PACK_AASLD_HEPC_2024: SourcePack = {
  source_pack_id: 'PACK.AASLD.HEPC.2024',
  source_name: 'AASLD/IDSA HCV Guidance: Recommendations for Testing, Managing, and Treating Hepatitis C',
  canonical_url: 'https://www.hcvguidelines.org',
  publication_year: 2024,
  guideline_body: 'AASLD/IDSA',

  topic_tags: ['Hepatitis C', 'HCV', 'DAA Therapy', 'Chronic Liver Disease', 'Cirrhosis', 'Gastroenterology', 'Infectious Disease'],
  allowed_decision_scopes: [
    'HCV screening recommendations',
    'HCV diagnosis (anti-HCV, HCV RNA)',
    'DAA regimen selection',
    'SVR definition and monitoring',
    'decompensated cirrhosis HCV treatment',
    'post-SVR HCC surveillance',
    'HCV treatment in special populations (renal, HIV coinfection)',
  ],
  excluded_decision_scopes: [
    'interferon-based HCV treatment (no longer recommended)',
    'HCV vaccine development',
    'liver transplant for HCV cirrhosis',
    'pediatric HCV management',
  ],

  recommendations: [
    {
      rec_id: 'PACK.AASLD.HEPC.2024.REC.01',
      display_id: 'AASLD-HEPC-R1',
      statement: 'Universal one-time HCV screening is recommended for all adults aged 18 and older, and for all pregnant persons during each pregnancy.',
      normalized_claim: 'Universal one-time HCV screening for all adults >=18; screen every pregnancy.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Screening', page_or_location: 'Section 1.1' },
    },
    {
      rec_id: 'PACK.AASLD.HEPC.2024.REC.02',
      display_id: 'AASLD-HEPC-R2',
      statement: 'All patients with chronic HCV should be treated with DAA therapy regardless of fibrosis stage, with rare exceptions (limited life expectancy <12 months from non-liver-related causes).',
      normalized_claim: 'All chronic HCV patients should receive DAA treatment regardless of fibrosis stage.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Treatment Indications', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.AASLD.HEPC.2024.REC.03',
      display_id: 'AASLD-HEPC-R3',
      statement: 'Pangenotypic DAA regimens (glecaprevir-pibrentasvir or sofosbuvir-velpatasvir) are recommended as preferred first-line treatment for treatment-naive patients without cirrhosis or with compensated cirrhosis.',
      normalized_claim: 'Glecaprevir-pibrentasvir (8 weeks) or sofosbuvir-velpatasvir (12 weeks) as first-line pangenotypic DAA for treatment-naive HCV.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Initial Treatment', page_or_location: 'Section 4.1' },
    },
    {
      rec_id: 'PACK.AASLD.HEPC.2024.REC.04',
      display_id: 'AASLD-HEPC-R4',
      statement: 'Patients with cirrhosis who achieve SVR should continue HCC surveillance with ultrasound every 6 months indefinitely, as HCC risk persists despite viral cure.',
      normalized_claim: 'Continue HCC surveillance (US q6 months) indefinitely after SVR in patients with cirrhosis; HCC risk persists despite cure.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Post-SVR Monitoring', page_or_location: 'Section 6.2' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.AASLD.HEPC.2024.DC.01',
      display_id: 'AASLD-HEPC-DC1',
      name: 'HCV Diagnosis Algorithm',
      components: [
        'Step 1: Anti-HCV antibody test (screening)',
        'Step 2: If anti-HCV positive, confirm with HCV RNA (quantitative)',
        'Anti-HCV+, HCV RNA+ = active HCV infection (acute or chronic)',
        'Anti-HCV+, HCV RNA- = resolved infection (spontaneous clearance or prior treatment) or false-positive antibody',
        'Anti-HCV-, HCV RNA+ = early acute infection (antibody not yet developed) or immunocompromised host',
      ],
      interpretation: 'HCV RNA is the definitive test for active infection. Anti-HCV antibody alone does not distinguish active from resolved infection. Genotype no longer required before pangenotypic DAA treatment.',
      normalized_claim: 'HCV diagnosis: anti-HCV screens, HCV RNA confirms active infection. Anti-HCV+ RNA- = resolved. Genotype testing not required for pangenotypic DAA.',
      provenance: { section: 'Diagnosis', page_or_location: 'Figure 1' },
    },
    {
      criterion_id: 'PACK.AASLD.HEPC.2024.DC.02',
      display_id: 'AASLD-HEPC-DC2',
      name: 'Sustained Virologic Response (SVR) Definition',
      components: [
        'SVR12: Undetectable HCV RNA at 12 weeks after completion of antiviral therapy',
        'SVR12 is considered a virologic cure (>99% concordance with long-term undetectable RNA)',
        'Anti-HCV antibody remains positive after SVR (does not indicate active infection)',
      ],
      interpretation: 'SVR12 = functional cure. Reinfection is possible but relapse after SVR12 is extremely rare (<1%). Anti-HCV antibody persists and should not be used to assess treatment response.',
      normalized_claim: 'SVR12 (undetectable HCV RNA 12 weeks post-treatment) = virologic cure. Anti-HCV remains positive after cure.',
      provenance: { section: 'Treatment Response', page_or_location: 'Section 5.1' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.AASLD.HEPC.2024.T.01',
      display_id: 'AASLD-HEPC-T1',
      parameter: 'HCV RNA for cure confirmation',
      value: 'undetectable',
      clinical_meaning: 'Undetectable HCV RNA at 12 weeks post-treatment (SVR12) confirms virologic cure. Lower limit of detection varies by assay (typically 12-15 IU/mL).',
      normalized_claim: 'Undetectable HCV RNA at 12 weeks post-treatment = SVR12 = cure.',
      direction: 'absent',
      provenance: { section: 'SVR Assessment', page_or_location: 'Section 5.1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.AASLD.HEPC.2024.TX.01',
      display_id: 'AASLD-HEPC-TX1',
      action: 'Treatment-naive without cirrhosis: Pangenotypic DAA',
      normalized_claim: 'Glecaprevir-pibrentasvir 3 tablets daily for 8 weeks OR sofosbuvir-velpatasvir 1 tablet daily for 12 weeks. No ribavirin needed.',
      timing: 'At diagnosis of chronic HCV',
      condition: 'Treatment-naive, no cirrhosis or compensated cirrhosis (Child-Pugh A)',
      drug_details: { drug: 'Glecaprevir-pibrentasvir', dose: '3 tablets (300/120mg) daily', route: 'PO', duration: '8 weeks' },
      contraindications: ['Decompensated cirrhosis (Child-Pugh B/C) — do not use protease inhibitor-containing regimens'],
      provenance: { section: 'Initial Treatment', page_or_location: 'Section 4.1' },
    },
    {
      step_id: 'PACK.AASLD.HEPC.2024.TX.02',
      display_id: 'AASLD-HEPC-TX2',
      action: 'Decompensated cirrhosis: Sofosbuvir-velpatasvir with ribavirin',
      normalized_claim: 'Decompensated cirrhosis (Child-Pugh B/C): sofosbuvir-velpatasvir + weight-based ribavirin for 12 weeks. Protease inhibitors (glecaprevir) contraindicated.',
      timing: 'At diagnosis, in coordination with hepatology/transplant',
      condition: 'HCV with decompensated cirrhosis (Child-Pugh B or C)',
      drug_details: { drug: 'Sofosbuvir-velpatasvir + ribavirin', dose: 'SOF/VEL 400/100mg daily + ribavirin weight-based', route: 'PO', duration: '12 weeks' },
      contraindications: ['Protease inhibitor-containing regimens (glecaprevir-pibrentasvir)', 'CrCl <30 for ribavirin'],
      provenance: { section: 'Decompensated Cirrhosis', page_or_location: 'Section 4.3' },
    },
    {
      step_id: 'PACK.AASLD.HEPC.2024.TX.03',
      display_id: 'AASLD-HEPC-TX3',
      action: 'Post-treatment: Confirm SVR12',
      normalized_claim: 'Check quantitative HCV RNA at 12 weeks after completing DAA therapy to confirm SVR. No further HCV monitoring needed if SVR12 achieved (unless reinfection risk).',
      timing: '12 weeks after last dose of DAA',
      condition: 'All patients completing DAA therapy',
      provenance: { section: 'Post-Treatment Monitoring', page_or_location: 'Section 5.1' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.AASLD.HEPC.2024.RF.01',
      display_id: 'AASLD-HEPC-RF1',
      finding: 'Decompensated cirrhosis (ascites, variceal bleeding, hepatic encephalopathy, jaundice) in patient with untreated or previously failed HCV',
      implication: 'MELD-based mortality risk. Protease inhibitor-containing DAA regimens are contraindicated. Transplant evaluation may be needed.',
      action: 'Treat with sofosbuvir-velpatasvir + ribavirin (no protease inhibitors). Refer to hepatology and transplant center. Manage complications (lactulose for HE, diuretics for ascites, variceal band ligation).',
      urgency: 'urgent',
      provenance: { section: 'Decompensated Cirrhosis', page_or_location: 'Section 4.3' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.AASLD.HEPC.2024.SEV.01',
      display_id: 'AASLD-HEPC-SEV1',
      level: 'Compensated cirrhosis (Child-Pugh A)',
      criteria: [
        'Cirrhosis on imaging or biopsy/elastography (F4)',
        'No history of decompensation (no ascites, variceal bleed, HE, jaundice)',
        'Normal or near-normal synthetic function',
        'Child-Pugh score 5-6',
      ],
      management_implications:
        'Can use any pangenotypic DAA regimen. Treatment duration may be extended to 12 weeks. HCC surveillance (US q6 months) must continue indefinitely even after SVR. Screen for varices with EGD.',
      provenance: { section: 'Compensated Cirrhosis', page_or_location: 'Section 4.2' },
    },
    {
      severity_id: 'PACK.AASLD.HEPC.2024.SEV.02',
      display_id: 'AASLD-HEPC-SEV2',
      level: 'Decompensated cirrhosis (Child-Pugh B/C)',
      criteria: [
        'Cirrhosis with at least one decompensating event',
        'Ascites, variceal hemorrhage, hepatic encephalopathy, or jaundice',
        'Child-Pugh score >=7',
        'MELD score often >=15',
      ],
      management_implications:
        'Protease inhibitor-containing DAAs contraindicated. Use sofosbuvir-velpatasvir + ribavirin. Concurrent transplant evaluation. MELD-based prioritization. HCC surveillance mandatory. Manage portal hypertension complications.',
      provenance: { section: 'Decompensated Cirrhosis', page_or_location: 'Section 4.3' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 pack for hepatitis C. Covers universal screening, diagnosis algorithm, pangenotypic DAA therapy, SVR definition, and decompensated cirrhosis management.',

  all_item_ids: [
    'PACK.AASLD.HEPC.2024.REC.01', 'PACK.AASLD.HEPC.2024.REC.02', 'PACK.AASLD.HEPC.2024.REC.03',
    'PACK.AASLD.HEPC.2024.REC.04',
    'PACK.AASLD.HEPC.2024.DC.01', 'PACK.AASLD.HEPC.2024.DC.02',
    'PACK.AASLD.HEPC.2024.T.01',
    'PACK.AASLD.HEPC.2024.TX.01', 'PACK.AASLD.HEPC.2024.TX.02', 'PACK.AASLD.HEPC.2024.TX.03',
    'PACK.AASLD.HEPC.2024.RF.01',
    'PACK.AASLD.HEPC.2024.SEV.01', 'PACK.AASLD.HEPC.2024.SEV.02',
  ],
  all_display_ids: [
    'AASLD-HEPC-R1', 'AASLD-HEPC-R2', 'AASLD-HEPC-R3', 'AASLD-HEPC-R4',
    'AASLD-HEPC-DC1', 'AASLD-HEPC-DC2',
    'AASLD-HEPC-T1',
    'AASLD-HEPC-TX1', 'AASLD-HEPC-TX2', 'AASLD-HEPC-TX3',
    'AASLD-HEPC-RF1',
    'AASLD-HEPC-SEV1', 'AASLD-HEPC-SEV2',
  ],
};
