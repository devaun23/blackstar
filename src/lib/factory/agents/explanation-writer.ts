import { createAdminClient } from '@/lib/supabase/admin';
import { explanationOutputSchema } from '@/lib/factory/schemas';
import type { ExplanationOutput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, FactRowRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface ExplanationWriterInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
}

/**
 * Writes comprehensive explanations (why_correct, why_wrong_a-e, high_yield_pearl,
 * reasoning_pathway) for a passed item draft.
 */
export async function run(
  context: AgentContext,
  input: ExplanationWriterInput
): Promise<AgentOutput<ExplanationOutput>> {
  const result = await runAgent({
    agentType: 'explanation_writer',
    context,
    input,
    outputSchema: explanationOutputSchema,
    buildUserMessage: (data) => ({
      item_draft: JSON.stringify(data.draft, null, 2),
      algorithm_card: JSON.stringify(data.card, null, 2),
      fact_rows: JSON.stringify(data.facts, null, 2),
    }),
  });

  if (!result.success) {
    return result;
  }

  // Update the draft with explanations
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('item_draft')
    .update(result.data)
    .eq('id', input.draft.id);

  if (error) {
    return {
      success: false,
      data: null as unknown as ExplanationOutput,
      tokensUsed: result.tokensUsed,
      error: `Failed to update item_draft with explanations: ${error.message}`,
    };
  }

  return result;
}
