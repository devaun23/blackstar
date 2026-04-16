import type { SourcePack } from './types';

export const PACK_CDC_IMMUN_2024: SourcePack = {
  source_pack_id: 'PACK.CDC.IMMUN.2024',
  source_name: 'CDC/ACIP 2024 Recommended Child and Adolescent Immunization Schedule',
  source_registry_id: 'REG.CDC.IMMUN',
  canonical_url: 'https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html',
  publication_year: 2024,
  guideline_body: 'CDC/ACIP',

  topic_tags: ['Immunizations', 'Vaccines', 'Well-Child Care', 'Preventive Medicine', 'HPV', 'MMR'],
  allowed_decision_scopes: [
    'routine childhood immunization schedule',
    'catch-up immunization schedule',
    'live vaccine contraindications',
    'vaccine timing and minimum intervals',
    'adolescent immunization schedule',
    'immunocompromised child vaccine modifications',
  ],
  excluded_decision_scopes: [
    'adult immunization schedule',
    'travel vaccines',
    'vaccine manufacturing and adjuvants',
    'vaccine adverse event reporting details',
  ],

  recommendations: [
    {
      rec_id: 'PACK.CDC.IMMUN.2024.REC.01',
      display_id: 'CDC-IMMUN-R1',
      statement: 'Hepatitis B vaccine should be administered within 24 hours of birth for all medically stable newborns weighing >=2,000g.',
      normalized_claim: 'HepB vaccine dose 1 within 24 hours of birth for all newborns >=2kg; HBsAg-positive mothers require HBIG + HepB within 12 hours.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Birth Dose', page_or_location: 'Table 1, Footnote HepB' },
    },
    {
      rec_id: 'PACK.CDC.IMMUN.2024.REC.02',
      display_id: 'CDC-IMMUN-R2',
      statement: 'The primary series at 2, 4, and 6 months includes DTaP, IPV, Hib, PCV15, RV, and HepB. These vaccines may be given simultaneously at separate injection sites.',
      normalized_claim: 'Primary infant series (2/4/6 months): DTaP, IPV, Hib, PCV15, rotavirus, HepB; simultaneous administration is safe and recommended.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Infant Schedule', page_or_location: 'Table 1' },
    },
    {
      rec_id: 'PACK.CDC.IMMUN.2024.REC.03',
      display_id: 'CDC-IMMUN-R3',
      statement: 'MMR and varicella vaccines (or MMRV) should be administered at 12-15 months with a booster at 4-6 years. These are live vaccines and contraindicated in immunocompromised patients.',
      normalized_claim: 'MMR and varicella at 12-15 months, booster at 4-6 years. Live vaccines: contraindicated in severe immunodeficiency and pregnancy.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: '12-Month Vaccines', page_or_location: 'Table 1, Footnotes MMR/VAR' },
    },
    {
      rec_id: 'PACK.CDC.IMMUN.2024.REC.04',
      display_id: 'CDC-IMMUN-R4',
      statement: 'HPV vaccine is recommended at age 11-12 years (can start at age 9). Two-dose series if started before age 15; three-dose series if started at or after age 15.',
      normalized_claim: 'HPV vaccine at 11-12 years (may start at 9): 2 doses if <15yo at first dose (0, 6-12 months); 3 doses if >=15yo (0, 1-2, 6 months).',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Adolescent Schedule', page_or_location: 'Table 1, Footnote HPV' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.CDC.IMMUN.2024.DC.01',
      display_id: 'CDC-IMMUN-DC1',
      name: 'Contraindications to Live Vaccines (MMR, Varicella, LAIV, Rotavirus)',
      components: [
        'Severe immunodeficiency (primary immunodeficiency, HIV with CD4 <15%, chemotherapy, high-dose steroids >=2 mg/kg/day or >=20 mg/day prednisone for >=14 days)',
        'Pregnancy (for MMR, varicella)',
        'Severe allergic reaction (anaphylaxis) to previous dose or vaccine component',
        'For LAIV: asthma in children 2-4 years, immunocompromised close contacts',
        'For rotavirus: history of intussusception, SCID',
      ],
      interpretation: 'Inactivated vaccines are generally safe in immunocompromised patients but may have reduced efficacy. Live vaccines can cause disseminated disease in severely immunocompromised.',
      normalized_claim: 'Live vaccines (MMR, varicella, rotavirus, LAIV) contraindicated in severe immunodeficiency, pregnancy, and prior anaphylaxis to vaccine.',
      provenance: { section: 'Contraindications', page_or_location: 'Table 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.CDC.IMMUN.2024.T.01',
      display_id: 'CDC-IMMUN-T1',
      parameter: 'Minimum age for MMR vaccine',
      value: '12',
      unit: 'months',
      clinical_meaning: 'MMR should not be given before 12 months in routine schedule. In outbreak or international travel, can give as early as 6 months (dose 0, not counted toward series).',
      normalized_claim: 'Minimum age for routine MMR is 12 months; early dose at 6 months for travel/outbreak does not count toward 2-dose series.',
      direction: 'above',
      provenance: { section: 'Minimum Ages', page_or_location: 'Table 1, Footnote MMR' },
    },
    {
      threshold_id: 'PACK.CDC.IMMUN.2024.T.02',
      display_id: 'CDC-IMMUN-T2',
      parameter: 'HPV vaccine dose schedule age cutoff',
      value: '15',
      unit: 'years',
      clinical_meaning: 'HPV vaccine series is 2 doses if initiated before age 15, and 3 doses if initiated at age 15 or older.',
      normalized_claim: 'HPV 2-dose schedule if started <15 years; 3-dose schedule if started >=15 years.',
      direction: 'below',
      provenance: { section: 'HPV Dosing', page_or_location: 'Footnote HPV' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.CDC.IMMUN.2024.TX.01',
      display_id: 'CDC-IMMUN-TX1',
      action: 'Routine infant immunization series (2/4/6 months)',
      normalized_claim: 'At 2, 4, 6 months: DTaP, IPV, Hib, PCV15, rotavirus (2 or 3 doses per brand), HepB. Administer all simultaneously at separate sites.',
      timing: '2, 4, and 6 months of age',
      condition: 'Healthy infant following routine schedule',
      provenance: { section: 'Infant Schedule', page_or_location: 'Table 1' },
    },
    {
      step_id: 'PACK.CDC.IMMUN.2024.TX.02',
      display_id: 'CDC-IMMUN-TX2',
      action: 'Adolescent immunization platform (11-12 years)',
      normalized_claim: 'At 11-12 years: meningococcal ACWY (MenACWY) dose 1 (booster at 16), HPV series, Tdap booster. Annual influenza vaccine.',
      timing: '11-12 years of age',
      condition: 'Routine adolescent well-visit',
      provenance: { section: 'Adolescent Schedule', page_or_location: 'Table 1' },
    },
    {
      step_id: 'PACK.CDC.IMMUN.2024.TX.03',
      display_id: 'CDC-IMMUN-TX3',
      action: 'Catch-up immunization for under-immunized children',
      normalized_claim: 'Catch-up schedule uses minimum intervals between doses. Do not restart a series; continue from where left off regardless of time elapsed.',
      timing: 'At any visit when child found to be behind',
      condition: 'Child not up-to-date on immunizations',
      provenance: { section: 'Catch-Up Schedule', page_or_location: 'Table 2' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.CDC.IMMUN.2024.RF.01',
      display_id: 'CDC-IMMUN-RF1',
      finding: 'Anaphylaxis within 4 hours of vaccine administration (urticaria, angioedema, respiratory compromise, hypotension)',
      implication: 'True vaccine anaphylaxis contraindicates future doses of that vaccine. Must distinguish from vasovagal syncope or local reaction.',
      action: 'Epinephrine IM (0.01 mg/kg, max 0.3mg child), monitor minimum 15 minutes post-vaccination. Document reaction. Refer to allergist for component testing before future doses.',
      urgency: 'immediate',
      provenance: { section: 'Adverse Events', page_or_location: 'Contraindications Table' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.CDC.IMMUN.2024.SEV.01',
      display_id: 'CDC-IMMUN-SEV1',
      level: 'Severely immunocompromised child',
      criteria: [
        'Primary immunodeficiency (SCID, DiGeorge, etc.)',
        'HIV with CD4 <15% or CD4 count below age-specific threshold',
        'Active chemotherapy or radiation',
        'High-dose systemic corticosteroids (>=2 mg/kg/day or >=20 mg/day prednisone equivalent for >=14 days)',
        'Solid organ or hematopoietic stem cell transplant recipient',
      ],
      management_implications:
        'Contraindication to ALL live vaccines (MMR, varicella, rotavirus, LAIV, BCG, yellow fever). Inactivated vaccines should still be given on schedule but may have reduced immunogenicity. Household contacts should receive inactivated influenza (not LAIV). Refer to IDSA/CDC immunocompromised vaccination guidelines.',
      provenance: { section: 'Special Populations', page_or_location: 'Table 2, Immunocompromised' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Pediatrics pack for CDC immunization schedule. Covers routine childhood/adolescent vaccines, catch-up schedule, live vaccine contraindications, and immunocompromised modifications.',

  all_item_ids: [
    'PACK.CDC.IMMUN.2024.REC.01', 'PACK.CDC.IMMUN.2024.REC.02', 'PACK.CDC.IMMUN.2024.REC.03',
    'PACK.CDC.IMMUN.2024.REC.04', 'PACK.CDC.IMMUN.2024.DC.01',
    'PACK.CDC.IMMUN.2024.T.01', 'PACK.CDC.IMMUN.2024.T.02',
    'PACK.CDC.IMMUN.2024.TX.01', 'PACK.CDC.IMMUN.2024.TX.02', 'PACK.CDC.IMMUN.2024.TX.03',
    'PACK.CDC.IMMUN.2024.RF.01',
    'PACK.CDC.IMMUN.2024.SEV.01',
  ],
  all_display_ids: [
    'CDC-IMMUN-R1', 'CDC-IMMUN-R2', 'CDC-IMMUN-R3', 'CDC-IMMUN-R4',
    'CDC-IMMUN-DC1',
    'CDC-IMMUN-T1', 'CDC-IMMUN-T2',
    'CDC-IMMUN-TX1', 'CDC-IMMUN-TX2', 'CDC-IMMUN-TX3',
    'CDC-IMMUN-RF1',
    'CDC-IMMUN-SEV1',
  ],
};
