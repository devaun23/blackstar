import { createAdminClient } from '@/lib/supabase/admin';
import { itemDraftSchema } from '@/lib/factory/schemas';
import type { ItemDraftInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, FactRowRow, ValidatorReportRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';
import { inferFailureCategory, buildRepairBrief } from '../failure-categorizer';

interface RepairAgentInput {
  draft: ItemDraftRow;
  validatorReports: ValidatorReportRow[];
  card: AlgorithmCardRow;
  facts: FactRowRow[];
}

/**
 * Performs targeted repair on a failed item draft based on validator feedback.
 * Updates the existing item_draft row (increments repair_count, sets status to 'repaired').
 *
 * Now includes structured failure categorization (P2 — QUEST-AI) so the repair
 * agent receives specific error types and targeted strategies, not just free text.
 */
export async function run(
  context: AgentContext,
  input: RepairAgentInput
): Promise<AgentOutput<ItemDraftInput>> {
  const failedReports = input.validatorReports.filter((r) => !r.passed);

  // Categorize each failure for targeted repair
  const categorizedFailures = failedReports.map((r) => {
    const category = inferFailureCategory({
      validator_type: r.validator_type,
      score: r.score ?? 0,
      issues_found: r.issues_found ?? [],
      repair_instructions: r.repair_instructions,
    });
    return {
      validatorType: r.validator_type,
      category,
      issues: r.issues_found ?? [],
    };
  });

  const repairBrief = buildRepairBrief(categorizedFailures);

  const reportsJson = failedReports.map((r, i) => ({
    validator: r.validator_type,
    score: r.score,
    issues: r.issues_found,
    repair_instructions: r.repair_instructions,
    failure_category: categorizedFailures[i].category,
  }));

  const result = await runAgent({
    agentType: 'repair_agent',
    context,
    input: { ...input, reportsJson, repairBrief },
    outputSchema: itemDraftSchema,
    buildUserMessage: (data) => ({
      item_draft: JSON.stringify(data.draft, null, 2),
      validator_reports: JSON.stringify(data.reportsJson, null, 2),
      repair_brief: data.repairBrief,
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
