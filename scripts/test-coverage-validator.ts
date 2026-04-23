/**
 * Smoke test for the Q-matrix coverage validator.
 *
 * Runs the validator against:
 *   - 1 known fully-tagged item (expect passed=true, score=10)
 *   - 1 known gappy item (expect passed=true but score<10 if only soft dims missing,
 *     or passed=false if hard dims missing).
 *
 * Cleans up the validator_report rows it creates.
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
  const { createClient } = await import('@supabase/supabase-js');
  const { coverageValidator } = await import('../src/lib/factory/agents');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Resolve short ids from the audit output to full UUIDs.
  const shorts = ['0735967b', 'f9a4cb2e'];
  const { data: allPassed } = await supabase
    .from('item_draft')
    .select('id')
    .in('status', ['published', 'passed']);
  const shortToFull = new Map<string, string>();
  for (const row of allPassed ?? []) {
    const short = (row as { id: string }).id.slice(0, 8);
    if (shorts.includes(short)) shortToFull.set(short, (row as { id: string }).id);
  }
  const fullyTaggedId = shortToFull.get('0735967b');
  const gappyId = shortToFull.get('f9a4cb2e');

  const reportIds: string[] = [];
  for (const [label, fullId, expectation] of [
    ['fully-tagged', fullyTaggedId, 'score=10, passed=true'],
    ['gappy-soft-only', gappyId, 'score≈9, passed=true (both missing dims are soft)'],
  ] as const) {
    if (!fullId) {
      console.log(`[${label}] not found — skipping`);
      continue;
    }
    const { data: draft, error } = await supabase
      .from('item_draft')
      .select('*')
      .eq('id', fullId)
      .single();
    if (error || !draft) {
      console.log(`[${label}] fetch failed: ${error?.message}`);
      continue;
    }
    const context = { pipelineRunId: 'coverage-smoke', mockMode: false } as Parameters<typeof coverageValidator.run>[0];
    const res = await coverageValidator.run(context, { draft });
    console.log(`\n━━━ ${label} (${draft.id.slice(0, 8)}) — expected: ${expectation} ━━━`);
    console.log(`  passed: ${res.data?.passed}`);
    console.log(`  score:  ${res.data?.score}`);
    console.log(`  issues:`);
    for (const i of res.data?.issues_found ?? []) console.log(`    - ${i}`);
    console.log(`  repair: ${res.data?.repair_instructions ?? '(none)'}`);
    if (res.data?.reportId) reportIds.push(res.data.reportId);
  }

  // Cleanup the test validator_report rows so we don't pollute telemetry.
  if (reportIds.length > 0) {
    const { error } = await supabase.from('validator_report').delete().in('id', reportIds);
    if (error) console.warn(`Cleanup failed: ${error.message}`);
    else console.log(`\nCleaned up ${reportIds.length} test validator_report rows.`);
  }
}

main().catch((err) => {
  console.error('Crashed:', err);
  process.exit(2);
});
