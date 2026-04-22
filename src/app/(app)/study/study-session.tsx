'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ChoiceBadge from '@/components/ui/choice-badge';
import { Skeleton } from '@/components/ui/skeleton';
import AssessmentReview from './assessment-review';
import type { SessionMode, DimensionType } from '@/lib/types/database';
import type { RichExplanation } from '@/lib/types/explanation';
import { getComponentVisibility, type SelfLabel } from './feedback/section-order';
import AnchorRule from './feedback/anchor-rule';
import IllnessScript from './feedback/illness-script';
import ConceptCard from './feedback/concept-card';
import ManagementProtocol from './feedback/management-protocol';
import TrapsSection from './feedback/traps-section';
import PharmacologySection from './feedback/pharmacology-section';
import ContrastTable from './feedback/contrast-table';

const EXPLANATION_V7_ENABLED = process.env.NEXT_PUBLIC_EXPLANATION_V7 === 'true';

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
  error_map: Record<string, string | { error_id: string; error_name: string; meaning: string }>;
  transfer_rule_text: string;
  explanation_decision: string;
  explanation_options: string;
  explanation_summary: string;
  system_topic: string;
  error_bucket: string;
  difficulty: string;
  richExplanation?: RichExplanation | null;
}

/** Safely extract error name from error_map entry (handles both string and object shapes). */
function resolveErrorName(
  entry: string | { error_name: string } | null | undefined,
): string | null {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  return entry.error_name ?? null;
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

interface StudySessionProps {
  userId: string;
  sessionId: string;
  sessionMode: SessionMode;
  targetCount: number;
  targetDimensionType?: DimensionType;
  targetDimensionId?: string;
  timeLimitSeconds?: number;
  // v23 Rule 8 — optional per-question timer in practice mode.
  // Assessment mode always enforces the countdown regardless of this flag.
  perQuestionTimer?: boolean;
  // Per-question countdown target for assessment mode (default 90s — elite tutor rule).
  perQuestionSeconds?: number;
  onSessionEnd: () => void;
}

const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

const ERROR_LABELS: Record<string, string> = {
  severity_miss: 'Severity Miss',
  next_step_error: 'Next Step Error',
  premature_closure: 'Premature Closure',
  confusion_set_miss: 'Confusion Set Miss',
  test_interpretation_miss: 'Test Interpretation Miss',
  anchoring: 'Anchoring',
  anchoring_bias: 'Anchoring',
  wrong_algorithm_branch: 'Wrong Branch',
  over_testing: 'Over-Testing',
  under_triage: 'Under-Triage',
  treating_labs_instead_of_patient: 'Treating Labs',
  reflex_response_to_finding: 'Reflex Response',
  misreading_hemodynamic_status: 'Hemodynamic Misread',
  skipping_required_diagnostic_step: 'Skipped Step',
  premature_escalation: 'Premature Escalation',
  wrong_priority_sequence: 'Wrong Priority',
  misreading_severity: 'Misreading Severity',
  sequencing_error: 'Sequencing Error',
  contraindication_miss: 'Contraindication Miss',
  knowledge_gap: 'Knowledge Gap',
  misdiagnosis: 'Misdiagnosis',
};

const SELF_LABEL_OPTIONS = [
  { id: 'didnt_know', label: "Didn't know" },
  { id: 'misread_question', label: 'Misread' },
  { id: 'between_two', label: 'Between two' },
  { id: 'rushed', label: 'Rushed' },
] as const;

const REPAIR_HINTS: Record<string, string> = {
  contrast: 'Next: a contrasting case.',
  remediate: 'Next: targeted practice.',
  transfer_test: 'Next: same rule, new setting.',
  reinforce: 'Next: reinforcing this.',
  advance: '',
};

export default function StudySession({
  userId,
  sessionId,
  sessionMode,
  targetCount,
  targetDimensionType,
  targetDimensionId,
  timeLimitSeconds,
  perQuestionTimer = false,
  perQuestionSeconds = 90,
  onSessionEnd,
}: StudySessionProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [current, setCurrent] = useState<StudyQuestion | null>(null);
  const [questionType, setQuestionType] = useState<'question' | 'item_draft'>('question');
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [lastRepair, setLastRepair] = useState<RepairInfo | null>(null);
  const [empty, setEmpty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [selfLabel, setSelfLabel] = useState<string | null>(null);
  // v23 Rule 6 — free-text "what were you thinking" capture on wrong answers
  const [whatWereYouThinking, setWhatWereYouThinking] = useState('');
  const [lastErrorRepeatCount, setLastErrorRepeatCount] = useState(0);
  // v23 Rule 2 — easy_recognition miss flag from the attempt API; copy-variant on feedback
  const [lastEasyMiss, setLastEasyMiss] = useState(false);
  // v24 — mastery returned from attempt-v2 drives adaptive explanation depth
  const [lastDimensionMastery, setLastDimensionMastery] = useState<number | null>(null);
  const startTime = useRef(Date.now());
  const handleSubmitRef = useRef<() => void>(() => {});

  // Assessment session-wide timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (sessionMode !== 'assessment') return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionMode]);

  // v23 Rule 8 — per-question timer.
  // Practice: count-up from 0, no auto-submit. Assessment: countdown from perQuestionSeconds
  // with amber warning at 30s and force-submit at 0s.
  const [perQuestionElapsed, setPerQuestionElapsed] = useState(0);
  const showPerQuestionTimer = sessionMode === 'assessment' || perQuestionTimer;
  useEffect(() => {
    if (!showPerQuestionTimer || phase !== 'answering') return;
    setPerQuestionElapsed(0);
    const interval = setInterval(() => setPerQuestionElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [showPerQuestionTimer, phase, current?.id]);

  // Assessment-mode force-submit at 0s
  useEffect(() => {
    if (sessionMode !== 'assessment' || phase !== 'answering') return;
    const remaining = perQuestionSeconds - perQuestionElapsed;
    if (remaining <= 0) {
      // Auto-score: treat missing selection as incorrect by picking the letter
      // that isn't the correct answer. This preserves session integrity.
      if (!selected && current) {
        const wrongLetters = (['A', 'B', 'C', 'D', 'E'] as const).filter(l => l !== current.correct_answer);
        setSelected(wrongLetters[0] ?? 'A');
        setTimeout(() => handleSubmitRef.current(), 50);
      } else if (selected) {
        handleSubmitRef.current();
      }
    }
  }, [perQuestionElapsed, sessionMode, phase, selected, current, perQuestionSeconds]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (phase === 'answering') {
        const answerMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
        if (answerMap[e.key]) {
          e.preventDefault();
          setSelected(answerMap[e.key]);
        }
        if (e.key === 'Enter' && selected) {
          e.preventDefault();
          handleSubmitRef.current();
        }
      }

      if (phase === 'reviewing' && e.key === 'Enter') {
        e.preventDefault();
        // Only allow if correct or self-label selected
        const lastAttempt = attempts[attempts.length - 1];
        if (lastAttempt?.isCorrect || selfLabel) {
          handleNext();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selected, selfLabel, attempts]);

  const fetchNext = useCallback(async () => {
    setPhase('loading');
    setSelected(null);
    setSelfLabel(null);
    setWhatWereYouThinking('');

    const params = new URLSearchParams({ userId, sessionMode, sessionId });

    if (sessionMode !== 'assessment' && lastRepair) {
      params.set('lastRepairAction', lastRepair.action);
      if (lastRepair.targetDimensionType) params.set('lastDimensionType', lastRepair.targetDimensionType);
      if (lastRepair.targetDimensionId) params.set('lastDimensionId', lastRepair.targetDimensionId);
    }

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
    startTime.current = Date.now();
    setPhase('answering');
  }, [userId, sessionMode, sessionId, lastRepair, targetDimensionType, targetDimensionId]);

  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!selected || !current) return;
    setSubmitting(true);

    try {
      const timeMs = Date.now() - startTime.current;
      const isCorrect = selected === current.correct_answer;
      const errorType = isCorrect
        ? null
        : resolveErrorName(current.error_map[selected]);

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

      if (!res.ok) {
        console.error('[handleSubmit] API error:', res.status, await res.text().catch(() => ''));
        setSubmitting(false);
        return;
      }

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
      setLastErrorRepeatCount(result.errorRepeatCount ?? 0);
      setLastDimensionMastery(typeof result.dimensionMastery === 'number' ? result.dimensionMastery : null);
      setLastEasyMiss(!!result.easyRecognitionMiss && !isCorrect);

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

      setPhase('reviewing');
    } catch (err) {
      console.error('[handleSubmit] Unexpected error:', err);
      setSubmitting(false);
    }
  };

  handleSubmitRef.current = handleSubmit;

  const handleNext = async () => {
    if ((selfLabel || whatWereYouThinking.trim()) && attempts.length > 0) {
      const lastAttempt = attempts[attempts.length - 1];
      await fetch('/api/study/attempt-v2/metacognitive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: lastAttempt.questionId,
          self_labeled_error: selfLabel ?? undefined,
          // v23 Rule 6 — free-text metacognitive capture
          what_were_you_thinking: whatWereYouThinking.trim() || undefined,
        }),
      }).catch(() => {});
    }
    setSelfLabel(null);
    setWhatWereYouThinking('');
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

  // ── Assessment review ──
  if (phase === 'assessment-review') {
    return (
      <AssessmentReview
        attempts={attempts}
        totalTime={elapsedSeconds}
        onStudyAgain={onSessionEnd}
      />
    );
  }

  // ── Complete screen ──
  if (phase === 'complete') {
    const correct = attempts.filter(a => a.isCorrect).length;
    const total = attempts.length;
    const avgTime = total > 0 ? Math.round(attempts.reduce((s, a) => s + a.timeMs, 0) / total / 1000) : 0;

    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-8">
          <h2 className="text-center text-2xl font-bold text-white">Session Complete</h2>

          {empty && total === 0 && (
            <p className="mt-4 text-center text-zinc-400">No questions available.</p>
          )}

          {total > 0 && (
            <>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-[var(--color-correct-base)]">{correct}/{total}</p>
                  <p className="text-xs text-zinc-500">Correct</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{Math.round((correct / total) * 100)}%</p>
                  <p className="text-xs text-zinc-500">Accuracy</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{avgTime}s</p>
                  <p className="text-xs text-zinc-500">Avg Time</p>
                </div>
              </div>

              {attempts.some(a => !a.isCorrect) && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-zinc-400">Rules to Review</p>
                  <div className="mt-2 space-y-2">
                    {attempts
                      .filter(a => !a.isCorrect && a.transferRuleText)
                      .map((a, i) => (
                        <p key={i} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
                          {a.transferRuleText}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-8 flex gap-3">
            <button onClick={onSessionEnd} className="flex-1 rounded-lg bg-[var(--color-accent-base)] py-2.5 text-center text-sm font-semibold text-white hover:opacity-90">
              New Session
            </button>
            <Link href="/dashboard" className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-center text-sm font-semibold text-zinc-300 hover:border-zinc-500">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (phase === 'loading' || !current) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="px-4 pt-3 pb-2">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex-1 px-4 pb-24">
          <div className="mx-auto max-w-3xl space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <div className="mt-4 space-y-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main: Question + Answer state ──
  const choices: Record<string, string> = {
    A: current.option_a,
    B: current.option_b,
    C: current.option_c,
    D: current.option_d,
    E: current.option_e,
  };

  const isCorrect = phase === 'reviewing' ? selected === current.correct_answer : false;
  const errorType = phase === 'reviewing' && !isCorrect
    ? current.error_map[selected!] ?? null
    : null;
  const correctCount = attempts.filter(a => a.isCorrect).length;

  // Get explanation content
  const rich = current.richExplanation;
  const transferRule = rich?.layers?.fix?.transferRule ?? rich?.transferRule ?? current.transfer_rule_text ?? null;
  const whyCorrect = rich?.layers?.breakdown?.whyCorrect ?? rich?.whyCorrect ?? current.explanation_decision ?? '';
  const whyOthersFail = current.explanation_options ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ═══ BAND 1: Header ═══ */}
      <div className="px-4 pt-3 pb-2">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            {sessionMode === 'assessment' ? (
              <>
                <span className="text-xs font-semibold text-[var(--color-accent-base)]">Exam</span>
                <span className="text-xs text-zinc-500">{completedCount + 1}/{targetCount}</span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-zinc-300">Q{completedCount + 1}</span>
                {completedCount > 0 && (
                  <span className="text-xs text-zinc-500">{correctCount}/{completedCount} correct</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sessionMode === 'assessment' && timeLimitSeconds && (
              <span className={`font-mono text-xs ${elapsedSeconds > timeLimitSeconds ? 'text-[var(--color-incorrect-base)]' : 'text-zinc-500'}`}>
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
            )}
            {/* v23 Rule 8 — per-question timer */}
            {showPerQuestionTimer && phase === 'answering' && (() => {
              if (sessionMode === 'assessment') {
                const remaining = Math.max(0, perQuestionSeconds - perQuestionElapsed);
                const m = Math.floor(remaining / 60);
                const s = (remaining % 60).toString().padStart(2, '0');
                const color =
                  remaining <= 10 ? 'text-[var(--color-incorrect-base)] animate-pulse font-semibold'
                  : remaining <= 30 ? 'text-amber-400'
                  : 'text-zinc-400';
                return <span className={`font-mono text-xs ${color}`}>{m}:{s}</span>;
              }
              // Practice count-up
              const m = Math.floor(perQuestionElapsed / 60);
              const s = (perQuestionElapsed % 60).toString().padStart(2, '0');
              return <span className="font-mono text-xs text-zinc-500">{m}:{s}</span>;
            })()}
            {current.system_topic && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                {current.system_topic}
              </span>
            )}
            <button onClick={handleEndSession} className="text-xs text-zinc-600 hover:text-zinc-400">
              End
            </button>
          </div>
        </div>
        {sessionMode === 'assessment' && (
          <div className="mx-auto mt-1.5 max-w-3xl">
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-[var(--color-accent-base)] transition-all duration-300" style={{ width: `${(completedCount / targetCount) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ═══ BAND 2: Canvas ═══ */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="mx-auto max-w-3xl">
          {/* Vignette + stem */}
          <p className="text-sm leading-snug text-[var(--color-text-secondary)]">
            {current.vignette}
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
            {current.stem}
          </p>

          {/* Options — two-state rendering */}
          <div className="mt-3 space-y-1">
            {CHOICE_KEYS.map(key => {
              const text = choices[key];
              const isSelected = selected === key;
              const isCorrectChoice = key === current.correct_answer;
              const showAnswer = phase === 'reviewing';
              const isWrongSelected = showAnswer && isSelected && !isCorrectChoice;

              // ── POST-ANSWER: Correct answer row — expanded with inline explanation ──
              if (showAnswer && isCorrectChoice) {
                return (
                  <div key={key} className="rounded-lg border border-[var(--color-correct-border)] bg-[var(--color-correct-bg)] px-3 py-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5"><ChoiceBadge label={key} variant="correct" /></span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{text}</span>
                    </div>
                    {/* Inline explanation */}
                    <div className="mt-2 border-t border-[var(--color-correct-border)]/30 pt-2 space-y-1.5">
                      {!isSelected && (
                        <p className="text-xs font-medium text-[var(--color-incorrect-base)]">
                          You chose {selected}. Correct answer: {key}.
                        </p>
                      )}
                      {transferRule && (
                        <p className="text-sm font-medium leading-snug text-[var(--color-text-primary)]">
                          {transferRule}
                        </p>
                      )}
                      <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                        {whyCorrect}
                      </p>
                    </div>
                  </div>
                );
              }

              // ── POST-ANSWER: Wrong selected row — marked but compact ──
              if (isWrongSelected) {
                return (
                  <div key={key} className="flex items-start gap-2 rounded-lg border border-[var(--color-incorrect-border)] bg-[var(--color-incorrect-bg)] px-3 py-1.5">
                    <span className="mt-0.5"><ChoiceBadge label={key} variant="incorrect" /></span>
                    <span className="text-sm text-zinc-400">{text}</span>
                  </div>
                );
              }

              // ── POST-ANSWER: Collapsed unselected ──
              if (showAnswer) {
                return (
                  <div key={key} className="flex items-start gap-2 rounded-lg border border-zinc-800/40 px-3 py-1.5 opacity-40">
                    <span className="mt-0.5"><ChoiceBadge label={key} variant="default" /></span>
                    <span className="text-xs text-zinc-500">{text}</span>
                  </div>
                );
              }

              // ── PRE-ANSWER: Selectable option ──
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'border-[var(--color-accent-base)] bg-[var(--color-accent-bg)]'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className="mt-0.5"><ChoiceBadge label={key} variant={isSelected ? 'accent' : 'default'} /></span>
                  <span className="text-sm text-[var(--color-text-secondary)]">{text}</span>
                </button>
              );
            })}
          </div>

          {/* v23 Rule 4 — Down-to-two discrimination card on wrong answers when data is present */}
          {phase === 'reviewing' && !isCorrect && rich?.downToTwo && (
            <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Down to two — {rich.downToTwo.competitorOption} vs {current.correct_answer}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-primary)]">
                {rich.downToTwo.tippingDetail}
              </p>
              <p className="mt-1 text-[11px] italic leading-snug text-zinc-400">
                {rich.downToTwo.counterfactual}
              </p>
            </div>
          )}

          {/* v23 Rule 2 — Easy-miss content-gap signal: distinct messaging, NOT a softened correction */}
          {phase === 'reviewing' && lastEasyMiss && (
            <div className="mt-2 rounded-md border border-amber-700/50 bg-amber-950/30 px-3 py-2">
              <p className="text-xs font-semibold text-amber-300">
                Pattern-recognition check — content gap flagged in {current.system_topic.replace(/_/g, ' ')}
              </p>
              {rich?.easyRecognitionCheck && (
                <p className="mt-1 text-[11px] leading-snug text-amber-200/80">
                  {rich.easyRecognitionCheck}
                </p>
              )}
            </div>
          )}

          {/* Error badge — compact, below options */}
          {phase === 'reviewing' && errorType && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="rounded-full bg-[var(--color-incorrect-base)] px-2 py-0.5 text-[10px] font-semibold text-black">
                {ERROR_LABELS[errorType] ?? errorType.replace(/_/g, ' ')}
              </span>
              {lastErrorRepeatCount >= 2 && (
                <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                  {lastErrorRepeatCount}x
                </span>
              )}
              {lastRepair && REPAIR_HINTS[lastRepair.action] && (
                <span className="text-[10px] text-zinc-500">{REPAIR_HINTS[lastRepair.action]}</span>
              )}
            </div>
          )}

          {/* v23 Rule 10 — Question-writer intent, one-line footer below error badge */}
          {phase === 'reviewing' && rich?.questionWriterIntent && (
            <p className="mt-2 text-[11px] leading-snug text-zinc-500 border-l border-zinc-700 pl-2 italic">
              {rich.questionWriterIntent}
            </p>
          )}

          {/* v7 — 7-component adaptive explanation stack. Behind flag; reactive to selfLabel. */}
          {EXPLANATION_V7_ENABLED && phase === 'reviewing' && rich?.components && (() => {
            const c = rich.components;
            const vis = getComponentVisibility({
              masteryLevel: lastDimensionMastery,
              selfLabel: selfLabel as SelfLabel,
              isCorrect,
              hasConfusionSet: c.contrast !== null,
              hasDrugs: c.pharmacology !== null && c.pharmacology.length > 0,
              errorName: errorType,
            });
            return (
              <div className="mt-4 space-y-3">
                <AnchorRule anchor={c.anchor} />

                {/* Reasoning: compressed (expert) or full (novice/targeted) */}
                {vis.reasoning.state !== 'hidden' && (
                  <div className="rounded-[var(--radius-card)] border border-zinc-800 bg-[var(--color-surface-base)] p-[var(--space-card-padding)]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {vis.reasoning.mode === 'compressed' ? 'Hinge' : 'Reasoning'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-primary)]">
                      {vis.reasoning.mode === 'compressed' && c.reasoningCompressed
                        ? c.reasoningCompressed
                        : c.reasoningFull}
                    </p>
                    {c.decisionHinge && vis.reasoning.mode === 'full' && (
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400 border-l-2 border-zinc-700 pl-2">
                        <span className="text-[var(--color-text-muted)]">Decision hinge: </span>
                        {c.decisionHinge}
                      </p>
                    )}
                  </div>
                )}

                {c.pattern && (
                  <IllnessScript script={c.pattern} state={vis.pattern} />
                )}
                {c.concept && (
                  <ConceptCard concept={c.concept} state={vis.concept} />
                )}
                {c.contrast && (
                  <ContrastTable contrast={c.contrast} state={vis.contrast} />
                )}
                {c.algorithm && c.algorithm.length > 0 && (
                  <ManagementProtocol steps={c.algorithm} state={vis.algorithm} />
                )}
                {c.traps && c.traps.length > 0 && (
                  <TrapsSection traps={c.traps} state={vis.traps} />
                )}
                {c.pharmacology && c.pharmacology.length > 0 && (
                  <PharmacologySection entries={c.pharmacology} state={vis.pharmacology} />
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ═══ BAND 3: Fixed Footer ═══ */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-zinc-800 bg-black/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {phase === 'answering' ? (
            <button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : phase === 'reviewing' ? (
            <>
              {!isCorrect && (
                <div className="mb-2">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">What happened?</p>
                  <div className="flex gap-1.5">
                    {SELF_LABEL_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSelfLabel(opt.id)}
                        className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                          selfLabel === opt.id
                            ? 'border-[var(--color-accent-base)] bg-[var(--color-accent-base)]/10 text-white'
                            : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* v23 Rule 6 — free-text reasoning capture, optional, does not gate advance */}
              {!isCorrect && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={whatWereYouThinking}
                    onChange={(e) => setWhatWereYouThinking(e.target.value)}
                    placeholder="What were you thinking? (optional)"
                    maxLength={1000}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
              )}
              <button
                onClick={handleNext}
                disabled={!isCorrect && selfLabel === null}
                className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next Question
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
