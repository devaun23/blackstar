import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getLearnerProfile } from '@/lib/learner/model';
import { getDueReviewCount } from '@/lib/learner/selector';
import { getCalibrationScore } from '@/lib/learner/calibration';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profile, dueCount, calibration, sessionsResult, attemptsResult, profileRow] = await Promise.all([
    getLearnerProfile(user.id),
    getDueReviewCount(user.id),
    getCalibrationScore(user.id),
    supabase
      .from('learning_session')
      .select('id, mode, status, target_count, completed_count, correct_count, started_at, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('attempt_v2')
      .select('is_correct, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
  ]);

  // Compute daily accuracy trend
  const dailyMap = new Map<string, { correct: number; total: number }>();
  for (const a of attemptsResult.data ?? []) {
    const day = a.created_at.slice(0, 10);
    const entry = dailyMap.get(day) ?? { correct: 0, total: 0 };
    entry.total++;
    if (a.is_correct) entry.correct++;
    dailyMap.set(day, entry);
  }
  const accuracyTrend = Array.from(dailyMap.entries())
    .map(([date, { correct, total }]) => ({
      date,
      accuracy: Math.round((correct / total) * 100),
      total,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute study streak
  const sessionDays = new Set(
    (sessionsResult.data ?? [])
      .map(s => (s.completed_at ?? s.started_at).slice(0, 10))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (sessionDays.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const totalAttempts = attemptsResult.data?.length ?? 0;
  const totalCorrect = attemptsResult.data?.filter(a => a.is_correct).length ?? 0;

  // Error patterns from cognitive_error dimensions
  const errorPatterns = profile.dimensions
    .filter(d => d.dimensionType === 'cognitive_error')
    .map(d => ({
      id: d.dimensionId,
      label: d.dimensionLabel,
      wrongCount: d.totalAttempts - d.correctCount,
      totalAttempts: d.totalAttempts,
      masteryLevel: d.masteryLevel,
    }))
    .filter(e => e.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  // Sessions with computed accuracy
  const sessions = (sessionsResult.data ?? []).map(s => ({
    ...s,
    accuracy: s.completed_count > 0
      ? Math.round((s.correct_count / s.completed_count) * 100)
      : 0,
  }));

  const displayName = profileRow.data?.full_name ?? user.email?.split('@')[0] ?? 'Student';

  return (
    <DashboardClient
      displayName={displayName}
      overview={{
        totalAttempts,
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        streak,
        dueReviewCount: dueCount,
      }}
      mastery={{
        overall: Math.round(profile.overallMastery * 100),
        dimensions: profile.dimensions.map(d => ({
          type: d.dimensionType,
          id: d.dimensionId,
          label: d.dimensionLabel,
          mastery: Math.round(d.masteryLevel * 100),
          attempts: d.totalAttempts,
          correct: d.correctCount,
        })),
        weakest: profile.weakestDimensions.map(d => ({
          type: d.dimensionType,
          id: d.dimensionId,
          label: d.dimensionLabel,
          mastery: Math.round(d.masteryLevel * 100),
          attempts: d.totalAttempts,
        })),
      }}
      calibration={calibration}
      errorPatterns={errorPatterns}
      accuracyTrend={accuracyTrend}
      sessions={sessions}
    />
  );
}
