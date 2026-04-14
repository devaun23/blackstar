'use client';

import SectionCard from '@/components/ui/section-card';

interface ResultBannerProps {
  isCorrect: boolean;
  correctAnswer: string;
}

export default function ResultBanner({ isCorrect, correctAnswer }: ResultBannerProps) {
  return (
    <SectionCard label="" variant={isCorrect ? 'correct' : 'incorrect'}>
      <p className={`text-sm font-semibold ${isCorrect ? 'text-[var(--color-correct-base)]' : 'text-[var(--color-incorrect-base)]'}`}>
        {isCorrect
          ? 'Correct!'
          : `Incorrect \u2014 the answer is ${correctAnswer}`}
      </p>
    </SectionCard>
  );
}
