import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface ExplanationValidatorInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
}

export async function run(
  context: AgentContext,
  input: ExplanationValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  return runValidator({
    agentType: 'explanation_validator',
    validatorType: 'explanation_quality',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: () => ({
      item_draft: JSON.stringify(input.draft, null, 2),
      algorithm_card: JSON.stringify(input.card, null, 2),
    }),
  });
}
