import { createAdminClient } from '@/lib/supabase/admin';
import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, ItemPlanRow, QuestionSkeletonRow, CasePlanRow, OptionArchetype } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface OptionSymmetryValidatorInput {
  draft: ItemDraftRow;
  plan: ItemPlanRow;
  skeleton?: QuestionSkeletonRow;
}

/**
 * v23 — Elite-Tutor Rule 3 (distractor archetypes) deterministic pre-checks.
 * Maps to R-OPT-04 (no primary_competitor) and R-OPT-05 (>1 zebra or zebra without
 * exotic identity). Also confirms primary_competitor length is within 15% of correct
 * to prevent longest-answer tells.
 */
async function runArchetypeChecks(draft: ItemDraftRow): Promise<string[]> {
  const issues: string[] = [];
  if (!draft.case_plan_id) return issues;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('case_plan')
    .select('option_frames, correct_option_frame_id')
    .eq('id', draft.case_plan_id)
    .single();

  const plan = data as Pick<CasePlanRow, 'option_frames' | 'correct_option_frame_id'> | null;
  if (!plan) return issues;

  const frames = plan.option_frames ?? [];
  const counts: Record<OptionArchetype, number> = {
    correct: 0,
    primary_competitor: 0,
    near_miss: 0,
    zebra: 0,
    implausible: 0,
    neutral: 0,
  };
  for (const frame of frames) {
    const a = frame.archetype;
    if (a && a in counts) counts[a] += 1;
  }

  if (counts.correct !== 1) {
    issues.push(`R-OPT-04: expected exactly 1 option_frame with archetype='correct', found ${counts.correct}`);
  }
  if (counts.primary_competitor !== 1) {
    issues.push(
      `R-OPT-04: expected exactly 1 option_frame with archetype='primary_competitor', found ${counts.primary_competitor} — Rule 3`
    );
  }
  if (counts.zebra > 1) {
    issues.push(`R-OPT-05: more than 1 zebra archetype (found ${counts.zebra}) — Rule 3 allows at most one`);
  }

  // Length symmetry between correct and primary_competitor — prevents longest-answer tell
  const correctFrame = frames.find((f) => f.id === plan.correct_option_frame_id);
  const pcFrame = frames.find((f) => f.archetype === 'primary_competitor');
  if (correctFrame && pcFrame) {
    const optionMap: Record<string, string> = {
      A: draft.choice_a,
      B: draft.choice_b,
      C: draft.choice_c,
      D: draft.choice_d,
      E: draft.choice_e,
    };
    const correctText = optionMap[correctFrame.id] ?? '';
    const pcText = optionMap[pcFrame.id] ?? '';
    if (correctText.length > 0 && pcText.length > 0) {
      const ratio = Math.abs(correctText.length - pcText.length) / Math.max(correctText.length, pcText.length);
      if (ratio > 0.15) {
        issues.push(
          `R-OPT-03: primary_competitor length (${pcText.length}) differs from correct length (${correctText.length}) by ${(ratio * 100).toFixed(0)}% — max 15% allowed`
        );
      }
    }
  }

  return issues;
}

export async function run(
  context: AgentContext,
  input: OptionSymmetryValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  const archetypeIssues = await runArchetypeChecks(input.draft);

  const result = await runValidator({
    agentType: 'option_symmetry_validator',
    validatorType: 'option_symmetry',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: () => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(input.draft, null, 2),
        item_plan: JSON.stringify(input.plan, null, 2),
      };
      if (input.skeleton) {
        vars.question_skeleton = JSON.stringify(input.skeleton, null, 2);
      }
      return vars;
    },
  });

  if (result.success && archetypeIssues.length > 0) {
    result.data.issues_found = [
      ...new Set([...result.data.issues_found, ...archetypeIssues]),
    ];
    result.data.passed = result.data.passed && archetypeIssues.length === 0;
  }

  return result;
}
