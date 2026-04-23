/**
 * Push the updated vignette_writer + explanation_writer prompts from the seed
 * file into the live agent_prompt table.
 *
 * Targeted update — only the three rows that changed:
 *   - vignette_writer v4   (adds {{nbme_style_anchors}} placeholder)
 *   - explanation_writer v6 (adds {{source_context}} + {{nbme_style_anchors}} + BINDING RULE)
 *   - explanation_writer v7 (adds {{source_context}} + {{nbme_style_anchors}} + BINDING RULE)
 *
 * Upserts on (agent_type, version), same conflict key as the full seed route.
 * Does NOT flip is_active flags beyond what's in the seed file — so if v6 is
 * live and v7 is inactive, that stays true after this runs.
 *
 * Usage:
 *   npx tsx scripts/push-updated-prompts.ts --dry-run   # show the diff, no writes
 *   npx tsx scripts/push-updated-prompts.ts             # apply
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { agentPrompts } from '../src/lib/factory/seeds';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const TARGETS: Array<{ agent_type: string; version: number }> = [
  { agent_type: 'vignette_writer', version: 4 },
  { agent_type: 'explanation_writer', version: 6 },
  { agent_type: 'explanation_writer', version: 7 },
];

function placeholders(tpl: string): string[] {
  const found: string[] = [];
  for (const key of ['di_context', 'source_context', 'nbme_style_anchors', 'nbme_lead_ins']) {
    if (tpl.includes(`{{${key}}}`)) found.push(key);
  }
  return found;
}

async function main() {
  console.log(`\n=== push-updated-prompts ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const rows = agentPrompts.filter((p) =>
    TARGETS.some((t) => t.agent_type === p.agent_type && t.version === p.version),
  );

  if (rows.length !== TARGETS.length) {
    const missing = TARGETS.filter(
      (t) => !rows.some((r) => r.agent_type === t.agent_type && r.version === t.version),
    );
    console.error(`Missing rows in seed file: ${JSON.stringify(missing)}`);
    process.exit(1);
  }

  for (const row of rows) {
    const liveResult = await supabase
      .from('agent_prompt')
      .select('user_prompt_template, is_active')
      .eq('agent_type', row.agent_type)
      .eq('version', row.version)
      .single();

    const live = liveResult.data;
    const livePlaceholders = placeholders(live?.user_prompt_template ?? '');
    const seedPlaceholders = placeholders(row.user_prompt_template ?? '');

    console.log(`${row.agent_type} v${row.version}:`);
    console.log(`  live active      : ${live?.is_active ?? '(missing)'}`);
    console.log(`  live placeholders: ${livePlaceholders.join(', ') || '(none)'}`);
    console.log(`  seed placeholders: ${seedPlaceholders.join(', ') || '(none)'}`);
    console.log(
      `  seed is_active   : ${row.is_active} (will be written unchanged from seed file)`,
    );

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('agent_prompt')
        .upsert(row, { onConflict: 'agent_type,version' });
      if (error) {
        console.log(`  UPSERT ERROR: ${error.message}`);
      } else {
        console.log(`  ✓ upserted`);
      }
    }
    console.log('');
  }

  console.log(DRY_RUN ? 'Dry run complete. Re-run without --dry-run to apply.\n' : 'Done.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
