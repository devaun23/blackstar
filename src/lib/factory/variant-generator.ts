/**
 * Variant Generator: Creates new questions with different clinical surface features
 * but testing the same transfer rule / confusion set / cognitive error.
 *
 * Research basis (BMC study on detrimental question bank patterns, Price et al. 2025):
 * Serving the same question during spaced repetition trains memorization, not mastery.
 * Variants preserve the decision fork while changing surface features (age, sex, setting,
 * presentation style), forcing genuine clinical reasoning each time.
 *
 * Usage: CLI/API-triggered. Auto-trigger is a future optimization.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { PipelineResult, AgentContext, AgentStepResult } from '@/lib/types/factory';
import type {
  ItemDraftRow,
  AlgorithmCardRow,
  FactRowRow,
  ItemPlanRow,
  QuestionSkeletonRow,
  BlueprintNodeRow,
  ConfusionSetRow,
  CasePlanRow,
} from '@/lib/types/database';
import * as agents from './agents';
import { topicSourceMap } from './source-packs/topic-source-map';
import { loadPack } from './source-packs/index';
import type { SourcePack } from './source-packs/types';
import type { DrugOption } from './agents/explanation-writer';
import { randomUUID } from 'crypto';

/**
 * v22 — Regenerate ONLY the explanation fields on an existing item_draft.
 * Preserves vignette/options/correct_answer; re-runs explanation_writer v5
 * against the expanded contract (medicine_deep_dive, comparison_table,
 * pharmacology_notes, image_pointer). Intended for upgrading already-published
 * items to the new shape without re-validating the vignette.
 */
export async function regenerateExplanationOnly(
  sourceDraftId: string,
): Promise<{ success: boolean; error?: string; tokensUsed: number }> {
  const supabase = createAdminClient();
  const context: AgentContext = { pipelineRunId: randomUUID(), mockMode: false };

  const { data: draftData, error: draftErr } = await supabase
    .from('item_draft')
    .select('*')
    .eq('id', sourceDraftId)
    .single();
  if (draftErr || !draftData) {
    return { success: false, error: `draft not found: ${draftErr?.message}`, tokensUsed: 0 };
  }
  const draft = draftData as ItemDraftRow;
  if (!draft.case_plan_id) {
    return { success: false, error: 'draft has no case_plan_id — only v2 drafts can be explanation-regenerated', tokensUsed: 0 };
  }

  const [casePlanResult, nodeResult] = await Promise.all([
    supabase.from('case_plan').select('*').eq('id', draft.case_plan_id).single(),
    supabase.from('blueprint_node').select('*').eq('id', draft.blueprint_node_id).single(),
  ]);
  if (!casePlanResult.data || !nodeResult.data) {
    return { success: false, error: 'case_plan or blueprint_node missing', tokensUsed: 0 };
  }
  const casePlan = casePlanResult.data as CasePlanRow & { target_confusion_set_id?: string | null };
  const node = nodeResult.data as BlueprintNodeRow;

  const [cardResult, factsResult] = await Promise.all([
    supabase.from('algorithm_card').select('*').eq('id', casePlan.algorithm_card_id).single(),
    supabase.from('fact_row').select('*').eq('algorithm_card_id', casePlan.algorithm_card_id),
  ]);
  if (!cardResult.data) {
    return { success: false, error: 'algorithm_card missing', tokensUsed: 0 };
  }
  const card = cardResult.data as AlgorithmCardRow;
  const facts = (factsResult.data ?? []) as FactRowRow[];

  let confusionSet: ConfusionSetRow | null = null;
  if (casePlan.target_confusion_set_id) {
    const { data: cs } = await supabase
      .from('confusion_sets')
      .select('*')
      .eq('id', casePlan.target_confusion_set_id)
      .single();
    confusionSet = (cs as ConfusionSetRow | null) ?? null;
  }

  // Inline drug-option resolution (mirrors pipeline-v2 logic)
  const config = topicSourceMap[node.topic];
  const drugOptions: DrugOption[] = [];
  if (config) {
    const packIds = [config.primary, ...(config.secondary ?? []).map((s) => s.source_pack_id)];
    const packs = (await Promise.all(packIds.map((id) => loadPack(id)))).filter(
      (p): p is SourcePack => p !== null,
    );
    const selections = packs.flatMap((p) => p.drug_selection ?? []);
    const options = [
      { letter: 'A' as const, text: draft.choice_a ?? '' },
      { letter: 'B' as const, text: draft.choice_b ?? '' },
      { letter: 'C' as const, text: draft.choice_c ?? '' },
      { letter: 'D' as const, text: draft.choice_d ?? '' },
      { letter: 'E' as const, text: draft.choice_e ?? '' },
    ];
    const seen = new Set<string>();
    for (const opt of options) {
      const lower = opt.text.toLowerCase();
      for (const sel of selections) {
        if (!sel.pharmacology) continue;
        const candidates = [sel.first_line.drug, ...sel.alternatives.map((a) => a.drug)];
        for (const drugName of candidates) {
          const token = drugName.split(/[\s,(]+/)[0]?.toLowerCase();
          if (!token || token.length < 4) continue;
          if (lower.includes(token) && !seen.has(token)) {
            seen.add(token);
            drugOptions.push({
              drug: drugName,
              appears_as: opt.letter === draft.correct_answer ? 'correct_answer' : 'distractor',
              pharmacology: sel.pharmacology,
            });
            break;
          }
        }
      }
    }
  }

  const result = await agents.explanationWriter.run(context, {
    draft,
    card,
    facts,
    node,
    transferRuleText: casePlan.transfer_rule_text,
    confusionSet,
    drugOptions,
  });

  return {
    success: result.success,
    error: result.success ? undefined : result.error,
    tokensUsed: result.tokensUsed,
  };
}

interface VariantConfig {
  mockMode?: boolean;
  juryEnabled?: boolean;
}

/**
 * Generates a variant of an existing item_draft.
 *
 * Flow:
 * 1. Look up source draft's skeleton, case_plan, algorithm_card, facts, blueprint node
 * 2. Run vignette_writer in variant mode (different surface features, same decision fork)
 * 3. Run validation loop (same as pipeline-v2 steps 7+)
 * 4. Set variant_group_id on both source and new draft
 */
export async function generateVariant(
  sourceDraftId: string,
  config: VariantConfig = {},
): Promise<PipelineResult> {
  const supabase = createAdminClient();
  const steps: AgentStepResult[] = [];
  let totalTokens = 0;
  const start = Date.now();

  // Create a pipeline_run row so the FK constraint on item_draft is satisfied
  const { data: run, error: runError } = await supabase
    .from('pipeline_run')
    .insert({ status: 'running' })
    .select('id')
    .single();

  if (runError || !run) {
    return makeFailResult(randomUUID(), steps, totalTokens, start,
      `Failed to create pipeline_run: ${runError?.message}`);
  }

  const context: AgentContext = {
    pipelineRunId: run.id,
    mockMode: config.mockMode ?? false,
  };

  // ── Step 1: Load source draft and all linked data ──

  const { data: sourceDraft, error: draftErr } = await supabase
    .from('item_draft')
    .select('*')
    .eq('id', sourceDraftId)
    .single();

  if (draftErr || !sourceDraft) {
    return makeFailResult(context.pipelineRunId, steps, totalTokens, start,
      `Source draft not found: ${draftErr?.message ?? sourceDraftId}`);
  }

  const draft = sourceDraft as ItemDraftRow;

  if (!draft.case_plan_id || !draft.question_skeleton_id) {
    return makeFailResult(context.pipelineRunId, steps, totalTokens, start,
      'Source draft missing case_plan_id or question_skeleton_id — only v2 pipeline drafts support variant generation');
  }

  // Load all linked data in parallel
  const [casePlanResult, skeletonResult, nodeResult] = await Promise.all([
    supabase.from('case_plan').select('*').eq('id', draft.case_plan_id).single(),
    supabase.from('question_skeleton').select('*').eq('id', draft.question_skeleton_id).single(),
    supabase.from('blueprint_node').select('*').eq('id', draft.blueprint_node_id).single(),
  ]);

  if (!casePlanResult.data || !skeletonResult.data || !nodeResult.data) {
    return makeFailResult(context.pipelineRunId, steps, totalTokens, start,
      'Failed to load case_plan, skeleton, or blueprint_node for source draft');
  }

  const node = nodeResult.data as BlueprintNodeRow;
  const skeleton = skeletonResult.data as QuestionSkeletonRow;

  // Load algorithm card and facts via the case plan's algorithm_card_id
  const casePlan = casePlanResult.data;
  const [cardResult, factsResult, planResult] = await Promise.all([
    supabase.from('algorithm_card').select('*').eq('id', casePlan.algorithm_card_id).single(),
    supabase.from('fact_row').select('*').eq('algorithm_card_id', casePlan.algorithm_card_id),
    supabase.from('item_plan').select('*').eq('id', draft.item_plan_id).single(),
  ]);

  if (!cardResult.data || !planResult.data) {
    return makeFailResult(context.pipelineRunId, steps, totalTokens, start,
      'Failed to load algorithm_card or item_plan for source draft');
  }

  const card = cardResult.data as AlgorithmCardRow;
  const facts = (factsResult.data ?? []) as FactRowRow[];
  const plan = planResult.data as ItemPlanRow;

  // ── Step 2: Run vignette_writer in variant mode ──

  const vignetteStart = Date.now();
  const vignetteResult = await agents.vignetteWriter.run(context, {
    node,
    card,
    plan,
    facts,
    pipelineRunId: context.pipelineRunId,
    skeleton,
    variantMode: {
      sourceSkeletonId: skeleton.id,
      surfaceChanges: {
        differentAge: true,
        differentSex: true,
        differentSetting: true,
        differentPresentation: true,
      },
    },
  });

  steps.push({
    agent: 'vignette_writer',
    success: vignetteResult.success,
    tokensUsed: vignetteResult.tokensUsed,
    durationMs: Date.now() - vignetteStart,
    output: vignetteResult.success ? { itemDraftId: vignetteResult.data?.itemDraftId } : { error: vignetteResult.error },
    error: vignetteResult.error,
  });
  totalTokens += vignetteResult.tokensUsed;

  if (!vignetteResult.success || !vignetteResult.data?.itemDraftId) {
    return makeFailResult(context.pipelineRunId, steps, totalTokens, start,
      `Variant vignette generation failed: ${vignetteResult.error}`);
  }

  const newDraftId = vignetteResult.data.itemDraftId;

  // ── Step 3: Set variant_group_id on both source and new draft ──

  let variantGroupId = draft.variant_group_id;
  if (!variantGroupId) {
    variantGroupId = randomUUID();
    // Set on source draft (first time creating a variant for this draft)
    await supabase
      .from('item_draft')
      .update({ variant_group_id: variantGroupId })
      .eq('id', sourceDraftId);
  }

  // Set on new draft
  await supabase
    .from('item_draft')
    .update({
      variant_group_id: variantGroupId,
      case_plan_id: draft.case_plan_id,
      question_skeleton_id: draft.question_skeleton_id,
    })
    .eq('id', newDraftId);

  // ── Step 4: Run validation (simplified — medical validator only for variants) ──
  // Full 6-validator loop is in pipeline-v2. For variants, we run medical + exam_translation
  // since the skeleton/case_plan are already validated.

  const validationStart = Date.now();
  const { data: newDraft } = await supabase
    .from('item_draft')
    .select('*')
    .eq('id', newDraftId)
    .single();

  if (newDraft) {
    const medicalResult = await agents.medicalValidator.run(context, {
      draft: newDraft as ItemDraftRow,
      card,
      facts,
      topic: node.topic,
      skeleton,
    });

    steps.push({
      agent: 'medical_validator',
      success: medicalResult.success,
      tokensUsed: medicalResult.tokensUsed,
      durationMs: Date.now() - validationStart,
      output: medicalResult.data,
    });
    totalTokens += medicalResult.tokensUsed;

    if (medicalResult.success && medicalResult.data && !medicalResult.data.passed) {
      // Variant failed validation — mark as draft (needs repair or human review)
      await supabase
        .from('item_draft')
        .update({ status: 'draft', review_status: 'flagged_uncertain' })
        .eq('id', newDraftId);
    } else if (medicalResult.success && medicalResult.data?.passed) {
      // Variant passed — mark as pending review
      await supabase
        .from('item_draft')
        .update({ status: 'published', review_status: 'pending_review' })
        .eq('id', newDraftId);
    }
  }

  // Update pipeline_run with final status
  await supabase
    .from('pipeline_run')
    .update({
      status: 'completed',
      total_tokens_used: totalTokens,
      completed_at: new Date().toISOString(),
      blueprint_node_id: node.id,
    })
    .eq('id', context.pipelineRunId);

  return {
    runId: context.pipelineRunId,
    status: 'completed',
    itemDraftId: newDraftId,
    finalStatus: 'draft',
    steps,
    totalTokens,
    totalDurationMs: Date.now() - start,
  };
}

function makeFailResult(
  runId: string,
  steps: AgentStepResult[],
  totalTokens: number,
  start: number,
  _error: string,
): PipelineResult {
  return {
    runId,
    status: 'failed',
    finalStatus: 'draft',
    steps,
    totalTokens,
    totalDurationMs: Date.now() - start,
  };
}
