// ─── Pack Registry Index ───
// Central registry for all source packs. Dynamic imports keep the bundle lean.

import type { SourcePack, PackStatus } from './types';

const PACK_REGISTRY: Record<string, () => Promise<SourcePack>> = {
  'PACK.ACG.AP.2024': () =>
    import('./acg-acute-pancreatitis').then((m) => m.pack),
  'PACK.AASLD.CSBP.2021': () =>
    import('./aasld-cirrhosis-sbp').then((m) => m.pack),
  'PACK.ACG.GIB.2021': () =>
    import('./acg-gi-bleeding').then((m) => m.pack),
  'PACK.SSC.SEPSIS.2021': () =>
    import('./surviving-sepsis-2021').then((m) => m.pack),
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
