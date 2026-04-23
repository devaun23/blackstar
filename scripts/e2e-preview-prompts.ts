/**
 * End-to-end PROMPT PREVIEW (zero-token).
 *
 * Renders the exact user_message that vignette_writer and explanation_writer
 * would receive at generation time for a real blueprint node, using live data.
 * Does NOT call Claude — verifies plumbing only.
 *
 * Usage:
 *   npx tsx scripts/e2e-preview-prompts.ts                          # defaults to latent-tuberculosis
 *   npx tsx scripts/e2e-preview-prompts.ts --topic=anaphylaxis
 *   npx tsx scripts/e2e-preview-prompts.ts --topic=latent-tuberculosis --verbose
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const { resolveDIContext } = await import('../src/lib/factory/di-loader');
  const { resolveSourceContext } = await import('../src/lib/factory/source-loader');
  const { NBME_STEM_ANCHORS } = await import('../src/lib/factory/nbme-style-anchors');
  const { formatNbmeLeadInsBlock } = await import('../src/lib/factory/nbme-lead-in-templates');
  const { fetchActivePrompt, fillTemplate } = await import('../src/lib/factory/prompts');

  const topicArg = process.argv.find((a) => a.startsWith('--topic='));
  const verbose = process.argv.includes('--verbose');
  const topic = topicArg?.split('=')[1] ?? 'latent-tuberculosis';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  console.log(`\n═══ E2E PROMPT PREVIEW — topic="${topic}" ═══\n`);

  // 1. Find a blueprint node for this topic
  const { data: nodes, error: nodeErr } = await supabase
    .from('blueprint_node')
    .select('id, shelf, system, topic, subtopic, task_type, clinical_setting, age_group, time_horizon, yield_tier, published_count')
    .eq('topic', topic)
    .order('yield_tier')
    .limit(5);

  if (nodeErr || !nodes || nodes.length === 0) {
    console.error(`No blueprint_node found for topic="${topic}". Try another topic.`);
    if (nodeErr) console.error(`  DB error: ${nodeErr.message}`);
    process.exit(1);
  }

  console.log(`Blueprint nodes for topic="${topic}" (${nodes.length} found):`);
  for (const n of nodes) {
    console.log(`  [${n.id.slice(0, 8)}] task=${n.task_type} setting=${n.clinical_setting} age=${n.age_group} published=${n.published_count}`);
  }

  // Pick the first node (arbitrarily, for demo purposes)
  const node = nodes[0]!;
  console.log(`\nUsing node ${node.id.slice(0, 8)} (task_type=${node.task_type})\n`);

  // 2. Resolve the four provenance blocks the agents would see
  console.log('─── Fetching provenance blocks in parallel ───');
  const [diContext, sourceContext, vignetteAgentPrompt, explanationAgentPrompt] = await Promise.all([
    resolveDIContext(node.topic),
    resolveSourceContext(node.topic, { skipEnrichment: true }),
    fetchActivePrompt('vignette_writer'),
    fetchActivePrompt('explanation_writer'),
  ]);

  // 3. Stats
  const diLines = diContext.split('\n');
  const nbmeDisplayIds = [...diContext.matchAll(/NBME\.\d+\.\d+\.\d+/g)].map((m) => m[0]);
  const ambossDisplayIds = [...diContext.matchAll(/AM\.\d+\.\d+/g)].map((m) => m[0]);
  const diDisplayIds = [...diContext.matchAll(/\bDI\b-\d+/g)].map((m) => m[0]);

  console.log(`di_context:     ${diContext.length.toLocaleString()} chars, ${diLines.length} lines`);
  console.log(`                NBME display_ids: ${nbmeDisplayIds.length} (${[...new Set(nbmeDisplayIds)].slice(0, 3).join(', ')}${nbmeDisplayIds.length > 3 ? ', ...' : ''})`);
  console.log(`                AMBOSS display_ids: ${ambossDisplayIds.length}`);
  console.log(`                DI display_ids: ${diDisplayIds.length}`);
  console.log(`source_context: ${sourceContext.length.toLocaleString()} chars`);
  console.log(`nbme_style_anchors: ${NBME_STEM_ANCHORS.length.toLocaleString()} chars`);

  const leadInBlock = formatNbmeLeadInsBlock(node.task_type);
  const leadInCount = (leadInBlock.match(/\n   • /g) ?? []).length;
  console.log(`nbme_lead_ins:  ${leadInBlock.length.toLocaleString()} chars (task_type="${node.task_type}" → ${leadInCount} lead-ins)`);

  // 4. Render the vignette_writer user_message
  console.log('\n─── VIGNETTE_WRITER rendered prompt ───');
  if (!vignetteAgentPrompt) {
    console.error('No active vignette_writer prompt found.');
    process.exit(1);
  }

  // Minimal stub inputs — these would normally come from upstream pipeline stages.
  // For the preview we use {} placeholders for item_plan, algorithm_card, etc.
  // What matters for this preview is that the 4 provenance blocks render correctly.
  const vignetteVars: Record<string, string> = {
    blueprint_node: JSON.stringify(node, null, 2),
    algorithm_card: '(algorithm_card would be fetched from upstream card extraction)',
    item_plan: '(item_plan would be fetched from upstream item-planner)',
    fact_rows: '(fact_rows would be fetched alongside algorithm_card)',
    question_skeleton: '(optional — populated if pipeline-v2 skeleton stage ran)',
    di_context: diContext || 'No board review reference content available for this topic.',
    nbme_style_anchors: NBME_STEM_ANCHORS,
    nbme_lead_ins: leadInBlock,
  };
  const vignetteRendered = fillTemplate(vignetteAgentPrompt.user_prompt_template, vignetteVars);
  console.log(`  Total length: ${vignetteRendered.length.toLocaleString()} chars (~${Math.round(vignetteRendered.length / 4).toLocaleString()} tokens)`);
  console.log(`  Contains "Which of the following is the most likely diagnosis?": ${vignetteRendered.includes('Which of the following is the most likely diagnosis?')}`);
  console.log(`  Contains NBME display_id: ${/NBME\.\d+\.\d+\.\d+/.test(vignetteRendered)}`);
  console.log(`  Contains "BINDING: Your \`stem\` output MUST be one of the lead-ins": ${vignetteRendered.includes('BINDING: Your `stem`')}`);

  // 5. Render the explanation_writer user_message
  console.log('\n─── EXPLANATION_WRITER rendered prompt ───');
  if (!explanationAgentPrompt) {
    console.error('No active explanation_writer prompt found.');
    process.exit(1);
  }

  const explanationVars: Record<string, string> = {
    item_draft: '(item_draft would come from vignette_writer output)',
    algorithm_card: '(algorithm_card)',
    fact_rows: '(fact_rows)',
    transfer_rule_text: '(transfer_rule_text from case_plan)',
    case_plan: '(case_plan)',
    target_cognitive_error: 'Not specified',
    palmerton_gap_type: 'Not specified',
    palmerton_coaching_note: 'Not specified',
    visual_guidance: 'No visual coverage defined for this topic. Do not produce visual_specs.',
    confusion_set_block: 'NONE',
    drug_options_block: 'NONE',
    di_context: diContext || 'No board review reference content available for this topic.',
    source_context: sourceContext || 'No primary-source guideline prose available for this topic.',
    nbme_style_anchors: NBME_STEM_ANCHORS,
  };
  const explanationRendered = fillTemplate(explanationAgentPrompt.user_prompt_template, explanationVars);
  console.log(`  Total length: ${explanationRendered.length.toLocaleString()} chars (~${Math.round(explanationRendered.length / 4).toLocaleString()} tokens)`);
  console.log(`  Contains "Primary source evidence (guideline prose": ${explanationRendered.includes('Primary source evidence (guideline prose')}`);
  console.log(`  Contains "BINDING RULE: Every factual claim": ${explanationRendered.includes('BINDING RULE: Every factual claim')}`);
  console.log(`  Contains NBME display_id: ${/NBME\.\d+\.\d+\.\d+/.test(explanationRendered)}`);
  console.log(`  Contains an {{unfilled_template_var}}: ${/{{\w+}}/.test(explanationRendered)}`);
  const unfilledMatches = [...explanationRendered.matchAll(/{{\w+}}/g)].map((m) => m[0]);
  if (unfilledMatches.length > 0) {
    console.log(`     unfilled vars: ${[...new Set(unfilledMatches)].join(', ')}`);
  }

  if (verbose) {
    console.log('\n─── VIGNETTE_WRITER prompt, first 2500 chars ───');
    console.log(vignetteRendered.slice(0, 2500));
    console.log('\n(...)\n');
    console.log(vignetteRendered.slice(-2000));
    console.log('\n─── EXPLANATION_WRITER prompt, first 2500 chars ───');
    console.log(explanationRendered.slice(0, 2500));
    console.log('\n(...)\n');
    console.log(explanationRendered.slice(-2000));
  } else {
    console.log('\n(re-run with --verbose to print the full rendered prompts)');
  }

  console.log('\n✓ Preview complete — no tokens spent.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
