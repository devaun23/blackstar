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

  // ── Phase 4: Surgery ──
  'Trauma': {
    topic_id: 'TOPIC.SURG.TRAUMA',
    primary: 'PACK.ACS.ATLS.2018',
    conflict_resolution: 'ACS/ATLS is the authority for trauma management.',
    precedence_rule: 'ACS/ATLS sole authority.',
  },
  'Appendicitis': {
    topic_id: 'TOPIC.SURG.APPY',
    primary: 'PACK.WSES.APPY.2020',
    conflict_resolution: 'WSES/SAGES is the authority for appendicitis.',
    precedence_rule: 'WSES sole authority.',
  },
  'Cholecystitis / Cholangitis': {
    topic_id: 'TOPIC.SURG.CHOLE',
    primary: 'PACK.TG.CHOLE.2018',
    conflict_resolution: 'Tokyo Guidelines is the authority for biliary disease.',
    precedence_rule: 'TG18 sole authority.',
  },
  'Small Bowel Obstruction': {
    topic_id: 'TOPIC.SURG.SBO',
    primary: 'PACK.WSES.SBO.2017',
    conflict_resolution: 'WSES is the authority for SBO management.',
    precedence_rule: 'WSES sole authority.',
  },
  'Inguinal Hernia': {
    topic_id: 'TOPIC.SURG.HERNIA',
    primary: 'PACK.HS.HERNIA.2018',
    conflict_resolution: 'HerniaSurge is the authority for inguinal hernia.',
    precedence_rule: 'HerniaSurge sole authority.',
  },
  'Burns': {
    topic_id: 'TOPIC.SURG.BURNS',
    primary: 'PACK.ABA.BURNS.2016',
    conflict_resolution: 'ABA is the authority for burn management.',
    precedence_rule: 'ABA sole authority.',
  },
  'Perioperative CV Evaluation': {
    topic_id: 'TOPIC.SURG.PERIOP',
    primary: 'PACK.ACCAHA.PERIOP.2014',
    conflict_resolution: 'ACC/AHA is the authority for perioperative cardiac risk.',
    precedence_rule: 'ACC/AHA sole authority.',
  },
  'Breast Cancer': {
    topic_id: 'TOPIC.SURG.BREAST',
    primary: 'PACK.NCCN.BREAST.2024',
    conflict_resolution: 'NCCN is the authority for breast cancer management.',
    precedence_rule: 'NCCN sole authority.',
  },
  'Thyroid Nodule (Surgical)': {
    topic_id: 'TOPIC.SURG.THYSURG',
    primary: 'PACK.ATA.THYSURG.2015',
    conflict_resolution: 'ATA is the authority for thyroid nodule surgical management.',
    precedence_rule: 'ATA sole authority.',
  },
  'Diverticulitis / Mesenteric Ischemia': {
    topic_id: 'TOPIC.SURG.ABD',
    primary: 'PACK.WSES.ABD.2020',
    conflict_resolution: 'WSES is the authority for acute abdominal emergencies.',
    precedence_rule: 'WSES sole authority.',
  },

  // ── Phase 5: OB/GYN ──
  'Preeclampsia / Eclampsia': {
    topic_id: 'TOPIC.OBGYN.PREEC',
    primary: 'PACK.ACOG.PREEC.2020',
    conflict_resolution: 'ACOG is the authority for hypertensive disorders of pregnancy.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Gestational Diabetes': {
    topic_id: 'TOPIC.OBGYN.GDM',
    primary: 'PACK.ACOG.GDM.2018',
    conflict_resolution: 'ACOG is the authority for GDM.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Preterm Labor': {
    topic_id: 'TOPIC.OBGYN.PTL',
    primary: 'PACK.ACOG.PTL.2021',
    conflict_resolution: 'ACOG is the authority for preterm labor management.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Ectopic Pregnancy': {
    topic_id: 'TOPIC.OBGYN.ECTOP',
    primary: 'PACK.ACOG.ECTOP.2018',
    conflict_resolution: 'ACOG is the authority for ectopic pregnancy.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Rh Isoimmunization': {
    topic_id: 'TOPIC.OBGYN.RH',
    primary: 'PACK.ACOG.RH.2018',
    conflict_resolution: 'ACOG is the authority for Rh disease.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Labor Management': {
    topic_id: 'TOPIC.OBGYN.LABOR',
    primary: 'PACK.ACOG.LABOR.2019',
    conflict_resolution: 'ACOG is the authority for labor management.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Postpartum Hemorrhage': {
    topic_id: 'TOPIC.OBGYN.PPH',
    primary: 'PACK.ACOG.PPH.2017',
    conflict_resolution: 'ACOG is the authority for PPH.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Prenatal Care': {
    topic_id: 'TOPIC.OBGYN.PRENA',
    primary: 'PACK.ACOG.PRENA.2020',
    conflict_resolution: 'ACOG is the authority for prenatal screening.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Placental Disorders': {
    topic_id: 'TOPIC.OBGYN.PLAC',
    primary: 'PACK.ACOG.PLAC.2019',
    conflict_resolution: 'ACOG is the authority for placental disorders.',
    precedence_rule: 'ACOG sole authority.',
  },
  'PROM / PPROM': {
    topic_id: 'TOPIC.OBGYN.PROM',
    primary: 'PACK.ACOG.PROM.2020',
    conflict_resolution: 'ACOG is the authority for PROM management.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Cervical Cancer Screening': {
    topic_id: 'TOPIC.OBGYN.CERV',
    primary: 'PACK.ASCCP.CERV.2019',
    conflict_resolution: 'ASCCP is the authority for cervical screening.',
    precedence_rule: 'ASCCP sole authority.',
  },
  'Abnormal Uterine Bleeding': {
    topic_id: 'TOPIC.OBGYN.AUB',
    primary: 'PACK.ACOG.AUB.2021',
    conflict_resolution: 'ACOG is the authority for AUB.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Contraception': {
    topic_id: 'TOPIC.OBGYN.CONTRA',
    primary: 'PACK.CDC.CONTRA.2024',
    conflict_resolution: 'CDC US MEC is the authority for contraceptive eligibility.',
    precedence_rule: 'CDC sole authority.',
  },
  'Ovarian Mass': {
    topic_id: 'TOPIC.OBGYN.OVAR',
    primary: 'PACK.ACOG.OVAR.2016',
    conflict_resolution: 'ACOG is the authority for ovarian mass evaluation.',
    precedence_rule: 'ACOG sole authority.',
  },
  'Menopause / HRT': {
    topic_id: 'TOPIC.OBGYN.MENO',
    primary: 'PACK.NAMS.MENO.2022',
    conflict_resolution: 'NAMS is the authority for menopause management.',
    precedence_rule: 'NAMS sole authority.',
  },

  // ── Phase 6: Pediatrics ──
  'Kawasaki Disease': {
    topic_id: 'TOPIC.PEDS.KAWA',
    primary: 'PACK.AHA.KAWA.2017',
    conflict_resolution: 'AHA is the authority for Kawasaki disease.',
    precedence_rule: 'AHA sole authority.',
  },
  'Neonatal Resuscitation': {
    topic_id: 'TOPIC.PEDS.NRP',
    primary: 'PACK.AAP.NRP.2020',
    conflict_resolution: 'AAP/NRP is the authority for neonatal resuscitation.',
    precedence_rule: 'AAP sole authority.',
  },
  'Neonatal Jaundice': {
    topic_id: 'TOPIC.PEDS.JAUN',
    primary: 'PACK.AAP.JAUN.2022',
    conflict_resolution: 'AAP is the authority for neonatal hyperbilirubinemia.',
    precedence_rule: 'AAP sole authority.',
  },
  'Bronchiolitis': {
    topic_id: 'TOPIC.PEDS.BRONCH',
    primary: 'PACK.AAP.BRONCH.2014',
    conflict_resolution: 'AAP is the authority for bronchiolitis.',
    precedence_rule: 'AAP sole authority.',
  },
  'Acute Otitis Media': {
    topic_id: 'TOPIC.PEDS.AOM',
    primary: 'PACK.AAP.AOM.2013',
    conflict_resolution: 'AAP is the authority for AOM.',
    precedence_rule: 'AAP sole authority.',
  },
  'Febrile Seizures': {
    topic_id: 'TOPIC.PEDS.FSEZ',
    primary: 'PACK.AAP.FSEZ.2011',
    conflict_resolution: 'AAP is the authority for febrile seizures.',
    precedence_rule: 'AAP sole authority.',
  },
  'Pediatric UTI': {
    topic_id: 'TOPIC.PEDS.PUTI',
    primary: 'PACK.AAP.PUTI.2016',
    conflict_resolution: 'AAP is the authority for pediatric UTI.',
    precedence_rule: 'AAP sole authority.',
  },
  'ADHD': {
    topic_id: 'TOPIC.PEDS.ADHD',
    primary: 'PACK.AAP.ADHD.2019',
    conflict_resolution: 'AAP is the authority for ADHD.',
    precedence_rule: 'AAP sole authority.',
  },
  'Immunization Schedule': {
    topic_id: 'TOPIC.PEDS.IMMUN',
    primary: 'PACK.CDC.IMMUN.2024',
    conflict_resolution: 'CDC/ACIP is the authority for immunization schedules.',
    precedence_rule: 'CDC sole authority.',
  },
  'Developmental Milestones': {
    topic_id: 'TOPIC.PEDS.MILES',
    primary: 'PACK.CDC.MILES.2022',
    conflict_resolution: 'CDC/AAP is the authority for developmental milestones.',
    precedence_rule: 'CDC/AAP sole authority.',
  },
  'Croup': {
    topic_id: 'TOPIC.PEDS.CROUP',
    primary: 'PACK.AAP.CROUP.2019',
    conflict_resolution: 'AAP is the authority for croup management.',
    precedence_rule: 'AAP sole authority.',
  },
  'Pediatric Asthma': {
    topic_id: 'TOPIC.PEDS.PASTHMA',
    primary: 'PACK.GINA.PASTHMA.2024',
    conflict_resolution: 'GINA is the authority for pediatric asthma.',
    precedence_rule: 'GINA sole authority.',
  },

  // ── Phase 7: Psychiatry ──
  'Major Depressive Disorder': {
    topic_id: 'TOPIC.PSYCH.MDD',
    primary: 'PACK.APA.MDD.2023',
    conflict_resolution: 'APA is the authority for MDD.',
    precedence_rule: 'APA sole authority.',
  },
  'Bipolar Disorder': {
    topic_id: 'TOPIC.PSYCH.BPD',
    primary: 'PACK.APA.BPD.2023',
    conflict_resolution: 'APA is the authority for bipolar disorder.',
    precedence_rule: 'APA sole authority.',
  },
  'Schizophrenia': {
    topic_id: 'TOPIC.PSYCH.SCZ',
    primary: 'PACK.APA.SCZ.2020',
    conflict_resolution: 'APA is the authority for schizophrenia.',
    precedence_rule: 'APA sole authority.',
  },
  'Opioid / Substance Use Disorder': {
    topic_id: 'TOPIC.PSYCH.OUD',
    primary: 'PACK.ASAM.OUD.2020',
    conflict_resolution: 'ASAM is the authority for substance use disorders.',
    precedence_rule: 'ASAM sole authority.',
  },
  'Alcohol Use Disorder': {
    topic_id: 'TOPIC.PSYCH.AUD',
    primary: 'PACK.APA.AUD.2018',
    conflict_resolution: 'APA is the authority for alcohol use disorder.',
    precedence_rule: 'APA sole authority.',
  },
  'Anxiety / PTSD': {
    topic_id: 'TOPIC.PSYCH.ANXPTSD',
    primary: 'PACK.APA.ANXPTSD.2017',
    conflict_resolution: 'APA is the authority for anxiety and PTSD.',
    precedence_rule: 'APA sole authority.',
  },
  'Eating Disorders': {
    topic_id: 'TOPIC.PSYCH.EAT',
    primary: 'PACK.APA.EAT.2023',
    conflict_resolution: 'APA is the authority for eating disorders.',
    precedence_rule: 'APA sole authority.',
  },

  // ── Phase 7: Preventive Medicine ──
  'USPSTF Screening': {
    topic_id: 'TOPIC.PREV.SCREEN',
    primary: 'PACK.USPSTF.SCREEN.2024',
    conflict_resolution: 'USPSTF is the authority for screening recommendations.',
    precedence_rule: 'USPSTF sole authority.',
  },
  'Adult Immunization': {
    topic_id: 'TOPIC.PREV.ADIMMUN',
    primary: 'PACK.CDC.ADIMMUN.2024',
    conflict_resolution: 'CDC/ACIP is the authority for adult immunizations.',
    precedence_rule: 'CDC sole authority.',
  },

  // ── DI/IC Draft Packs — Electrolytes/Acid-Base ──
  'Hyperkalemia': {
    topic_id: 'TOPIC.MED.HK',
    primary: 'PACK.ASN.HK.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ASN/KDIGO guidelines.',
    precedence_rule: 'ASN sole authority (pending verification).',
  },
  'Hypokalemia': {
    topic_id: 'TOPIC.MED.HYPOK',
    primary: 'PACK.ENDOCRINE.HYPOKALEMIA.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against Endocrine Society guidelines.',
    precedence_rule: 'Endocrine Society sole authority (pending verification).',
  },
  'Hypocalcemia': {
    topic_id: 'TOPIC.MED.HYPOCA',
    primary: 'PACK.ES.HYPOCA.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against Endocrine Society guidelines.',
    precedence_rule: 'Endocrine Society sole authority (pending verification).',
  },
  'AG Metabolic Acidosis': {
    topic_id: 'TOPIC.MED.AGMA',
    primary: 'PACK.AACEP.AGMA.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against nephrology guidelines.',
    precedence_rule: 'Pending verification.',
  },
  'Metabolic Alkalosis': {
    topic_id: 'TOPIC.MED.METALK',
    primary: 'PACK.AACE.METALK.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against nephrology guidelines.',
    precedence_rule: 'Pending verification.',
  },

  // ── DI/IC Drafts — Toxicology ──
  'Acetaminophen Overdose': {
    topic_id: 'TOPIC.MED.APAP',
    primary: 'PACK.AASLD.APAP.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AASLD ALF guideline.',
    precedence_rule: 'AASLD sole authority (pending verification).',
  },
  'Opioid Overdose': {
    topic_id: 'TOPIC.MED.OOD',
    primary: 'PACK.SAMHSA.OOD.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against SAMHSA/AHA guidelines.',
    precedence_rule: 'SAMHSA sole authority (pending verification).',
  },
  'Alcohol Withdrawal': {
    topic_id: 'TOPIC.MED.ALCWD',
    primary: 'PACK.APA.ALCWD.2022',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against APA/ASAM guidelines.',
    precedence_rule: 'APA sole authority (pending verification).',
  },
  'Serotonin Syndrome vs NMS': {
    topic_id: 'TOPIC.MED.SS_NMS',
    primary: 'PACK.AANS.SS_NMS.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against toxicology guidelines.',
    precedence_rule: 'Pending verification.',
  },

  // ── DI/IC Drafts — Dermatology ──
  'Melanoma': {
    topic_id: 'TOPIC.MED.MEL',
    primary: 'PACK.AAD.MEL.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AAD/NCCN guidelines.',
    precedence_rule: 'AAD sole authority (pending verification).',
  },
  'SJS/TEN': {
    topic_id: 'TOPIC.MED.SJSTEN',
    primary: 'PACK.DERMATOLOGY.SJSTEN.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against dermatology guidelines.',
    precedence_rule: 'Pending verification.',
  },
  'Psoriasis': {
    topic_id: 'TOPIC.MED.PSO',
    primary: 'PACK.AAD.PSO.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AAD/NPF guidelines.',
    precedence_rule: 'AAD sole authority (pending verification).',
  },
  'Erythema Nodosum': {
    topic_id: 'TOPIC.MED.EN',
    primary: 'PACK.AAD.EN.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against dermatology guidelines.',
    precedence_rule: 'Pending verification.',
  },

  // ── DI/IC Drafts — Critical Care ──
  'Anaphylaxis': {
    topic_id: 'TOPIC.MED.ANAPH',
    primary: 'PACK.ACS.ANAPH.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against WAO/AAAAI guidelines.',
    precedence_rule: 'WAO sole authority (pending verification).',
  },
  'ARDS': {
    topic_id: 'TOPIC.MED.ARDS',
    primary: 'PACK.ATS.ARDS.2012',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ATS/ESICM guidelines.',
    precedence_rule: 'ATS sole authority (pending verification).',
  },
  'Hypovolemic Shock': {
    topic_id: 'TOPIC.MED.HVSHOCK',
    primary: 'PACK.ACS.HYPO.2022',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ATLS/SSC guidelines.',
    precedence_rule: 'Pending verification.',
  },
  'Tension Pneumothorax': {
    topic_id: 'TOPIC.MED.TENPTX',
    primary: 'PACK.ACCP.TP.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ATLS/ACCP guidelines.',
    precedence_rule: 'Pending verification.',
  },

  // ── DI/IC Drafts — Pulmonary ──
  'Pleural Effusion': {
    topic_id: 'TOPIC.MED.PLEFF',
    primary: 'PACK.BTS.PE.2010',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against BTS/ATS guidelines.',
    precedence_rule: 'BTS sole authority (pending verification).',
  },
  'Pneumothorax': {
    topic_id: 'TOPIC.MED.PTX',
    primary: 'PACK.ATS.PNEUMOTHORAX.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ATS/BTS guidelines.',
    precedence_rule: 'ATS sole authority (pending verification).',
  },
  'Interstitial Lung Disease': {
    topic_id: 'TOPIC.MED.ILD',
    primary: 'PACK.ATS.ILD.2022',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ATS/ERS guidelines.',
    precedence_rule: 'ATS sole authority (pending verification).',
  },
  'Obstructive Sleep Apnea': {
    topic_id: 'TOPIC.MED.OSA',
    primary: 'PACK.AASM.OSA.2020',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AASM guidelines.',
    precedence_rule: 'AASM sole authority (pending verification).',
  },
  'Sarcoidosis': {
    topic_id: 'TOPIC.MED.SARC',
    primary: 'PACK.ATS.SARC.2020',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ATS/ERS guidelines.',
    precedence_rule: 'ATS sole authority (pending verification).',
  },
  'Pulmonary Hypertension': {
    topic_id: 'TOPIC.MED.PAH',
    primary: 'PACK.ESC.PAH.2022',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ESC/ERS guidelines.',
    precedence_rule: 'ESC sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Gastroenterology ──
  'Peptic Ulcer Disease': {
    topic_id: 'TOPIC.MED.PUD',
    primary: 'PACK.AGA.PUD.2022',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ACG/AGA guidelines.',
    precedence_rule: 'ACG sole authority (pending verification).',
  },
  'Celiac Disease': {
    topic_id: 'TOPIC.MED.CD',
    primary: 'PACK.ACG.CD.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ACG guidelines.',
    precedence_rule: 'ACG sole authority (pending verification).',
  },
  'Diverticulitis': {
    topic_id: 'TOPIC.MED.DIV',
    primary: 'PACK.ACG.DIV.2020',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AGA/ACG guidelines.',
    precedence_rule: 'AGA sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Hepatology ──
  'Alcoholic Hepatitis': {
    topic_id: 'TOPIC.MED.AH',
    primary: 'PACK.AASLD.AH.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AASLD/ACG guidelines.',
    precedence_rule: 'AASLD sole authority (pending verification).',
  },
  'Drug-Induced Liver Injury': {
    topic_id: 'TOPIC.MED.DILI',
    primary: 'PACK.ACG.DILI.2014',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ACG guidelines.',
    precedence_rule: 'ACG sole authority (pending verification).',
  },
  'Autoimmune Hepatitis': {
    topic_id: 'TOPIC.MED.AIH',
    primary: 'PACK.AASLD.AIH.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AASLD guidelines.',
    precedence_rule: 'AASLD sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Nephrology ──
  'Renal Artery Stenosis': {
    topic_id: 'TOPIC.MED.RAS',
    primary: 'PACK.AHA.RAS.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AHA/ACC guidelines.',
    precedence_rule: 'AHA sole authority (pending verification).',
  },
  'Nephrolithiasis': {
    topic_id: 'TOPIC.MED.NEPH',
    primary: 'PACK.AUA.NEPHRO.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AUA guidelines.',
    precedence_rule: 'AUA sole authority (pending verification).',
  },
  'Renal Tubular Acidosis': {
    topic_id: 'TOPIC.MED.RTA',
    primary: 'PACK.KDIGO.RTA.2021',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against KDIGO guidelines.',
    precedence_rule: 'KDIGO sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Hematology/Oncology ──
  'Iron Deficiency Anemia': {
    topic_id: 'TOPIC.MED.IDA',
    primary: 'PACK.ACG.IDA.2020',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ASH/ACG guidelines.',
    precedence_rule: 'ASH sole authority (pending verification).',
  },
  'B12 Deficiency': {
    topic_id: 'TOPIC.MED.B12',
    primary: 'PACK.AHS.B12DEF.2020',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against hematology guidelines.',
    precedence_rule: 'Pending verification.',
  },
  'Hemolytic Anemia': {
    topic_id: 'TOPIC.MED.HA',
    primary: 'PACK.ASH.HA.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ASH guidelines.',
    precedence_rule: 'ASH sole authority (pending verification).',
  },
  'Pancytopenia': {
    topic_id: 'TOPIC.MED.PANCYTO',
    primary: 'PACK.ASH.PANCYTO.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ASH guidelines.',
    precedence_rule: 'ASH sole authority (pending verification).',
  },
  'Lymphoma': {
    topic_id: 'TOPIC.MED.LYMPH',
    primary: 'PACK.NCCN.LYMPH.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against NCCN guidelines.',
    precedence_rule: 'NCCN sole authority (pending verification).',
  },
  'Thrombocytopenia': {
    topic_id: 'TOPIC.MED.TCP',
    primary: 'PACK.ASH.THROMBOCYTOPENIA.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ASH guidelines.',
    precedence_rule: 'ASH sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Neurology ──
  'Parkinson Disease': {
    topic_id: 'TOPIC.MED.PD',
    primary: 'PACK.MDS.PD.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against MDS/AAN guidelines.',
    precedence_rule: 'MDS sole authority (pending verification).',
  },
  'Subarachnoid Hemorrhage': {
    topic_id: 'TOPIC.MED.SAH',
    primary: 'PACK.AHA.SAH.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against AHA/ASA guidelines.',
    precedence_rule: 'AHA sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Rheumatology ──
  'Pseudogout': {
    topic_id: 'TOPIC.MED.CPPD',
    primary: 'PACK.ACR.CPPD.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ACR guidelines.',
    precedence_rule: 'ACR sole authority (pending verification).',
  },
  'PMR/GCA': {
    topic_id: 'TOPIC.MED.PMRGCA',
    primary: 'PACK.ACR.PMR_GCA.2023',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ACR/EULAR guidelines.',
    precedence_rule: 'ACR sole authority (pending verification).',
  },
  'Ankylosing Spondylitis': {
    topic_id: 'TOPIC.MED.AS',
    primary: 'PACK.ACR.AS.2019',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against ACR/ASAS guidelines.',
    precedence_rule: 'ACR sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Infectious Disease ──
  'Tuberculosis': {
    topic_id: 'TOPIC.MED.TB',
    primary: 'PACK.CDC.TB.2020',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against CDC/ATS/IDSA guidelines.',
    precedence_rule: 'CDC sole authority (pending verification).',
  },

  // ── DI/IC Drafts — Preventive/Screening ──
  'Colon Cancer Screening': {
    topic_id: 'TOPIC.MED.CRC',
    primary: 'PACK.USPSTF.CRC.2021',
    conflict_resolution: 'DRAFT — DI/IC-derived. Verify against USPSTF/ACG guidelines.',
    precedence_rule: 'USPSTF sole authority (pending verification).',
  },
};

// ─── Topic Alias Resolution ───
// Blueprint node topics don't always match topic-source-map keys exactly.
// This map resolves blueprint names → source map keys so the sufficiency gate
// and source loader can find packs for all node topics.

const topicAliases: Record<string, string> = {
  // Cardiology
  'Stable Angina': 'Acute Coronary Syndrome',
  'Unstable Angina / NSTEMI': 'Acute Coronary Syndrome',
  'STEMI': 'Acute Coronary Syndrome',
  'CHF Exacerbation': 'Heart Failure',
  'Diastolic Heart Failure (HFpEF)': 'Heart Failure',
  'Atrial Flutter': 'Atrial Fibrillation',
  'Supraventricular Tachycardia': 'Cardiac Arrest / ACLS',
  'Ventricular Tachycardia': 'Cardiac Arrest / ACLS',
  'Ventricular Fibrillation': 'Cardiac Arrest / ACLS',
  'AV Blocks': 'Cardiac Arrest / ACLS',
  'Long QT Syndrome': 'Cardiac Arrest / ACLS',
  'Aortic Aneurysm': 'Peripheral Artery Disease',
  'Chest Pain': 'Acute Coronary Syndrome',
  'Aortic Stenosis': 'Valvular Heart Disease',
  'Aortic Dissection': 'Valvular Heart Disease',
  'Mitral Regurgitation': 'Valvular Heart Disease',
  'Mitral Stenosis': 'Valvular Heart Disease',
  'Cardiac Tamponade': 'Pericardial Disease',
  'Myocarditis': 'Pericardial Disease',
  'Hypertrophic Cardiomyopathy': 'Heart Failure',
  'Dilated Cardiomyopathy': 'Heart Failure',
  'Shock (Cardiogenic)': 'Acute Coronary Syndrome',
  'Pericarditis': 'Pericardial Disease',

  // Endocrinology — multi-topic packs
  'DKA': 'DKA / HHS',
  'HHS': 'DKA / HHS',
  'Diabetic Ketoacidosis': 'DKA / HHS',
  'Hyperosmolar Hyperglycemic State': 'DKA / HHS',
  'Hyperthyroidism': 'Thyroid Disease',
  'Hypothyroidism': 'Thyroid Disease',
  'Thyroid Storm': 'Thyroid Disease',
  'Thyroid Nodule': 'Thyroid Disease',
  'Thyroid Cancer': 'Thyroid Disease',
  'Myxedema Coma': 'Thyroid Disease',
  'Adrenal Insufficiency': 'Adrenal Insufficiency / Cushing',
  'Cushing Syndrome': 'Adrenal Insufficiency / Cushing',
  'Adrenal Crisis': 'Adrenal Insufficiency / Cushing',
  'Hypercalcemia': 'Hypercalcemia / Hyperparathyroidism',
  'Primary Hyperparathyroidism': 'Hypercalcemia / Hyperparathyroidism',
  'Diabetic Neuropathy': 'Diabetic Nephropathy',   // diabetes complications pack
  'Diabetic Retinopathy': 'Diabetic Nephropathy',
  'Pituitary Adenoma': 'Adrenal Insufficiency / Cushing',
  'Hypopituitarism': 'Adrenal Insufficiency / Cushing',
  'Diabetes Insipidus': 'Hypokalemia',             // electrolyte pack
  'SIADH': 'Hypokalemia',                           // electrolyte pack
  'Metabolic Syndrome': 'Type 2 Diabetes',
  'Osteoporosis': 'Osteoporosis',
  'Type 2 Diabetes': 'Type 2 Diabetes',

  // Pulmonary
  'COPD Exacerbation': 'COPD',
  'Asthma Exacerbation': 'Asthma',
  'Respiratory Failure': 'ARDS',
  'Mechanical Ventilation': 'ARDS',
  'Idiopathic Pulmonary Fibrosis': 'Interstitial Lung Disease',
  'Cough (Chronic)': 'Asthma',            // most common cause; GINA covers
  'Dyspnea': 'Heart Failure',             // broad symptom, HF is top ddx
  'Hemoptysis': 'Pulmonary Embolism',     // PE is must-rule-out

  // Neurology
  'Stroke (Ischemic)': 'Acute Ischemic Stroke',
  'Ischemic Stroke': 'Acute Ischemic Stroke',
  'Transient Ischemic Attack': 'TIA',
  'Seizures / Epilepsy': 'Epilepsy / Status Epilepticus',
  'Seizure': 'Epilepsy / Status Epilepticus',
  'Status Epilepticus': 'Epilepsy / Status Epilepticus',
  'Headache (Migraine)': 'Headache / Migraine',
  'Headache (Tension)': 'Headache / Migraine',
  'Headache (Cluster)': 'Headache / Migraine',
  'Migraine': 'Headache / Migraine',
  'Myasthenia Gravis': 'GBS / Myasthenia Gravis',
  'Guillain-Barré Syndrome': 'GBS / Myasthenia Gravis',
  'Guillain-Barre Syndrome': 'GBS / Myasthenia Gravis',
  'Alzheimer Disease': 'Dementia',
  'Delirium': 'Dementia',
  'Normal Pressure Hydrocephalus': 'Dementia',
  'Delirium vs Dementia': 'Dementia',
  'Increased Intracranial Pressure': 'Subarachnoid Hemorrhage',
  'Epidural Hematoma': 'Trauma',
  'Subdural Hematoma': 'Trauma',
  'Concussion / Traumatic Brain Injury': 'Trauma',
  'Spinal Cord Compression': 'Trauma',
  'Cauda Equina Syndrome': 'Trauma',

  // Nephrology
  'Chronic Kidney Disease': 'CKD',
  'Nephrotic Syndrome': 'Nephrotic / Nephritic Syndrome',
  'Nephritic Syndrome': 'Nephrotic / Nephritic Syndrome',
  'RPGN': 'Nephrotic / Nephritic Syndrome',
  'Hypernatremia': 'Hyperkalemia',                 // electrolyte pack
  'Hyponatremia': 'Hypokalemia',                   // electrolyte pack
  'Metabolic Acidosis': 'AG Metabolic Acidosis',
  'Respiratory Acidosis': 'COPD',                   // respiratory cause
  'Respiratory Alkalosis': 'Pulmonary Embolism',    // PE classic presentation
  'Urinary Incontinence': 'CKD',                    // renal pack scope
  'Polycystic Kidney Disease': 'CKD',

  // Hematology
  'DVT Anticoagulation': 'DVT / Anticoagulation',
  'Deep Vein Thrombosis / PE (Coagulation)': 'DVT / Anticoagulation',
  'Anticoagulation Management': 'DVT / Anticoagulation',
  'Immune Thrombocytopenic Purpura (ITP)': 'Thrombocytopenia',
  'Thrombotic Thrombocytopenic Purpura (TTP)': 'TTP / HUS / HIT / DIC',
  'Heparin-Induced Thrombocytopenia': 'TTP / HUS / HIT / DIC',
  'Disseminated Intravascular Coagulation': 'TTP / HUS / HIT / DIC',
  'HIT': 'TTP / HUS / HIT / DIC',
  'TTP': 'TTP / HUS / HIT / DIC',
  'DIC': 'TTP / HUS / HIT / DIC',
  'Folate Deficiency': 'B12 Deficiency',         // same workup pathway
  'Thalassemia': 'Iron Deficiency Anemia',        // microcytic anemia ddx
  'G6PD Deficiency': 'Hemolytic Anemia',
  'Leukemia (Acute)': 'Lymphoma',                 // heme malignancy pack
  'Leukemia (Chronic)': 'Lymphoma',
  'Multiple Myeloma': 'Lymphoma',
  'Transfusion Reactions': 'Sickle Cell Disease',  // SCD pack covers transfusion
  'Blood Product Selection': 'Sickle Cell Disease',
  'Hemophilia': 'TTP / HUS / HIT / DIC',          // coagulation disorders
  'Von Willebrand Disease': 'TTP / HUS / HIT / DIC',

  // Infectious Disease
  'Meningitis (Bacterial)': 'Bacterial Meningitis',
  'Meningitis': 'Bacterial Meningitis',
  'C. difficile': 'C. difficile',
  'Clostridioides difficile': 'C. difficile',
  'Clostridioides difficile Infection': 'C. difficile',
  'UTI/Pyelonephritis': 'UTI / Pyelonephritis',
  'Urinary Tract Infection': 'UTI / Pyelonephritis',
  'Pyelonephritis': 'UTI / Pyelonephritis',
  'Cellulitis': 'Skin / Soft Tissue Infections',
  'Cellulitis / Skin Infections': 'Skin / Soft Tissue Infections',
  'HIV': 'HIV / AIDS',
  'Sexually Transmitted Infections': 'STI',
  'COVID-19': 'Community-Acquired Pneumonia',     // respiratory illness workup
  'Fever of Unknown Origin': 'Sepsis / Shock',

  // GI
  'Inflammatory Bowel Disease': 'IBD',
  'Inflammatory Bowel Disease (Crohn)': 'IBD',
  'Inflammatory Bowel Disease (Ulcerative Colitis)': 'IBD',
  'GI Bleed (Upper)': 'GI Bleed',
  'GI Bleed (Lower)': 'GI Bleed',
  'Spontaneous Bacterial Peritonitis': 'Cirrhosis / SBP',
  'Hepatic Encephalopathy': 'Cirrhosis / SBP',
  'Esophageal Varices': 'Cirrhosis / SBP',
  'Cholelithiasis': 'Cholecystitis / Cholangitis',
  'Irritable Bowel Syndrome': 'GERD',             // functional GI overlap
  'Barrett Esophagus': 'GERD',
  'Abdominal Pain (Acute)': 'Acute Pancreatitis',  // broad ddx, AP is prototypical
  'Diarrhea (Acute)': 'C. difficile',
  'Diarrhea (Chronic)': 'IBD',
  'Jaundice': 'Cirrhosis / SBP',
  'Acute Mesenteric Ischemia': 'Diverticulitis / Mesenteric Ischemia',
  'Ischemic Colitis': 'Diverticulitis / Mesenteric Ischemia',
  'Large Bowel Obstruction': 'Small Bowel Obstruction',  // similar workup
  'Colorectal Cancer': 'Colon Cancer Screening',

  // Rheumatology
  'Systemic Lupus Erythematosus': 'SLE',
  'Scleroderma': 'Vasculitis',                     // closest rheum pack
  'Vasculitis': 'Vasculitis',

  // Critical Care / Multisystem — route to existing packs
  'Septic Shock': 'Sepsis / Shock',
  'Sepsis': 'Sepsis / Shock',
  'Cardiogenic Shock': 'Acute Coronary Syndrome',
  'Massive PE': 'Pulmonary Embolism',
  'Distributive Shock': 'Sepsis / Shock',
  'Drug Overdose / Toxicology': 'Acetaminophen Overdose',
  'Hypothermia': 'Trauma',                          // ATLS covers environmental
  'Heat Stroke': 'Sepsis / Shock',                  // similar stabilization
  'Amyloidosis': 'CKD',                             // renal manifestation common

  // Preventive — route to preventive packs
  'Lipid Management': 'Dyslipidemia',
  'Osteoporosis Screening': 'Osteoporosis',

  // Surgery aliases
  'ATLS': 'Trauma',
  'Hemorrhagic Shock': 'Trauma',
  'Acute Cholecystitis': 'Cholecystitis / Cholangitis',
  'Choledocholithiasis': 'Cholecystitis / Cholangitis',
  'Cholangitis': 'Cholecystitis / Cholangitis',
  'Bowel Obstruction': 'Small Bowel Obstruction',
  'Burn Injury': 'Burns',
  'Preoperative Evaluation': 'Perioperative CV Evaluation',
  'Diverticulitis': 'Diverticulitis / Mesenteric Ischemia',
  'Mesenteric Ischemia': 'Diverticulitis / Mesenteric Ischemia',

  // OB/GYN aliases
  'Preeclampsia': 'Preeclampsia / Eclampsia',
  'Eclampsia': 'Preeclampsia / Eclampsia',
  'HELLP Syndrome': 'Preeclampsia / Eclampsia',
  'Placenta Previa': 'Placental Disorders',
  'Placental Abruption': 'Placental Disorders',
  'PROM': 'PROM / PPROM',
  'PPROM': 'PROM / PPROM',
  'Premature Rupture of Membranes': 'PROM / PPROM',
  'Shoulder Dystocia': 'Labor Management',
  'C-Section': 'Labor Management',
  'Normal Labor and Delivery': 'Labor Management',
  'Cesarean Delivery Indications': 'Labor Management',
  'Fetal Heart Rate Monitoring': 'Labor Management',
  'Spontaneous Abortion': 'Ectopic Pregnancy',     // early pregnancy pack
  'Postpartum Depression': 'Postpartum Hemorrhage', // postpartum pack
  'Mastitis': 'Postpartum Hemorrhage',              // postpartum pack
  'Gestational Trophoblastic Disease': 'Ectopic Pregnancy',
  'Ovarian Torsion': 'Ovarian Mass',

  // Pediatrics aliases
  'RSV Bronchiolitis': 'Bronchiolitis',
  'Neonatal Hyperbilirubinemia': 'Neonatal Jaundice',
  'Kernicterus': 'Neonatal Jaundice',
  'NRP': 'Neonatal Resuscitation',
  'Otitis Media': 'Acute Otitis Media',
  'Pediatric Asthma Exacerbation': 'Pediatric Asthma',

  // Psychiatry aliases
  'Depression': 'Major Depressive Disorder',
  'MDD': 'Major Depressive Disorder',
  'Mania': 'Bipolar Disorder',
  'Alcohol Withdrawal': 'Alcohol Use Disorder',
  'Delirium Tremens': 'Alcohol Use Disorder',
  'Opioid Overdose': 'Opioid / Substance Use Disorder',
  'Opioid Use Disorder': 'Opioid / Substance Use Disorder',
  'GAD': 'Anxiety / PTSD',
  'Panic Disorder': 'Anxiety / PTSD',
  'PTSD': 'Anxiety / PTSD',
  'OCD': 'Anxiety / PTSD',
  'Anorexia Nervosa': 'Eating Disorders',
  'Bulimia Nervosa': 'Eating Disorders',
  'NMS': 'Schizophrenia',
  'Intimate Partner Violence': 'USPSTF Screening',  // USPSTF covers screening

  // Immune
  'Allergic Rhinitis': 'Anaphylaxis',               // allergy pack
  'Drug Allergies': 'Anaphylaxis',
  'Food Allergies': 'Anaphylaxis',
  'Hypersensitivity Reactions': 'Anaphylaxis',
  'Angioedema': 'Anaphylaxis',

  // Musculoskeletal & Dermatology
  'Compartment Syndrome': 'Trauma',
  'Low Back Pain': 'Ankylosing Spondylitis',        // MSK pack
  'Fractures (Hip)': 'Trauma',
  'Fractures (General)': 'Trauma',
  'Soft Tissue Injuries': 'Trauma',
  'Basal Cell Carcinoma': 'Melanoma',               // derm oncology pack
  'Squamous Cell Carcinoma (Skin)': 'Melanoma',
  'Dermatitis': 'Psoriasis',                        // derm pack
  'Pressure Ulcers': 'Skin / Soft Tissue Infections',

  // Preventive aliases
  'Cancer Screening': 'USPSTF Screening',
  'Breast Cancer Screening': 'USPSTF Screening',
  'Colorectal Cancer Screening': 'USPSTF Screening',
  'Lung Cancer Screening': 'USPSTF Screening',
  'Screening Guidelines': 'USPSTF Screening',

  // Pediatrics additional
  'Febrile Seizures': 'Febrile Seizures',

  // Urology — route to closest clinical packs
  'Benign Prostatic Hyperplasia': 'UTI / Pyelonephritis',
  'Testicular Torsion': 'Appendicitis',             // acute surgical abdomen equivalent
  'Testicular Cancer': 'Lymphoma',                   // oncology pack
  'Renal Cell Carcinoma': 'CKD',
  'Bladder Cancer': 'CKD',
  'Prostate Cancer': 'USPSTF Screening',             // screening guidelines
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
