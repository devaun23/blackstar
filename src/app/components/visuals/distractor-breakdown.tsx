'use client';

import type { DistractorBreakdownSpec } from '@/lib/factory/schemas/visual-specs';
import Badge from '@/app/components/ui/badge';

interface DistractorBreakdownProps {
  spec: DistractorBreakdownSpec;
}

export default function DistractorBreakdown({ spec }: DistractorBreakdownProps) {
  try {
    return (
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {spec.title}
        </p>

        <div className="space-y-2">
          {spec.distractors.map((d, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-[var(--color-surface-base)] p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge label={d.letter} variant="incorrect" size="sm" />
                <span className="text-xs font-medium text-[var(--color-text-primary)]">
                  {d.option}
                </span>
              </div>

              <div className="space-y-1 pl-7">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <span className="font-medium text-[var(--color-pearl-base)]">Tempting: </span>
                  {d.whyTempting}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <span className="font-medium text-[var(--color-incorrect-base)]">Wrong: </span>
                  {d.whyWrong}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Cognitive error: {d.cognitiveError}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">
        [Distractor breakdown could not be rendered]
      </p>
    );
  }
}
