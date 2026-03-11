'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import QuestionCard from './question-card';
import ExplanationPanel from './explanation-panel';

export interface Question {
  id: string;
  vignette: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string;
  correct_answer: string;
  why_correct: string;
  why_wrong_a: string | null;
  why_wrong_b: string | null;
  why_wrong_c: string | null;
  why_wrong_d: string | null;
  why_wrong_e: string | null;
  high_yield_pearl: string | null;
  reasoning_pathway: string | null;
  decision_hinge: string | null;
  competing_differential: string | null;
  visual_specs: unknown[] | null;
  blueprint_node: { shelf: string; topic: string } | null;
}

type Phase = 'answering' | 'reviewing' | 'complete';

interface AnswerRecord {
  questionId: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function PracticeSession({ questions }: { questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const startTime = useRef(Date.now());

  const current = questions[index];

  const handleSubmit = async () => {
    if (!selected) return;
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    const isCorrect = selected === current.correct_answer;

    const record: AnswerRecord = {
      questionId: current.id,
      selected,
      correct: current.correct_answer,
      isCorrect,
      timeSpent,
    };
    setAnswers(prev => [...prev, record]);
    setPhase('reviewing');

    // Post response to API (fire and forget)
    fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_draft_id: current.id,
        selected_answer: selected,
        time_spent_seconds: timeSpent,
      }),
    });
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setPhase('complete');
      return;
    }
    setIndex(prev => prev + 1);
    setSelected(null);
    setPhase('answering');
    startTime.current = Date.now();
  };

  if (phase === 'complete') {
    const totalCorrect = answers.filter(a => a.isCorrect).length;
    const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);
    const avgTime = answers.length > 0 ? Math.round(totalTime / answers.length) : 0;

    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Session Complete</h2>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-bold text-indigo-400">{totalCorrect}/{answers.length}</p>
              <p className="text-xs text-zinc-500">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {answers.length > 0 ? Math.round((totalCorrect / answers.length) * 100) : 0}%
              </p>
              <p className="text-xs text-zinc-500">Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{avgTime}s</p>
              <p className="text-xs text-zinc-500">Avg Time</p>
            </div>
          </div>

          {/* Missed topics */}
          {answers.some(a => !a.isCorrect) && (
            <div className="mt-6 text-left">
              <p className="text-sm font-medium text-zinc-400">Missed Questions:</p>
              <ul className="mt-2 space-y-1">
                {answers.filter(a => !a.isCorrect).map((a, i) => {
                  const q = questions.find(q => q.id === a.questionId);
                  return (
                    <li key={i} className="text-sm text-red-400">
                      Q{questions.indexOf(q!) + 1}: {q?.blueprint_node?.topic ?? 'Unknown topic'} — answered {a.selected}, correct {a.correct}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Progress bar */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-zinc-400">
            Question {index + 1} of {questions.length}
          </span>
          <span className="text-sm text-zinc-500">
            {current.blueprint_node?.shelf?.replace(/_/g, ' ')} — {current.blueprint_node?.topic}
          </span>
        </div>
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>

        <QuestionCard
          question={current}
          selected={selected}
          onSelect={phase === 'answering' ? setSelected : undefined}
          showAnswer={phase === 'reviewing'}
        />

        {phase === 'answering' && (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit Answer
          </button>
        )}

        {phase === 'reviewing' && (
          <ExplanationPanel
            question={current}
            selectedAnswer={selected!}
            onNext={handleNext}
            isLast={index + 1 >= questions.length}
          />
        )}
      </div>
    </div>
  );
}
