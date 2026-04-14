'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';

interface TrendPoint {
  date: string;
  accuracy: number;
  total: number;
}

interface AccuracyTrendProps {
  data: TrendPoint[];
}

const chartConfig: ChartConfig = {
  accuracy: {
    label: 'Accuracy',
    color: 'var(--color-correct-base)',
  },
};

export function AccuracyTrend({ data }: AccuracyTrendProps) {
  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accuracy Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete at least 2 study sessions to see your trend.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Accuracy Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => d.slice(5)}
              className="text-[10px] fill-muted-foreground"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              className="text-[10px] fill-muted-foreground"
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={60} stroke="var(--color-text-muted)" strokeDasharray="6 3" />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="var(--color-correct-base)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Dashed line = 60% (approximate passing threshold)
        </p>
      </CardContent>
    </Card>
  );
}
