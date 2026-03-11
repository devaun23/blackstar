import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, ItemPlanRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface OptionSymmetryValidatorInput {
  draft: ItemDraftRow;
  plan: ItemPlanRow;
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
    buildTemplateVars: () => ({
      item_draft: JSON.stringify(input.draft, null, 2),
      item_plan: JSON.stringify(input.plan, null, 2),
    }),
  });
}
