/**
 * Sync ALL agent_prompt entries from seeds/agent-prompts.ts to Supabase.
 *
 * Upserts on (agent_type, version). Processes is_active=false rows first, then
 * is_active=true last, so the partial-unique index (exactly one active per
 * agent_type) never trips during migration.
 *
 * Usage:
 *   npx tsx scripts/sync-all-prompts.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

async function main() {
  const { agentPrompts } = await import('../src/lib/factory/seeds/agent-prompts');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const inactive = agentPrompts.filter((p) => !p.is_active);
  const active = agentPrompts.filter((p) => p.is_active);
  const ordered = [...inactive, ...active];

  console.log(`Syncing ${ordered.length} prompts (${inactive.length} inactive first, then ${active.length} active)...\n`);

  let ok = 0, fail = 0;
  for (const p of ordered) {
    const { error } = await supabase
      .from('agent_prompt')
      .upsert(p, { onConflict: 'agent_type,version' });
    if (error) {
      console.error(`  FAIL ${p.agent_type} v${p.version}: ${error.message}`);
      fail++;
    } else {
      ok++;
    }
  }

  console.log(`\n${ok} ok, ${fail} failed`);

  // Verify: exactly one active per agent_type
  const { data: rows, error } = await supabase
    .from('agent_prompt')
    .select('agent_type, version, is_active')
    .eq('is_active', true)
    .order('agent_type');
  if (error) throw new Error(error.message);

  console.log('\nActive prompts now:');
  for (const r of rows ?? []) console.log(`  ${r.agent_type} v${r.version}`);

  const counts: Record<string, number> = {};
  for (const r of rows ?? []) counts[r.agent_type] = (counts[r.agent_type] ?? 0) + 1;
  const bad = Object.entries(counts).filter(([, n]) => n !== 1);
  if (bad.length > 0) {
    console.error('\nERROR: some agents have != 1 active prompt:');
    for (const [t, n] of bad) console.error(`  ${t}: ${n} active`);
    process.exit(1);
  }

  if (fail > 0) process.exit(1);
  console.log('\n✓ All prompts synced; exactly one active per agent_type');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
