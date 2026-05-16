/**
 * Re-validate a single existing item_draft against one (or all) validators.
 *
 * Purpose: empirical prompt-tuning loop for new validators. When we're
 * iterating on the adversarial-student or jury prompts, we don't want to
 * rebuild the whole pipeline — we want to run the new validator against
 * the 20 known pilot items and inspect the output until the prompt
 * matches what we'd flag by hand.
 *
 * Usage:
 *   npx tsx scripts/re-validate-draft.ts --draft-id <uuid> --validator <name>
 *   npx tsx scripts/re-validate-draft.ts --draft-id <uuid> --validator all-new
 *
 * Validator names:
 *   option_symmetry, medical, nbme_quality, exam_translation,
 *   explanation, blueprint, coverage
 *   adversarial_student  (B1 — wired up once the agent lands)
 *   jury                 (B2 — wired up once the agent lands)
 *   all-new              (runs adversarial_student + jury together)
 *
 * Flags:
 *   --persist     also insert validator_report rows in the DB (default: dry-run)
 *   --json        print result as JSON instead of pretty TTY format
 *
 * READ-ONLY by default. Pass --persist to write reports.
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
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const VALIDATOR_NAMES = [
  'medical',
  'blueprint',
  'nbme_quality',
  'option_symmetry',
  'explanation',
  'exam_translation',
  'coverage',
  'adversarial_student',
  'jury',
] as const;
type ValidatorName = (typeof VALIDATOR_NAMES)[number];

const ALL_NEW: ValidatorName[] = ['adversarial_student', 'jury'];

function parseArgs(): { draftId: string; validator: string; persist: boolean; asJson: boolean } {
  const argv = process.argv.slice(2);
  const draftId = argv.find((a) => a.startsWith('--draft-id='))?.split('=')[1]
    ?? argv[argv.indexOf('--draft-id') + 1];
  const validator = argv.find((a) => a.startsWith('--validator='))?.split('=')[1]
    ?? argv[argv.indexOf('--validator') + 1];

  if (!draftId || !validator) {
    console.error('Usage: re-validate-draft.ts --draft-id <uuid> --validator <name>');
    console.error(`Validator names: ${VALIDATOR_NAMES.join(', ')}, all-new`);
    process.exit(1);
  }
  return {
    draftId,
    validator,
    persist: argv.includes('--persist'),
    asJson: argv.includes('--json'),
  };
}

async function loadDraftBundle(draftId: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: draft, error } = await supabase
    .from('item_draft')
    .select('*')
    .eq('id', draftId)
    .single();
  if (error || !draft) throw new Error(`item_draft ${draftId} not found: ${error?.message}`);

  const [nodeRes, planRes, casePlanRes] = await Promise.all([
    supabase.from('blueprint_node').select('*').eq('id', draft.blueprint_node_id).single(),
    supabase.from('item_plan').select('*').eq('id', draft.item_plan_id).single(),
    draft.case_plan_id
      ? supabase.from('case_plan').select('*').eq('id', draft.case_plan_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const node = nodeRes.data;
  const plan = planRes.data;
  const casePlan = casePlanRes.data;

  let card: unknown = null;
  let facts: unknown[] = [];
  if (plan?.algorithm_card_id) {
    const [cardRes, factsRes] = await Promise.all([
      supabase.from('algorithm_card').select('*').eq('id', plan.algorithm_card_id).single(),
      supabase.from('fact_row').select('*').eq('algorithm_card_id', plan.algorithm_card_id),
    ]);
    card = cardRes.data;
    facts = factsRes.data ?? [];
  }

  return { supabase, draft, node, plan, casePlan, card, facts };
}

async function runOne(validator: string, bundle: Awaited<ReturnType<typeof loadDraftBundle>>) {
  const { draft, node, plan, casePlan, card, facts } = bundle;
  type CardLike = Parameters<typeof import('../src/lib/factory/agents').medicalValidator.run>[1]['card'];
  type FactsLike = Parameters<typeof import('../src/lib/factory/agents').medicalValidator.run>[1]['facts'];
  type NodeLike = Parameters<typeof import('../src/lib/factory/agents').blueprintValidator.run>[1]['node'];
  const cardTyped = card as CardLike;
  const factsTyped = facts as FactsLike;
  const nodeTyped = node as NodeLike | null;

  // Lazy-import agents so a missing agent doesn't break the others.
  const agents = await import('../src/lib/factory/agents');
  const context = { pipelineRunId: 'rerun', mockMode: false };

  switch (validator) {
    case 'option_symmetry':
      return agents.optionSymmetryValidator.run(context, { draft, plan });
    case 'medical':
      if (!cardTyped) throw new Error('medical validator needs an algorithm_card — none on this draft');
      return agents.medicalValidator.run(context, { draft, card: cardTyped, facts: factsTyped, topic: nodeTyped?.topic });
    case 'nbme_quality':
      return agents.nbmeQualityValidator.run(context, { draft });
    case 'explanation':
      if (!cardTyped) throw new Error('explanation validator needs an algorithm_card');
      return agents.explanationValidator.run(context, { draft, card: cardTyped });
    case 'exam_translation':
      if (!cardTyped || !nodeTyped) throw new Error('exam_translation validator needs card + node');
      return agents.examTranslationValidator.run(context, { draft, card: cardTyped, node: nodeTyped });
    case 'blueprint':
      if (!nodeTyped) throw new Error('blueprint validator needs a node');
      return agents.blueprintValidator.run(context, { draft, node: nodeTyped });
    case 'coverage':
      return agents.coverageValidator.run(context, { draft });
    case 'adversarial_student': {
      // B1 — wire up once src/lib/factory/agents/adversarial-student-validator.ts lands.
      const mod = agents as unknown as { adversarialStudentValidator?: { run: (c: unknown, i: unknown) => Promise<unknown> } };
      if (!mod.adversarialStudentValidator) {
        throw new Error('adversarial_student validator not wired up yet — land B1 first');
      }
      return mod.adversarialStudentValidator.run(context, { draft, plan, casePlan });
    }
    case 'jury': {
      // B2 — wire up once src/lib/factory/agents/jury-validator.ts lands.
      const mod = agents as unknown as { juryValidator?: { run: (c: unknown, i: unknown) => Promise<unknown> } };
      if (!mod.juryValidator) {
        throw new Error('jury validator not wired up yet — land B2 first');
      }
      return mod.juryValidator.run(context, { draft, plan, casePlan, card });
    }
    default:
      throw new Error(`unknown validator: ${validator}`);
  }
}

function summarize(name: string, result: { success: boolean; data?: unknown; error?: string; tokensUsed?: number }, asJson: boolean) {
  if (asJson) {
    console.log(JSON.stringify({ validator: name, ...result }, null, 2));
    return;
  }

  console.log(`\n${ANSI.bold}━━━ ${name} ━━━${ANSI.reset}`);
  if (!result.success) {
    console.log(`  ${ANSI.red}FAIL TO RUN${ANSI.reset}  ${result.error ?? '(no error message)'}`);
    return;
  }

  const r = result.data as {
    passed: boolean;
    score: number;
    issues_found: string[];
    repair_instructions?: string | null;
    failure_category?: string | null;
  };
  const verdict = r.passed
    ? `${ANSI.green}PASS${ANSI.reset}`
    : `${ANSI.red}FAIL${ANSI.reset}`;
  console.log(`  Verdict: ${verdict}   Score: ${r.score}/10   Tokens: ${result.tokensUsed ?? 0}`);
  if (r.failure_category) console.log(`  Failure category: ${ANSI.yellow}${r.failure_category}${ANSI.reset}`);
  if (r.issues_found && r.issues_found.length > 0) {
    console.log(`  Issues:`);
    for (const issue of r.issues_found) console.log(`    • ${issue}`);
  }
  if (r.repair_instructions) console.log(`  Repair: ${ANSI.dim}${r.repair_instructions}${ANSI.reset}`);
}

async function main(): Promise<void> {
  const { draftId, validator, persist, asJson } = parseArgs();

  if (!persist) {
    console.error(`${ANSI.dim}(dry-run — pass --persist to write validator_report rows)${ANSI.reset}`);
  }

  const bundle = await loadDraftBundle(draftId);
  console.log(`Loaded draft ${draftId.slice(0, 8)}... topic="${bundle.node?.topic ?? '?'}" status=${bundle.draft.status}`);

  const toRun = validator === 'all-new' ? ALL_NEW : [validator];

  for (const v of toRun) {
    try {
      const result = await runOne(v, bundle);
      summarize(v, result as never, asJson);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`\n${ANSI.bold}━━━ ${v} ━━━${ANSI.reset}`);
      console.log(`  ${ANSI.red}SKIPPED${ANSI.reset}  ${msg}`);
    }
  }
}

main().catch((err) => {
  console.error('re-validate-draft crashed:', err);
  process.exit(2);
});
