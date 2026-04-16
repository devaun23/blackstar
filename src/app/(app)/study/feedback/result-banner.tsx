'use client';

interface ResultBannerProps {
  isCorrect: boolean;
  correctAnswer: string;
  timingFeedback?: string | null;
}

export default function ResultBanner({ isCorrect, correctAnswer, timingFeedback }: ResultBannerProps) {
  return (
    <div>
      <p className={`text-sm font-semibold ${isCorrect ? 'text-[var(--color-correct-base)]' : 'text-[var(--color-incorrect-base)]'}`}>
        {isCorrect
          ? 'Correct!'
          : `Incorrect \u2014 the answer is ${correctAnswer}`}
      </p>
      {timingFeedback && (
        <p className="mt-1 text-xs text-zinc-500">
          {timingFeedback}
        </p>
      )}
    </div>
  );
}
