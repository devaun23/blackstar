import type { SourcePack } from './types';

export const PACK_AAP_CROUP_2019: SourcePack = {
  source_pack_id: 'PACK.AAP.CROUP.2019',
  source_name: 'AAP/CPS 2019 Clinical Practice Guideline: Diagnosis and Management of Croup',
  source_registry_id: 'REG.AAP.CROUP',
  canonical_url: 'https://doi.org/10.1542/peds.2018-3587',
  publication_year: 2019,
  guideline_body: 'AAP',

  topic_tags: ['Croup', 'Laryngotracheobronchitis', 'Stridor', 'Epiglottitis', 'Pediatric Airway'],
  allowed_decision_scopes: [
    'croup diagnosis',
    'croup severity assessment',
    'corticosteroid therapy for croup',
    'racemic epinephrine indications',
    'croup vs epiglottitis differentiation',
    'discharge criteria after croup treatment',
  ],
  excluded_decision_scopes: [
    'bacterial tracheitis management',
    'foreign body aspiration',
    'subglottic stenosis',
    'recurrent croup workup beyond initial evaluation',
  ],

  recommendations: [
    {
      rec_id: 'PACK.AAP.CROUP.2019.REC.01',
      display_id: 'AAP-CROUP-R1',
      statement: 'A single dose of dexamethasone (0.6 mg/kg, max 10mg) should be administered to ALL children with croup, regardless of severity, including mild cases.',
      normalized_claim: 'Dexamethasone 0.6 mg/kg (max 10mg) single dose for ALL croup severity levels; reduces return visits, hospitalization, and symptom duration.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Corticosteroid Therapy', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.AAP.CROUP.2019.REC.02',
      display_id: 'AAP-CROUP-R2',
      statement: 'Nebulized racemic epinephrine (0.05 mL/kg of 2.25% solution, max 0.5 mL) should be administered for moderate-severe croup with significant stridor at rest.',
      normalized_claim: 'Racemic epinephrine nebulized for moderate-severe croup with stridor at rest; observe for >=2 hours post-administration for rebound.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Epinephrine', page_or_location: 'Section 3.2' },
    },
    {
      rec_id: 'PACK.AAP.CROUP.2019.REC.03',
      display_id: 'AAP-CROUP-R3',
      statement: 'Croup is a clinical diagnosis. Routine radiographs are NOT recommended. The classic steeple sign on AP neck X-ray is neither sensitive nor specific.',
      normalized_claim: 'Croup is diagnosed clinically (barky cough, inspiratory stridor, hoarseness). Routine X-ray not recommended; steeple sign is neither sensitive nor specific.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2.1' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.AAP.CROUP.2019.DC.01',
      display_id: 'AAP-CROUP-DC1',
      name: 'Croup vs Epiglottitis Differentiation',
      components: [
        'CROUP: Age 6 months to 3 years (peak), viral prodrome, gradual onset, barky cough, hoarse voice, low-grade fever, inspiratory stridor worse with agitation, prefers activity',
        'EPIGLOTTITIS: Age 2-7 years (pre-vaccine era), NO cough (or muffled), sudden onset, high fever (>39C), drooling, dysphagia, tripod position, toxic appearance, quiet stridor',
        'Epiglottitis is rare since Hib vaccine but can occur with other organisms (Group A Strep, S. aureus)',
      ],
      interpretation: 'Croup is common and manageable. Epiglottitis is a life-threatening emergency. If epiglottitis suspected: do NOT examine throat, keep child calm, prepare for emergent airway management.',
      normalized_claim: 'Croup: barky cough, gradual onset, low fever, child active. Epiglottitis: no cough, sudden, high fever, drooling, toxic, tripod position -- airway emergency.',
      provenance: { section: 'Differential Diagnosis', page_or_location: 'Section 2.3' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.AAP.CROUP.2019.T.01',
      display_id: 'AAP-CROUP-T1',
      parameter: 'Westley Croup Score for moderate severity',
      value: '3',
      unit: 'points (0-17 scale)',
      clinical_meaning: 'Westley score 0-2 = mild, 3-7 = moderate, 8-11 = severe, >=12 = impending respiratory failure. Score incorporates stridor, retractions, air entry, cyanosis, and consciousness.',
      normalized_claim: 'Westley croup score: 0-2 mild, 3-7 moderate (add racemic epinephrine), >=8 severe (consider ICU/intubation).',
      direction: 'above',
      provenance: { section: 'Severity Assessment', page_or_location: 'Section 2.2' },
    },
    {
      threshold_id: 'PACK.AAP.CROUP.2019.T.02',
      display_id: 'AAP-CROUP-T2',
      parameter: 'Observation time after racemic epinephrine',
      value: '2',
      unit: 'hours',
      clinical_meaning: 'Children must be observed >=2 hours after racemic epinephrine to monitor for rebound stridor. Effect wears off in 1-2 hours.',
      normalized_claim: 'Observe >=2 hours after racemic epinephrine for rebound stridor before discharge.',
      direction: 'above',
      provenance: { section: 'Epinephrine Monitoring', page_or_location: 'Section 3.2' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.AAP.CROUP.2019.TX.01',
      display_id: 'AAP-CROUP-TX1',
      action: 'Dexamethasone for all croup severity levels',
      normalized_claim: 'Dexamethasone 0.6 mg/kg (max 10mg) PO/IM single dose. Oral preferred if tolerated. Alternative: nebulized budesonide 2mg if unable to take PO/IM.',
      timing: 'At presentation',
      condition: 'All children with croup (mild, moderate, or severe)',
      drug_details: { drug: 'Dexamethasone', dose: '0.6 mg/kg (max 10mg)', route: 'PO preferred, IM if vomiting' },
      provenance: { section: 'Corticosteroid Therapy', page_or_location: 'Section 3.1' },
    },
    {
      step_id: 'PACK.AAP.CROUP.2019.TX.02',
      display_id: 'AAP-CROUP-TX2',
      action: 'Nebulized racemic epinephrine for moderate-severe croup',
      normalized_claim: 'Racemic epinephrine 2.25% (0.05 mL/kg, max 0.5 mL) nebulized for moderate-severe croup with stridor at rest. Effect onset 10-30 minutes, duration 1-2 hours.',
      timing: 'For moderate-severe croup with stridor at rest',
      condition: 'Moderate-severe croup (Westley >=3) with stridor at rest',
      drug_details: { drug: 'Racemic epinephrine', dose: '0.05 mL/kg of 2.25% (max 0.5 mL)', route: 'Nebulized' },
      escalation: 'If multiple doses needed or no improvement: consider ICU admission and possible intubation',
      provenance: { section: 'Epinephrine', page_or_location: 'Section 3.2' },
    },
    {
      step_id: 'PACK.AAP.CROUP.2019.TX.03',
      display_id: 'AAP-CROUP-TX3',
      action: 'Supportive care and discharge for mild croup',
      normalized_claim: 'Mild croup after dexamethasone: cool mist humidification (limited evidence but no harm), maintain hydration, comfort measures. Discharge with return precautions.',
      timing: 'After dexamethasone administration',
      condition: 'Mild croup (Westley 0-2) responding to dexamethasone',
      provenance: { section: 'Supportive Care', page_or_location: 'Section 3.3' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.AAP.CROUP.2019.RF.01',
      display_id: 'AAP-CROUP-RF1',
      finding: 'Suspected epiglottitis: sudden onset high fever, drooling, dysphagia, muffled voice, tripod posture, toxic appearance, quiet stridor',
      implication: 'Acute airway obstruction can occur at any moment. Mortality without airway management is significant.',
      action: 'Do NOT examine throat or agitate child. Keep child in position of comfort with parent. Call anesthesia/ENT for operating room intubation. Have surgical airway equipment ready. Lateral neck X-ray only if diagnosis uncertain and child stable.',
      urgency: 'immediate',
      provenance: { section: 'Epiglottitis', page_or_location: 'Section 5.1' },
    },
    {
      flag_id: 'PACK.AAP.CROUP.2019.RF.02',
      display_id: 'AAP-CROUP-RF2',
      finding: 'Croup with cyanosis, decreased level of consciousness, or minimal air entry despite treatment',
      implication: 'Impending complete airway obstruction and respiratory failure. Westley score >=12.',
      action: 'Emergent intubation (use ETT 0.5-1.0 size smaller than age-predicted). ICU admission. Heliox if available while preparing airway.',
      urgency: 'immediate',
      provenance: { section: 'Severe Croup', page_or_location: 'Section 4.1' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.AAP.CROUP.2019.SEV.01',
      display_id: 'AAP-CROUP-SEV1',
      level: 'Mild croup',
      criteria: [
        'Westley score 0-2',
        'Barky cough present',
        'No stridor at rest (only with agitation/crying)',
        'No or mild retractions',
        'Normal air entry',
        'No cyanosis, normal consciousness',
      ],
      management_implications:
        'Single dose dexamethasone 0.6 mg/kg PO. Discharge home after medication with return precautions. Educate parents: croup is worst at night, symptoms typically resolve in 3-7 days. Return for stridor at rest, difficulty breathing, drooling, or poor fluid intake.',
      provenance: { section: 'Severity Classification', page_or_location: 'Section 2.2' },
    },
    {
      severity_id: 'PACK.AAP.CROUP.2019.SEV.02',
      display_id: 'AAP-CROUP-SEV2',
      level: 'Moderate-severe croup',
      criteria: [
        'Westley score >=3',
        'Stridor at rest',
        'Moderate-severe retractions (suprasternal, intercostal, subcostal)',
        'Decreased air entry',
        'Agitation or lethargy in severe cases',
        'Cyanosis indicates impending respiratory failure',
      ],
      management_implications:
        'Dexamethasone 0.6 mg/kg + nebulized racemic epinephrine. Observe >=2 hours post-epinephrine. Admit if recurrent epinephrine needed or persistent stridor at rest. ICU for severe (Westley >=8) or impending respiratory failure. Consider intubation for Westley >=12.',
      provenance: { section: 'Severity Classification', page_or_location: 'Section 2.2' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Pediatrics pack for croup. Covers diagnosis, dexamethasone for all severity, racemic epinephrine for moderate-severe, epiglottitis differentiation.',

  all_item_ids: [
    'PACK.AAP.CROUP.2019.REC.01', 'PACK.AAP.CROUP.2019.REC.02', 'PACK.AAP.CROUP.2019.REC.03',
    'PACK.AAP.CROUP.2019.DC.01',
    'PACK.AAP.CROUP.2019.T.01', 'PACK.AAP.CROUP.2019.T.02',
    'PACK.AAP.CROUP.2019.TX.01', 'PACK.AAP.CROUP.2019.TX.02', 'PACK.AAP.CROUP.2019.TX.03',
    'PACK.AAP.CROUP.2019.RF.01', 'PACK.AAP.CROUP.2019.RF.02',
    'PACK.AAP.CROUP.2019.SEV.01', 'PACK.AAP.CROUP.2019.SEV.02',
  ],
  all_display_ids: [
    'AAP-CROUP-R1', 'AAP-CROUP-R2', 'AAP-CROUP-R3',
    'AAP-CROUP-DC1',
    'AAP-CROUP-T1', 'AAP-CROUP-T2',
    'AAP-CROUP-TX1', 'AAP-CROUP-TX2', 'AAP-CROUP-TX3',
    'AAP-CROUP-RF1', 'AAP-CROUP-RF2',
    'AAP-CROUP-SEV1', 'AAP-CROUP-SEV2',
  ],
};
