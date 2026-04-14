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
  const [showWeaknessPicker, setShowWeaknessPicker] = useState(false);

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
      targetDimensionType?: DimensionType;
      targetDimensionId?: string;
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
        target_count: opts?.targetCount,
        target_dimension_type: opts?.targetDimensionType,
        target_dimension_id: opts?.targetDimensionId,
        time_limit_seconds: opts?.timeLimitSeconds,
      }),
    });

    if (res.ok) {
      const session = await res.json();
      onSessionCreated({
        id: session.id,
        mode: session.mode,
        targetCount: session.target_count,
        targetDimensionType: session.target_dimension_type ?? undefined,
        targetDimensionId: session.target_dimension_id ?? undefined,
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

  // Weakness picker sub-view
  if (showWeaknessPicker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-lg">
          <button
            onClick={() => setShowWeaknessPicker(false)}
            className="mb-4 text-sm text-zinc-500 hover:text-zinc-300"
          >
            &larr; Back
          </button>
          <h2 className="text-xl font-bold text-white">Pick a Weakness to Train</h2>
          <p className="mt-1 text-sm text-zinc-400">
            The system will focus all questions on this dimension.
          </p>
          <div className="mt-6 space-y-3">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No weakness data yet. Complete some questions first.
              </p>
            ) : (
              weaknesses.map(w => (
                <button
                  key={`${w.dimensionType}:${w.dimensionId}`}
                  onClick={() =>
                    startSession('training', {
                      targetCount: 15,
                      targetDimensionType: w.dimensionType,
                      targetDimensionId: w.dimensionId,
                    })
                  }
                  disabled={creating}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-left transition-colors hover:border-zinc-600 disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {w.dimensionLabel.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {w.dimensionType.replace(/_/g, ' ')} &middot; {w.totalAttempts} attempts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${w.masteryLevel < 0.5 ? 'text-[var(--color-incorrect-base)]' : w.masteryLevel < 0.7 ? 'text-amber-400' : 'text-[var(--color-correct-base)]'}`}>
                      {Math.round(w.masteryLevel * 100)}%
                    </p>
                    <p className="text-xs text-zinc-500">mastery</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main mode picker
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-2xl font-bold text-white">Study Session</h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Choose your mode. The system adapts to your weaknesses.
        </p>

        <div className="mt-8 space-y-4">
          {/* Retention */}
          <button
            onClick={() => startSession('retention', { targetCount: Math.min(dueCount, 15) || 10 })}
            disabled={creating || dueCount === 0}
            className="group w-full rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left transition-colors hover:border-[var(--color-accent-base)] disabled:opacity-40 disabled:hover:border-zinc-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Retention Review</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Spaced retrieval of concepts due for review
                </p>
              </div>
              {dueCount > 0 ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-base)] text-sm font-bold text-white">
                  {dueCount}
                </span>
              ) : (
                <span className="text-xs text-zinc-600">None due</span>
              )}
            </div>
          </button>

          {/* Training */}
          <button
            onClick={() => {
              if (weaknesses.length > 0) {
                setShowWeaknessPicker(true);
              } else {
                startSession('training', { targetCount: 15 });
              }
            }}
            disabled={creating}
            className="group w-full rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left transition-colors hover:border-[var(--color-accent-base)] disabled:opacity-40"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Focused Training</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {weaknesses.length > 0
                    ? `Target your weakest area: ${weaknesses[0].dimensionLabel.replace(/_/g, ' ')}`
                    : 'Adaptive practice on your weakest dimensions'}
                </p>
              </div>
              {weaknesses.length > 0 && (
                <span className={`text-lg font-bold ${weaknesses[0].masteryLevel < 0.5 ? 'text-[var(--color-incorrect-base)]' : 'text-amber-400'}`}>
                  {Math.round(weaknesses[0].masteryLevel * 100)}%
                </span>
              )}
            </div>
          </button>

          {/* Assessment */}
          <button
            onClick={() => startSession('assessment', { targetCount: 20, timeLimitSeconds: 90 * 20 })}
            disabled={creating}
            className="group w-full rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left transition-colors hover:border-[var(--color-accent-base)] disabled:opacity-40"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Assessment Block</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  20 questions, timed, no feedback until the end
                </p>
              </div>
              <span className="text-xs text-zinc-500">~30 min</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
