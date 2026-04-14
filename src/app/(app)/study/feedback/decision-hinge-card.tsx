'use client';

interface DecisionHingeCardProps {
  hinge: string;
  emphasized?: boolean;
}

export default function DecisionHingeCard({ hinge, emphasized }: DecisionHingeCardProps) {
  const borderClass = emphasized
    ? 'border-[var(--color-accent-base)] ring-1 ring-[var(--color-accent-base)]/30'
    : 'border-[var(--color-accent-border)]';

  return (
    <div className={`rounded-[var(--radius-card)] border ${borderClass} bg-[var(--color-accent-bg)] p-[var(--space-card-padding)]`}>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-base)]">
        Decision Hinge
      </h4>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-text-primary)]">
        {hinge}
      </p>
    </div>
  );
}
