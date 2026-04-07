/**
 * Advance strategy: student is mastering this dimension.
 *
 * Actions:
 * - Increase next_review_due interval (handled by scheduler)
 * - Normal question selection on next attempt (no special targeting)
 *
 * This is the "everything is fine" path — the scheduler's exponential
 * backoff naturally spaces out review as consecutive_correct increases.
 */
export function shouldAdvance(
  consecutiveCorrect: number,
  masteryLevel: number,
): boolean {
  return consecutiveCorrect >= 2 && masteryLevel >= 0.6;
}
