/**
 * Batch jury-validator audit (F1 — v27 post-merge follow-up).
 *
 * Runs the jury validator (B2) against every published item. A second model
 * (default gpt-5) attempts the question; Claude classifies the verdict as
 * right-reason / wrong-reason / wrong-answer.
 *
 * Combined with pilot/adversarial-audit-{date}.md, this gives two independent
 * quality signals:
 *   - adversarial-student: can a naive student game distractors by surface cues?
 *   - jury: does a second model arrive at the keyed answer for the keyed reason?
 *
 * Usage:
 *   npx tsx scripts/audit-jury-batch.ts
 *   npx tsx scripts/audit-jury-batch.ts --limit=1     # smoke test
 *   npx tsx scripts/audit-jury-batch.ts --shelf=medicine
 *   npx tsx scripts/audit-jury-batch.ts --jury-model=gemini-2.5-pro
 *   npx tsx scripts/audit-jury-batch.ts --skip-ids=a,b,c
 *
 * Cost: ~$0.05/item (gpt-5 jury + Claude classifier). Budget ~$0.85 for 17.
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
  juryModel?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const shelf = argv.find((a) => a.startsWith('--shelf='))?.split('=')[1];
  const limitStr = argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
  const skipStr = argv.find((a) => a.startsWith('--skip-ids='))?.split('=')[1] ?? '';
  const juryModel = argv.find((a) => a.startsWith('--jury-model='))?.split('=')[1];
  return {
    ...(shelf ? { shelf } : {}),
    ...(limitStr ? { limit: parseInt(limitStr, 10) } : {}),
    skipIds: new Set(skipStr.split(',').map((s) => s.trim()).filter(Boolean)),
    ...(juryModel ? { juryModel } : {}),
  };
}

interface PilotItem {
  id: string;
  topic: string;
  system: string;
  status: string;
}

interface JuryAuditRow {
  item: PilotItem;
  score: number;
  passed: boolean;
  verdict: 'right-reason' | 'wrong-reason' | 'wrong-answer' | null;
  jury_answer: string;
  matched_archetype: string | null;
  reasoning: string;
  issues: string[];
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

  const juryModel = args.juryModel ?? 'gpt-5';
  console.log(`\n${ANSI.bold}━━━ Jury batch audit ━━━${ANSI.reset}`);
  console.log(`${ANSI.dim}generated ${new Date().toISOString()}${ANSI.reset}`);
  console.log(`Jury model: ${juryModel}`);
  console.log(`Items to audit: ${items.length}\n`);

  const agents = await import('../src/lib/factory/agents');
  const context = { pipelineRunId: 'batch-jury', mockMode: false };

  const results: JuryAuditRow[] = [];
  let totalTokens = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    process.stdout.write(`  [${(i + 1).toString().padStart(2)}/${items.length}] ${it.topic.slice(0, 36).padEnd(36)} `);
    try {
      const [draftRes, planRes] = await Promise.all([
        supabase.from('item_draft').select('*').eq('id', it.id).single(),
        supabase.from('item_draft').select('item_plan_id, case_plan_id').eq('id', it.id).single(),
      ]);
      if (!draftRes.data) throw new Error('draft not found');
      const draft = draftRes.data;

      const [cardRow, casePlanRow] = await Promise.all([
        planRes.data?.item_plan_id
          ? (async () => {
              const ip = await supabase.from('item_plan').select('algorithm_card_id').eq('id', planRes.data!.item_plan_id).single();
              if (!ip.data?.algorithm_card_id) return null;
              const c = await supabase.from('algorithm_card').select('*').eq('id', ip.data.algorithm_card_id).single();
              return c.data;
            })()
          : Promise.resolve(null),
        planRes.data?.case_plan_id
          ? supabase.from('case_plan').select('*').eq('id', planRes.data.case_plan_id).single().then((r) => r.data)
          : Promise.resolve(null),
      ]);

      const res = await agents.juryValidator.run(context, {
        draft,
        card: cardRow as never,
        casePlan: casePlanRow as never,
        juryModel,
      });
      totalTokens += res.tokensUsed;

      if (!res.success || !res.data) {
        results.push({
          item: it, score: 0, passed: false, verdict: null, jury_answer: '-',
          matched_archetype: null, reasoning: '', issues: [], repair: null,
          tokens: res.tokensUsed, error: res.error ?? 'unknown',
        });
        console.log(`${ANSI.yellow}skip${ANSI.reset}  ${(res.error ?? '').slice(0, 50)}`);
        continue;
      }

      const r = res.data;
      const row: JuryAuditRow = {
        item: it,
        score: r.score,
        passed: r.passed,
        verdict: r.jury_verdict,
        jury_answer: r.jury_chosen_answer,
        matched_archetype: r.matched_keyed_archetype,
        reasoning: r.jury_reasoning_trace,
        issues: r.issues_found,
        repair: r.repair_instructions ?? null,
        tokens: res.tokensUsed,
      };
      results.push(row);
      const verdict = row.passed
        ? `${ANSI.green}PASS${ANSI.reset}`
        : row.verdict === 'wrong-reason'
          ? `${ANSI.yellow}WRONG-REASON${ANSI.reset}`
          : `${ANSI.red}WRONG-ANSWER${ANSI.reset}`;
      console.log(`${verdict}  jury=${row.jury_answer}  ${row.tokens}t`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        item: it, score: 0, passed: false, verdict: null, jury_answer: '-',
        matched_archetype: null, reasoning: '', issues: [], repair: null,
        tokens: 0, error: msg,
      });
      console.log(`${ANSI.yellow}error${ANSI.reset}  ${msg.slice(0, 60)}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const wrongReason = results.filter((r) => r.verdict === 'wrong-reason').length;
  const wrongAnswer = results.filter((r) => r.verdict === 'wrong-answer').length;
  const errors = results.filter((r) => r.error).length;
  const meanScore = results.filter((r) => !r.error).reduce((s, r) => s + r.score, 0) / Math.max(1, results.length - errors);

  console.log(`\n${ANSI.bold}━━━ Summary ━━━${ANSI.reset}`);
  console.log(`  PASS (right-reason):  ${ANSI.green}${passed}${ANSI.reset} / ${results.length}`);
  console.log(`  FAIL (wrong-reason):  ${ANSI.yellow}${wrongReason}${ANSI.reset} / ${results.length}`);
  console.log(`  FAIL (wrong-answer):  ${ANSI.red}${wrongAnswer}${ANSI.reset} / ${results.length}`);
  if (errors > 0) console.log(`  Error:                ${ANSI.yellow}${errors}${ANSI.reset} / ${results.length}`);
  console.log(`  Mean score: ${meanScore.toFixed(2)}/10`);
  console.log(`  Total tokens: ${totalTokens.toLocaleString()}`);

  const today = new Date().toISOString().slice(0, 10);
  const reportPath = path.resolve(__dirname, `../pilot/jury-audit-${today}.md`);
  const lines: string[] = [];
  lines.push(`# Jury battle-test audit — ${today}`);
  lines.push('');
  lines.push(`Jury model: \`${juryModel}\` · Classifier: Claude (default)`);
  lines.push(`Items audited: **${results.length}** · PASS: **${passed}** · WRONG-REASON: **${wrongReason}** · WRONG-ANSWER: **${wrongAnswer}**`);
  lines.push(`Mean score: **${meanScore.toFixed(2)}/10** · Total tokens: ${totalTokens.toLocaleString()}.`);
  lines.push('');
  lines.push('## Per-item verdicts');
  lines.push('');
  lines.push('| # | Topic | System | Keyed | Jury | Verdict | Score | Archetype |');
  lines.push('|---|-------|--------|-------|------|---------|-------|-----------|');
  results.forEach((r, idx) => {
    const v = r.error ? 'ERROR' : (r.verdict ?? '—');
    lines.push(`| ${idx + 1} | ${r.item.topic} | ${r.item.system} | (see DB) | ${r.jury_answer} | ${v} | ${r.score}/10 | ${r.matched_archetype ?? '—'} |`);
  });
  lines.push('');
  lines.push('## Failing items — reasoning traces');
  lines.push('');
  for (const r of results.filter((x) => !x.passed && !x.error)) {
    lines.push(`### ${r.item.topic} (${r.item.id.slice(0, 8)})`);
    lines.push(`- verdict: **${r.verdict}**, jury chose **${r.jury_answer}** (matched archetype: ${r.matched_archetype ?? '—'})`);
    if (r.issues.length > 0) {
      lines.push('- issues:');
      for (const i of r.issues) lines.push(`  - ${i}`);
    }
    lines.push('');
    lines.push('**Jury reasoning:**');
    lines.push('');
    lines.push(`> ${r.reasoning.replace(/\n/g, '\n> ')}`);
    if (r.repair) {
      lines.push('');
      lines.push(`**Repair:** ${r.repair}`);
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
  fs.writeFileSync(reportPath, lines.join('\n') + '\n');
  console.log(`\n${ANSI.dim}wrote report: ${reportPath}${ANSI.reset}\n`);
}

main().catch((err) => {
  console.error('jury batch crashed:', err);
  process.exit(2);
});
