import { createAdminClient } from '@/lib/supabase/admin';
import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, BlueprintNodeRow, CasePlanRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface BlueprintValidatorInput {
  draft: ItemDraftRow;
  node: BlueprintNodeRow;
  casePlan?: CasePlanRow; // v2: verify case_plan targets match blueprint
}

/**
 * Validates that a generated question aligns with its blueprint node.
 * Enhanced with scope validation against the content_topic catalog (Tier A authority).
 */
export async function run(
  context: AgentContext,
  input: BlueprintValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  const supabase = createAdminClient();

  // Query valid topics for scope validation
  let validTopicsList = 'No content topic data available — skip scope validation.';

  if (input.node.content_system_id) {
    const { data: topics } = await supabase
      .from('content_topic')
      .select('topic_name, category, is_high_yield')
      .eq('content_system_id', input.node.content_system_id)
      .order('topic_name');

    if (topics && topics.length > 0) {
      validTopicsList = topics
        .map((t: { topic_name: string; category: string | null; is_high_yield: boolean }) =>
          `- ${t.topic_name}${t.category ? ` [${t.category}]` : ''}${t.is_high_yield ? ' (HIGH YIELD)' : ''}`
        )
        .join('\n');
    }
  }

  // Query system weight context
  let systemContext = '';
  if (input.node.content_system_id) {
    const { data: system } = await supabase
      .from('content_system')
      .select('display_name, weight_min, weight_max')
      .eq('id', input.node.content_system_id)
      .single();

    if (system) {
      systemContext = `\nSystem: ${system.display_name} (target weight: ${system.weight_min}-${system.weight_max}% of exam)`;
    }
  }

  return runValidator({
    agentType: 'blueprint_validator',
    validatorType: 'blueprint',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: () => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(input.draft, null, 2),
        blueprint_node: JSON.stringify(input.node, null, 2) + systemContext,
        valid_topics: validTopicsList,
      };
      if (input.casePlan) {
        vars.case_plan = JSON.stringify(input.casePlan, null, 2);
      }
      return vars;
    },
  });
}
