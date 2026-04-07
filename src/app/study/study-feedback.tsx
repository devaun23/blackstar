'use client';

import { useState } from 'react';
import type { StudyQuestion } from './study-session';
import SectionCard from '@/app/components/ui/section-card';
import Collapsible from '@/app/components/ui/collapsible';

interface RepairInfo {
  action: string;
  reason: string;
  targetDimensionType: string | null;
  targetDimensionId: string | null;
}

interface StudyFeedbackProps {
  question: StudyQuestion;
  selectedAnswer: string;
  onNext: (metacognitive?: { confidencePost?: number; selfLabeledError?: string }) => void;
  repairInfo?: RepairInfo | null;
}

const ERROR_LABELS: Record<string, string> = {
  severity_miss: 'Severity Miss',
  next_step_error: 'Next Step Error',
  premature_closure: 'Premature Closure',
  confusion_set_miss: 'Confusion Set Miss',
  test_interpretation_miss: 'Test Interpretation Miss',
};

const ERROR_DESCRIPTIONS: Record<string, string> = {
  severity_miss: 'You missed a sign of hemodynamic instability or urgency that should have changed management priority.',
  next_step_error: 'You identified the diagnosis correctly but chose the wrong management step, timing, or sequence.',
  premature_closure: 'You anchored to the most obvious finding without considering contradicting data that redirects the diagnosis.',
  confusion_set_miss: 'You confused two similar conditions \u2014 the discriminating feature was in the vignette but you missed it.',
  test_interpretation_miss: 'You misinterpreted lab values, imaging findings, or diagnostic data that were key to the decision.',
};

const REPAIR_MESSAGES: Record<string, string> = {
  advance: "Moving on \u2014 you've got this. We'll increase the review interval.",
  reinforce: "Next: we'll reinforce this concept with a similar question.",
  contrast: "Next: a contrasting case to sharpen the distinction.",
  remediate: "Next: targeted practice on this reasoning pattern.",
  transfer_test: "Next: same rule, different clinical setting.",
};

const SELF_LABEL_OPTIONS = [
  { id: 'didnt_know', label: "I didn't know the content" },
  { id: 'wrong_action', label: 'I knew the diagnosis but chose the wrong action' },
  { id: 'wrong_timing', label: 'I knew the action but got the timing/priority wrong' },
  { id: 'narrowed_early', label: 'I narrowed too early and missed an alternative' },
  { id: 'changed_answer', label: "I changed my answer and shouldn't have" },
  { id: 'missed_clue', label: "I didn't notice a critical clue" },
] as const;

const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

export default function StudyFeedback({ question, selectedAnswer, onNext, repairInfo }: StudyFeedbackProps) {
  const isCorrect = selectedAnswer === question.correct_answer;
  const errorType = isCorrect
    ? null
    : question.error_map[selectedAnswer] ?? null;

  const [confidencePost, setConfidencePost] = useState<number | null>(null);
  const [selfLabel, setSelfLabel] = useState<string | null>(null);

  const canProceed = isCorrect
    ? confidencePost !== null
    : confidencePost !== null && selfLabel !== null;

  const handleNext = () => {
    onNext({
      confidencePost: confidencePost ?? undefined,
      selfLabeledError: selfLabel ?? undefined,
    });
    // Reset for next question
    setConfidencePost(null);
    setSelfLabel(null);
  };

  return (
    <div className="mt-6 space-y-[var(--space-section-gap)]">
      {/* 1. Result banner */}
      <SectionCard label="" variant={isCorrect ? 'correct' : 'incorrect'}>
        <p className={`text-sm font-semibold ${isCorrect ? 'text-[var(--color-correct-base)]' : 'text-[var(--color-incorrect-base)]'}`}>
          {isCorrect
            ? 'Correct!'
            : `Incorrect \u2014 the answer is ${question.correct_answer}`}
        </p>
      </SectionCard>

      {/* 2. Error diagnosis (only when wrong) */}
      {!isCorrect && errorType && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-incorrect-border)] bg-[var(--color-incorrect-bg)] p-[var(--space-card-padding)]">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-incorrect-base)] px-2.5 py-0.5 text-xs font-semibold text-black">
              {ERROR_LABELS[errorType] ?? errorType}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {ERROR_DESCRIPTIONS[errorType] ?? 'Review the vignette carefully for the discriminating feature.'}
          </p>
        </div>
      )}

      {/* 3. Transfer Rule */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-pearl-border)] bg-[var(--color-pearl-bg)] p-[var(--space-card-padding)]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pearl-base)]">
          Transfer Rule
        </h4>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-pearl-text)]">
          {question.transfer_rule_text}
        </p>
      </div>

      {/* 4. What's Next — repair action routing */}
      {repairInfo && (
        <div className="rounded-[var(--radius-card)] border border-zinc-700 bg-zinc-900/50 p-[var(--space-card-padding)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            What&apos;s Next
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {REPAIR_MESSAGES[repairInfo.action] ?? repairInfo.reason}
          </p>
        </div>
      )}

      {/* 5. Decision explanation */}
      <SectionCard label="Why This Answer" variant="default">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {question.explanation_decision}
        </p>
      </SectionCard>

      {/* 6. Per-option breakdown (collapsible) */}
      <Collapsible title="Option-by-Option Breakdown" defaultOpen={!isCorrect}>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
          {question.explanation_options}
        </p>
      </Collapsible>

      {/* 7. Summary & pattern recognition */}
      <Collapsible title="Exam Strategy" defaultOpen={false}>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {question.explanation_summary}
        </p>
      </Collapsible>

      {/* 8. Metacognitive: Self-labeled error (wrong answers only) */}
      {!isCorrect && (
        <div className="rounded-[var(--radius-card)] border border-zinc-700 bg-zinc-900/50 p-[var(--space-card-padding)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Why did you miss it?
          </h4>
          <div className="mt-3 space-y-2">
            {SELF_LABEL_OPTIONS.map(opt => (
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

      {/* 9. Metacognitive: Post-explanation confidence */}
      <div className="rounded-[var(--radius-card)] border border-zinc-700 bg-zinc-900/50 p-[var(--space-card-padding)]">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Could you get a similar question right?
          </h4>
          <div className="flex gap-2">
            {CONFIDENCE_LEVELS.map(level => (
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
    </div>
  );
}
