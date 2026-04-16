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

  // ── Phase 1: High-priority IM ──
  'DKA / HHS': {
    topic_id: 'TOPIC.MED.DKAHHS',
    primary: 'PACK.ADA.DKAHHS.2024',
    conflict_resolution: 'ADA is the sole authority for diabetic emergencies.',
    precedence_rule: 'ADA sole authority.',
  },
  'Type 2 Diabetes': {
    topic_id: 'TOPIC.MED.T2DM',
    primary: 'PACK.ADA.T2DM.2024',
    conflict_resolution: 'ADA is the sole authority for diabetes management.',
    precedence_rule: 'ADA sole authority.',
  },
  'Community-Acquired Pneumonia': {
    topic_id: 'TOPIC.MED.CAP',
    primary: 'PACK.ATSIDSA.CAP.2019',
    secondary: [
      {
        source_pack_id: 'PACK.SSC.SEPSIS.2021',
        allowed_scopes: ['septic shock hemodynamics', 'vasopressor selection', 'lactate monitoring'],
        excluded_scopes: ['antibiotic selection for CAP', 'severity scoring for CAP'],
      },
    ],
    conflict_resolution: 'ATS/IDSA is the pulmonary/ID specialty authority for CAP. SSC applies only for sepsis stabilization.',
    precedence_rule: 'ATS/IDSA primary. SSC secondary for sepsis overlap.',
  },
  'Bacterial Meningitis': {
    topic_id: 'TOPIC.MED.MENING',
    primary: 'PACK.IDSA.MENING.2004',
    conflict_resolution: 'IDSA is the ID specialty authority for meningitis.',
    precedence_rule: 'IDSA sole authority.',
  },
  'COPD': {
    topic_id: 'TOPIC.MED.COPD',
    primary: 'PACK.GOLD.COPD.2024',
    conflict_resolution: 'GOLD is the international COPD authority.',
    precedence_rule: 'GOLD sole authority.',
  },
  'Asthma': {
    topic_id: 'TOPIC.MED.ASTHMA',
    primary: 'PACK.GINA.ASTHMA.2024',
    conflict_resolution: 'GINA is the international asthma authority.',
    precedence_rule: 'GINA sole authority.',
  },
  'Heart Failure': {
    topic_id: 'TOPIC.MED.HF',
    primary: 'PACK.ACCAHA.HF.2022',
    conflict_resolution: 'ACC/AHA/HFSA is the cardiology specialty authority for HF.',
    precedence_rule: 'ACC/AHA/HFSA sole authority.',
  },
  'Atrial Fibrillation': {
    topic_id: 'TOPIC.MED.AFIB',
    primary: 'PACK.ACCAHA.AFIB.2023',
    conflict_resolution: 'ACC/AHA/HRS is the cardiology/electrophysiology authority for AFib.',
    precedence_rule: 'ACC/AHA/HRS sole authority.',
  },
  'Hypertension': {
    topic_id: 'TOPIC.MED.HTN',
    primary: 'PACK.ACCAHA.HTN.2017',
    conflict_resolution: 'ACC/AHA is the cardiology authority for HTN management.',
    precedence_rule: 'ACC/AHA sole authority.',
  },
  'Acute Ischemic Stroke': {
    topic_id: 'TOPIC.MED.STROKE',
    primary: 'PACK.AHA.STROKE.2019',
    conflict_resolution: 'AHA/ASA is the neurovascular authority for stroke.',
    precedence_rule: 'AHA/ASA sole authority.',
  },
  'TIA': {
    topic_id: 'TOPIC.MED.TIA',
    primary: 'PACK.AHA.TIA.2021',
    secondary: [
      {
        source_pack_id: 'PACK.AHA.STROKE.2019',
        allowed_scopes: ['acute stroke management if TIA evolves', 'imaging modalities'],
        excluded_scopes: ['tPA administration', 'thrombectomy decisions'],
      },
    ],
    conflict_resolution: 'AHA/ASA TIA guideline is primary. Stroke guideline secondary for imaging and acute conversion.',
    precedence_rule: 'AHA/ASA TIA primary. Stroke secondary for overlap.',
  },
  'Syncope': {
    topic_id: 'TOPIC.MED.SYNC',
    primary: 'PACK.ACCAHA.SYNC.2017',
    conflict_resolution: 'ACC/AHA/HRS is the authority for syncope evaluation.',
    precedence_rule: 'ACC/AHA/HRS sole authority.',
  },

  // ── Phase 2: Remaining IM ──
  'Infective Endocarditis': {
    topic_id: 'TOPIC.MED.IE',
    primary: 'PACK.AHA.IE.2015',
    conflict_resolution: 'AHA is the authority for IE diagnosis and management.',
    precedence_rule: 'AHA sole authority.',
  },
  'Valvular Heart Disease': {
    topic_id: 'TOPIC.MED.VHD',
    primary: 'PACK.ACCAHA.VHD.2020',
    conflict_resolution: 'ACC/AHA is the authority for valvular disease management.',
    precedence_rule: 'ACC/AHA sole authority.',
  },
  'Pericardial Disease': {
    topic_id: 'TOPIC.MED.PERI',
    primary: 'PACK.ACCAHA.PERI.2015',
    conflict_resolution: 'ESC is the authority for pericardial disease.',
    precedence_rule: 'ESC sole authority.',
  },
  'Cardiac Arrest / ACLS': {
    topic_id: 'TOPIC.MED.ACLS',
    primary: 'PACK.AHA.ACLS.2020',
    conflict_resolution: 'AHA is the sole authority for ACLS algorithms.',
    precedence_rule: 'AHA sole authority.',
  },
  'Peripheral Artery Disease': {
    topic_id: 'TOPIC.MED.PAD',
    primary: 'PACK.ACCAHA.PAD.2016',
    conflict_resolution: 'AHA/ACC is the vascular authority for PAD.',
    precedence_rule: 'AHA/ACC sole authority.',
  },
  'Dyslipidemia': {
    topic_id: 'TOPIC.MED.CHOL',
    primary: 'PACK.ACCAHA.CHOL.2018',
    conflict_resolution: 'ACC/AHA is the authority for cholesterol management.',
    precedence_rule: 'ACC/AHA sole authority.',
  },
  'CKD': {
    topic_id: 'TOPIC.MED.CKD',
    primary: 'PACK.KDIGO.CKD.2024',
    conflict_resolution: 'KDIGO is the nephrology authority for CKD.',
    precedence_rule: 'KDIGO sole authority.',
  },
  'Thyroid Disease': {
    topic_id: 'TOPIC.MED.THY',
    primary: 'PACK.ATA.THY.2015',
    conflict_resolution: 'ATA is the thyroid specialty authority.',
    precedence_rule: 'ATA sole authority.',
  },
  'Adrenal Insufficiency / Cushing': {
    topic_id: 'TOPIC.MED.ADRENAL',
    primary: 'PACK.ES.ADRENAL.2016',
    conflict_resolution: 'Endocrine Society is the authority for adrenal disorders.',
    precedence_rule: 'Endocrine Society sole authority.',
  },
  'Osteoporosis': {
    topic_id: 'TOPIC.MED.OSTEO',
    primary: 'PACK.ES.OSTEO.2020',
    conflict_resolution: 'Endocrine Society is the authority for osteoporosis management.',
    precedence_rule: 'Endocrine Society sole authority.',
  },
  'Hypercalcemia / Hyperparathyroidism': {
    topic_id: 'TOPIC.MED.HCALC',
    primary: 'PACK.ES.HCALC.2022',
    conflict_resolution: 'Endocrine Society is the authority for calcium disorders.',
    precedence_rule: 'Endocrine Society sole authority.',
  },
  'Pheochromocytoma': {
    topic_id: 'TOPIC.MED.PHEO',
    primary: 'PACK.ES.PHEO.2014',
    conflict_resolution: 'Endocrine Society is the authority for pheochromocytoma.',
    precedence_rule: 'Endocrine Society sole authority.',
  },
  'Hepatitis B': {
    topic_id: 'TOPIC.MED.HEPB',
    primary: 'PACK.AASLD.HEPB.2018',
    conflict_resolution: 'AASLD is the hepatology authority for HBV.',
    precedence_rule: 'AASLD sole authority.',
  },
  'Hepatitis C': {
    topic_id: 'TOPIC.MED.HEPC',
    primary: 'PACK.AASLD.HEPC.2024',
    conflict_resolution: 'AASLD/IDSA is the authority for HCV.',
    precedence_rule: 'AASLD/IDSA sole authority.',
  },
  'HIV / AIDS': {
    topic_id: 'TOPIC.MED.HIV',
    primary: 'PACK.DHHS.HIV.2024',
    conflict_resolution: 'DHHS/NIH is the authority for HIV management.',
    precedence_rule: 'DHHS sole authority.',
  },
  'IBD': {
    topic_id: 'TOPIC.MED.IBD',
    primary: 'PACK.ACG.IBD.2019',
    conflict_resolution: 'ACG is the GI authority for IBD.',
    precedence_rule: 'ACG sole authority.',
  },
  'GERD': {
    topic_id: 'TOPIC.MED.GERD',
    primary: 'PACK.ACG.GERD.2022',
    conflict_resolution: 'ACG is the GI authority for GERD.',
    precedence_rule: 'ACG sole authority.',
  },
  'C. difficile': {
    topic_id: 'TOPIC.MED.CDIFF',
    primary: 'PACK.ACG.CDIFF.2021',
    conflict_resolution: 'ACG/IDSA is the authority for C. diff.',
    precedence_rule: 'ACG/IDSA sole authority.',
  },
  'UTI / Pyelonephritis': {
    topic_id: 'TOPIC.MED.UTI',
    primary: 'PACK.IDSA.UTI.2011',
    conflict_resolution: 'IDSA is the ID authority for UTI.',
    precedence_rule: 'IDSA sole authority.',
  },
  'STI': {
    topic_id: 'TOPIC.MED.STI',
    primary: 'PACK.CDC.STI.2021',
    conflict_resolution: 'CDC is the public health authority for STI treatment.',
    precedence_rule: 'CDC sole authority.',
  },
  'Nephrotic / Nephritic Syndrome': {
    topic_id: 'TOPIC.MED.GN',
    primary: 'PACK.KDIGO.GN.2021',
    conflict_resolution: 'KDIGO is the nephrology authority for glomerular disease.',
    precedence_rule: 'KDIGO sole authority.',
  },

  // ── Phase 3: Heme/Onc + Rheum + Neuro ──
  'DVT / Anticoagulation': {
    topic_id: 'TOPIC.MED.VTE',
    primary: 'PACK.CHEST.VTE.2021',
    secondary: [
      {
        source_pack_id: 'PACK.AHA.PE.2024',
        allowed_scopes: ['PE-specific risk stratification', 'submassive/massive PE management'],
        excluded_scopes: ['DVT-specific anticoagulation duration', 'outpatient DVT treatment'],
      },
    ],
    conflict_resolution: 'CHEST is the authority for VTE anticoagulation. AHA PE pack applies for PE-specific decisions.',
    precedence_rule: 'CHEST primary. AHA PE secondary for PE overlap.',
  },
  'Sickle Cell Disease': {
    topic_id: 'TOPIC.MED.SCD',
    primary: 'PACK.ASH.SCD.2020',
    conflict_resolution: 'ASH is the hematology authority for sickle cell disease.',
    precedence_rule: 'ASH sole authority.',
  },
  'TTP / HUS / HIT / DIC': {
    topic_id: 'TOPIC.MED.TTP',
    primary: 'PACK.ASH.TTP.2020',
    conflict_resolution: 'ASH/ISTH is the authority for thrombotic microangiopathies and HIT.',
    precedence_rule: 'ASH/ISTH sole authority.',
  },
  'Tumor Lysis Syndrome': {
    topic_id: 'TOPIC.MED.TLS',
    primary: 'PACK.ASCO.TLS.2015',
    conflict_resolution: 'ASCO is the oncology authority for TLS.',
    precedence_rule: 'ASCO sole authority.',
  },
  'Skin / Soft Tissue Infections': {
    topic_id: 'TOPIC.MED.SSTI',
    primary: 'PACK.IDSA.SSTI.2014',
    conflict_resolution: 'IDSA is the ID authority for SSTI.',
    precedence_rule: 'IDSA sole authority.',
  },
  'Rheumatoid Arthritis': {
    topic_id: 'TOPIC.MED.RA',
    primary: 'PACK.ACR.RA.2021',
    conflict_resolution: 'ACR is the rheumatology authority for RA.',
    precedence_rule: 'ACR sole authority.',
  },
  'Gout': {
    topic_id: 'TOPIC.MED.GOUT',
    primary: 'PACK.ACR.GOUT.2020',
    conflict_resolution: 'ACR is the rheumatology authority for gout.',
    precedence_rule: 'ACR sole authority.',
  },
  'SLE': {
    topic_id: 'TOPIC.MED.SLE',
    primary: 'PACK.ACR.SLE.2019',
    conflict_resolution: 'ACR/EULAR is the authority for SLE.',
    precedence_rule: 'ACR/EULAR sole authority.',
  },
  'Vasculitis': {
    topic_id: 'TOPIC.MED.VASC',
    primary: 'PACK.ACR.VASC.2021',
    conflict_resolution: 'ACR is the rheumatology authority for vasculitis.',
    precedence_rule: 'ACR sole authority.',
  },
  'Epilepsy / Status Epilepticus': {
    topic_id: 'TOPIC.MED.EPIL',
    primary: 'PACK.AAN.EPIL.2018',
    conflict_resolution: 'AAN/AES is the neurology authority for epilepsy.',
    precedence_rule: 'AAN/AES sole authority.',
  },
  'Multiple Sclerosis': {
    topic_id: 'TOPIC.MED.MS',
    primary: 'PACK.AAN.MS.2018',
    conflict_resolution: 'AAN is the neurology authority for MS.',
    precedence_rule: 'AAN sole authority.',
  },
  'Headache / Migraine': {
    topic_id: 'TOPIC.MED.HA',
    primary: 'PACK.AAN.HA.2021',
    conflict_resolution: 'AHS/AAN is the authority for headache disorders.',
    precedence_rule: 'AHS/AAN sole authority.',
  },
  'Dementia': {
    topic_id: 'TOPIC.MED.DEM',
    primary: 'PACK.AAN.DEM.2018',
    conflict_resolution: 'AAN is the neurology authority for dementia.',
    precedence_rule: 'AAN sole authority.',
  },
  'GBS / Myasthenia Gravis': {
    topic_id: 'TOPIC.MED.NM',
    primary: 'PACK.AAN.NM.2016',
    conflict_resolution: 'AAN is the neurology authority for neuromuscular disorders.',
    precedence_rule: 'AAN sole authority.',
  },
  'Osteomyelitis': {
    topic_id: 'TOPIC.MED.OSTEO_INF',
    primary: 'PACK.IDSA.SSTI.2014',
    conflict_resolution: 'IDSA SSTI guideline covers diabetic foot infections/osteomyelitis.',
    precedence_rule: 'IDSA sole authority.',
  },
};

// ─── Topic Alias Resolution ───
// Blueprint node topics don't always match topic-source-map keys exactly.
// This map resolves blueprint names → source map keys so the sufficiency gate
// and source loader can find packs for all node topics.

const topicAliases: Record<string, string> = {
  // Cardiology
  'Aortic Stenosis': 'Valvular Heart Disease',
  'Aortic Dissection': 'Valvular Heart Disease',      // closest pack available
  'Pericarditis': 'Pericardial Disease',

  // Endocrinology — multi-topic packs
  'DKA': 'DKA / HHS',
  'HHS': 'DKA / HHS',
  'Hyperthyroidism': 'Thyroid Disease',
  'Hypothyroidism': 'Thyroid Disease',
  'Thyroid Storm': 'Thyroid Disease',
  'Adrenal Insufficiency': 'Adrenal Insufficiency / Cushing',
  'Cushing Syndrome': 'Adrenal Insufficiency / Cushing',
  'Hypercalcemia': 'Hypercalcemia / Hyperparathyroidism',
  'Osteoporosis': 'Osteoporosis',
  'Type 2 Diabetes': 'Type 2 Diabetes',

  // Pulmonary
  'COPD Exacerbation': 'COPD',
  'Asthma Exacerbation': 'Asthma',

  // Neurology
  'Ischemic Stroke': 'Acute Ischemic Stroke',
  'Seizure': 'Epilepsy / Status Epilepticus',
  'Status Epilepticus': 'Epilepsy / Status Epilepticus',
  'Migraine': 'Headache / Migraine',
  'Myasthenia Gravis': 'GBS / Myasthenia Gravis',
  'Guillain-Barre Syndrome': 'GBS / Myasthenia Gravis',
  'Delirium vs Dementia': 'Dementia',

  // Nephrology
  'Chronic Kidney Disease': 'CKD',
  'Nephrotic Syndrome': 'Nephrotic / Nephritic Syndrome',
  'Nephritic Syndrome': 'Nephrotic / Nephritic Syndrome',
  'RPGN': 'Nephrotic / Nephritic Syndrome',

  // Hematology
  'DVT Anticoagulation': 'DVT / Anticoagulation',
  'HIT': 'TTP / HUS / HIT / DIC',
  'TTP': 'TTP / HUS / HIT / DIC',
  'DIC': 'TTP / HUS / HIT / DIC',

  // Infectious Disease
  'Meningitis': 'Bacterial Meningitis',
  'C. difficile': 'C. difficile',
  'Clostridioides difficile': 'C. difficile',
  'UTI/Pyelonephritis': 'UTI / Pyelonephritis',
  'Cellulitis': 'Skin / Soft Tissue Infections',
  'HIV': 'HIV / AIDS',
  'Sexually Transmitted Infections': 'STI',

  // GI
  'Inflammatory Bowel Disease': 'IBD',

  // Rheumatology
  'Vasculitis': 'Vasculitis',

  // Critical Care — route to existing packs
  'Septic Shock': 'Sepsis / Shock',
  'Sepsis': 'Sepsis / Shock',
  'Cardiogenic Shock': 'Acute Coronary Syndrome',    // ACS pack covers cardiogenic shock
  'Massive PE': 'Pulmonary Embolism',
  'Distributive Shock': 'Sepsis / Shock',

  // Preventive — route to preventive packs
  'Lipid Management': 'Dyslipidemia',
  'Osteoporosis Screening': 'Osteoporosis',
};

/**
 * Resolve a blueprint node topic to its topic-source-map key.
 * Checks direct match first, then aliases.
 * Returns the resolved key or the original topic if no mapping exists.
 */
export function resolveTopicKey(blueprintTopic: string): string {
  if (topicSourceMap[blueprintTopic]) return blueprintTopic;
  const alias = topicAliases[blueprintTopic];
  if (alias && topicSourceMap[alias]) return alias;
  return blueprintTopic;
}
