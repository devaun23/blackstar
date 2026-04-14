import type { DimensionType, RepairAction, LearnerModelRow } from '@/lib/types/database';

export interface DimensionMastery {
  dimensionType: DimensionType;
  dimensionId: string;
  dimensionLabel: string;
  masteryLevel: number;
  totalAttempts: number;
  correctCount: number;
  consecutiveCorrect: number;
  nextReviewDue: Date;
  avgTimeMs: number | null;
  errorFrequency: Record<string, number>;
}

export interface LearnerProfile {
  userId: string;
  dimensions: DimensionMastery[];
  weakestDimensions: DimensionMastery[];
  overallMastery: number;
}

export interface SelectionStrategy {
  dimensionType: DimensionType;
  dimensionId: string;
  reason: string;
  repairAction?: RepairAction;
}

export interface AttemptDiagnosis {
  isCorrect: boolean;
  timeSpentMs: number | null;
  confidencePre: number | null;
  diagnosedCognitiveErrorId: string | null;
  diagnosedHingeMiss: boolean;
  diagnosedActionClassConfusion: boolean;
  repairAction: RepairAction;
}

export function fromRow(row: LearnerModelRow): DimensionMastery {
  return {
    dimensionType: row.dimension_type,
    dimensionId: row.dimension_id,
    dimensionLabel: row.dimension_label,
    masteryLevel: row.mastery_level,
    totalAttempts: row.total_attempts,
    correctCount: row.correct_count,
    consecutiveCorrect: row.consecutive_correct,
    nextReviewDue: new Date(row.next_review_due),
    avgTimeMs: row.avg_time_ms,
    errorFrequency: (row.error_frequency ?? {}) as Record<string, number>,
  };
}
