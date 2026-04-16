import type { SourcePack } from './types';

export const PACK_APA_ANXPTSD_2017: SourcePack = {
  source_pack_id: 'PACK.APA.ANXPTSD.2017',
  source_name: 'APA Practice Guidelines for PTSD (2017) and Anxiety Disorders Management',
  source_registry_id: 'REG.APA.ANXPTSD',
  canonical_url: 'https://doi.org/10.1176/appi.books.9780890424049',
  publication_year: 2017,
  guideline_body: 'APA',

  topic_tags: ['GAD', 'Panic Disorder', 'PTSD', 'Social Anxiety', 'OCD', 'Anxiety', 'Psychiatry'],
  allowed_decision_scopes: [
    'GAD diagnosis and first-line treatment',
    'panic disorder management',
    'PTSD pharmacotherapy and psychotherapy',
    'social anxiety disorder treatment',
    'OCD pharmacotherapy (high-dose SSRI, ERP)',
    'benzodiazepine precautions in anxiety',
    'prazosin for PTSD nightmares',
  ],
  excluded_decision_scopes: [
    'specific phobia management',
    'separation anxiety disorder',
    'selective mutism',
    'pediatric anxiety treatment',
  ],

  recommendations: [
    {
      rec_id: 'PACK.APA.ANXPTSD.2017.REC.01',
      display_id: 'APA-ANX-R1',
      statement: 'SSRIs and SNRIs are recommended as first-line pharmacotherapy for GAD, with CBT as first-line psychotherapy.',
      normalized_claim: 'SSRI or SNRI is first-line for GAD. CBT is first-line psychotherapy. Buspirone is an alternative.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'GAD Treatment', page_or_location: 'Section 3.1' },
    },
    {
      rec_id: 'PACK.APA.ANXPTSD.2017.REC.02',
      display_id: 'APA-ANX-R2',
      statement: 'Trauma-focused CBT (including prolonged exposure and cognitive processing therapy) is strongly recommended as first-line treatment for PTSD.',
      normalized_claim: 'Trauma-focused CBT (prolonged exposure or CPT) is first-line for PTSD, preferred over pharmacotherapy.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'PTSD Psychotherapy', page_or_location: 'Section 4.1' },
    },
    {
      rec_id: 'PACK.APA.ANXPTSD.2017.REC.03',
      display_id: 'APA-ANX-R3',
      statement: 'SSRIs (sertraline, paroxetine) and venlafaxine are recommended for PTSD pharmacotherapy when psychotherapy is unavailable or insufficient.',
      normalized_claim: 'Sertraline and paroxetine (FDA-approved) or venlafaxine for PTSD pharmacotherapy.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'PTSD Pharmacotherapy', page_or_location: 'Section 4.2' },
    },
    {
      rec_id: 'PACK.APA.ANXPTSD.2017.REC.04',
      display_id: 'APA-ANX-R4',
      statement: 'For OCD, SSRIs at higher-than-standard doses are first-line pharmacotherapy. Exposure and response prevention (ERP) is the first-line psychotherapy.',
      normalized_claim: 'OCD requires high-dose SSRI (e.g., fluoxetine 40-80mg, fluvoxamine 200-300mg) + ERP therapy. Standard SSRI doses often insufficient.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'OCD Treatment', page_or_location: 'Section 6.1' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.APA.ANXPTSD.2017.DC.01',
      display_id: 'APA-ANX-DC1',
      name: 'DSM-5 Generalized Anxiety Disorder',
      components: [
        'Excessive anxiety and worry about multiple events or activities, occurring more days than not for >=6 months',
        'Difficulty controlling the worry',
        '>=3 of: restlessness, easily fatigued, difficulty concentrating, irritability, muscle tension, sleep disturbance',
        'Causes clinically significant distress or functional impairment',
        'Not attributable to substance use, another medical condition, or better explained by another mental disorder',
      ],
      threshold: 'Excessive worry >=6 months + >=3 associated symptoms',
      interpretation: 'Distinguished from normal worry by pervasiveness (>=6 months), multiple domains, and functional impairment. Differentiate from panic disorder (episodic), social anxiety (social situations), and OCD (intrusive thoughts).',
      normalized_claim: 'GAD: excessive worry >=6 months about multiple domains + >=3 of 6 somatic/cognitive symptoms + functional impairment.',
      provenance: { section: 'Diagnostic Criteria', page_or_location: 'DSM-5 Section II' },
    },
    {
      criterion_id: 'PACK.APA.ANXPTSD.2017.DC.02',
      display_id: 'APA-ANX-DC2',
      name: 'DSM-5 PTSD Criteria (abbreviated)',
      components: [
        'Exposure to actual or threatened death, serious injury, or sexual violence (direct, witnessed, learned about, or repeated exposure)',
        'Intrusion symptoms: flashbacks, nightmares, distress at reminders',
        'Avoidance of trauma-related stimuli',
        'Negative alterations in cognition and mood',
        'Marked alterations in arousal and reactivity (hypervigilance, exaggerated startle, irritability, sleep disturbance)',
        'Duration >1 month; causes significant distress or impairment',
      ],
      threshold: 'Trauma exposure + symptoms from all 4 clusters for >1 month',
      interpretation: 'Distinguishes from acute stress disorder (<1 month). Delayed onset if symptoms begin >6 months post-trauma.',
      normalized_claim: 'PTSD requires trauma exposure + intrusion + avoidance + negative cognition/mood + arousal symptoms for >1 month.',
      provenance: { section: 'PTSD Diagnosis', page_or_location: 'DSM-5 Section II' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.APA.ANXPTSD.2017.T.01',
      display_id: 'APA-ANX-T1',
      parameter: 'GAD-7 score for moderate anxiety',
      value: '10',
      clinical_meaning: 'GAD-7 >=10 suggests moderate anxiety warranting further evaluation and treatment consideration. Score >=15 = severe anxiety.',
      normalized_claim: 'GAD-7 >=10 indicates moderate anxiety requiring treatment evaluation; >=15 = severe.',
      direction: 'above',
      provenance: { section: 'Screening', page_or_location: 'Section 2.1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.APA.ANXPTSD.2017.TX.01',
      display_id: 'APA-ANX-TX1',
      action: 'SSRI initiation for panic disorder',
      normalized_claim: 'Start SSRI at low dose for panic disorder (sertraline 25mg, then titrate to 50-200mg). Patients with panic are sensitive to activation; start low. Combine with CBT.',
      condition: 'Panic disorder diagnosis',
      drug_details: { drug: 'Sertraline', dose: '25mg initially, target 50-200mg', route: 'PO daily' },
      contraindications: ['Concurrent MAOI use'],
      provenance: { section: 'Panic Disorder', page_or_location: 'Section 5.1' },
    },
    {
      step_id: 'PACK.APA.ANXPTSD.2017.TX.02',
      display_id: 'APA-ANX-TX2',
      action: 'Prazosin for PTSD-related nightmares',
      normalized_claim: 'Prazosin (alpha-1 antagonist) 1-15mg at bedtime for PTSD-related nightmares and sleep disruption. Titrate slowly; monitor for orthostatic hypotension.',
      condition: 'PTSD with prominent trauma-related nightmares',
      drug_details: { drug: 'Prazosin', dose: '1-15mg at bedtime', route: 'PO' },
      contraindications: ['Symptomatic hypotension'],
      provenance: { section: 'PTSD Adjunctive Treatment', page_or_location: 'Section 4.3' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.APA.ANXPTSD.2017.RF.01',
      display_id: 'APA-ANX-RF1',
      finding: 'Acute suicidality or self-harm in context of PTSD, severe anxiety, or comorbid depression',
      implication: 'PTSD carries elevated suicide risk, especially with comorbid depression, substance use, or traumatic brain injury.',
      action: 'Immediate safety assessment, lethal means restriction, consider inpatient evaluation, crisis intervention.',
      urgency: 'immediate',
      provenance: { section: 'Safety', page_or_location: 'Section 2.3' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.APA.ANXPTSD.2017.SEV.01',
      display_id: 'APA-ANX-SEV1',
      level: 'Severe PTSD with dissociative features',
      criteria: [
        'Meets full PTSD criteria',
        'Dissociative symptoms: depersonalization (feeling detached from self) or derealization (surroundings feel unreal)',
        'Significant functional impairment across multiple domains',
        'Often comorbid with depression, substance use, or suicidality',
      ],
      management_implications:
        'Requires stabilization before trauma-focused therapy (phase-based approach). SSRI + psychotherapy. Avoid benzodiazepines (worsen dissociation, interfere with exposure therapy). Screen for suicidality at each visit.',
      provenance: { section: 'PTSD Severity', page_or_location: 'Section 4.4' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Phase 1 psychiatry pack for anxiety and PTSD. Covers GAD, panic, PTSD, social anxiety, OCD with first-line therapies.',

  all_item_ids: [
    'PACK.APA.ANXPTSD.2017.REC.01', 'PACK.APA.ANXPTSD.2017.REC.02', 'PACK.APA.ANXPTSD.2017.REC.03',
    'PACK.APA.ANXPTSD.2017.REC.04', 'PACK.APA.ANXPTSD.2017.DC.01', 'PACK.APA.ANXPTSD.2017.DC.02',
    'PACK.APA.ANXPTSD.2017.T.01', 'PACK.APA.ANXPTSD.2017.TX.01', 'PACK.APA.ANXPTSD.2017.TX.02',
    'PACK.APA.ANXPTSD.2017.RF.01', 'PACK.APA.ANXPTSD.2017.SEV.01',
  ],
  all_display_ids: [
    'APA-ANX-R1', 'APA-ANX-R2', 'APA-ANX-R3', 'APA-ANX-R4',
    'APA-ANX-DC1', 'APA-ANX-DC2',
    'APA-ANX-T1',
    'APA-ANX-TX1', 'APA-ANX-TX2',
    'APA-ANX-RF1',
    'APA-ANX-SEV1',
  ],
};
