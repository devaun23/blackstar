// Blackstar Master Rubric — publish-decision authority.
//
// Orchestrates the 4-step flow specified in BLACKSTAR_RUBRIC_INTEGRATION.md §4:
//   1. Deterministic hard-gate pre-check.
//   2. Score aggregation for 7 of 10 domains from existing validator reports.
//   3. LLM evaluation for 3 new domains + both sub-rubrics (explanation, learner modeling).
//   4. Compose full score_object → deriveMasterRubricDecision() → persist.
//
// On hard-gate fail we SKIP step 3 entirely — no tokens spent on items that
// already cannot publish. The score_object is still persisted (with
// publish_decision='reject') so the reviewer queue has the full reason set.

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAgent } from '../agent-helpers';
import { detectHardGates, type HardGateInput } from '../rubric/hard-gates';
import { aggregateExistingDomains } from '../rubric/aggregation';
import { assembleMetadata, type MetadataAssemblyInput } from '../rubric/metadata';
import {
  masterRubricScoreSchema,
  explanationSubScoresSchema,
  learnerModelingSubScoresSchema,
  deriveMasterRubricDecision,
  type MasterDomainScores,
  type MasterRubricScore,
} from '../schemas/master-rubric';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type {
  ItemDraftRow,
  CasePlanRow,
  BlueprintNodeRow,
  ConfusionSetRow,
  ValidatorReportRow,
} from '@/lib/types/database';

export interface RubricEvaluatorInput {
  draft: ItemDraftRow;
  casePlan: CasePlanRow | null;
  node: BlueprintNodeRow | null;
  confusionSet: ConfusionSetRow | null;
  /** error_name strings resolved from case_plan's cognitive error target. */
  cognitiveErrorNames: string[];
  /** Validator reports keyed by validator_type (medical, blueprint, nbme_quality, option_symmetry, explanation_quality, exam_translation, contraindication). */
  validatorReports: Partial<Record<string, ValidatorReportRow>>;
  /** Optional: existing 1-5 rubric_scorer overall score for explanation-quality nudge. */
  rubricScorerOverall?: number | null;
  model?: string;
}

// ─── LLM output schema — only the 3 new domains + 2 sub-rubrics ─────────────
// We do NOT ask the LLM for the 7 aggregated domains; those are deterministic
// from existing validator reports. Separating keeps the LLM focused and the
// token budget tight.

const rubricLlmOutputSchema = z.object({
  hinge_design_ambiguity:      z.number().int().min(0).max(10),
  learner_modeling_value:      z.number().int().min(0).max(8),
  adaptive_sequencing_utility: z.number().int().min(0).max(5),
  explanation_sub_scores:      explanationSubScoresSchema.unwrap(),
  learner_modeling_sub_scores: learnerModelingSubScoresSchema.unwrap(),
  notes:                        z.string().max(500).nullable(),
});
type RubricLlmOutput = z.infer<typeof rubricLlmOutputSchema>;

// ─── Persistence ───────────────────────────────────────────────────────────

async function insertRubricScore(
  score: MasterRubricScore,
  graderModel: string | null,
): Promise<{ rubricScoreId: string | null; error: string | null }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rubric_score')
    .insert({
      item_draft_id: score.item_id,
      rubric_version: 'master_v1',
      hard_gate_pass: score.hard_gate_pass,
      total_score: score.total_score,
      publish_decision: score.publish_decision,
      score_object: score as unknown as Record<string, unknown>,
      grader_model: graderModel,
      agent_prompt_version: null,
    })
    .select('id')
    .single();
  if (error || !data) return { rubricScoreId: null, error: error?.message ?? 'insert failed' };
  return { rubricScoreId: data.id, error: null };
}

// ─── Main ──────────────────────────────────────────────────────────────────

export async function run(
  context: AgentContext,
  input: RubricEvaluatorInput,
): Promise<AgentOutput<MasterRubricScore & { rubricScoreId: string | null }>> {
  const { draft, casePlan, node, confusionSet, cognitiveErrorNames, validatorReports, rubricScorerOverall = null, model } = input;

  // ── Step 1: Deterministic hard-gate pre-check ─────────────────────────────
  const hardGateInput: HardGateInput = {
    draft,
    casePlan,
    node,
    validatorReports,
  };
  const gates = detectHardGates(hardGateInput);

  // Metadata completeness fuels production_readiness and the metadata hard gate.
  const metadataComplete = !gates.reasons.includes('missing_required_metadata');

  const metadataInput: MetadataAssemblyInput = {
    draft,
    casePlan,
    node,
    confusionSet,
    cognitiveErrorNames,
    nextItemIfPass: (casePlan as unknown as { next_item_if_pass?: string | null })?.next_item_if_pass ?? null,
    nextItemIfFail: (casePlan as unknown as { next_item_if_fail?: string | null })?.next_item_if_fail ?? null,
  };
  const metadata = assembleMetadata(metadataInput);

  // If a hard gate fired, short-circuit to reject. No LLM call.
  if (!gates.pass) {
    const zeroScores: MasterDomainScores = {
      medical_correctness_scope: 0,
      blueprint_alignment: 0,
      nbme_stem_fidelity: 0,
      hinge_design_ambiguity: 0,
      option_set_quality_symmetry: 0,
      key_integrity: 0,
      explanation_quality: 0,
      learner_modeling_value: 0,
      adaptive_sequencing_utility: 0,
      production_readiness: 0,
    };
    const rejectScore: MasterRubricScore = {
      item_id: draft.id,
      hard_gate_pass: false,
      hard_gate_fail_reasons: gates.reasons,
      scores: zeroScores,
      total_score: 0,
      publish_decision: 'reject',
      metadata,
      notes: `Hard gate fail: ${gates.reasons.join(', ')}. See raw_output.detail for per-gate context.`,
      explanation_sub_scores: null,
      learner_modeling_sub_scores: null,
    };
    const parsed = masterRubricScoreSchema.safeParse(rejectScore);
    if (!parsed.success) {
      return {
        success: false,
        data: null as unknown as MasterRubricScore & { rubricScoreId: string | null },
        tokensUsed: 0,
        error: `Reject-path score failed Zod: ${parsed.error.message}`,
      };
    }
    const { rubricScoreId, error } = await insertRubricScore(rejectScore, null);
    if (error) {
      return {
        success: false,
        data: null as unknown as MasterRubricScore & { rubricScoreId: string | null },
        tokensUsed: 0,
        error: `rubric_score insert failed: ${error}`,
      };
    }
    return {
      success: true,
      data: { ...rejectScore, rubricScoreId },
      tokensUsed: 0,
    };
  }

  // ── Step 2: Aggregate 7 existing-domain scores ────────────────────────────
  const existing = aggregateExistingDomains({
    reportsByType: validatorReports,
    rubricScorerOverall,
    hardGatePass: true,
    metadataComplete,
    v23StrictMissingCount: gates.metadataDetail.v23StrictMissing.length,
  });

  // ── Step 3: LLM grade the 3 new domains + both sub-rubrics ───────────────
  const llmResult = await runAgent({
    agentType: 'rubric_evaluator',
    context,
    input: {
      draft,
      casePlan,
      existing_domain_scores: existing,
    },
    outputSchema: rubricLlmOutputSchema,
    maxTokens: 2500,
    buildUserMessage: (data) => ({
      item_draft: JSON.stringify(data.draft, null, 2),
      case_plan: data.casePlan ? JSON.stringify(data.casePlan, null, 2) : 'NONE',
      existing_domain_scores: JSON.stringify(data.existing_domain_scores, null, 2),
    }),
    ...(model ? { model } : {}),
  });

  if (!llmResult.success) {
    return {
      success: false,
      data: null as unknown as MasterRubricScore & { rubricScoreId: string | null },
      tokensUsed: llmResult.tokensUsed,
      error: `rubric_evaluator LLM call failed: ${llmResult.error ?? 'unknown'}`,
    };
  }

  const llm: RubricLlmOutput = llmResult.data;

  // ── Step 4: Compose, derive decision, persist ────────────────────────────
  const scores: MasterDomainScores = {
    ...existing,
    hinge_design_ambiguity: llm.hinge_design_ambiguity,
    learner_modeling_value: llm.learner_modeling_value,
    adaptive_sequencing_utility: llm.adaptive_sequencing_utility,
  };
  const totalScore =
    scores.medical_correctness_scope + scores.blueprint_alignment + scores.nbme_stem_fidelity +
    scores.hinge_design_ambiguity + scores.option_set_quality_symmetry + scores.key_integrity +
    scores.explanation_quality + scores.learner_modeling_value + scores.adaptive_sequencing_utility +
    scores.production_readiness;

  const decision = deriveMasterRubricDecision(true, scores, totalScore);

  // Annotate notes with v23-strict metadata gaps so reviewers can see why
  // production_readiness was docked below 10.
  const v23Gaps = gates.metadataDetail.v23StrictMissing;
  const v23Note = v23Gaps.length > 0
    ? `v23_strict_missing: ${v23Gaps.join(', ')}. `
    : '';
  const composedNotes = (v23Note + (llm.notes ?? '')).trim() || null;

  const finalScore: MasterRubricScore = {
    item_id: draft.id,
    hard_gate_pass: true,
    hard_gate_fail_reasons: [],
    scores,
    total_score: totalScore,
    publish_decision: decision,
    metadata,
    notes: composedNotes,
    explanation_sub_scores: llm.explanation_sub_scores,
    learner_modeling_sub_scores: llm.learner_modeling_sub_scores,
  };

  const parsed = masterRubricScoreSchema.safeParse(finalScore);
  if (!parsed.success) {
    return {
      success: false,
      data: null as unknown as MasterRubricScore & { rubricScoreId: string | null },
      tokensUsed: llmResult.tokensUsed,
      error: `Composed score failed Zod: ${parsed.error.message}`,
    };
  }

  const { rubricScoreId, error: insertErr } = await insertRubricScore(finalScore, model ?? null);
  if (insertErr) {
    return {
      success: false,
      data: null as unknown as MasterRubricScore & { rubricScoreId: string | null },
      tokensUsed: llmResult.tokensUsed,
      error: `rubric_score insert failed: ${insertErr}`,
    };
  }

  return {
    success: true,
    data: { ...finalScore, rubricScoreId },
    tokensUsed: llmResult.tokensUsed,
  };
}
