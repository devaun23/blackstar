#!/usr/bin/env npx tsx
/**
 * Regenerate v7 (7-component) explanations for existing published items.
 *
 * Usage:
 *   npx tsx scripts/regenerate-explanations-v7.ts                 # Dry run — lists items, no calls
 *   npx tsx scripts/regenerate-explanations-v7.ts --run           # Actually regenerate
 *   npx tsx scripts/regenerate-explanations-v7.ts --run --id=<uuid>  # Single item
 *   npx tsx scripts/regenerate-explanations-v7.ts --run --limit=1 # Process N items
 *
 * Prerequisites:
 *   1. Migration v24 applied (adds anchor_rule, illness_script, reasoning_compressed,
 *      management_protocol, traps columns).
 *   2. Agent prompt v7 seeded (is_active can be false — script forces via DB-level override).
 *   3. ANTHROPIC_API_KEY and Supabase service role key in .env.local.
 *
 * Cost note: ~12k tokens per call. 5 items ≈ 60k tokens total.
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
const hasFlag = (name: string) => args.includes(`--${name}`);
function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const dryRun = !hasFlag('run');
const targetId = getArg('id');
const limit = parseInt(getArg('limit') ?? '100', 10);

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/admin');
  const { run: runExplanationWriter } = await import('../src/lib/factory/agents/explanation-writer');
  const supabase = createAdminClient();

  // Load published items (or a specific one)
  const q = supabase
    .from('item_draft')
    .select('id, case_plan_id, blueprint_node_id, status, anchor_rule')
    .eq('status', 'published');
  if (targetId) q.eq('id', targetId);

  const { data: items, error } = await q.order('created_at', { ascending: true }).limit(limit);
  if (error) throw error;
  if (!items || items.length === 0) {
    console.log('No published items found.');
    return;
  }

  console.log(`Found ${items.length} published item(s).`);
  if (dryRun) {
    for (const item of items) {
      const status = item.anchor_rule ? 'HAS v7' : 'needs regen';
      console.log(`  ${item.id}  [${status}]`);
    }
    console.log('\nDry run — add --run to regenerate.');
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const item of items) {
    console.log(`\n→ Regenerating ${item.id}`);

    const { data: draft, error: draftErr } = await supabase
      .from('item_draft')
      .select('*')
      .eq('id', item.id)
      .single();
    if (draftErr || !draft) {
      console.error(`  ✗ fetch draft failed: ${draftErr?.message}`);
      fail++;
      continue;
    }

    // Load supporting context
    const { data: casePlan } = draft.case_plan_id
      ? await supabase.from('case_plan').select('*').eq('id', draft.case_plan_id).single()
      : { data: null };

    const algorithmCardId = casePlan?.algorithm_card_id ?? null;
    const { data: card } = algorithmCardId
      ? await supabase.from('algorithm_card').select('*').eq('id', algorithmCardId).single()
      : { data: null };

    const { data: facts } = algorithmCardId
      ? await supabase.from('fact_row').select('*').eq('algorithm_card_id', algorithmCardId)
      : { data: [] };

    const { data: node } = draft.blueprint_node_id
      ? await supabase.from('blueprint_node').select('*').eq('id', draft.blueprint_node_id).single()
      : { data: null };

    const { data: confusionSet } = casePlan?.target_confusion_set_id
      ? await supabase.from('confusion_sets').select('*').eq('id', casePlan.target_confusion_set_id).single()
      : { data: null };

    if (!card || !casePlan) {
      console.error(`  ✗ missing card or case_plan`);
      fail++;
      continue;
    }

    const result = await runExplanationWriter(
      { pipelineRunId: `regen-v7-${Date.now()}`, mockMode: false },
      {
        draft,
        card,
        facts: facts ?? [],
        node: node ?? undefined,
        transferRuleText: casePlan.transfer_rule_text,
        targetCognitiveErrorId: casePlan.target_cognitive_error_id ?? undefined,
        confusionSet: confusionSet ?? null,
        drugOptions: [],
        casePlan,
      },
    );

    if (result.success) {
      console.log(`  ✓ regenerated (tokens: ${result.tokensUsed})`);
      ok++;
    } else {
      console.error(`  ✗ writer failed: ${result.error}`);
      fail++;
    }
  }

  console.log(`\nDone. ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
