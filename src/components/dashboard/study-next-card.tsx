'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw, AlertTriangle, Crosshair, ClipboardCheck } from 'lucide-react';

interface Weakness {
  type: string;
  id: string;
  label: string;
  mastery: number;
  attempts: number;
}

interface StudyNextCardProps {
  dueReviewCount: number;
  weakest: Weakness[];
  overconfidentTopics: Array<{ topic: string; confidence: number; accuracy: number }>;
  totalAttempts: number;
}

export function StudyNextCard({ dueReviewCount, weakest, overconfidentTopics, totalAttempts }: StudyNextCardProps) {
  const recommendations: Array<{
    icon: typeof RotateCcw;
    title: string;
    description: string;
    href: string;
    variant: 'correct' | 'incorrect' | 'pearl' | 'accent';
  }> = [];

  if (dueReviewCount > 0) {
    recommendations.push({
      icon: RotateCcw,
      title: `${dueReviewCount} items due for review`,
      description: 'Spaced repetition keeps knowledge fresh. Review now to maintain mastery.',
      href: '/study',
      variant: 'correct',
    });
  }

  const urgentWeak = weakest.find(w => w.mastery < 40);
  if (urgentWeak) {
    recommendations.push({
      icon: AlertTriangle,
      title: `${urgentWeak.label} at ${urgentWeak.mastery}%`,
      description: `${urgentWeak.attempts} attempts so far. Focused training will close this gap.`,
      href: '/study',
      variant: 'incorrect',
    });
  }

  if (overconfidentTopics.length > 0) {
    const top = overconfidentTopics[0];
    recommendations.push({
      icon: Crosshair,
      title: `Blind spot: ${top.topic}`,
      description: `${top.confidence}% confident but ${top.accuracy}% accurate. Target this area.`,
      href: '/study',
      variant: 'pearl',
    });
  }

  if (recommendations.length === 0 && totalAttempts > 0) {
    recommendations.push({
      icon: ClipboardCheck,
      title: 'Keep going!',
      description: weakest.length > 0
        ? `Focus on ${weakest[0].label} (${weakest[0].mastery}% mastery) next.`
        : 'Start a training session to build your mastery profile.',
      href: '/study',
      variant: 'accent',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      icon: ClipboardCheck,
      title: 'Start your first session',
      description: 'Answer questions to build your learning profile and get personalized recommendations.',
      href: '/study',
      variant: 'accent',
    });
  }

  const variantColors = {
    correct: 'text-[var(--color-correct-base)]',
    incorrect: 'text-[var(--color-incorrect-base)]',
    pearl: 'text-[var(--color-pearl-base)]',
    accent: 'text-[var(--color-accent-base)]',
  };

  const variantBg = {
    correct: 'bg-[var(--color-correct-bg)]',
    incorrect: 'bg-[var(--color-incorrect-bg)]',
    pearl: 'bg-[var(--color-pearl-bg)]',
    accent: 'bg-[var(--color-accent-bg)]',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">What to study next</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.slice(0, 3).map((rec, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${variantBg[rec.variant]}`}>
              <rec.icon className={`h-4 w-4 ${variantColors[rec.variant]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{rec.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
            </div>
            <Link href={rec.href}>
              <Button size="sm" variant="ghost" className="shrink-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
