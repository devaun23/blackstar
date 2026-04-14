'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ErrorPattern {
  id: string;
  label: string;
  wrongCount: number;
  totalAttempts: number;
  masteryLevel: number;
}

interface ErrorPatternsProps {
  data: ErrorPattern[];
}

const chartConfig: ChartConfig = {
  wrongCount: {
    label: 'Errors',
    color: 'var(--color-incorrect-base)',
  },
};

export function ErrorPatterns({ data }: ErrorPatternsProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Error Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Error patterns will appear as you answer more questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    name: d.label.length > 20 ? d.label.slice(0, 18) + '...' : d.label,
    wrongCount: d.wrongCount,
    fullLabel: d.label,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Error Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis type="number" className="text-[10px] fill-muted-foreground" />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              className="text-[10px] fill-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="wrongCount" fill="var(--color-incorrect-base)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
