/**
 * Smoke test for the multi-criterion rubric scorer.
 *
 * Picks the first passed item with a linked algorithm_card, runs the scorer,
 * prints the 8-criterion output, leaves the row in item_rubric_score (unlike
 * the coverage and CCV smoke tests which clean up — rubric scores are
 * informational and harmless to leave behind).
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

async function main(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const { rubricScorer } = await import('../src/lib/factory/agents');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: items, error } = await supabase
    .from('item_draft')
    .select('id, item_plan_id')
    .in('status', ['passed', 'published'])
    .limit(1);
  if (error || !items?.[0]) {
    throw new Error(`No passed/published items found: ${error?.message}`);
  }
  const targetId = items[0].id as string;
  const targetPlanId = items[0].item_plan_id as string;

  const { data: draft, error: draftErr } = await supabase
    .from('item_draft')
    .select('*')
    .eq('id', targetId)
    .single();
  if (draftErr || !draft) throw new Error(`Draft fetch: ${draftErr?.message}`);

  // Resolve algorithm_card via item_plan.
  const { data: plan, error: planErr } = await supabase
    .from('item_plan')
    .select('algorithm_card_id')
    .eq('id', targetPlanId)
    .single();
  if (planErr || !plan) throw new Error(`Plan fetch: ${planErr?.message}`);
  const { data: card, error: cardErr } = await supabase
    .from('algorithm_card')
    .select('*')
    .eq('id', plan.algorithm_card_id)
    .single();
  if (cardErr || !card) throw new Error(`Card fetch: ${cardErr?.message}`);

  console.log(`\nScoring item ${targetId.slice(0, 8)}...\n`);
  const context = { pipelineRunId: 'rubric-smoke', mockMode: false } as Parameters<typeof rubricScorer.run>[0];
  const start = Date.now();
  const res = await rubricScorer.run(context, { draft, card });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.success || !res.data) {
    console.error(`FAIL (${elapsed}s): ${res.error}`);
    process.exit(1);
  }

  const d = res.data;
  console.log(`Completed in ${elapsed}s, ${res.tokensUsed} tokens`);
  console.log('━━━ Rubric result ━━━');
  console.log(`  rubric_version: ${d.rubric_version}`);
  console.log(`  overall_score:  ${d.overall_score}`);
  console.log(`  flagged:        ${d.flagged}`);
  console.log(`  summary: ${d.summary}\n`);
  console.log('  Sub-scores:');
  for (const [k, v] of Object.entries(d.sub_scores)) {
    const mark = v.score <= 2 ? '⚠' : v.score >= 4 ? '✓' : '·';
    console.log(`    ${mark} ${k.padEnd(32)} ${v.score}/5  — ${v.rationale}`);
  }
  console.log(`\n  Row saved: item_rubric_score.id = ${d.rubricRowId}`);
}

main().catch((err) => {
  console.error('Crashed:', err);
  process.exit(2);
});
