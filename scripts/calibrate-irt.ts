/**
 * IRT calibration job.
 *
 * Reads user_responses, fits a 2PL model across items that cleared the
 * per-item response threshold, and writes back to item_performance:
 *   - item_difficulty    = b_i
 *   - discrimination_index = a_i
 *   - item_guessing      = left at default (0.2 for 5-choice MCQ)
 *
 * Refuses to run (fails loud) if the dataset is below the thresholds documented
 * in MEASUREMENT_SCIENCE_ROADMAP.md §2 Phase B:
 *   - Default: at least MIN_ITEMS items each with >= MIN_RESPONSES_PER_ITEM
 *     responses across >= MIN_DISTINCT_USERS distinct users.
 * You can override thresholds via --min-responses, --min-users, --min-items for
 * dry-runs, but the job warns loudly in that case.
 *
 * Job is idempotent: re-running recomputes params and overwrites item_performance
 * rows. It never destroys responses.
 *
 * Usage:
 *   npx tsx scripts/calibrate-irt.ts                  # production defaults
 *   npx tsx scripts/calibrate-irt.ts --dry-run        # estimate + print, no DB write
 *   npx tsx scripts/calibrate-irt.ts --min-responses 20 --min-users 5 --min-items 5
 */

import * as fs from 'fs';
import * as path from 'path';
import { fit2PL, type Response } from '../src/lib/factory/psychometrics/irt-2pl';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

interface Args {
  dryRun: boolean;
  minResponses: number;
  minUsers: number;
  minItems: number;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    dryRun: false,
    minResponses: 500,
    minUsers: 100,
    minItems: 30,
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--dry-run') a.dryRun = true;
    else if (v === '--force') a.force = true;
    else if (v === '--min-responses') a.minResponses = parseInt(argv[++i]!, 10);
    else if (v === '--min-users') a.minUsers = parseInt(argv[++i]!, 10);
    else if (v === '--min-items') a.minItems = parseInt(argv[++i]!, 10);
  }
  return a;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  console.log('\n━━━ IRT 2PL calibration ━━━');
  console.log(
    `Thresholds: >= ${args.minResponses} responses/item, >= ${args.minUsers} distinct users, >= ${args.minItems} items.`,
  );
  if (args.dryRun) console.log('Dry-run mode: no DB writes.');
  console.log();

  // Pull responses. Scope is published items only — calibrating against
  // still-drafting items pollutes params with test traffic.
  const { data: responsesRaw, error: rErr } = await supabase
    .from('user_responses')
    .select('user_id, item_draft_id, is_correct, item_draft:item_draft_id(status)')
    .limit(200000); // Guard against runaway queries; bump if corpus grows past this.
  if (rErr) throw new Error(`user_responses fetch failed: ${rErr.message}`);

  type RawRow = {
    user_id: string;
    item_draft_id: string;
    is_correct: boolean;
    item_draft: { status: string } | null;
  };
  const rows = (responsesRaw ?? []) as unknown as RawRow[];
  const publishedRows = rows.filter((r) => r.item_draft?.status === 'published');

  console.log(`Rows pulled: ${rows.length} (${publishedRows.length} against published items)`);

  // Aggregate per-item stats
  const byItem = new Map<string, { users: Set<string>; correct: number; wrong: number }>();
  for (const r of publishedRows) {
    let rec = byItem.get(r.item_draft_id);
    if (!rec) {
      rec = { users: new Set(), correct: 0, wrong: 0 };
      byItem.set(r.item_draft_id, rec);
    }
    rec.users.add(r.user_id);
    if (r.is_correct) rec.correct++;
    else rec.wrong++;
  }

  const eligibleItems: string[] = [];
  for (const [itemId, stats] of byItem.entries()) {
    const total = stats.correct + stats.wrong;
    if (total >= args.minResponses) eligibleItems.push(itemId);
  }
  const distinctUsers = new Set(publishedRows.map((r) => r.user_id)).size;

  console.log(`Distinct users:  ${distinctUsers} (threshold ${args.minUsers})`);
  console.log(`Items with >= ${args.minResponses} responses: ${eligibleItems.length} (threshold ${args.minItems})`);

  const belowThreshold =
    distinctUsers < args.minUsers ||
    eligibleItems.length < args.minItems;

  if (belowThreshold && !args.force) {
    console.error(
      `\n✗ Below calibration threshold.\n` +
      `  Need >= ${args.minUsers} distinct users AND >= ${args.minItems} items with >= ${args.minResponses} responses.\n` +
      `  Current response volume is insufficient for IRT 2PL to produce reliable item params.\n` +
      `  Options: (1) wait for more pilot data, (2) pass --force to calibrate anyway (noisy),\n` +
      `           (3) relax thresholds with --min-responses / --min-users / --min-items for dry-runs.\n`,
    );
    process.exit(1);
  }
  if (belowThreshold && args.force) {
    console.warn('⚠ --force set; calibrating on sub-threshold data. Params will be noisy.');
  }

  if (eligibleItems.length === 0) {
    console.log('Nothing to calibrate. Exit.');
    return;
  }

  // Map DB ids to contiguous indices for the estimator
  const userIds = [...new Set(publishedRows.map((r) => r.user_id))];
  const userIdx = new Map<string, number>();
  userIds.forEach((u, i) => userIdx.set(u, i));
  const itemIdx = new Map<string, number>();
  eligibleItems.forEach((it, i) => itemIdx.set(it, i));

  const irtResponses: Response[] = [];
  for (const r of publishedRows) {
    const ii = itemIdx.get(r.item_draft_id);
    if (ii === undefined) continue;
    const uu = userIdx.get(r.user_id)!;
    irtResponses.push({
      userIdx: uu,
      itemIdx: ii,
      correct: r.is_correct ? 1 : 0,
    });
  }

  console.log(`\nFitting 2PL on ${userIds.length} users × ${eligibleItems.length} items (${irtResponses.length} responses)...`);
  const t0 = Date.now();
  const fit = fit2PL(userIds.length, eligibleItems.length, irtResponses, {
    maxIterations: 50,
    tolerance: 1e-4,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`Fit complete in ${elapsed}s (${fit.iterations} iter${fit.converged ? ', converged' : ', max iter reached'}).`);

  const aVals = fit.items.map((it) => it.a);
  const bVals = fit.items.map((it) => it.b);
  console.log(`  a range: ${Math.min(...aVals).toFixed(2)} .. ${Math.max(...aVals).toFixed(2)} (mean ${(aVals.reduce((s, v) => s + v, 0) / aVals.length).toFixed(2)})`);
  console.log(`  b range: ${Math.min(...bVals).toFixed(2)} .. ${Math.max(...bVals).toFixed(2)} (mean ${(bVals.reduce((s, v) => s + v, 0) / bVals.length).toFixed(2)})`);
  console.log(`  θ range: ${Math.min(...fit.thetas).toFixed(2)} .. ${Math.max(...fit.thetas).toFixed(2)}`);

  if (args.dryRun) {
    console.log('\nDry-run: skipping DB writes.');
    console.log(`Would have upserted ${eligibleItems.length} item_performance rows.`);
    return;
  }

  // Upsert into item_performance. Unique on item_draft_id (see schema), so
  // onConflict: 'item_draft_id' makes this idempotent.
  console.log('\nWriting to item_performance...');
  let okCount = 0;
  let failCount = 0;
  for (let i = 0; i < eligibleItems.length; i++) {
    const itemId = eligibleItems[i]!;
    const stats = byItem.get(itemId)!;
    const total = stats.correct + stats.wrong;
    const accuracy = stats.correct / total;
    const { error } = await supabase
      .from('item_performance')
      .upsert(
        {
          item_draft_id: itemId,
          total_attempts: total,
          correct_count: stats.correct,
          accuracy_rate: Math.round(accuracy * 10000) / 10000,
          item_difficulty: Math.round(fit.items[i]!.b * 10000) / 10000,
          discrimination_index: Math.round(fit.items[i]!.a * 10000) / 10000,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'item_draft_id' },
      );
    if (error) {
      console.error(`  FAIL ${itemId.slice(0, 8)}: ${error.message}`);
      failCount++;
    } else {
      okCount++;
    }
  }
  console.log(`Done. ${okCount} ok, ${failCount} failed.`);
}

main().catch((err) => {
  console.error('Calibration crashed:', err);
  process.exit(2);
});
