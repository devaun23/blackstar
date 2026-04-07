import { createAdminClient } from '@/lib/supabase/admin';
import { algorithmExtractorOutputSchema } from '@/lib/factory/schemas';
import type { AlgorithmExtractorOutput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';
import { resolveSourceContext } from '../source-loader';
import { GOLD_CARD_PE, GOLD_CARD_ACS, GOLD_CARD_AKI, type GoldAlgorithmCard } from '../seeds/gold-algorithm-cards';

const GOLD_CARDS: Record<string, GoldAlgorithmCard> = {
  'Pulmonary Embolism': GOLD_CARD_PE,
  'Acute Coronary Syndrome': GOLD_CARD_ACS,
  'Acute Kidney Injury': GOLD_CARD_AKI,
};

/**
 * Given a blueprint node, constructs the clinical decision algorithm
 * and 3-6 supporting fact rows. Writes results to algorithm_card and fact_row tables.
 *
 * If a gold card exists for this topic, uses it directly (0 tokens, verified truth).
 * Otherwise falls back to Claude-based extraction.
 */
export async function run(
  context: AgentContext,
  node: BlueprintNodeRow
): Promise<AgentOutput<AlgorithmExtractorOutput & { algorithmCardId: string }>> {
  // Gold card injection: use pre-verified clinical truth when available
  const goldCard = GOLD_CARDS[node.topic];
  if (goldCard) {
    const cardData = {
      entry_presentation: goldCard.entry_presentation,
      competing_paths: goldCard.competing_paths,
      hinge_feature: goldCard.hinge_feature,
      correct_action: goldCard.correct_action,
      contraindications: goldCard.contraindications,
      source_citations: goldCard.source_citations,
    };

    const supabase = createAdminClient();
    const { data: card, error: cardError } = await supabase
      .from('algorithm_card')
      .insert({ blueprint_node_id: node.id, ...cardData })
      .select('id')
      .single();

    if (cardError || !card) {
      return {
        success: false,
        data: null as unknown as AlgorithmExtractorOutput & { algorithmCardId: string },
        tokensUsed: 0,
        error: `Failed to insert gold algorithm_card: ${cardError?.message}`,
      };
    }

    const factInserts = goldCard.fact_rows.map((f) => ({
      algorithm_card_id: card.id,
      ...f,
    }));
    await supabase.from('fact_row').insert(factInserts);

    return {
      success: true,
      data: { algorithm_card: cardData, fact_rows: goldCard.fact_rows, algorithmCardId: card.id },
      tokensUsed: 0,
    };
  }

  // Fall back to Claude-based extraction
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
