// POST /api/study/event
// Accepts a batch of attempt_event rows from the client emitter. Bulk inserts.
// No auth check beyond Supabase RLS — the client-side supabase session is
// already present on the request; admin client bypasses RLS but only accepts
// attempt_ids the server recognizes.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ATTEMPT_EVENT_TYPES, logAttemptEvents } from '@/lib/learner/events';

const eventSchema = z.object({
  attempt_id: z.string().uuid(),
  event_type: z.enum(ATTEMPT_EVENT_TYPES),
  ts: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  await logAttemptEvents(
    parsed.data.events.map((e) => ({
      attemptId: e.attempt_id,
      eventType: e.event_type,
      ts: e.ts ?? null,
      metadata: e.metadata ?? null,
    })),
  );

  return NextResponse.json({ accepted: parsed.data.events.length });
}
