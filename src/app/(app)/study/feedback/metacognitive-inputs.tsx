'use client';

import { useState } from 'react';

const SELF_LABEL_OPTIONS = [
  { id: 'didnt_know', label: "Didn't know" },
  { id: 'misread_question', label: 'Misread' },
  { id: 'between_two', label: 'Between two' },
  { id: 'rushed', label: 'Rushed' },
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

  return (
    <div className="fixed bottom-0 inset-x-0 z-20 border-t border-zinc-800 bg-black/95 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {/* Wrong answer: single row of 4 compact buttons */}
        {!isCorrect && (
          <div className="mb-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              What happened?
            </p>
            <div className="flex gap-1.5">
              {SELF_LABEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelfLabel(opt.id)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    selfLabel === opt.id
                      ? 'border-[var(--color-accent-base)] bg-[var(--color-accent-base)]/10 text-white'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!isCorrect && selfLabel === null}
          className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next Question
        </button>
      </div>
    </div>
  );
}
