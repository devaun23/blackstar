import { createAdminClient } from '@/lib/supabase/admin';

export interface TimingBracket {
  bracket: string;
  minMs: number;
  maxMs: number;
  accuracy: number;
  count: number;
}

export interface TimingAnalysis {
  avgTimeMs: number;
  totalAttempts: number;
  accuracyByBracket: TimingBracket[];
  optimalBracket: string;
  recommendation: string | null;
}

// Palmerton's 2-minute rule: accuracy drops precipitously past 120s
const BRACKETS: { bracket: string; minMs: number; maxMs: number }[] = [
  { bracket: 'under_30s', minMs: 0, maxMs: 30_000 },
  { bracket: '30_60s', minMs: 30_000, maxMs: 60_000 },
  { bracket: '60_90s', minMs: 60_000, maxMs: 90_000 },
  { bracket: '90_120s', minMs: 90_000, maxMs: 120_000 },
  { bracket: 'over_120s', minMs: 120_000, maxMs: Infinity },
];

const MIN_ATTEMPTS_FOR_ANALYSIS = 10;

/**
 * Analyzes time-to-answer patterns and accuracy by time bracket.
 * Based on Palmerton's 2-minute rule: spending >120s on a question
 * correlates with lower accuracy, not higher.
 */
export async function analyzeTimingPatterns(userId: string): Promise<TimingAnalysis | null> {
  const supabase = createAdminClient();

  const { data: attempts } = await supabase
    .from('attempt_v2')
    .select('is_correct, time_spent_ms')
    .eq('user_id', userId)
    .not('time_spent_ms', 'is', null);

  const rows = (attempts ?? []) as { is_correct: boolean; time_spent_ms: number }[];

  if (rows.length < MIN_ATTEMPTS_FOR_ANALYSIS) {
    return null;
  }

  // Overall average
  const totalTime = rows.reduce((sum, r) => sum + r.time_spent_ms, 0);
  const avgTimeMs = Math.round(totalTime / rows.length);

  // Accuracy by bracket
  const bracketStats = BRACKETS.map(b => ({
    ...b,
    correct: 0,
    total: 0,
  }));

  for (const row of rows) {
    const bracket = bracketStats.find(b => row.time_spent_ms >= b.minMs && row.time_spent_ms < b.maxMs);
    if (bracket) {
      bracket.total++;
      if (row.is_correct) bracket.correct++;
    }
  }

  const accuracyByBracket: TimingBracket[] = bracketStats
    .filter(b => b.total > 0)
    .map(b => ({
      bracket: b.bracket,
      minMs: b.minMs,
      maxMs: b.maxMs,
      accuracy: Math.round((b.correct / b.total) * 100),
      count: b.total,
    }));

  // Find optimal bracket (highest accuracy with >= 5 attempts)
  const qualifiedBrackets = accuracyByBracket.filter(b => b.count >= 5);
  const optimal = qualifiedBrackets.length > 0
    ? qualifiedBrackets.reduce((best, b) => b.accuracy > best.accuracy ? b : best)
    : accuracyByBracket[0];

  const optimalBracket = optimal?.bracket ?? '60_90s';

  // Generate recommendation
  const recommendation = generateTimingRecommendation(accuracyByBracket, avgTimeMs);

  return {
    avgTimeMs,
    totalAttempts: rows.length,
    accuracyByBracket,
    optimalBracket,
    recommendation,
  };
}

/**
 * Generates a single-question timing feedback message based on the
 * time spent on the most recent question.
 */
export function getTimingFeedback(
  timeSpentMs: number,
  userAvgTimeMs: number | null,
): string | null {
  if (timeSpentMs < 30_000 && userAvgTimeMs && userAvgTimeMs > 60_000) {
    return `You answered in ${Math.round(timeSpentMs / 1000)}s — faster than your usual ${Math.round(userAvgTimeMs / 1000)}s. Rushing can cost easy points.`;
  }

  if (timeSpentMs > 120_000) {
    return `You spent ${Math.round(timeSpentMs / 1000)}s on this question. Past 2 minutes, accuracy typically drops. When stuck, commit to your best answer and move on.`;
  }

  return null;
}

function generateTimingRecommendation(
  brackets: TimingBracket[],
  avgTimeMs: number,
): string | null {
  const fast = brackets.find(b => b.bracket === 'under_30s');
  const optimal = brackets.find(b => b.bracket === '60_90s');
  const slow = brackets.find(b => b.bracket === 'over_120s');

  // Rushing pattern
  if (fast && optimal && fast.count >= 5 && optimal.count >= 5) {
    const diff = optimal.accuracy - fast.accuracy;
    if (diff > 15) {
      return `Your accuracy is ${diff}% higher when you take 60-90 seconds vs under 30 seconds. Slow down on questions you feel confident about.`;
    }
  }

  // Overthinking pattern
  if (slow && optimal && slow.count >= 5 && optimal.count >= 5) {
    const diff = optimal.accuracy - slow.accuracy;
    if (diff > 10) {
      return `Your accuracy drops ${diff}% when you spend over 2 minutes. Extra time usually means second-guessing — commit to your best answer at 90 seconds.`;
    }
  }

  // General timing note
  if (avgTimeMs > 120_000) {
    return 'You average over 2 minutes per question. The Palmerton 2-minute rule: past 120 seconds, accuracy drops. Practice committing to answers faster.';
  }

  return null;
}
