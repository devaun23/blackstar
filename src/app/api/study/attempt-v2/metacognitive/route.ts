import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const metacognitiveSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  confidence_post: z.number().int().min(1).max(5).optional(),
  self_labeled_error: z.string().optional(),
});

/**
 * PATCH /api/study/attempt-v2/metacognitive
 * Updates an existing attempt with post-explanation confidence and self-labeled error.
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = metacognitiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { session_id, question_id, confidence_post, self_labeled_error } = parsed.data;

  const supabase = createAdminClient();

  const update: Record<string, unknown> = {};
  if (confidence_post !== undefined) update.confidence_post = confidence_post;
  if (self_labeled_error !== undefined) update.self_labeled_error = self_labeled_error;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Find the most recent attempt for this question in this session
  const { data: attempt } = await supabase
    .from('attempt_v2')
    .select('id')
    .eq('session_id', session_id)
    .or(`question_id.eq.${question_id},item_draft_id.eq.${question_id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  await supabase
    .from('attempt_v2')
    .update(update)
    .eq('id', attempt.id);

  return NextResponse.json({ ok: true });
}
