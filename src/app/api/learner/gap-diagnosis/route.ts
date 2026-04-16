import { NextRequest, NextResponse } from 'next/server';
import { diagnoseGapProfile } from '@/lib/learner/gap-diagnosis';

/**
 * GET /api/learner/gap-diagnosis?userId=X
 * Returns the user's Palmerton gap profile (skills/noise/consistency breakdown).
 * Requires at least 10 diagnosed errors to return meaningful data.
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const diagnosis = await diagnoseGapProfile(userId);

  if (!diagnosis) {
    return NextResponse.json({
      status: 'insufficient_data',
      message: 'Need at least 10 diagnosed errors for gap analysis. Keep practicing!',
    });
  }

  return NextResponse.json(diagnosis);
}
