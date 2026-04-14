import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession, getActiveSession } from '@/lib/session';

const createSessionSchema = z.object({
  user_id: z.string().uuid(),
  mode: z.enum(['retention', 'training', 'assessment']),
  target_count: z.number().int().positive().optional(),
  target_dimension_type: z.enum([
    'topic', 'transfer_rule', 'confusion_set',
    'cognitive_error', 'action_class', 'hinge_clue_type',
  ]).optional(),
  target_dimension_id: z.string().optional(),
  time_limit_seconds: z.number().int().positive().optional(),
});

/**
 * POST /api/session — Create a new learning session
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { user_id, mode, target_count, target_dimension_type, target_dimension_id, time_limit_seconds } = parsed.data;

  const session = await createSession(user_id, mode, {
    targetCount: target_count,
    targetDimensionType: target_dimension_type,
    targetDimensionId: target_dimension_id,
    timeLimitSeconds: time_limit_seconds,
  });

  return NextResponse.json(session);
}

/**
 * GET /api/session?userId=X — Get the user's active session
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const session = await getActiveSession(userId);
  if (!session) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({ session });
}
