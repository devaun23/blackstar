import { createAdminClient } from '@/lib/supabase/admin';
import { itemPlanSchema } from '@/lib/factory/schemas';
import type { ItemPlanInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, AlgorithmCardRow, FactRowRow, ErrorTaxonomyRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface ItemPlannerInput {
  node: BlueprintNodeRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  errors: ErrorTaxonomyRow[];
}

/**
 * Plans the question architecture: hinge, competing options, cognitive error target,
 * noise elements, and distractor rationale.
 */
export async function run(
  context: AgentContext,
  input: ItemPlannerInput
): Promise<AgentOutput<ItemPlanInput & { itemPlanId: string }>> {
  const result = await runAgent({
    agentType: 'item_planner',
    context,
    input,
    outputSchema: itemPlanSchema,
    buildUserMessage: (data) => ({
      blueprint_node: JSON.stringify(data.node, null, 2),
      algorithm_card: JSON.stringify(data.card, null, 2),
      fact_rows: JSON.stringify(data.facts, null, 2),
      error_taxonomy: data.errors
        .map((e) => `- ${e.error_name}: ${e.definition}`)
        .join('\n'),
    }),
  });

  if (!result.success) {
    return { ...result, data: null as unknown as ItemPlanInput & { itemPlanId: string } };
  }

  // Write item plan to DB
  const supabase = createAdminClient();
  const { data: plan, error } = await supabase
    .from('item_plan')
    .insert({
      algorithm_card_id: input.card.id,
      blueprint_node_id: input.node.id,
      ...result.data,
    })
    .select('id')
    .single();

  if (error || !plan) {
    return {
      success: false,
      data: null as unknown as ItemPlanInput & { itemPlanId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert item_plan: ${error?.message}`,
    };
  }

  return {
    success: true,
    data: { ...result.data, itemPlanId: plan.id },
    tokensUsed: result.tokensUsed,
  };
}
