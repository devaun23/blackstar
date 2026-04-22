/**
 * Targeted re-seed: agent_prompt table only.
 *
 * Run after editing src/lib/factory/seeds/agent-prompts.ts — the pipeline reads
 * prompts from the DB via fetchActivePrompt(), so TS edits have no effect until
 * the DB is synchronized.
 *
 * Usage: npx tsx scripts/reseed-prompts.ts
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
  const { agentPrompts } = await import('../src/lib/factory/seeds/agent-prompts');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let upserted = 0;
  const errors: string[] = [];

  for (const prompt of agentPrompts) {
    const { error } = await supabase
      .from('agent_prompt')
      .upsert(prompt, { onConflict: 'agent_type,version' });
    if (error) errors.push(`${prompt.agent_type} v${prompt.version}: ${error.message}`);
    else upserted++;
  }

  console.log(`Upserted: ${upserted}`);
  if (errors.length > 0) {
    console.error(`Errors: ${errors.length}`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  // Sanity check — confirm active prompts per agent_type
  const { data: active } = await supabase
    .from('agent_prompt')
    .select('agent_type, version')
    .eq('is_active', true)
    .order('agent_type');

  console.log('\nActive prompts:');
  for (const row of active ?? []) {
    console.log(`  ${row.agent_type}: v${row.version}`);
  }
}

main().catch((err) => {
  console.error('Re-seed failed:', err);
  process.exit(1);
});
