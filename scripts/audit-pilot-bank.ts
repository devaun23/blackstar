/**
 * Pilot bank audit — list every published IM item with the 7-point
 * ship-ready checklist inline as `- [ ]` boxes, ready for hand-audit.
 *
 * Read-only. No LLM calls, no mutations.
 *
 * Usage:
 *   npx tsx scripts/audit-pilot-bank.ts > pilot/audit-output.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

const SHIP_READY_CHECKLIST = [
  'Stem reads NBME (no AI tells, dual-temp °C/°F, /min, mm Hg)',
  'Lead-in is a standard NBME form',
  'All 5 options are plausible to a competent MS3',
  'Correct answer is NOT the longest option',
  'At least one distractor is the confusion-set partner',
  'Explanation tells you why each wrong answer was tempting',
  'No medical errors',
];

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: items, error } = await supabase
    .from('item_draft')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  if (!items || items.length === 0) {
    console.log('# Pilot Bank Audit\n\nNo published items found.\n');
    return;
  }

  const nodeIds = [...new Set(items.map((i) => i.blueprint_node_id).filter(Boolean))];
  const { data: nodes } = await supabase
    .from('blueprint_node')
    .select('id, shelf, topic, subtopic, task_type, clinical_setting, age_group')
    .in('id', nodeIds);
  const nodeMap = new Map((nodes ?? []).map((n) => [n.id, n]));

  const imItems = items.filter((it) => {
    const node = it.blueprint_node_id ? nodeMap.get(it.blueprint_node_id) : null;
    return node?.shelf === 'medicine';
  });

  console.log('# Blackstar Pilot Bank — Audit Checklist\n');
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Published items (all shelves): ${items.length}`);
  console.log(`Published items (medicine / IM): ${imItems.length}\n`);
  console.log('Tick boxes as you read. An item is **ship-ready** only if all 7 boxes pass.\n');
  console.log('---\n');

  if (imItems.length === 0) {
    console.log('**No medicine-shelf items found.** All published items are on other shelves.');
    console.log('Pull from another shelf or generate medicine-shelf items first.\n');
    const shelfCounts = new Map<string, number>();
    for (const it of items) {
      const node = it.blueprint_node_id ? nodeMap.get(it.blueprint_node_id) : null;
      const shelf = node?.shelf ?? '(no shelf)';
      shelfCounts.set(shelf, (shelfCounts.get(shelf) ?? 0) + 1);
    }
    console.log('## Published-item counts by shelf');
    for (const [shelf, count] of [...shelfCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`- ${shelf}: ${count}`);
    }
    return;
  }

  for (let i = 0; i < imItems.length; i++) {
    const it = imItems[i]!;
    const node = it.blueprint_node_id ? nodeMap.get(it.blueprint_node_id) : null;

    console.log(`## Item ${i + 1} — ${node?.topic ?? '(topic unknown)'}\n`);
    console.log(`- **id:** \`${it.id}\``);
    console.log(`- **node:** ${node ? `${node.topic} / ${node.subtopic ?? '(no subtopic)'} / ${node.task_type} / ${node.clinical_setting} / ${node.age_group}` : '(no node)'}`);
    console.log(`- **correct_answer:** ${it.correct_answer}`);
    console.log(`- **created_at:** ${it.created_at}\n`);

    console.log('### Ship-ready checklist (all must pass)\n');
    for (const item of SHIP_READY_CHECKLIST) {
      console.log(`- [ ] ${item}`);
    }
    console.log();

    console.log(`### Vignette\n\n${it.vignette ?? '(empty)'}\n`);
    console.log(`### Stem\n\n${it.stem ?? '(empty)'}\n`);

    console.log('### Options\n');
    for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
      const choice = it[`choice_${letter}` as keyof typeof it] as string | null;
      const marker = it.correct_answer?.toUpperCase() === letter.toUpperCase() ? ' ✓' : '';
      console.log(`- **${letter.toUpperCase()}${marker}:** ${choice ?? '(empty)'}`);
    }
    console.log();

    console.log(`### Why correct\n\n${it.why_correct ?? '(empty)'}\n`);

    console.log('### Why each wrong is wrong (the distractor analysis — this is what we sell)\n');
    for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
      if (it.correct_answer?.toUpperCase() === letter.toUpperCase()) continue;
      const why = it[`why_wrong_${letter}` as keyof typeof it] as string | null;
      console.log(`- **${letter.toUpperCase()}:** ${why ?? '_(missing — automatic fail)_'}`);
    }
    console.log();

    if (it.high_yield_pearl) {
      console.log(`### Pearl\n\n${it.high_yield_pearl}\n`);
    }
    if (it.decision_hinge) {
      console.log(`### Decision hinge\n\n${it.decision_hinge}\n`);
    }

    console.log('---\n');
  }

  console.log('\n## Audit summary\n');
  console.log(`Reviewed ${imItems.length} IM items.\n`);
  console.log('Decision rule:');
  console.log('- **8+ of 10 sampled pass** → use as starter bank, pull 40 more');
  console.log('- **6–7 pass** → ship the 6, audit 20 more');
  console.log('- **<6 pass** → fix audit-fail rate before recruiting users\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
