import type { SourcePack } from './types';

export const pack: SourcePack = {
  // ─── Identity ───
  source_pack_id: 'PACK.ACG.AP.2024',
  source_name: 'ACG Acute Pancreatitis Guidelines',
  canonical_url:
    'https://journals.lww.com/ajg/fulltext/2024/01000/american_college_of_gastroenterology_guidelines.14.aspx',
  publication_year: 2024,
  guideline_body: 'American College of Gastroenterology',

  // ─── Scope boundaries ───
  topic_tags: ['Acute Pancreatitis'],
  allowed_decision_scopes: [
    'diagnosis of acute pancreatitis',
    'severity classification',
    'fluid resuscitation',
    'pain management',
    'nutrition in acute pancreatitis',
    'ERCP indications',
    'cholecystectomy timing',
    'management of pancreatic necrosis',
  ],
  excluded_decision_scopes: [
    'chronic pancreatitis management',
    'pancreatic cancer screening',
    'exocrine insufficiency treatment',
  ],

  // ─── Recommendations ───
  recommendations: [
    {
      rec_id: 'PACK.ACG.AP.2024.REC.01',
      display_id: 'ACG-AP-R1',
      statement:
        'Diagnosis of acute pancreatitis requires 2 of 3 criteria: characteristic abdominal pain, serum lipase/amylase >3× ULN, and characteristic imaging findings.',
      normalized_claim:
        'Acute pancreatitis diagnosis requires at least 2 of 3: abdominal pain, lipase >3x ULN, imaging findings.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: {
        section: 'Diagnosis',
        page_or_location: 'Table 1',
        quote_snippet:
          'Diagnosis requires 2 of the following 3 criteria: (1) abdominal pain consistent with acute pancreatitis, (2) serum lipase or amylase ≥3 times the upper limit of normal, (3) characteristic findings on imaging.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.02',
      display_id: 'ACG-AP-R2',
      statement:
        'Lactated Ringer\'s solution is preferred over normal saline for initial fluid resuscitation in acute pancreatitis.',
      normalized_claim:
        'Use lactated Ringer\'s for initial fluid resuscitation in acute pancreatitis.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: {
        section: 'Fluid Resuscitation',
        page_or_location: 'Section 4',
        quote_snippet:
          'We recommend goal-directed fluid resuscitation with lactated Ringer\'s solution over normal saline.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.03',
      display_id: 'ACG-AP-R3',
      statement:
        'Aggressive fluid resuscitation (>250-500 mL/hr bolus) is not recommended and is associated with worse outcomes.',
      normalized_claim:
        'Aggressive fluid resuscitation is harmful in acute pancreatitis.',
      strength: 'strong',
      evidence_quality: 'moderate',
      context: 'Reversal of prior guidelines that recommended aggressive early hydration',
      provenance: {
        section: 'Fluid Resuscitation',
        page_or_location: 'Section 4',
        quote_snippet:
          'Aggressive fluid resuscitation has been associated with increased rates of organ failure, need for mechanical ventilation, and mortality.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.04',
      display_id: 'ACG-AP-R4',
      statement:
        'Early oral feeding (within 24 hours) with a low-fat solid diet is recommended as tolerated.',
      normalized_claim:
        'Early oral feeding within 24h is recommended in acute pancreatitis.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: {
        section: 'Nutrition',
        page_or_location: 'Section 6',
        quote_snippet:
          'Oral feeding should be initiated within 24 hours as tolerated, with a low-fat solid diet preferred.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.05',
      display_id: 'ACG-AP-R5',
      statement:
        'Enteral nutrition is strongly preferred over parenteral nutrition when oral intake is not feasible.',
      normalized_claim:
        'Enteral nutrition preferred over parenteral nutrition in acute pancreatitis.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: {
        section: 'Nutrition',
        page_or_location: 'Section 6',
        quote_snippet:
          'Enteral nutrition reduces infection rates, organ failure, and mortality compared with parenteral nutrition.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.06',
      display_id: 'ACG-AP-R6',
      statement:
        'Urgent ERCP (<24h) is indicated for acute cholangitis complicating gallstone pancreatitis.',
      normalized_claim:
        'Perform urgent ERCP within 24h for cholangitis in gallstone pancreatitis.',
      strength: 'strong',
      evidence_quality: 'moderate',
      context: 'Only when cholangitis is present — not for uncomplicated gallstone pancreatitis',
      provenance: {
        section: 'ERCP',
        page_or_location: 'Section 7',
        quote_snippet:
          'Urgent ERCP (within 24 hours) is recommended for patients with gallstone pancreatitis complicated by acute cholangitis.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.07',
      display_id: 'ACG-AP-R7',
      statement:
        'Same-admission cholecystectomy is recommended for mild gallstone pancreatitis to prevent recurrence.',
      normalized_claim:
        'Perform cholecystectomy during same admission for mild gallstone pancreatitis.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: {
        section: 'Cholecystectomy',
        page_or_location: 'Section 8',
        quote_snippet:
          'Cholecystectomy should be performed during the same admission for patients with mild gallstone pancreatitis.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.08',
      display_id: 'ACG-AP-R8',
      statement:
        'Prophylactic antibiotics are not recommended for acute pancreatitis, including severe/necrotizing disease.',
      normalized_claim:
        'Do not use prophylactic antibiotics in acute pancreatitis.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: {
        section: 'Antibiotics',
        page_or_location: 'Section 9',
        quote_snippet:
          'Prophylactic antibiotics are not recommended in acute pancreatitis regardless of severity or presence of sterile necrosis.',
      },
    },
    {
      rec_id: 'PACK.ACG.AP.2024.REC.09',
      display_id: 'ACG-AP-R9',
      statement:
        'Infected pancreatic necrosis should be managed with a step-up approach: antibiotics → percutaneous drainage → minimally invasive necrosectomy.',
      normalized_claim:
        'Use step-up approach for infected pancreatic necrosis.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: {
        section: 'Pancreatic Necrosis',
        page_or_location: 'Section 10',
        quote_snippet:
          'A step-up approach starting with antibiotics, followed by percutaneous drainage, and minimally invasive necrosectomy if needed.',
      },
    },
  ],

  // ─── Diagnostic Criteria ───
  diagnostic_criteria: [
    {
      criterion_id: 'PACK.ACG.AP.2024.DC.01',
      display_id: 'ACG-AP-DC1',
      name: 'Revised Atlanta Classification — Diagnostic Criteria',
      components: [
        'Characteristic abdominal pain (acute onset, severe, epigastric, often radiating to back)',
        'Serum lipase or amylase ≥3× upper limit of normal',
        'Characteristic findings on contrast-enhanced CT, MRI, or transabdominal ultrasound',
      ],
      threshold: '≥2 of 3 criteria',
      interpretation:
        'Meeting 2 of 3 criteria confirms diagnosis. CT is not required if clinical and biochemical criteria are met.',
      normalized_claim:
        'Acute pancreatitis requires 2 of 3: pain, lipase/amylase >3x ULN, imaging findings.',
      provenance: {
        section: 'Diagnosis',
        page_or_location: 'Table 1',
        quote_snippet:
          'The diagnosis of AP requires at least 2 of the following 3 criteria.',
      },
    },
  ],

  // ─── Thresholds ───
  thresholds: [
    {
      threshold_id: 'PACK.ACG.AP.2024.THRESH.01',
      display_id: 'ACG-AP-T1',
      parameter: 'Serum lipase',
      value: '>3× upper limit of normal',
      unit: 'U/L',
      clinical_meaning:
        'Confirms acute pancreatitis diagnosis (when combined with ≥1 other criterion)',
      normalized_claim:
        'Serum lipase >3x ULN confirms acute pancreatitis diagnosis.',
      direction: 'above',
      provenance: {
        section: 'Diagnosis',
        page_or_location: 'Table 1',
        quote_snippet:
          'serum lipase or amylase ≥3 times the upper limit of normal',
      },
    },
    {
      threshold_id: 'PACK.ACG.AP.2024.THRESH.02',
      display_id: 'ACG-AP-T2',
      parameter: 'Organ failure duration',
      value: '>48 hours',
      unit: 'hours',
      clinical_meaning:
        'Persistent organ failure (>48h) defines severe acute pancreatitis per Revised Atlanta.',
      normalized_claim:
        'Organ failure persisting >48h defines severe acute pancreatitis.',
      direction: 'above',
      provenance: {
        section: 'Severity Classification',
        page_or_location: 'Table 3',
        quote_snippet:
          'Severe: Persistent organ failure (>48 hours)',
      },
    },
    {
      threshold_id: 'PACK.ACG.AP.2024.THRESH.03',
      display_id: 'ACG-AP-T3',
      parameter: 'Fluid resuscitation rate',
      value: '1.5 mL/kg/hr',
      unit: 'mL/kg/hr',
      clinical_meaning:
        'Recommended initial fluid rate for goal-directed resuscitation with LR.',
      normalized_claim:
        'Initial fluid resuscitation rate is 1.5 mL/kg/hr with lactated Ringer\'s.',
      direction: 'range',
      provenance: {
        section: 'Fluid Resuscitation',
        page_or_location: 'Section 4',
        quote_snippet:
          'goal-directed fluid resuscitation at approximately 1.5 mL/kg/hr',
      },
    },
    {
      threshold_id: 'PACK.ACG.AP.2024.THRESH.04',
      display_id: 'ACG-AP-T4',
      parameter: 'BUN trend',
      value: 'Decreasing at 12-24h',
      clinical_meaning:
        'Decreasing BUN at 12-24h indicates adequate fluid resuscitation.',
      normalized_claim:
        'Decreasing BUN at 12-24h is a marker of adequate resuscitation.',
      direction: 'below',
      provenance: {
        section: 'Fluid Resuscitation',
        page_or_location: 'Section 4',
        quote_snippet:
          'BUN should be monitored at 12-24 hours as a marker of adequate resuscitation.',
      },
    },
  ],

  // ─── Treatment Steps ───
  treatment_steps: [
    {
      step_id: 'PACK.ACG.AP.2024.TX.01',
      display_id: 'ACG-AP-TX1',
      action: 'Goal-directed fluid resuscitation with lactated Ringer\'s',
      normalized_claim:
        'Use lactated Ringer\'s for initial fluid resuscitation in acute pancreatitis.',
      timing: 'First 24 hours',
      condition: 'Mild to moderate acute pancreatitis',
      drug_details: {
        drug: 'Lactated Ringer\'s',
        dose: '1.5 mL/kg/hr',
        route: 'IV',
        duration: 'First 24h, then titrate',
      },
      provenance: {
        section: 'Fluid Resuscitation',
        page_or_location: 'Section 4',
      },
    },
    {
      step_id: 'PACK.ACG.AP.2024.TX.02',
      display_id: 'ACG-AP-TX2',
      action: 'Early oral feeding with low-fat solid diet',
      normalized_claim:
        'Start oral feeding within 24h with low-fat solid diet.',
      timing: 'Within 24 hours of admission',
      condition: 'Patient able to tolerate oral intake',
      provenance: {
        section: 'Nutrition',
        page_or_location: 'Section 6',
      },
    },
    {
      step_id: 'PACK.ACG.AP.2024.TX.03',
      display_id: 'ACG-AP-TX3',
      action: 'Enteral nutrition via nasojejunal or nasogastric tube',
      normalized_claim:
        'Use enteral nutrition when oral intake not feasible in acute pancreatitis.',
      condition: 'Unable to tolerate oral intake',
      escalation: 'If enteral not feasible, consider TPN as last resort',
      provenance: {
        section: 'Nutrition',
        page_or_location: 'Section 6',
      },
    },
    {
      step_id: 'PACK.ACG.AP.2024.TX.04',
      display_id: 'ACG-AP-TX4',
      action: 'Urgent ERCP for cholangitis complicating gallstone pancreatitis',
      normalized_claim:
        'Perform urgent ERCP within 24h for cholangitis in gallstone pancreatitis.',
      timing: 'Within 24 hours',
      condition: 'Gallstone pancreatitis WITH cholangitis',
      contraindications: [
        'Uncomplicated mild gallstone pancreatitis without cholangitis or persistent biliary obstruction',
      ],
      provenance: {
        section: 'ERCP',
        page_or_location: 'Section 7',
      },
    },
    {
      step_id: 'PACK.ACG.AP.2024.TX.05',
      display_id: 'ACG-AP-TX5',
      action:
        'Same-admission cholecystectomy for mild gallstone pancreatitis',
      normalized_claim:
        'Perform cholecystectomy during same admission for mild gallstone pancreatitis.',
      condition: 'Mild gallstone pancreatitis (no necrosis)',
      provenance: {
        section: 'Cholecystectomy',
        page_or_location: 'Section 8',
      },
    },
    {
      step_id: 'PACK.ACG.AP.2024.TX.06',
      display_id: 'ACG-AP-TX6',
      action:
        'Step-up approach for infected necrosis: antibiotics → percutaneous drainage → necrosectomy',
      normalized_claim:
        'Use step-up approach for infected pancreatic necrosis.',
      condition: 'Infected pancreatic necrosis (confirmed or suspected)',
      provenance: {
        section: 'Pancreatic Necrosis',
        page_or_location: 'Section 10',
      },
    },
  ],

  // ─── Red Flags ───
  red_flags: [
    {
      flag_id: 'PACK.ACG.AP.2024.RF.01',
      display_id: 'ACG-AP-RF1',
      finding: 'Organ failure persisting >48 hours',
      implication: 'Severe acute pancreatitis per Revised Atlanta Classification',
      action: 'ICU admission, close monitoring, consider intervention for complications',
      urgency: 'immediate',
      provenance: {
        section: 'Severity Classification',
        page_or_location: 'Table 3',
      },
    },
    {
      flag_id: 'PACK.ACG.AP.2024.RF.02',
      display_id: 'ACG-AP-RF2',
      finding: 'Rising BUN despite fluid resuscitation',
      implication: 'Inadequate resuscitation or developing complications',
      action: 'Reassess volume status, check for third-spacing, evaluate for organ dysfunction',
      urgency: 'urgent',
      provenance: {
        section: 'Fluid Resuscitation',
        page_or_location: 'Section 4',
      },
    },
    {
      flag_id: 'PACK.ACG.AP.2024.RF.03',
      display_id: 'ACG-AP-RF3',
      finding: 'SIRS criteria met at admission',
      implication: 'Predicts higher severity and worse outcomes',
      action: 'Close monitoring, consider ICU-level care, reassess at 48h',
      urgency: 'urgent',
      provenance: {
        section: 'Prognostication',
        page_or_location: 'Section 3',
      },
    },
  ],

  // ─── Severity Definitions ───
  severity_definitions: [
    {
      severity_id: 'PACK.ACG.AP.2024.SEV.01',
      display_id: 'ACG-AP-SEV1',
      level: 'Mild',
      criteria: [
        'No organ failure',
        'No local complications',
        'No systemic complications',
      ],
      management_implications:
        'General ward admission. Early feeding. Same-admission cholecystectomy if gallstone etiology.',
      provenance: {
        section: 'Severity Classification',
        page_or_location: 'Table 3',
      },
    },
    {
      severity_id: 'PACK.ACG.AP.2024.SEV.02',
      display_id: 'ACG-AP-SEV2',
      level: 'Moderately Severe',
      criteria: [
        'Transient organ failure (<48 hours)',
        'OR local complications (peripancreatic fluid collections, necrosis) without persistent organ failure',
      ],
      management_implications:
        'May require ICU monitoring. Enteral nutrition if oral not tolerated. Watch for progression to severe.',
      provenance: {
        section: 'Severity Classification',
        page_or_location: 'Table 3',
      },
    },
    {
      severity_id: 'PACK.ACG.AP.2024.SEV.03',
      display_id: 'ACG-AP-SEV3',
      level: 'Severe',
      criteria: ['Persistent organ failure (>48 hours)'],
      management_implications:
        'ICU admission mandatory. High mortality risk. Consider interventional approaches for complications.',
      provenance: {
        section: 'Severity Classification',
        page_or_location: 'Table 3',
      },
    },
  ],

  // ─── Lifecycle ───
  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-03-11',
  normalizer_version: 1,
  normalization_notes:
    'Normalized from ACG 2024 guideline. Fluid resuscitation rates reflect the 2024 shift away from aggressive hydration. Revised Atlanta Classification used for severity. Lipase >3× ULN is the primary diagnostic threshold for board purposes.',

  // ─── Citation Index ───
  all_item_ids: [
    'PACK.ACG.AP.2024.REC.01',
    'PACK.ACG.AP.2024.REC.02',
    'PACK.ACG.AP.2024.REC.03',
    'PACK.ACG.AP.2024.REC.04',
    'PACK.ACG.AP.2024.REC.05',
    'PACK.ACG.AP.2024.REC.06',
    'PACK.ACG.AP.2024.REC.07',
    'PACK.ACG.AP.2024.REC.08',
    'PACK.ACG.AP.2024.REC.09',
    'PACK.ACG.AP.2024.DC.01',
    'PACK.ACG.AP.2024.THRESH.01',
    'PACK.ACG.AP.2024.THRESH.02',
    'PACK.ACG.AP.2024.THRESH.03',
    'PACK.ACG.AP.2024.THRESH.04',
    'PACK.ACG.AP.2024.TX.01',
    'PACK.ACG.AP.2024.TX.02',
    'PACK.ACG.AP.2024.TX.03',
    'PACK.ACG.AP.2024.TX.04',
    'PACK.ACG.AP.2024.TX.05',
    'PACK.ACG.AP.2024.TX.06',
    'PACK.ACG.AP.2024.RF.01',
    'PACK.ACG.AP.2024.RF.02',
    'PACK.ACG.AP.2024.RF.03',
    'PACK.ACG.AP.2024.SEV.01',
    'PACK.ACG.AP.2024.SEV.02',
    'PACK.ACG.AP.2024.SEV.03',
  ],
  all_display_ids: [
    'ACG-AP-R1',
    'ACG-AP-R2',
    'ACG-AP-R3',
    'ACG-AP-R4',
    'ACG-AP-R5',
    'ACG-AP-R6',
    'ACG-AP-R7',
    'ACG-AP-R8',
    'ACG-AP-R9',
    'ACG-AP-DC1',
    'ACG-AP-T1',
    'ACG-AP-T2',
    'ACG-AP-T3',
    'ACG-AP-T4',
    'ACG-AP-TX1',
    'ACG-AP-TX2',
    'ACG-AP-TX3',
    'ACG-AP-TX4',
    'ACG-AP-TX5',
    'ACG-AP-TX6',
    'ACG-AP-RF1',
    'ACG-AP-RF2',
    'ACG-AP-RF3',
    'ACG-AP-SEV1',
    'ACG-AP-SEV2',
    'ACG-AP-SEV3',
  ],
};
