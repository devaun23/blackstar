'use client';

import { useState, useEffect } from 'react';
import type { ComponentState } from './section-order';
import type { ComparisonTable } from '@/lib/types/explanation';

interface ContrastTableProps {
  contrast: ComparisonTable;
  state: ComponentState;
}

export default function ContrastTable({ contrast, state }: ContrastTableProps) {
  const [open, setOpen] = useState(state === 'open');
  useEffect(() => { setOpen(state === 'open'); }, [state]);

  if (state === 'hidden' || contrast.rows.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-amber-700/50 bg-amber-950/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          {contrast.conditionA} vs {contrast.conditionB}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Feature
                </th>
                <th className="pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {contrast.conditionA}
                </th>
                <th className="pb-2 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {contrast.conditionB}
                </th>
              </tr>
            </thead>
            <tbody>
              {contrast.rows.map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/50 last:border-b-0">
                  <td className="py-2 pr-2 font-medium text-[var(--color-text-primary)]">
                    {row.feature}
                  </td>
                  <td className="py-2 px-2 text-[var(--color-text-secondary)]">
                    {row.conditionAValue}
                  </td>
                  <td className="py-2 px-2 text-[var(--color-text-secondary)]">
                    {row.conditionBValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
