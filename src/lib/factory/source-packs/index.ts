// ─── Pack Registry Index ───
// Central registry for all source packs. Dynamic imports keep the bundle lean.

import type { SourcePack, PackStatus } from './types';

const PACK_REGISTRY: Record<string, () => Promise<SourcePack>> = {
  // ── Original packs ──
  'PACK.ACG.AP.2024': () =>
    import('./acg-acute-pancreatitis').then((m) => m.pack),
  'PACK.AASLD.CSBP.2021': () =>
    import('./aasld-cirrhosis-sbp').then((m) => m.pack),
  'PACK.ACG.GIB.2021': () =>
    import('./acg-gi-bleeding').then((m) => m.pack),
  'PACK.SSC.SEPSIS.2021': () =>
    import('./surviving-sepsis-2021').then((m) => m.pack),
  'PACK.AHA.ACS.2023': () =>
    import('./aha-acs').then((m) => m.PACK_AHA_ACS_2023),
  'PACK.AHA.PE.2024': () =>
    import('./aha-pe').then((m) => m.PACK_AHA_PE_2024),
  'PACK.KDIGO.AKI.2024': () =>
    import('./kdigo-aki').then((m) => m.PACK_KDIGO_AKI_2024),

  // ── Phase 1: High-priority IM ──
  'PACK.ADA.DKAHHS.2024': () =>
    import('./ada-dka-hhs').then((m) => m.PACK_ADA_DKAHHS_2024),
  'PACK.ADA.T2DM.2024': () =>
    import('./ada-type2-diabetes').then((m) => m.PACK_ADA_T2DM_2024),
  'PACK.ATSIDSA.CAP.2019': () =>
    import('./ats-idsa-cap').then((m) => m.PACK_ATSIDSA_CAP_2019),
  'PACK.IDSA.MENING.2004': () =>
    import('./idsa-meningitis').then((m) => m.PACK_IDSA_MENING_2004),
  'PACK.GOLD.COPD.2024': () =>
    import('./gold-copd').then((m) => m.PACK_GOLD_COPD_2024),
  'PACK.GINA.ASTHMA.2024': () =>
    import('./gina-asthma').then((m) => m.PACK_GINA_ASTHMA_2024),
  'PACK.ACCAHA.HF.2022': () =>
    import('./acc-aha-heart-failure').then((m) => m.PACK_ACCAHA_HF_2022),
  'PACK.ACCAHA.AFIB.2023': () =>
    import('./acc-aha-atrial-fibrillation').then((m) => m.PACK_ACCAHA_AFIB_2023),
  'PACK.ACCAHA.HTN.2017': () =>
    import('./acc-aha-hypertension').then((m) => m.PACK_ACCAHA_HTN_2017),
  'PACK.AHA.STROKE.2019': () =>
    import('./aha-stroke').then((m) => m.PACK_AHA_STROKE_2019),
  'PACK.AHA.TIA.2021': () =>
    import('./aha-tia').then((m) => m.PACK_AHA_TIA_2021),
  'PACK.ACCAHA.SYNC.2017': () =>
    import('./acc-aha-syncope').then((m) => m.PACK_ACCAHA_SYNC_2017),

  // ── Phase 2: Remaining IM — Cardiology/Nephro ──
  'PACK.AHA.IE.2015': () =>
    import('./aha-infective-endocarditis').then((m) => m.PACK_AHA_IE_2015),
  'PACK.ACCAHA.VHD.2020': () =>
    import('./acc-aha-valvular').then((m) => m.PACK_ACCAHA_VHD_2020),
  'PACK.ACCAHA.PERI.2015': () =>
    import('./acc-aha-pericardial').then((m) => m.PACK_ACCAHA_PERI_2015),
  'PACK.AHA.ACLS.2020': () =>
    import('./aha-cardiac-arrest').then((m) => m.PACK_AHA_ACLS_2020),
  'PACK.ACCAHA.PAD.2016': () =>
    import('./acc-aha-pad').then((m) => m.PACK_ACCAHA_PAD_2016),
  'PACK.ACCAHA.CHOL.2018': () =>
    import('./acc-aha-dyslipidemia').then((m) => m.PACK_ACCAHA_CHOL_2018),
  'PACK.KDIGO.CKD.2024': () =>
    import('./kdigo-ckd').then((m) => m.PACK_KDIGO_CKD_2024),

  // ── Phase 2: Remaining IM — Endo/GI/Nephro ──
  'PACK.ATA.THY.2015': () =>
    import('./ata-thyroid').then((m) => m.PACK_ATA_THY_2015),
  'PACK.ES.ADRENAL.2016': () =>
    import('./es-adrenal').then((m) => m.PACK_ES_ADRENAL_2016),
  'PACK.ES.OSTEO.2020': () =>
    import('./es-osteoporosis').then((m) => m.PACK_ES_OSTEO_2020),
  'PACK.ES.HCALC.2022': () =>
    import('./es-hypercalcemia').then((m) => m.PACK_ES_HCALC_2022),
  'PACK.AASLD.HEPB.2018': () =>
    import('./aasld-hepatitis-b').then((m) => m.PACK_AASLD_HEPB_2018),
  'PACK.AASLD.HEPC.2024': () =>
    import('./aasld-hepatitis-c').then((m) => m.PACK_AASLD_HEPC_2024),
  'PACK.KDIGO.GN.2021': () =>
    import('./kdigo-glomerulonephritis').then((m) => m.PACK_KDIGO_GN_2021),

  // ── Phase 2: Remaining IM — ID/GI/STI ──
  'PACK.ES.PHEO.2014': () =>
    import('./es-pheochromocytoma').then((m) => m.PACK_ES_PHEO_2014),
  'PACK.DHHS.HIV.2024': () =>
    import('./idsa-hiv').then((m) => m.PACK_DHHS_HIV_2024),
  'PACK.ACG.IBD.2019': () =>
    import('./acg-ibd').then((m) => m.PACK_ACG_IBD_2019),
  'PACK.ACG.GERD.2022': () =>
    import('./acg-gerd').then((m) => m.PACK_ACG_GERD_2022),
  'PACK.ACG.CDIFF.2021': () =>
    import('./acg-cdiff').then((m) => m.PACK_ACG_CDIFF_2021),
  'PACK.IDSA.UTI.2011': () =>
    import('./idsa-uti').then((m) => m.PACK_IDSA_UTI_2011),
  'PACK.CDC.STI.2021': () =>
    import('./cdc-sti').then((m) => m.PACK_CDC_STI_2021),
};

/** Load a pack by ID. Returns null if not registered or not active. */
export async function loadPack(sourcePackId: string): Promise<SourcePack | null> {
  const loader = PACK_REGISTRY[sourcePackId];
  if (!loader) return null;

  try {
    const pack = await loader();
    if (pack.status !== 'active') return null;
    return pack;
  } catch {
    // Pack file doesn't exist yet (Phase D stubs)
    return null;
  }
}

/** Check a pack's status without loading the full content. */
export async function getPackStatus(
  sourcePackId: string
): Promise<PackStatus | 'not_registered'> {
  const loader = PACK_REGISTRY[sourcePackId];
  if (!loader) return 'not_registered';

  try {
    const pack = await loader();
    return pack.status;
  } catch {
    return 'not_registered';
  }
}

/** List all pack IDs that are currently active. */
export async function listActivePacks(): Promise<string[]> {
  const results: string[] = [];
  for (const [id, loader] of Object.entries(PACK_REGISTRY)) {
    try {
      const pack = await loader();
      if (pack.status === 'active') results.push(id);
    } catch {
      // Skip packs that can't be loaded
    }
  }
  return results;
}

/** Find a pack by its source_name field. */
export async function getPackBySourceName(
  name: string
): Promise<SourcePack | null> {
  for (const loader of Object.values(PACK_REGISTRY)) {
    try {
      const pack = await loader();
      if (pack.source_name === name && pack.status === 'active') return pack;
    } catch {
      // Skip
    }
  }
  return null;
}
