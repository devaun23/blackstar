// AMBOSS behavioral science topic mapping
// Maps section headings and frontmatter tags to Blackstar topic names.

export const BEHAVIORAL_SCIENCE_TOPICS = [
  'Death Determination and Certification',
  'Research Ethics and IRB',
  'Informed Consent',
  'End-of-Life Care',
  'Hospice and Palliative Care',
  'Pain Management',
  'Infection Prevention and Control',
  'Preventive Medicine Levels',
  'Disease Outbreak Investigation',
  'Involuntary Commitment',
] as const;

export type BehavioralScienceTopic = (typeof BEHAVIORAL_SCIENCE_TOPICS)[number];

// ─── Heading keyword → topic mapping ───
// Keys are lowercase substrings matched against the full breadcrumb heading.

const HEADING_MAP: Array<{ pattern: RegExp; topic: BehavioralScienceTopic }> = [
  // Death
  { pattern: /brain death/i, topic: 'Death Determination and Certification' },
  { pattern: /death certificate/i, topic: 'Death Determination and Certification' },
  { pattern: /autopsy/i, topic: 'Death Determination and Certification' },
  { pattern: /postmortem/i, topic: 'Death Determination and Certification' },
  { pattern: /pronounc/i, topic: 'Death Determination and Certification' },
  { pattern: /manner of death/i, topic: 'Death Determination and Certification' },
  { pattern: /investigation of death/i, topic: 'Death Determination and Certification' },
  { pattern: /signs of death/i, topic: 'Death Determination and Certification' },
  { pattern: /documentation of death/i, topic: 'Death Determination and Certification' },
  { pattern: /rigor mortis|livor mortis|tardieu/i, topic: 'Death Determination and Certification' },
  { pattern: /medical aid in dying/i, topic: 'End-of-Life Care' },
  { pattern: /euthanasia/i, topic: 'End-of-Life Care' },
  { pattern: /terminal sedation/i, topic: 'End-of-Life Care' },
  { pattern: /end-of-life/i, topic: 'End-of-Life Care' },
  { pattern: /training.*deceased/i, topic: 'Death Determination and Certification' },
  { pattern: /evidence of live birth/i, topic: 'Death Determination and Certification' },

  // Ethics
  { pattern: /autonomy|beneficence|nonmaleficence|justice/i, topic: 'Informed Consent' },
  { pattern: /core ethical principles/i, topic: 'Informed Consent' },
  { pattern: /obligation to treat|emtala/i, topic: 'Informed Consent' },
  { pattern: /proportionality/i, topic: 'Informed Consent' },
  { pattern: /informed consent/i, topic: 'Informed Consent' },
  { pattern: /irb|institutional review/i, topic: 'Research Ethics and IRB' },
  { pattern: /research ethics/i, topic: 'Research Ethics and IRB' },
  { pattern: /research funding/i, topic: 'Research Ethics and IRB' },
  { pattern: /compensation.*participant/i, topic: 'Research Ethics and IRB' },
  { pattern: /vulnerable population/i, topic: 'Research Ethics and IRB' },
  { pattern: /participant.*data|hipaa/i, topic: 'Research Ethics and IRB' },
  { pattern: /participant.*withdrawal/i, topic: 'Research Ethics and IRB' },
  { pattern: /involuntary commitment/i, topic: 'Involuntary Commitment' },
  { pattern: /abortion|stillbirth/i, topic: 'Informed Consent' },

  // Palliative
  { pattern: /palliative/i, topic: 'Hospice and Palliative Care' },
  { pattern: /hospice/i, topic: 'Hospice and Palliative Care' },
  { pattern: /deprescrib/i, topic: 'Hospice and Palliative Care' },
  { pattern: /imminent(ly)? dying/i, topic: 'Hospice and Palliative Care' },
  { pattern: /terminal.*agitation/i, topic: 'Hospice and Palliative Care' },
  { pattern: /palliative sedation/i, topic: 'Hospice and Palliative Care' },
  { pattern: /pain/i, topic: 'Pain Management' },
  { pattern: /who.*ladder|analgesic ladder/i, topic: 'Pain Management' },
  { pattern: /opioid therapy/i, topic: 'Pain Management' },
  { pattern: /breathlessness|dyspnea/i, topic: 'Hospice and Palliative Care' },
  { pattern: /nausea.*vomit/i, topic: 'Hospice and Palliative Care' },
  { pattern: /constipation/i, topic: 'Hospice and Palliative Care' },
  { pattern: /delirium/i, topic: 'Hospice and Palliative Care' },
  { pattern: /anxiety/i, topic: 'Hospice and Palliative Care' },
  { pattern: /pediatric palliative/i, topic: 'Hospice and Palliative Care' },

  // Infection control
  { pattern: /hand hygiene/i, topic: 'Infection Prevention and Control' },
  { pattern: /ppe|personal protective/i, topic: 'Infection Prevention and Control' },
  { pattern: /isolation precaution/i, topic: 'Infection Prevention and Control' },
  { pattern: /steriliz/i, topic: 'Infection Prevention and Control' },
  { pattern: /disinfect|antiseptic/i, topic: 'Infection Prevention and Control' },
  { pattern: /needlestick|sharps/i, topic: 'Infection Prevention and Control' },
  { pattern: /hai|nosocomial|healthcare-associated/i, topic: 'Infection Prevention and Control' },
  { pattern: /cauti|clabsi|ventilator-associated|surgical site/i, topic: 'Infection Prevention and Control' },
  { pattern: /contact precaution|droplet precaution|airborne precaution/i, topic: 'Infection Prevention and Control' },
  { pattern: /donning|doffing/i, topic: 'Infection Prevention and Control' },
  { pattern: /respiratory hygiene/i, topic: 'Infection Prevention and Control' },
  { pattern: /standard precaution/i, topic: 'Infection Prevention and Control' },
  { pattern: /postexposure prophylaxis|pep/i, topic: 'Infection Prevention and Control' },
  { pattern: /community spread|epidemic control/i, topic: 'Disease Outbreak Investigation' },
  { pattern: /pre-?surgical|surgical hand/i, topic: 'Infection Prevention and Control' },
  { pattern: /gowning|gloving/i, topic: 'Infection Prevention and Control' },

  // Preventive medicine
  { pattern: /primordial prevention/i, topic: 'Preventive Medicine Levels' },
  { pattern: /primary prevention/i, topic: 'Preventive Medicine Levels' },
  { pattern: /secondary prevention/i, topic: 'Preventive Medicine Levels' },
  { pattern: /tertiary prevention/i, topic: 'Preventive Medicine Levels' },
  { pattern: /quaternary prevention/i, topic: 'Preventive Medicine Levels' },
  { pattern: /prevention paradox/i, topic: 'Preventive Medicine Levels' },
  { pattern: /disease outbreak/i, topic: 'Disease Outbreak Investigation' },
  { pattern: /public health intervention/i, topic: 'Preventive Medicine Levels' },
  { pattern: /screening/i, topic: 'Preventive Medicine Levels' },
];

// ─── Frontmatter tag → topic mapping ───

const TAG_MAP: Record<string, BehavioralScienceTopic[]> = {
  'death-determination': ['Death Determination and Certification'],
  'brain-death': ['Death Determination and Certification'],
  autopsy: ['Death Determination and Certification'],
  'death-certificates': ['Death Determination and Certification'],
  'postmortem-changes': ['Death Determination and Certification'],
  'end-of-life': ['End-of-Life Care'],
  'ethics-principles': ['Informed Consent'],
  'informed-consent': ['Informed Consent'],
  irb: ['Research Ethics and IRB'],
  'research-ethics': ['Research Ethics and IRB'],
  'involuntary-commitment': ['Involuntary Commitment'],
  'vulnerable-populations': ['Research Ethics and IRB'],
  'abortion-laws': ['Informed Consent'],
  'palliative-care': ['Hospice and Palliative Care'],
  hospice: ['Hospice and Palliative Care'],
  'pain-management': ['Pain Management'],
  deprescribing: ['Hospice and Palliative Care'],
  'symptom-management': ['Hospice and Palliative Care'],
  'hand-hygiene': ['Infection Prevention and Control'],
  ppe: ['Infection Prevention and Control'],
  'isolation-precautions': ['Infection Prevention and Control'],
  sterilization: ['Infection Prevention and Control'],
  'hai-prevention': ['Infection Prevention and Control'],
  needlestick: ['Infection Prevention and Control'],
  'infection-control': ['Infection Prevention and Control'],
  'prevention-levels': ['Preventive Medicine Levels'],
  'disease-outbreak': ['Disease Outbreak Investigation'],
  'prevention-paradox': ['Preventive Medicine Levels'],
  screening: ['Preventive Medicine Levels'],
  'public-health': ['Preventive Medicine Levels'],
};

/**
 * Resolve a section heading to zero or more behavioral science topics.
 * Tries heading patterns first (highest specificity), then falls back to nothing.
 */
export function resolveTopicFromHeading(heading: string): BehavioralScienceTopic[] {
  const matches = new Set<BehavioralScienceTopic>();
  for (const { pattern, topic } of HEADING_MAP) {
    if (pattern.test(heading)) {
      matches.add(topic);
    }
  }
  return [...matches];
}

/**
 * Resolve frontmatter tags to behavioral science topics.
 */
export function resolveTopicsFromTags(tags: string[]): BehavioralScienceTopic[] {
  const matches = new Set<BehavioralScienceTopic>();
  for (const tag of tags) {
    const topics = TAG_MAP[tag];
    if (topics) {
      for (const t of topics) matches.add(t);
    }
  }
  return [...matches];
}
