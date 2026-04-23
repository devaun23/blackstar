/**
 * Audit NBME topic coverage vs. blueprint_node coverage.
 * Highlights the gap: NBME CCSS topics with no matching blueprint.
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
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

  const { data: nbmeRows } = await supabase
    .from('di_evidence_item')
    .select('topic_tags')
    .eq('source', 'nbme')
    .limit(200);

  const nbmeTopics = new Set<string>();
  for (const r of (nbmeRows ?? []) as Array<{ topic_tags: string[] }>) {
    for (const t of r.topic_tags ?? []) nbmeTopics.add(t);
  }

  const { count: bpTotal } = await supabase
    .from('blueprint_node')
    .select('*', { count: 'exact', head: true });

  const { data: bpSample } = await supabase
    .from('blueprint_node')
    .select('topic')
    .limit(1000);

  const bpTopics = new Set<string>();
  for (const r of (bpSample ?? []) as Array<{ topic: string }>) bpTopics.add(r.topic);

  console.log(`\n═══ Coverage audit ═══`);
  console.log(`NBME-tagged topics (from di_evidence_item): ${nbmeTopics.size}`);
  console.log(`blueprint_node total rows: ${bpTotal}`);
  console.log(`Distinct blueprint_node topics (sampled): ${bpTopics.size}`);

  const overlap = [...nbmeTopics].filter((t) => bpTopics.has(t));
  console.log(`\nOverlap (NBME ∩ blueprint_node): ${overlap.length}`);
  for (const t of overlap) console.log(`  ✓ ${t}`);

  const nbmeOnly = [...nbmeTopics].filter((t) => !bpTopics.has(t));
  console.log(`\nNBME topics WITHOUT a blueprint_node (${nbmeOnly.length}):`);
  for (const t of nbmeOnly.sort()) console.log(`  ✗ ${t}`);

  // Sample of existing blueprint_node topics for pattern reference
  const bpSamples = [...bpTopics].sort().slice(0, 20);
  console.log(`\nSample of existing blueprint_node topics (first 20 of ${bpTopics.size}):`);
  for (const t of bpSamples) console.log(`    ${t}`);

  // Does the factory have any topic aliases?
  const { data: aliasRows } = await supabase.from('alternate_terminology').select('*').limit(5);
  console.log(`\nalternate_terminology rows (sampled): ${aliasRows?.length ?? 0}`);
  if (aliasRows && aliasRows.length > 0) {
    for (const r of aliasRows) console.log(`  ${JSON.stringify(r)}`);
  }
}

main().catch(console.error);
