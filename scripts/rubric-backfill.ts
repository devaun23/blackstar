#!/usr/bin/env npx tsx
/**
 * Backfill the Blackstar Master Rubric score for existing published items.
 *
 * Loads each item + its validator reports + case_plan + node + confusion_set,
 * runs rubric_evaluator, writes to rubric_score. Does NOT change item_draft.status
 * even if the rubric says 'reject' — backfill is reporting, not re-gating
 * already-shipped items.
 *
 * Usage:
 *   npx tsx scripts/rubric-backfill.ts                # dry run — list candidates
 *   npx tsx scripts/rubric-backfill.ts --run          # actually score
 *   npx tsx scripts/rubric-backfill.ts --run --limit=1
 *   npx tsx scripts/rubric-backfill.ts --run --id=<uuid>
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
const hasFlag = (n: string) => args.includes(`--${n}`);
function getArg(n: string): string | undefined {
  const prefix = `--${n}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}
const dryRun = !hasFlag('run');
const targetId = getArg('id');
const limit = parseInt(getArg('limit') ?? '100', 10);

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/admin');
  const { run: runEvaluator } = await import('../src/lib/factory/agents/rubric-evaluator');
  const supabase = createAdminClient();

  const q = supabase
    .from('item_draft')
    .select('id, status')
    .in('status', ['published', 'needs_human_review', 'passed']);
  if (targetId) q.eq('id', targetId);

  const { data: items, error } = await q.order('created_at', { ascending: true }).limit(limit);
  if (error) throw error;
  if (!items || items.length === 0) {
    console.log('No candidate items found.');
    return;
  }

  // Skip items that already have a master_v1 rubric_score.
  const { data: existing } = await supabase
    .from('rubric_score')
    .select('item_draft_id')
    .eq('rubric_version', 'master_v1');
  const alreadyScored = new Set((existing ?? []).map((r) => r.item_draft_id));
  const candidates = items.filter((it) => !alreadyScored.has(it.id));

  console.log(`Found ${items.length} candidate item(s); ${candidates.length} not yet scored under master_v1.`);
  if (dryRun) {
    for (const c of candidates) console.log(`  ${c.id}  status=${c.status}`);
    console.log('\nDry run — add --run to score.');
    return;
  }

  const bands = { publish: 0, revise: 0, major_revision: 0, reject: 0 };
  let ok = 0;
  let fail = 0;

  for (const item of candidates) {
    console.log(`\n→ Scoring ${item.id}`);

    const { data: draft } = await supabase.from('item_draft').select('*').eq('id', item.id).single();
    if (!draft) { console.error('  ✗ draft fetch failed'); fail++; continue; }

    const { data: casePlan } = draft.case_plan_id
      ? await supabase.from('case_plan').select('*').eq('id', draft.case_plan_id).single()
      : { data: null };

    const { data: node } = draft.blueprint_node_id
      ? await supabase.from('blueprint_node').select('*').eq('id', draft.blueprint_node_id).single()
      : { data: null };

    const { data: confusionSet } = casePlan?.target_confusion_set_id
      ? await supabase.from('confusion_sets').select('*').eq('id', casePlan.target_confusion_set_id).single()
      : { data: null };

    const { data: reports } = await supabase
      .from('validator_report')
      .select('*')
      .eq('item_draft_id', item.id)
      .order('created_at', { ascending: false });
    const reportsByType: Record<string, unknown> = {};
    for (const r of reports ?? []) {
      if (!reportsByType[r.validator_type]) reportsByType[r.validator_type] = r;
    }

    const cognitiveErrorNames: string[] = [];
    if (casePlan?.target_cognitive_error_id) {
      const { data: errRow } = await supabase
        .from('error_taxonomy')
        .select('error_name')
        .eq('id', casePlan.target_cognitive_error_id)
        .single();
      if (errRow?.error_name) cognitiveErrorNames.push(errRow.error_name);
    }

    const result = await runEvaluator(
      { pipelineRunId: `backfill-${Date.now()}`, mockMode: false },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draft: draft as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        casePlan: (casePlan ?? null) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node: (node ?? null) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        confusionSet: (confusionSet ?? null) as any,
        cognitiveErrorNames,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validatorReports: reportsByType as any,
        rubricScorerOverall: null,
      },
    );

    if (!result.success) {
      console.error(`  ✗ evaluator failed: ${result.error ?? 'unknown'}`);
      fail++;
      continue;
    }

    const score = result.data;
    bands[score.publish_decision as keyof typeof bands]++;
    ok++;
    console.log(`  ✓ total=${score.total_score} decision=${score.publish_decision} hard_gate=${score.hard_gate_pass}`);
    if (score.hard_gate_fail_reasons.length > 0) {
      console.log(`    hard_gate_fail: ${score.hard_gate_fail_reasons.join(', ')}`);
    }
  }

  console.log(`\nDone. ok=${ok} fail=${fail}`);
  console.log(`Band distribution: publish=${bands.publish} revise=${bands.revise} major_revision=${bands.major_revision} reject=${bands.reject}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
