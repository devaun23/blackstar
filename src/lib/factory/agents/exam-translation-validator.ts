import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, BlueprintNodeRow, AlternateTerminologyRow } from '@/lib/types/database';
import { runValidator } from './validator-base';
import { resolveSourceContext } from '../source-loader';

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
 *
 * v3 enhancement: Source-grounded via resolveSourceContext(). Knowing the actual
 * guideline helps distinguish "tests a real clinical decision" from "tests guideline recall."
 * Research (Jia 2026): agentic RAG improves accuracy 5.6% on Step 2 CK via evidence grounding.
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
    buildTemplateVars: async () => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(input.draft, null, 2),
        algorithm_card: JSON.stringify(input.card, null, 2),
        blueprint_node: JSON.stringify(input.node, null, 2),
        source_context: await resolveSourceContext(input.node.topic ?? ''),
      };
      if (input.alternateTerminology?.length) {
        vars.alternate_terminology = JSON.stringify(input.alternateTerminology, null, 2);
      }
      return vars;
    },
  });
}
