'use client';

interface HighYieldPearlProps {
  pearl: string;
  teachingPearl?: string | null;
}

export default function HighYieldPearl({ pearl, teachingPearl }: HighYieldPearlProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-pearl-border)] bg-[var(--color-pearl-bg)] p-[var(--space-card-padding)]">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pearl-base)]">
        High-Yield Pearl
      </h4>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-pearl-text)]">
        {pearl}
      </p>
      {teachingPearl && teachingPearl !== pearl && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-pearl-text)]/80">
          {teachingPearl}
        </p>
      )}
    </div>
  );
}
