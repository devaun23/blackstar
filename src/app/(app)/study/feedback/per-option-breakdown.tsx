'use client';

import Collapsible from '@/components/ui/old-collapsible';
import type { PerOptionExplanation } from '@/lib/types/explanation';

interface PerOptionBreakdownProps {
  options: PerOptionExplanation[];
  correctAnswer: string;
  selectedAnswer: string;
  defaultOpen?: boolean;
  /** Which options to show: 'all' | 'selected' (only the wrong one picked) | 'none' */
  scope: 'all' | 'selected' | 'none';
}

export default function PerOptionBreakdown({
  options,
  correctAnswer,
  selectedAnswer,
  defaultOpen = false,
  scope,
}: PerOptionBreakdownProps) {
  if (scope === 'none') return null;

  const filteredOptions = scope === 'selected'
    ? options.filter((o) => o.letter === selectedAnswer || o.letter === correctAnswer)
    : options;

  const hasContent = filteredOptions.some((o) => o.whyWrong || o.whyCorrect);
  if (!hasContent) return null;

  return (
    <Collapsible title="Option-by-Option Breakdown" defaultOpen={defaultOpen}>
      <div className="space-y-3">
        {filteredOptions.map((opt) => {
          const isCorrectOpt = opt.letter === correctAnswer;
          const isSelectedWrong = opt.letter === selectedAnswer && !isCorrectOpt;
          const explanation = isCorrectOpt ? opt.whyCorrect : opt.whyWrong;

          if (!explanation) return null;

          let borderClass = 'border-zinc-800';
          let bgClass = '';
          if (isCorrectOpt) {
            borderClass = 'border-[var(--color-correct-border)]';
            bgClass = 'bg-[var(--color-correct-bg)]';
          } else if (isSelectedWrong) {
            borderClass = 'border-[var(--color-incorrect-border)]';
            bgClass = 'bg-[var(--color-incorrect-bg)]';
          }

          return (
            <div key={opt.letter} className={`rounded-lg border ${borderClass} ${bgClass} p-3`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  isCorrectOpt
                    ? 'bg-[var(--color-correct-base)] text-black'
                    : isSelectedWrong
                    ? 'bg-[var(--color-incorrect-base)] text-black'
                    : 'bg-zinc-700 text-zinc-300'
                }`}>
                  {opt.letter}
                </span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {opt.optionText}
                </span>
                {opt.cognitiveError && !isCorrectOpt && (
                  <span className="ml-auto rounded-full bg-[var(--color-incorrect-base)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-incorrect-base)]">
                    {opt.cognitiveError.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {explanation}
              </p>
            </div>
          );
        })}
      </div>
    </Collapsible>
  );
}
