'use client';

import type { SeverityLadderSpec } from '@/lib/factory/schemas/visual-specs';

interface SeverityLadderProps {
  spec: SeverityLadderSpec;
}

const severityColors: Record<string, string> = {
  critical: 'var(--color-severity-critical)',
  high: 'var(--color-severity-high)',
  moderate: 'var(--color-severity-moderate)',
  low: 'var(--color-severity-low)',
};

const severityBg: Record<string, string> = {
  critical: 'rgba(239, 68, 68, 0.1)',
  high: 'rgba(249, 115, 22, 0.1)',
  moderate: 'rgba(234, 179, 8, 0.1)',
  low: 'rgba(34, 197, 94, 0.1)',
};

export default function SeverityLadder({ spec }: SeverityLadderProps) {
  try {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {spec.title}
        </p>
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">{spec.classification}</p>

        <div className="space-y-2">
          {spec.rungs.map((rung, i) => {
            const color = severityColors[rung.severity];
            const bg = severityBg[rung.severity];

            return (
              <div
                key={i}
                className="relative rounded-lg border p-3"
                style={{
                  borderColor: color,
                  backgroundColor: bg,
                }}
              >
                {/* Patient marker */}
                {rung.isPatientHere && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 items-center rounded-full px-2 text-[10px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    PATIENT
                  </span>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold" style={{ color }}>
                      {rung.level}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {rung.criteria.map((c, ci) => (
                        <li key={ci} className="text-xs text-[var(--color-text-secondary)]">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {rung.management}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">
        [Severity ladder could not be rendered]
      </p>
    );
  }
}
