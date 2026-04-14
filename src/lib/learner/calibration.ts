import { createAdminClient } from '@/lib/supabase/admin';

export interface CalibrationScore {
  totalConfident: number;
  confidentAndCorrect: number;
  calibrationFactor: number;
  overconfidentTopics: { topic: string; confidence: number; accuracy: number }[];
  underconfidentTopics: { topic: string; confidence: number; accuracy: number }[];
}

/**
 * Computes calibration metrics for a user.
 * Calibration = how well their confidence predicts correctness.
 *
 * "Confident" = confidence_pre >= 4 (out of 5)
 * calibration_factor = confident_and_correct / total_confident
 */
export async function getCalibrationScore(userId: string): Promise<CalibrationScore> {
  const supabase = createAdminClient();

  // Fetch all attempts with confidence data
  const { data: attempts } = await supabase
    .from('attempt_v2')
    .select('is_correct, confidence_pre, question_id, item_draft_id')
    .eq('user_id', userId)
    .not('confidence_pre', 'is', null);

  const rows = (attempts ?? []) as {
    is_correct: boolean;
    confidence_pre: number;
    question_id: string | null;
    item_draft_id: string | null;
  }[];

  // Overall calibration
  const confident = rows.filter(r => r.confidence_pre >= 4);
  const confidentAndCorrect = confident.filter(r => r.is_correct).length;
  const calibrationFactor = confident.length > 0
    ? confidentAndCorrect / confident.length
    : 1; // No data → assume calibrated

  // Per-topic calibration (need to join with questions for topic)
  // For now, use question_id to look up system_topic
  const topicStats = new Map<string, { confident: number; confidentCorrect: number; total: number; correct: number }>();

  // Batch-fetch topics for all question IDs
  const questionIds = rows.map(r => r.question_id).filter(Boolean) as string[];
  const topicMap = new Map<string, string>();

  if (questionIds.length > 0) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id, system_topic')
      .in('id', questionIds);

    for (const q of (questions ?? []) as { id: string; system_topic: string }[]) {
      topicMap.set(q.id, q.system_topic);
    }
  }

  for (const row of rows) {
    const topic = row.question_id ? topicMap.get(row.question_id) : null;
    if (!topic) continue;

    const stats = topicStats.get(topic) ?? { confident: 0, confidentCorrect: 0, total: 0, correct: 0 };
    stats.total++;
    if (row.is_correct) stats.correct++;
    if (row.confidence_pre >= 4) {
      stats.confident++;
      if (row.is_correct) stats.confidentCorrect++;
    }
    topicStats.set(topic, stats);
  }

  // Overconfident: high confidence, low accuracy (confidence rate > accuracy rate + 15%)
  const overconfidentTopics: { topic: string; confidence: number; accuracy: number }[] = [];
  const underconfidentTopics: { topic: string; confidence: number; accuracy: number }[] = [];

  for (const [topic, stats] of topicStats) {
    if (stats.total < 5) continue; // Need minimum data
    const accuracy = stats.correct / stats.total;
    const confidentRate = stats.total > 0 ? stats.confident / stats.total : 0;

    if (confidentRate > accuracy + 0.15) {
      overconfidentTopics.push({
        topic,
        confidence: Math.round(confidentRate * 100),
        accuracy: Math.round(accuracy * 100),
      });
    } else if (accuracy > confidentRate + 0.15) {
      underconfidentTopics.push({
        topic,
        confidence: Math.round(confidentRate * 100),
        accuracy: Math.round(accuracy * 100),
      });
    }
  }

  // Sort by magnitude of miscalibration
  overconfidentTopics.sort((a, b) => (b.confidence - b.accuracy) - (a.confidence - a.accuracy));
  underconfidentTopics.sort((a, b) => (b.accuracy - b.confidence) - (a.accuracy - a.confidence));

  return {
    totalConfident: confident.length,
    confidentAndCorrect,
    calibrationFactor,
    overconfidentTopics,
    underconfidentTopics,
  };
}
