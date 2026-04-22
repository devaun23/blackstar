/**
 * Apply nbme_quality_validator v4 prompt to Supabase.
 *
 * Minimal, surgical script — does not touch any other agent prompts or seeds.
 * Reads the v3 and v4 entries from seeds/agent-prompts.ts and upserts them
 * (v3 flipped to is_active=false, v4 inserted as is_active=true).
 *
 * Usage:
 *   npx tsx scripts/apply-nbme-validator-v4.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

async function main() {
  const { agentPrompts } = await import('../src/lib/factory/seeds/agent-prompts');

  const targets = agentPrompts.filter((p) => p.agent_type === 'nbme_quality_validator');
  if (targets.length === 0) {
    throw new Error('No nbme_quality_validator entries found in seeds');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Order matters: deactivate old versions first so the partial-unique index
  // (exactly one is_active per agent_type) doesn't trip when inserting v4.
  const ordered = [...targets].sort((a, b) => {
    if (a.is_active === b.is_active) return a.version - b.version;
    return a.is_active ? -1 : 1;
  });
  const toApply = ordered.filter((p) => !p.is_active).concat(ordered.filter((p) => p.is_active));

  console.log('Applying nbme_quality_validator prompt versions:');
  for (const p of toApply) {
    console.log(`  v${p.version}  is_active=${p.is_active}  (${p.system_prompt.length} chars)`);
    const { error } = await supabase
      .from('agent_prompt')
      .upsert(p, { onConflict: 'agent_type,version' });
    if (error) {
      console.error(`  FAILED: ${error.message}`);
      process.exit(1);
    }
  }

  const { data, error } = await supabase
    .from('agent_prompt')
    .select('version, is_active, notes')
    .eq('agent_type', 'nbme_quality_validator')
    .order('version');
  if (error) {
    console.error(`Verify query failed: ${error.message}`);
    process.exit(1);
  }

  console.log('\nDB state after apply:');
  for (const row of data ?? []) {
    console.log(`  v${row.version}  is_active=${row.is_active}`);
  }

  const activeRows = (data ?? []).filter((r) => r.is_active);
  if (activeRows.length !== 1 || activeRows[0]!.version !== 4) {
    console.error(`\nERROR: expected exactly v4 active, got ${activeRows.length} active`);
    process.exit(1);
  }
  console.log('\n✓ nbme_quality_validator v4 is active');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
