import { createAdminClient } from '@/lib/supabase/admin';
import { itemDraftSchema } from '@/lib/factory/schemas';
import type { ItemDraftInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, FactRowRow, ValidatorReportRow } from '@/lib/types/database';
import { callClaude } from '../claude';
import { fetchActivePrompt, fillTemplate } from '../prompts';
import { getMockFixture } from '../mock-fixtures';
import { inferFailureCategory, buildRepairBrief, getDominantCategory } from '../failure-categorizer';
import { REPAIR_SYSTEM_OVERRIDES } from './repair-strategies';

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

  // Mock mode: return deterministic fixture without API call
  if (context.mockMode) {
    const fixture = getMockFixture('repair_agent');
    if (fixture) {
      const parsed = itemDraftSchema.safeParse(fixture);
      if (parsed.success) {
        return { success: true, data: parsed.data, tokensUsed: 0 };
      }
    }
  }

  // Route to specialized repair prompt based on dominant failure category
  // (TeamMedAgents research: adaptive component selection outperforms comprehensive integration)
  const dominantCategory = getDominantCategory(categorizedFailures);
  const specializedOverride = REPAIR_SYSTEM_OVERRIDES[dominantCategory] ?? '';

  const basePrompt = await fetchActivePrompt('repair_agent');
  const systemPrompt = specializedOverride
    ? `${basePrompt.system_prompt}\n\n${specializedOverride}`
    : basePrompt.system_prompt;

  const templateVars = {
    item_draft: JSON.stringify(input.draft, null, 2),
    validator_reports: JSON.stringify(reportsJson, null, 2),
    repair_brief: repairBrief,
    algorithm_card: JSON.stringify(input.card, null, 2),
    fact_rows: JSON.stringify(input.facts, null, 2),
  };

  const userMessage = fillTemplate(basePrompt.user_prompt_template, templateVars);

  let result: AgentOutput<ItemDraftInput>;
  try {
    const { data, tokensUsed } = await callClaude({
      systemPrompt,
      userMessage,
      outputSchema: itemDraftSchema,
    });
    result = { success: true, data, tokensUsed };
  } catch (err) {
    result = {
      success: false,
      data: null as unknown as ItemDraftInput,
      tokensUsed: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }

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
