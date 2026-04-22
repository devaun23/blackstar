'use client';

import { useState, useEffect } from 'react';
import type { ComponentState } from './section-order';
import type { PharmacologyEntry } from '@/lib/types/explanation';

interface PharmacologySectionProps {
  entries: PharmacologyEntry[];
  state: ComponentState;
}

export default function PharmacologySection({ entries, state }: PharmacologySectionProps) {
  const [open, setOpen] = useState(state === 'open');
  useEffect(() => { setOpen(state === 'open'); }, [state]);

  if (state === 'hidden' || entries.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-emerald-700/50 bg-emerald-950/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Pharmacology
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3 space-y-4">
          {entries.map((drug, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-emerald-300">{drug.drug}</p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  drug.appearsAs === 'correct_answer'
                    ? 'bg-[var(--color-correct-bg)] text-[var(--color-correct-base)]'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {drug.appearsAs === 'correct_answer' ? 'Correct answer' : 'Distractor'}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-muted)]">Mechanism: </span>
                {drug.mechanism}
              </p>
              {drug.majorSideEffects.length > 0 && (
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">Major side effects: </span>
                  {drug.majorSideEffects.join('; ')}
                </p>
              )}
              {drug.criticalContraindications.length > 0 && (
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">Contraindications: </span>
                  {drug.criticalContraindications.join('; ')}
                </p>
              )}
              {drug.monitoring && (
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">Monitoring: </span>
                  {drug.monitoring}
                </p>
              )}
              {drug.keyInteraction && (
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">Key interaction: </span>
                  {drug.keyInteraction}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
