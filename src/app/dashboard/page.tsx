import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface ShelfStat {
  shelf: string;
  total: number;
  correct: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, target_score')
    .eq('id', user.id)
    .single();

  // Fetch all user responses with blueprint shelf info
  const { data: responses } = await supabase
    .from('user_responses')
    .select('is_correct, item_draft_id, item_draft(blueprint_node(shelf))')
    .eq('user_id', user.id);

  const totalAnswered = responses?.length ?? 0;
  const totalCorrect = responses?.filter(r => r.is_correct).length ?? 0;
  const accuracyRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Aggregate by shelf
  const shelfMap = new Map<string, { total: number; correct: number }>();
  for (const r of responses ?? []) {
    const shelf = (r as unknown as { item_draft: { blueprint_node: { shelf: string } } })
      .item_draft?.blueprint_node?.shelf;
    if (!shelf) continue;
    const entry = shelfMap.get(shelf) ?? { total: 0, correct: 0 };
    entry.total++;
    if (r.is_correct) entry.correct++;
    shelfMap.set(shelf, entry);
  }
  const shelfStats: ShelfStat[] = Array.from(shelfMap.entries())
    .map(([shelf, { total, correct }]) => ({ shelf, total, correct }))
    .sort((a, b) => b.total - a.total);

  // Count available questions (MVP question bank)
  const { count: availableQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true });

  const displayName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Student';

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-white">Blackstar</h1>
          <span className="text-sm text-zinc-400">{user.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {displayName}
          </h2>
          <p className="mt-1 text-zinc-400">
            {totalAnswered === 0
              ? 'Start practicing to see your stats here.'
              : `You've answered ${totalAnswered} questions so far.`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Questions Answered" value={totalAnswered.toString()} />
          <StatCard label="Accuracy" value={totalAnswered > 0 ? `${accuracyRate}%` : '--'} />
          <StatCard label="Available Questions" value={(availableQuestions ?? 0).toString()} />
        </div>

        {/* Shelf Breakdown */}
        {shelfStats.length > 0 && (
          <div className="mb-10">
            <h3 className="mb-4 text-lg font-semibold text-white">Performance by Shelf</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shelfStats.map(({ shelf, total, correct }) => (
                <div
                  key={shelf}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium capitalize text-white">
                      {shelf.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-zinc-500">{total} questions</p>
                  </div>
                  <span className="text-lg font-bold text-indigo-400">
                    {Math.round((correct / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href="/study"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          Start Studying
        </Link>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
