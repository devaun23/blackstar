'use client';

import SectionCard from '@/components/ui/section-card';

interface WhyCorrectSectionProps {
  whyCorrect: string;
  decisionLogic?: string | null;
}

export default function WhyCorrectSection({ whyCorrect, decisionLogic }: WhyCorrectSectionProps) {
  return (
    <SectionCard label="Why This Answer" variant="default">
      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {decisionLogic ?? whyCorrect}
      </p>
    </SectionCard>
  );
}
