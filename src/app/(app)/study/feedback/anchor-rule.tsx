'use client';

interface AnchorRuleProps {
  anchor: string;
}

export default function AnchorRule({ anchor }: AnchorRuleProps) {
  if (!anchor) return null;
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-[var(--color-pearl-border)] bg-[var(--color-pearl-bg)] p-[var(--space-card-padding)]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-pearl-text)]">
        The Rule
      </p>
      <p className="mt-1 text-base font-semibold leading-snug text-[var(--color-text-primary)]">
        {anchor}
      </p>
    </div>
  );
}
