'use client';

import Collapsible from '@/components/ui/old-collapsible';

interface ReasoningPathwayProps {
  pathway: string;
  defaultOpen?: boolean;
}

function parseSteps(pathway: string): string[] {
  // Try numbered list first (1. ... 2. ...)
  const numbered = pathway.split(/\d+\.\s+/).filter(Boolean);
  if (numbered.length > 1) return numbered.map((s) => s.trim());

  // Try semicolons
  const semicolons = pathway.split(';').filter(Boolean);
  if (semicolons.length > 1) return semicolons.map((s) => s.trim());

  // Try newlines
  const lines = pathway.split('\n').filter(Boolean);
  if (lines.length > 1) return lines.map((s) => s.trim());

  // Single block
  return [pathway.trim()];
}

export default function ReasoningPathway({ pathway, defaultOpen = false }: ReasoningPathwayProps) {
  const steps = parseSteps(pathway);

  return (
    <Collapsible title="Reasoning Pathway" defaultOpen={defaultOpen}>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-base)]/20 text-xs font-semibold text-[var(--color-accent-base)]">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </Collapsible>
  );
}
