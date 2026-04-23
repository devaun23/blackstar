import { createAdminClient } from '@/lib/supabase/admin';
import { explanationOutputSchema } from '@/lib/factory/schemas';
import type { ExplanationOutput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, FactRowRow, BlueprintNodeRow, ConfusionSetRow, CasePlanRow } from '@/lib/types/database';
import type { DrugPharmacology } from '@/lib/factory/source-packs/types';
import { runAgent } from '../agent-helpers';
import { getVisualCoverage } from '../seeds/visual-coverage';
import { resolveDIContext } from '../di-loader';
import { resolveSourceContext } from '../source-loader';
import { NBME_STEM_ANCHORS } from '../nbme-style-anchors';

/** Drug appearing in the draft's options, paired with its board-testable pharmacology. */
export interface DrugOption {
  drug: string;
  appears_as: 'correct_answer' | 'distractor';
  pharmacology: DrugPharmacology;
}

interface ExplanationWriterInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
  facts: FactRowRow[];
  node?: BlueprintNodeRow;
  transferRuleText?: string;  // From case_plan — declared before the question was written
  targetCognitiveErrorId?: string;  // From case_plan — for Palmerton gap coaching
  confusionSet?: ConfusionSetRow | null;  // v22 — drives comparison_table output
  drugOptions?: DrugOption[];  // v22 — drives pharmacology_notes output
  casePlan?: CasePlanRow;     // v23 — supplies difficulty_class + option archetypes for Rule 2 / Rule 4
}

/** Render confusion-set context for the prompt. "NONE" if not applicable. */
function renderConfusionSetBlock(cs: ConfusionSetRow | null | undefined): string {
  if (!cs) return 'NONE';
  const conditions = Array.isArray(cs.conditions) ? (cs.conditions as string[]) : [];
  const clues = Array.isArray(cs.discriminating_clues) ? cs.discriminating_clues as unknown[] : [];
  const traps = Array.isArray(cs.common_traps) ? cs.common_traps : [];
  return JSON.stringify({
    id: cs.id,  // UUID — model must echo this verbatim into comparison_table.confusion_set_id, NEVER invent a slug
    name: cs.name,
    condition_a: conditions[0] ?? '',
    condition_b: conditions[1] ?? '',
    discriminating_clues_hint: clues,
    common_traps: traps,
  }, null, 2);
}

/** Render drug-options context for the prompt. "NONE" if no drug options. */
function renderDrugOptionsBlock(drugOptions: DrugOption[] | undefined): string {
  if (!drugOptions || drugOptions.length === 0) return 'NONE';
  return JSON.stringify(drugOptions, null, 2);
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
    // v22 — UWorld-depth output needs headroom: deep-dive + comparison table + pharmacology cards
    // often exceed the 4096 default. 12k leaves slack for repair and retry.
    maxTokens: 12000,
    buildUserMessage: async (data) => {
      const topic = data.node?.topic ?? '';
      // Fetch DI/IC/AMBOSS/NBME evidence items and guideline source-pack prose in parallel.
      // skipEnrichment on source_context avoids duplicating the DI items (which already
      // flow in via di_context), while still surfacing full guideline text.
      const [diContext, sourceContext] = topic
        ? await Promise.all([
            resolveDIContext(topic),
            resolveSourceContext(topic, { skipEnrichment: true }),
          ])
        : ['', ''];
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(data.draft, null, 2),
        algorithm_card: JSON.stringify(data.card, null, 2),
        fact_rows: JSON.stringify(data.facts, null, 2),
        di_context: diContext || 'No board review reference content available for this topic.',
        source_context: sourceContext || 'No primary-source guideline prose available for this topic.',
        nbme_style_anchors: NBME_STEM_ANCHORS,
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

      // Pass Palmerton coaching data for gap-specific explanation framing
      if (data.targetCognitiveErrorId) {
        const adminClient = createAdminClient();
        const { data: errorRow } = await adminClient
          .from('error_taxonomy')
          .select('error_name, palmerton_gap_type, palmerton_coaching_note')
          .eq('id', data.targetCognitiveErrorId)
          .single();

        if (errorRow) {
          vars.target_cognitive_error = errorRow.error_name;
          vars.palmerton_gap_type = errorRow.palmerton_gap_type ?? 'unknown';
          vars.palmerton_coaching_note = errorRow.palmerton_coaching_note ?? '';
        }
      }

      if (!vars.target_cognitive_error) {
        vars.target_cognitive_error = 'Not specified';
        vars.palmerton_gap_type = 'Not specified';
        vars.palmerton_coaching_note = 'Not specified';
      }

      // v22 — confusion-set context and drug-options context for the deep-dive layer
      vars.confusion_set_block = renderConfusionSetBlock(data.confusionSet);
      vars.drug_options_block = renderDrugOptionsBlock(data.drugOptions);

      // v23 — supply case_plan so writer knows difficulty_class (Rule 2) and
      // option_frames archetypes (Rule 4 primary_competitor identification)
      vars.case_plan = data.casePlan
        ? JSON.stringify({
            difficulty_class: data.casePlan.difficulty_class,
            reasoning_steps: data.casePlan.reasoning_steps,
            option_frames: data.casePlan.option_frames,
            correct_option_frame_id: data.casePlan.correct_option_frame_id,
          }, null, 2)
        : 'Not supplied — infer difficulty_class as decision_fork and identify primary_competitor from draft context';

      return vars;
    },
  });

  if (!result.success) {
    return result;
  }

  // Build update payload — exclude visual_specs (column doesn't exist)
  const { visual_specs: _vs, ...updatePayload } = result.data as Record<string, unknown>;

  // Update the draft with explanations
  const supabase = createAdminClient();
  let { error } = await supabase
    .from('item_draft')
    .update(updatePayload)
    .eq('id', input.draft.id);

  // If update fails due to missing columns, try without fields whose DB columns
  // may not yet exist. v22 columns (medicine_deep_dive etc.) ARE in the schema
  // post-migration, so they stay in the payload; the strip covers only columns
  // that were never added (explanation_counterfactual) or are known-volatile.
  if (error?.message?.includes('schema cache')) {
    const safePayload = { ...updatePayload };
    for (const key of [
      'visual_specs',
      'explanation_gap_coaching',
      'explanation_counterfactual',
      // v24 — strip if migration hasn't landed yet during v7 rollout
      'anchor_rule',
      'illness_script',
      'reasoning_compressed',
      'management_protocol',
      'traps',
    ]) {
      if (key in safePayload) delete safePayload[key];
    }
    const retry = await supabase
      .from('item_draft')
      .update(safePayload)
      .eq('id', input.draft.id);
    error = retry.error;
  }

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
