import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, FactRowRow, QuestionSkeletonRow } from '@/lib/types/database';
import { runValidator } from './validator-base';
import { resolveSourceContext } from '../source-loader';

interface MedicalValidatorInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  topic?: string;
  skeleton?: QuestionSkeletonRow; // v2: skeleton-aware consistency checks
}

export async function run(
  context: AgentContext,
  input: MedicalValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  return runValidator({
    agentType: 'medical_validator',
    validatorType: 'medical',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: async () => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(input.draft, null, 2),
        algorithm_card: JSON.stringify(input.card, null, 2),
        fact_rows: JSON.stringify(input.facts, null, 2),
        source_context: await resolveSourceContext(input.topic ?? ''),
      };
      if (input.skeleton) {
        vars.question_skeleton = JSON.stringify(input.skeleton, null, 2);
      }
      return vars;
    },
  });
}
