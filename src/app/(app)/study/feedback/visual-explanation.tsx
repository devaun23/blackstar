'use client';

import Collapsible from '@/components/ui/old-collapsible';
import VisualRenderer from '@/components/visuals/visual-renderer';
import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

interface VisualExplanationProps {
  specs: VisualSpec[];
  defaultOpen?: boolean;
}

export default function VisualExplanation({ specs, defaultOpen = false }: VisualExplanationProps) {
  // Only show explanation-supporting visuals (not testing-only)
  const explanationSpecs = specs.filter(
    (s) => s.visual_contract.supports === 'explanation' || s.visual_contract.supports === 'both'
  );

  if (explanationSpecs.length === 0) return null;

  return (
    <Collapsible title="Visual Explanation" defaultOpen={defaultOpen}>
      <div className="space-y-4">
        {explanationSpecs.map((spec, i) => (
          <div key={i}>
            {spec.visual_contract.teaching_goal && (
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                {spec.visual_contract.teaching_goal}
              </p>
            )}
            <VisualRenderer spec={spec} />
          </div>
        ))}
      </div>
    </Collapsible>
  );
}
