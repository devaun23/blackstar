import type { SourcePack } from './types';

export const PACK_CDC_ADIMMUN_2024: SourcePack = {
  source_pack_id: 'PACK.CDC.ADIMMUN.2024',
  source_name: 'CDC Recommended Adult Immunization Schedule, United States, 2024',
  source_registry_id: 'REG.CDC.ADIMMUN',
  canonical_url: 'https://www.cdc.gov/vaccines/schedules/hcp/imz/adult.html',
  publication_year: 2024,
  guideline_body: 'CDC/ACIP',

  topic_tags: ['Immunization', 'Vaccines', 'Preventive Medicine', 'Adult Health', 'Immunocompromised'],
  allowed_decision_scopes: [
    'routine adult immunization schedule',
    'Tdap/Td booster timing',
    'influenza vaccine',
    'pneumococcal vaccine selection',
    'shingles vaccine (Shingrix)',
    'HPV catch-up vaccination',
    'hepatitis B catch-up vaccination',
    'immunocompromised patient modifications',
    'pregnancy vaccine recommendations',
  ],
  excluded_decision_scopes: [
    'pediatric immunization schedule',
    'travel vaccines',
    'occupational exposure post-exposure prophylaxis',
    'vaccine adverse event management',
  ],

  recommendations: [
    {
      rec_id: 'PACK.CDC.ADIMMUN.2024.REC.01',
      display_id: 'CDC-IMM-R1',
      statement: 'Tdap should be administered during each pregnancy (preferably 27-36 weeks gestation) regardless of prior vaccination. Td booster every 10 years for all adults.',
      normalized_claim: 'Tdap every pregnancy (weeks 27-36). Td or Tdap booster every 10 years for all adults.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Tetanus/Diphtheria/Pertussis', page_or_location: 'Table 1, Note 1' },
    },
    {
      rec_id: 'PACK.CDC.ADIMMUN.2024.REC.02',
      display_id: 'CDC-IMM-R2',
      statement: 'Annual influenza vaccination is recommended for all adults >=6 months of age. High-dose or adjuvanted formulations preferred for adults >=65.',
      normalized_claim: 'Annual influenza vaccine for all adults. High-dose or adjuvanted preferred for age >=65.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Influenza', page_or_location: 'Table 1, Note 2' },
    },
    {
      rec_id: 'PACK.CDC.ADIMMUN.2024.REC.03',
      display_id: 'CDC-IMM-R3',
      statement: 'Adults >=65 who have not previously received pneumococcal vaccine should receive PCV20 alone OR PCV15 followed by PPSV23 (at least 1 year later).',
      normalized_claim: 'Pneumococcal vaccine at age >=65: PCV20 alone or PCV15 + PPSV23 (>=1 year apart). Earlier for immunocompromised or chronic conditions.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Pneumococcal', page_or_location: 'Table 1, Note 3' },
    },
    {
      rec_id: 'PACK.CDC.ADIMMUN.2024.REC.04',
      display_id: 'CDC-IMM-R4',
      statement: 'Recombinant zoster vaccine (Shingrix) is recommended as 2 doses for all adults >=50 years, regardless of prior herpes zoster episode or prior Zostavax.',
      normalized_claim: 'Shingrix (2 doses, 2-6 months apart) for all adults >=50. Replaces Zostavax. Give even after prior shingles.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Zoster', page_or_location: 'Table 1, Note 6' },
    },
    {
      rec_id: 'PACK.CDC.ADIMMUN.2024.REC.05',
      display_id: 'CDC-IMM-R5',
      statement: 'HPV vaccine is recommended through age 26 for all individuals. Catch-up vaccination available for ages 27-45 through shared clinical decision-making.',
      normalized_claim: 'HPV vaccine (9-valent) for all through age 26. Shared decision for ages 27-45. Not recommended after 45.',
      strength: 'strong',
      evidence_quality: 'high',
      population: 'Adults through age 26 (routine); 27-45 (shared decision)',
      provenance: { section: 'HPV', page_or_location: 'Table 1, Note 5' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.CDC.ADIMMUN.2024.DC.01',
      display_id: 'CDC-IMM-DC1',
      name: 'Immunocompromised Status for Vaccine Modification',
      components: [
        'Primary immunodeficiency (e.g., combined variable immunodeficiency)',
        'HIV with CD4 <200 cells/microL',
        'Active chemotherapy or radiation for malignancy',
        'Solid organ transplant recipients on immunosuppression',
        'Chronic systemic corticosteroids (>=20mg prednisone/day for >=14 days)',
        'Biologic immunomodulators (TNF inhibitors, rituximab, etc.)',
      ],
      interpretation: 'Immunocompromised patients require modified schedules: avoid live vaccines (MMR, varicella, live influenza), may need additional doses of inactivated vaccines, and have different pneumococcal recommendations.',
      normalized_claim: 'Immunocompromised = no live vaccines (MMR, varicella, LAIV). Additional inactivated vaccine doses may be needed. Earlier pneumococcal vaccination.',
      provenance: { section: 'Special Populations', page_or_location: 'Table 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.CDC.ADIMMUN.2024.T.01',
      display_id: 'CDC-IMM-T1',
      parameter: 'Td/Tdap booster interval',
      value: '10',
      unit: 'years',
      clinical_meaning: 'Td or Tdap booster recommended every 10 years. For wound management: Td/Tdap if >5 years since last dose and wound is tetanus-prone.',
      normalized_claim: 'Td/Tdap booster every 10 years; give if >5 years for tetanus-prone wounds.',
      direction: 'range',
      provenance: { section: 'Tetanus', page_or_location: 'Table 1, Note 1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.CDC.ADIMMUN.2024.TX.01',
      display_id: 'CDC-IMM-TX1',
      action: 'Pneumococcal vaccination sequence for immunocompromised adults <65',
      normalized_claim: 'Immunocompromised adults <65: PCV20 alone or PCV15 followed by PPSV23 (>=8 weeks later, shorter interval than immunocompetent). Indications: asplenia, HIV, CKD, CSF leak, cochlear implant, immunosuppression.',
      condition: 'Immunocompromised adult or adult with high-risk condition, age 19-64',
      provenance: { section: 'Pneumococcal Special Populations', page_or_location: 'Table 2, Note 3' },
    },
    {
      step_id: 'PACK.CDC.ADIMMUN.2024.TX.02',
      display_id: 'CDC-IMM-TX2',
      action: 'Hepatitis B catch-up vaccination for unvaccinated adults',
      normalized_claim: 'Hep B catch-up for unvaccinated adults 19-59 (recommend) and >=60 with risk factors (shared decision). Options: 3-dose series (0, 1, 6 months) or 2-dose Heplisav-B (0, 1 month).',
      condition: 'Unvaccinated adult aged 19-59, or >=60 with risk factors',
      provenance: { section: 'Hepatitis B', page_or_location: 'Table 1, Note 8' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.CDC.ADIMMUN.2024.RF.01',
      display_id: 'CDC-IMM-RF1',
      finding: 'Administration of live vaccine (MMR, varicella, LAIV) to severely immunocompromised patient',
      implication: 'Live vaccines can cause disseminated infection in immunocompromised patients (e.g., disseminated varicella, vaccine-strain measles). Potentially fatal.',
      action: 'If administered inadvertently, monitor closely for vaccine-strain disease. Consult infectious disease. Document and report to VAERS.',
      urgency: 'urgent',
      provenance: { section: 'Contraindications', page_or_location: 'Table 2, General Notes' },
    },
    {
      flag_id: 'PACK.CDC.ADIMMUN.2024.RF.02',
      display_id: 'CDC-IMM-RF2',
      finding: 'Anaphylaxis to a vaccine component',
      implication: 'Prior anaphylaxis to a vaccine or its components is a contraindication to that vaccine. Different from local reactions or mild allergic reactions.',
      action: 'Do not administer the offending vaccine. Evaluate for component-specific allergy (e.g., egg, gelatin, neomycin, yeast). Allergy referral if needed. Document contraindication.',
      urgency: 'immediate',
      provenance: { section: 'Contraindications', page_or_location: 'General Precautions' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.CDC.ADIMMUN.2024.SEV.01',
      display_id: 'CDC-IMM-SEV1',
      level: 'Severely immunocompromised (modified vaccine schedule)',
      criteria: [
        'HIV with CD4 <200 cells/microL',
        'Active hematologic malignancy on chemotherapy',
        'Solid organ transplant <2 months post-transplant or on active rejection therapy',
        'HSCT recipient <2 years post-transplant or on immunosuppression for GVHD',
        'Primary immunodeficiency affecting T-cell or combined function',
      ],
      management_implications:
        'All live vaccines contraindicated. Inactivated vaccines may have reduced immunogenicity; additional doses often recommended. Household contacts should receive inactivated influenza (not LAIV). Check serologies to confirm immunity when possible. Timing of vaccination relative to immunosuppressive therapy matters.',
      provenance: { section: 'Immunocompromised', page_or_location: 'Table 2' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 preventive medicine pack for adult immunizations. Covers routine schedule, pregnancy, immunocompromised modifications.',

  all_item_ids: [
    'PACK.CDC.ADIMMUN.2024.REC.01', 'PACK.CDC.ADIMMUN.2024.REC.02', 'PACK.CDC.ADIMMUN.2024.REC.03',
    'PACK.CDC.ADIMMUN.2024.REC.04', 'PACK.CDC.ADIMMUN.2024.REC.05', 'PACK.CDC.ADIMMUN.2024.DC.01',
    'PACK.CDC.ADIMMUN.2024.T.01', 'PACK.CDC.ADIMMUN.2024.TX.01', 'PACK.CDC.ADIMMUN.2024.TX.02',
    'PACK.CDC.ADIMMUN.2024.RF.01', 'PACK.CDC.ADIMMUN.2024.RF.02', 'PACK.CDC.ADIMMUN.2024.SEV.01',
  ],
  all_display_ids: [
    'CDC-IMM-R1', 'CDC-IMM-R2', 'CDC-IMM-R3', 'CDC-IMM-R4', 'CDC-IMM-R5',
    'CDC-IMM-DC1',
    'CDC-IMM-T1',
    'CDC-IMM-TX1', 'CDC-IMM-TX2',
    'CDC-IMM-RF1', 'CDC-IMM-RF2',
    'CDC-IMM-SEV1',
  ],
};
