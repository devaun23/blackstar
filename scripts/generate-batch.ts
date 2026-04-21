/**
 * Batch Question Generator (Pipeline-Based)
 *
 * Fires N concurrent pipeline v2 runs, tracks progress, stops when target reached.
 * Uses the full validator gauntlet — every published question passes all quality gates.
 *
 * Usage:
 *   npx tsx scripts/generate-batch.ts --target=50 --concurrency=5
 *   npx tsx scripts/generate-batch.ts --target=10 --concurrency=3 --shelf=medicine
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Environment ───
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

// Dynamic import after env is loaded
async function main() {
  const { runPipelineV2 } = await import('../src/lib/factory/pipeline-v2');
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ─── CLI Args ───
  const targetArg = process.argv.find((a) => a.startsWith('--target='));
  const concurrencyArg = process.argv.find((a) => a.startsWith('--concurrency='));
  const shelfArg = process.argv.find((a) => a.startsWith('--shelf='));
  const maxAttemptsArg = process.argv.find((a) => a.startsWith('--max-attempts='));

  const TARGET = parseInt(targetArg?.split('=')[1] ?? '50', 10);
  const CONCURRENCY = parseInt(concurrencyArg?.split('=')[1] ?? '5', 10);
  const SHELF = shelfArg?.split('=')[1] ?? 'medicine';
  const MAX_ATTEMPTS = parseInt(maxAttemptsArg?.split('=')[1] ?? '500', 10);

  // ─── State ───
  let attempts = 0;
  let published = 0;
  let killed = 0;
  let errors = 0;
  let totalTokens = 0;
  let creditsDepleted = false;
  const topicCounts: Record<string, number> = {};
  const startTime = Date.now();

  const progressFile = `/tmp/blackstar-batch-${Date.now()}.json`;

  function saveProgress() {
    const elapsed = Date.now() - startTime;
    fs.writeFileSync(progressFile, JSON.stringify({
      attempts, published, killed, errors, totalTokens,
      topicCounts,
      elapsedMs: elapsed,
      publishRate: attempts > 0 ? `${(published / attempts * 100).toFixed(1)}%` : '0%',
      tokensPerPublish: published > 0 ? Math.round(totalTokens / published) : 0,
    }, null, 2));
  }

  function printProgress() {
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const rate = attempts > 0 ? (published / attempts * 100).toFixed(1) : '0';
    const topicSummary = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t, c]) => `${t}:${c}`)
      .join(' ');
    console.log(
      `[${attempts}/${MAX_ATTEMPTS}] ${published}/${TARGET} published (${rate}%) | ` +
      `killed=${killed} err=${errors} | ` +
      `${(totalTokens / 1000).toFixed(0)}K tok | ` +
      `${elapsed} min | ${topicSummary}`
    );
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  BLACKSTAR BATCH GENERATOR');
  console.log(`  Target: ${TARGET} published | Concurrency: ${CONCURRENCY} | Shelf: ${SHELF}`);
  console.log(`  Max attempts: ${MAX_ATTEMPTS}`);
  console.log(`  Progress: ${progressFile}`);
  console.log('═══════════════════════════════════════════════════\n');

  async function runOne(): Promise<void> {
    if (published >= TARGET || creditsDepleted || attempts >= MAX_ATTEMPTS) return;

    attempts++;
    try {
      const result = await runPipelineV2({ shelf: SHELF });
      totalTokens += result.totalTokens;

      if (result.finalStatus === 'published') {
        published++;
        // Get the topic
        if (result.runId) {
          const { data: run } = await supabase
            .from('pipeline_run')
            .select('blueprint_node_id')
            .eq('id', result.runId)
            .single();
          if (run?.blueprint_node_id) {
            const { data: node } = await supabase
              .from('blueprint_node')
              .select('topic')
              .eq('id', run.blueprint_node_id)
              .single();
            if (node) {
              topicCounts[node.topic] = (topicCounts[node.topic] ?? 0) + 1;
            }
          }
        }
        console.log(`  ✓ PUBLISHED #${published} — ${result.totalTokens.toLocaleString()} tokens`);
      } else {
        killed++;
      }
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('credit balance')) {
        console.error('\n  ✗ API CREDITS EXHAUSTED. Stopping.\n');
        creditsDepleted = true;
        return;
      }
    }

    if (attempts % 5 === 0) {
      printProgress();
      saveProgress();
    }
  }

  // ─── Concurrency Pool ───
  const pool: Promise<void>[] = [];

  while (published < TARGET && !creditsDepleted && attempts < MAX_ATTEMPTS) {
    while (pool.length < CONCURRENCY && published < TARGET && !creditsDepleted && attempts < MAX_ATTEMPTS) {
      const p = runOne().then(() => {
        pool.splice(pool.indexOf(p), 1);
      });
      pool.push(p);
    }

    if (pool.length > 0) {
      await Promise.race(pool);
    }
  }

  await Promise.all(pool);

  // ─── Summary ───
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  BATCH COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Published: ${published}/${TARGET}`);
  console.log(`  Attempts: ${attempts} (max ${MAX_ATTEMPTS})`);
  console.log(`  Killed: ${killed} | Errors: ${errors}`);
  console.log(`  Publish rate: ${attempts > 0 ? (published / attempts * 100).toFixed(1) : 0}%`);
  console.log(`  Tokens: ${(totalTokens / 1_000_000).toFixed(1)}M total | ${published > 0 ? (totalTokens / published / 1000).toFixed(0) : '?'}K per publish`);
  console.log(`  Time: ${elapsed} min`);
  console.log(`  Topics:`);
  for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${topic}: ${count}`);
  }
  saveProgress();
}

main().catch((err) => {
  console.error('Batch failed:', err);
  process.exit(1);
});
