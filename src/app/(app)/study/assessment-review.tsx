'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AttemptRecord } from './study-session';
import StudyFeedback from './study-feedback';

interface AssessmentReviewProps {
  attempts: AttemptRecord[];
  totalTime: number;
  onStudyAgain: () => void;
}

export default function AssessmentReview({ attempts, totalTime, onStudyAgain }: AssessmentReviewProps) {
  const [reviewingIndex, setReviewingIndex] = useState<number | null>(null);

  const correct = attempts.filter(a => a.isCorrect).length;
  const total = attempts.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const avgTimeS = total > 0 ? Math.round(attempts.reduce((s, a) => s + a.timeMs, 0) / total / 1000) : 0;
  const totalMinutes = Math.floor(totalTime / 60);
  const totalSeconds = totalTime % 60;

  // Error breakdown
  const errorCounts = new Map<string, number>();
  for (const a of attempts.filter(a => !a.isCorrect)) {
    if (a.errorType) {
      errorCounts.set(a.errorType, (errorCounts.get(a.errorType) ?? 0) + 1);
    }
  }

  const missed = attempts.filter(a => !a.isCorrect);

  // If reviewing a specific question
  if (reviewingIndex !== null) {
    const attempt = missed[reviewingIndex];
    if (attempt?.question) {
      return (
        <div className="min-h-screen bg-black px-4 py-8">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => setReviewingIndex(null)}
              className="mb-4 text-sm text-zinc-500 hover:text-zinc-300"
            >
              &larr; Back to Results
            </button>
            <div className="mb-4 rounded-[var(--radius-card)] border border-zinc-800 bg-[var(--color-surface-base)] p-6">
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {attempt.question.vignette}
              </p>
              <p className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
                {attempt.question.stem}
              </p>
            </div>
            <StudyFeedback
              question={attempt.question}
              selectedAnswer={attempt.selected}
              onNext={() => {
                if (reviewingIndex < missed.length - 1) {
                  setReviewingIndex(reviewingIndex + 1);
                } else {
                  setReviewingIndex(null);
                }
              }}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
          <h2 className="text-center text-2xl font-bold text-white">Assessment Complete</h2>

          {/* Score */}
          <div className="mt-6 grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-3xl font-bold text-[var(--color-correct-base)]">{correct}/{total}</p>
              <p className="text-xs text-zinc-500">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{accuracy}%</p>
              <p className="text-xs text-zinc-500">Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{avgTimeS}s</p>
              <p className="text-xs text-zinc-500">Avg Time</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {totalMinutes}:{totalSeconds.toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-zinc-500">Total Time</p>
            </div>
          </div>

          {/* Error breakdown */}
          {errorCounts.size > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-zinc-400">Error Patterns</p>
              <div className="mt-2 space-y-2">
                {[...errorCounts.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                      <span className="text-sm text-[var(--color-incorrect-base)]">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-mono text-zinc-400">{count}x</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Question-by-question summary */}
          <div className="mt-6">
            <p className="text-sm font-medium text-zinc-400">Question Review</p>
            <div className="mt-2 space-y-1">
              {attempts.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      a.isCorrect
                        ? 'bg-[var(--color-correct-base)]/20 text-[var(--color-correct-base)]'
                        : 'bg-[var(--color-incorrect-base)]/20 text-[var(--color-incorrect-base)]'
                    }`}>
                      {a.isCorrect ? '\u2713' : '\u2717'}
                    </span>
                    <span className="text-xs text-zinc-400">Q{i + 1}</span>
                    {!a.isCorrect && a.errorType && (
                      <span className="text-xs text-zinc-500">{a.errorType.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    {Math.round(a.timeMs / 1000)}s
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review missed questions */}
          {missed.length > 0 && (
            <button
              onClick={() => setReviewingIndex(0)}
              className="mt-6 w-full rounded-lg border border-[var(--color-pearl-border)] bg-[var(--color-pearl-bg)] py-2.5 text-sm font-semibold text-[var(--color-pearl-text)] hover:opacity-90"
            >
              Review {missed.length} Missed Question{missed.length > 1 ? 's' : ''}
            </button>
          )}

          {/* Transfer rules */}
          {missed.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-400">Rules to Review</p>
              <div className="mt-2 space-y-2">
                {missed.map((a, i) => (
                  <p key={i} className="rounded-lg border border-[var(--color-pearl-border)] bg-[var(--color-pearl-bg)] px-3 py-2 text-sm text-[var(--color-pearl-text)]">
                    {a.transferRuleText}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={onStudyAgain}
              className="flex-1 rounded-lg bg-[var(--color-accent-base)] py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
            >
              New Session
            </button>
            <Link
              href="/dashboard"
              className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-center text-sm font-semibold text-zinc-300 hover:border-zinc-500"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
