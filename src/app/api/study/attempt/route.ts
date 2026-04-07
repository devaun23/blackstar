import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const attemptSchema = z.object({
  question_id: z.string().uuid(),
  selected_option: z.enum(['A', 'B', 'C', 'D', 'E']),
  time_spent_ms: z.number().int().positive().optional(),
  session_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = attemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { question_id, selected_option, time_spent_ms, session_id } = parsed.data;
  const supabase = createAdminClient();

  // Fetch the question to determine correctness and error type
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('correct_answer, error_map, error_bucket, transfer_rule_text, times_served, times_correct')
    .eq('id', question_id)
    .single();

  if (qErr || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const is_correct = selected_option === question.correct_answer;
  const error_type = is_correct
    ? null
    : (question.error_map as Record<string, string>)[selected_option] ?? null;

  const { data: attempt, error: insertErr } = await supabase
    .from('attempts')
    .insert({
      question_id,
      selected_option,
      is_correct,
      error_type,
      time_spent_ms: time_spent_ms ?? null,
      session_id: session_id ?? null,
      session_type: 'training',
    })
    .select('id')
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Update question stats (fire-and-forget)
  supabase
    .from('questions')
    .update({
      times_served: question.times_served + 1,
      ...(is_correct ? { times_correct: question.times_correct + 1 } : {}),
    })
    .eq('id', question_id)
    .then(() => {});

  return NextResponse.json({
    id: attempt.id,
    is_correct,
    correct_answer: question.correct_answer,
    error_type,
    transfer_rule_text: question.transfer_rule_text,
  });
}
