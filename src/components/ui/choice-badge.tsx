'use client';

import { cn } from '@/lib/utils';

interface ChoiceBadgeProps {
  label: string;
  variant?: 'default' | 'correct' | 'incorrect' | 'pearl' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'border-zinc-600 text-[var(--color-text-secondary)]',
  correct: 'border-[var(--color-correct-base)] text-[var(--color-correct-base)] bg-[var(--color-correct-bg)]',
  incorrect: 'border-[var(--color-incorrect-base)] text-[var(--color-incorrect-base)] bg-[var(--color-incorrect-bg)]',
  pearl: 'border-[var(--color-pearl-base)] text-[var(--color-pearl-base)] bg-[var(--color-pearl-bg)]',
  accent: 'border-[var(--color-accent-base)] text-[var(--color-accent-base)] bg-[var(--color-accent-bg)]',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-6 w-6 text-xs',
};

export default function ChoiceBadge({ label, variant = 'default', size = 'md', className }: ChoiceBadgeProps) {
  return (
    <span className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-full border font-medium',
      variantStyles[variant],
      sizeStyles[size],
      className,
    )}>
      {label}
    </span>
  );
}
