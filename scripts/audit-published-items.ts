/**
 * Hand-audit script: print every published item_draft with full structure.
 * Read-only. No LLM calls, no mutations.
 *
 * Usage:
 *   npx tsx scripts/audit-published-items.ts [> /tmp/audit.md]
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

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: items, error } = await supabase
    .from('item_draft')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  if (!items || items.length === 0) {
    console.log('No published items found.');
    return;
  }

  console.log(`# Hand-Audit: ${items.length} Published Items\n`);
  console.log(`Generated: ${new Date().toISOString()}\n`);

  const nodeIds = [...new Set(items.map((i) => i.blueprint_node_id).filter(Boolean))];
  const { data: nodes } = await supabase
    .from('blueprint_node')
    .select('id, topic, subtopic, task_type, clinical_setting, age_group')
    .in('id', nodeIds);
  const nodeMap = new Map((nodes ?? []).map((n) => [n.id, n]));

  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    const node = it.blueprint_node_id ? nodeMap.get(it.blueprint_node_id) : null;

    console.log(`\n---\n\n## Item ${i + 1} — ${node?.topic ?? '(topic unknown)'}\n`);
    console.log(`- **id:** \`${it.id}\``);
    console.log(`- **node:** ${node ? `${node.topic} / ${node.subtopic ?? '(no subtopic)'} / ${node.task_type} / ${node.clinical_setting} / ${node.age_group}` : '(no node)'}`);
    console.log(`- **correct_answer:** ${it.correct_answer}`);
    console.log(`- **repair_count:** ${it.repair_count ?? 0}`);
    console.log(`- **review_status:** ${it.review_status ?? '(none)'}`);
    console.log(`- **created_at:** ${it.created_at}`);
    console.log(`- **variant_group_id:** ${it.variant_group_id ?? '(none)'}`);
    console.log();

    console.log(`### Vignette\n\n${it.vignette ?? '(empty)'}\n`);
    console.log(`### Stem\n\n${it.stem ?? '(empty)'}\n`);
    console.log(`### Options\n`);
    for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
      const choice = it[`choice_${letter}` as keyof typeof it] as string | null;
      const marker = it.correct_answer?.toUpperCase() === letter.toUpperCase() ? ' ✓' : '';
      console.log(`- **${letter.toUpperCase()}${marker}:** ${choice ?? '(empty)'}`);
    }
    console.log();

    // Explanation fields (v22 9-component)
    const show = (label: string, val: unknown): void => {
      if (val == null || val === '') return;
      if (typeof val === 'string') {
        console.log(`### ${label}\n\n${val}\n`);
      } else {
        console.log(`### ${label}\n\n\`\`\`json\n${JSON.stringify(val, null, 2)}\n\`\`\`\n`);
      }
    };

    show('Why correct', it.why_correct);
    show('Decision hinge', it.decision_hinge);
    show('High-yield pearl', it.high_yield_pearl);
    show('Reasoning pathway', it.reasoning_pathway);
    show('Why wrong (per option)', it.why_wrong);
    show('Explanation decision logic', it.explanation_decision_logic);
    show('Explanation transfer rule', it.explanation_transfer_rule);
    show('Explanation error diagnosis', it.explanation_error_diagnosis);
    show('Explanation teaching pearl', it.explanation_teaching_pearl);
    show('Explanation gap coaching', it.explanation_gap_coaching);
    show('Medicine deep dive', it.medicine_deep_dive);
    show('Comparison table', it.comparison_table);
    show('Pharmacology notes', it.pharmacology_notes);
    show('Image pointer', it.image_pointer);
    show('Down to two discrimination', (it as Record<string, unknown>).down_to_two_discrimination);
    show('Question writer intent', (it as Record<string, unknown>).question_writer_intent);
    show('Easy recognition check', (it as Record<string, unknown>).easy_recognition_check);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
