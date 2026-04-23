#!/usr/bin/env npx tsx
/**
 * Blackstar Master Rubric — CLI dashboard.
 *
 * Reads rubric_score rows and prints:
 *   - Band distribution (publish / revise / major_revision / reject)
 *   - Hard-gate fail frequency (which gates fire most)
 *   - Per-domain score distribution (min/median/mean/max across items with scores)
 *   - Worst-10 items by total_score (among items that reached scoring)
 *
 * Usage:
 *   npx tsx scripts/rubric-report.ts
 *   npx tsx scripts/rubric-report.ts --version=master_v1
 *   npx tsx scripts/rubric-report.ts --limit=100
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const args = process.argv.slice(2);
function getArg(n: string): string | undefined {
  const prefix = `--${n}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}
const rubricVersion = getArg('version') ?? 'master_v1';
const limit = parseInt(getArg('limit') ?? '500', 10);

interface ScoreObject {
  hard_gate_fail_reasons: string[];
  scores: Record<string, number>;
  total_score: number;
  publish_decision: string;
  notes: string | null;
}

interface ScoreRow {
  item_draft_id: string;
  total_score: number;
  publish_decision: string;
  hard_gate_pass: boolean;
  score_object: ScoreObject;
  created_at: string;
}

const DOMAIN_MAX: Record<string, number> = {
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

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/admin');
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from('rubric_score')
    .select('*')
    .eq('rubric_version', rubricVersion)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!rows || rows.length === 0) {
    console.log(`No rubric_score rows for version=${rubricVersion}.`);
    return;
  }

  const typed = rows as unknown as ScoreRow[];

  console.log(`═══ Blackstar Master Rubric — Report (${rubricVersion}, n=${typed.length}) ═══\n`);

  // ── Band distribution ────────────────────────────────────────────────────
  const bands: Record<string, number> = { publish: 0, revise: 0, major_revision: 0, reject: 0 };
  for (const r of typed) bands[r.publish_decision] = (bands[r.publish_decision] ?? 0) + 1;
  console.log('Band distribution:');
  for (const [b, n] of Object.entries(bands)) {
    const pct = ((n / typed.length) * 100).toFixed(1);
    console.log(`  ${b.padEnd(16)} ${n.toString().padStart(4)}  (${pct}%)`);
  }

  // ── Hard-gate fail frequency ─────────────────────────────────────────────
  const gateFreq: Record<string, number> = {};
  for (const r of typed) {
    for (const reason of r.score_object.hard_gate_fail_reasons ?? []) {
      gateFreq[reason] = (gateFreq[reason] ?? 0) + 1;
    }
  }
  if (Object.keys(gateFreq).length > 0) {
    console.log('\nHard-gate fail frequency:');
    for (const [reason, n] of Object.entries(gateFreq).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${n.toString().padStart(4)} × ${reason}`);
    }
  }

  // ── Per-domain score stats (only items that reached scoring, total_score > 0) ──
  const scored = typed.filter((r) => r.hard_gate_pass);
  if (scored.length > 0) {
    console.log(`\nPer-domain score distribution (n=${scored.length} items that reached scoring):`);
    console.log('  Domain                         min   med   mean    max   (of max)');
    for (const [domain, maxPts] of Object.entries(DOMAIN_MAX)) {
      const values = scored.map((r) => r.score_object.scores?.[domain] ?? 0);
      if (values.length === 0) continue;
      const mn = Math.min(...values);
      const mx = Math.max(...values);
      const md = median(values);
      const mu = mean(values);
      console.log(`  ${domain.padEnd(30)} ${mn.toString().padStart(3)}   ${md.toFixed(1).padStart(4)}  ${mu.toFixed(2).padStart(5)}   ${mx.toString().padStart(3)}    / ${maxPts}`);
    }

    // ── Worst-10 by total_score ────────────────────────────────────────────
    const worst = [...scored].sort((a, b) => a.total_score - b.total_score).slice(0, 10);
    console.log('\nWorst-10 items by total_score:');
    for (const r of worst) {
      const n = r.score_object.notes ? ` — ${r.score_object.notes.slice(0, 80)}` : '';
      console.log(`  ${r.total_score.toString().padStart(3)}  ${r.item_draft_id.slice(0, 8)}  ${r.publish_decision.padEnd(14)}${n}`);
    }
  } else {
    console.log('\n(No items passed hard gates, so per-domain stats are unavailable. Re-run backfill once gates are tuned.)');
  }

  // ── Notes inspection — surface flagged v23 gaps without running LLM ─────
  const withNotes = typed.filter((r) => r.score_object.notes);
  if (withNotes.length > 0) {
    console.log(`\nItems with persisted notes (n=${withNotes.length}):`);
    for (const r of withNotes.slice(0, 10)) {
      console.log(`  ${r.item_draft_id.slice(0, 8)}  ${r.score_object.notes!.slice(0, 100)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
