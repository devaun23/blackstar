import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, ItemPlanRow, QuestionSkeletonRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface OptionSymmetryValidatorInput {
  draft: ItemDraftRow;
  plan: ItemPlanRow;
  skeleton?: QuestionSkeletonRow; // v2: check options map to distinct action_classes
}

export async function run(
  context: AgentContext,
  input: OptionSymmetryValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  return runValidator({
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
}
