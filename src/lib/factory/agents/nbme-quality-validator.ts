import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface NbmeQualityValidatorInput {
  draft: ItemDraftRow;
}

export async function run(
  context: AgentContext,
  input: NbmeQualityValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  return runValidator({
    agentType: 'nbme_quality_validator',
    validatorType: 'nbme_quality',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: () => ({
      item_draft: JSON.stringify(input.draft, null, 2),
    }),
  });
}
