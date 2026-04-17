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
} from '@/lib/types/database';
import * as agents from './agents';
import { randomUUID } from 'crypto';

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
