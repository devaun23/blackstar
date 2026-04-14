import { createAdminClient } from '@/lib/supabase/admin';
import type {
  SessionMode,
  SessionStatus,
  DimensionType,
  LearningSessionRow,
} from '@/lib/types/database';

export interface CreateSessionOpts {
  targetCount?: number;
  targetDimensionType?: DimensionType;
  targetDimensionId?: string;
  timeLimitSeconds?: number;
}

export interface SessionSummary {
  session: LearningSessionRow;
  accuracy: number;
  errorBreakdown: Record<string, number>;
  dimensionBreakdown: { type: string; id: string; correct: number; total: number }[];
}

/**
 * Creates a new learning session. Abandons any active session first.
 */
export async function createSession(
  userId: string,
  mode: SessionMode,
  opts: CreateSessionOpts = {}
): Promise<LearningSessionRow> {
  const supabase = createAdminClient();

  // Abandon any currently active session
  await supabase
    .from('learning_session')
    .update({ status: 'abandoned' as SessionStatus, completed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  const { data, error } = await supabase
    .from('learning_session')
    .insert({
      user_id: userId,
      mode,
      status: 'active' as SessionStatus,
      target_count: opts.targetCount ?? (mode === 'assessment' ? 20 : mode === 'retention' ? 10 : 15),
      target_dimension_type: opts.targetDimensionType ?? null,
      target_dimension_id: opts.targetDimensionId ?? null,
      time_limit_seconds: opts.timeLimitSeconds ?? (mode === 'assessment' ? 90 * 20 : null),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message}`);
  }

  return data as LearningSessionRow;
}

/**
 * Returns the user's active session, or null.
 */
export async function getActiveSession(
  userId: string
): Promise<LearningSessionRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('learning_session')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (data as LearningSessionRow) ?? null;
}

/**
 * Completes a session.
 */
export async function completeSession(
  sessionId: string
): Promise<LearningSessionRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('learning_session')
    .update({
      status: 'completed' as SessionStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to complete session: ${error?.message}`);
  }

  return data as LearningSessionRow;
}

/**
 * Abandons a session (e.g., user navigated away).
 */
export async function abandonSession(
  sessionId: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('learning_session')
    .update({
      status: 'abandoned' as SessionStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

/**
 * Increments the session counters after an attempt.
 * Auto-completes if target_count is reached.
 * Returns the updated session and whether it just completed.
 */
export async function incrementSession(
  sessionId: string,
  isCorrect: boolean
): Promise<{ session: LearningSessionRow; justCompleted: boolean }> {
  const supabase = createAdminClient();

  // Fetch current state
  const { data: current } = await supabase
    .from('learning_session')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!current) {
    throw new Error('Session not found');
  }

  const session = current as LearningSessionRow;
  const newCompleted = session.completed_count + 1;
  const newCorrect = session.correct_count + (isCorrect ? 1 : 0);
  const reachedTarget = newCompleted >= session.target_count;

  const update: Record<string, unknown> = {
    completed_count: newCompleted,
    correct_count: newCorrect,
  };

  if (reachedTarget) {
    update.status = 'completed';
    update.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('learning_session')
    .update(update)
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to increment session: ${error?.message}`);
  }

  return {
    session: data as LearningSessionRow,
    justCompleted: reachedTarget,
  };
}

/**
 * Gets a session summary with attempt-level analytics.
 */
export async function getSessionSummary(
  sessionId: string
): Promise<SessionSummary> {
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from('learning_session')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Session not found');

  const { data: attempts } = await supabase
    .from('attempt_v2')
    .select('is_correct, diagnosed_cognitive_error_id, time_spent_ms')
    .eq('session_id', sessionId);

  const rows = attempts ?? [];
  const total = rows.length;
  const correct = rows.filter((a: { is_correct: boolean }) => a.is_correct).length;

  // Error breakdown
  const errorBreakdown: Record<string, number> = {};
  for (const a of rows) {
    const row = a as { is_correct: boolean; diagnosed_cognitive_error_id: string | null };
    if (!row.is_correct && row.diagnosed_cognitive_error_id) {
      errorBreakdown[row.diagnosed_cognitive_error_id] =
        (errorBreakdown[row.diagnosed_cognitive_error_id] ?? 0) + 1;
    }
  }

  return {
    session: session as LearningSessionRow,
    accuracy: total > 0 ? correct / total : 0,
    errorBreakdown,
    dimensionBreakdown: [], // TODO: expand with per-dimension stats
  };
}
