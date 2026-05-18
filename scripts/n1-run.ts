/**
 * n=1 experiment runner — Phase A of
 * ~/.claude/plans/is-this-solvable-toasty-lerdorf.md.
 *
 * Forces a single pipeline run against a known Pulmonary Embolism blueprint
 * node, with the di-loader override active so vignette-writer receives the
 * Tier-A ESC 2019 passages from pilot/n1-experiment/refs.md.
 *
 * Usage (override flag must be set):
 *   BLACKSTAR_N1_OVERRIDE=1 npx tsx scripts/n1-run.ts
 *
 * Optional flags:
 *   --topic="Pulmonary Embolism"        (default; any value matched against blueprint_node.topic)
 *   --node-id="<uuid>"                  (explicit blueprint_node id; overrides --topic)
 *   --difficulty=easy|fork|hard         (passed as difficultyClassHint; default fork)
 *
 * Not committed to the seed corpus or wired into batch generation. Delete this
 * file after Phase A wraps and Phase B replaces the manual flow.
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

async function main() {
  if (process.env.BLACKSTAR_N1_OVERRIDE !== '1') {
    console.error('  ✗ Set BLACKSTAR_N1_OVERRIDE=1 before running. The override');
    console.error('    activates the di-loader fallback that injects pilot/n1-experiment/refs.md.');
    process.exit(1);
  }

  const argTopic = process.argv.find((a) => a.startsWith('--topic='))?.split('=')[1];
  const argNodeId = process.argv.find((a) => a.startsWith('--node-id='))?.split('=')[1];
  const argDifficulty = process.argv.find((a) => a.startsWith('--difficulty='))?.split('=')[1];

  const topic = argTopic ?? 'Pulmonary Embolism';
  const difficultyAliases: Record<string, 'easy_recognition' | 'decision_fork' | 'hard_discrimination'> = {
    easy: 'easy_recognition',
    easy_recognition: 'easy_recognition',
    fork: 'decision_fork',
    decision_fork: 'decision_fork',
    hard: 'hard_discrimination',
    hard_discrimination: 'hard_discrimination',
  };
  const difficultyClassHint = difficultyAliases[argDifficulty ?? 'fork'] ?? 'decision_fork';

  const { runPipelineV2 } = await import('../src/lib/factory/pipeline-v2');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Resolve blueprint node
  let blueprintNodeId = argNodeId;
  if (!blueprintNodeId) {
    const { data, error } = await supabase
      .from('blueprint_node')
      .select('id, topic, system, shelf')
      .eq('topic', topic)
      .limit(1)
      .single();
    if (error || !data) {
      console.error(`  ✗ No blueprint_node found for topic="${topic}" — ${error?.message ?? 'no rows'}`);
      console.error('    Pass an explicit --node-id=<uuid>, or pick a different --topic.');
      process.exit(1);
    }
    blueprintNodeId = data.id;
    console.log(`  Resolved blueprint_node: ${data.id}`);
    console.log(`    topic=${data.topic}  system=${data.system}  shelf=${data.shelf}`);
  } else {
    console.log(`  Using explicit blueprint_node: ${blueprintNodeId}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  N=1 EXPERIMENT RUN (Phase A)');
  console.log(`  Override:           BLACKSTAR_N1_OVERRIDE=1 (di-loader returns refs.md)`);
  console.log(`  Difficulty hint:    ${difficultyClassHint}`);
  console.log(`  Topic:              ${topic}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const t0 = Date.now();
  const result = await runPipelineV2({
    blueprintNodeId,
    shelf: 'medicine',
    difficultyClassHint,
  });
  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  RESULT');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  runId:         ${result.runId}`);
  console.log(`  finalStatus:   ${result.finalStatus}`);
  console.log(`  status:        ${result.status}`);
  console.log(`  itemDraftId:   ${result.itemDraftId ?? '(none)'}`);
  console.log(`  totalTokens:   ${result.totalTokens.toLocaleString()}`);
  console.log(`  elapsed:       ${elapsedSec}s`);
  console.log('');
  console.log('  Next: open the draft in the DB or run the audit script,');
  console.log('  then record findings in pilot/n1-experiment/RESULT.md.');
  console.log('');
}

main().catch((err) => {
  console.error('  ✗ Fatal:', err);
  process.exit(1);
});
