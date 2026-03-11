'use client';

import type { Question } from './practice-session';

const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

interface QuestionCardProps {
  question: Question;
  selected: string | null;
  onSelect?: (choice: string) => void;
  showAnswer: boolean;
}

export default function QuestionCard({ question, selected, onSelect, showAnswer }: QuestionCardProps) {
  const choices: Record<string, string> = {
    A: question.choice_a,
    B: question.choice_b,
    C: question.choice_c,
    D: question.choice_d,
    E: question.choice_e,
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      {/* Vignette */}
      <p className="text-sm leading-relaxed text-zinc-300">{question.vignette}</p>

      {/* Stem */}
      <p className="mt-4 text-base font-semibold text-white">{question.stem}</p>

      {/* Choices */}
      <div className="mt-5 space-y-2">
        {CHOICE_KEYS.map(key => {
          const isSelected = selected === key;
          const isCorrect = key === question.correct_answer;

          let borderClass = 'border-zinc-800';
          let bgClass = 'bg-zinc-950';

          if (showAnswer) {
            if (isCorrect) {
              borderClass = 'border-emerald-500/40';
              bgClass = 'bg-emerald-500/10';
            } else if (isSelected && !isCorrect) {
              borderClass = 'border-red-500/40';
              bgClass = 'bg-red-500/10';
            }
          } else if (isSelected) {
            borderClass = 'border-indigo-500';
            bgClass = 'bg-indigo-500/10';
          }

          return (
            <button
              key={key}
              onClick={() => onSelect?.(key)}
              disabled={!onSelect}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${borderClass} ${bgClass} ${onSelect ? 'hover:border-zinc-600 cursor-pointer' : 'cursor-default'}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-xs font-medium text-zinc-400">
                {key}
              </span>
              <span className="text-sm text-zinc-200">{choices[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
