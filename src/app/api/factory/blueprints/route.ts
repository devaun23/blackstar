import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/factory/blueprints
 * Lists blueprint nodes, optionally filtered by shelf and yield_tier.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from('blueprint_node')
    .select('*')
    .order('published_count', { ascending: true });

  const shelf = searchParams.get('shelf');
  if (shelf) query = query.eq('shelf', shelf);

  const tier = searchParams.get('yield_tier');
  if (tier) query = query.eq('yield_tier', tier);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
