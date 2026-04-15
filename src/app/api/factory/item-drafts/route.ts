import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminKey } from '@/lib/supabase/admin';

/**
 * GET /api/factory/item-drafts
 * Lists item drafts filtered by status. Admin-protected.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (!verifyAdminKey(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from('item_draft')
    .select('*, blueprint_node(*), item_plan(*)')
    .order('created_at', { ascending: false });

  const status = searchParams.get('status');
  if (status) query = query.eq('status', status);

  const limit = searchParams.get('limit');
  if (limit) query = query.limit(parseInt(limit, 10));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
