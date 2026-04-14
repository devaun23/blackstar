import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, BlueprintNodeRow, AlternateTerminologyRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface ExamTranslationValidatorInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
  node: BlueprintNodeRow;
  alternateTerminology?: AlternateTerminologyRow[]; // v2: cross-reference NBME phrasing
  model?: string;
}

/**
 * Validates that the item is a board-style decision fork rather than
 * guideline recall or fact regurgitation. This is the exam translation layer —
 * the gap between "medically correct" and "board-testable."
 *
 * v2 enhancement: When alternate_terminology is provided, cross-references
 * the stem phrasing against known NBME patterns.
 */
export async function run(
  context: AgentContext,
  input: ExamTranslationValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  return runValidator({
    agentType: 'exam_translation_validator',
    validatorType: 'exam_translation',
    context,
    itemDraftId: input.draft.id,
    ...(input.model ? { model: input.model } : {}),
    buildTemplateVars: () => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(input.draft, null, 2),
        algorithm_card: JSON.stringify(input.card, null, 2),
        blueprint_node: JSON.stringify(input.node, null, 2),
      };
      if (input.alternateTerminology?.length) {
        vars.alternate_terminology = JSON.stringify(input.alternateTerminology, null, 2);
      }
      return vars;
    },
  });
}
