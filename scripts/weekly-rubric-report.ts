/**
 * Weekly Master Rubric report — Evaluator MVP Gap #3.
 *
 * Reads `rubric_score` (master_v1) rows joined with `item_draft` and prints
 * four stdout blocks that reproduce the user-facing deliverable of the
 * 3-role loop vision: summary, weakest domains, failure clusters, review
 * queue head.
 *
 * Pure read-only. Idempotent. Works with small N and "no items in window".
 *
 * Usage:
 *   npx tsx scripts/weekly-rubric-report.ts
 *   npx tsx scripts/weekly-rubric-report.ts --since=2026-04-15
 *
 * See MEASUREMENT_SCIENCE_ROADMAP.md §4 for why this belongs at the Evaluator
 * stage, and docs/ARCHITECTURE_AUDIT_KT_LLM_PAPER_2026-04-22.md for how the
 * 3-role loop's Evaluator role maps onto Blackstar infra.
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

import type { MasterDomainScores, MasterRubricScore, PublishDecision, HardGateReason } from '../src/lib/factory/schemas/master-rubric';

// Keep in sync with masterDomainScoresSchema maxes.
const DOMAIN_MAX: Record<keyof MasterDomainScores, number> = {
  medical_correctness_scope: 15,
  blueprint_alignment: 8,
  nbme_stem_fidelity: 12,
  hinge_design_ambiguity: 10,
  option_set_quality_symmetry: 12,
  key_integrity: 5,
  explanation_quality: 15,
  learner_modeling_value: 8,
  adaptive_sequencing_utility: 5,
  production_readiness: 10,
};
const DOMAIN_KEYS = Object.keys(DOMAIN_MAX) as Array<keyof MasterDomainScores>;

interface Row {
  id: string;
  item_draft_id: string;
  hard_gate_pass: boolean;
  total_score: number;
  publish_decision: PublishDecision;
  score_object: MasterRubricScore | null;
  created_at: string;
}

function weakestDomain(scores: MasterDomainScores): keyof MasterDomainScores {
  let worst: keyof MasterDomainScores = DOMAIN_KEYS[0];
  let worstRatio = Infinity;
  for (const k of DOMAIN_KEYS) {
    const r = scores[k] / DOMAIN_MAX[k];
    if (r < worstRatio) { worstRatio = r; worst = k; }
  }
  return worst;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function parseSince(): Date {
  const arg = process.argv.find((a) => a.startsWith('--since='));
  if (arg) {
    const d = new Date(arg.slice('--since='.length));
    if (!Number.isNaN(d.getTime())) return d;
    console.error(`invalid --since value: ${arg}`);
    process.exit(1);
  }
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

async function main(): Promise<void> {
  const since = parseSince();
  const priorStart = new Date(since);
  priorStart.setDate(priorStart.getDate() - 7);

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: rows, error } = await supabase
    .from('rubric_score')
    .select('id, item_draft_id, hard_gate_pass, total_score, publish_decision, score_object, created_at')
    .eq('rubric_version', 'master_v1')
    .gte('created_at', priorStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('rubric_score query failed:', error.message);
    process.exit(1);
  }

  const all = (rows ?? []) as Row[];
  const currentRows = all.filter((r) => new Date(r.created_at) >= since);
  const priorRows = all.filter((r) => new Date(r.created_at) < since);

  const windowLabel = `${since.toISOString().slice(0, 10)} → ${new Date().toISOString().slice(0, 10)}`;
  console.log(`\n═══ Weekly Rubric Report ─ window: ${windowLabel} ═══\n`);

  // ─── Block 1: Summary ──────────────────────────────────────────────────
  if (currentRows.length === 0) {
    console.log('(no items evaluated in window)\n');
    return;
  }

  const decisionCounts: Record<PublishDecision, number> = {
    publish: 0, revise: 0, major_revision: 0, reject: 0,
  };
  for (const r of currentRows) decisionCounts[r.publish_decision]++;
  const gatePassCount = currentRows.filter((r) => r.hard_gate_pass).length;
  const meanTotal = mean(currentRows.map((r) => r.total_score));

  console.log('── 1. Summary ─────────────────────────────────────────────');
  console.log(`  items evaluated        : ${currentRows.length}`);
  console.log(`  hard-gate pass rate    : ${((gatePassCount / currentRows.length) * 100).toFixed(1)}%  (${gatePassCount}/${currentRows.length})`);
  console.log(`  mean total_score       : ${meanTotal.toFixed(1)}/100`);
  console.log(`  publish_decision       : publish=${decisionCounts.publish}  revise=${decisionCounts.revise}  major_revision=${decisionCounts.major_revision}  reject=${decisionCounts.reject}`);
  console.log();

  // ─── Block 2: Weakest domains ─────────────────────────────────────────
  // Compute mean(score/max) per domain and compare to prior-7-day window.
  const currentWithScores = currentRows.filter((r) => r.score_object?.scores);
  const priorWithScores = priorRows.filter((r) => r.score_object?.scores);

  function domainRatios(rs: Row[], k: keyof MasterDomainScores): number[] {
    return rs.map((r) => (r.score_object!.scores[k] / DOMAIN_MAX[k]));
  }

  const rankings = DOMAIN_KEYS.map((k) => {
    const cur = mean(domainRatios(currentWithScores, k));
    const prior = priorWithScores.length > 0 ? mean(domainRatios(priorWithScores, k)) : null;
    return { key: k, cur, prior, delta: prior !== null ? cur - prior : null };
  }).sort((a, b) => a.cur - b.cur);

  console.log('── 2. Weakest domains (mean score ÷ max) ─────────────────');
  for (const r of rankings) {
    const pct = (r.cur * 100).toFixed(0).padStart(3);
    const flag = r.delta !== null && r.delta < -0.05 ? ' ↓ dropped vs prior' : '';
    const deltaStr = r.delta !== null ? `  Δ=${(r.delta * 100 >= 0 ? '+' : '')}${(r.delta * 100).toFixed(1)}%` : '  (no prior data)';
    console.log(`  ${r.key.padEnd(30)} ${pct}%${deltaStr}${flag}`);
  }
  console.log();

  // ─── Block 3: Failure clusters (hard_gate_fail_reasons) ───────────────
  const reasonCounts = new Map<HardGateReason, { count: number; examples: string[] }>();
  for (const r of currentRows) {
    const reasons = r.score_object?.hard_gate_fail_reasons ?? [];
    for (const reason of reasons) {
      const entry = reasonCounts.get(reason) ?? { count: 0, examples: [] };
      entry.count++;
      if (entry.examples.length < 3) entry.examples.push(r.item_draft_id);
      reasonCounts.set(reason, entry);
    }
  }

  console.log('── 3. Failure clusters (hard-gate reasons) ───────────────');
  if (reasonCounts.size === 0) {
    console.log('  (no hard-gate failures in window)');
  } else {
    const sorted = [...reasonCounts.entries()].sort((a, b) => b[1].count - a[1].count);
    for (const [reason, { count, examples }] of sorted) {
      console.log(`  ${reason.padEnd(38)} ${count}x   eg: ${examples.map((e) => e.slice(0, 8)).join(', ')}`);
    }
  }
  console.log();

  // ─── Block 4: Review queue head (lowest-scoring pending items) ────────
  const { data: pending } = await supabase
    .from('item_draft')
    .select('id, status, review_status')
    .eq('review_status', 'pending_review');
  const pendingIds = new Set((pending ?? []).map((d) => d.id));

  const headItems = currentRows
    .filter((r) => pendingIds.has(r.item_draft_id))
    .sort((a, b) => {
      if (a.hard_gate_pass !== b.hard_gate_pass) return a.hard_gate_pass ? 1 : -1;
      return a.total_score - b.total_score;
    })
    .slice(0, 10);

  console.log('── 4. Review queue head (lowest-scoring pending) ─────────');
  if (headItems.length === 0) {
    console.log('  (no pending_review items have been scored this window)');
  } else {
    for (const r of headItems) {
      const weakest = r.score_object?.scores ? weakestDomain(r.score_object.scores) : 'n/a';
      const gate = r.hard_gate_pass ? 'pass' : 'FAIL';
      console.log(`  ${r.item_draft_id.slice(0, 8)}  total=${String(r.total_score).padStart(3)}  gate=${gate}  decision=${r.publish_decision.padEnd(14)} weakest=${weakest}`);
    }
  }
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
