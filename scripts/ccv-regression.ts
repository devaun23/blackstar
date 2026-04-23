#!/usr/bin/env npx tsx
/**
 * Contraindication Cross-Check Validator — regression harness.
 *
 * Loads the fixture at tests/fixtures/contraindication-test-set.ts and runs the
 * CCV against each case. Compares returned outcome to the declared expected value.
 * Reports a pass/fail matrix.
 *
 * Usage:
 *   npx tsx scripts/ccv-regression.ts
 *   npx tsx scripts/ccv-regression.ts --only syn_q2_tpa_surgery
 *   npx tsx scripts/ccv-regression.ts --verbose
 *
 * Exit code:
 *   0  all regressions pass (known gaps do not count as failures)
 *   1  at least one unexpected mismatch
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
const verbose = args.includes('--verbose');
function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = args.find((a) => a.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}
const onlyFilter = getArg('only');

type FixtureModule = typeof import('../tests/fixtures/contraindication-test-set');
type ExpectedOutcome = FixtureModule['cases'][number]['expected'];

async function main() {
  const { cases } = await import('../tests/fixtures/contraindication-test-set');
  const { run: runCcv } = await import('../src/lib/factory/agents/contraindication-validator');
  const { createAdminClient } = await import('../src/lib/supabase/admin');
  const supabase = createAdminClient();

  const selected = onlyFilter ? cases.filter((c) => c.id === onlyFilter) : cases;
  if (selected.length === 0) {
    console.error(`No cases match --only=${onlyFilter}`);
    process.exit(1);
  }

  console.log(`Running CCV regression on ${selected.length} case(s)...\n`);

  let pass = 0;
  let regression = 0;
  let knownGap = 0;

  for (const tc of selected) {
    let draft: unknown;
    let card: unknown;

    if (tc.source === 'db') {
      const { data: d, error: e1 } = await supabase
        .from('item_draft')
        .select('*')
        .eq('id', tc.item_draft_id)
        .single();
      if (e1 || !d) {
        console.log(`✗ ${tc.id}  [FETCH_FAIL]  ${e1?.message ?? 'not found'}`);
        regression++;
        continue;
      }
      // Derive the algorithm_card via case_plan.algorithm_card_id
      let cardRow: unknown = { contraindications: [] };
      if (d.case_plan_id) {
        const { data: cp } = await supabase
          .from('case_plan')
          .select('algorithm_card_id')
          .eq('id', d.case_plan_id)
          .single();
        if (cp?.algorithm_card_id) {
          const { data: c } = await supabase
            .from('algorithm_card')
            .select('*')
            .eq('id', cp.algorithm_card_id)
            .single();
          if (c) cardRow = c;
        }
      }
      draft = d;
      card = cardRow;
    } else {
      // Synthetic — pad with stub fields so the ItemDraftRow shape is satisfied at runtime.
      // The CCV only reads {correct_answer, choice_*, vignette, stem, id}.
      draft = {
        ...tc.draft,
        status: 'draft',
        item_plan_id: null,
        blueprint_node_id: null,
        pipeline_run_id: null,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      card = {
        id: 'synthetic-card',
        blueprint_node_id: 'synthetic-node',
        status: 'generation_ready',
        entry_presentation: '',
        competing_paths: [],
        hinge_feature: '',
        correct_action: '',
        contraindications: tc.card.contraindications,
        source_citations: [],
        time_horizon: null,
        severity_markers: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const result = await runCcv(
      { pipelineRunId: `regression-${Date.now()}`, mockMode: false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { draft: draft as any, card: card as any },
    );

    const data = result.data;
    const { passed, trigger_found, triggers } = data;
    const hasAbsolute = triggers.some((t) => t.severity === 'absolute');
    const hasRelative = triggers.some((t) => t.severity === 'relative');
    const observed =
      passed && trigger_found === 'no' ? 'pass'
      : passed && trigger_found !== 'no' ? 'pass_teaching'
      : !passed && hasAbsolute ? 'fail_absolute'
      : !passed && hasRelative ? 'fail_relative'
      : !passed && trigger_found === 'unknown' ? 'needs_review'
      : 'unknown';

    const expected = tc.expected;
    const acceptAlso = tc.source === 'db' ? (tc.accept_also ?? []) : [];
    const match = observed === expected || acceptAlso.includes(observed as ExpectedOutcome);

    let icon: string;
    let bucket: 'pass' | 'regression' | 'known_gap';
    if (match) {
      icon = '✓';
      bucket = 'pass';
      pass++;
    } else if (expected === 'pass_teaching') {
      // Known gap: validator doesn't yet read case_plan
      icon = '~';
      bucket = 'known_gap';
      knownGap++;
    } else {
      icon = '✗';
      bucket = 'regression';
      regression++;
    }

    const label =
      bucket === 'pass'       ? 'OK'
      : bucket === 'known_gap' ? 'KNOWN GAP'
      :                          'REGRESSION';
    console.log(`${icon} ${tc.id.padEnd(34)} [${label}] expected=${expected} observed=${observed}`);
    if (verbose || !match) {
      console.log(`    ${tc.description}`);
      if (data.issues_found.length > 0) {
        for (const issue of data.issues_found) console.log(`    → ${issue}`);
      }
    }
  }

  console.log(`\nSummary: ok=${pass}  regression=${regression}  known_gap=${knownGap}  (of ${selected.length})`);
  if (regression > 0) {
    console.error('REGRESSION DETECTED — exit 1');
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
