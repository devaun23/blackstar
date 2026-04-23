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
  const { data } = await supabase.from('blueprint_node').select('topic').limit(3000);
  const s = new Set<string>();
  for (const r of (data ?? []) as Array<{ topic: string }>) s.add(r.topic);
  console.log([...s].sort().join('\n'));
}
main().catch(console.error);
