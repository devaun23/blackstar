/**
 * Spaced repetition scheduler with exponential backoff.
 *
 * Intervals based on consecutive correct answers:
 * 0 correct → review now
 * 1 correct → 1 day
 * 2 correct → 3 days
 * 3 correct → 7 days
 * 4 correct → 14 days
 * 5+ correct → 30 days
 *
 * Wrong answer resets to review now.
 * Mastery level modulates: high mastery → longer intervals.
 */

const BASE_INTERVALS_HOURS = [0, 24, 72, 168, 336, 720];

export function computeNextReview(
  masteryLevel: number,
  consecutiveCorrect: number,
  wasCorrect: boolean
): Date {
  if (!wasCorrect) {
    // Wrong answer: review immediately (slight delay to avoid same-session)
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }

  const baseIndex = Math.min(consecutiveCorrect, BASE_INTERVALS_HOURS.length - 1);
  const baseHours = BASE_INTERVALS_HOURS[baseIndex];

  // High mastery extends intervals by up to 50%
  const masteryMultiplier = 1 + (masteryLevel * 0.5);

  const intervalMs = baseHours * 60 * 60 * 1000 * masteryMultiplier;
  return new Date(Date.now() + intervalMs);
}
