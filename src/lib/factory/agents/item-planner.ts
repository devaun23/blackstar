import { createAdminClient } from '@/lib/supabase/admin';
import { itemPlanSchema } from '@/lib/factory/schemas';
import type { ItemPlanInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, AlgorithmCardRow, FactRowRow, ErrorTaxonomyRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';
import { isCellOnOutline, knownSystemsForShelf } from '../seeds/nbme-content-outline';

interface ItemPlannerInput {
  node: BlueprintNodeRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  errors: ErrorTaxonomyRow[];
  // A4 cell-existence gate mode. 'warn' (default) logs but allows;
  // 'strict' refuses; 'off' skips the check entirely.
  cellExistenceGate?: 'warn' | 'strict' | 'off';
}

/**
 * Plans the question architecture: hinge, competing options, cognitive error target,
 * noise elements, and distractor rationale.
 *
 * Pre-flight (A4): checks the node's (shelf, system) against the NBME content
 * outline. Default mode is 'warn' — logs but allows — because the current
 * blueprint_node seed contains duplicate system names that haven't been
 * deduped yet. Switch to 'strict' after deduping (see BLACKSTAR_BLUEPRINT_COVERAGE.md
 * — "data hygiene" section).
 */
export async function run(
  context: AgentContext,
  input: ItemPlannerInput
): Promise<AgentOutput<ItemPlanInput & { itemPlanId: string }>> {
  // ─── Pre-flight: cell-existence gate ───
  const gateMode = input.cellExistenceGate ?? 'warn';
  if (gateMode !== 'off' && !isCellOnOutline(input.node.shelf, input.node.system)) {
    const knownSystems = knownSystemsForShelf(input.node.shelf);
    const message =
      `scope_violation: blueprint_node ${input.node.id} has system="${input.node.system}" ` +
      `which is not on the NBME ${input.node.shelf} content outline. ` +
      `Known systems for shelf=${input.node.shelf}: ${knownSystems.join(', ')}. ` +
      `Either fix the node's system, remove the node, or add the system to ` +
      `src/lib/factory/seeds/nbme-content-outline.ts with a citation.`;
    if (gateMode === 'strict') {
      return {
        success: false,
        data: null as unknown as ItemPlanInput & { itemPlanId: string },
        tokensUsed: 0,
        error: message,
      };
    }
    console.warn(`[item-planner][cell-existence-gate=warn] ${message}`);
  }

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
