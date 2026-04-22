'use client';

import { useState, useEffect } from 'react';
import type { ComponentState } from './section-order';
import type { ProtocolStep } from '@/lib/types/explanation';

interface ManagementProtocolProps {
  steps: ProtocolStep[];
  state: ComponentState;
}

export default function ManagementProtocol({ steps, state }: ManagementProtocolProps) {
  const [open, setOpen] = useState(state === 'open');
  useEffect(() => { setOpen(state === 'open'); }, [state]);

  if (state === 'hidden' || steps.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-blue-700/50 bg-blue-950/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Management Algorithm
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <ol className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3 space-y-2">
          {steps.map((step) => (
            <li key={step.stepNum} className="flex gap-3">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[var(--color-accent-base)] text-[10px] font-bold text-white">
                {step.stepNum}
              </span>
              <div className="flex-1">
                <p className="text-sm leading-snug text-[var(--color-text-primary)]">
                  {step.action}
                </p>
                {step.criterion && (
                  <p className="mt-0.5 text-xs leading-snug text-[var(--color-text-muted)]">
                    {step.criterion}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
