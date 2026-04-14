'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReadinessGaugeProps {
  overallMastery: number;
  dimensionCount: number;
}

export function ReadinessGauge({ overallMastery, dimensionCount }: ReadinessGaugeProps) {
  const color = overallMastery >= 70
    ? 'var(--color-correct-base)'
    : overallMastery >= 50
    ? 'var(--color-pearl-base)'
    : 'var(--color-incorrect-base)';

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (overallMastery / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Readiness</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{overallMastery}%</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Based on {dimensionCount} dimension{dimensionCount !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
