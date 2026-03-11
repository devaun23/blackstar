'use client';

import type { Question } from './practice-session';

interface ExplanationPanelProps {
  question: Question;
  selectedAnswer: string;
  onNext: () => void;
  isLast: boolean;
}

const WHY_WRONG_MAP: Record<string, keyof Question> = {
  A: 'why_wrong_a',
  B: 'why_wrong_b',
  C: 'why_wrong_c',
  D: 'why_wrong_d',
  E: 'why_wrong_e',
};

export default function ExplanationPanel({ question, selectedAnswer, onNext, isLast }: ExplanationPanelProps) {
  const isCorrect = selectedAnswer === question.correct_answer;
  const whyWrongKey = WHY_WRONG_MAP[selectedAnswer];
  const whyWrongSelected = !isCorrect ? (question[whyWrongKey] as string | null) : null;

  return (
    <div className="mt-6 space-y-4">
      {/* Correct/Incorrect Banner */}
      <div
        className={`rounded-lg border p-4 ${
          isCorrect
            ? 'border-emerald-500/20 bg-emerald-500/10'
            : 'border-red-500/20 bg-red-500/10'
        }`}
      >
        <p className={`text-sm font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
          {isCorrect ? 'Correct!' : `Incorrect — the answer is ${question.correct_answer}`}
        </p>
      </div>

      {/* Why Correct */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Why Correct</h4>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{question.why_correct}</p>
      </div>

      {/* Why Wrong (for selected answer) */}
      {whyWrongSelected && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Why {selectedAnswer} Is Wrong
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{whyWrongSelected}</p>
        </div>
      )}

      {/* High-Yield Pearl */}
      {question.high_yield_pearl && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">High-Yield Pearl</h4>
          <p className="mt-2 text-sm leading-relaxed text-amber-200">{question.high_yield_pearl}</p>
        </div>
      )}

      {/* Reasoning Pathway */}
      {question.reasoning_pathway && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Reasoning Pathway</h4>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-zinc-300">
            {question.reasoning_pathway.split(/\n|;\s*/).filter(Boolean).map((step, i) => (
              <li key={i}>{step.replace(/^\d+\.\s*/, '')}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {isLast ? 'Finish Session' : 'Next Question'}
      </button>
    </div>
  );
}
