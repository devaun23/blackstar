// Offline simulator harness.
//
// Runs a SimulatedStudent through N published item_drafts, pipes each response
// through the active ActionPolicy, and writes a simulator_run + N
// simulated_response rows with summary metrics. Phase A uses FixtureStudent;
// Phase B swaps in SimulatedStudentAgent and adds more personas/policies.
//
// Usage:
//   npx tsx scripts/simulate-students.ts --persona fixture_v1 --items 15 --policy rule
//
// Exits non-zero on config errors. Metrics written to simulator_run.metrics.

import { createAdminClient } from '../src/lib/supabase/admin';
import { getActionPolicy } from '../src/lib/learner/policy';
import { FixtureStudent, FIXTURE_V1 } from '../src/lib/learner/simulator/fixture-student';
import type {
  Persona,
  SimulatedItem,
  SimulatedStudent,
} from '../src/lib/learner/simulator/types';

interface Args {
  personaId: string;
  nItems: number;
  policyName: string;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--persona') args.personaId = argv[++i];
    else if (a === '--items') args.nItems = Number(argv[++i]);
    else if (a === '--policy') args.policyName = argv[++i];
  }
  if (!args.personaId || !args.nItems || !args.policyName) {
    console.error('Usage: simulate-students.ts --persona <id> --items <n> --policy <name>');
    process.exit(2);
  }
  return args as Args;
}

function resolvePersona(id: string): Persona {
  if (id === FIXTURE_V1.id) return FIXTURE_V1;
  console.error(`Unknown persona: ${id}. Phase A ships only "${FIXTURE_V1.id}".`);
  process.exit(2);
}

function resolveStudent(persona: Persona, policyName: string): SimulatedStudent {
  if (policyName === 'rule') return new FixtureStudent(persona);
  console.error(`Unknown policy: ${policyName}. Phase A supports only "rule".`);
  process.exit(2);
}

async function loadItems(nItems: number): Promise<SimulatedItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('item_draft')
    .select('id, correct_answer, case_plan!left(target_transfer_rule_id, target_confusion_set_id, target_cognitive_error_id, target_action_class_id, target_hinge_clue_type_id)')
    .eq('status', 'published')
    .limit(nItems);

  if (error) {
    console.error('Failed to load items:', error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.error('No published item_drafts found.');
    process.exit(1);
  }

  return data.map((d) => {
    const cp = Array.isArray(d.case_plan) ? d.case_plan[0] : d.case_plan;
    return {
      itemDraftId: d.id,
      correctAnswer: d.correct_answer as 'A' | 'B' | 'C' | 'D' | 'E',
      targets: cp
        ? {
            transferRuleId: cp.target_transfer_rule_id ?? null,
            confusionSetId: cp.target_confusion_set_id ?? null,
            cognitiveErrorId: cp.target_cognitive_error_id ?? null,
            actionClassId: cp.target_action_class_id ?? null,
            hingeClueTypeId: cp.target_hinge_clue_type_id ?? null,
          }
        : undefined,
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const persona = resolvePersona(args.personaId);
  const student = resolveStudent(persona, args.policyName);
  const items = await loadItems(args.nItems);

  console.log(`Running ${student.personaId} × ${args.policyName} on ${items.length} items`);

  const supabase = createAdminClient();
  const actionPolicy = getActionPolicy(null);

  // Insert the run row first so we have a FK for simulated_response.
  const { data: runRow, error: runErr } = await supabase
    .from('simulator_run')
    .insert({
      persona_id: student.personaId,
      policy_name: args.policyName,
      n_items: items.length,
      metrics: {},
      git_sha: process.env.GIT_SHA ?? null,
    })
    .select('id')
    .single();

  if (runErr || !runRow) {
    console.error('Failed to create simulator_run:', runErr?.message);
    process.exit(1);
  }

  let correct = 0;
  let totalTime = 0;
  const actionCounts: Record<string, number> = {};
  const responseRows: Array<Record<string, unknown>> = [];

  for (const item of items) {
    const response = await student.answer(item);
    if (response.isCorrect) correct++;
    totalTime += response.timeMs;

    const decision = await actionPolicy.choose({
      userId: `simulator:${student.personaId}`,
      attemptId: null,
      isCorrect: response.isCorrect,
      timeSpentMs: response.timeMs,
      confidencePre: response.confidence,
      diagnosedCognitiveErrorId: item.targets?.cognitiveErrorId ?? null,
      diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false,
      errorRepeatCount: 0,
      dimensionMastery: null,
      confusionSetId: item.targets?.confusionSetId ?? null,
      lastCorrectOptionFrameId: null,
    });

    actionCounts[decision.action] = (actionCounts[decision.action] ?? 0) + 1;

    responseRows.push({
      simulator_run_id: runRow.id,
      persona_id: student.personaId,
      policy_name: args.policyName,
      item_draft_id: item.itemDraftId,
      selected_answer: response.selected,
      is_correct: response.isCorrect,
      simulated_time_ms: response.timeMs,
      simulated_confidence: response.confidence,
    });
  }

  await supabase.from('simulated_response').insert(responseRows);

  const metrics = {
    accuracy: correct / items.length,
    mean_time_ms: Math.round(totalTime / items.length),
    action_counts: actionCounts,
  };
  await supabase.from('simulator_run').update({ metrics }).eq('id', runRow.id);

  console.log(JSON.stringify({ runId: runRow.id, metrics }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
