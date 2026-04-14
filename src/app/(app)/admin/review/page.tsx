'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReviewItem {
  id: string;
  stem: string;
  vignette: string;
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
  explanation_decision_logic: string | null;
  explanation_error_diagnosis: Record<string, unknown> | null;
  explanation_transfer_rule: string | null;
  topic: string;
  system: string;
  repair_count: number;
  review_status: string;
  validator_scores: Record<string, { passed: boolean; score: number | null; issues: string[] }>;
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending_review');

  const adminKey = typeof window !== 'undefined'
    ? localStorage.getItem('blackstar_admin_key') ?? ''
    : '';

  const fetchQueue = useCallback(async () => {
    if (!adminKey) {
      setError('Enter admin key in localStorage: blackstar_admin_key');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/review-queue?status=${statusFilter}`, {
        headers: { 'x-admin-key': adminKey },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items);
      setSelectedIdx(0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  async function submitReview(decision: 'approved' | 'rejected' | 'needs_revision') {
    const item = items[selectedIdx];
    if (!item) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          itemDraftId: item.id,
          decision,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Remove from list and advance
      setItems((prev) => prev.filter((_, i) => i !== selectedIdx));
      setSelectedIdx((prev) => Math.min(prev, items.length - 2));
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setSubmitting(false);
    }
  }

  const item = items[selectedIdx];
  const choices = item ? [
    { letter: 'A', text: item.choice_a, why_wrong: item.why_wrong_a },
    { letter: 'B', text: item.choice_b, why_wrong: item.why_wrong_b },
    { letter: 'C', text: item.choice_c, why_wrong: item.why_wrong_c },
    { letter: 'D', text: item.choice_d, why_wrong: item.why_wrong_d },
    { letter: 'E', text: item.choice_e, why_wrong: item.why_wrong_e },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-white"
          >
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_revision">Needs Revision</option>
          </select>
          <span className="text-sm text-gray-500">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No items in queue</div>
      ) : (
        <div className="grid grid-cols-[200px_1fr] gap-6">
          {/* Item list sidebar */}
          <div className="space-y-1 max-h-[80vh] overflow-y-auto">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setSelectedIdx(i)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  i === selectedIdx
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="font-medium truncate">{it.topic}</div>
                <div className="text-xs text-gray-500">{it.system}</div>
              </button>
            ))}
          </div>

          {/* Item detail */}
          {item && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium px-2 py-0.5 rounded bg-gray-100">
                  {item.system}
                </span>
                <span className="text-sm font-medium px-2 py-0.5 rounded bg-gray-100">
                  {item.topic}
                </span>
                {item.repair_count > 0 && (
                  <span className="text-xs text-amber-600">
                    {item.repair_count} repair cycle{item.repair_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Vignette + Stem */}
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <p className="text-sm leading-relaxed">{item.vignette}</p>
                <p className="text-sm font-medium leading-relaxed">{item.stem}</p>
              </div>

              {/* Answer Choices */}
              <div className="space-y-2">
                {choices.map((c) => (
                  <div
                    key={c.letter}
                    className={`border rounded p-3 text-sm ${
                      c.letter === item.correct_answer
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="font-mono font-bold mr-2">{c.letter}.</span>
                    {c.text}
                    {c.letter === item.correct_answer && (
                      <span className="ml-2 text-xs text-green-700 font-medium">CORRECT</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <details className="border rounded-lg">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium bg-gray-50 rounded-t-lg">
                  Explanation
                </summary>
                <div className="p-4 space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Why correct:</span>{' '}
                    {item.why_correct}
                  </div>
                  {item.explanation_transfer_rule && (
                    <div>
                      <span className="font-medium">Transfer rule:</span>{' '}
                      {item.explanation_transfer_rule}
                    </div>
                  )}
                  {item.explanation_decision_logic && (
                    <div>
                      <span className="font-medium">Decision logic:</span>{' '}
                      {item.explanation_decision_logic}
                    </div>
                  )}
                  {choices.filter((c) => c.why_wrong).map((c) => (
                    <div key={c.letter} className="text-gray-600">
                      <span className="font-medium">Why not {c.letter}:</span>{' '}
                      {c.why_wrong}
                    </div>
                  ))}
                  {item.high_yield_pearl && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                      <span className="font-medium">Pearl:</span>{' '}
                      {item.high_yield_pearl}
                    </div>
                  )}
                </div>
              </details>

              {/* Validator Scores */}
              <details className="border rounded-lg">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium bg-gray-50 rounded-t-lg">
                  Validator Scores
                </summary>
                <div className="p-4 space-y-2 text-sm">
                  {Object.entries(item.validator_scores).map(([vt, info]) => (
                    <div key={vt} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${info.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-mono text-xs w-40">{vt}</span>
                      <span className="text-gray-500">{info.score}/10</span>
                      {info.issues.length > 0 && (
                        <span className="text-red-600 text-xs">
                          {info.issues.length} issue{info.issues.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </details>

              {/* Review Actions */}
              <div className="border-t pt-4 space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Review notes (optional)"
                  className="w-full border rounded p-2 text-sm h-20 resize-y"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => submitReview('approved')}
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => submitReview('needs_revision')}
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                  >
                    Needs Revision
                  </button>
                  <button
                    onClick={() => submitReview('rejected')}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <div className="flex-1" />
                  <span className="text-xs text-gray-400 self-center">
                    {selectedIdx + 1} of {items.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
