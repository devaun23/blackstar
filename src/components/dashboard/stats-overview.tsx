'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Brain, Target, Flame, Clock } from 'lucide-react';

interface StatsOverviewProps {
  totalAttempts: number;
  accuracy: number;
  streak: number;
  dueReviewCount: number;
}

const stats: Array<{ key: keyof StatsOverviewProps; label: string; icon: typeof Brain; suffix?: string }> = [
  { key: 'totalAttempts', label: 'Questions Answered', icon: Brain },
  { key: 'accuracy', label: 'Accuracy', icon: Target, suffix: '%' },
  { key: 'streak', label: 'Study Streak', icon: Flame, suffix: 'd' },
  { key: 'dueReviewCount', label: 'Due for Review', icon: Clock },
];

export function StatsOverview({ totalAttempts, accuracy, streak, dueReviewCount }: StatsOverviewProps) {
  const values: Record<string, number> = { totalAttempts, accuracy, streak, dueReviewCount };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.key}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {values[stat.key] ?? 0}{stat.suffix && values[stat.key] > 0 ? stat.suffix : ''}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
