/**
 * Batch adversarial-student audit (B7).
 *
 * Runs the adversarial-student validator (B1) against every published item
 * and writes a markdown report at pilot/adversarial-audit-{date}.md plus a
 * TTY summary. The kill rate from this audit is the ship/no-ship gate for
 * the r/Step2 launch window.
 *
 * Usage:
 *   npx tsx scripts/audit-adversarial-batch.ts
 *   npx tsx scripts/audit-adversarial-batch.ts --shelf=medicine
 *   npx tsx scripts/audit-adversarial-batch.ts --limit=5         # smoke test
 *   npx tsx scripts/audit-adversarial-batch.ts --skip-ids=a,b,c  # already audited
 *
 * Cost: ~$0.02 per item at ~1600 tokens (Sonnet). Budget ~$0.40 for 20.
 *
 * Pass threshold: ≥3 of 4 distractors survive (score ≥ 7.5).
 * Ship gate: ≤4 of 20 items failing the adversarial check.
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

const ANSI = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};

interface Args {
  shelf?: string;
  limit?: number;
  skipIds: Set<string>;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const shelf = argv.find((a) => a.startsWith('--shelf='))?.split('=')[1];
  const limitStr = argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
  const skipStr = argv.find((a) => a.startsWith('--skip-ids='))?.split('=')[1] ?? '';
  return {
    ...(shelf ? { shelf } : {}),
    ...(limitStr ? { limit: parseInt(limitStr, 10) } : {}),
    skipIds: new Set(skipStr.split(',').map((s) => s.trim()).filter(Boolean)),
  };
}

interface PilotItem {
  id: string;
  topic: string;
  system: string;
  status: string;
}

interface AuditRow {
  item: PilotItem;
  score: number;
  passed: boolean;
  surviving: number;
  eliminable_options: string[];
  cues: string[];
  weakest: string;
  repair: string | null;
  tokens: number;
  error?: string;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // ─── Load pilot items ───
  let query = supabase
    .from('item_draft')
    .select('id, status, blueprint_node:blueprint_node_id(topic, system, shelf)')
    .eq('status', 'published')
    .order('created_at', { ascending: true });
  if (args.limit) query = query.limit(args.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  type Row = {
    id: string; status: string;
    blueprint_node: { topic: string | null; system: string | null; shelf: string | null } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  const items: PilotItem[] = rows
    .filter((r) => !args.skipIds.has(r.id))
    .filter((r) => !args.shelf || r.blueprint_node?.shelf === args.shelf)
    .map((r) => ({
      id: r.id,
      topic: r.blueprint_node?.topic ?? '(no topic)',
      system: r.blueprint_node?.system ?? '(no system)',
      status: r.status,
    }));

  if (items.length === 0) {
    console.log('No items match filters. Exit.');
    return;
  }

  console.log(`\n${ANSI.bold}━━━ Adversarial-student batch audit ━━━${ANSI.reset}`);
  console.log(`${ANSI.dim}generated ${new Date().toISOString()}${ANSI.reset}`);
  console.log(`Items to audit: ${items.length}\n`);

  // ─── Run audit ───
  const agents = await import('../src/lib/factory/agents');
  const context = { pipelineRunId: 'batch-audit', mockMode: false };

  const results: AuditRow[] = [];
  let totalTokens = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    process.stdout.write(`  [${(i + 1).toString().padStart(2)}/${items.length}] ${it.topic.slice(0, 40).padEnd(40)} `);
    try {
      const { data: draft } = await supabase.from('item_draft').select('*').eq('id', it.id).single();
      if (!draft) throw new Error('draft not found');

      const res = await agents.adversarialStudentValidator.run(context, { draft });
      totalTokens += res.tokensUsed;
      if (!res.success || !res.data) {
        const row: AuditRow = {
          item: it, score: 0, passed: false, surviving: 0,
          eliminable_options: [], cues: [], weakest: '-',
          repair: null, tokens: res.tokensUsed, error: res.error ?? 'unknown',
        };
        results.push(row);
        console.log(`${ANSI.yellow}skip${ANSI.reset}  ${row.error?.slice(0, 50)}`);
        continue;
      }
      const r = res.data;
      const elim = r.per_distractor_eliminability.filter((d) => d.eliminable).map((d) => d.option_id);
      const row: AuditRow = {
        item: it,
        score: r.score,
        passed: r.passed,
        surviving: r.surviving_distractor_count,
        eliminable_options: elim,
        cues: r.eliminability_cues_flagged,
        weakest: r.weakest_distractor,
        repair: r.repair_instructions ?? null,
        tokens: res.tokensUsed,
      };
      results.push(row);
      const verdict = row.passed
        ? `${ANSI.green}PASS${ANSI.reset}`
        : `${ANSI.red}FAIL${ANSI.reset}`;
      console.log(`${verdict}  ${row.score}/10  eliminable=[${elim.join(',') || '-'}]  ${row.tokens}t`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        item: it, score: 0, passed: false, surviving: 0,
        eliminable_options: [], cues: [], weakest: '-',
        repair: null, tokens: 0, error: msg,
      });
      console.log(`${ANSI.yellow}error${ANSI.reset}  ${msg.slice(0, 60)}`);
    }
  }

  // ─── Summary ───
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed && !r.error).length;
  const errors = results.filter((r) => r.error).length;
  const meanScore = results.filter((r) => !r.error).reduce((s, r) => s + r.score, 0) / Math.max(1, results.length - errors);

  console.log(`\n${ANSI.bold}━━━ Summary ━━━${ANSI.reset}`);
  console.log(`  Pass:   ${ANSI.green}${passed}${ANSI.reset} / ${results.length}`);
  console.log(`  Fail:   ${ANSI.red}${failed}${ANSI.reset} / ${results.length}`);
  if (errors > 0) console.log(`  Error:  ${ANSI.yellow}${errors}${ANSI.reset} / ${results.length}`);
  console.log(`  Mean score: ${meanScore.toFixed(2)}/10`);
  console.log(`  Total tokens: ${totalTokens.toLocaleString()}`);

  const shipGate = failed <= 4; // ≤4/20 failing
  if (results.length >= 15) {
    console.log(`\n${ANSI.bold}Ship gate (≤4 failing per plan):${ANSI.reset} ${
      shipGate ? `${ANSI.green}PASS — clear to post${ANSI.reset}` : `${ANSI.red}FAIL — regenerate before r/Step2${ANSI.reset}`
    }`);
  }

  // ─── Markdown report ───
  const today = new Date().toISOString().slice(0, 10);
  const reportPath = path.resolve(__dirname, `../pilot/adversarial-audit-${today}.md`);
  const lines: string[] = [];
  lines.push(`# Adversarial-student audit — ${today}`);
  lines.push('');
  lines.push(`Items audited: **${results.length}**  ·  Pass: **${passed}**  ·  Fail: **${failed}**  ·  Mean score: **${meanScore.toFixed(2)}/10**`);
  lines.push(`Total tokens: ${totalTokens.toLocaleString()}.`);
  lines.push('');
  lines.push('## Per-item results');
  lines.push('');
  lines.push('| # | Topic | System | Verdict | Score | Eliminable | Cues flagged |');
  lines.push('|---|-------|--------|---------|-------|------------|--------------|');
  results.forEach((r, idx) => {
    const verdict = r.error ? 'ERROR' : (r.passed ? 'PASS' : 'FAIL');
    const elim = r.eliminable_options.join(',') || '—';
    const cues = r.cues.join(', ') || '—';
    lines.push(`| ${idx + 1} | ${r.item.topic} | ${r.item.system} | ${verdict} | ${r.score}/10 | ${elim} | ${cues} |`);
  });
  lines.push('');
  lines.push('## Failing items — repair instructions');
  lines.push('');
  for (const r of results.filter((x) => !x.passed && !x.error)) {
    lines.push(`### ${r.item.topic} (${r.item.id.slice(0, 8)})`);
    lines.push(`- score **${r.score}/10**, eliminable: ${r.eliminable_options.join(', ') || '—'}, weakest: ${r.weakest}`);
    lines.push(`- cues: ${r.cues.join(', ') || '—'}`);
    if (r.repair) {
      lines.push('');
      lines.push(`> ${r.repair}`);
    }
    lines.push('');
  }
  if (errors > 0) {
    lines.push('## Errors');
    lines.push('');
    for (const r of results.filter((x) => x.error)) {
      lines.push(`- **${r.item.topic}** (${r.item.id.slice(0, 8)}): ${r.error}`);
    }
    lines.push('');
  }
  lines.push('## Ship gate');
  lines.push('');
  lines.push(`Per plan: ≤4 of ${results.length} failing → ship.`);
  lines.push(`Result: **${failed}** failing → ${failed <= 4 ? '**PASS** — clear to post r/Step2.' : '**FAIL** — regenerate distractors before posting.'}`);
  fs.writeFileSync(reportPath, lines.join('\n') + '\n');
  console.log(`\n${ANSI.dim}wrote report: ${reportPath}${ANSI.reset}\n`);
}

main().catch((err) => {
  console.error('batch audit crashed:', err);
  process.exit(2);
});
