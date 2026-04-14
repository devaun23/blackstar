'use client';

import type { Question } from './practice-session';
import ChoiceBadge from '@/components/ui/choice-badge';

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
    <div className="rounded-[var(--radius-card)] border border-zinc-800 bg-[var(--color-surface-base)] p-6">
      {/* Vignette */}
      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{question.vignette}</p>

      {/* Stem */}
      <p className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{question.stem}</p>

      {/* Choices */}
      <div className="mt-5 space-y-2">
        {CHOICE_KEYS.map(key => {
          const isSelected = selected === key;
          const isCorrect = key === question.correct_answer;

          let borderClass = 'border-zinc-800';
          let bgClass = 'bg-[var(--color-surface-base)]';
          let badgeVariant: 'default' | 'correct' | 'incorrect' | 'accent' = 'default';

          if (showAnswer) {
            if (isCorrect) {
              borderClass = 'border-[var(--color-correct-border)]';
              bgClass = 'bg-[var(--color-correct-bg)]';
              badgeVariant = 'correct';
            } else if (isSelected && !isCorrect) {
              borderClass = 'border-[var(--color-incorrect-border)]';
              bgClass = 'bg-[var(--color-incorrect-bg)]';
              badgeVariant = 'incorrect';
            }
          } else if (isSelected) {
            borderClass = 'border-[var(--color-accent-base)]';
            bgClass = 'bg-[var(--color-accent-bg)]';
            badgeVariant = 'accent';
          }

          return (
            <button
              key={key}
              onClick={() => onSelect?.(key)}
              disabled={!onSelect}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${borderClass} ${bgClass} ${onSelect ? 'hover:border-zinc-600 cursor-pointer' : 'cursor-default'}`}
            >
              <span className="mt-0.5">
                <ChoiceBadge label={key} variant={badgeVariant} />
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">{choices[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
