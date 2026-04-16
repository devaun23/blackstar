import { createAdminClient } from '@/lib/supabase/admin';
import type {
  PipelineConfig,
  PipelineResult,
  AgentStepResult,
  AgentContext,
} from '@/lib/types/factory';
import type {
  AgentType,
  BlueprintNodeRow,
  AlgorithmCardRow,
  FactRowRow,
  ItemPlanRow,
  ItemDraftRow,
  ErrorTaxonomyRow,
  ValidatorReportRow,
  AgentLogEntry,
  CasePlanRow,
  QuestionSkeletonRow,
} from '@/lib/types/database';
import * as agents from './agents';
import { checkSourceSufficiency } from './source-packs/sufficiency';
import { topicSourceMap } from './source-packs/topic-source-map';
import { validateVisualSpecs } from './validators/visual-spec-validator';
import { runJuryValidation, DEFAULT_JURY_CONFIG, type JuryConfig, type JuryVerdict } from './jury';

const MAX_REPAIR_CYCLES = 3;

/**
 * v2 Pipeline: Reasoning-first question generation.
 *
 * Flow:
 * 1. Blueprint selection (or use provided node)
 * 1.5 Source sufficiency gate
 * 2. Algorithm extraction → card + facts
 * 3. Case planning (NEW) → ontology-linked plan
 * 4. Skeleton writing (NEW) → logical structure
 * 4.5 Skeleton validation (NEW) → coherence gate
 * 5. Item planning → question architecture
 * 6. Vignette writing (render from skeleton)
 * 7. Validation loop (6 validators, max 3 repair cycles)
 * 8. Explanation writing
 * 9. Publish
 */
export async function runPipelineV2(config: PipelineConfig): Promise<PipelineResult> {
  const supabase = createAdminClient();
  const steps: AgentStepResult[] = [];
  const agentLog: AgentLogEntry[] = [];
  let totalTokens = 0;
  const pipelineStart = Date.now();

  // Create pipeline run
  const { data: run, error: runError } = await supabase
    .from('pipeline_run')
    .insert({
      blueprint_node_id: config.blueprintNodeId ?? null,
      status: 'running',
    })
    .select('id')
    .single();

  if (runError || !run) {
    throw new Error(`Failed to create pipeline_run: ${runError?.message}`);
  }

  const pipelineRunId = run.id;
  const context: AgentContext = {
    pipelineRunId,
    mockMode: config.mockMode ?? false,
  };

  // Helper to track steps (identical to v1)
  async function trackStep<T>(
    agentType: AgentType,
    fn: () => Promise<{ success: boolean; data: T; tokensUsed: number; error?: string }>
  ): Promise<T> {
    const stepStart = Date.now();
    const logEntry: AgentLogEntry = {
      agent: agentType,
      started_at: new Date().toISOString(),
      completed_at: null,
      tokens_used: 0,
      status: 'running',
    };

    await supabase
      .from('pipeline_run')
      .update({ current_agent: agentType, agent_log: [...agentLog, logEntry] })
      .eq('id', pipelineRunId);

    const result = await fn();

    logEntry.completed_at = new Date().toISOString();
    logEntry.tokens_used = result.tokensUsed;
    logEntry.status = result.success ? 'completed' : 'failed';
    if (result.error) logEntry.error = result.error;

    agentLog.push(logEntry);
    totalTokens += result.tokensUsed;

    steps.push({
      agent: agentType,
      success: result.success,
      tokensUsed: result.tokensUsed,
      durationMs: Date.now() - stepStart,
      output: result.data,
      error: result.error,
    });

    if (!result.success) {
      throw new PipelineStepError(agentType, result.error ?? 'Unknown error');
    }

    return result.data;
  }

  try {
    // ─── STEP 1: Blueprint Selection ───
    let node: BlueprintNodeRow;
    if (config.blueprintNodeId) {
      const { data, error } = await supabase
        .from('blueprint_node')
        .select('*')
        .eq('id', config.blueprintNodeId)
        .single();
      if (error || !data) throw new Error(`Blueprint node not found: ${config.blueprintNodeId}`);
      node = data as BlueprintNodeRow;
    } else {
      const selectorOutput = await trackStep('blueprint_selector', () =>
        agents.blueprintSelector.run(context, {
          shelf: config.shelf,
          yieldTier: config.yieldTier,
        })
      );

      const { data, error } = await supabase
        .from('blueprint_node')
        .select('*')
        .eq('id', selectorOutput.blueprint_node_id)
        .single();
      if (error || !data) throw new Error(`Selected node not found: ${selectorOutput.blueprint_node_id}`);
      node = data as BlueprintNodeRow;
    }

    await supabase
      .from('pipeline_run')
      .update({ blueprint_node_id: node.id })
      .eq('id', pipelineRunId);

    // ─── STEP 1.5: Source Sufficiency Gate ───
    const isScoped = node.topic in topicSourceMap;
    if (isScoped) {
      const sufficiency = await checkSourceSufficiency(node.topic);
      if (!sufficiency.sufficient) {
        throw new PipelineStepError(
          'algorithm_extractor',
          `source_insufficient: ${sufficiency.missing.join('; ')}`
        );
      }
    }

    // ─── STEP 2: Algorithm Extraction ───
    const extractionOutput = await trackStep('algorithm_extractor', () =>
      agents.algorithmExtractor.run(context, node)
    );

    const { data: card } = await supabase
      .from('algorithm_card')
      .select('*')
      .eq('id', extractionOutput.algorithmCardId)
      .single();
    const { data: facts } = await supabase
      .from('fact_row')
      .select('*')
      .eq('algorithm_card_id', extractionOutput.algorithmCardId);

    if (!card || !facts) throw new Error('Failed to fetch card/facts after extraction');

    // ─── PRE-FETCH: Ontology lookups for case planner ───
    const [
      { data: errors },
      { data: hingeClueTypes },
      { data: actionClassRows },
      { data: confusionSets },
      { data: transferRules },
    ] = await Promise.all([
      supabase.from('error_taxonomy').select('*'),
      supabase.from('hinge_clue_type').select('id, name'),
      supabase.from('action_class').select('id, name, priority_rank'),
      supabase.from('confusion_sets').select('id, name'),
      supabase.from('transfer_rules').select('id, rule_text'),
    ]);

    // ─── STEP 3: Case Planning (NEW) ───
    const casePlanOutput = await trackStep('case_planner', () =>
      agents.casePlanner.run(context, {
        node,
        card: card as AlgorithmCardRow,
        facts: facts as FactRowRow[],
        errors: (errors ?? []) as ErrorTaxonomyRow[],
        hingeClueTypes: hingeClueTypes ?? [],
        actionClasses: actionClassRows ?? [],
        confusionSets: confusionSets ?? [],
        transferRules: transferRules ?? [],
      })
    );

    const { data: casePlan } = await supabase
      .from('case_plan')
      .select('*')
      .eq('id', casePlanOutput.casePlanId)
      .single();
    if (!casePlan) throw new Error('Failed to fetch case_plan after creation');

    // ─── STEP 4: Skeleton Writing (NEW) ───
    const skeletonOutput = await trackStep('skeleton_writer', () =>
      agents.skeletonWriter.run(context, {
        node,
        card: card as AlgorithmCardRow,
        facts: facts as FactRowRow[],
        casePlan: casePlan as CasePlanRow,
      })
    );

    const { data: skeleton } = await supabase
      .from('question_skeleton')
      .select('*')
      .eq('id', skeletonOutput.skeletonId)
      .single();
    if (!skeleton) throw new Error('Failed to fetch skeleton after creation');

    // ─── STEP 4.5: Skeleton Validation (NEW) ───
    const skeletonValidation = await trackStep('skeleton_validator', () =>
      agents.skeletonValidator.run(context, {
        casePlan: casePlan as CasePlanRow,
        skeleton: skeleton as QuestionSkeletonRow,
      })
    );

    if (!skeletonValidation.skeletonValidated) {
      throw new PipelineStepError(
        'skeleton_validator',
        `Skeleton failed validation: ${skeletonValidation.issues.join('; ')}`
      );
    }

    // ─── STEP 5: Item Planning ───
    const planOutput = await trackStep('item_planner', () =>
      agents.itemPlanner.run(context, {
        node,
        card: card as AlgorithmCardRow,
        facts: facts as FactRowRow[],
        errors: (errors ?? []) as ErrorTaxonomyRow[],
      })
    );

    const { data: plan } = await supabase
      .from('item_plan')
      .select('*')
      .eq('id', planOutput.itemPlanId)
      .single();
    if (!plan) throw new Error('Failed to fetch plan after creation');

    // ─── STEP 6: Vignette Writing (renders from skeleton) ───
    const vignetteOutput = await trackStep('vignette_writer', () =>
      agents.vignetteWriter.run(context, {
        node,
        card: card as AlgorithmCardRow,
        plan: plan as ItemPlanRow,
        facts: facts as FactRowRow[],
        pipelineRunId,
        skeleton: skeleton as QuestionSkeletonRow,
      })
    );

    let draftId = vignetteOutput.itemDraftId;

    // Link draft to case_plan and skeleton
    await supabase
      .from('item_draft')
      .update({
        case_plan_id: casePlan.id,
        question_skeleton_id: skeleton.id,
      })
      .eq('id', draftId);

    // Backfill rendered_text on skeleton option_frames from the rendered choices
    // This enables label mapping verification at read time
    {
      const { data: renderedDraft } = await supabase
        .from('item_draft')
        .select('choice_a, choice_b, choice_c, choice_d, choice_e')
        .eq('id', draftId)
        .single();

      if (renderedDraft) {
        const choiceMap: Record<string, string> = {
          A: renderedDraft.choice_a,
          B: renderedDraft.choice_b,
          C: renderedDraft.choice_c,
          D: renderedDraft.choice_d,
          E: renderedDraft.choice_e,
        };
        const updatedFrames = ((skeleton as QuestionSkeletonRow).option_frames ?? []).map(
          (frame) => ({
            ...frame,
            rendered_text: choiceMap[frame.id] ?? null,
          })
        );
        await supabase
          .from('question_skeleton')
          .update({ option_frames: updatedFrames })
          .eq('id', skeleton.id);
      }
    }

    // ─── STEP 6.5: Label Mapping Validation (post-render) ───
    // Catches "AI-chosen answer is incorrect" failure mode (P2 — 33% of invalid questions)
    // Verifies that skeleton option_frames align with rendered choices
    {
      const { data: labelDraft } = await supabase
        .from('item_draft')
        .select('correct_answer, choice_a, choice_b, choice_c, choice_d, choice_e')
        .eq('id', draftId)
        .single();

      if (labelDraft && skeleton) {
        const skel = skeleton as QuestionSkeletonRow;
        const correctFrame = skel.correct_option_frame_id;
        const draftCorrect = labelDraft.correct_answer?.toUpperCase();

        if (correctFrame && draftCorrect && correctFrame !== draftCorrect) {
          console.warn(
            `[pipeline-v2] Label mapping mismatch: skeleton says correct=${correctFrame}, draft says correct=${draftCorrect}. Fixing draft to match skeleton.`
          );
          await supabase
            .from('item_draft')
            .update({ correct_answer: correctFrame })
            .eq('id', draftId);
        }

        // Verify each frame's rendered_text matches the corresponding choice field
        const choiceFields: Record<string, string | null> = {
          A: labelDraft.choice_a,
          B: labelDraft.choice_b,
          C: labelDraft.choice_c,
          D: labelDraft.choice_d,
          E: labelDraft.choice_e,
        };
        for (const frame of skel.option_frames ?? []) {
          const choiceText = choiceFields[frame.id];
          if (frame.rendered_text && choiceText && frame.rendered_text !== choiceText) {
            console.warn(
              `[pipeline-v2] Frame ${frame.id} rendered_text doesn't match choice_${frame.id.toLowerCase()}. Updating frame.`
            );
          }
        }
      }
    }

    // ─── STEP 7: Validation Loop ───
    // Jury mode (P1/P2): On cycle 0, medical + exam_translation validators run through
    // a multi-model jury (Opus + Sonnet + Haiku). On subsequent cycles, single-model only.
    const useJury = config.juryEnabled ?? false;
    const medicalSampleCount = config.validatorSampleCount ?? 1;
    const juryVerdicts: JuryVerdict[] = [];
    let passed = false;
    for (let cycle = 0; cycle < MAX_REPAIR_CYCLES; cycle++) {
      const { data: draft } = await supabase
        .from('item_draft')
        .select('*')
        .eq('id', draftId)
        .single();
      if (!draft) throw new Error('Failed to fetch draft for validation');

      await supabase
        .from('item_draft')
        .update({ status: 'validating' })
        .eq('id', draftId);

      const juryOnThisCycle = useJury && cycle === 0;

      // Medical validator — jury on first cycle if enabled
      // Self-consistency sampling: when validatorSampleCount > 1, validator runs N times
      // and returns majority vote + consistency_score (entropy) as uncertainty signal
      const medicalPromise = juryOnThisCycle
        ? trackStep('medical_validator', async () => {
            const verdict = await runJuryValidation(
              (model) => agents.medicalValidator.run(context, {
                draft: draft as ItemDraftRow,
                card: card as AlgorithmCardRow,
                facts: facts as FactRowRow[],
                topic: node.topic,
                model,
              }),
              DEFAULT_JURY_CONFIG,
              `Stem: ${(draft as ItemDraftRow).stem}\nCorrect: ${(draft as ItemDraftRow).correct_answer}`,
            );
            juryVerdicts.push(verdict);
            return {
              success: true,
              data: { ...verdict.report, reportId: `jury-medical-${cycle}` },
              tokensUsed: verdict.totalTokensUsed,
            };
          })
        : trackStep('medical_validator', () =>
            agents.medicalValidator.run(context, {
              draft: draft as ItemDraftRow,
              card: card as AlgorithmCardRow,
              facts: facts as FactRowRow[],
              topic: node.topic,
              sampleCount: medicalSampleCount,
            })
          );

      // Exam translation validator — jury on first cycle if enabled
      const examTranslationPromise = juryOnThisCycle
        ? trackStep('exam_translation_validator', async () => {
            const verdict = await runJuryValidation(
              (model) => agents.examTranslationValidator.run(context, {
                draft: draft as ItemDraftRow,
                card: card as AlgorithmCardRow,
                node,
                model,
              }),
              DEFAULT_JURY_CONFIG,
              `Stem: ${(draft as ItemDraftRow).stem}`,
            );
            juryVerdicts.push(verdict);
            return {
              success: true,
              data: { ...verdict.report, reportId: `jury-exam-${cycle}` },
              tokensUsed: verdict.totalTokensUsed,
            };
          })
        : trackStep('exam_translation_validator', () =>
            agents.examTranslationValidator.run(context, {
              draft: draft as ItemDraftRow,
              card: card as AlgorithmCardRow,
              node,
            })
          );

      const validatorResults = await Promise.all([
        medicalPromise,
        trackStep('blueprint_validator', () =>
          agents.blueprintValidator.run(context, {
            draft: draft as ItemDraftRow,
            node,
          })
        ),
        trackStep('nbme_quality_validator', () =>
          agents.nbmeQualityValidator.run(context, {
            draft: draft as ItemDraftRow,
          })
        ),
        trackStep('option_symmetry_validator', () =>
          agents.optionSymmetryValidator.run(context, {
            draft: draft as ItemDraftRow,
            plan: plan as ItemPlanRow,
          })
        ),
        trackStep('explanation_validator', () =>
          agents.explanationValidator.run(context, {
            draft: draft as ItemDraftRow,
            card: card as AlgorithmCardRow,
          })
        ),
        examTranslationPromise,
      ]);

      const allPassed = validatorResults.every((r) => r.passed);

      // ─── Validator Disagreement Logging ───
      // Track which validators passed vs failed to identify calibration issues
      const validatorTypes = ['medical', 'blueprint', 'nbme_quality', 'option_symmetry', 'explanation', 'exam_translation'] as const;
      const disagreementEntry = {
        cycle,
        validators: validatorTypes.map((vt, i) => ({
          type: vt,
          passed: validatorResults[i]?.passed ?? false,
          score: validatorResults[i]?.score ?? null,
        })),
        passCount: validatorResults.filter((r) => r.passed).length,
        failCount: validatorResults.filter((r) => !r.passed).length,
        unanimous: allPassed || validatorResults.every((r) => !r.passed),
      };
      // Store disagreement data as a typed agent log entry
      // The JSONB column accepts extra fields beyond the TypeScript interface
      const disagreementLog: AgentLogEntry & Record<string, unknown> = {
        agent: 'medical_validator' as AgentType,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        tokens_used: 0,
        status: 'completed',
        note: `validator_disagreement_cycle_${cycle}`,
        disagreement: disagreementEntry,
      };
      agentLog.push(disagreementLog as AgentLogEntry);

      // ─── Jury on Validator Disagreement (cycles 1+) ───
      // Research (Council of AIs): facilitator-mediated re-deliberation catches more
      // errors on ambiguous cases than mechanical score aggregation.
      // Only fires when medical and exam_translation disagree on pass/fail.
      const medicalResult = validatorResults[0];
      const examTranslationResult = validatorResults[5];
      const highStakesDisagree = useJury && cycle > 0
        && medicalResult.passed !== examTranslationResult.passed;

      if (highStakesDisagree) {
        // Re-run ONLY the disagreeing validators through jury
        const previousIssues = [
          ...(!medicalResult.passed ? medicalResult.issues_found : []),
          ...(!examTranslationResult.passed ? examTranslationResult.issues_found : []),
        ].join('; ');

        const juryContext = [
          `Repair cycle ${cycle}. Previous issues: ${previousIssues}`,
          `Stem: ${(draft as ItemDraftRow).stem}`,
          `Correct: ${(draft as ItemDraftRow).correct_answer}`,
        ].join('\n');

        // Medical jury (only if it's the one that disagrees with exam_translation)
        const medicalJuryVerdict = await runJuryValidation(
          (model) => agents.medicalValidator.run(context, {
            draft: draft as ItemDraftRow,
            card: card as AlgorithmCardRow,
            facts: facts as FactRowRow[],
            topic: node.topic,
            model,
          }),
          { ...DEFAULT_JURY_CONFIG, enabledValidators: ['medical'] },
          juryContext,
        );
        juryVerdicts.push(medicalJuryVerdict);
        totalTokens += medicalJuryVerdict.totalTokensUsed;

        // Override the medical result with jury verdict
        validatorResults[0] = {
          ...medicalJuryVerdict.report,
          reportId: `jury-medical-disagreement-${cycle}`,
        };

        // Exam translation jury
        const examJuryVerdict = await runJuryValidation(
          (model) => agents.examTranslationValidator.run(context, {
            draft: draft as ItemDraftRow,
            card: card as AlgorithmCardRow,
            node,
            model,
          }),
          { ...DEFAULT_JURY_CONFIG, enabledValidators: ['exam_translation'] },
          juryContext,
        );
        juryVerdicts.push(examJuryVerdict);
        totalTokens += examJuryVerdict.totalTokensUsed;

        // Override exam_translation result with jury verdict
        validatorResults[5] = {
          ...examJuryVerdict.report,
          reportId: `jury-exam-disagreement-${cycle}`,
        };

        // Log jury trigger
        const juryTriggerLog: AgentLogEntry & Record<string, unknown> = {
          agent: 'medical_validator' as AgentType,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          tokens_used: medicalJuryVerdict.totalTokensUsed + examJuryVerdict.totalTokensUsed,
          status: 'completed',
          note: `jury_disagreement_cycle_${cycle}`,
          jury_trigger: 'disagreement',
          medical_agreement: medicalJuryVerdict.agreement,
          exam_agreement: examJuryVerdict.agreement,
        };
        agentLog.push(juryTriggerLog as AgentLogEntry);
      }

      // Re-check after potential jury override
      const allPassedFinal = validatorResults.every((r) => r.passed);

      if (allPassedFinal) {
        await supabase
          .from('item_draft')
          .update({ status: 'passed' })
          .eq('id', draftId);
        passed = true;
        break;
      }

      const medicalReport = validatorResults[0];
      if (medicalReport.score !== null && medicalReport.score < 3) {
        await supabase
          .from('item_draft')
          .update({ status: 'killed' })
          .eq('id', draftId);
        break;
      }

      if (cycle >= MAX_REPAIR_CYCLES - 1) {
        await supabase
          .from('item_draft')
          .update({ status: 'killed' })
          .eq('id', draftId);
        break;
      }

      const { data: reports } = await supabase
        .from('validator_report')
        .select('*')
        .eq('item_draft_id', draftId);

      await supabase
        .from('item_draft')
        .update({ status: 'failed' })
        .eq('id', draftId);

      await trackStep('repair_agent', () =>
        agents.repairAgent.run(context, {
          draft: draft as ItemDraftRow,
          validatorReports: (reports ?? []) as ValidatorReportRow[],
          card: card as AlgorithmCardRow,
          facts: facts as FactRowRow[],
        })
      );
    }

    // ─── STEP 8: Explanation Writer (only if passed, skip in harness mode) ───
    if (passed && !config.skipExplanation) {
      const { data: passedDraft } = await supabase
        .from('item_draft')
        .select('*')
        .eq('id', draftId)
        .single();

      if (passedDraft) {
        await trackStep('explanation_writer', () =>
          agents.explanationWriter.run(context, {
            draft: passedDraft as ItemDraftRow,
            card: card as AlgorithmCardRow,
            facts: facts as FactRowRow[],
            node,
            transferRuleText: (casePlan as CasePlanRow).transfer_rule_text,
          })
        );

        // Visual spec validation soft gate
        const { data: draftWithVisuals } = await supabase
          .from('item_draft')
          .select('visual_specs, why_correct')
          .eq('id', draftId)
          .single();

        if (draftWithVisuals?.visual_specs?.length) {
          const visualErrors = validateVisualSpecs(
            draftWithVisuals.visual_specs as unknown[],
            { why_correct: draftWithVisuals.why_correct }
          );
          if (visualErrors.length > 0) {
            const invalidIndices = new Set(visualErrors.map(e => e.specIndex));
            const validSpecs = (draftWithVisuals.visual_specs as unknown[]).filter(
              (_, i) => !invalidIndices.has(i)
            );
            await supabase
              .from('item_draft')
              .update({ visual_specs: validSpecs.length > 0 ? validSpecs : null })
              .eq('id', draftId);
          }
        }

        // Check if self-consistency sampling flagged uncertainty on the medical validator
        // High consistency_score (entropy > 0.5) means the model disagreed with itself
        // across samples — flag for priority human review even though it passed
        let reviewStatus: 'pending_review' | 'flagged_uncertain' = 'pending_review';
        if (medicalSampleCount > 1) {
          const { data: medReport } = await supabase
            .from('validator_report')
            .select('consistency_score')
            .eq('item_draft_id', draftId)
            .eq('validator_type', 'medical')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (medReport?.consistency_score != null && medReport.consistency_score > 0.5) {
            reviewStatus = 'flagged_uncertain';
          }
        }

        await supabase
          .from('item_draft')
          .update({
            status: 'published',
            review_status: reviewStatus,
          })
          .eq('id', draftId);
      }
    }

    // ─── Summarize validator scores ───
    const { data: allReports } = await supabase
      .from('validator_report')
      .select('validator_type, score, passed')
      .eq('item_draft_id', draftId);

    const validatorSummary: Record<string, { score: number | null; passed: boolean }> = {};
    for (const report of allReports ?? []) {
      // Keep the latest report per validator type (from final cycle)
      validatorSummary[report.validator_type] = {
        score: report.score,
        passed: report.passed,
      };
    }

    // ─── Finalize pipeline run ───
    const finalStatus = passed
      ? (config.skipExplanation ? 'passed' : 'published')
      : 'killed';

    // Build jury summary if jury was used
    const jurySummary = juryVerdicts.length > 0
      ? {
          enabled: true,
          verdicts: juryVerdicts.map((v) => ({
            agreement: v.agreement,
            facilitatorInvoked: v.facilitatorInvoked,
            jurorCount: v.jurorReports.length,
            tokensUsed: v.totalTokensUsed,
          })),
          totalDisagreements: juryVerdicts.filter((v) => v.agreement === 'facilitator_synthesized').length,
          totalFacilitatorInvocations: juryVerdicts.filter((v) => v.facilitatorInvoked).length,
        }
      : null;

    await supabase
      .from('pipeline_run')
      .update({
        status: 'completed',
        current_agent: null,
        agent_log: agentLog,
        total_tokens_used: totalTokens,
        completed_at: new Date().toISOString(),
        validator_summary: {
          ...validatorSummary,
          ...(jurySummary ? { jury: jurySummary } : {}),
        },
      })
      .eq('id', pipelineRunId);

    return {
      runId: pipelineRunId,
      status: 'completed',
      itemDraftId: draftId,
      finalStatus,
      steps,
      totalTokens,
      totalDurationMs: Date.now() - pipelineStart,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await supabase
      .from('pipeline_run')
      .update({
        status: 'failed',
        current_agent: null,
        agent_log: agentLog,
        total_tokens_used: totalTokens,
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', pipelineRunId);

    return {
      runId: pipelineRunId,
      status: 'failed',
      finalStatus: 'killed',
      steps,
      totalTokens,
      totalDurationMs: Date.now() - pipelineStart,
    };
  }
}

class PipelineStepError extends Error {
  constructor(
    public agent: AgentType,
    message: string
  ) {
    super(`Pipeline step ${agent} failed: ${message}`);
    this.name = 'PipelineStepError';
  }
}
