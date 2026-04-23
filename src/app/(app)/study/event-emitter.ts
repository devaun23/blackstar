// Client-side attempt-event emitter.
//
// Buffers events in memory and flushes periodically (and on unmount / page
// hide) to /api/study/event. Uses navigator.sendBeacon when available so the
// last flush survives a page transition without blocking navigation.
//
// Phase A: wired but only the baseline attempt_submitted event fires (server-
// side in the attempt-v2 route). Phase B: study-session.tsx and
// feedback/section-order.ts call trackEvent() directly for UI-level events.

'use client';

import type { AttemptEventType } from '@/lib/learner/events';

const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER = 50;
const ENDPOINT = '/api/study/event';

interface BufferedEvent {
  attempt_id: string;
  event_type: AttemptEventType;
  ts: string;
  metadata?: Record<string, unknown> | null;
}

let buffer: BufferedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const events = buffer;
  buffer = [];

  const payload = JSON.stringify({ events });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    const ok = navigator.sendBeacon(ENDPOINT, blob);
    if (ok) return;
  }

  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Drop the batch silently — client telemetry is best-effort.
  }
}

function installUnloadHandler() {
  if (initialized) return;
  initialized = true;
  if (typeof window === 'undefined') return;
  window.addEventListener('pagehide', () => { void flush(); });
  window.addEventListener('beforeunload', () => { void flush(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
}

export function trackEvent(
  attemptId: string,
  eventType: AttemptEventType,
  metadata?: Record<string, unknown> | null,
): void {
  installUnloadHandler();
  buffer.push({
    attempt_id: attemptId,
    event_type: eventType,
    ts: new Date().toISOString(),
    metadata: metadata ?? null,
  });
  if (buffer.length >= MAX_BUFFER) {
    void flush();
    return;
  }
  scheduleFlush();
}

export function flushEvents(): Promise<void> {
  return flush();
}
