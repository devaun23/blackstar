'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ChoiceBadge from '@/components/ui/choice-badge';
import { Skeleton } from '@/components/ui/skeleton';
import StudyFeedback from './study-feedback';
import AssessmentReview from './assessment-review';
import type { SessionMode, DimensionType } from '@/lib/types/database';
import type { RichExplanation } from '@/lib/types/explanation';

export interface StudyQuestion {
  id: string;
  vignette: string;
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: string;
  error_map: Record<string, string>;
  transfer_rule_text: string;
  explanation_decision: string;
  explanation_options: string;
  explanation_summary: string;
  system_topic: string;
  error_bucket: string;
  difficulty: string;
  richExplanation?: RichExplanation | null;
}

type Phase = 'loading' | 'answering' | 'reviewing' | 'complete' | 'assessment-review';

export interface AttemptRecord {
  questionId: string;
  question?: StudyQuestion;
  selected: string;
  correct: string;
  isCorrect: boolean;
  errorType: string | null;
  errorRepeatCount: number;
  timeMs: number;
  repairAction: string | null;
  repairReason: string | null;
  transferRuleText: string;
}

interface RepairInfo {
  action: string;
  reason: string;
  targetDimensionType: string | null;
  targetDimensionId: string | null;
}

interface SelectionStrategy {
  dimensionType: string;
  dimensionId: string;
  reason: string;
}

interface StudySessionProps {
  userId: string;
  sessionId: string;
  sessionMode: SessionMode;
  targetCount: number;
  targetDimensionType?: DimensionType;
  targetDimensionId?: string;
  timeLimitSeconds?: number;
  onSessionEnd: () => void;
}

const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

const MODE_LABELS: Record<SessionMode, string> = {
  retention: 'Retention Review',
  training: 'Focused Training',
  assessment: 'Assessment Block',
};

export default function StudySession({
  userId,
  sessionId,
  sessionMode,
  targetCount,
  targetDimensionType,
  targetDimensionId,
  timeLimitSeconds,
  onSessionEnd,
}: StudySessionProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [current, setCurrent] = useState<StudyQuestion | null>(null);
  const [questionType, setQuestionType] = useState<'question' | 'item_draft'>('question');
  const [strategy, setStrategy] = useState<SelectionStrategy | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [lastRepair, setLastRepair] = useState<RepairInfo | null>(null);
  const [empty, setEmpty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const startTime = useRef(Date.now());
  const handleSubmitRef = useRef<() => void>(() => {});

  // Assessment timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (sessionMode !== 'assessment') return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionMode]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (phase === 'answering') {
        // 1-5 for answer selection (A-E)
        const answerMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
        if (answerMap[e.key]) {
          e.preventDefault();
          setSelected(answerMap[e.key]);
        }
        // Enter to submit
        if (e.key === 'Enter' && selected) {
          e.preventDefault();
          handleSubmitRef.current();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selected]);

  const fetchNext = useCallback(async () => {
    setPhase('loading');
    setSelected(null);

    const params = new URLSearchParams({ userId, sessionMode, sessionId });

    // In training/retention, pass repair info for adaptive chaining
    if (sessionMode !== 'assessment' && lastRepair) {
      params.set('lastRepairAction', lastRepair.action);
      if (lastRepair.targetDimensionType) params.set('lastDimensionType', lastRepair.targetDimensionType);
      if (lastRepair.targetDimensionId) params.set('lastDimensionId', lastRepair.targetDimensionId);
    }

    // Training mode: force dimension
    if (sessionMode === 'training' && targetDimensionType && targetDimensionId) {
      params.set('forceDimensionType', targetDimensionType);
      params.set('forceDimensionId', targetDimensionId);
    }

    const res = await fetch(`/api/study/next?${params}`);
    if (!res.ok) {
      setEmpty(true);
      setPhase('complete');
      return;
    }

    const data = await res.json();
    setCurrent(data.question);
    setQuestionType(data.questionType ?? 'question');
    setStrategy(data.strategy ?? null);
    startTime.current = Date.now();
    setPhase('answering');
  }, [userId, sessionMode, sessionId, lastRepair, targetDimensionType, targetDimensionId]);

  // Fetch first question on mount
  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!selected || !current) return;
    setSubmitting(true);

    const timeMs = Date.now() - startTime.current;
    const isCorrect = selected === current.correct_answer;
    const errorType = isCorrect
      ? null
      : current.error_map[selected] ?? null;

    const res = await fetch('/api/study/attempt-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        question_type: questionType,
        question_id: current.id,
        selected_answer: selected,
        time_spent_ms: timeMs,
        session_id: sessionId,
        session_mode: sessionMode,
      }),
    });

    const result = await res.json();

    const repair: RepairInfo | null = result.repairAction
      ? {
          action: result.repairAction,
          reason: result.repairReason,
          targetDimensionType: result.repairTargetDimensionType,
          targetDimensionId: result.repairTargetDimensionId,
        }
      : null;

    setLastRepair(repair);

    const record: AttemptRecord = {
      questionId: current.id,
      question: current,
      selected,
      correct: current.correct_answer,
      isCorrect,
      errorType,
      errorRepeatCount: result.errorRepeatCount ?? 0,
      timeMs,
      repairAction: repair?.action ?? null,
      repairReason: repair?.reason ?? null,
      transferRuleText: current.transfer_rule_text,
    };
    setAttempts(prev => [...prev, record]);
    setCompletedCount(c => c + 1);
    setSubmitting(false);

    // Assessment mode: skip feedback, auto-advance or complete
    if (sessionMode === 'assessment') {
      if (result.sessionComplete || completedCount + 1 >= targetCount) {
        setPhase('assessment-review');
      } else {
        fetchNext();
      }
      return;
    }

    // Training/retention: show feedback
    if (result.sessionComplete || completedCount + 1 >= targetCount) {
      setPhase('complete');
    } else {
      setPhase('reviewing');
    }
  };

  handleSubmitRef.current = handleSubmit;

  const handleNext = async (metacognitive?: { selfLabeledError?: string }) => {
    // Send self-labeled error for wrong answers
    if (metacognitive?.selfLabeledError && attempts.length > 0) {
      const lastAttempt = attempts[attempts.length - 1];
      await fetch('/api/study/attempt-v2/metacognitive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: lastAttempt.questionId,
          self_labeled_error: metacognitive.selfLabeledError,
        }),
      }).catch(() => {}); // non-blocking
    }
    fetchNext();
  };

  const handleEndSession = async () => {
    await fetch(`/api/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
    if (sessionMode === 'assessment' && attempts.length > 0) {
      setPhase('assessment-review');
    } else {
      setPhase('complete');
    }
  };

  // ── Assessment review screen ──
  if (phase === 'assessment-review') {
    return (
      <AssessmentReview
        attempts={attempts}
        totalTime={elapsedSeconds}
        onStudyAgain={onSessionEnd}
      />
    );
  }

  // ── Complete screen (training/retention) ──
  if (phase === 'complete') {
    const correct = attempts.filter(a => a.isCorrect).length;
    const total = attempts.length;
    const avgTime = total > 0 ? Math.round(attempts.reduce((s, a) => s + a.timeMs, 0) / total / 1000) : 0;

    const errorCounts = new Map<string, number>();
    for (const a of attempts.filter(a => !a.isCorrect)) {
      if (a.errorType) {
        errorCounts.set(a.errorType, (errorCounts.get(a.errorType) ?? 0) + 1);
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-8">
          <h2 className="text-center text-2xl font-bold text-white">
            {MODE_LABELS[sessionMode]} Complete
          </h2>

          {empty && total === 0 && (
            <p className="mt-4 text-center text-zinc-400">No questions available. Run the batch generator first.</p>
          )}

          {total > 0 && (
            <>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-[var(--color-correct-base)]">{correct}/{total}</p>
                  <p className="text-xs text-zinc-500">Correct</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">
                    {Math.round((correct / total) * 100)}%
                  </p>
                  <p className="text-xs text-zinc-500">Accuracy</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{avgTime}s</p>
                  <p className="text-xs text-zinc-500">Avg Time</p>
                </div>
              </div>

              {errorCounts.size > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-zinc-400">Your Error Patterns</p>
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

              {attempts.some(a => !a.isCorrect) && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-zinc-400">Rules to Review</p>
                  <div className="mt-2 space-y-2">
                    {attempts
                      .filter(a => !a.isCorrect)
                      .map((a, i) => (
                        <p key={i} className="rounded-lg border border-[var(--color-pearl-border)] bg-[var(--color-pearl-bg)] px-3 py-2 text-sm text-[var(--color-pearl-text)]">
                          {a.transferRuleText}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={onSessionEnd}
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
    );
  }

  // ── Loading skeleton ──
  if (phase === 'loading' || !current) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="rounded-[var(--radius-card)] border border-zinc-800 bg-[var(--color-surface-base)] p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="mt-6 h-5 w-3/4" />
            </div>
            <div className="mt-6 space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Question + Feedback screen ──
  const choices: Record<string, string> = {
    A: current.option_a,
    B: current.option_b,
    C: current.option_c,
    D: current.option_d,
    E: current.option_e,
  };

  const progress = targetCount > 0 ? (completedCount / targetCount) * 100 : 0;

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header with mode + progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--color-accent-base)]/20 px-3 py-1 text-xs font-semibold text-[var(--color-accent-base)]">
                {MODE_LABELS[sessionMode]}
              </span>
              <span className="text-sm text-zinc-400">
                {completedCount + 1} of {targetCount}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {sessionMode === 'assessment' && timeLimitSeconds && (
                <span className={`font-mono text-sm ${elapsedSeconds > timeLimitSeconds ? 'text-[var(--color-incorrect-base)]' : 'text-zinc-400'}`}>
                  {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                  {current.system_topic}
                </span>
              </div>
              <button
                onClick={handleEndSession}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
              >
                End
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-[var(--color-accent-base)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          key={current.id}
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 rounded-[var(--radius-card)] border border-zinc-800 bg-[var(--color-surface-base)] p-6"
        >
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {current.vignette}
          </p>
          <p className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
            {current.stem}
          </p>

          <div className="mt-5 space-y-2">
            {CHOICE_KEYS.map(key => {
              const isSelected = selected === key;
              const isCorrectChoice = key === current.correct_answer;
              const showAnswer = phase === 'reviewing';

              let borderClass = 'border-zinc-800';
              let bgClass = 'bg-[var(--color-surface-base)]';
              let badgeVariant: 'default' | 'correct' | 'incorrect' | 'accent' = 'default';

              if (showAnswer) {
                if (isCorrectChoice) {
                  borderClass = 'border-[var(--color-correct-border)]';
                  bgClass = 'bg-[var(--color-correct-bg)]';
                  badgeVariant = 'correct';
                } else if (isSelected && !isCorrectChoice) {
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
                  onClick={() => phase === 'answering' ? setSelected(key) : undefined}
                  disabled={phase !== 'answering'}
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${borderClass} ${bgClass} ${phase === 'answering' ? 'hover:border-zinc-600 cursor-pointer' : 'cursor-default'}`}
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

        {/* Submit button */}
        {phase === 'answering' && (
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        )}

        {/* Feedback panel (hidden in assessment mode) */}
        {phase === 'reviewing' && current && (
          <StudyFeedback
            question={current}
            selectedAnswer={selected!}
            onNext={handleNext}
            repairInfo={lastRepair}
            errorRepeatCount={attempts[attempts.length - 1]?.errorRepeatCount ?? 0}
          />
        )}
      </div>
    </div>
  );
}
