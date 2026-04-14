'use client';

import { useState } from 'react';

const SELF_LABEL_OPTIONS = [
  { id: 'didnt_know', label: "I didn't know the content" },
  { id: 'wrong_action', label: 'I knew the diagnosis but chose the wrong action' },
  { id: 'wrong_timing', label: 'I knew the action but got the timing/priority wrong' },
  { id: 'narrowed_early', label: 'I narrowed too early and missed an alternative' },
  { id: 'changed_answer', label: "I changed my answer and shouldn't have" },
  { id: 'missed_clue', label: "I didn't notice a critical clue" },
] as const;

const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

interface MetacognitiveInputsProps {
  isCorrect: boolean;
  onReady: (data: { confidencePost: number; selfLabeledError?: string }) => void;
}

export default function MetacognitiveInputs({ isCorrect, onReady }: MetacognitiveInputsProps) {
  const [confidencePost, setConfidencePost] = useState<number | null>(null);
  const [selfLabel, setSelfLabel] = useState<string | null>(null);

  const canProceed = isCorrect
    ? confidencePost !== null
    : confidencePost !== null && selfLabel !== null;

  const handleNext = () => {
    if (!canProceed || confidencePost === null) return;
    onReady({
      confidencePost,
      selfLabeledError: selfLabel ?? undefined,
    });
    setConfidencePost(null);
    setSelfLabel(null);
  };

  return (
    <>
      {/* Self-labeled error (wrong answers only) */}
      {!isCorrect && (
        <div className="rounded-[var(--radius-card)] border border-zinc-700 bg-zinc-900/50 p-[var(--space-card-padding)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Why did you miss it?
          </h4>
          <div className="mt-3 space-y-2">
            {SELF_LABEL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelfLabel(opt.id)}
                className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                  selfLabel === opt.id
                    ? 'border-[var(--color-accent-base)] bg-[var(--color-accent-base)]/10 text-white'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Post-explanation confidence */}
      <div className="rounded-[var(--radius-card)] border border-zinc-700 bg-zinc-900/50 p-[var(--space-card-padding)]">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Could you get a similar question right?
          </h4>
          <div className="flex gap-2">
            {CONFIDENCE_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setConfidencePost(level)}
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  confidencePost === level
                    ? 'border-[var(--color-accent-base)] bg-[var(--color-accent-base)] text-white'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={!canProceed}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next Question
      </button>
    </>
  );
}
