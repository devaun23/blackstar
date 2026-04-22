/**
 * Scoped CCV test: reconstruct the Q2 bug (massive PE + post-op day 5 +
 * keyed alteplase) and run it directly through contraindicationValidator.run().
 *
 * Bypasses the stochastic upstream pipeline (blueprint/algorithm/skeleton/vignette
 * stages) because we want a deterministic answer to exactly one question:
 * "Does CCV catch this specific contraindication conflict?" That question is
 * about CCV alone, not about whether the upstream agents happen to produce a
 * thrombolysis-keyed PE question today.
 *
 * Side effects:
 *   - Creates ONE scratch item_draft row (labeled in the vignette for traceability)
 *   - CCV inserts ONE validator_report row
 *   - On exit, deletes the scratch item_draft (validator_report cascades)
 *
 * Usage:
 *   npx tsx scripts/test-ccv-q2.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

async function main(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const { contraindicationValidator } = await import('../src/lib/factory/agents');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Reuse any existing blueprint_node + item_plan to satisfy item_draft FKs.
  const { data: node, error: nodeErr } = await supabase
    .from('blueprint_node')
    .select('id')
    .limit(1)
    .single();
  if (nodeErr || !node) throw new Error(`No blueprint_node found: ${nodeErr?.message}`);

  // Reuse ANY existing item_plan (cheapest path — no need to match node). CCV doesn't
  // read item_plan; we only need it to satisfy the item_draft FK.
  const { data: plan, error: planErr } = await supabase
    .from('item_plan')
    .select('id, blueprint_node_id')
    .limit(1)
    .maybeSingle();
  if (planErr) throw new Error(planErr.message);
  if (!plan) {
    throw new Error(
      'No existing item_plan row found to borrow for scratch draft. ' +
      'Generate at least one question through the pipeline first, then re-run this test.',
    );
  }
  const planId = plan.id as string;
  const nodeId = plan.blueprint_node_id as string;
  void node;

  // Scratch item_draft with the Q2 stem + alteplase keyed.
  const q2Vignette =
    '[CCV_TEST_Q2_SCRATCH] 58-year-old man is brought to the ED 5 days after total hip arthroplasty ' +
    'with sudden shortness of breath, chest pain, and hypotension. HR 128, SBP 82 on norepinephrine drip. ' +
    'JVD present. RV/LV ratio 1.2 on bedside echo. CTA shows saddle embolus.';

  const { data: draft, error: draftErr } = await supabase
    .from('item_draft')
    .insert({
      item_plan_id: planId,
      blueprint_node_id: nodeId,
      status: 'draft',
      vignette: q2Vignette,
      stem: 'Which of the following is the most appropriate next step in management?',
      choice_a: 'Administer alteplase 100 mg IV over 2 hours',
      choice_b: 'Catheter-directed thrombolysis',
      choice_c: 'Surgical embolectomy',
      choice_d: 'IV heparin only',
      choice_e: 'Inferior vena cava filter',
      correct_answer: 'A',
      why_correct: '[test placeholder]',
    })
    .select('*')
    .single();
  if (draftErr || !draft) throw new Error(`Could not create scratch item_draft: ${draftErr?.message}`);

  console.log(`\n[test-ccv-q2] Created scratch item_draft ${draft.id}`);
  console.log('[test-ccv-q2] Running CCV...\n');

  // Minimal in-memory algorithm_card — CCV only reads card.contraindications.
  const card = {
    id: '00000000-0000-0000-0000-000000000000',
    contraindications: [
      'recent surgery within 14 days',
      'active bleeding',
      'history of intracranial hemorrhage',
    ],
  } as Parameters<typeof contraindicationValidator.run>[1]['card'];

  const context = {
    pipelineRunId: 'ccv-test-q2',
    mockMode: false,
  } as Parameters<typeof contraindicationValidator.run>[0];

  try {
    const start = Date.now();
    const result = await contraindicationValidator.run(context, {
      draft: draft as Parameters<typeof contraindicationValidator.run>[1]['draft'],
      card,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`[test-ccv-q2] CCV completed in ${elapsed}s\n`);
    console.log('━━━ CCV Result ━━━');
    console.log(`  success:        ${result.success}`);
    console.log(`  tokens used:    ${result.tokensUsed}`);
    if (result.data) {
      const d = result.data;
      console.log(`  passed:         ${d.passed}`);
      console.log(`  score:          ${d.score}`);
      console.log(`  trigger_found:  ${d.trigger_found}`);
      console.log(`  matched_id:     ${d.matched_intervention_id}`);
      console.log(`  issues:`);
      for (const issue of d.issues_found) console.log(`    - ${issue}`);
      console.log(`  triggers (${d.triggers.length}):`);
      for (const t of d.triggers) {
        console.log(`    - [${t.severity.toUpperCase()} / ${t.confidence} / ${t.source}] ${t.contraindication_id ?? '(llm-inferred)'}`);
        console.log(`        stem_detail: "${t.stem_detail}"`);
        console.log(`        text:        ${t.contraindication_text}`);
      }
      console.log(`  repair_instructions: ${d.repair_instructions ?? '(none)'}`);
    }
    console.log('\n━━━ Expected ━━━');
    console.log('  trigger_found: yes');
    console.log('  matched_intervention_id: thrombolysis_systemic');
    console.log('  at least one trigger with contraindication_id="recent_major_surgery" and severity="relative"');

    const ok =
      result.success &&
      result.data?.trigger_found === 'yes' &&
      result.data?.matched_intervention_id === 'thrombolysis_systemic' &&
      result.data?.triggers.some(
        (t) => t.contraindication_id === 'recent_major_surgery' && t.severity === 'relative',
      );

    console.log('\n━━━ Verdict ━━━');
    console.log(ok ? '  ✓ PASS — CCV caught the Q2 bug' : '  ✗ FAIL — CCV did not flag as expected');
    process.exitCode = ok ? 0 : 1;
  } finally {
    // Cleanup: delete the scratch item_draft. validator_report row cascades via FK.
    const { error: delErr } = await supabase.from('item_draft').delete().eq('id', draft.id);
    if (delErr) console.warn(`[test-ccv-q2] WARNING: cleanup failed: ${delErr.message}`);
    else console.log(`\n[test-ccv-q2] Cleaned up scratch item_draft ${draft.id}`);
  }
}

main().catch((err) => {
  console.error('[test-ccv-q2] Crashed:', err);
  process.exit(2);
});
