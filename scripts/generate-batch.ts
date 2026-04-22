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
  const maxTokensArg = process.argv.find((a) => a.startsWith('--max-tokens='));
  const difficultyMixArg = process.argv.find((a) => a.startsWith('--difficulty-mix='));

  const TARGET = parseInt(targetArg?.split('=')[1] ?? '50', 10);
  const CONCURRENCY = parseInt(concurrencyArg?.split('=')[1] ?? '5', 10);
  const SHELF = shelfArg?.split('=')[1] ?? 'medicine';
  const MAX_ATTEMPTS = parseInt(maxAttemptsArg?.split('=')[1] ?? '500', 10);
  // Hard token ceiling — prevents a broken pipeline from burning through credits.
  // Default 500K ≈ ~$2.50 at Sonnet pricing. Override with --max-tokens=N.
  const MAX_TOKENS = parseInt(maxTokensArg?.split('=')[1] ?? '500000', 10);

  // ─── Difficulty Mix (Rule 2) ───
  // Parses --difficulty-mix=easy:30,fork:60,hard:10 into absolute targets per class.
  // Default mix mirrors ELITE_TUTOR_PRINCIPLES.md: 30% easy / 60% fork / 10% hard.
  type DifficultyClass = 'easy_recognition' | 'decision_fork' | 'hard_discrimination';
  const difficultyTargets: Record<DifficultyClass, number> = {
    easy_recognition: Math.round(TARGET * 0.3),
    decision_fork: Math.round(TARGET * 0.6),
    hard_discrimination: TARGET - Math.round(TARGET * 0.3) - Math.round(TARGET * 0.6),
  };
  if (difficultyMixArg) {
    const spec = difficultyMixArg.split('=')[1] ?? '';
    const aliases: Record<string, DifficultyClass> = {
      easy: 'easy_recognition',
      easy_recognition: 'easy_recognition',
      fork: 'decision_fork',
      decision_fork: 'decision_fork',
      hard: 'hard_discrimination',
      hard_discrimination: 'hard_discrimination',
    };
    const parsed: Partial<Record<DifficultyClass, number>> = {};
    let pctTotal = 0;
    for (const token of spec.split(',')) {
      const [rawKey, rawVal] = token.split(':');
      const key = aliases[(rawKey ?? '').trim()];
      const pct = parseInt(rawVal ?? '0', 10);
      if (!key || isNaN(pct)) continue;
      parsed[key] = pct;
      pctTotal += pct;
    }
    if (pctTotal === 100) {
      difficultyTargets.easy_recognition = Math.round(TARGET * (parsed.easy_recognition ?? 0) / 100);
      difficultyTargets.decision_fork = Math.round(TARGET * (parsed.decision_fork ?? 0) / 100);
      difficultyTargets.hard_discrimination =
        TARGET - difficultyTargets.easy_recognition - difficultyTargets.decision_fork;
    } else {
      console.warn(`[warn] --difficulty-mix percentages sum to ${pctTotal}, expected 100. Using default 30/60/10.`);
    }
  }
  const difficultyCounts: Record<DifficultyClass, number> = {
    easy_recognition: 0,
    decision_fork: 0,
    hard_discrimination: 0,
  };

  // Pick the class most below quota at each run dispatch.
  function pickDifficultyClass(): DifficultyClass {
    let best: DifficultyClass = 'decision_fork';
    let bestGap = -Infinity;
    for (const key of Object.keys(difficultyTargets) as DifficultyClass[]) {
      const gap = difficultyTargets[key] - difficultyCounts[key];
      if (gap > bestGap) {
        bestGap = gap;
        best = key;
      }
    }
    return best;
  }

  // ─── State ───
  let attempts = 0;
  let published = 0;
  let killed = 0;
  let errors = 0;
  let totalTokens = 0;
  let creditsDepleted = false;
  let tokenCeilingHit = false;
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
  console.log(`  Max tokens:   ${MAX_TOKENS.toLocaleString()} (hard cap — kills batch if exceeded)`);
  console.log(`  Difficulty mix: easy=${difficultyTargets.easy_recognition} fork=${difficultyTargets.decision_fork} hard=${difficultyTargets.hard_discrimination}`);
  console.log(`  Progress: ${progressFile}`);
  console.log('═══════════════════════════════════════════════════\n');

  async function runOne(): Promise<void> {
    if (published >= TARGET || creditsDepleted || tokenCeilingHit || attempts >= MAX_ATTEMPTS) return;

    attempts++;
    const difficultyClassHint = pickDifficultyClass();
    try {
      const result = await runPipelineV2({ shelf: SHELF, difficultyClassHint });
      totalTokens += result.totalTokens;

      if (totalTokens >= MAX_TOKENS) {
        console.error(
          `\n  ✗ TOKEN CEILING HIT: ${totalTokens.toLocaleString()} ≥ ${MAX_TOKENS.toLocaleString()}. Stopping batch.\n`
        );
        tokenCeilingHit = true;
        saveProgress();
        return;
      }

      if (result.finalStatus === 'published') {
        published++;
        difficultyCounts[difficultyClassHint]++;
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
        console.log(`  ✓ PUBLISHED #${published} [${difficultyClassHint}] — ${result.totalTokens.toLocaleString()} tokens`);
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
      // Log first 5 unique errors to diagnose, then suppress repeats
      if (errors <= 5) {
        console.error(`  ✗ Error #${errors}: ${msg.slice(0, 150)}`);
      }
    }

    if (attempts % 5 === 0) {
      printProgress();
      saveProgress();
    }
  }

  // ─── Concurrency Pool ───
  const pool: Promise<void>[] = [];

  while (published < TARGET && !creditsDepleted && !tokenCeilingHit && attempts < MAX_ATTEMPTS) {
    while (pool.length < CONCURRENCY && published < TARGET && !creditsDepleted && !tokenCeilingHit && attempts < MAX_ATTEMPTS) {
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
  if (tokenCeilingHit) {
    console.log(`  ⚠ STOPPED EARLY: token ceiling (${MAX_TOKENS.toLocaleString()}) exceeded`);
  }
  console.log(`  Publish rate: ${attempts > 0 ? (published / attempts * 100).toFixed(1) : 0}%`);
  console.log(`  Tokens: ${(totalTokens / 1_000_000).toFixed(1)}M total | ${published > 0 ? (totalTokens / published / 1000).toFixed(0) : '?'}K per publish`);
  console.log(`  Time: ${elapsed} min`);
  console.log(`  Difficulty mix:`);
  for (const key of Object.keys(difficultyTargets) as DifficultyClass[]) {
    console.log(`    ${key}: ${difficultyCounts[key]}/${difficultyTargets[key]}`);
  }
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
