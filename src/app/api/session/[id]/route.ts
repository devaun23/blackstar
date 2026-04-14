import { NextRequest, NextResponse } from 'next/server';
import { completeSession, abandonSession, getSessionSummary } from '@/lib/session';

/**
 * GET /api/session/[id] — Get session details with summary
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const summary = await getSessionSummary(id);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
}

/**
 * PATCH /api/session/[id] — Complete or abandon a session
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const action = body.action as string;

  if (action === 'complete') {
    const session = await completeSession(id);
    return NextResponse.json(session);
  }

  if (action === 'abandon') {
    await abandonSession(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action. Use "complete" or "abandon".' }, { status: 400 });
}
