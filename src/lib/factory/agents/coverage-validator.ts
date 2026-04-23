import { createAdminClient } from '@/lib/supabase/admin';
import { validatorReportSchema, type ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow } from '@/lib/types/database';

// Q-matrix coverage validator (deterministic — no Claude call).
//
// The learner engine routes on 6 dimensions: topic, transfer_rule, confusion_set,
// cognitive_error, hinge_clue_type, action_class. An item missing any of these is
// invisible to the corresponding selector path.
//
// Empirical audit (scripts/audit-qmatrix-coverage.ts, run 2026-04-22): 20 passed
// items — 4 required dims at 100% coverage (topic, cognitive_error,
// hinge_clue_type, action_class); 2 sparse dims (transfer_rule, confusion_set)
// legitimately don't apply to every item (single-diagnosis stems without a
// natural confusion pair; management stems without a transfer rule).
//
// Routing:
//   HARD dims missing -> passed=false, score=0 — item goes to repair or kill
//   SOFT dims missing -> passed=true, score<10 — logged as warning, does not block
//
// This is a gate against pipeline regression: if a future change starts producing
// items with no cognitive_error tagged, we want to know immediately.

const HARD_DIMS = [
  'topic',
  'cognitive_error',
  'hinge_clue_type',
  'action_class',
] as const;

const SOFT_DIMS = ['transfer_rule', 'confusion_set'] as const;

type HardDim = (typeof HARD_DIMS)[number];
type SoftDim = (typeof SOFT_DIMS)[number];
type Dim = HardDim | SoftDim;

interface CoverageValidatorInput {
  draft: ItemDraftRow;
}

interface DimCheck {
  dim: Dim;
  hard: boolean;
  present: boolean;
  value: string | null;
}

async function computeCoverage(draftId: string): Promise<DimCheck[]> {
  const supabase = createAdminClient();

  // Pull blueprint_node.topic (dim 1) + case_plan target FKs (dims 2-6)
  const { data, error } = await supabase
    .from('item_draft')
    .select(
      'id, blueprint_node:blueprint_node_id(topic), ' +
        'case_plan:case_plan_id(' +
        'target_transfer_rule_id, target_confusion_set_id, ' +
        'target_cognitive_error_id, target_hinge_clue_type_id, target_action_class_id' +
        ')',
    )
    .eq('id', draftId)
    .single();

  if (error || !data) {
    // Fail-closed: if we can't read the row, we can't vouch for its coverage.
    return HARD_DIMS.concat(SOFT_DIMS as unknown as typeof HARD_DIMS).map((d) => ({
      dim: d,
      hard: (HARD_DIMS as readonly string[]).includes(d),
      present: false,
      value: null,
    }));
  }

  const row = data as unknown as {
    blueprint_node: { topic: string | null } | null;
    case_plan: {
      target_transfer_rule_id: string | null;
      target_confusion_set_id: string | null;
      target_cognitive_error_id: string | null;
      target_hinge_clue_type_id: string | null;
      target_action_class_id: string | null;
    } | null;
  };
  const node = row.blueprint_node;
  const plan = row.case_plan;

  const topicVal = node?.topic ?? null;

  return [
    { dim: 'topic', hard: true, present: !!topicVal, value: topicVal },
    {
      dim: 'cognitive_error',
      hard: true,
      present: !!plan?.target_cognitive_error_id,
      value: plan?.target_cognitive_error_id ?? null,
    },
    {
      dim: 'hinge_clue_type',
      hard: true,
      present: !!plan?.target_hinge_clue_type_id,
      value: plan?.target_hinge_clue_type_id ?? null,
    },
    {
      dim: 'action_class',
      hard: true,
      present: !!plan?.target_action_class_id,
      value: plan?.target_action_class_id ?? null,
    },
    {
      dim: 'transfer_rule',
      hard: false,
      present: !!plan?.target_transfer_rule_id,
      value: plan?.target_transfer_rule_id ?? null,
    },
    {
      dim: 'confusion_set',
      hard: false,
      present: !!plan?.target_confusion_set_id,
      value: plan?.target_confusion_set_id ?? null,
    },
  ];
}

function buildReport(checks: DimCheck[]): ValidatorReportInput {
  const missingHard = checks.filter((c) => c.hard && !c.present).map((c) => c.dim);
  const missingSoft = checks.filter((c) => !c.hard && !c.present).map((c) => c.dim);

  const issues: string[] = [];
  for (const d of missingHard) {
    issues.push(
      `REQUIRED dim "${d}" is not tagged — learner engine cannot route this item on the ${d} path.`,
    );
  }
  for (const d of missingSoft) {
    issues.push(`OPTIONAL dim "${d}" not tagged — acceptable if the item type doesn't apply (informational).`);
  }

  const passed = missingHard.length === 0;
  // Score = 10 * (tagged_hard / total_hard), minus 0.5 per missing soft (so a
  // fully-tagged item = 10; missing one soft = 9.5; missing two softs = 9; any
  // missing hard = proportionally lower + passed=false).
  const hardFraction = (HARD_DIMS.length - missingHard.length) / HARD_DIMS.length;
  let score = 10 * hardFraction - 0.5 * missingSoft.length;
  if (score < 0) score = 0;
  score = Math.round(score * 100) / 100;

  const repair: string | null =
    missingHard.length === 0
      ? null
      : `Backfill required dims on case_plan/blueprint_node for this item: ${missingHard.join(', ')}.`;

  return {
    passed,
    score,
    issues_found: issues,
    repair_instructions: repair,
    failure_category: null,
  };
}

export async function run(
  _context: AgentContext,
  input: CoverageValidatorInput,
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  const { draft } = input;
  try {
    const checks = await computeCoverage(draft.id);
    const report = buildReport(checks);

    const parsed = validatorReportSchema.safeParse(report);
    if (!parsed.success) {
      return {
        success: false,
        data: null as unknown as ValidatorReportInput & { reportId: string },
        tokensUsed: 0,
        error: `Coverage report failed schema: ${parsed.error.message}`,
      };
    }

    const supabase = createAdminClient();
    const { data: inserted, error: insErr } = await supabase
      .from('validator_report')
      .insert({
        item_draft_id: draft.id,
        validator_type: 'coverage',
        passed: report.passed,
        score: report.score,
        issues_found: report.issues_found,
        repair_instructions: report.repair_instructions ?? null,
        raw_output: {
          ...report,
          dim_checks: checks,
        } as unknown as Record<string, unknown>,
      })
      .select('id')
      .single();

    if (insErr || !inserted) {
      return {
        success: false,
        data: null as unknown as ValidatorReportInput & { reportId: string },
        tokensUsed: 0,
        error: `Failed to insert validator_report: ${insErr?.message}`,
      };
    }

    return {
      success: true,
      data: { ...report, reportId: inserted.id },
      tokensUsed: 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: null as unknown as ValidatorReportInput & { reportId: string },
      tokensUsed: 0,
      error: `Coverage validator threw: ${message}`,
    };
  }
}

export { HARD_DIMS, SOFT_DIMS };
