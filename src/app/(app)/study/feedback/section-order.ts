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

// ─── v7 — 7-component adaptive visibility ───

export type ComponentState = 'open' | 'collapsed' | 'hidden';
export type SelfLabel = 'didnt_know' | 'misread_question' | 'between_two' | 'rushed' | null;
export type MasteryTier = 'novice' | 'targeted' | 'expert';

export interface ComponentVisibility {
  anchor: ComponentState;          // always 'open'
  pattern: ComponentState;
  concept: ComponentState;
  reasoning: { mode: 'full' | 'compressed'; state: ComponentState };
  contrast: ComponentState;
  algorithm: ComponentState;
  traps: ComponentState;
  pharmacology: ComponentState;
}

export interface VisibilityInput {
  masteryLevel: number | null;     // null → treat as 0.5 (neutral targeted)
  selfLabel: SelfLabel;
  isCorrect: boolean;
  hasConfusionSet: boolean;
  hasDrugs: boolean;
  errorName: string | null;
}

const SEQUENCING_ERRORS = new Set([
  'skipping_required_diagnostic_step',
  'wrong_priority_sequence',
  'premature_escalation',
  'sequencing_error',
  'next_step_error',
]);

const CONFUSION_ERRORS = new Set([
  'confusion_set_miss',
  'anchoring',
  'anchoring_bias',
]);

/** Resolve the effective mastery tier from mastery + self-label. Label overrides score. */
export function resolveTier(masteryLevel: number | null, selfLabel: SelfLabel): MasteryTier {
  if (selfLabel === 'didnt_know') return 'novice';
  if (selfLabel === 'between_two') return 'targeted';
  if (selfLabel === 'rushed') return 'expert';
  // misread_question or null → fall through to mastery
  const m = masteryLevel ?? 0.5;
  if (m < 0.4) return 'novice';
  if (m > 0.7) return 'expert';
  return 'targeted';
}

/**
 * Compute which of the 7 adaptive components to show based on mastery tier and attempt state.
 * Priority: correctness short-circuits → error-type overrides → mastery/label tier.
 */
export function getComponentVisibility(input: VisibilityInput): ComponentVisibility {
  const { masteryLevel, selfLabel, isCorrect, hasConfusionSet, hasDrugs, errorName } = input;

  // Correct answer short-circuits to rapid review regardless of mastery
  if (isCorrect) {
    return {
      anchor: 'open',
      pattern: 'hidden',
      concept: 'hidden',
      reasoning: { mode: 'compressed', state: 'open' },
      contrast: 'collapsed',
      algorithm: 'collapsed',
      traps: 'hidden',
      pharmacology: hasDrugs ? 'collapsed' : 'hidden',
    };
  }

  const tier = resolveTier(masteryLevel, selfLabel);

  let v: ComponentVisibility;
  if (tier === 'novice') {
    v = {
      anchor: 'open',
      pattern: 'open',
      concept: 'open',
      reasoning: { mode: 'full', state: 'open' },
      contrast: hasConfusionSet ? 'collapsed' : 'hidden',
      algorithm: 'open',
      traps: 'open',
      pharmacology: hasDrugs ? 'open' : 'hidden',
    };
  } else if (tier === 'targeted') {
    v = {
      anchor: 'open',
      pattern: 'collapsed',
      concept: 'collapsed',
      reasoning: { mode: 'full', state: 'open' },
      contrast: hasConfusionSet ? 'open' : 'hidden',
      algorithm: 'collapsed',
      traps: 'open',
      pharmacology: hasDrugs ? 'collapsed' : 'hidden',
    };
  } else {
    v = {
      anchor: 'open',
      pattern: 'hidden',
      concept: 'hidden',
      reasoning: { mode: 'compressed', state: 'open' },
      contrast: 'collapsed',
      algorithm: 'collapsed',
      traps: 'open',
      pharmacology: 'hidden',
    };
  }

  // Error-type overrides (force critical sections open)
  if (errorName) {
    if (SEQUENCING_ERRORS.has(errorName) && v.algorithm !== 'hidden') {
      v.algorithm = 'open';
    }
    if (CONFUSION_ERRORS.has(errorName) && hasConfusionSet) {
      v.contrast = 'open';
    }
  }

  return v;
}

export function isComponentOpen(s: ComponentState): boolean {
  return s === 'open';
}

export function isComponentVisible(s: ComponentState): boolean {
  return s !== 'hidden';
}
