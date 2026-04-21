import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/questions
 * Returns published questions for students. Auth-required (RLS enforced).
 * Optionally filtered by shelf.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from('item_draft')
    .select('id, vignette, stem, choice_a, choice_b, choice_c, choice_d, choice_e, correct_answer, why_correct, why_wrong_a, why_wrong_b, why_wrong_c, why_wrong_d, why_wrong_e, high_yield_pearl, reasoning_pathway, medicine_deep_dive, comparison_table, pharmacology_notes, image_pointer, blueprint_node_id, blueprint_node(shelf, system, topic)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const shelf = searchParams.get('shelf');
  if (shelf) {
    query = query.eq('blueprint_node.shelf', shelf);
  }

  const limit = searchParams.get('limit');
  if (limit) query = query.limit(parseInt(limit, 10));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
