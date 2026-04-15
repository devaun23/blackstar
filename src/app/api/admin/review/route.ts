import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminKey } from '@/lib/supabase/admin';
import type { ReviewStatus } from '@/lib/types/database';

/**
 * POST /api/admin/review
 *
 * Submit a review decision for an item draft.
 * Sets review_status, reviewed_by, reviewed_at, and optional notes.
 *
 * When approved, the item becomes available to students.
 * When rejected or needs_revision, it stays out of the question bank.
 *
 * Body: {
 *   itemDraftId: string,
 *   decision: 'approved' | 'rejected' | 'needs_revision',
 *   notes?: string,
 *   reviewerId?: string  // user ID (optional for admin key auth)
 * }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (!verifyAdminKey(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { itemDraftId, decision, notes, reviewerId } = body as {
    itemDraftId: string;
    decision: ReviewStatus;
    notes?: string;
    reviewerId?: string;
  };

  if (!itemDraftId || !decision) {
    return NextResponse.json(
      { error: 'Missing required fields: itemDraftId, decision' },
      { status: 400 }
    );
  }

  const validDecisions: ReviewStatus[] = ['approved', 'rejected', 'needs_revision'];
  if (!validDecisions.includes(decision)) {
    return NextResponse.json(
      { error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Verify the item exists and is in pending_review state
  const { data: existing, error: fetchError } = await supabase
    .from('item_draft')
    .select('id, review_status, status')
    .eq('id', itemDraftId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Item draft not found' }, { status: 404 });
  }

  if (existing.review_status !== 'pending_review') {
    return NextResponse.json(
      { error: `Item is not pending review (current: ${existing.review_status})` },
      { status: 409 }
    );
  }

  // Update review status
  const { error: updateError } = await supabase
    .from('item_draft')
    .update({
      review_status: decision,
      reviewed_by: reviewerId ?? null,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq('id', itemDraftId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    itemDraftId,
    decision,
    reviewed_at: new Date().toISOString(),
  });
}
