// Repair-aware display configuration for explanation layers.
// Progressive disclosure: Fix → Breakdown → Medicine
// Pure function — no React dependency, easy to test.

export type LayerState = 'open' | 'collapsed' | 'hidden';
export type SectionVisibility = 'open' | 'collapsed' | 'emphasized' | 'hidden';

export interface LayerConfig {
  fix: LayerState;
  breakdown: LayerState;
  medicine: LayerState;
  // Which options to expand in per-option breakdown: 'selected' | 'all' | 'none'
  optionScope: 'selected' | 'all' | 'none';
  // Emphasize specific sections within layers
  emphasize: {
    errorDiagnosis: boolean;
    transferRule: boolean;
    decisionHinge: boolean;
  };
}

type RepairAction = 'advance' | 'reinforce' | 'contrast' | 'remediate' | 'transfer_test';

const LAYER_CONFIGS: Record<RepairAction, LayerConfig> = {
  advance: {
    fix: 'hidden',
    breakdown: 'collapsed',
    medicine: 'open',
    optionScope: 'none',
    emphasize: { errorDiagnosis: false, transferRule: false, decisionHinge: false },
  },
  reinforce: {
    fix: 'open',
    breakdown: 'open',
    medicine: 'collapsed',
    optionScope: 'none',
    emphasize: { errorDiagnosis: false, transferRule: true, decisionHinge: false },
  },
  contrast: {
    fix: 'open',
    breakdown: 'open',
    medicine: 'collapsed',
    optionScope: 'selected',
    emphasize: { errorDiagnosis: true, transferRule: false, decisionHinge: true },
  },
  remediate: {
    fix: 'open',
    breakdown: 'open',
    medicine: 'collapsed',
    optionScope: 'all',
    emphasize: { errorDiagnosis: true, transferRule: true, decisionHinge: false },
  },
  transfer_test: {
    fix: 'open',
    breakdown: 'collapsed',
    medicine: 'collapsed',
    optionScope: 'none',
    emphasize: { errorDiagnosis: false, transferRule: true, decisionHinge: false },
  },
};

// Default configs when no repair action
const DEFAULT_CORRECT: LayerConfig = {
  fix: 'hidden',
  breakdown: 'collapsed',
  medicine: 'open',
  optionScope: 'none',
  emphasize: { errorDiagnosis: false, transferRule: false, decisionHinge: false },
};

const DEFAULT_INCORRECT: LayerConfig = {
  fix: 'open',
  breakdown: 'collapsed',
  medicine: 'collapsed',
  optionScope: 'all',
  emphasize: { errorDiagnosis: true, transferRule: true, decisionHinge: false },
};

export function getLayerConfig(
  repairAction: string | null,
  isCorrect: boolean,
): LayerConfig {
  if (repairAction && repairAction in LAYER_CONFIGS) {
    return LAYER_CONFIGS[repairAction as RepairAction];
  }
  return isCorrect ? DEFAULT_CORRECT : DEFAULT_INCORRECT;
}

export function isLayerOpen(state: LayerState): boolean {
  return state === 'open';
}

export function isLayerVisible(state: LayerState): boolean {
  return state !== 'hidden';
}

// ─── Legacy compatibility (used by individual card components) ───

export interface SectionConfig {
  errorDiagnosis: SectionVisibility;
  transferRule: SectionVisibility;
  whyCorrect: SectionVisibility;
  reasoningPathway: SectionVisibility;
  decisionHinge: SectionVisibility;
  perOptionBreakdown: SectionVisibility;
  visualExplanation: SectionVisibility;
  highYieldPearl: SectionVisibility;
  optionScope: 'selected' | 'all' | 'none';
}

/** Convert LayerConfig to legacy SectionConfig for backward compat */
export function getSectionConfig(
  repairAction: string | null,
  isCorrect: boolean,
): SectionConfig {
  const lc = getLayerConfig(repairAction, isCorrect);

  const fixVis = lc.fix === 'hidden' ? 'hidden' as const : 'open' as const;
  const breakdownVis = lc.breakdown === 'hidden' ? 'hidden' as const
    : lc.breakdown === 'open' ? 'open' as const : 'collapsed' as const;
  const medicineVis = lc.medicine === 'hidden' ? 'hidden' as const
    : lc.medicine === 'open' ? 'open' as const : 'collapsed' as const;

  return {
    errorDiagnosis: lc.emphasize.errorDiagnosis && fixVis !== 'hidden' ? 'emphasized' : fixVis,
    transferRule: lc.emphasize.transferRule && fixVis !== 'hidden' ? 'emphasized' : fixVis,
    whyCorrect: breakdownVis,
    reasoningPathway: breakdownVis,
    decisionHinge: lc.emphasize.decisionHinge && breakdownVis !== 'hidden' ? 'emphasized' : breakdownVis,
    perOptionBreakdown: breakdownVis,
    visualExplanation: medicineVis,
    highYieldPearl: medicineVis,
    optionScope: lc.optionScope,
  };
}

export function isOpen(v: SectionVisibility): boolean {
  return v === 'open' || v === 'emphasized';
}

export function isVisible(v: SectionVisibility): boolean {
  return v !== 'hidden';
}

export function isEmphasized(v: SectionVisibility): boolean {
  return v === 'emphasized';
}
