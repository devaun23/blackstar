import { createAdminClient } from '@/lib/supabase/admin';
import { itemDraftSchema } from '@/lib/factory/schemas';
import type { ItemDraftInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, AlgorithmCardRow, FactRowRow, ItemPlanRow, QuestionSkeletonRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface VignetteWriterInput {
  node: BlueprintNodeRow;
  card: AlgorithmCardRow;
  plan: ItemPlanRow;
  facts: FactRowRow[];
  pipelineRunId: string;
  skeleton?: QuestionSkeletonRow; // v2: render from skeleton if provided
}

/**
 * Writes an NBME-style clinical vignette with cold chart style,
 * late hinge placement, and symmetric answer choices.
 */
export async function run(
  context: AgentContext,
  input: VignetteWriterInput
): Promise<AgentOutput<ItemDraftInput & { itemDraftId: string }>> {
  const result = await runAgent({
    agentType: 'vignette_writer',
    context,
    input,
    outputSchema: itemDraftSchema,
    buildUserMessage: (data) => {
      const vars: Record<string, string> = {
        blueprint_node: JSON.stringify(data.node, null, 2),
        algorithm_card: JSON.stringify(data.card, null, 2),
        item_plan: JSON.stringify(data.plan, null, 2),
        fact_rows: JSON.stringify(data.facts, null, 2),
      };
      if (data.skeleton) {
        vars.question_skeleton = JSON.stringify(data.skeleton, null, 2);
      }
      return vars;
    },
  });

  if (!result.success) {
    return { ...result, data: null as unknown as ItemDraftInput & { itemDraftId: string } };
  }

  // Write item draft to DB
  const supabase = createAdminClient();
  const { data: draft, error } = await supabase
    .from('item_draft')
    .insert({
      item_plan_id: input.plan.id,
      blueprint_node_id: input.node.id,
      pipeline_run_id: input.pipelineRunId,
      status: 'draft',
      ...result.data,
    })
    .select('id')
    .single();

  if (error || !draft) {
    return {
      success: false,
      data: null as unknown as ItemDraftInput & { itemDraftId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert item_draft: ${error?.message}`,
    };
  }

  return {
    success: true,
    data: { ...result.data, itemDraftId: draft.id },
    tokensUsed: result.tokensUsed,
  };
}
