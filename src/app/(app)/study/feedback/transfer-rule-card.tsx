'use client';

interface TransferRuleCardProps {
  transferRule: string;
  emphasized?: boolean;
}

export default function TransferRuleCard({ transferRule, emphasized }: TransferRuleCardProps) {
  const borderClass = emphasized
    ? 'border-[var(--color-pearl-base)] ring-1 ring-[var(--color-pearl-base)]/30'
    : 'border-[var(--color-pearl-border)]';

  return (
    <div className={`rounded-[var(--radius-card)] border ${borderClass} bg-[var(--color-pearl-bg)] p-[var(--space-card-padding)]`}>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pearl-base)]">
        Transfer Rule
      </h4>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-pearl-text)]">
        {transferRule}
      </p>
    </div>
  );
}
