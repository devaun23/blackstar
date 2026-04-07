import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const EXPECTED_COUNTS: Record<number, number> = { 1: 5, 2: 5, 3: 5, 4: 8, 5: 3, 6: 4 };

async function main() {
  const supabase = createAdminClient();

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('batch_number', { ascending: true });

  if (error) throw new Error(`Query failed: ${error.message}`);
  if (!questions || questions.length === 0) {
    console.log('No questions found. Run generate-batch.ts first.');
    return;
  }

  console.log(`\n=== Blackstar Question Bank Audit ===`);
  console.log(`Total questions: ${questions.length}\n`);

  // 1. Batch counts
  console.log('── Batch Counts ──');
  const batchGroups = new Map<number, number>();
  for (const q of questions) {
    const bn = q.batch_number ?? 0;
    batchGroups.set(bn, (batchGroups.get(bn) ?? 0) + 1);
  }
  for (const [batch, count] of [...batchGroups.entries()].sort((a, b) => a[0] - b[0])) {
    const expected = EXPECTED_COUNTS[batch];
    const status = expected ? (count === expected ? 'OK' : `EXPECTED ${expected}`) : '';
    console.log(`  Batch ${batch}: ${count} ${status}`);
  }

  // 2. System topic diversity
  console.log('\n── System Topics ──');
  const topicCounts = new Map<string, number>();
  for (const q of questions) {
    topicCounts.set(q.system_topic, (topicCounts.get(q.system_topic) ?? 0) + 1);
  }
  for (const [topic, count] of [...topicCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${topic}: ${count}`);
  }
  const targetSystems = ['cardio', 'pulm', 'GI', 'renal', 'endo', 'neuro', 'heme', 'ID'];
  const missing = targetSystems.filter((s) => !topicCounts.has(s));
  if (missing.length > 0) {
    console.log(`  MISSING: ${missing.join(', ')}`);
  }

  // 3. Error bucket distribution
  console.log('\n── Error Buckets ──');
  const errorCounts = new Map<string, number>();
  for (const q of questions) {
    errorCounts.set(q.error_bucket, (errorCounts.get(q.error_bucket) ?? 0) + 1);
  }
  const errorTargets: Record<string, number> = {
    severity_miss: 8,
    next_step_error: 8,
    premature_closure: 5,
    confusion_set_miss: 6,
    test_interpretation_miss: 3,
  };
  for (const [bucket, target] of Object.entries(errorTargets)) {
    const actual = errorCounts.get(bucket) ?? 0;
    const status = actual >= target ? 'OK' : `LOW (target: ${target})`;
    console.log(`  ${bucket}: ${actual} ${status}`);
  }

  // 4. Difficulty distribution
  console.log('\n── Difficulty ──');
  const diffCounts = new Map<string, number>();
  for (const q of questions) {
    diffCounts.set(q.difficulty, (diffCounts.get(q.difficulty) ?? 0) + 1);
  }
  const diffTargets: Record<string, string> = { easy: '~8', medium: '~15', hard: '~7' };
  for (const [diff, target] of Object.entries(diffTargets)) {
    console.log(`  ${diff}: ${diffCounts.get(diff) ?? 0} (target: ${target})`);
  }

  // 5. Correct answer distribution (should be roughly even A-E)
  console.log('\n── Answer Distribution ──');
  const answerCounts = new Map<string, number>();
  for (const q of questions) {
    answerCounts.set(q.correct_answer, (answerCounts.get(q.correct_answer) ?? 0) + 1);
  }
  for (const letter of ['A', 'B', 'C', 'D', 'E']) {
    const count = answerCounts.get(letter) ?? 0;
    const pct = ((count / questions.length) * 100).toFixed(0);
    const bar = '█'.repeat(count);
    console.log(`  ${letter}: ${count} (${pct}%) ${bar}`);
  }

  // 6. Confusion set coverage
  console.log('\n── Confusion Set Coverage ──');
  const { data: csSets } = await supabase.from('confusion_sets').select('id, name');
  const csNames = new Map((csSets ?? []).map((cs) => [cs.id, cs.name]));
  const csCoverage = new Map<string, number>();
  for (const q of questions) {
    if (q.confusion_set_id) {
      const name = csNames.get(q.confusion_set_id) ?? q.confusion_set_id;
      csCoverage.set(name, (csCoverage.get(name) ?? 0) + 1);
    }
  }
  const withCs = questions.filter((q) => q.confusion_set_id).length;
  console.log(`  Questions with confusion set: ${withCs}/${questions.length}`);
  for (const [name, count] of [...csCoverage.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`);
  }
  const uncovered = [...csNames.values()].filter((name) => !csCoverage.has(name));
  if (uncovered.length > 0) {
    console.log(`  UNCOVERED: ${uncovered.join(', ')}`);
  }

  console.log('\n=== Audit Complete ===\n');
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
