import { NextRequest, NextResponse } from 'next/server';
import { getWeakestDimensions } from '@/lib/learner/model';
import { getDueReviewCount } from '@/lib/learner/selector';

/**
 * GET /api/learner/weaknesses?userId=X
 * Returns the user's weakest dimensions + due review count for the session picker.
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const [weakest, dueCount] = await Promise.all([
    getWeakestDimensions(userId, 5),
    getDueReviewCount(userId),
  ]);

  return NextResponse.json({
    weakest: weakest.map(d => ({
      dimensionType: d.dimensionType,
      dimensionId: d.dimensionId,
      dimensionLabel: d.dimensionLabel,
      masteryLevel: d.masteryLevel,
      totalAttempts: d.totalAttempts,
    })),
    dueReviewCount: dueCount,
  });
}
