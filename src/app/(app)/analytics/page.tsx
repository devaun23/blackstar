import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Detailed learning analytics coming soon.
      </p>
    </div>
  );
}
