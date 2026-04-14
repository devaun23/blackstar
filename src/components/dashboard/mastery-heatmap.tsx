'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface DimensionData {
  type: string;
  id: string;
  label: string;
  mastery: number;
  attempts: number;
  correct: number;
}

interface MasteryHeatmapProps {
  dimensions: DimensionData[];
}

const dimensionLabels: Record<string, string> = {
  topic: 'Topics',
  cognitive_error: 'Error Patterns',
  transfer_rule: 'Transfer Rules',
  confusion_set: 'Confusion Sets',
  action_class: 'Action Classes',
  hinge_clue_type: 'Hinge Clues',
};

function masteryColor(mastery: number) {
  if (mastery >= 70) return 'text-[var(--color-correct-base)]';
  if (mastery >= 40) return 'text-[var(--color-pearl-base)]';
  return 'text-[var(--color-incorrect-base)]';
}

function masteryIndicator(mastery: number) {
  if (mastery >= 70) return '[--progress-indicator:var(--color-correct-base)]';
  if (mastery >= 40) return '[--progress-indicator:var(--color-pearl-base)]';
  return '[--progress-indicator:var(--color-incorrect-base)]';
}

export function MasteryHeatmap({ dimensions }: MasteryHeatmapProps) {
  const types = [...new Set(dimensions.map(d => d.type))];
  const defaultType = types.includes('topic') ? 'topic' : types[0];

  if (dimensions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mastery by Dimension</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete study sessions to see your mastery breakdown here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mastery by Dimension</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultType}>
          <TabsList>
            {types.map(t => (
              <TabsTrigger key={t} value={t}>
                {dimensionLabels[t] ?? t}
              </TabsTrigger>
            ))}
          </TabsList>
          {types.map(t => {
            const items = dimensions
              .filter(d => d.type === t)
              .sort((a, b) => a.mastery - b.mastery);

            return (
              <TabsContent key={t} value={t} className="mt-4 space-y-3">
                {items.map(d => (
                  <div key={d.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium truncate mr-2">{d.label}</span>
                      <span className={`shrink-0 font-semibold ${masteryColor(d.mastery)}`}>
                        {d.mastery}%
                      </span>
                    </div>
                    <Progress value={d.mastery} className={`h-2 ${masteryIndicator(d.mastery)}`} />
                    <p className="text-[10px] text-muted-foreground">
                      {d.correct}/{d.attempts} correct
                    </p>
                  </div>
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
