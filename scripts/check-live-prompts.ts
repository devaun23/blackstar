/**
 * Read-only inspection of the live agent_prompt table.
 * Shows which versions of explanation_writer and vignette_writer are active,
 * and whether their user_prompt_template already contains the NBME wiring
 * placeholders ({{source_context}}, {{nbme_style_anchors}}).
 *
 * Usage: npx tsx scripts/check-live-prompts.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const AGENTS = ['explanation_writer', 'vignette_writer'];

async function main() {
  for (const agentType of AGENTS) {
    console.log(`\n═══ ${agentType} ═══`);
    const { data, error } = await supabase
      .from('agent_prompt')
      .select('version, is_active, user_prompt_template')
      .eq('agent_type', agentType)
      .order('version', { ascending: false });

    if (error) {
      console.error(`  ERROR: ${error.message}`);
      continue;
    }
    if (!data || data.length === 0) {
      console.log('  (no rows)');
      continue;
    }

    for (const row of data) {
      const tpl = row.user_prompt_template ?? '';
      const hasSourceContext = tpl.includes('{{source_context}}');
      const hasStyleAnchors = tpl.includes('{{nbme_style_anchors}}');
      const hasDiContext = tpl.includes('{{di_context}}');
      const hasLeadIns = tpl.includes('{{nbme_lead_ins}}');
      console.log(
        `  v${row.version}  active=${row.is_active}  ` +
          `di=${hasDiContext ? 'Y' : 'N'}  src=${hasSourceContext ? 'Y' : 'N'}  ` +
          `anchors=${hasStyleAnchors ? 'Y' : 'N'}  lead_ins=${hasLeadIns ? 'Y' : 'N'}`,
      );
    }
  }

  // Exact counts per source via head+count (no 1000-row page cap)
  console.log('\n═══ di_evidence_item row counts by source ═══');
  const sources = ['divine_intervention', 'inner_circle', 'amboss', 'emma_holliday', 'nbme'];
  for (const s of sources) {
    const { count, error: cErr } = await supabase
      .from('di_evidence_item')
      .select('*', { count: 'exact', head: true })
      .eq('source', s);
    if (cErr) {
      console.log(`  ${s}: ERROR ${cErr.message}`);
    } else {
      console.log(`  ${s}: ${count ?? 0}`);
    }
  }

  // Also verify a topic-scoped NBME query (what resolveDIContext does at runtime)
  console.log('\n═══ NBME rows for topic="latent-tuberculosis" (runtime query shape) ═══');
  const { data: tbRows, error: tbErr } = await supabase
    .from('di_evidence_item')
    .select('display_id, item_type, claim')
    .eq('source', 'nbme')
    .contains('topic_tags', ['latent-tuberculosis'])
    .limit(5);
  if (tbErr) {
    console.log(`  ERROR: ${tbErr.message}`);
  } else {
    console.log(`  Found ${tbRows?.length ?? 0} rows (showing up to 5):`);
    for (const r of tbRows ?? []) {
      console.log(`  [${r.display_id}] (${r.item_type}) ${String(r.claim).slice(0, 80)}`);
    }
  }

  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
