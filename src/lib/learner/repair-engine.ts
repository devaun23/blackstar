import type { RepairAction, DimensionType } from '@/lib/types/database';
import type { PalmertonGapType } from '@/lib/factory/seeds/error-taxonomy';
import type { DimensionMastery } from './types';
import { getWeakestDimensions } from './model';

export interface RepairContext {
  userId: string;
  isCorrect: boolean;
  timeSpentMs: number | null;
  confidencePre: number | null;
  diagnosedCognitiveErrorId: string | null;
  diagnosedHingeMiss: boolean;
  diagnosedActionClassConfusion: boolean;
  // How many times this specific cognitive error has been seen
  errorRepeatCount: number;
  // Mastery on the dimension being tested
  dimensionMastery: number | null;
  // Confusion set of the question just answered (for contrast loop)
  confusionSetId: string | null;
  // Correct option frame ID of the question just answered (to exclude from contrast)
  lastCorrectOptionFrameId: string | null;
  // Palmerton gap type for the diagnosed cognitive error (optional — used as tie-breaker)
  palmertonGapType?: PalmertonGapType | null;
}

export interface RepairDecision {
  action: RepairAction;
  reason: string;
  targetDimensionType: DimensionType | null;
  targetDimensionId: string | null;
}

// Thresholds
const FAST_TIME_MS = 30_000;       // Under 30s = fast
const SLOW_TIME_MS = 90_000;       // Over 90s = slow
const HIGH_CONFIDENCE = 4;          // 4-5 = confident
const REPEAT_ERROR_THRESHOLD = 3;   // 3x same error = remediate
const HIGH_MASTERY = 0.7;           // >70% mastery on dimension

/**
 * Diagnoses reasoning failure and routes to the appropriate repair action.
 *
 * Decision tree:
 *   correct + confident + fast   → advance
 *   correct + slow/uncertain     → reinforce
 *   wrong + confusion set match  → contrast
 *   wrong + repeated error (3x)  → remediate
 *   wrong + high topic mastery   → transfer_test
 *   wrong + default              → remediate
 */
export function diagnoseRepairAction(ctx: RepairContext): RepairDecision {
  if (ctx.isCorrect) {
    return diagnoseCorrectAnswer(ctx);
  }
  return diagnoseWrongAnswer(ctx);
}

function diagnoseCorrectAnswer(ctx: RepairContext): RepairDecision {
  const isFast = ctx.timeSpentMs != null && ctx.timeSpentMs <= FAST_TIME_MS;
  const isConfident = ctx.confidencePre != null && ctx.confidencePre >= HIGH_CONFIDENCE;
  const isSlow = ctx.timeSpentMs != null && ctx.timeSpentMs >= SLOW_TIME_MS;
  const isUncertain = ctx.confidencePre != null && ctx.confidencePre < HIGH_CONFIDENCE;

  if ((isConfident || isFast) && !isSlow) {
    return {
      action: 'advance',
      reason: 'Correct, confident, and efficient — increase review interval',
      targetDimensionType: null,
      targetDimensionId: null,
    };
  }

  // Correct but slow or uncertain — reinforce with same rule, new vignette
  if (isSlow || isUncertain) {
    return {
      action: 'reinforce',
      reason: 'Correct but slow/uncertain — reinforce with a similar question',
      targetDimensionType: null,
      targetDimensionId: null,
    };
  }

  // Default for correct: advance
  return {
    action: 'advance',
    reason: 'Correct — standard advance',
    targetDimensionType: null,
    targetDimensionId: null,
  };
}

function diagnoseWrongAnswer(ctx: RepairContext): RepairDecision {
  // Priority 1: Repeated cognitive error (3x+) → remediate
  if (ctx.errorRepeatCount >= REPEAT_ERROR_THRESHOLD && ctx.diagnosedCognitiveErrorId) {
    return {
      action: 'remediate',
      reason: `Same cognitive error repeated ${ctx.errorRepeatCount}x — targeted remediation`,
      targetDimensionType: 'cognitive_error',
      targetDimensionId: ctx.diagnosedCognitiveErrorId,
    };
  }

  // Priority 2: CONTRAST LOOP — if question has confusion_set, ALWAYS contrast.
  // This is the core learning mechanism: wrong → same confusion set, different correct answer.
  // Deterministic, not probabilistic.
  if (ctx.confusionSetId) {
    return {
      action: 'contrast',
      reason: 'Wrong in confusion set — immediate contrast with different correct answer',
      targetDimensionType: 'confusion_set',
      targetDimensionId: ctx.confusionSetId,
    };
  }

  // Priority 3: High topic mastery but wrong → transfer test
  if (ctx.dimensionMastery != null && ctx.dimensionMastery >= HIGH_MASTERY) {
    return {
      action: 'transfer_test',
      reason: 'High mastery but wrong — test rule transfer to new context',
      targetDimensionType: null,
      targetDimensionId: null,
    };
  }

  // Priority 4: Cognitive error diagnosed → remediate
  if (ctx.diagnosedCognitiveErrorId) {
    return {
      action: 'remediate',
      reason: 'Cognitive error diagnosed — targeted remediation',
      targetDimensionType: 'cognitive_error',
      targetDimensionId: ctx.diagnosedCognitiveErrorId,
    };
  }

  // Priority 5: Hinge miss → reinforce
  if (ctx.diagnosedHingeMiss) {
    return {
      action: 'reinforce',
      reason: 'Missed the hinge clue — reinforce with similar question',
      targetDimensionType: null,
      targetDimensionId: null,
    };
  }

  // Priority 6: Gap-type-aware routing (Palmerton methodology tie-breaker)
  // When no stronger signal exists, use the gap type to choose the best repair strategy
  if (ctx.palmertonGapType) {
    switch (ctx.palmertonGapType) {
      case 'noise':
        // Noise gap → prefer contrast to train discrimination, even without confusion_set match
        return {
          action: 'contrast',
          reason: 'Noise gap error — contrast practice to sharpen discrimination',
          targetDimensionType: ctx.diagnosedCognitiveErrorId ? 'cognitive_error' : null,
          targetDimensionId: ctx.diagnosedCognitiveErrorId,
        };
      case 'skills':
        // Skills gap → remediate with hinge-focused questions (drill interpretation)
        return {
          action: 'remediate',
          reason: 'Skills gap error — drill interpretation until pattern is automatic',
          targetDimensionType: ctx.diagnosedCognitiveErrorId ? 'cognitive_error' : null,
          targetDimensionId: ctx.diagnosedCognitiveErrorId,
        };
      case 'consistency':
        // Consistency gap → reinforce (process repetition, not new content)
        return {
          action: 'reinforce',
          reason: 'Consistency gap error — reinforce process execution with similar question',
          targetDimensionType: null,
          targetDimensionId: null,
        };
    }
  }

  // Default: remediate
  return {
    action: 'remediate',
    reason: 'Wrong answer, no specific diagnosis — general remediation',
    targetDimensionType: null,
    targetDimensionId: null,
  };
}

/**
 * Gets the error repeat count for a specific cognitive error for a user.
 */
export async function getErrorRepeatCount(
  userId: string,
  cognitiveErrorId: string
): Promise<number> {
  const dims = await getWeakestDimensions(userId, 1, 'cognitive_error');
  const match = dims.find(d => d.dimensionId === cognitiveErrorId);
  if (!match) return 0;
  return match.totalAttempts - match.correctCount; // wrong count for this error
}
