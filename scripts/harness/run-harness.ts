#!/usr/bin/env npx tsx
/**
 * Question Iteration Harness — batch generate, score, classify, report.
 *
 * Usage:
 *   npx tsx --env-file .env.local scripts/harness/run-harness.ts --count 10 --tag "v2.1-test"
 *   npx tsx --env-file .env.local scripts/harness/run-harness.ts --count 5 --shelf medicine --tier tier_1
 *   npx tsx --env-file .env.local scripts/harness/run-harness.ts --count 10 --compare "2026-03-26T10-30_v2.0"
 *   npx tsx --env-file .env.local scripts/harness/run-harness.ts --list-runs
 *
 * Requires a running dev server: npx next dev
 */

import * as fs from 'fs';
import * as path from 'path';
import type { HarnessConfig, HarnessRunMeta, HarnessItemResult, FailureCode } from './types';
import { estimateCostUsd, FAILURE_CODES } from './types';
import { runBatch } from './harness-orchestrator';
import { generateReport, generateComparison } from './report-generator';
import { snapshotPromptVersions, loadRunMeta, loadRunItems, listRuns } from './version-tracker';
import type { Shelf, YieldTier } from '../../src/lib/types/database';

// ─── CLI Arg Parsing ────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

// ─── Handle --list-runs ─────────────────────────────────────────

if (hasFlag('list-runs')) {
  const runs = listRuns();
  if (runs.length === 0) {
    console.log('No harness runs found in harness-runs/');
  } else {
    console.log(`Found ${runs.length} run(s):\n`);
    for (const runId of runs) {
      const meta = loadRunMeta(runId);
      if (meta) {
        const passRate = meta.total_items > 0 ? (meta.passed_count / meta.total_items * 100).toFixed(0) : '0';
        console.log(`  ${runId}  —  ${meta.total_items} items, ${passRate}% pass, $${meta.estimated_cost_usd.toFixed(2)}`);
      } else {
        console.log(`  ${runId}  —  (metadata missing)`);
      }
    }
  }
  process.exit(0);
}

// ─── Parse Config ───────────────────────────────────────────────

const count = parseInt(getArg('count') ?? '5', 10);
const concurrency = parseInt(getArg('concurrency') ?? '3', 10);
const tag = getArg('tag') ?? 'run';
const shelf = getArg('shelf') as Shelf | undefined;
const yieldTier = getArg('tier') as YieldTier | undefined;
const blueprintNodeId = getArg('node-id');
const compareRunId = getArg('compare');
const skipExplanation = hasFlag('skip-explain');
const maxRepairs = parseInt(getArg('max-repairs') ?? '3', 10);

if (hasFlag('help')) {
  console.log(`
Question Iteration Harness

Usage:
  npx tsx --env-file .env.local scripts/harness/run-harness.ts [options]

Options:
  --count N          Number of items to generate (default: 5)
  --concurrency N    Parallel pipeline runs (default: 3)
  --tag STRING       Label for this run (default: "run")
  --shelf SHELF      Filter blueprint selection by shelf
  --tier TIER        Filter by yield tier (tier_1, tier_2, tier_3)
  --node-id UUID     Force a specific blueprint node
  --compare RUN_ID   Generate comparison against a previous run
  --skip-explain     Skip explanation writing (faster iteration)
  --max-repairs N    Override max repair cycles (default: 3)
  --list-runs        List all previous harness runs
  --help             Show this help

Requires a running dev server: npx next dev
`);
  process.exit(0);
}

const config: HarnessConfig = {
  count,
  concurrency,
  tag,
  shelf,
  yieldTier,
  blueprintNodeId,
  compareRunId,
  skipExplanation,
  maxRepairs,
};

// ─── Run ID ─────────────────────────────────────────────────────

const now = new Date();
const timestamp = now.toISOString().slice(0, 16).replace(/:/g, '-');
const runId = `${timestamp}_${tag}`;
const runDir = path.resolve(process.cwd(), 'harness-runs', runId);

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  Question Iteration Harness                      ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
  console.log(`  Run ID:       ${runId}`);
  console.log(`  Items:        ${count}`);
  console.log(`  Concurrency:  ${concurrency}`);
  console.log(`  Shelf:        ${shelf ?? 'any'}`);
  console.log(`  Tier:         ${yieldTier ?? 'any'}`);
  console.log(`  Skip explain: ${skipExplanation}`);
  if (compareRunId) console.log(`  Compare with: ${compareRunId}`);
  console.log('');

  // Create output directory
  fs.mkdirSync(runDir, { recursive: true });

  // Snapshot prompt versions
  console.log('Snapshotting prompt versions...');
  const promptVersions = await snapshotPromptVersions();
  console.log(`  Captured ${promptVersions.length} active prompts\n`);

  // Set up JSONL streaming
  const itemsPath = path.join(runDir, 'items.jsonl');
  const itemsStream = fs.createWriteStream(itemsPath, { flags: 'a' });

  const startedAt = new Date().toISOString();

  // Run the batch
  console.log(`Starting ${count} pipeline runs (concurrency: ${concurrency})...\n`);
  const results = await runBatch(config, (item) => {
    itemsStream.write(JSON.stringify(item) + '\n');
  });

  itemsStream.end();
  const completedAt = new Date().toISOString();

  // Build metadata
  const passedCount = results.filter((r) => r.status === 'published').length;
  const killedCount = results.filter((r) => r.status === 'killed').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const totalTokens = results.reduce((sum, r) => sum + r.total_tokens, 0);

  // Compute failure distribution
  const failureDist: Partial<Record<FailureCode, number>> = {};
  for (const item of results) {
    for (const f of item.classified_failures) {
      failureDist[f.code] = (failureDist[f.code] ?? 0) + 1;
    }
  }

  const meta: HarnessRunMeta = {
    run_id: runId,
    tag,
    started_at: startedAt,
    completed_at: completedAt,
    config,
    prompt_versions: promptVersions,
    total_items: results.length,
    passed_count: passedCount,
    killed_count: killedCount,
    error_count: errorCount,
    total_tokens: totalTokens,
    estimated_cost_usd: estimateCostUsd(totalTokens),
    failure_distribution: failureDist,
  };

  // Write meta.json
  fs.writeFileSync(
    path.join(runDir, 'meta.json'),
    JSON.stringify(meta, null, 2)
  );

  // Generate report
  let reportContent = generateReport(meta, results);

  // Comparison (if requested)
  if (compareRunId) {
    const baselineMeta = loadRunMeta(compareRunId);
    const baselineItems = loadRunItems(compareRunId);
    if (baselineMeta && baselineItems.length > 0) {
      reportContent += '\n---\n\n';
      reportContent += generateComparison(meta, baselineMeta, results, baselineItems);
    } else {
      reportContent += `\n---\n\n## Comparison\nBaseline run "${compareRunId}" not found or empty.\n`;
    }
  }

  // Write report
  fs.writeFileSync(path.join(runDir, 'report.md'), reportContent);

  // Console summary
  const passRate = results.length > 0 ? (passedCount / results.length * 100).toFixed(0) : '0';
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  Run Complete                                     ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
  console.log(`  Pass rate:  ${passedCount}/${results.length} (${passRate}%)`);
  console.log(`  Killed:     ${killedCount}`);
  console.log(`  Errors:     ${errorCount}`);
  console.log(`  Tokens:     ${totalTokens.toLocaleString()}`);
  console.log(`  Cost:       $${meta.estimated_cost_usd.toFixed(2)}`);
  console.log('');

  // Top failure codes
  const topFailures = Object.entries(failureDist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (topFailures.length > 0) {
    console.log('  Top failures:');
    for (const [code, count] of topFailures) {
      const info = FAILURE_CODES[code as FailureCode];
      console.log(`    ${code} (${info?.name}): ${count}`);
    }
    console.log('');
  }

  console.log(`  Report:     ${path.join(runDir, 'report.md')}`);
  console.log(`  Items:      ${itemsPath}`);
  console.log(`  Metadata:   ${path.join(runDir, 'meta.json')}`);
  console.log('');
}

main().catch((err) => {
  console.error('Harness failed:', err);
  process.exit(1);
});
