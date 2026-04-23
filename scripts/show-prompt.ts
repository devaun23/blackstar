/**
 * Print a slice of the live agent_prompt.user_prompt_template containing a search phrase.
 * Usage: npx tsx scripts/show-prompt.ts explanation_writer nbme_lead_ins
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const [agentType, search] = process.argv.slice(2);
  if (!agentType) {
    console.error('usage: show-prompt.ts <agent_type> [search_phrase]');
    process.exit(1);
  }
  const { data } = await supabase
    .from('agent_prompt')
    .select('version, is_active, user_prompt_template')
    .eq('agent_type', agentType)
    .eq('is_active', true)
    .single();
  if (!data) { console.error('not found'); return; }
  const tpl = data.user_prompt_template as string;
  console.log(`=== ${agentType} v${data.version} (active), ${tpl.length} chars ===\n`);
  if (search) {
    const idx = tpl.indexOf(search);
    if (idx < 0) { console.log(`"${search}" NOT found.`); return; }
    console.log(`Found at offset ${idx}. Surrounding ±200 chars:\n`);
    console.log(tpl.slice(Math.max(0, idx - 200), idx + search.length + 200));
    console.log('\n---\nAll unfilled placeholders in template:');
    const vars = [...tpl.matchAll(/{{(\w+)}}/g)].map((m) => m[1]);
    for (const v of [...new Set(vars)]) console.log(`  {{${v}}}`);
  } else {
    console.log(tpl);
  }
}
main().catch(console.error);
