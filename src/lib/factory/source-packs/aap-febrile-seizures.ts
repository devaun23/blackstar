import type { SourcePack } from './types';

export const PACK_AAP_FSEZ_2011: SourcePack = {
  source_pack_id: 'PACK.AAP.FSEZ.2011',
  source_name: 'AAP 2011 Clinical Practice Guidelines: Febrile Seizures — Neurodiagnostic Evaluation and Management',
  source_registry_id: 'REG.AAP.FSEZ',
  canonical_url: 'https://doi.org/10.1542/peds.2010-3318',
  publication_year: 2011,
  guideline_body: 'AAP',

  topic_tags: ['Febrile Seizures', 'Pediatric Neurology', 'Seizures', 'Meningitis'],
  allowed_decision_scopes: [
    'simple vs complex febrile seizure classification',
    'neurodiagnostic workup for febrile seizures',
    'lumbar puncture decision in febrile seizures',
    'antiepileptic drug prophylaxis decision',
    'parental counseling for febrile seizures',
    'EEG and neuroimaging indications',
  ],
  excluded_decision_scopes: [
    'epilepsy management',
    'status epilepticus treatment',
    'neonatal seizures',
    'afebrile seizure workup',
  ],

  recommendations: [
    {
      rec_id: 'PACK.AAP.FSEZ.2011.REC.01',
      display_id: 'AAP-FSEZ-R1',
      statement: 'EEG should NOT be performed in the evaluation of a neurologically healthy child with a simple febrile seizure.',
      normalized_claim: 'EEG is NOT recommended after a simple febrile seizure; it does not predict recurrence or epilepsy risk.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Neurodiagnostic Evaluation', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.AAP.FSEZ.2011.REC.02',
      display_id: 'AAP-FSEZ-R2',
      statement: 'Neuroimaging (CT or MRI) should NOT be performed in the routine evaluation of a child with a simple febrile seizure.',
      normalized_claim: 'Routine neuroimaging is NOT indicated for simple febrile seizures.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Neurodiagnostic Evaluation', page_or_location: 'Section 3.2' },
    },
    {
      rec_id: 'PACK.AAP.FSEZ.2011.REC.03',
      display_id: 'AAP-FSEZ-R3',
      statement: 'Continuous or intermittent antiepileptic drug therapy is NOT recommended for children with simple febrile seizures. The risks of AEDs outweigh the benefits.',
      normalized_claim: 'Antiepileptic drug prophylaxis (continuous or intermittent) is NOT recommended for simple febrile seizures; risks outweigh benefits.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Treatment', page_or_location: 'Section 4.1' },
    },
    {
      rec_id: 'PACK.AAP.FSEZ.2011.REC.04',
      display_id: 'AAP-FSEZ-R4',
      statement: 'Lumbar puncture should be performed in any child with a febrile seizure who has meningeal signs or symptoms, or when clinical presentation suggests CNS infection.',
      normalized_claim: 'LP is indicated when meningeal signs are present or CNS infection is suspected; LP should be strongly considered in children 6-12 months who are unimmunized or incompletely immunized against Hib/pneumococcus.',
      strength: 'strong',
      evidence_quality: 'moderate',
      population: 'Children 6 months to 5 years with febrile seizures',
      provenance: { section: 'LP Decision', page_or_location: 'Section 2.2' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.AAP.FSEZ.2011.DC.01',
      display_id: 'AAP-FSEZ-DC1',
      name: 'Simple vs Complex Febrile Seizure Classification',
      components: [
        'SIMPLE: Generalized (not focal), duration <15 minutes, does not recur within 24 hours, child age 6 months to 5 years, no prior neurologic abnormality',
        'COMPLEX: Focal features, duration >=15 minutes, recurs within 24 hours, or occurs in child with prior neurologic abnormality',
      ],
      interpretation: 'Simple febrile seizures are benign and require minimal workup. Complex febrile seizures require more thorough evaluation and may warrant neuroimaging and EEG.',
      normalized_claim: 'Simple febrile seizure: generalized, <15 min, single in 24h, normal child. Complex: focal, >=15 min, recurrent in 24h, or neurologic abnormality.',
      provenance: { section: 'Classification', page_or_location: 'Section 1.1' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.AAP.FSEZ.2011.T.01',
      display_id: 'AAP-FSEZ-T1',
      parameter: 'Age range for febrile seizure diagnosis',
      value: '6 months to 5 years',
      clinical_meaning: 'Febrile seizures by definition occur in children 6 months to 5 years. Seizures with fever outside this age range require alternative diagnoses (e.g., meningitis, epilepsy).',
      normalized_claim: 'Febrile seizures occur in children 6 months to 5 years; seizures with fever outside this range are not classified as febrile seizures.',
      direction: 'range',
      provenance: { section: 'Definition', page_or_location: 'Section 1.1' },
    },
    {
      threshold_id: 'PACK.AAP.FSEZ.2011.T.02',
      display_id: 'AAP-FSEZ-T2',
      parameter: 'Seizure duration cutoff for simple vs complex',
      value: '15',
      unit: 'minutes',
      clinical_meaning: 'Seizure lasting >=15 minutes classifies as complex febrile seizure and warrants more extensive evaluation.',
      normalized_claim: 'Febrile seizure >=15 minutes is complex; requires evaluation for underlying etiology and potential neuroimaging.',
      direction: 'above',
      provenance: { section: 'Classification', page_or_location: 'Section 1.1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.AAP.FSEZ.2011.TX.01',
      display_id: 'AAP-FSEZ-TX1',
      action: 'Acute management of febrile seizure',
      normalized_claim: 'Acute febrile seizure: ensure airway/breathing, place on side, do not restrain. Most resolve spontaneously within 2-3 minutes. Benzodiazepines for seizure >5 minutes.',
      timing: 'During acute seizure',
      condition: 'Active febrile seizure',
      provenance: { section: 'Acute Management', page_or_location: 'Section 4.2' },
    },
    {
      step_id: 'PACK.AAP.FSEZ.2011.TX.02',
      display_id: 'AAP-FSEZ-TX2',
      action: 'Antipyretic therapy and parental education',
      normalized_claim: 'Antipyretics (acetaminophen, ibuprofen) for fever comfort but do NOT prevent febrile seizure recurrence. Parental education is the primary intervention.',
      timing: 'After seizure resolution',
      condition: 'Simple febrile seizure confirmed',
      provenance: { section: 'Treatment', page_or_location: 'Section 4.1' },
    },
    {
      step_id: 'PACK.AAP.FSEZ.2011.TX.03',
      display_id: 'AAP-FSEZ-TX3',
      action: 'Evaluation for meningitis in febrile seizure with concerning features',
      normalized_claim: 'LP for meningitis rule-out when: meningeal signs present, child appears ill, incompletely immunized (Hib/PCV), or pretreated with antibiotics.',
      timing: 'After seizure resolution and stabilization',
      condition: 'Clinical concern for meningitis or high-risk features',
      provenance: { section: 'LP Decision', page_or_location: 'Section 2.2' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.AAP.FSEZ.2011.RF.01',
      display_id: 'AAP-FSEZ-RF1',
      finding: 'Febrile seizure with meningeal signs (nuchal rigidity, Kernig, Brudzinski) or toxic appearance',
      implication: 'High suspicion for bacterial meningitis which can present initially as a febrile seizure.',
      action: 'Immediate LP (if no contraindications), blood cultures, empiric IV antibiotics (ceftriaxone + vancomycin). Do not delay antibiotics for LP.',
      urgency: 'immediate',
      provenance: { section: 'Meningitis Evaluation', page_or_location: 'Section 2.2' },
    },
    {
      flag_id: 'PACK.AAP.FSEZ.2011.RF.02',
      display_id: 'AAP-FSEZ-RF2',
      finding: 'Febrile status epilepticus: seizure lasting >30 minutes or recurrent seizures without return to baseline consciousness',
      implication: 'Risk of neuronal injury and underlying serious etiology. Requires aggressive treatment and broad evaluation.',
      action: 'Benzodiazepines (lorazepam or midazolam), second-line AED if refractory, neuroimaging after stabilization, LP to rule out meningitis/encephalitis.',
      urgency: 'immediate',
      provenance: { section: 'Complications', page_or_location: 'Section 5.1' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.AAP.FSEZ.2011.SEV.01',
      display_id: 'AAP-FSEZ-SEV1',
      level: 'Simple febrile seizure',
      criteria: [
        'Generalized tonic-clonic seizure',
        'Duration <15 minutes',
        'Single episode within 24 hours',
        'Child age 6 months to 5 years',
        'Neurologically normal before and after',
        'No CNS infection',
      ],
      management_implications:
        'Benign prognosis. No routine labs, EEG, neuroimaging, or AED prophylaxis. Parental education: ~30% recurrence risk, no increased risk of epilepsy or cognitive impairment. Antipyretics for comfort but do not prevent recurrence.',
      provenance: { section: 'Prognosis', page_or_location: 'Section 6.1' },
    },
    {
      severity_id: 'PACK.AAP.FSEZ.2011.SEV.02',
      display_id: 'AAP-FSEZ-SEV2',
      level: 'Complex febrile seizure',
      criteria: [
        'Focal onset or focal features during seizure',
        'Duration >=15 minutes',
        'Recurs within 24 hours',
        'Prolonged postictal state',
        'Or occurs in child with prior neurologic abnormality',
      ],
      management_implications:
        'More extensive evaluation warranted. Consider EEG and neuroimaging (MRI preferred). Evaluate for meningitis/encephalitis. Slightly higher risk of subsequent epilepsy (~2-4% vs 1% in general population). Follow-up with pediatric neurology recommended.',
      provenance: { section: 'Complex Febrile Seizures', page_or_location: 'Section 3.3' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Pediatrics pack for febrile seizures per AAP 2011 guidelines. Emphasizes benign nature of simple febrile seizures and avoidance of unnecessary testing/treatment.',

  all_item_ids: [
    'PACK.AAP.FSEZ.2011.REC.01', 'PACK.AAP.FSEZ.2011.REC.02', 'PACK.AAP.FSEZ.2011.REC.03',
    'PACK.AAP.FSEZ.2011.REC.04', 'PACK.AAP.FSEZ.2011.DC.01',
    'PACK.AAP.FSEZ.2011.T.01', 'PACK.AAP.FSEZ.2011.T.02',
    'PACK.AAP.FSEZ.2011.TX.01', 'PACK.AAP.FSEZ.2011.TX.02', 'PACK.AAP.FSEZ.2011.TX.03',
    'PACK.AAP.FSEZ.2011.RF.01', 'PACK.AAP.FSEZ.2011.RF.02',
    'PACK.AAP.FSEZ.2011.SEV.01', 'PACK.AAP.FSEZ.2011.SEV.02',
  ],
  all_display_ids: [
    'AAP-FSEZ-R1', 'AAP-FSEZ-R2', 'AAP-FSEZ-R3', 'AAP-FSEZ-R4',
    'AAP-FSEZ-DC1',
    'AAP-FSEZ-T1', 'AAP-FSEZ-T2',
    'AAP-FSEZ-TX1', 'AAP-FSEZ-TX2', 'AAP-FSEZ-TX3',
    'AAP-FSEZ-RF1', 'AAP-FSEZ-RF2',
    'AAP-FSEZ-SEV1', 'AAP-FSEZ-SEV2',
  ],
};
