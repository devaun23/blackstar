import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PracticeSession from './practice-session';

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: questions } = await supabase
    .from('item_draft')
    .select('id, vignette, stem, choice_a, choice_b, choice_c, choice_d, choice_e, correct_answer, why_correct, why_wrong_a, why_wrong_b, why_wrong_c, why_wrong_d, why_wrong_e, high_yield_pearl, reasoning_pathway, decision_hinge, competing_differential, visual_specs, medicine_deep_dive, comparison_table, pharmacology_notes, image_pointer, blueprint_node_id, blueprint_node(shelf, topic)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-foreground">No Questions Available</h2>
          <p className="mt-3 text-muted-foreground">
            The question factory hasn&apos;t published any items yet. Check back soon.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Supabase returns joined relations as arrays; since blueprint_node is a single FK,
  // normalize to a single object for the client component.
  const normalized = questions.map(q => ({
    ...q,
    blueprint_node: Array.isArray(q.blueprint_node) ? q.blueprint_node[0] ?? null : q.blueprint_node,
  }));

  return <PracticeSession questions={normalized} />;
}
