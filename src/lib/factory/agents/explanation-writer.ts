import { createAdminClient } from '@/lib/supabase/admin';
import { explanationOutputSchema } from '@/lib/factory/schemas';
import type { ExplanationOutput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, FactRowRow, BlueprintNodeRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';
import { getVisualCoverage } from '../seeds/visual-coverage';

interface ExplanationWriterInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  node?: BlueprintNodeRow;
  transferRuleText?: string;  // From case_plan — declared before the question was written
}

/**
 * Writes comprehensive explanations (why_correct, why_wrong_a-e, high_yield_pearl,
 * reasoning_pathway) for a passed item draft. Extended to produce visual_specs
 * when visual coverage exists for the topic.
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
    buildUserMessage: (data) => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(data.draft, null, 2),
        algorithm_card: JSON.stringify(data.card, null, 2),
        fact_rows: JSON.stringify(data.facts, null, 2),
      };

      // Inject visual guidance if coverage exists for this topic
      if (data.node) {
        const coverage = getVisualCoverage(data.node.topic);
        if (coverage) {
          vars.visual_guidance = JSON.stringify({
            recommended_type: coverage.explanation_visual,
            fallback_type: coverage.fallback_visual,
            teaching_goal: coverage.visual_contract.teaching_goal,
            tested_hinge: coverage.visual_contract.tested_hinge,
            max_visual_count: coverage.max_visual_count,
            visual_priority: coverage.visual_priority,
          }, null, 2);
        }
      }

      if (!vars.visual_guidance) {
        vars.visual_guidance = 'No visual coverage defined for this topic. Do not produce visual_specs.';
      }

      // Pass the pre-declared transfer rule so the explanation references it, not invents one
      if (data.transferRuleText) {
        vars.transfer_rule_text = data.transferRuleText;
      }

      return vars;
    },
  });

  if (!result.success) {
    return result;
  }

  // Build update payload — include visual_specs if present
  const updatePayload: Record<string, unknown> = { ...result.data };

  // Update the draft with explanations
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('item_draft')
    .update(updatePayload)
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
