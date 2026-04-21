import { NextResponse } from 'next/server';
import { verifyAdminKey } from '@/lib/supabase/admin';
import { regenerateExplanationOnly } from '@/lib/factory/variant-generator';

/**
 * POST /api/admin/regen-explanation
 * Body: { item_draft_id: string }
 * v22 — regenerates the explanation fields on an existing published item_draft
 * against the new explanation_writer v5 contract (medicine_deep_dive + comparison_table
 * + pharmacology_notes + image_pointer). Preserves vignette/options/correct_answer.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (!verifyAdminKey(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await request.json()) as { item_draft_id?: string };
  if (!body.item_draft_id) {
    return NextResponse.json({ error: 'item_draft_id required' }, { status: 400 });
  }
  const result = await regenerateExplanationOnly(body.item_draft_id);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
