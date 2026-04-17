/**
 * Kill Rate Diagnostic
 *
 * Queries pipeline_run and validator_report tables to analyze
 * why previous pipeline runs were killed. Outputs a structured
 * diagnosis showing which validators failed, scores, and issues.
 *
 * Usage:
 *   npx tsx scripts/diagnose-kills.ts            # all runs
 *   npx tsx scripts/diagnose-kills.ts --topic=ACS # filter by topic
 *   npx tsx scripts/diagnose-kills.ts --latest=5  # last N runs
 *   npx tsx scripts/diagnose-kills.ts --drafts     # show draft content too
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CLI Args ───

const topicFilter = process.argv.find((a) => a.startsWith('--topic='))?.split('=').slice(1).join('=');
const latestN = parseInt(process.argv.find((a) => a.startsWith('--latest='))?.split('=')[1] ?? '20', 10);
const showDrafts = process.argv.includes('--drafts');

// ─── Main ───

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BLACKSTAR KILL RATE DIAGNOSTIC');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Fetch pipeline runs
  let query = supabase
    .from('pipeline_run')
    .select('id, blueprint_node_id, status, current_agent, error_message, agent_log, validator_summary, total_tokens_used, started_at, completed_at')
    .order('started_at', { ascending: false })
    .limit(latestN);

  const { data: runs, error: runsError } = await query;

  if (runsError) {
    console.error('Failed to fetch pipeline runs:', runsError.message);
    process.exit(1);
  }

  if (!runs || runs.length === 0) {
    console.log('No pipeline runs found.');
    process.exit(0);
  }

  console.log(`Found ${runs.length} pipeline run(s)\n`);

  // 2. For each run, get blueprint node + validator reports + item drafts
  const killReasons: Record<string, number> = {};
  const validatorKillCounts: Record<string, number> = {};
  const validatorScores: Record<string, number[]> = {};
  let totalRuns = 0;
  let totalKilled = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const run of runs) {
    totalRuns++;

    // Get blueprint node
    let topic = 'unknown';
    let shelf = 'unknown';
    if (run.blueprint_node_id) {
      const { data: node } = await supabase
        .from('blueprint_node')
        .select('topic, shelf, subtopic, task_type, clinical_setting')
        .eq('id', run.blueprint_node_id)
        .single();
      if (node) {
        topic = node.topic;
        shelf = node.shelf;
      }
    }

    // Filter by topic if specified
    if (topicFilter && !topic.toLowerCase().includes(topicFilter.toLowerCase())) {
      totalRuns--;
      continue;
    }

    const status = run.status === 'completed'
      ? (run.validator_summary ? 'completed' : 'completed (no validators)')
      : run.status;

    // Determine final outcome from agent_log or validator_summary
    let finalOutcome = run.status;
    if (run.error_message) {
      finalOutcome = 'pipeline_error';
      totalFailed++;
    } else if (run.validator_summary) {
      const allPassed = Object.values(run.validator_summary as Record<string, { passed: boolean }>)
        .filter((v) => typeof v === 'object' && v !== null && 'passed' in v)
        .every((v) => v.passed);
      finalOutcome = allPassed ? 'published' : 'killed';
      if (allPassed) totalPassed++;
      else totalKilled++;
    } else if (run.status === 'failed') {
      totalFailed++;
    } else {
      totalKilled++;
    }

    console.log('───────────────────────────────────────────────────');
    console.log(`RUN: ${run.id}`);
    console.log(`  Topic: ${topic} | Shelf: ${shelf}`);
    console.log(`  Status: ${finalOutcome}`);
    console.log(`  Tokens: ${run.total_tokens_used?.toLocaleString() ?? 'N/A'}`);
    console.log(`  Started: ${run.started_at}`);

    // Show pipeline error if any
    if (run.error_message) {
      console.log(`  ERROR: ${run.error_message}`);

      // Categorize the error
      if (run.error_message.includes('source_insufficient')) {
        killReasons['source_insufficient'] = (killReasons['source_insufficient'] ?? 0) + 1;
      } else if (run.error_message.includes('Skeleton failed')) {
        killReasons['skeleton_validation'] = (killReasons['skeleton_validation'] ?? 0) + 1;
      } else {
        killReasons['pipeline_error'] = (killReasons['pipeline_error'] ?? 0) + 1;
      }
    }

    // Show agent log progression
    if (run.agent_log && Array.isArray(run.agent_log)) {
      console.log(`  Agent progression:`);
      for (const entry of run.agent_log) {
        const e = entry as { agent: string; status: string; error?: string; tokens_used?: number; note?: string; disagreement?: unknown };
        if (e.note?.startsWith('validator_disagreement')) {
          const d = e.disagreement as { validators: { type: string; passed: boolean; score: number | null }[] } | undefined;
          if (d?.validators) {
            const passedVals = d.validators.filter(v => v.passed).map(v => v.type);
            const failedVals = d.validators.filter(v => !v.passed).map(v => `${v.type}(${v.score ?? '?'})`);
            console.log(`    ${e.note}: PASS=[${passedVals.join(',')}] FAIL=[${failedVals.join(',')}]`);
          }
          continue;
        }
        const statusIcon = e.status === 'completed' ? '✓' : e.status === 'failed' ? '✗' : '…';
        const errorNote = e.error ? ` — ${e.error.slice(0, 100)}` : '';
        console.log(`    ${statusIcon} ${e.agent} (${e.tokens_used ?? 0} tokens)${errorNote}`);
      }
    }

    // Show validator summary
    if (run.validator_summary) {
      console.log(`  Validator summary:`);
      const summary = run.validator_summary as Record<string, { score?: number | null; passed?: boolean }>;
      for (const [validatorType, report] of Object.entries(summary)) {
        if (validatorType === 'jury') continue;
        if (!report || typeof report !== 'object' || !('passed' in report)) continue;
        const icon = report.passed ? '✓' : '✗';
        const score = report.score != null ? ` (${report.score}/10)` : '';
        console.log(`    ${icon} ${validatorType}${score}`);

        // Track aggregate stats
        if (!report.passed) {
          validatorKillCounts[validatorType] = (validatorKillCounts[validatorType] ?? 0) + 1;
        }
        if (report.score != null) {
          if (!validatorScores[validatorType]) validatorScores[validatorType] = [];
          validatorScores[validatorType].push(report.score);
        }
      }
    }

    // Get validator reports with full details
    if (run.blueprint_node_id) {
      const { data: drafts } = await supabase
        .from('item_draft')
        .select('id, status, vignette, stem, correct_answer, choice_a, choice_b, choice_c, choice_d, choice_e, repair_count, review_status')
        .eq('pipeline_run_id', run.id);

      if (drafts && drafts.length > 0) {
        for (const draft of drafts) {
          console.log(`  Draft ${draft.id.slice(0, 8)}… status=${draft.status} repairs=${draft.repair_count ?? 0}`);

          if (showDrafts) {
            console.log(`    Stem: ${draft.stem?.slice(0, 120) ?? 'N/A'}…`);
            console.log(`    Correct: ${draft.correct_answer}`);
            if (draft.choice_a) console.log(`    A: ${draft.choice_a.slice(0, 80)}`);
            if (draft.choice_b) console.log(`    B: ${draft.choice_b.slice(0, 80)}`);
            if (draft.choice_c) console.log(`    C: ${draft.choice_c.slice(0, 80)}`);
            if (draft.choice_d) console.log(`    D: ${draft.choice_d.slice(0, 80)}`);
            if (draft.choice_e) console.log(`    E: ${draft.choice_e.slice(0, 80)}`);
          }

          // Get all validator reports for this draft
          const { data: reports } = await supabase
            .from('validator_report')
            .select('validator_type, passed, score, issues_found, repair_instructions, consistency_score, created_at')
            .eq('item_draft_id', draft.id)
            .order('created_at', { ascending: true });

          if (reports && reports.length > 0) {
            console.log(`    Validator reports (${reports.length}):`);
            for (const report of reports) {
              const icon = report.passed ? '✓' : '✗';
              console.log(`      ${icon} ${report.validator_type}: score=${report.score}/10`);
              if (report.issues_found && Array.isArray(report.issues_found) && report.issues_found.length > 0) {
                for (const issue of report.issues_found) {
                  console.log(`        ISSUE: ${issue}`);
                  // Track kill reasons
                  const key = `${report.validator_type}: ${issue.slice(0, 80)}`;
                  killReasons[key] = (killReasons[key] ?? 0) + 1;
                }
              }
              if (report.repair_instructions) {
                console.log(`        REPAIR: ${report.repair_instructions.slice(0, 150)}`);
              }
              if (report.consistency_score != null && report.consistency_score > 0) {
                console.log(`        CONSISTENCY: ${report.consistency_score} (>0.5 = high uncertainty)`);
              }
            }
          }
        }
      }
    }
    console.log('');
  }

  // ─── Aggregate Summary ───
  console.log('═══════════════════════════════════════════════════');
  console.log('  AGGREGATE SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`Total runs: ${totalRuns}`);
  console.log(`  Published: ${totalPassed} (${Math.round(totalPassed / totalRuns * 100)}%)`);
  console.log(`  Killed by validators: ${totalKilled} (${Math.round(totalKilled / totalRuns * 100)}%)`);
  console.log(`  Pipeline errors: ${totalFailed} (${Math.round(totalFailed / totalRuns * 100)}%)`);
  console.log(`  Kill rate: ${Math.round((totalKilled + totalFailed) / totalRuns * 100)}%\n`);

  // Validator kill frequency
  if (Object.keys(validatorKillCounts).length > 0) {
    console.log('Validator kill frequency:');
    const sorted = Object.entries(validatorKillCounts).sort((a, b) => b[1] - a[1]);
    for (const [validator, count] of sorted) {
      const avgScore = validatorScores[validator]
        ? (validatorScores[validator].reduce((a, b) => a + b, 0) / validatorScores[validator].length).toFixed(1)
        : 'N/A';
      console.log(`  ${validator}: ${count} kills (avg score: ${avgScore}/10)`);
    }
    console.log('');
  }

  // Top kill reasons
  if (Object.keys(killReasons).length > 0) {
    console.log('Top kill reasons:');
    const sorted = Object.entries(killReasons).sort((a, b) => b[1] - a[1]);
    for (const [reason, count] of sorted.slice(0, 15)) {
      console.log(`  [${count}x] ${reason}`);
    }
    console.log('');
  }

  // Average scores by validator
  if (Object.keys(validatorScores).length > 0) {
    console.log('Average scores by validator:');
    for (const [validator, scores] of Object.entries(validatorScores)) {
      const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      console.log(`  ${validator}: avg=${avg} min=${min} max=${max} (n=${scores.length})`);
    }
    console.log('');
  }

  // Check for missing tables
  console.log('─── Data Health Check ───');
  const { data: confSets, error: confErr } = await supabase.from('confusion_sets').select('id').limit(1);
  if (confErr) {
    console.log('⚠ confusion_sets table: MISSING or inaccessible');
    console.log('  → Case planner cannot link to confusion sets');
    console.log('  → Contrast loop in learner engine will never fire');
  } else {
    console.log(`✓ confusion_sets table: exists (${confSets?.length ?? 0} rows checked)`);
  }

  const { data: trRules, error: trErr } = await supabase.from('transfer_rules').select('id').limit(1);
  if (trErr) {
    console.log('⚠ transfer_rules table: MISSING or inaccessible');
    console.log('  → Case planner cannot link to transfer rules');
    console.log('  → Transfer rule-based routing will never fire');
  } else {
    console.log(`✓ transfer_rules table: exists (${trRules?.length ?? 0} rows checked)`);
  }

  // Check published questions
  const { count: publishedCount } = await supabase
    .from('item_draft')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  console.log(`\nPublished questions: ${publishedCount ?? 0}`);

  const { count: totalDrafts } = await supabase
    .from('item_draft')
    .select('id', { count: 'exact', head: true });
  console.log(`Total drafts: ${totalDrafts ?? 0}`);

  const { count: killedDrafts } = await supabase
    .from('item_draft')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'killed');
  console.log(`Killed drafts: ${killedDrafts ?? 0}`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  DIAGNOSTIC COMPLETE');
  console.log('═══════════════════════════════════════════════════');
}

main().catch(console.error);
