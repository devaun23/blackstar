/**
 * Q-matrix coverage audit.
 *
 * Reports, per published item, whether all 6 learner-model dimensions are
 * populated:
 *   1. topic                (via blueprint_node.topic — always present if FK intact)
 *   2. target_transfer_rule (case_plan.target_transfer_rule_id)
 *   3. target_confusion_set (case_plan.target_confusion_set_id)
 *   4. target_cognitive_error (case_plan.target_cognitive_error_id)
 *   5. target_hinge_clue_type (case_plan.target_hinge_clue_type_id)
 *   6. target_action_class  (case_plan.target_action_class_id)
 *
 * Why this matters: the learner engine routes on these dimensions. Any item
 * missing tags is effectively invisible to the weakness/contrast/remediate
 * selectors — they can't select it for the dimension it would have served.
 *
 * This is a READ-ONLY audit. Use its output to decide whether the coverage
 * validator (next) should be a hard gate or a warn-only lint.
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

const DIMS = [
  'topic',
  'transfer_rule',
  'confusion_set',
  'cognitive_error',
  'hinge_clue_type',
  'action_class',
] as const;

interface Row {
  id: string;
  status: string;
  blueprint_node_id: string | null;
  case_plan_id: string | null;
  blueprint_node?: { topic: string | null } | null;
  case_plan?: {
    target_transfer_rule_id: string | null;
    target_confusion_set_id: string | null;
    target_cognitive_error_id: string | null;
    target_hinge_clue_type_id: string | null;
    target_action_class_id: string | null;
  } | null;
}

async function main(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase
    .from('item_draft')
    .select(
      'id, status, blueprint_node_id, case_plan_id, ' +
        'blueprint_node(topic), ' +
        'case_plan(target_transfer_rule_id, target_confusion_set_id, ' +
        'target_cognitive_error_id, target_hinge_clue_type_id, target_action_class_id)',
    )
    .in('status', ['published', 'passed']);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Row[];

  const coverage: Record<(typeof DIMS)[number], number> = {
    topic: 0,
    transfer_rule: 0,
    confusion_set: 0,
    cognitive_error: 0,
    hinge_clue_type: 0,
    action_class: 0,
  };

  console.log(`\n━━━ Q-matrix coverage audit ━━━`);
  console.log(`Items in scope (status=published OR passed): ${rows.length}\n`);

  if (rows.length === 0) {
    console.log('No items in scope. Exit.');
    return;
  }

  console.log(`${'id'.padEnd(10)}  ${'status'.padEnd(12)}  tpc tr cs ce hc ac   missing`);
  console.log('─'.repeat(80));

  const histogram: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const r of rows) {
    const hasTopic = !!r.blueprint_node?.topic;
    const hasTransfer = !!r.case_plan?.target_transfer_rule_id;
    const hasConfusion = !!r.case_plan?.target_confusion_set_id;
    const hasError = !!r.case_plan?.target_cognitive_error_id;
    const hasHinge = !!r.case_plan?.target_hinge_clue_type_id;
    const hasAction = !!r.case_plan?.target_action_class_id;

    if (hasTopic) coverage.topic++;
    if (hasTransfer) coverage.transfer_rule++;
    if (hasConfusion) coverage.confusion_set++;
    if (hasError) coverage.cognitive_error++;
    if (hasHinge) coverage.hinge_clue_type++;
    if (hasAction) coverage.action_class++;

    const dimHits = [hasTopic, hasTransfer, hasConfusion, hasError, hasHinge, hasAction];
    const count = dimHits.filter(Boolean).length;
    histogram[count]!++;

    const missing: string[] = [];
    if (!hasTopic) missing.push('topic');
    if (!hasTransfer) missing.push('transfer_rule');
    if (!hasConfusion) missing.push('confusion_set');
    if (!hasError) missing.push('cognitive_error');
    if (!hasHinge) missing.push('hinge_clue_type');
    if (!hasAction) missing.push('action_class');

    const marks = dimHits.map((b) => (b ? ' ✓ ' : ' · ')).join('');
    console.log(
      `${r.id.slice(0, 8).padEnd(10)}  ${r.status.padEnd(12)}  ${marks}  ${missing.join(', ') || '(all 6)'}`,
    );
  }

  console.log('\n─── Per-dimension coverage ───');
  for (const dim of DIMS) {
    const n = coverage[dim];
    const pct = ((n / rows.length) * 100).toFixed(0);
    console.log(`  ${dim.padEnd(20)} ${n}/${rows.length} (${pct}%)`);
  }

  console.log('\n─── Tagging depth histogram ───');
  for (let c = 6; c >= 0; c--) {
    console.log(`  ${c} of 6 tagged: ${histogram[c] ?? 0} items`);
  }

  const fullyTagged = histogram[6] ?? 0;
  const pctFull = ((fullyTagged / rows.length) * 100).toFixed(0);
  console.log(`\n  Fully-tagged items (all 6 dims): ${fullyTagged}/${rows.length} (${pctFull}%)`);

  console.log('\n─── Recommendation ───');
  if (fullyTagged === rows.length) {
    console.log('  All items fully tagged. Coverage validator can be a hard gate on publish.');
  } else if (fullyTagged / rows.length >= 0.5) {
    console.log('  Majority tagged. Ship coverage validator as hard gate on NEW items; ');
    console.log('  backfill existing items lazily.');
  } else {
    console.log('  Coverage poor. Ship coverage validator as WARN on publish (logs issue,');
    console.log('  does not block) until backfill effort lands. Blocking now would break');
    console.log('  the current pipeline.');
  }
}

main().catch((err) => {
  console.error('audit crashed:', err);
  process.exit(2);
});
