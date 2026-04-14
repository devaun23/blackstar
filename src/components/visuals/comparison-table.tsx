'use client';

import { cn } from '@/lib/utils';
import type { ComparisonTableSpec } from '@/lib/factory/schemas/visual-specs';

interface ComparisonTableProps {
  spec: ComparisonTableSpec;
}

export default function ComparisonTable({ spec }: ComparisonTableProps) {
  try {
    return (
      <div className="overflow-x-auto">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {spec.title}
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="py-2 pr-3 text-left text-xs font-medium text-[var(--color-text-muted)]" />
              {spec.columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'py-2 px-3 text-left text-xs font-medium',
                    spec.highlightColumn === i
                      ? 'text-[var(--color-comparison-a)]'
                      : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, ri) => (
              <tr
                key={ri}
                className={cn(
                  'border-b border-zinc-800/50',
                  row.isDiscriminating && 'bg-[var(--color-accent-bg)]',
                )}
              >
                <td className="py-2 pr-3 text-xs font-medium text-[var(--color-text-secondary)]">
                  {row.label}
                </td>
                {row.values.map((val, vi) => (
                  <td
                    key={vi}
                    className={cn(
                      'py-2 px-3 text-xs',
                      spec.highlightColumn === vi
                        ? 'text-[var(--color-text-primary)] font-medium'
                        : 'text-[var(--color-text-secondary)]',
                    )}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">
        [Comparison table could not be rendered]
      </p>
    );
  }
}
