'use client';

import { useState } from 'react';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'incorrect';
}

export default function Collapsible({ title, children, defaultOpen = false, variant = 'default' }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  const borderColor = variant === 'incorrect'
    ? 'border-[var(--color-incorrect-border)]'
    : 'border-zinc-800';

  return (
    <div className={`rounded-[var(--radius-card)] border ${borderColor} bg-[var(--color-surface-base)]`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-[var(--space-card-padding)] text-left"
      >
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 p-[var(--space-card-padding)] pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
