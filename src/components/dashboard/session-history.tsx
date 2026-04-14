'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SessionData {
  id: string;
  mode: string;
  status: string;
  target_count: number;
  completed_count: number;
  correct_count: number;
  started_at: string;
  completed_at: string | null;
  accuracy: number;
}

interface SessionHistoryProps {
  sessions: SessionData[];
}

const modeStyles: Record<string, string> = {
  retention: 'bg-[var(--color-correct-bg)] text-[var(--color-correct-base)] border-[var(--color-correct-border)]',
  training: 'bg-[var(--color-pearl-bg)] text-[var(--color-pearl-base)] border-[var(--color-pearl-border)]',
  assessment: 'bg-[var(--color-accent-bg)] text-[var(--color-accent-base)] border-[var(--color-accent-border)]',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your completed study sessions will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Session History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Questions</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map(s => (
              <TableRow key={s.id}>
                <TableCell className="text-sm">
                  {formatDate(s.completed_at ?? s.started_at)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${modeStyles[s.mode] ?? ''}`}
                  >
                    {s.mode}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm">
                  {s.completed_count}/{s.target_count}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {s.accuracy}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
