'use client';

interface SectionCardProps {
  label: string;
  children: React.ReactNode;
  variant?: 'default' | 'correct' | 'incorrect' | 'pearl' | 'accent';
}

const variantStyles: Record<string, string> = {
  default: 'border-zinc-800 bg-[var(--color-surface-base)]',
  correct: 'border-[var(--color-correct-border)] bg-[var(--color-correct-bg)]',
  incorrect: 'border-[var(--color-incorrect-border)] bg-[var(--color-incorrect-bg)]',
  pearl: 'border-[var(--color-pearl-border)] bg-[var(--color-pearl-bg)]',
  accent: 'border-[var(--color-accent-border)] bg-[var(--color-accent-bg)]',
};

const labelColors: Record<string, string> = {
  default: 'text-[var(--color-text-muted)]',
  correct: 'text-[var(--color-correct-base)]',
  incorrect: 'text-[var(--color-incorrect-base)]',
  pearl: 'text-[var(--color-pearl-base)]',
  accent: 'text-[var(--color-accent-base)]',
};

export default function SectionCard({ label, children, variant = 'default' }: SectionCardProps) {
  return (
    <div className={`rounded-[var(--radius-card)] border p-[var(--space-card-padding)] ${variantStyles[variant]}`}>
      <h4 className={`text-xs font-semibold uppercase tracking-wider ${labelColors[variant]}`}>
        {label}
      </h4>
      <div className="mt-2">{children}</div>
    </div>
  );
}
