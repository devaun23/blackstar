import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const responseSchema = z.object({
  item_draft_id: z.string().uuid(),
  selected_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  time_spent_seconds: z.number().int().positive().nullable().optional(),
});

/**
 * POST /api/responses
 * Records a student's answer. Computes is_correct by checking against
 * the item_draft's correct_answer. Updates item_performance.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof responseSchema>;
  try {
    body = responseSchema.parse(await request.json());
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues : 'Invalid request body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Fetch the correct answer
  const { data: draft, error: draftError } = await supabase
    .from('item_draft')
    .select('correct_answer')
    .eq('id', body.item_draft_id)
    .eq('status', 'published')
    .single();

  if (draftError || !draft) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const isCorrect = body.selected_answer === draft.correct_answer;

  // Insert response
  const { data: response, error: insertError } = await supabase
    .from('user_responses')
    .insert({
      user_id: user.id,
      item_draft_id: body.item_draft_id,
      selected_answer: body.selected_answer,
      is_correct: isCorrect,
      time_spent_seconds: body.time_spent_seconds ?? null,
    })
    .select('id, is_correct')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: response.id,
    is_correct: isCorrect,
    correct_answer: draft.correct_answer,
  });
}
