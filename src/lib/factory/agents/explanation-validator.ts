import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface ExplanationValidatorInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
}

/**
 * Validates explanation quality. When v2 5-component fields are present
 * (explanation_decision_logic, explanation_error_diagnosis, etc.),
 * includes them in the validation context for completeness checking.
 */
export async function run(
  context: AgentContext,
  input: ExplanationValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  return runValidator({
    agentType: 'explanation_validator',
    validatorType: 'explanation_quality',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: () => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(input.draft, null, 2),
        algorithm_card: JSON.stringify(input.card, null, 2),
      };
      // Include v2 structured explanation fields if present
      const hasStructuredExplanation = input.draft.explanation_decision_logic
        || input.draft.explanation_error_diagnosis
        || input.draft.explanation_transfer_rule
        || input.draft.explanation_teaching_pearl;
      if (hasStructuredExplanation) {
        vars.structured_explanation = JSON.stringify({
          decision_logic: input.draft.explanation_decision_logic,
          hinge_id: input.draft.explanation_hinge_id,
          error_diagnosis: input.draft.explanation_error_diagnosis,
          transfer_rule: input.draft.explanation_transfer_rule,
          teaching_pearl: input.draft.explanation_teaching_pearl,
        }, null, 2);
      }
      return vars;
    },
  });
}
