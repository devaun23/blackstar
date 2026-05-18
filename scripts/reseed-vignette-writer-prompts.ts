/**
 * Re-seed the vignette_writer agent_prompt rows (F2).
 *
 * After updating agentPrompts in seeds/agent-prompts.ts, this script upserts
 * only the vignette_writer rows (v3 superseded, v4 active) into the DB so
 * the next pipeline run picks up the new prompt text. Avoids re-running
 * the full /api/factory/seed which would touch dozens of unrelated tables.
 *
 * Usage:
 *   npx tsx scripts/reseed-vignette-writer-prompts.ts
 *   npx tsx scripts/reseed-vignette-writer-prompts.ts --dry-run
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
  const dryRun = process.argv.includes('--dry-run');
  const { agentPrompts } = await import('../src/lib/factory/seeds/agent-prompts');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const targets = agentPrompts.filter((p) => p.agent_type === 'vignette_writer');
  console.log(`Found ${targets.length} vignette_writer prompt versions in seed:`);
  for (const p of targets) {
    console.log(`  v${p.version} (is_active=${p.is_active}, ${p.system_prompt.length} chars)`);
  }

  if (dryRun) {
    console.log('\n(dry-run — no upsert)');
    return;
  }

  let okCount = 0;
  for (const p of targets) {
    const { error } = await supabase.from('agent_prompt').upsert(p, { onConflict: 'agent_type,version' });
    if (error) {
      console.error(`  FAIL v${p.version}: ${error.message}`);
    } else {
      console.log(`  OK   v${p.version} upserted`);
      okCount++;
    }
  }
  console.log(`\nDone. ${okCount}/${targets.length} succeeded.`);

  if (okCount === targets.length) {
    const { data: active } = await supabase
      .from('agent_prompt')
      .select('version, length:system_prompt')
      .eq('agent_type', 'vignette_writer')
      .eq('is_active', true);
    console.log(`\nActive vignette_writer prompt(s) in DB: ${JSON.stringify(active)}`);
  }
}

main().catch((err) => {
  console.error('reseed crashed:', err);
  process.exit(2);
});
