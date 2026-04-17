import type { DimensionType } from '@/lib/types/database';

/**
 * Reinforce strategy: correct but slow/uncertain.
 *
 * Selection: Same target_transfer_rule_id (or same topic), different question.
 * The goal is to build automaticity — they know the rule but need more practice.
 */
export interface ReinforceTarget {
  dimensionType: DimensionType;
  dimensionId: string;
  excludeQuestionId: string; // Don't serve the same question
  /** When set, prefer items from this variant group (same skeleton, different surface) */
  preferVariantGroupId?: string;
}

export function buildReinforceTarget(
  dimensionType: DimensionType,
  dimensionId: string,
  lastQuestionId: string,
  preferVariantGroupId?: string,
): ReinforceTarget {
  return {
    dimensionType,
    dimensionId,
    excludeQuestionId: lastQuestionId,
    ...(preferVariantGroupId ? { preferVariantGroupId } : {}),
  };
}
