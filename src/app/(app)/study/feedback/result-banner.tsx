'use client';

interface ResultBannerProps {
  isCorrect: boolean;
  correctAnswer: string;
}

export default function ResultBanner({ isCorrect, correctAnswer }: ResultBannerProps) {
  return (
    <p className={`text-sm font-semibold ${isCorrect ? 'text-[var(--color-correct-base)]' : 'text-[var(--color-incorrect-base)]'}`}>
      {isCorrect
        ? 'Correct!'
        : `Incorrect \u2014 the answer is ${correctAnswer}`}
    </p>
  );
}
