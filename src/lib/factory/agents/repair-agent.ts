import { createAdminClient } from '@/lib/supabase/admin';
import { itemDraftSchema } from '@/lib/factory/schemas';
import type { ItemDraftInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, FactRowRow, ValidatorReportRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface RepairAgentInput {
  draft: ItemDraftRow;
  validatorReports: ValidatorReportRow[];
  card: AlgorithmCardRow;
  facts: FactRowRow[];
}

/**
 * Performs targeted repair on a failed item draft based on validator feedback.
 * Updates the existing item_draft row (increments repair_count, sets status to 'repaired').
 */
export async function run(
  context: AgentContext,
  input: RepairAgentInput
): Promise<AgentOutput<ItemDraftInput>> {
  const failedReports = input.validatorReports.filter((r) => !r.passed);
  const reportsJson = failedReports.map((r) => ({
    validator: r.validator_type,
    score: r.score,
    issues: r.issues_found,
    repair_instructions: r.repair_instructions,
  }));

  const result = await runAgent({
    agentType: 'repair_agent',
    context,
    input: { ...input, reportsJson },
    outputSchema: itemDraftSchema,
    buildUserMessage: (data) => ({
      item_draft: JSON.stringify(data.draft, null, 2),
      validator_reports: JSON.stringify(data.reportsJson, null, 2),
      algorithm_card: JSON.stringify(data.card, null, 2),
      fact_rows: JSON.stringify(data.facts, null, 2),
    }),
  });

  if (!result.success) {
    return result;
  }

  // Update the existing draft in DB
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('item_draft')
    .update({
      ...result.data,
      status: 'repaired',
      repair_count: input.draft.repair_count + 1,
      version: input.draft.version + 1,
    })
    .eq('id', input.draft.id);

  if (error) {
    return {
      success: false,
      data: null as unknown as ItemDraftInput,
      tokensUsed: result.tokensUsed,
      error: `Failed to update item_draft: ${error.message}`,
    };
  }

  return result;
}
