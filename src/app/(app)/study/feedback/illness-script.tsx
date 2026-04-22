'use client';

import { useState, useEffect } from 'react';
import type { ComponentState } from './section-order';

interface IllnessScriptProps {
  script: string;
  state: ComponentState;
}

export default function IllnessScript({ script, state }: IllnessScriptProps) {
  const [open, setOpen] = useState(state === 'open');
  useEffect(() => { setOpen(state === 'open'); }, [state]);

  if (state === 'hidden') return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-blue-700/50 bg-blue-950/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          The Pattern
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3">
          <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
            {script}
          </p>
        </div>
      )}
    </div>
  );
}
