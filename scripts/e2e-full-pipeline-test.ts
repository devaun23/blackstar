/**
 * Full end-to-end pipeline test.
 *
 * Fires runPipelineV2 pinned to a specific blueprint_node, inspects the resulting
 * item_draft (if any), and reports whether the NBME material, style anchors, and
 * lead-ins produced a clean item.
 *
 * COSTS TOKENS. Uses a hard cap (--max-tokens=300000 default ≈ $1.50 at Sonnet pricing).
 *
 * Usage:
 *   npx tsx scripts/e2e-full-pipeline-test.ts --blueprint=1bd052d8
 *   npx tsx scripts/e2e-full-pipeline-test.ts --topic=Anaphylaxis
 *   npx tsx scripts/e2e-full-pipeline-test.ts --topic=Tuberculosis --max-tokens=200000
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const { runPipelineV2 } = await import('../src/lib/factory/pipeline-v2');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const blueprintArg = process.argv.find((a) => a.startsWith('--blueprint='));
  const topicArg = process.argv.find((a) => a.startsWith('--topic='));
  const maxTokensArg = process.argv.find((a) => a.startsWith('--max-tokens='));
  const MAX_TOKENS = parseInt(maxTokensArg?.split('=')[1] ?? '300000', 10);

  let blueprintNodeId: string;
  if (blueprintArg) {
    blueprintNodeId = blueprintArg.split('=')[1]!;
  } else {
    const topic = topicArg?.split('=')[1] ?? 'Anaphylaxis';
    const { data } = await supabase
      .from('blueprint_node')
      .select('id, topic, task_type')
      .eq('topic', topic)
      .limit(1)
      .single();
    if (!data) {
      console.error(`No blueprint_node for topic="${topic}"`);
      process.exit(1);
    }
    blueprintNodeId = data.id as string;
    console.log(`Pinned blueprint: ${data.id} (topic="${data.topic}", task_type="${data.task_type}")`);
  }

  console.log(`\n═══ FULL PIPELINE RUN ═══`);
  console.log(`blueprint_node_id: ${blueprintNodeId}`);
  console.log(`max_tokens cap:    ${MAX_TOKENS.toLocaleString()}\n`);

  const started = Date.now();
  let tokensUsed = 0;
  let status: string = 'unknown';
  let runId: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await runPipelineV2({
      blueprintNodeId,
      difficultyClassHint: 'decision_fork',
    });
    tokensUsed = result.totalTokens;
    status = result.finalStatus;
    runId = result.runId;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\n═══ RESULT ═══`);
  console.log(`status:       ${status}`);
  console.log(`tokens:       ${tokensUsed.toLocaleString()} (cap ${MAX_TOKENS.toLocaleString()})`);
  console.log(`elapsed:      ${elapsedSec}s`);
  if (runId) console.log(`pipeline_run: ${runId}`);
  if (errorMessage) console.log(`error:        ${errorMessage}`);

  if (tokensUsed > MAX_TOKENS) {
    console.log(`⚠  EXCEEDED cap by ${(tokensUsed - MAX_TOKENS).toLocaleString()} — review before re-running.`);
  }

  // Fetch the most recent item_draft for this pipeline_run
  if (runId) {
    const { data: drafts } = await supabase
      .from('item_draft')
      .select('id, status, vignette, stem, choice_a, choice_b, choice_c, choice_d, choice_e, correct_answer, created_at')
      .eq('pipeline_run_id', runId)
      .order('created_at', { ascending: false })
      .limit(1);

    const draft = drafts?.[0];
    if (draft) {
      console.log(`\n═══ ITEM DRAFT ${draft.id.slice(0, 8)} (status=${draft.status}) ═══`);
      console.log(`\nVIGNETTE:\n${draft.vignette}`);
      console.log(`\nSTEM: ${draft.stem}`);
      console.log(`\nOPTIONS:`);
      console.log(`  A. ${draft.choice_a}`);
      console.log(`  B. ${draft.choice_b}`);
      console.log(`  C. ${draft.choice_c}`);
      console.log(`  D. ${draft.choice_d}`);
      console.log(`  E. ${draft.choice_e}`);
      console.log(`\nCORRECT: ${draft.correct_answer}`);

      // NBME compliance spot-checks
      console.log(`\n═══ NBME COMPLIANCE SPOT-CHECKS ═══`);
      const stem = (draft.stem ?? '').toString();
      const nbmeLeadInPatterns = [
        'most likely diagnosis',
        'most appropriate next step in management',
        'most appropriate pharmacotherapy',
        'most appropriate diagnostic study',
        'most appropriate immediate management',
        'most appropriate initial management',
        'priority in management',
        'most likely to develop',
        'most likely cause',
        'most appropriate management',
      ];
      const matched = nbmeLeadInPatterns.find((p) => stem.toLowerCase().includes(p));
      console.log(`  stem matches an NBME lead-in pattern: ${matched ? `YES ("${matched}")` : 'NO'}`);

      const vignette = (draft.vignette ?? '').toString();
      console.log(`  vignette length: ${vignette.length} chars (NBME rule-of-thumb: 80-180 words)`);

      const options = [draft.choice_a, draft.choice_b, draft.choice_c, draft.choice_d, draft.choice_e].map((o) => (o ?? '').toString());
      const lengths = options.map((o) => o.length);
      const maxLen = Math.max(...lengths);
      const minLen = Math.min(...lengths);
      const correctLen = options['ABCDE'.indexOf(draft.correct_answer as string)]?.length ?? 0;
      console.log(`  option lengths: min=${minLen} max=${maxLen} correct=${correctLen}`);
      console.log(`  correct answer is longest option: ${correctLen === maxLen ? '⚠ YES (NBME flaw — correct_option_stands_out)' : 'NO'}`);

      const absoluteTerms = /\b(always|never|only|all of|none of)\b/i;
      const flaggedOptions = options.filter((o) => absoluteTerms.test(o));
      console.log(`  options containing absolute terms: ${flaggedOptions.length}/5`);
    }
  }

  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
