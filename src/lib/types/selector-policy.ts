// Runtime selector contract (Block B3).
// Defines how blueprint nodes are sampled for a practice session:
// quotas, dedup rules, diversity bonuses, and presentation coverage.

import type { TaskType, ClinicalSetting, AgeGroup } from './database';
import type { DifficultyTier, DiseaseFamily, PresentationPattern } from './canonical-vocab';

// ---------------------------------------------------------------------------
// Distribution constraint — min/max percentage for a category
// ---------------------------------------------------------------------------

export interface DistributionBand {
  min_pct: number;
  max_pct: number;
}

// ---------------------------------------------------------------------------
// Selector policy — the full contract for session assembly
// ---------------------------------------------------------------------------

export interface SelectorPolicy {
  session_targets: {
    total_items: number;
    task_type_distribution: Partial<Record<TaskType, DistributionBand>>;
    clinical_setting_distribution: Partial<Record<ClinicalSetting, DistributionBand>>;
    age_group_distribution: Partial<Record<AgeGroup, DistributionBand>>;
    difficulty_distribution: Partial<Record<DifficultyTier, DistributionBand>>;
  };
  dedup: {
    max_same_disease_family: number;
    max_same_presentation_pattern: number;
    max_same_system: number;
    recent_exposure_penalty_days: number;
  };
  sampling: {
    method: 'weighted_reservoir';
    weight_source: 'frequency_score';
    diversity_bonus: number;
    cold_start_strategy: 'uniform_then_adapt';
  };
  presentation_quotas: {
    enabled: boolean;
    min_unique_presentations_per_session: number;
  };
}

// ---------------------------------------------------------------------------
// Default Medicine Shelf selector policy
// ---------------------------------------------------------------------------

export const DEFAULT_MEDICINE_SELECTOR_POLICY: SelectorPolicy = {
  session_targets: {
    total_items: 40,
    task_type_distribution: {
      diagnosis: { min_pct: 20, max_pct: 30 },
      next_step: { min_pct: 20, max_pct: 30 },
      diagnostic_test: { min_pct: 15, max_pct: 25 },
      stabilization: { min_pct: 10, max_pct: 20 },
      risk_identification: { min_pct: 5, max_pct: 15 },
      complication_recognition: { min_pct: 5, max_pct: 15 },
    },
    clinical_setting_distribution: {
      outpatient: { min_pct: 30, max_pct: 40 },
      ed: { min_pct: 20, max_pct: 30 },
      inpatient: { min_pct: 30, max_pct: 40 },
      icu: { min_pct: 5, max_pct: 10 },
    },
    age_group_distribution: {
      young_adult: { min_pct: 15, max_pct: 25 },
      middle_aged: { min_pct: 35, max_pct: 45 },
      elderly: { min_pct: 30, max_pct: 40 },
    },
    difficulty_distribution: {
      straightforward: { min_pct: 30, max_pct: 40 },
      moderate_ambiguity: { min_pct: 40, max_pct: 50 },
      trap_heavy: { min_pct: 15, max_pct: 25 },
    },
  },
  dedup: {
    max_same_disease_family: 2,
    max_same_presentation_pattern: 3,
    max_same_system: 6,
    recent_exposure_penalty_days: 7,
  },
  sampling: {
    method: 'weighted_reservoir',
    weight_source: 'frequency_score',
    diversity_bonus: 0.15,
    cold_start_strategy: 'uniform_then_adapt',
  },
  presentation_quotas: {
    enabled: true,
    min_unique_presentations_per_session: 10,
  },
};

// ---------------------------------------------------------------------------
// Audit record — proves a generated set conforms to policy
// ---------------------------------------------------------------------------

export interface SessionAudit {
  session_id: string;
  policy_snapshot: SelectorPolicy;
  actual_distribution: {
    task_types: Record<string, number>;
    clinical_settings: Record<string, number>;
    age_groups: Record<string, number>;
    difficulty_tiers: Record<string, number>;
    disease_families: Record<DiseaseFamily, number>;
    presentation_patterns: Record<PresentationPattern, number>;
    systems: Record<string, number>;
  };
  deviations: string[];
  passed: boolean;
}
