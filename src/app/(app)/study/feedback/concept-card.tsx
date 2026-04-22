'use client';

import { useState, useEffect } from 'react';
import type { ComponentState } from './section-order';
import type { ConceptBlock } from '@/lib/types/explanation';

interface ConceptCardProps {
  concept: ConceptBlock;
  state: ComponentState;
}

export default function ConceptCard({ concept, state }: ConceptCardProps) {
  const [open, setOpen] = useState(state === 'open');
  useEffect(() => { setOpen(state === 'open'); }, [state]);

  if (state === 'hidden') return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-emerald-700/50 bg-emerald-950/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          The Concept
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Pathophysiology
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {concept.pathophysiology}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Diagnostic Criteria
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {concept.diagnosticCriteria}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              High-Yield Associations
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {concept.highYieldAssociations}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
