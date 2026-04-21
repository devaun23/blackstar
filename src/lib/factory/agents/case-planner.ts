import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { casePlanSchema } from '@/lib/factory/schemas';
import type { CasePlanInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, AlgorithmCardRow, FactRowRow, ErrorTaxonomyRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';
import { resolveDIContext } from '../di-loader';

interface CasePlannerInput {
  node: BlueprintNodeRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  errors: ErrorTaxonomyRow[];
  // Optional ontology lookups (pre-fetched by pipeline)
  hingeClueTypes?: { id: string; name: string }[];
  actionClasses?: { id: string; name: string; priority_rank: number }[];
  confusionSets?: { id: string; name: string }[];
  transferRules?: { id: string; rule_text: string }[];
}

/**
 * Plans a question by selecting ontology targets and defining difficulty dimensions.
 * Outputs a case_plan linking to transfer_rule, confusion_set, cognitive_error,
 * hinge_clue_type, and action_class — plus difficulty and strategy parameters.
 */
export async function run(
  context: AgentContext,
  input: CasePlannerInput
): Promise<AgentOutput<CasePlanInput & { casePlanId: string }>> {
  // Build lookup maps so we can resolve names→UUIDs if Claude outputs names instead of IDs
  const errorNameToId = new Map(input.errors.map(e => [e.error_name.toLowerCase(), e.id]));
  const confusionNameToId = new Map((input.confusionSets ?? []).map(c => [c.name.toLowerCase(), c.id]));
  const transferTextToId = new Map((input.transferRules ?? []).map(t => [t.rule_text.slice(0, 50).toLowerCase(), t.id]));
  const hingeNameToId = new Map((input.hingeClueTypes ?? []).map(h => [h.name.toLowerCase(), h.id]));
  const actionNameToId = new Map((input.actionClasses ?? []).map(a => [a.name.toLowerCase(), a.id]));

  function resolveId(val: unknown, lookups: Map<string, string>[]): string | null {
    if (!val || typeof val !== 'string') return null;
    if (/^[0-9a-f]{8}-/i.test(val)) return val; // already UUID
    const lower = val.toLowerCase();
    for (const lookup of lookups) {
      // Exact match
      const exact = lookup.get(lower);
      if (exact) return exact;
      // Partial match
      for (const [key, id] of lookup.entries()) {
        if (key.includes(lower) || lower.includes(key.slice(0, 20))) return id;
      }
    }
    return null;
  }

  // Schema that preprocesses the entire object to resolve names→UUIDs before validation
  const resolvedSchema = z.preprocess((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const obj = raw as Record<string, unknown>;
    return {
      ...obj,
      target_cognitive_error_id: resolveId(obj.target_cognitive_error_id, [errorNameToId]),
      target_confusion_set_id: resolveId(obj.target_confusion_set_id, [confusionNameToId]),
      target_transfer_rule_id: resolveId(obj.target_transfer_rule_id, [transferTextToId]),
      target_hinge_clue_type_id: resolveId(obj.target_hinge_clue_type_id, [hingeNameToId]),
      target_action_class_id: resolveId(obj.target_action_class_id, [actionNameToId]),
    };
  }, casePlanSchema);

  const result = await runAgent({
    agentType: 'case_planner',
    context,
    input,
    outputSchema: resolvedSchema,
    buildUserMessage: async (data) => {
      const diContext = await resolveDIContext(data.node.topic, {
        itemTypes: ['clinical_pearl', 'risk_factor', 'mnemonic'],
      });
      return {
        blueprint_node: JSON.stringify(data.node, null, 2),
        algorithm_card: JSON.stringify(data.card, null, 2),
        fact_rows: JSON.stringify(data.facts, null, 2),
        error_taxonomy: JSON.stringify(data.errors, null, 2),
        hinge_clue_types: JSON.stringify(data.hingeClueTypes ?? [], null, 2),
        action_classes: JSON.stringify(data.actionClasses ?? [], null, 2),
        confusion_sets: JSON.stringify(data.confusionSets ?? [], null, 2),
        transfer_rules: JSON.stringify(data.transferRules ?? [], null, 2),
        di_context: diContext || 'No board review reference content available for this topic.',
      };
    },
  });

  if (!result.success) {
    return { ...result, data: null as unknown as CasePlanInput & { casePlanId: string } };
  }

  // Write case plan to DB — only include fields that exist in the case_plan table schema
  const supabase = createAdminClient();
  const casePlanFields = [
    'cognitive_operation_type', 'transfer_rule_text', 'hinge_depth_target',
    'decision_fork_type', 'decision_fork_description', 'option_action_class',
    'option_frames', 'correct_option_frame_id', 'distractor_rationale_by_frame',
    'forbidden_option_classes', 'target_transfer_rule_id', 'target_confusion_set_id',
    'target_cognitive_error_id', 'target_hinge_clue_type_id', 'target_action_class_id',
    'ambiguity_level', 'distractor_strength', 'clinical_complexity',
    'ambiguity_strategy', 'distractor_design', 'final_decisive_clue',
    'explanation_teaching_goal',
  ] as const;
  const dbPayload: Record<string, unknown> = {
    blueprint_node_id: input.node.id,
    algorithm_card_id: input.card.id,
  };
  for (const key of casePlanFields) {
    if (key in result.data) {
      dbPayload[key] = (result.data as Record<string, unknown>)[key];
    }
  }

  // Compute variant_group_id: hash of transfer_rule_id + confusion_set_id
  // Questions in the same variant group test the same rule/confusion set and
  // should be treated as variants for spaced review (never served in same session).
  const trId = dbPayload.target_transfer_rule_id as string | null;
  const csId = dbPayload.target_confusion_set_id as string | null;
  if (trId || csId) {
    const raw = `${trId ?? 'none'}:${csId ?? 'none'}`;
    // Simple hash → UUID-like string for variant_group_id
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    dbPayload.variant_group_id = `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(1, 4)}-${hex.padEnd(12, '0').slice(0, 12)}`;
  }

  const { data: plan, error } = await supabase
    .from('case_plan')
    .insert(dbPayload)
    .select('id')
    .single();

  if (error || !plan) {
    return {
      success: false,
      data: null as unknown as CasePlanInput & { casePlanId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert case_plan: ${error?.message}`,
    };
  }

  return {
    success: true,
    data: { ...result.data, casePlanId: plan.id },
    tokensUsed: result.tokensUsed,
  };
}
