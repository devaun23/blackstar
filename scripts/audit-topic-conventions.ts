/**
 * Sample topic_tags from each source to see the casing convention.
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

  const sources = ['divine_intervention', 'inner_circle', 'amboss', 'emma_holliday', 'nbme'];
  for (const src of sources) {
    const { data } = await supabase
      .from('di_evidence_item')
      .select('topic_tags')
      .eq('source', src)
      .limit(10);

    const tags = new Set<string>();
    for (const r of (data ?? []) as Array<{ topic_tags: string[] }>) {
      for (const t of r.topic_tags ?? []) tags.add(t);
    }
    console.log(`\n${src} — sample topic_tags (${tags.size} distinct in sample):`);
    for (const t of [...tags].slice(0, 12)) console.log(`  "${t}"`);
  }
}

main().catch(console.error);
