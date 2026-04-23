// Attempt-event log.
//
// Fine-grained client/server events attached to a single attempt. Phase A
// emits only the baseline `attempt_submitted` event on server-side attempt
// insert. Phase B wires the client event emitter to send option_hover,
// option_select, section_expand, hint_request, confidence_post_set, etc.
//
// The event log is intentionally decoupled from attempt_v2 so that adding a
// new event type never requires a schema change. metadata is opaque jsonb.

import { createAdminClient } from '@/lib/supabase/admin';

// Enumerates the full event vocabulary. Adding a new type requires only a
// const addition here — no schema change.
export const ATTEMPT_EVENT_TYPES = [
  // Phase A (server-emitted)
  'attempt_submitted',
  // Phase B (client-emitted, not yet wired)
  'option_hover',
  'option_select',
  'option_deselect',
  'section_expand',
  'section_collapse',
  'hint_request',
  'confidence_post_set',
  'explanation_scroll',
  'revision',
] as const;

export type AttemptEventType = typeof ATTEMPT_EVENT_TYPES[number];

export interface AttemptEventInput {
  attemptId: string;
  eventType: AttemptEventType;
  ts?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAttemptEvent(input: AttemptEventInput): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }
  try {
    const supabase = createAdminClient();
    await supabase.from('attempt_event').insert({
      attempt_id: input.attemptId,
      event_type: input.eventType,
      ts: input.ts ?? new Date().toISOString(),
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error('[events] insert failed', err);
  }
}

export async function logAttemptEvents(inputs: AttemptEventInput[]): Promise<void> {
  if (inputs.length === 0) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }
  try {
    const supabase = createAdminClient();
    await supabase.from('attempt_event').insert(
      inputs.map((i) => ({
        attempt_id: i.attemptId,
        event_type: i.eventType,
        ts: i.ts ?? new Date().toISOString(),
        metadata: i.metadata ?? null,
      })),
    );
  } catch (err) {
    console.error('[events] batch insert failed', err);
  }
}
