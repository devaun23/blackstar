'use client';

interface StepIndicatorProps {
  steps: string[];
  maxVisible?: number;
}

export default function StepIndicator({ steps, maxVisible = 8 }: StepIndicatorProps) {
  const visible = steps.slice(0, maxVisible);
  const overflow = steps.length - maxVisible;

  return (
    <div className="relative pl-6">
      {/* Vertical connecting line */}
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-zinc-700" />

      <ol className="space-y-3">
        {visible.map((step, i) => (
          <li key={i} className="relative flex items-start gap-3">
            {/* Step number circle */}
            <span className="absolute -left-6 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-base)] bg-[var(--color-surface-base)] text-[10px] font-semibold text-[var(--color-accent-base)]">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {step}
            </span>
          </li>
        ))}
      </ol>

      {overflow > 0 && (
        <p className="mt-2 pl-0 text-xs text-[var(--color-text-muted)]">
          +{overflow} more step{overflow > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
