import type { SourcePack } from './types';

export const PACK_WSES_SBO_2017: SourcePack = {
  source_pack_id: 'PACK.WSES.SBO.2017',
  source_name: 'WSES 2017 Guidelines for Management of Adhesive Small Bowel Obstruction',
  canonical_url: 'https://doi.org/10.1186/s13017-017-0185-z',
  publication_year: 2017,
  guideline_body: 'WSES',

  topic_tags: ['Small Bowel Obstruction', 'Adhesive SBO', 'Acute Abdomen', 'Surgery'],
  allowed_decision_scopes: [
    'SBO diagnosis and imaging',
    'adhesive vs non-adhesive SBO differentiation',
    'partial vs complete obstruction',
    'CT signs of strangulation',
    'water-soluble contrast challenge',
    'surgical indications for SBO',
    'conservative management duration',
  ],
  excluded_decision_scopes: [
    'large bowel obstruction',
    'paralytic ileus management',
    'malignant bowel obstruction palliation',
    'pediatric intussusception',
  ],

  recommendations: [
    {
      rec_id: 'PACK.WSES.SBO.2017.REC.01',
      display_id: 'WSES-SBO-R1',
      statement: 'CT with IV contrast is the imaging modality of choice for suspected SBO. It differentiates partial from complete obstruction, identifies the transition point, and detects signs of strangulation.',
      normalized_claim: 'CT with IV contrast is first-line imaging for SBO. Identifies transition point, completeness, and strangulation signs.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2' },
    },
    {
      rec_id: 'PACK.WSES.SBO.2017.REC.02',
      display_id: 'WSES-SBO-R2',
      statement: 'Water-soluble contrast (Gastrografin) challenge is both diagnostic and therapeutic for adhesive SBO. If contrast reaches the colon within 4-24 hours, non-operative management will likely succeed.',
      normalized_claim: 'Gastrografin challenge: contrast in colon at 4-24h predicts non-operative resolution. Also has therapeutic osmotic effect.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Conservative Management', page_or_location: 'Section 3' },
    },
    {
      rec_id: 'PACK.WSES.SBO.2017.REC.03',
      display_id: 'WSES-SBO-R3',
      statement: 'Surgery is indicated for SBO with signs of strangulation, peritonitis, complete obstruction unresponsive to conservative management, or failure to resolve after 72 hours of non-operative management.',
      normalized_claim: 'Operate for SBO when: strangulation signs, peritonitis, complete obstruction not resolving, or failure of conservative management >72 hours.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Surgical Management', page_or_location: 'Section 4' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.WSES.SBO.2017.DC.01',
      display_id: 'WSES-SBO-DC1',
      name: 'CT Signs of Bowel Strangulation in SBO',
      components: [
        'Mesenteric haziness/edema (mesenteric fat stranding)',
        'Reduced or absent bowel wall enhancement',
        'Closed-loop configuration (C-shaped or U-shaped dilated loop with convergence of mesentery)',
        'Mesenteric vascular engorgement ("whirl sign")',
        'Free fluid, especially if hemorrhagic (high-density)',
        'Pneumatosis intestinalis or portal venous gas (late findings)',
      ],
      interpretation: 'Any combination of these findings raises concern for bowel strangulation/ischemia, mandating surgical exploration. Reduced wall enhancement and closed-loop are most specific.',
      normalized_claim: 'CT strangulation signs in SBO: mesenteric haziness, reduced wall enhancement, closed-loop, whirl sign. These mandate surgical exploration.',
      provenance: { section: 'Imaging', page_or_location: 'Section 2' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.WSES.SBO.2017.T.01',
      display_id: 'WSES-SBO-T1',
      parameter: 'Duration of conservative management before surgery',
      value: '72',
      unit: 'hours',
      clinical_meaning: 'Adhesive SBO not resolving after 72 hours of conservative management (NGT decompression, IV fluids, NPO) should undergo surgical exploration. Continued conservative management beyond this point increases morbidity.',
      normalized_claim: 'Adhesive SBO failing to resolve after 72 hours of conservative management requires surgical intervention.',
      direction: 'above',
      provenance: { section: 'Conservative Management', page_or_location: 'Section 3' },
    },
    {
      threshold_id: 'PACK.WSES.SBO.2017.T.02',
      display_id: 'WSES-SBO-T2',
      parameter: 'Water-soluble contrast challenge time to colon',
      value: '4-24',
      unit: 'hours',
      clinical_meaning: 'Gastrografin reaching the colon within 4-24 hours on follow-up abdominal X-ray predicts successful non-operative resolution of adhesive SBO with high sensitivity and specificity.',
      normalized_claim: 'Gastrografin in colon at 4-24 hours = non-operative resolution predicted. Absent at 24-36h = likely need surgery.',
      direction: 'range',
      provenance: { section: 'Water-Soluble Contrast', page_or_location: 'Section 3' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.WSES.SBO.2017.TX.01',
      display_id: 'WSES-SBO-TX1',
      action: 'Conservative management for partial adhesive SBO',
      normalized_claim: 'Partial adhesive SBO without strangulation: NPO, nasogastric tube decompression, IV fluid resuscitation, serial abdominal exams. Gastrografin challenge at 24-48 hours if not resolving.',
      timing: 'Initial management for up to 72 hours',
      condition: 'Partial adhesive SBO without strangulation or peritonitis',
      provenance: { section: 'Conservative Management', page_or_location: 'Section 3' },
    },
    {
      step_id: 'PACK.WSES.SBO.2017.TX.02',
      display_id: 'WSES-SBO-TX2',
      action: 'Surgical exploration for SBO with strangulation',
      normalized_claim: 'SBO with strangulation signs: emergent surgical exploration (laparoscopic or open). Assess bowel viability intraoperatively. Resect non-viable bowel with primary anastomosis if conditions permit.',
      timing: 'Emergent — do not delay',
      condition: 'SBO with CT signs of strangulation, peritonitis, or hemodynamic instability',
      provenance: { section: 'Surgical Management', page_or_location: 'Section 4' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.WSES.SBO.2017.RF.01',
      display_id: 'WSES-SBO-RF1',
      finding: 'Closed-loop obstruction with reduced bowel wall enhancement on CT',
      implication: 'High likelihood of bowel ischemia/strangulation. Closed-loop cannot resolve spontaneously. Progresses to perforation.',
      action: 'Emergent surgical exploration. Do not attempt conservative management or Gastrografin challenge.',
      urgency: 'immediate',
      provenance: { section: 'Imaging', page_or_location: 'Section 2' },
    },
    {
      flag_id: 'PACK.WSES.SBO.2017.RF.02',
      display_id: 'WSES-SBO-RF2',
      finding: 'Pneumatosis intestinalis or portal venous gas in setting of SBO',
      implication: 'Indicates transmural bowel necrosis. Late and ominous finding with high mortality.',
      action: 'Emergent laparotomy for bowel resection. Resuscitation and broad-spectrum antibiotics.',
      urgency: 'immediate',
      provenance: { section: 'Imaging', page_or_location: 'Section 2' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.WSES.SBO.2017.SEV.01',
      display_id: 'WSES-SBO-SEV1',
      level: 'Partial Adhesive SBO without Strangulation',
      criteria: [
        'Dilated small bowel proximal to transition point',
        'Decompressed bowel distal to transition point',
        'No CT signs of strangulation',
        'Air or contrast still passing distally',
        'No peritoneal signs on exam',
      ],
      management_implications:
        'Conservative management with NGT, NPO, IV fluids. Gastrografin challenge at 24-48h. 70-80% resolve non-operatively. Surgery if not resolved by 72h or clinical deterioration.',
      provenance: { section: 'Classification', page_or_location: 'Section 1' },
    },
    {
      severity_id: 'PACK.WSES.SBO.2017.SEV.02',
      display_id: 'WSES-SBO-SEV2',
      level: 'Complete SBO with Strangulation',
      criteria: [
        'Complete obstruction (no distal gas on imaging)',
        'CT signs of strangulation (closed loop, reduced wall enhancement, mesenteric haziness)',
        'Peritoneal signs on abdominal exam',
        'Fever, leukocytosis, metabolic acidosis',
        'Hemodynamic instability or worsening despite resuscitation',
      ],
      management_implications:
        'Emergent surgical exploration mandatory. No role for conservative management or contrast challenge. Resuscitate en route to OR. Anticipate bowel resection.',
      provenance: { section: 'Classification', page_or_location: 'Section 1' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Surgery pack: Small bowel obstruction. Covers CT diagnosis, strangulation signs, Gastrografin challenge, conservative vs surgical management, timing of intervention.',

  all_item_ids: [
    'PACK.WSES.SBO.2017.REC.01', 'PACK.WSES.SBO.2017.REC.02', 'PACK.WSES.SBO.2017.REC.03',
    'PACK.WSES.SBO.2017.DC.01',
    'PACK.WSES.SBO.2017.T.01', 'PACK.WSES.SBO.2017.T.02',
    'PACK.WSES.SBO.2017.TX.01', 'PACK.WSES.SBO.2017.TX.02',
    'PACK.WSES.SBO.2017.RF.01', 'PACK.WSES.SBO.2017.RF.02',
    'PACK.WSES.SBO.2017.SEV.01', 'PACK.WSES.SBO.2017.SEV.02',
  ],
  all_display_ids: [
    'WSES-SBO-R1', 'WSES-SBO-R2', 'WSES-SBO-R3',
    'WSES-SBO-DC1',
    'WSES-SBO-T1', 'WSES-SBO-T2',
    'WSES-SBO-TX1', 'WSES-SBO-TX2',
    'WSES-SBO-RF1', 'WSES-SBO-RF2',
    'WSES-SBO-SEV1', 'WSES-SBO-SEV2',
  ],
};
