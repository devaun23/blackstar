import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/analytics/phase1?userId=X
 *
 * Returns the 4 Phase 1 decision-grade metrics:
 * 1. Error repetition rate (per session) — core KPI
 * 2. Contrast success rate
 * 3. Time compression (avg time per confusion set, session 1 vs session 3)
 * 4. Overconfidence rate (per session)
 *
 * JSON only. No dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch all attempts for this user, ordered by creation time
  const { data: attempts, error } = await supabase
    .from('attempt_v2')
    .select('id, session_id, is_correct, time_spent_ms, confidence_pre, diagnosed_cognitive_error_id, confusion_set_id, is_contrast_question, contrast_success, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({
      error_repetition_rate: {},
      contrast_success_rate: null,
      time_compression: {},
      overconfidence_rate: {},
      total_attempts: 0,
    });
  }

  // Group attempts by session (use session_id, or chunk by time if no session)
  const sessionIds = [...new Set(attempts.map(a => a.session_id).filter(Boolean))] as string[];
  const sessionOrder = new Map(sessionIds.map((id, i) => [id, i + 1]));

  // --- Metric 1: Error Repetition Rate ---
  // For each session: count of (same cognitive_error + same confusion_set repeated) / total attempts
  const errorRepetitionBySession: Record<string, number> = {};
  const seenErrors = new Set<string>(); // "confusion_set_id:cognitive_error_id"

  for (const attempt of attempts) {
    const sessionNum = attempt.session_id ? sessionOrder.get(attempt.session_id) : null;
    if (!sessionNum) continue;

    const sessionKey = `session_${sessionNum}`;
    if (!errorRepetitionBySession[sessionKey]) {
      errorRepetitionBySession[sessionKey] = 0;
    }

    if (!attempt.is_correct && attempt.confusion_set_id && attempt.diagnosed_cognitive_error_id) {
      const errorKey = `${attempt.confusion_set_id}:${attempt.diagnosed_cognitive_error_id}`;
      if (seenErrors.has(errorKey)) {
        // This is a REPEATED error — same confusion set + same cognitive error
        errorRepetitionBySession[sessionKey]++;
      }
      seenErrors.add(errorKey);
    }
  }

  // Normalize by total attempts per session
  const attemptsPerSession: Record<string, number> = {};
  for (const attempt of attempts) {
    const sessionNum = attempt.session_id ? sessionOrder.get(attempt.session_id) : null;
    if (!sessionNum) continue;
    const sessionKey = `session_${sessionNum}`;
    attemptsPerSession[sessionKey] = (attemptsPerSession[sessionKey] ?? 0) + 1;
  }

  const errorRepetitionRate: Record<string, number> = {};
  for (const [session, repeats] of Object.entries(errorRepetitionBySession)) {
    const total = attemptsPerSession[session] ?? 1;
    errorRepetitionRate[session] = Math.round((repeats / total) * 100) / 100;
  }

  // --- Metric 2: Contrast Success Rate ---
  const contrastAttempts = attempts.filter(a => a.is_contrast_question);
  const contrastSuccesses = contrastAttempts.filter(a => a.contrast_success === true);
  const contrastSuccessRate = contrastAttempts.length > 0
    ? Math.round((contrastSuccesses.length / contrastAttempts.length) * 100) / 100
    : null;

  // --- Metric 3: Time Compression ---
  // Average time per confusion_set per session
  const timeBySessionAndCs: Record<string, Record<string, number[]>> = {};
  for (const attempt of attempts) {
    const sessionNum = attempt.session_id ? sessionOrder.get(attempt.session_id) : null;
    if (!sessionNum || !attempt.confusion_set_id || !attempt.time_spent_ms) continue;

    const sessionKey = `session_${sessionNum}`;
    if (!timeBySessionAndCs[sessionKey]) timeBySessionAndCs[sessionKey] = {};
    if (!timeBySessionAndCs[sessionKey][attempt.confusion_set_id]) {
      timeBySessionAndCs[sessionKey][attempt.confusion_set_id] = [];
    }
    timeBySessionAndCs[sessionKey][attempt.confusion_set_id].push(attempt.time_spent_ms);
  }

  const timeCompression: Record<string, number> = {};
  for (const [session, csTimes] of Object.entries(timeBySessionAndCs)) {
    const allTimes = Object.values(csTimes).flat();
    const avg = allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length;
    timeCompression[`${session}_avg_ms`] = Math.round(avg);
  }

  // --- Metric 4: Overconfidence Rate ---
  // confident (≥4) AND wrong / total confident answers, per session
  const overconfidenceRate: Record<string, number> = {};
  for (const sessionKey of Object.keys(attemptsPerSession)) {
    const sessionNum = parseInt(sessionKey.replace('session_', ''));
    const sessionAttempts = attempts.filter(a => {
      const num = a.session_id ? sessionOrder.get(a.session_id) : null;
      return num === sessionNum;
    });

    const confidentAttempts = sessionAttempts.filter(a => a.confidence_pre != null && a.confidence_pre >= 4);
    const confidentWrong = confidentAttempts.filter(a => !a.is_correct);

    overconfidenceRate[sessionKey] = confidentAttempts.length > 0
      ? Math.round((confidentWrong.length / confidentAttempts.length) * 100) / 100
      : 0;
  }

  return NextResponse.json({
    error_repetition_rate: errorRepetitionRate,
    contrast_success_rate: contrastSuccessRate,
    time_compression: timeCompression,
    overconfidence_rate: overconfidenceRate,
    total_attempts: attempts.length,
    total_sessions: sessionIds.length,
    total_contrast_questions: contrastAttempts.length,
  });
}
