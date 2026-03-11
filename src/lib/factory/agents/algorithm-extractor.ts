import { createAdminClient } from '@/lib/supabase/admin';
import { algorithmExtractorOutputSchema } from '@/lib/factory/schemas';
import type { AlgorithmExtractorOutput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';
import { resolveSourceContext } from '../source-loader';

/**
 * Given a blueprint node, constructs the clinical decision algorithm
 * and 3-6 supporting fact rows. Writes results to algorithm_card and fact_row tables.
 */
export async function run(
  context: AgentContext,
  node: BlueprintNodeRow
): Promise<AgentOutput<AlgorithmExtractorOutput & { algorithmCardId: string }>> {
  const result = await runAgent({
    agentType: 'algorithm_extractor',
    context,
    input: node,
    outputSchema: algorithmExtractorOutputSchema,
    buildUserMessage: async (n) => ({
      shelf: n.shelf,
      system: n.system,
      topic: n.topic,
      task_type: n.task_type,
      clinical_setting: n.clinical_setting,
      age_group: n.age_group,
      time_horizon: n.time_horizon,
      source_context: await resolveSourceContext(n.topic),
    }),
  });

  if (!result.success) {
    return { ...result, data: null as unknown as AlgorithmExtractorOutput & { algorithmCardId: string } };
  }

  // Write algorithm card to DB
  const supabase = createAdminClient();
  const { data: card, error: cardError } = await supabase
    .from('algorithm_card')
    .insert({
      blueprint_node_id: node.id,
      ...result.data.algorithm_card,
    })
    .select('id')
    .single();

  if (cardError || !card) {
    return {
      success: false,
      data: null as unknown as AlgorithmExtractorOutput & { algorithmCardId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert algorithm_card: ${cardError?.message}`,
    };
  }

  // Write fact rows to DB
  const factInserts = result.data.fact_rows.map((fact) => ({
    algorithm_card_id: card.id,
    ...fact,
  }));

  const { error: factsError } = await supabase
    .from('fact_row')
    .insert(factInserts);

  if (factsError) {
    return {
      success: false,
      data: null as unknown as AlgorithmExtractorOutput & { algorithmCardId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert fact_rows: ${factsError.message}`,
    };
  }

  return {
    success: true,
    data: { ...result.data, algorithmCardId: card.id },
    tokensUsed: result.tokensUsed,
  };
}
