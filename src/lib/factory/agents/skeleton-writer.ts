import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { questionSkeletonSchema } from '@/lib/factory/schemas';
import type { QuestionSkeletonInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, AlgorithmCardRow, FactRowRow, CasePlanRow, ErrorTaxonomyRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface SkeletonWriterInput {
  node: BlueprintNodeRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  casePlan: CasePlanRow;
  errors?: ErrorTaxonomyRow[];
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
  // Build error name → UUID lookup for resolving LLM-output names to real IDs
  const errorNameToId = new Map(
    (input.errors ?? []).map(e => [e.error_name.toLowerCase(), e.id])
  );

  function resolveErrorId(val: unknown): string | null {
    if (!val || typeof val !== 'string') return null;
    if (/^[0-9a-f]{8}-/i.test(val)) return val; // already UUID
    const lower = val.toLowerCase();
    // Exact match
    const exact = errorNameToId.get(lower);
    if (exact) return exact;
    // Partial match (e.g., "premature_closure" matches "premature_closure_on_diagnosis")
    for (const [key, id] of errorNameToId.entries()) {
      if (key.includes(lower) || lower.includes(key.slice(0, 20))) return id;
    }
    return null;
  }

  // Preprocess to resolve cognitive_error_id names to UUIDs (or null if unresolvable)
  const resolvedSkeletonSchema = z.preprocess((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.option_frames)) {
      obj.option_frames = obj.option_frames.map((frame: Record<string, unknown>) => ({
        ...frame,
        cognitive_error_id: resolveErrorId(frame.cognitive_error_id),
        action_class_id: typeof frame.action_class_id === 'string' && !/^[0-9a-f]{8}-/i.test(frame.action_class_id)
          ? null : frame.action_class_id,
      }));
    }
    // Also fix correct_action_class_id
    if (typeof obj.correct_action_class_id === 'string' && !/^[0-9a-f]{8}-/i.test(obj.correct_action_class_id)) {
      obj.correct_action_class_id = null;
    }
    return obj;
  }, questionSkeletonSchema);

  const result = await runAgent({
    agentType: 'skeleton_writer',
    context,
    input,
    outputSchema: resolvedSkeletonSchema,
    buildUserMessage: (data) => ({
      blueprint_node: JSON.stringify(data.node, null, 2),
      algorithm_card: JSON.stringify(data.card, null, 2),
      fact_rows: JSON.stringify(data.facts, null, 2),
      case_plan: JSON.stringify(data.casePlan, null, 2),
      error_taxonomy: JSON.stringify(
        (data.errors ?? []).map(e => ({ id: e.id, error_name: e.error_name })),
        null, 2
      ),
    }),
  });

  if (!result.success) {
    return { ...result, data: null as unknown as QuestionSkeletonInput & { skeletonId: string } };
  }

  // Write skeleton to DB — only include fields in the schema
  const supabase = createAdminClient();
  const skeletonFields = [
    'case_summary', 'hidden_target', 'correct_action', 'correct_action_class_id',
    'option_action_class', 'option_frames', 'correct_option_frame_id',
    'error_mapping', 'hinge_placement', 'hinge_description', 'hinge_depth', 'hinge_buried_by',
  ] as const;
  const skeletonPayload: Record<string, unknown> = { case_plan_id: input.casePlan.id };
  for (const key of skeletonFields) {
    if (key in result.data) {
      skeletonPayload[key] = (result.data as Record<string, unknown>)[key];
    }
  }
  const { data: skeleton, error } = await supabase
    .from('question_skeleton')
    .insert(skeletonPayload)
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
