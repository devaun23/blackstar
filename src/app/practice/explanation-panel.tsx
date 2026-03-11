'use client';

import type { Question } from './practice-session';
import SectionCard from '@/app/components/ui/section-card';
import StepIndicator from '@/app/components/ui/step-indicator';
import Collapsible from '@/app/components/ui/collapsible';
import Badge from '@/app/components/ui/badge';
import VisualRenderer from '@/app/components/visuals/visual-renderer';
import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

interface ExplanationPanelProps {
  question: Question;
  selectedAnswer: string;
  onNext: () => void;
  isLast: boolean;
}

const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

const WHY_WRONG_MAP: Record<string, keyof Question> = {
  A: 'why_wrong_a',
  B: 'why_wrong_b',
  C: 'why_wrong_c',
  D: 'why_wrong_d',
  E: 'why_wrong_e',
};

export default function ExplanationPanel({ question, selectedAnswer, onNext, isLast }: ExplanationPanelProps) {
  const isCorrect = selectedAnswer === question.correct_answer;

  // Parse reasoning pathway into steps
  const reasoningSteps = question.reasoning_pathway
    ? question.reasoning_pathway
        .split(/\n|;\s*/)
        .filter(Boolean)
        .map(s => s.replace(/^\d+\.\s*/, ''))
    : [];

  return (
    <div className="mt-6 space-y-[var(--space-section-gap)]">
      {/* 1. Correct/Incorrect Banner */}
      <SectionCard label="" variant={isCorrect ? 'correct' : 'incorrect'}>
        <p className={`text-sm font-semibold ${isCorrect ? 'text-[var(--color-correct-base)]' : 'text-[var(--color-incorrect-base)]'}`}>
          {isCorrect ? 'Correct!' : `Incorrect — the answer is ${question.correct_answer}`}
        </p>
      </SectionCard>

      {/* 2. Why Correct */}
      <SectionCard label="Why Correct" variant="default">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {question.why_correct}
        </p>
      </SectionCard>

      {/* 3. Reasoning Pathway */}
      {reasoningSteps.length > 0 && (
        <SectionCard label="Reasoning Pathway" variant="default">
          <StepIndicator steps={reasoningSteps} maxVisible={8} />
        </SectionCard>
      )}

      {/* 4. Visual Explanations */}
      {question.visual_specs && question.visual_specs.length > 0 && (
        <SectionCard label="Visual Explanation" variant="default">
          <div className="space-y-4">
            {(question.visual_specs as VisualSpec[]).map((spec, i) => (
              <VisualRenderer key={i} spec={spec} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 5. All Distractors */}
      <div className="space-y-[var(--space-inner-gap)]">
        {CHOICE_KEYS.filter(key => key !== question.correct_answer).map(key => {
          const whyWrong = question[WHY_WRONG_MAP[key]] as string | null;
          if (!whyWrong) return null;

          const isSelectedWrong = !isCorrect && selectedAnswer === key;

          return (
            <Collapsible
              key={key}
              title={`Why ${key} is wrong`}
              defaultOpen={isSelectedWrong}
              variant={isSelectedWrong ? 'incorrect' : 'default'}
            >
              <div className="flex items-start gap-2">
                <Badge label={key} variant={isSelectedWrong ? 'incorrect' : 'default'} size="sm" />
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {whyWrong}
                </p>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* 6. Decision Hinge */}
      {question.decision_hinge && (
        <SectionCard label="Decision Hinge" variant="accent">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {question.decision_hinge}
          </p>
        </SectionCard>
      )}

      {/* 7. High-Yield Pearl */}
      {question.high_yield_pearl && (
        <SectionCard label="High-Yield Pearl" variant="pearl">
          <p className="text-sm leading-relaxed text-[var(--color-pearl-text)]">
            {question.high_yield_pearl}
          </p>
        </SectionCard>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        {isLast ? 'Finish Session' : 'Next Question'}
      </button>
    </div>
  );
}
