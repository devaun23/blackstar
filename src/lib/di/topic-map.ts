// Maps DI frontmatter topic tags → Blackstar blueprint_node.topic values
// Maps to all Step 2 CK and shelf exam topics. The original 20 IM topics
// from Phase 1 are still here; new topics are added as content is ingested.

/**
 * Known Blackstar topics. This is NOT a hard filter — it's a type-safe
 * reference for the mapping tables below. Topics not in this list can
 * still exist in blueprint_node; they just won't be auto-resolved from
 * DI tags until a mapping is added here.
 */
export const KNOWN_TOPICS = [
  // Phase 1 IM topics (original 20)
  'Acute Coronary Syndrome',
  'Pulmonary Embolism',
  'Deep Vein Thrombosis',
  'Sepsis',
  'GI Bleed',
  'Acute Pancreatitis',
  'Cirrhosis / SBP',
  'Acute Kidney Injury',
  'DKA / HHS',
  'Stroke',
  'Transient Ischemic Attack',
  'Syncope',
  'Heart Failure',
  'COPD Exacerbation',
  'Asthma Exacerbation',
  'Community-Acquired Pneumonia',
  'Infective Endocarditis',
  'Meningitis',
  'Hypercalcemia',
  'Arrhythmias',
] as const;

export type KnownTopic = (typeof KNOWN_TOPICS)[number];

// Keep Phase1Topic as alias for backward compatibility with existing imports
export type Phase1Topic = KnownTopic;
export { KNOWN_TOPICS as PHASE1_TOPICS };

/**
 * DI frontmatter tag → Blackstar topic(s).
 * A single DI tag can map to multiple Blackstar topics (e.g., 'gi' covers
 * GI Bleed, Pancreatitis, and Cirrhosis). The parser uses section headings
 * to disambiguate when possible.
 */
export const diTagToTopics: Record<string, KnownTopic[]> = {
  // Cardiovascular
  'acs': ['Acute Coronary Syndrome'],
  'coronary-artery-disease': ['Acute Coronary Syndrome'],
  'cardiology': ['Acute Coronary Syndrome', 'Heart Failure', 'Arrhythmias', 'Syncope', 'Infective Endocarditis'],
  'cardiovascular': ['Acute Coronary Syndrome', 'Heart Failure', 'Arrhythmias', 'Syncope'],
  'heart-failure': ['Heart Failure'],
  'arrhythmias': ['Arrhythmias'],
  'murmurs': ['Heart Failure'],
  'valvular-disease': ['Infective Endocarditis'],
  'valvular-heart-disease': ['Infective Endocarditis'],
  'endocarditis': ['Infective Endocarditis'],
  'endocarditis-prophylaxis': ['Infective Endocarditis'],
  'cardiogenic-shock': ['Acute Coronary Syndrome', 'Heart Failure'],
  'post-MI-complications': ['Acute Coronary Syndrome'],
  'hocm': ['Syncope'],
  'hemodynamics': ['Sepsis', 'Heart Failure'],
  'pericarditis': ['Acute Coronary Syndrome'],
  'acls': ['Arrhythmias'],

  // Pulmonary
  'pulmonary-embolism': ['Pulmonary Embolism'],
  'venous-disease': ['Pulmonary Embolism', 'Deep Vein Thrombosis'],
  'pulmonology': ['COPD Exacerbation', 'Asthma Exacerbation', 'Community-Acquired Pneumonia', 'Pulmonary Embolism'],
  'copd': ['COPD Exacerbation'],
  'asthma': ['Asthma Exacerbation'],
  'pneumonia': ['Community-Acquired Pneumonia'],
  'pna': ['Community-Acquired Pneumonia'],
  'anticoagulation': ['Pulmonary Embolism', 'Deep Vein Thrombosis'],

  // GI
  'gi': ['GI Bleed', 'Acute Pancreatitis', 'Cirrhosis / SBP'],
  'pancreatitis': ['Acute Pancreatitis'],
  'cirrhosis': ['Cirrhosis / SBP'],
  'hepatology': ['Cirrhosis / SBP'],
  'hepatobiliary': ['Cirrhosis / SBP'],
  'hepatic-encephalopathy': ['Cirrhosis / SBP'],
  'hepatitis': ['Cirrhosis / SBP'],
  'viral-hepatitis': ['Cirrhosis / SBP'],
  'peptic-ulcer-disease': ['GI Bleed'],
  'ibd': ['GI Bleed'],

  // Renal
  'nephrology': ['Acute Kidney Injury'],
  'electrolytes': ['Acute Kidney Injury'],
  'potassium': ['Acute Kidney Injury'],
  'sodium': ['Acute Kidney Injury'],
  'calcium': ['Hypercalcemia', 'Acute Kidney Injury'],
  'acid-base': ['Acute Kidney Injury'],

  // Endocrine
  'endocrinology': ['DKA / HHS', 'Hypercalcemia'],
  'dka': ['DKA / HHS'],
  'hhs': ['DKA / HHS'],
  'diabetes-medications': ['DKA / HHS'],
  'hyperthyroidism': ['Arrhythmias'],
  'thyroid-storm': ['Arrhythmias'],

  // Neurology
  'stroke': ['Stroke', 'Transient Ischemic Attack'],
  'stroke-localization': ['Stroke'],

  // Infectious Disease
  'infectious-disease': ['Sepsis', 'Community-Acquired Pneumonia', 'Meningitis', 'Infective Endocarditis'],
  'sepsis': ['Sepsis'],
  'meningitis': ['Meningitis'],
  'antibiotics': ['Sepsis', 'Community-Acquired Pneumonia', 'Meningitis'],
  'critical-care': ['Sepsis'],

  // Pharmacology (maps to conditions the drugs treat)
  'pharmacology': ['Acute Coronary Syndrome', 'Heart Failure', 'Arrhythmias', 'Pulmonary Embolism'],
  'antihypertensives': ['Heart Failure'],
  'antiplatelet': ['Acute Coronary Syndrome'],
  'reversal-agents': ['Pulmonary Embolism', 'Deep Vein Thrombosis'],

  // Syncope
  'syncope': ['Syncope'],
};

/**
 * Section heading keywords → specific Blackstar topic.
 * Used to disambiguate within multi-topic episodes. The parser checks
 * if a section heading contains these keywords to narrow the topic assignment.
 */
export const headingToTopic: Record<string, KnownTopic> = {
  // ACS
  'acs': 'Acute Coronary Syndrome',
  'stemi': 'Acute Coronary Syndrome',
  'nstemi': 'Acute Coronary Syndrome',
  'myocardial infarction': 'Acute Coronary Syndrome',
  'mi ': 'Acute Coronary Syndrome',
  'troponin': 'Acute Coronary Syndrome',
  'coronary': 'Acute Coronary Syndrome',
  'angina': 'Acute Coronary Syndrome',
  'post-mi': 'Acute Coronary Syndrome',

  // PE / DVT
  'pulmonary embolism': 'Pulmonary Embolism',
  'pe ': 'Pulmonary Embolism',
  'wells': 'Pulmonary Embolism',
  'd-dimer': 'Pulmonary Embolism',
  'dvt': 'Deep Vein Thrombosis',
  'deep vein': 'Deep Vein Thrombosis',
  'anticoagul': 'Pulmonary Embolism',

  // Heart Failure
  'heart failure': 'Heart Failure',
  'chf': 'Heart Failure',
  'hfref': 'Heart Failure',
  'hfpef': 'Heart Failure',
  'bnp': 'Heart Failure',
  'diuretic': 'Heart Failure',

  // Arrhythmias
  'arrhythmia': 'Arrhythmias',
  'afib': 'Arrhythmias',
  'atrial fibrillation': 'Arrhythmias',
  'svt': 'Arrhythmias',
  'vtach': 'Arrhythmias',
  'bradycardia': 'Arrhythmias',
  'tachycardia': 'Arrhythmias',
  'long qt': 'Arrhythmias',
  'wpw': 'Arrhythmias',

  // GI
  'gi bleed': 'GI Bleed',
  'upper gi': 'GI Bleed',
  'lower gi': 'GI Bleed',
  'melena': 'GI Bleed',
  'hematemesis': 'GI Bleed',
  'variceal': 'GI Bleed',
  'pancreatitis': 'Acute Pancreatitis',
  'pancrea': 'Acute Pancreatitis',
  'ranson': 'Acute Pancreatitis',
  'cirrhosis': 'Cirrhosis / SBP',
  'sbp': 'Cirrhosis / SBP',
  'ascites': 'Cirrhosis / SBP',
  'hepatic encephalopathy': 'Cirrhosis / SBP',
  'portal hypertension': 'Cirrhosis / SBP',
  'hepatorenal': 'Cirrhosis / SBP',

  // Renal
  'aki': 'Acute Kidney Injury',
  'acute kidney': 'Acute Kidney Injury',
  'renal failure': 'Acute Kidney Injury',
  'creatinine': 'Acute Kidney Injury',
  'dialysis': 'Acute Kidney Injury',
  'electrolyte': 'Acute Kidney Injury',
  'hyperkalemia': 'Acute Kidney Injury',
  'hyponatremia': 'Acute Kidney Injury',

  // DKA / HHS
  'dka': 'DKA / HHS',
  'diabetic ketoacidosis': 'DKA / HHS',
  'hhs': 'DKA / HHS',
  'hyperosmolar': 'DKA / HHS',
  'insulin': 'DKA / HHS',
  'anion gap': 'DKA / HHS',

  // Stroke / TIA
  'stroke': 'Stroke',
  'tpa': 'Stroke',
  'thrombolytic': 'Stroke',
  'tia': 'Transient Ischemic Attack',
  'transient ischemic': 'Transient Ischemic Attack',
  'abcd2': 'Transient Ischemic Attack',

  // Syncope
  'syncope': 'Syncope',
  'vasovagal': 'Syncope',

  // Pneumonia
  'pneumonia': 'Community-Acquired Pneumonia',
  'curb-65': 'Community-Acquired Pneumonia',
  'cap ': 'Community-Acquired Pneumonia',
  'copd': 'COPD Exacerbation',
  'asthma': 'Asthma Exacerbation',

  // Infectious
  'endocarditis': 'Infective Endocarditis',
  'duke': 'Infective Endocarditis',
  'meningitis': 'Meningitis',
  'csf': 'Meningitis',
  'sepsis': 'Sepsis',
  'septic shock': 'Sepsis',
  'vasopressor': 'Sepsis',

  // Hypercalcemia
  'hypercalcemia': 'Hypercalcemia',
  'calcium': 'Hypercalcemia',
  'pth': 'Hypercalcemia',
};

/**
 * Resolve Blackstar topics for a DI evidence item.
 *
 * Strategy:
 * 1. Check section heading against headingToTopic keywords (most specific)
 * 2. If no heading match, use episode-level DI tags via diTagToTopics
 * 3. Return deduplicated array of matching topics
 *
 * Returns empty array for unmapped content — those items are still stored
 * but won't be auto-linked to blueprint nodes until mappings are added.
 */
export function resolveTopics(
  sectionHeading: string,
  episodeTags: string[],
): KnownTopic[] {
  const topics = new Set<KnownTopic>();

  // 1. Section heading matching (highest specificity)
  const headingLower = sectionHeading.toLowerCase();
  for (const [keyword, topic] of Object.entries(headingToTopic)) {
    if (headingLower.includes(keyword)) {
      topics.add(topic);
    }
  }

  // If heading matched specific topics, use those (more precise)
  if (topics.size > 0) return [...topics];

  // 2. Fall back to episode-level tag mapping
  for (const tag of episodeTags) {
    const mapped = diTagToTopics[tag];
    if (mapped) {
      for (const t of mapped) topics.add(t);
    }
  }

  return [...topics];
}
