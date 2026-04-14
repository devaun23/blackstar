'use client';

import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';
import ComparisonTable from './comparison-table';
import SeverityLadder from './severity-ladder';
import DistractorBreakdown from './distractor-breakdown';

interface VisualRendererProps {
  spec: VisualSpec;
}

export default function VisualRenderer({ spec }: VisualRendererProps) {
  try {
    switch (spec.type) {
      case 'comparison_table':
        return <ComparisonTable spec={spec} />;
      case 'severity_ladder':
        return <SeverityLadder spec={spec} />;
      case 'distractor_breakdown':
        return <DistractorBreakdown spec={spec} />;
      case 'management_algorithm':
      case 'timeline':
      case 'diagnostic_funnel':
        return (
          <p className="text-xs text-[var(--color-text-muted)]">
            [{spec.type.replace(/_/g, ' ')} visual — renderer coming soon]
          </p>
        );
      default:
        return null;
    }
  } catch {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">
        [Visual could not be rendered]
      </p>
    );
  }
}
