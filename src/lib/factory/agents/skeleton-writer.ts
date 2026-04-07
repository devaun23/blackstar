import { createAdminClient } from '@/lib/supabase/admin';
import { questionSkeletonSchema } from '@/lib/factory/schemas';
import type { QuestionSkeletonInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, AlgorithmCardRow, FactRowRow, CasePlanRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface SkeletonWriterInput {
  node: BlueprintNodeRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  casePlan: CasePlanRow;
}

/**
 * Generates the logical structure of a question before any prose:
 * case summary, hidden target, correct action, frame-anchored options
 * (copied from case_plan with cognitive_error_id added per distractor),
 * error mapping, and hinge placement.
 */
export async function run(
  context: AgentContext,
  input: SkeletonWriterInput
): Promise<AgentOutput<QuestionSkeletonInput & { skeletonId: string }>> {
  const result = await runAgent({
    agentType: 'skeleton_writer',
    context,
    input,
    outputSchema: questionSkeletonSchema,
    buildUserMessage: (data) => ({
      blueprint_node: JSON.stringify(data.node, null, 2),
      algorithm_card: JSON.stringify(data.card, null, 2),
      fact_rows: JSON.stringify(data.facts, null, 2),
      case_plan: JSON.stringify(data.casePlan, null, 2),
    }),
  });

  if (!result.success) {
    return { ...result, data: null as unknown as QuestionSkeletonInput & { skeletonId: string } };
  }

  // Write skeleton to DB
  const supabase = createAdminClient();
  const { data: skeleton, error } = await supabase
    .from('question_skeleton')
    .insert({
      case_plan_id: input.casePlan.id,
      ...result.data,
    })
    .select('id')
    .single();

  if (error || !skeleton) {
    return {
      success: false,
      data: null as unknown as QuestionSkeletonInput & { skeletonId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert question_skeleton: ${error?.message}`,
    };
  }

  return {
    success: true,
    data: { ...result.data, skeletonId: skeleton.id },
    tokensUsed: result.tokensUsed,
  };
}
