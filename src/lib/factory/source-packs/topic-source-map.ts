// ─── Topic → Source Precedence Map ───
// Maps each clinical topic to its authoritative source pack(s).
// Secondary sources have explicit scope boundaries to prevent authority creep.

export interface TopicSourceConfig {
  topic_id: string;
  primary: string;
  secondary?: Array<{
    source_pack_id: string;
    allowed_scopes: string[];
    excluded_scopes: string[];
  }>;
  conflict_resolution: string;
  precedence_rule: string;
}

export const topicSourceMap: Record<string, TopicSourceConfig> = {
  'Acute Pancreatitis': {
    topic_id: 'TOPIC.MED.AP',
    primary: 'PACK.ACG.AP.2024',
    conflict_resolution:
      'ACG is the specialty society. Overrides general references per SOURCE_POLICY: specialty > general.',
    precedence_rule: 'ACG sole authority.',
  },
  'Cirrhosis / SBP': {
    topic_id: 'TOPIC.MED.CSBP',
    primary: 'PACK.AASLD.CSBP.2021',
    secondary: [
      {
        source_pack_id: 'PACK.SSC.SEPSIS.2021',
        allowed_scopes: [
          'septic shock hemodynamics',
          'vasopressor selection',
          'MAP target',
          'initial fluid resuscitation timing',
          'lactate monitoring',
        ],
        excluded_scopes: [
          'SBP-specific antibiotic choice',
          'albumin dosing for SBP',
          'paracentesis indications',
          'SBP prophylaxis',
          'hepatorenal syndrome management',
        ],
      },
    ],
    conflict_resolution:
      'AASLD is hepatology specialty society — overrides SSC for all liver-specific decisions. SSC applies ONLY within allowed_scopes.',
    precedence_rule:
      'AASLD primary for liver-specific. SSC secondary for generic sepsis stabilization only.',
  },
  'GI Bleed': {
    topic_id: 'TOPIC.MED.GIB',
    primary: 'PACK.ACG.GIB.2021',
    conflict_resolution: 'ACG is the GI specialty society. Sole authority.',
    precedence_rule: 'ACG sole authority.',
  },

  // Phase 1 source packs (P4 evidence grounding)
  'Acute Coronary Syndrome': {
    topic_id: 'TOPIC.MED.ACS',
    primary: 'PACK.AHA.ACS.2023',
    conflict_resolution: 'AHA/ACC is the cardiology specialty society. Sole authority for ACS management.',
    precedence_rule: 'AHA/ACC sole authority.',
  },
  'Pulmonary Embolism': {
    topic_id: 'TOPIC.MED.PE',
    primary: 'PACK.AHA.PE.2024',
    conflict_resolution: 'AHA/ESC is the authority for PE. Overrides general anticoagulation references.',
    precedence_rule: 'AHA/ESC sole authority.',
  },
  'Acute Kidney Injury': {
    topic_id: 'TOPIC.MED.AKI',
    primary: 'PACK.KDIGO.AKI.2024',
    conflict_resolution: 'KDIGO is the nephrology specialty body. Sole authority for AKI staging and management.',
    precedence_rule: 'KDIGO sole authority.',
  },
  'Sepsis / Shock': {
    topic_id: 'TOPIC.MED.SEPSIS',
    primary: 'PACK.SSC.SEPSIS.2021',
    conflict_resolution: 'SSC is the authority for sepsis. Organ-specific guidelines override for organ-specific management.',
    precedence_rule: 'SSC primary for generic sepsis stabilization.',
  },
};
