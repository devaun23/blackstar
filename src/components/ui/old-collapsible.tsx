'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'incorrect' | 'fix' | 'breakdown' | 'medicine';
}

const variantStyles: Record<string, string> = {
  default: 'border-zinc-800',
  incorrect: 'border-[var(--color-incorrect-border)]',
  fix: 'border-amber-700/50 bg-amber-950/10',
  breakdown: 'border-blue-700/50 bg-blue-950/10',
  medicine: 'border-emerald-700/50 bg-emerald-950/10',
};

export default function Collapsible({ title, children, defaultOpen = false, variant = 'default' }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      'rounded-[var(--radius-card)] border bg-[var(--color-surface-base)]',
      variantStyles[variant] ?? variantStyles.default,
    )}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '\u25BE' : '\u25B8'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
