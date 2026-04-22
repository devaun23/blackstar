'use client';

import { useState, useEffect } from 'react';
import type { ComponentState } from './section-order';
import type { TrapEntry } from '@/lib/types/explanation';

interface TrapsSectionProps {
  traps: TrapEntry[];
  state: ComponentState;
}

export default function TrapsSection({ traps, state }: TrapsSectionProps) {
  const [open, setOpen] = useState(state === 'open');
  useEffect(() => { setOpen(state === 'open'); }, [state]);

  if (state === 'hidden' || traps.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-amber-700/50 bg-amber-950/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Common Traps
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3 space-y-4">
          {traps.map((trap, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-amber-300">
                  {trap.trapName}
                </p>
                {trap.mapsToOption && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                    Option {trap.mapsToOption}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-zinc-400 italic">
                {trap.validation}
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
                {trap.correction}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
