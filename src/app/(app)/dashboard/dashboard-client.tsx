'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { StudyNextCard } from '@/components/dashboard/study-next-card';
import { ReadinessGauge } from '@/components/dashboard/readiness-gauge';
import { MasteryHeatmap } from '@/components/dashboard/mastery-heatmap';
import { AccuracyTrend } from '@/components/dashboard/accuracy-trend';
import { ErrorPatterns } from '@/components/dashboard/error-patterns';
import { SessionHistory } from '@/components/dashboard/session-history';

interface DimensionData {
  type: string;
  id: string;
  label: string;
  mastery: number;
  attempts: number;
  correct: number;
}

interface Weakness {
  type: string;
  id: string;
  label: string;
  mastery: number;
  attempts: number;
}

interface DashboardClientProps {
  displayName: string;
  overview: {
    totalAttempts: number;
    accuracy: number;
    streak: number;
    dueReviewCount: number;
  };
  mastery: {
    overall: number;
    dimensions: DimensionData[];
    weakest: Weakness[];
  };
  calibration: {
    calibrationFactor: number;
    overconfidentTopics: Array<{ topic: string; confidence: number; accuracy: number }>;
    underconfidentTopics: Array<{ topic: string; confidence: number; accuracy: number }>;
  };
  errorPatterns: Array<{
    id: string;
    label: string;
    wrongCount: number;
    totalAttempts: number;
    masteryLevel: number;
  }>;
  accuracyTrend: Array<{ date: string; accuracy: number; total: number }>;
  sessions: Array<{
    id: string;
    mode: string;
    status: string;
    target_count: number;
    completed_count: number;
    correct_count: number;
    started_at: string;
    completed_at: string | null;
    accuracy: number;
  }>;
}

export function DashboardClient({
  displayName,
  overview,
  mastery,
  calibration,
  errorPatterns,
  accuracyTrend,
  sessions,
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {displayName}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {overview.totalAttempts === 0
            ? 'Start practicing to see your stats here.'
            : `You've answered ${overview.totalAttempts} questions so far.`}
        </p>
      </div>

      <StatsOverview
        totalAttempts={overview.totalAttempts}
        accuracy={overview.accuracy}
        streak={overview.streak}
        dueReviewCount={overview.dueReviewCount}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StudyNextCard
                dueReviewCount={overview.dueReviewCount}
                weakest={mastery.weakest}
                overconfidentTopics={calibration.overconfidentTopics}
                totalAttempts={overview.totalAttempts}
              />
            </div>
            <ReadinessGauge
              overallMastery={mastery.overall}
              dimensionCount={mastery.dimensions.length}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4 space-y-6">
          <MasteryHeatmap dimensions={mastery.dimensions} />
          <AccuracyTrend data={accuracyTrend} />
          <ErrorPatterns data={errorPatterns} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <SessionHistory sessions={sessions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
