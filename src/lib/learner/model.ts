import { createAdminClient } from '@/lib/supabase/admin';
import type { DimensionType, LearnerModelRow } from '@/lib/types/database';
import type { DimensionMastery, LearnerProfile } from './types';
import { fromRow } from './types';
import { computeNextReview } from './scheduler';

/**
 * Fetches the full learner profile for a user across all dimensions.
 */
export async function getLearnerProfile(userId: string): Promise<LearnerProfile> {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from('learner_model')
    .select('*')
    .eq('user_id', userId)
    .order('mastery_level', { ascending: true });

  const dimensions = (rows ?? []).map((r: LearnerModelRow) => fromRow(r));
  const overallMastery = dimensions.length > 0
    ? dimensions.reduce((sum, d) => sum + d.masteryLevel, 0) / dimensions.length
    : 0;

  // Weakest = lowest mastery OR overdue for review
  const now = new Date();
  const weakest = dimensions
    .filter(d => d.nextReviewDue <= now || d.masteryLevel < 0.7)
    .sort((a, b) => a.masteryLevel - b.masteryLevel)
    .slice(0, 5);

  return {
    userId,
    dimensions,
    weakestDimensions: weakest,
    overallMastery,
  };
}

/**
 * Gets the N weakest dimensions for a user, optionally filtered by type.
 */
export async function getWeakestDimensions(
  userId: string,
  limit: number = 3,
  dimensionType?: DimensionType
): Promise<DimensionMastery[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('learner_model')
    .select('*')
    .eq('user_id', userId)
    .order('mastery_level', { ascending: true })
    .limit(limit);

  if (dimensionType) {
    query = query.eq('dimension_type', dimensionType);
  }

  const { data: rows } = await query;
  return (rows ?? []).map((r: LearnerModelRow) => fromRow(r));
}

/**
 * Updates the learner model after an attempt.
 * Creates the dimension row if it doesn't exist (upsert).
 */
export async function updateAfterAttempt(
  userId: string,
  dimensionType: DimensionType,
  dimensionId: string,
  dimensionLabel: string,
  isCorrect: boolean,
  timeSpentMs: number | null,
  errorName?: string
): Promise<void> {
  const supabase = createAdminClient();

  // Fetch current state
  const { data: existing } = await supabase
    .from('learner_model')
    .select('*')
    .eq('user_id', userId)
    .eq('dimension_type', dimensionType)
    .eq('dimension_id', dimensionId)
    .single();

  const current = existing as LearnerModelRow | null;

  const totalAttempts = (current?.total_attempts ?? 0) + 1;
  const correctCount = (current?.correct_count ?? 0) + (isCorrect ? 1 : 0);
  const consecutiveCorrect = isCorrect
    ? (current?.consecutive_correct ?? 0) + 1
    : 0;

  // Simple Bayesian-ish mastery update
  const rawAccuracy = correctCount / totalAttempts;
  const smoothingWeight = Math.min(totalAttempts / 10, 1); // ramp up confidence
  const masteryLevel = Math.max(0, Math.min(1,
    rawAccuracy * smoothingWeight + 0.5 * (1 - smoothingWeight)
  ));

  // Update average time
  const prevAvg = current?.avg_time_ms ?? 0;
  const avgTimeMs = timeSpentMs != null
    ? Math.round((prevAvg * (totalAttempts - 1) + timeSpentMs) / totalAttempts)
    : current?.avg_time_ms ?? null;

  // Update error frequency
  const errorFrequency = (current?.error_frequency ?? {}) as Record<string, number>;
  if (errorName && !isCorrect) {
    errorFrequency[errorName] = (errorFrequency[errorName] ?? 0) + 1;
  }

  const nextReviewDue = computeNextReview(masteryLevel, consecutiveCorrect, isCorrect);

  const payload = {
    user_id: userId,
    dimension_type: dimensionType,
    dimension_id: dimensionId,
    dimension_label: dimensionLabel,
    mastery_level: masteryLevel,
    total_attempts: totalAttempts,
    correct_count: correctCount,
    consecutive_correct: consecutiveCorrect,
    next_review_due: nextReviewDue.toISOString(),
    avg_time_ms: avgTimeMs,
    error_frequency: errorFrequency,
  };

  await supabase
    .from('learner_model')
    .upsert(payload, { onConflict: 'user_id,dimension_type,dimension_id' });
}
