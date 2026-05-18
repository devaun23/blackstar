import { createAdminClient } from '@/lib/supabase/admin';
import { itemDraftSchema } from '@/lib/factory/schemas';
import type { ItemDraftInput } from '@/lib/factory/schemas';
import type { RevisionInstructions } from '@/lib/factory/schemas/refine';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, AlgorithmCardRow, FactRowRow, ItemPlanRow, QuestionSkeletonRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';
import { resolveDIContext } from '../di-loader';
import { NBME_STEM_ANCHORS } from '../nbme-style-anchors';
import { formatNbmeLeadInsBlock } from '../nbme-lead-in-templates';
import { FIREWALL_INSTRUCTIONS } from '../source-firewall-instructions';

interface VariantMode {
  /** The skeleton to create a variant of */
  sourceSkeletonId: string;
  /** Which clinical surface features to change */
  surfaceChanges: {
    differentAge?: boolean;
    differentSex?: boolean;
    differentSetting?: boolean;
    differentPresentation?: boolean;
  };
}

interface VignetteWriterInput {
  node: BlueprintNodeRow;
  card: AlgorithmCardRow;
  plan: ItemPlanRow;
  facts: FactRowRow[];
  pipelineRunId: string;
  skeleton?: QuestionSkeletonRow; // v2: render from skeleton if provided
  variantMode?: VariantMode; // v20: generate variant with different surface features
  revisionInstructions?: RevisionInstructions; // v27 B2: refine-loop input (field-level fixes from refine-agent)
}

/**
 * Writes an NBME-style clinical vignette with cold chart style,
 * late hinge placement, and symmetric answer choices.
 */
export async function run(
  context: AgentContext,
  input: VignetteWriterInput
): Promise<AgentOutput<ItemDraftInput & { itemDraftId: string }>> {
  const result = await runAgent({
    agentType: 'vignette_writer',
    context,
    input,
    outputSchema: itemDraftSchema,
    buildUserMessage: async (data) => {
      // Include NBME case_presentation + distractor_rule types so the writer sees
      // how NBME actually structures vignettes and wrong-option design.
      const diContext = await resolveDIContext(data.node.topic, {
        itemTypes: [
          'clinical_pearl',
          'treatment_protocol',
          'comparison_table',
          'case_presentation',
          'distractor_rule',
        ],
      });
      const vars: Record<string, string> = {
        blueprint_node: JSON.stringify(data.node, null, 2),
        algorithm_card: JSON.stringify(data.card, null, 2),
        item_plan: JSON.stringify(data.plan, null, 2),
        fact_rows: JSON.stringify(data.facts, null, 2),
        di_context: diContext || 'No board review reference content available for this topic.',
        // Firewall instructions are appended to nbme_style_anchors so the
        // constraint reaches the model today even before the DB-stored prompt
        // template references {{firewall_instructions}} directly. Also passed
        // as a standalone var for prompts that do.
        nbme_style_anchors: `${FIREWALL_INSTRUCTIONS}\n\n${NBME_STEM_ANCHORS}`,
        firewall_instructions: FIREWALL_INSTRUCTIONS,
        // Task-type-filtered NBME lead-ins from the 2024 Item-Writing Guide, Appendix B.
        // Narrows the lead-in phrasing to ones actually used on NBME exams.
        nbme_lead_ins: formatNbmeLeadInsBlock(data.node.task_type),
      };
      if (data.skeleton) {
        vars.question_skeleton = JSON.stringify(data.skeleton, null, 2);
      }
      if (data.variantMode) {
        const changesToMake = Object.entries(data.variantMode.surfaceChanges)
          .filter(([, v]) => v)
          .map(([k]) => k.replace('different', '').toLowerCase())
          .join(', ');
        vars.variant_instructions = [
          'VARIANT GENERATION MODE: You are creating a VARIANT of an existing question.',
          'The variant must test the SAME transfer rule, decision fork, and cognitive errors',
          'but with DIFFERENT clinical surface features to prevent memorization.',
          '',
          `You MUST change: ${changesToMake || 'at least age, sex, or clinical setting'}`,
          'You MUST preserve: the correct answer logic, the hinge type, the decision fork,',
          'and the cognitive errors tested by each distractor.',
          '',
          'The variant should feel like a completely different patient scenario while testing',
          'the exact same clinical reasoning pathway.',
        ].join('\n');
      }
      if (data.revisionInstructions) {
        const r = data.revisionInstructions;
        const preserveLine = r.preserve && r.preserve.length > 0
          ? `PRESERVE these fields verbatim (do NOT regenerate): ${r.preserve.join(', ')}`
          : 'No explicit preserve list — keep fields that are already correct.';
        const revisionBlock = [
          `REFINE CYCLE ${r.cycle}: This is a regenerate-with-fixes pass.`,
          `Diagnosis: ${r.summary}`,
          '',
          'FIELD-LEVEL FIXES (apply each one):',
          ...r.instructions.map((inst, idx) => {
            const provenance = [
              inst.rubric_domain_failed ? `rubric=${inst.rubric_domain_failed}` : null,
              inst.hard_gate_failed ? `hard_gate=${inst.hard_gate_failed}` : null,
              inst.audit_item_failed ? `audit=${inst.audit_item_failed}` : null,
            ].filter(Boolean).join(', ');
            return `${idx + 1}. [${inst.target_field}] ${inst.defect} → ${inst.guidance}` +
              (provenance ? ` (${provenance})` : '');
          }),
          '',
          preserveLine,
        ].join('\n');
        // Expose as both a dedicated template var (forward-compat with DB prompt
        // updates that reference {{revision_instructions}} directly) and prepend
        // into nbme_style_anchors (which the current DB prompt already consumes)
        // so the model sees the instructions without requiring a DB prompt edit.
        vars.revision_instructions = revisionBlock;
        vars.nbme_style_anchors = `## REVISION INSTRUCTIONS\n${revisionBlock}\n\n${vars.nbme_style_anchors}`;
      } else {
        vars.revision_instructions = '';
      }
      return vars;
    },
  });

  if (!result.success) {
    return { ...result, data: null as unknown as ItemDraftInput & { itemDraftId: string } };
  }

  // Source-firewall provenance stamp (R-IP-03). Derived from the algorithm
  // card + dominant fact source so every item carries a citation trail back
  // to a Tier-A open-access guideline. Tier C ('C' on fact_row) is downgraded
  // to null on the item — those facts cannot be the primary citation.
  const dominantFact = input.facts.find((f) => f.source_tier === 'A')
    ?? input.facts.find((f) => f.source_tier === 'B')
    ?? input.facts[0];
  const itemTier: 'A' | 'B' | null = dominantFact?.source_tier === 'A' || dominantFact?.source_tier === 'B'
    ? dominantFact.source_tier
    : null;
  const sourceName = dominantFact?.source_name ?? null;
  const sourcePackId = sourceName
    ? sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null;
  const sourceCitations = input.card.source_citations?.length
    ? input.card.source_citations
    : null;

  // Write item draft to DB. Source-firewall provenance columns (source_pack_id,
  // source_name, source_tier, source_citations) require a pending migration —
  // if the columns aren't in the schema cache yet, retry without them. Mirrors
  // the publish-status fallback in pipeline-v2.ts:1202.
  const supabase = createAdminClient();
  const baseInsert = {
    item_plan_id: input.plan.id,
    blueprint_node_id: input.node.id,
    pipeline_run_id: input.pipelineRunId,
    status: 'draft',
    ...result.data,
  };
  let { data: draft, error } = await supabase
    .from('item_draft')
    .insert({
      ...baseInsert,
      source_pack_id: sourcePackId,
      source_name: sourceName,
      source_tier: itemTier,
      source_citations: sourceCitations,
    })
    .select('id')
    .single();

  if (error?.message?.includes('schema cache')) {
    ({ data: draft, error } = await supabase
      .from('item_draft')
      .insert(baseInsert)
      .select('id')
      .single());
  }

  if (error || !draft) {
    return {
      success: false,
      data: null as unknown as ItemDraftInput & { itemDraftId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert item_draft: ${error?.message}`,
    };
  }

  return {
    success: true,
    data: { ...result.data, itemDraftId: draft.id },
    tokensUsed: result.tokensUsed,
  };
}
