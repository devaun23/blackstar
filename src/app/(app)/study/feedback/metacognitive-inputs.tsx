'use client';

import { useState } from 'react';

const SELF_LABEL_OPTIONS = [
  { id: 'didnt_know', label: "Didn't know the content" },
  { id: 'misread_question', label: 'Knew it but misread the question' },
  { id: 'between_two', label: 'Was between two and picked wrong' },
  { id: 'rushed', label: 'Rushed / careless' },
] as const;

interface MetacognitiveInputsProps {
  isCorrect: boolean;
  onReady: (data: { selfLabeledError?: string }) => void;
}

export default function MetacognitiveInputs({ isCorrect, onReady }: MetacognitiveInputsProps) {
  const [selfLabel, setSelfLabel] = useState<string | null>(null);

  const handleNext = () => {
    onReady({
      selfLabeledError: selfLabel ?? undefined,
    });
    setSelfLabel(null);
  };

  // Correct answer: just show Next button, no friction
  if (isCorrect) {
    return (
      <button
        onClick={handleNext}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        Next Question
      </button>
    );
  }

  // Wrong answer: forced error classification then Next
  return (
    <>
      <div className="rounded-[var(--radius-card)] border border-zinc-700 bg-zinc-900/50 p-[var(--space-card-padding)]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          What happened?
        </h4>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SELF_LABEL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelfLabel(opt.id)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
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

      <button
        onClick={handleNext}
        disabled={selfLabel === null}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next Question
      </button>
    </>
  );
}
