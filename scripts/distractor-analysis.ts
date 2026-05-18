/**
 * Distractor-functioning post-processor.
 *
 * Reads attempt_v2.distractor_chosen (added in migration v29) and computes
 * per-question, per-option psychometric stats that calibrate-irt.ts does NOT
 * cover. Together with scripts/calibrate-irt.ts (item difficulty +
 * discrimination), this is the full item-analysis pipeline alpha needs.
 *
 * Per question, computes:
 *   - per-option pick rate (across all users)
 *   - per-option pick rate among HIGH performers (top quartile by overall accuracy)
 *   - per-option pick rate among LOW performers (bottom quartile)
 *
 * Flags:
 *   - MISKEY_CANDIDATE: high performers pick a wrong distractor >30%
 *     (distractor may be miskeyed, or testing a subtler reasoning path)
 *   - TOO_EASY: low performers pick the correct answer >70%
 *     (item doesn't discriminate; retire or boost difficulty)
 *   - DEAD_DISTRACTOR: any option picked by <5% of all users
 *     (distractor functions as a throwaway; rewrite or remove)
 *
 * Output: extends item_performance.distractor_distribution (JSONB column).
 *
 * Usage:
 *   npx tsx scripts/distractor-analysis.ts                       # production defaults
 *   npx tsx scripts/distractor-analysis.ts --dry-run             # estimate + print, no DB write
 *   npx tsx scripts/distractor-analysis.ts --min-responses 20    # lower threshold for early alpha
 *   npx tsx scripts/distractor-analysis.ts --min-users 5
 */

import * as fs from 'fs';
import * as path from 'path';

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
}

function parseArgs(argv: string[]): Args {
  const a: Args = { dryRun: false, minResponses: 30, minUsers: 10 };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--dry-run') a.dryRun = true;
    else if (v === '--min-responses') a.minResponses = parseInt(argv[++i]!, 10);
    else if (v === '--min-users') a.minUsers = parseInt(argv[++i]!, 10);
  }
  return a;
}

type Letter = 'A' | 'B' | 'C' | 'D' | 'E';
const LETTERS: readonly Letter[] = ['A', 'B', 'C', 'D', 'E'] as const;

interface AttemptRow {
  user_id: string;
  item_draft_id: string | null;
  question_id: string | null;
  selected_answer: Letter;
  is_correct: boolean;
  distractor_chosen: Letter | null;
}

interface ItemStats {
  itemId: string;
  source: 'item_draft' | 'question';
  totalAttempts: number;
  distinctUsers: number;
  optionPickRates: Record<Letter, number>;
  optionPickRatesHigh: Record<Letter, number>;
  optionPickRatesLow: Record<Letter, number>;
  correctAnswer: Letter | null;
  flags: string[];
}

function emptyPickRates(): Record<Letter, number> {
  return { A: 0, B: 0, C: 0, D: 0, E: 0 };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  console.log('\n━━━ Distractor functioning analysis ━━━');
  console.log(`Thresholds: >= ${args.minResponses} attempts/item, >= ${args.minUsers} distinct users.`);
  if (args.dryRun) console.log('Dry-run mode: no DB writes.\n');
  else console.log();

  // Pull attempt_v2 rows. Limit guards against runaway corpus.
  const { data: rowsRaw, error: aErr } = await supabase
    .from('attempt_v2')
    .select('user_id, item_draft_id, question_id, selected_answer, is_correct, distractor_chosen')
    .limit(500000);
  if (aErr) throw new Error(`attempt_v2 fetch failed: ${aErr.message}`);
  const rows = (rowsRaw ?? []) as AttemptRow[];
  console.log(`Pulled ${rows.length} attempts.`);

  // ─── Step 1: Per-user accuracy → high/low quartile labels ─────────────────
  const userAccuracy = new Map<string, { total: number; correct: number }>();
  for (const r of rows) {
    const entry = userAccuracy.get(r.user_id) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (r.is_correct) entry.correct += 1;
    userAccuracy.set(r.user_id, entry);
  }
  // Only rank users with enough data to be reliable (≥10 attempts).
  const rankedUsers = [...userAccuracy.entries()]
    .filter(([, v]) => v.total >= 10)
    .map(([uid, v]) => ({ uid, acc: v.correct / v.total }))
    .sort((a, b) => b.acc - a.acc);
  const q1Cut = Math.floor(rankedUsers.length * 0.25);
  const q3Cut = Math.floor(rankedUsers.length * 0.75);
  const highUsers = new Set(rankedUsers.slice(0, q1Cut).map((r) => r.uid));
  const lowUsers = new Set(rankedUsers.slice(q3Cut).map((r) => r.uid));
  console.log(`Ranked ${rankedUsers.length} users with ≥10 attempts; high quartile=${highUsers.size}, low quartile=${lowUsers.size}.`);

  // ─── Step 2: Per-item aggregation ─────────────────────────────────────────
  // Bucket by (source, itemId) so item_draft and question rows stay separate.
  type Bucket = {
    source: 'item_draft' | 'question';
    itemId: string;
    users: Set<string>;
    picksAll: Record<Letter, number>;
    picksHigh: Record<Letter, number>;
    picksLow: Record<Letter, number>;
    totalAll: number;
    totalHigh: number;
    totalLow: number;
    correctCountAll: number;
    correctCountLow: number;
  };
  const buckets = new Map<string, Bucket>();
  for (const r of rows) {
    const source = r.item_draft_id ? 'item_draft' : r.question_id ? 'question' : null;
    if (!source) continue;
    const itemId = r.item_draft_id ?? r.question_id!;
    const key = `${source}:${itemId}`;
    let b = buckets.get(key);
    if (!b) {
      b = {
        source,
        itemId,
        users: new Set(),
        picksAll: emptyPickRates(),
        picksHigh: emptyPickRates(),
        picksLow: emptyPickRates(),
        totalAll: 0,
        totalHigh: 0,
        totalLow: 0,
        correctCountAll: 0,
        correctCountLow: 0,
      };
      buckets.set(key, b);
    }
    b.users.add(r.user_id);
    b.picksAll[r.selected_answer] += 1;
    b.totalAll += 1;
    if (r.is_correct) b.correctCountAll += 1;
    if (highUsers.has(r.user_id)) {
      b.picksHigh[r.selected_answer] += 1;
      b.totalHigh += 1;
    }
    if (lowUsers.has(r.user_id)) {
      b.picksLow[r.selected_answer] += 1;
      b.totalLow += 1;
      if (r.is_correct) b.correctCountLow += 1;
    }
  }
  console.log(`Aggregated ${buckets.size} unique items.`);

  // ─── Step 3: Resolve correct answers ──────────────────────────────────────
  const itemDraftIds = [...buckets.values()].filter((b) => b.source === 'item_draft').map((b) => b.itemId);
  const questionIds = [...buckets.values()].filter((b) => b.source === 'question').map((b) => b.itemId);
  const correctByItem = new Map<string, Letter>();
  if (itemDraftIds.length > 0) {
    const { data: drafts } = await supabase
      .from('item_draft')
      .select('id, correct_answer')
      .in('id', itemDraftIds);
    for (const d of drafts ?? []) {
      if (d.correct_answer) correctByItem.set(`item_draft:${d.id}`, d.correct_answer as Letter);
    }
  }
  if (questionIds.length > 0) {
    const { data: qs } = await supabase
      .from('questions')
      .select('id, correct_answer')
      .in('id', questionIds);
    for (const q of qs ?? []) {
      if (q.correct_answer) correctByItem.set(`question:${q.id}`, q.correct_answer as Letter);
    }
  }

  // ─── Step 4: Compute stats + flags per item ───────────────────────────────
  const out: ItemStats[] = [];
  for (const [key, b] of buckets) {
    if (b.totalAll < args.minResponses || b.users.size < args.minUsers) continue;

    const correctAnswer = correctByItem.get(key) ?? null;
    const pickRate = (n: number, total: number) => (total === 0 ? 0 : n / total);
    const allRates: Record<Letter, number> = emptyPickRates();
    const highRates: Record<Letter, number> = emptyPickRates();
    const lowRates: Record<Letter, number> = emptyPickRates();
    for (const L of LETTERS) {
      allRates[L] = pickRate(b.picksAll[L], b.totalAll);
      highRates[L] = pickRate(b.picksHigh[L], b.totalHigh);
      lowRates[L] = pickRate(b.picksLow[L], b.totalLow);
    }

    const flags: string[] = [];

    // MISKEY_CANDIDATE: high performers picking a wrong distractor >30%
    if (correctAnswer) {
      for (const L of LETTERS) {
        if (L !== correctAnswer && highRates[L] > 0.30 && b.totalHigh >= 5) {
          flags.push(`MISKEY_CANDIDATE:${L}(high=${(highRates[L] * 100).toFixed(0)}%)`);
        }
      }
    }
    // TOO_EASY: low performers picking correct >70%
    if (correctAnswer && b.totalLow >= 5) {
      const lowCorrectRate = lowRates[correctAnswer];
      if (lowCorrectRate > 0.70) {
        flags.push(`TOO_EASY(low_correct=${(lowCorrectRate * 100).toFixed(0)}%)`);
      }
    }
    // DEAD_DISTRACTOR: any option picked by <5% of all users
    if (correctAnswer) {
      for (const L of LETTERS) {
        if (L !== correctAnswer && allRates[L] < 0.05) {
          flags.push(`DEAD_DISTRACTOR:${L}(${(allRates[L] * 100).toFixed(1)}%)`);
        }
      }
    }

    out.push({
      itemId: b.itemId,
      source: b.source,
      totalAttempts: b.totalAll,
      distinctUsers: b.users.size,
      optionPickRates: allRates,
      optionPickRatesHigh: highRates,
      optionPickRatesLow: lowRates,
      correctAnswer,
      flags,
    });
  }
  console.log(`Items meeting threshold: ${out.length} of ${buckets.size}.`);
  console.log(`Items with flags: ${out.filter((o) => o.flags.length > 0).length}.\n`);

  // ─── Step 5: Print summary, write to item_performance ─────────────────────
  for (const item of out.filter((o) => o.flags.length > 0).slice(0, 20)) {
    console.log(`${item.source}:${item.itemId.slice(0, 8)}  n=${item.totalAttempts}  correct=${item.correctAnswer ?? '?'}  flags=${item.flags.join(' ')}`);
  }
  if (out.filter((o) => o.flags.length > 0).length > 20) {
    console.log(`...and ${out.filter((o) => o.flags.length > 0).length - 20} more flagged items.\n`);
  }

  if (args.dryRun) {
    console.log('\n[Dry-run] No DB writes performed.');
    return;
  }

  // Write each item's distribution into item_performance.distractor_distribution.
  // Schema is item_performance (id, item_draft_id, distractor_distribution jsonb,
  // flagged_for_review bool, ...). We only update item_draft-source rows because
  // item_performance is keyed on item_draft_id.
  let written = 0;
  for (const item of out) {
    if (item.source !== 'item_draft') continue;
    const payload = {
      computed_at: new Date().toISOString(),
      total_attempts: item.totalAttempts,
      distinct_users: item.distinctUsers,
      correct_answer: item.correctAnswer,
      pick_rates_all: item.optionPickRates,
      pick_rates_high_quartile: item.optionPickRatesHigh,
      pick_rates_low_quartile: item.optionPickRatesLow,
      flags: item.flags,
    };
    const { error } = await supabase
      .from('item_performance')
      .upsert(
        {
          item_draft_id: item.itemId,
          distractor_distribution: payload,
          flagged_for_review: item.flags.length > 0,
        },
        { onConflict: 'item_draft_id' },
      );
    if (error) {
      console.warn(`[write fail] ${item.itemId.slice(0, 8)}: ${error.message}`);
      continue;
    }
    written += 1;
  }
  console.log(`\nWrote ${written} item_performance rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
