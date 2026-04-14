'use client';

import { useState, useEffect } from 'react';
import type { SessionMode, DimensionType } from '@/lib/types/database';

interface WeaknessItem {
  dimensionType: DimensionType;
  dimensionId: string;
  dimensionLabel: string;
  masteryLevel: number;
  totalAttempts: number;
}

interface SessionPickerProps {
  userId: string;
  onSessionCreated: (session: {
    id: string;
    mode: SessionMode;
    targetCount: number;
    targetDimensionType?: DimensionType;
    targetDimensionId?: string;
    timeLimitSeconds?: number;
  }) => void;
}

export default function SessionPicker({ userId, onSessionCreated }: SessionPickerProps) {
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/learner/weaknesses?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWeaknesses(data.weakest ?? []);
        setDueCount(data.dueReviewCount ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const startSession = async (
    mode: SessionMode,
    opts?: {
      targetCount?: number;
      timeLimitSeconds?: number;
    }
  ) => {
    setCreating(true);
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        mode,
        target_count: opts?.targetCount ?? 999, // open-ended for training
        time_limit_seconds: opts?.timeLimitSeconds,
      }),
    });

    if (res.ok) {
      const session = await res.json();
      onSessionCreated({
        id: session.id,
        mode: session.mode,
        targetCount: session.target_count,
        timeLimitSeconds: session.time_limit_seconds ?? undefined,
      });
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  // Build context line
  const contextParts: string[] = [];
  if (dueCount > 0) contextParts.push(`${dueCount} due for review`);
  if (weaknesses.length > 0) {
    const w = weaknesses[0];
    contextParts.push(`weakest: ${w.dimensionLabel.replace(/_/g, ' ')} (${Math.round(w.masteryLevel * 100)}%)`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white">Ready to study?</h1>
        <p className="mt-3 text-sm text-zinc-400">
          {contextParts.length > 0
            ? contextParts.join(' · ')
            : 'The system adapts to your weaknesses as you go.'}
        </p>

        <button
          onClick={() => startSession('training')}
          disabled={creating}
          className="mt-8 w-full rounded-xl bg-[var(--color-accent-base)] py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {creating ? 'Starting...' : 'Start Studying'}
        </button>

        <p className="mt-3 text-xs text-zinc-600">
          Mixes review + new material automatically. End anytime.
        </p>

        <div className="mt-10 border-t border-zinc-800 pt-6">
          <button
            onClick={() => startSession('assessment', { targetCount: 20, timeLimitSeconds: 90 * 20 })}
            disabled={creating}
            className="text-sm text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-zinc-300"
          >
            Take a practice exam (20 questions, timed)
          </button>
        </div>
      </div>
    </div>
  );
}
