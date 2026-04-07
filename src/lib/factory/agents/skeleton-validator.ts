import { createAdminClient } from '@/lib/supabase/admin';
import { skeletonValidatorOutputSchema } from '@/lib/factory/schemas';
import type { SkeletonValidatorOutput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { CasePlanRow, QuestionSkeletonRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface SkeletonValidatorInput {
  casePlan: CasePlanRow;
  skeleton: QuestionSkeletonRow;
}

/**
 * Validates the question skeleton's logical coherence before prose generation:
 * - Wrong option archetypes map to distinct cognitive errors
 * - Hinge placement is consistent with case plan targets
 * - Error mapping covers all wrong options
 * - Correct action matches the targeted action class
 */
export async function run(
  context: AgentContext,
  input: SkeletonValidatorInput
): Promise<AgentOutput<SkeletonValidatorOutput & { skeletonValidated: boolean }>> {
  const result = await runAgent({
    agentType: 'skeleton_validator',
    context,
    input,
    outputSchema: skeletonValidatorOutputSchema,
    buildUserMessage: (data) => ({
      case_plan: JSON.stringify(data.casePlan, null, 2),
      question_skeleton: JSON.stringify(data.skeleton, null, 2),
    }),
  });

  if (!result.success) {
    return { ...result, data: null as unknown as SkeletonValidatorOutput & { skeletonValidated: boolean } };
  }

  const validated = result.data.skeleton_validated;

  // Update skeleton's validated flag in DB
  const supabase = createAdminClient();
  await supabase
    .from('question_skeleton')
    .update({ skeleton_validated: validated })
    .eq('id', input.skeleton.id);

  return {
    success: true,
    data: { ...result.data, skeletonValidated: validated },
    tokensUsed: result.tokensUsed,
  };
}
