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
  ConfusionSetRow,
} from '@/lib/types/database';
import * as agents from './agents';
import { checkSourceSufficiency } from './source-packs/sufficiency';
import { topicSourceMap } from './source-packs/topic-source-map';
import { loadPack } from './source-packs/index';
import { getSourcePackIds } from './source-loader';
import type { SourcePack } from './source-packs/types';
import type { DrugOption } from './agents/explanation-writer';
import { validateVisualSpecs } from './validators/visual-spec-validator';
import { runJuryValidation, DEFAULT_JURY_CONFIG, type JuryConfig, type JuryVerdict } from './jury';

/**
 * Resolve all drug_selection entries across the packs that cover this topic,
 * then match draft options (A-E) against drug names. Returns DrugOption[] with
 * board-testable pharmacology for every matching drug. Empty array means no
 * pharmacology_notes will be generated (e.g. diagnosis-only question).
 */
async function resolveDrugOptions(
  topic: string,
  draft: ItemDraftRow
): Promise<DrugOption[]> {
  const config = topicSourceMap[topic];
  if (!config) return [];
  const packIds = [config.primary, ...(config.secondary ?? []).map((s) => s.source_pack_id)];
  const packs = (await Promise.all(packIds.map((id) => loadPack(id)))).filter(
    (p): p is SourcePack => p !== null
  );
  const selections = packs.flatMap((p) => p.drug_selection ?? []);

  const options: Array<{ letter: 'A'|'B'|'C'|'D'|'E'; text: string }> = [
    { letter: 'A', text: draft.choice_a ?? '' },
    { letter: 'B', text: draft.choice_b ?? '' },
    { letter: 'C', text: draft.choice_c ?? '' },
    { letter: 'D', text: draft.choice_d ?? '' },
    { letter: 'E', text: draft.choice_e ?? '' },
  ];

  const matched: DrugOption[] = [];
  const seenDrugs = new Set<string>();

  for (const opt of options) {
    const lowerOpt = opt.text.toLowerCase();
    for (const sel of selections) {
      if (!sel.pharmacology) continue;
      // Try matching against first_line.drug and alternative drug names
      const candidates = [
        sel.first_line.drug,
        ...sel.alternatives.map((a) => a.drug),
      ];
      for (const drugName of candidates) {
        // Token-match against the first word of the drug name (handles "Aspirin 325mg ...")
        const primaryToken = drugName.split(/[\s,(]+/)[0]?.toLowerCase();
        if (!primaryToken || primaryToken.length < 4) continue;
        if (lowerOpt.includes(primaryToken) && !seenDrugs.has(primaryToken)) {
          seenDrugs.add(primaryToken);
          matched.push({
            drug: drugName,
            appears_as: opt.letter === draft.correct_answer ? 'correct_answer' : 'distractor',
            pharmacology: sel.pharmacology,
          });
          break;
        }
      }
    }
  }

  return matched;
}

// Empirical data (2026-04-22): cycle 4 converts at 4 passes / 55 kills (~7%) — not worth the spend.
// Items that don't pass by cycle 3 typically have structural issues repair can't fix.
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

    // ─── STEP 2: Algorithm Extraction (with caching) ───
    // Check for a recent algorithm card for this topic to skip redundant extraction.
    // Same topic produces the same clinical algorithm — no need to re-extract every run.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cachedCard } = await supabase
      .from('algorithm_card')
      .select('id')
      .eq('topic', node.topic)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let card: AlgorithmCardRow;
    let facts: FactRowRow[];

    if (cachedCard) {
      // Reuse cached card — skip the API call entirely
      const { data: cachedCardFull } = await supabase
        .from('algorithm_card')
        .select('*')
        .eq('id', cachedCard.id)
        .single();
      const { data: cachedFacts } = await supabase
        .from('fact_row')
        .select('*')
        .eq('algorithm_card_id', cachedCard.id);

      if (cachedCardFull && cachedFacts) {
        card = cachedCardFull as AlgorithmCardRow;
        facts = cachedFacts as FactRowRow[];
        // Log cache hit
        const cacheLog: AgentLogEntry = {
          agent: 'algorithm_extractor',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          tokens_used: 0,
          status: 'completed',
        };
        agentLog.push(cacheLog);
        steps.push({
          agent: 'algorithm_extractor',
          success: true,
          tokensUsed: 0,
          durationMs: 0,
          output: { algorithmCardId: cachedCard.id, cached: true },
        });
      } else {
        throw new Error('Failed to fetch cached card/facts');
      }
    } else {
      // No cache — run extraction
      const extractionOutput = await trackStep('algorithm_extractor', () =>
        agents.algorithmExtractor.run(context, node)
      );

      const { data: freshCard } = await supabase
        .from('algorithm_card')
        .select('*')
        .eq('id', extractionOutput.algorithmCardId)
        .single();
      const { data: freshFacts } = await supabase
        .from('fact_row')
        .select('*')
        .eq('algorithm_card_id', extractionOutput.algorithmCardId);

      if (!freshCard || !freshFacts) throw new Error('Failed to fetch card/facts after extraction');
      card = freshCard as AlgorithmCardRow;
      facts = freshFacts as FactRowRow[];
    }

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
        difficultyClassHint: config.difficultyClassHint,
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
        errors: (errors ?? []) as ErrorTaxonomyRow[],
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

    // Link draft to case_plan and skeleton, and snapshot the source packs
    // consulted at generation time. Persisted (not re-derived at read time) so
    // the historical record survives future topicSourceMap changes.
    const sourcePacksUsed = getSourcePackIds(node.topic);
    await supabase
      .from('item_draft')
      .update({
        case_plan_id: casePlan.id,
        question_skeleton_id: skeleton.id,
        source_packs_used: sourcePacksUsed,
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

    // ─── STEP 6.75: Answer Position Randomization ───
    // Shuffle choice positions so the correct answer isn't always A.
    // NBME distributes correct answers roughly equally across A-E.
    {
      const { data: shuffleDraft } = await supabase
        .from('item_draft')
        .select('correct_answer, choice_a, choice_b, choice_c, choice_d, choice_e, why_wrong_a, why_wrong_b, why_wrong_c, why_wrong_d, why_wrong_e')
        .eq('id', draftId)
        .single();

      if (shuffleDraft) {
        const letters = ['A', 'B', 'C', 'D', 'E'] as const;
        const currentCorrect = shuffleDraft.correct_answer?.toUpperCase() as typeof letters[number];

        // Fisher-Yates shuffle to get a random permutation
        const shuffled = [...letters];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Build the mapping: original position → new position
        // shuffled[i] is the original letter that goes to position letters[i]
        const choiceKey = (l: string) => `choice_${l.toLowerCase()}` as keyof typeof shuffleDraft;
        const whyKey = (l: string) => `why_wrong_${l.toLowerCase()}` as keyof typeof shuffleDraft;

        const newChoices: Record<string, string | null> = {};
        const newWhyWrongs: Record<string, string | null> = {};
        let newCorrect = currentCorrect;

        for (let i = 0; i < 5; i++) {
          const targetPos = letters[i];      // new position (A, B, C, D, E)
          const sourcePos = shuffled[i];      // original position being moved here
          newChoices[choiceKey(targetPos)] = shuffleDraft[choiceKey(sourcePos)] as string | null;
          newWhyWrongs[whyKey(targetPos)] = shuffleDraft[whyKey(sourcePos)] as string | null;
          if (sourcePos === currentCorrect) {
            newCorrect = targetPos;
          }
        }

        await supabase
          .from('item_draft')
          .update({
            ...newChoices,
            ...newWhyWrongs,
            correct_answer: newCorrect,
          })
          .eq('id', draftId);

        // Also update skeleton option_frames to match the new ordering
        const skel = skeleton as QuestionSkeletonRow;
        if (skel.option_frames?.length === 5) {
          const newFrames = letters.map((targetPos, i) => {
            const sourcePos = shuffled[i];
            const sourceFrame = skel.option_frames!.find(f => f.id === sourcePos);
            return sourceFrame ? { ...sourceFrame, id: targetPos } : skel.option_frames![i];
          });
          await supabase
            .from('question_skeleton')
            .update({
              option_frames: newFrames,
              correct_option_frame_id: newCorrect,
            })
            .eq('id', skeleton.id);
        }
      }
    }

    // ─── STEP 7: Validation Loop ───
    // Jury mode (P1/P2): On cycle 0, medical + exam_translation validators run through
    // a multi-model jury (Opus + Sonnet + Haiku). On subsequent cycles, single-model only.
    const useJury = config.juryEnabled ?? false;
    const medicalSampleCount = config.validatorSampleCount ?? 3;
    const juryVerdicts: JuryVerdict[] = [];
    let passed = false;
    // Track scores across cycles for flat-line early kill
    const cycleScores: Array<{ failCount: number; totalScore: number }> = [];
    // v25 CCV circuit breaker: count absolute-contraindication auto-rejects on this
    // algorithm_card within this pipeline run. At count >= 2 we escalate to human
    // review instead of asking case_planner to try yet again — a registry entry that
    // rejects twice is either mis-classified or flags a card that can't be safely
    // keyed with this intervention, and more cycles won't help.
    let ccvAbsoluteRejectCount = 0;
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

      // NOTE: explanation_validator is intentionally excluded from this loop.
      // It checks why_wrong, pearl, reasoning_pathway — fields populated by
      // explanation_writer in step 8, not by vignette_writer. Running it here
      // causes false failures on missing fields. It runs post-explanation instead.
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
        examTranslationPromise,
        // v25: Contraindication Cross-Check Validator (CCV). Safety gate.
        // Runs inside the loop so it re-fires after every repair cycle — a repair
        // that introduces "post-op day 5" into a thrombolysis stem must not bypass
        // the gate. See src/lib/factory/agents/contraindication-validator.ts.
        trackStep('contraindication_validator' as AgentType, () =>
          agents.contraindicationValidator.run(context, {
            draft: draft as ItemDraftRow,
            card: card as AlgorithmCardRow,
          })
        ),
        // v26: Q-matrix coverage validator. Deterministic — no Claude call.
        // Guards against pipeline regression producing items the learner engine
        // can't route on. Hard-gates topic+cognitive_error+hinge_clue_type+
        // action_class; soft-warns transfer_rule+confusion_set.
        trackStep('coverage_validator' as unknown as AgentType, () =>
          agents.coverageValidator.run(context, {
            draft: draft as ItemDraftRow,
          })
        ),
      ]);

      const allPassed = validatorResults.every((r) => r.passed);

      // ─── Validator Disagreement Logging ───
      // Track which validators passed vs failed to identify calibration issues
      const validatorTypes = ['medical', 'blueprint', 'nbme_quality', 'option_symmetry', 'exam_translation', 'contraindication', 'coverage'] as const;
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
      const examTranslationResult = validatorResults[4];
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
        validatorResults[4] = {
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

      // ─── Soft pass for nbme_quality polish issues ───
      // nbme_quality at score ≥5 is a polish issue (sentence structure, prohibited phrases),
      // not a hard quality failure (medical accuracy, hinge validity). Let it pass the pipeline
      // and defer polish to human review, instead of sending to repair (which breaks medical accuracy).
      const nbmeResult = validatorResults[2]; // index 2 = nbme_quality
      if (!nbmeResult.passed && nbmeResult.score !== null && nbmeResult.score >= 5) {
        nbmeResult.passed = true;
        console.log(`[pipeline-v2] nbme_quality soft-pass: score ${nbmeResult.score} ≥ 5 (polish issues deferred to human review)`);
      }

      // ─── v25 CCV routing override ───
      // CCV is validator index 5. Its result carries structured trigger data in
      // raw_output, but the relevant routing is derivable from issues_found +
      // score alone:
      //   - trigger_found='unknown' (no registry match on an intervention OR
      //     fail-closed on Claude error) -> always human review; no repair can fix it.
      //   - trigger_found='yes' with ANY relative-severity trigger -> human review;
      //     MS4 decides whether to drop the stem detail or change the key.
      //   - trigger_found='yes' with only absolute-severity triggers -> repair loop
      //     for the first 2 attempts (case_planner can try a different key or drop
      //     the triggering stem detail), then escalate at attempt 3.
      // The CCV writes the raw structured data into validator_report.raw_output,
      // so the routing below reads from there rather than re-running analysis.
      const ccvResult = validatorResults[5];
      const ccvRaw = (ccvResult as unknown as { raw_output?: unknown }).raw_output;
      // The CCV return type is a superset of ValidatorReportInput; the extra
      // fields (trigger_found, triggers) live on the same object.
      const ccvFull = ccvResult as unknown as {
        passed: boolean;
        score: number;
        issues_found: string[];
        trigger_found?: 'yes' | 'no' | 'unknown';
        triggers?: Array<{ severity: 'absolute' | 'relative' | 'unknown' }>;
      };
      void ccvRaw;
      const ccvTriggerFound = ccvFull.trigger_found ?? 'no';
      const ccvTriggers = ccvFull.triggers ?? [];
      const hasRelative = ccvTriggers.some((t) => t.severity === 'relative' || t.severity === 'unknown');
      const hasAbsolute = ccvTriggers.some((t) => t.severity === 'absolute');

      if (ccvTriggerFound === 'unknown' || (ccvTriggerFound === 'yes' && hasRelative)) {
        console.warn(
          `[pipeline-v2] CCV routed to needs_human_review: trigger_found=${ccvTriggerFound}, ` +
          `relative=${hasRelative}. Issues: ${ccvFull.issues_found.join(' | ')}`
        );
        await supabase
          .from('item_draft')
          .update({ status: 'needs_human_review' })
          .eq('id', draftId);
        break;
      }

      if (ccvTriggerFound === 'yes' && hasAbsolute && !hasRelative) {
        ccvAbsoluteRejectCount += 1;
        if (ccvAbsoluteRejectCount >= 2) {
          console.warn(
            `[pipeline-v2] CCV circuit breaker: ${ccvAbsoluteRejectCount} absolute rejects on card ` +
            `${(card as AlgorithmCardRow).id}. Escalating to needs_human_review instead of further repair.`
          );
          await supabase
            .from('item_draft')
            .update({ status: 'needs_human_review' })
            .eq('id', draftId);
          break;
        }
        // Otherwise fall through — CCV's passed=false routes through the normal
        // repair path below, carrying repair_instructions that name the triggering
        // stem detail and the contraindication it violates.
      }

      // Re-check after potential jury override + soft pass
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

      // ─── Flat-line early kill ───
      // Track aggregate scores across cycles. If no improvement over 2 consecutive
      // cycles, the question is unfixable — kill early instead of burning 3 more cycles.
      const failCount = validatorResults.filter((r) => !r.passed).length;
      const totalScore = validatorResults.reduce((sum, r) => sum + (r.score ?? 0), 0);
      cycleScores.push({ failCount, totalScore });

      if (cycleScores.length >= 3) {
        const last3 = cycleScores.slice(-3);
        const scoresFlat = last3.every((s) =>
          Math.abs(s.totalScore - last3[0].totalScore) < 2.5 &&
          s.failCount === last3[0].failCount
        );
        if (scoresFlat) {
          console.warn(
            `[pipeline-v2] Flat-line detected: scores unchanged for 3 cycles ` +
            `(${last3.map(s => `${s.failCount}F/${s.totalScore.toFixed(1)}`).join(' → ')}). Killing early.`
          );
          await supabase
            .from('item_draft')
            .update({ status: 'killed' })
            .eq('id', draftId);
          break;
        }
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
        // v22 — resolve full confusion_set row and drug options for the writer's deep-dive layer
        let confusionSet: ConfusionSetRow | null = null;
        const cp = casePlan as CasePlanRow & { target_confusion_set_id?: string | null };
        if (cp.target_confusion_set_id) {
          const { data: cs } = await supabase
            .from('confusion_sets')
            .select('*')
            .eq('id', cp.target_confusion_set_id)
            .single();
          confusionSet = (cs as ConfusionSetRow | null) ?? null;
        }
        const drugOptions = await resolveDrugOptions(node.topic, passedDraft as ItemDraftRow);

        await trackStep('explanation_writer', () =>
          agents.explanationWriter.run(context, {
            draft: passedDraft as ItemDraftRow,
            card: card as AlgorithmCardRow,
            facts: facts as FactRowRow[],
            node,
            transferRuleText: (casePlan as CasePlanRow).transfer_rule_text,
            casePlan: casePlan as CasePlanRow,
            confusionSet,
            drugOptions,
          })
        );

        // Visual spec validation soft gate (skip if visual_specs column doesn't exist)
        try {
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
        } catch {
          // visual_specs column may not exist yet — skip validation
        }

        // ─── STEP 8.5: Explanation Validator (post-explanation) ───
        // Runs AFTER explanation_writer so why_wrong, pearl, and pathway exist.
        // Soft gate: failure logs a warning but does not kill the item.
        {
          const { data: explDraft } = await supabase
            .from('item_draft')
            .select('*')
            .eq('id', draftId)
            .single();
          if (explDraft) {
            const explResult = await trackStep('explanation_validator', () =>
              agents.explanationValidator.run(context, {
                draft: explDraft as ItemDraftRow,
                card: card as AlgorithmCardRow,
              })
            );
            if (!explResult.passed) {
              console.warn(
                `[pipeline-v2] Explanation validator failed post-explanation (score=${explResult.score}). ` +
                `Issues: ${explResult.issues_found.join('; ')}. Item will still publish for human review.`
              );
            }
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

        // ─── Extract difficulty estimation + near-miss data (v20 research metrics) ───
        const qualityUpdate: Record<string, unknown> = {};

        // Parse difficulty estimate from NBME quality validator issues
        const { data: nbmeReports } = await supabase
          .from('validator_report')
          .select('issues_found')
          .eq('item_draft_id', draftId)
          .eq('validator_type', 'nbme_quality')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (nbmeReports?.issues_found) {
          for (const issue of nbmeReports.issues_found as string[]) {
            const diffMatch = issue.match(/DIFFICULTY:.*?estimated\s+(\d+)%/i);
            if (diffMatch) {
              qualityUpdate.estimated_difficulty = parseInt(diffMatch[1], 10) / 100;
            }
          }
        }

        // Extract near-miss option from case_plan option_frames
        if (casePlan) {
          const frames = (casePlan as Record<string, unknown>).option_frames as Array<Record<string, unknown>> | undefined;
          if (frames) {
            const nearMissFrame = frames.find((f) => f.near_miss === true);
            if (nearMissFrame) {
              qualityUpdate.near_miss_option = nearMissFrame.id;
              qualityUpdate.near_miss_pivot_detail = nearMissFrame.pivot_detail ?? null;
            }
          }
        }

        // Write quality metrics to item_draft (best-effort — don't fail publish on missing columns)
        if (Object.keys(qualityUpdate).length > 0) {
          await supabase
            .from('item_draft')
            .update(qualityUpdate)
            .eq('id', draftId);
        }

        // ─── STEP 8b: Multi-criterion Rubric Scorer (HealthBench-style) ───
        // Produces 1-5 scaled scores across 8 criteria + overall mean. Feeds
        // its overall score into the Master Rubric Evaluator as one input
        // among many, and its rubric row persists for human-review queue
        // ordering (lowest overall_score → review first). Opt-out via
        // config.skipRubricScorer (adds ~4k tokens/item).
        let rubricScorerOverall: number | null = null;
        if (!config.skipRubricScorer) {
          const { data: scorerDraft } = await supabase
            .from('item_draft')
            .select('*')
            .eq('id', draftId)
            .single();
          if (scorerDraft) {
            const scorerResult = await trackStep('rubric_scorer' as AgentType, () =>
              agents.rubricScorer.run(context, {
                draft: scorerDraft as ItemDraftRow,
                card: card as AlgorithmCardRow,
                ...(config.evaluatorModel ? { model: config.evaluatorModel } : {}),
              })
            );
            rubricScorerOverall = scorerResult.overall_score;
            if (scorerResult.flagged) {
              console.warn(
                `[pipeline-v2] Rubric scorer flagged item ${draftId.slice(0, 8)} ` +
                `(overall ${scorerResult.overall_score}). Lowest sub-scores will show in item_rubric_score.`
              );
            }
          }
        }

        // ─── STEP 9: Master Rubric Evaluator (publish-decision authority) ───
        // Final meta-evaluator. Deterministic hard-gates → aggregate existing
        // validator reports into 7 domain scores → LLM-grade 3 new domains +
        // sub-rubrics → deriveMasterRubricDecision() → item_draft.status.
        // See BLACKSTAR_RUBRIC_INTEGRATION.md.
        let rubricDecision: 'publish' | 'revise' | 'major_revision' | 'reject' = 'publish';
        if (!config.skipRubricEvaluator) {
          const { data: finalDraft } = await supabase
            .from('item_draft')
            .select('*')
            .eq('id', draftId)
            .single();

          const { data: allValidatorReports } = await supabase
            .from('validator_report')
            .select('*')
            .eq('item_draft_id', draftId)
            .order('created_at', { ascending: false });

          const reportsByType: Partial<Record<string, ValidatorReportRow>> = {};
          for (const r of (allValidatorReports ?? []) as ValidatorReportRow[]) {
            if (!reportsByType[r.validator_type]) {
              reportsByType[r.validator_type] = r;
            }
          }

          const cognitiveErrorNames: string[] = [];
          if ((casePlan as CasePlanRow | null)?.target_cognitive_error_id) {
            const { data: errRow } = await supabase
              .from('error_taxonomy')
              .select('error_name')
              .eq('id', (casePlan as CasePlanRow).target_cognitive_error_id!)
              .single();
            if (errRow?.error_name) cognitiveErrorNames.push(errRow.error_name);
          }

          const rubricResult = await trackStep('rubric_evaluator' as AgentType, () =>
            agents.rubricEvaluator.run(context, {
              draft: (finalDraft ?? passedDraft) as ItemDraftRow,
              casePlan: casePlan as CasePlanRow | null,
              node: node ?? null,
              confusionSet,
              cognitiveErrorNames,
              validatorReports: reportsByType,
              rubricScorerOverall,
              ...(config.evaluatorModel ? { model: config.evaluatorModel } : {}),
            })
          );

          if (rubricResult && 'publish_decision' in rubricResult) {
            rubricDecision = rubricResult.publish_decision;
          } else {
            console.warn('[pipeline-v2] rubric_evaluator returned no decision; routing to major_revision');
            rubricDecision = 'major_revision';
          }
        }

        // Publish status driven by Master Rubric decision.
        //   publish        → status='published', review_status='pending_review' or flagged
        //   revise         → status='published', review_status='needs_revision'
        //   major_revision → status='needs_human_review'
        //   reject         → status='killed'
        let publishStatus: 'published' | 'needs_human_review' | 'killed' = 'published';
        let publishReviewStatus: 'pending_review' | 'flagged_uncertain' | 'needs_revision' = reviewStatus;
        if (rubricDecision === 'revise') {
          publishReviewStatus = 'needs_revision';
        } else if (rubricDecision === 'major_revision') {
          publishStatus = 'needs_human_review';
        } else if (rubricDecision === 'reject') {
          publishStatus = 'killed';
        }

        // Publish — try with review_status, fall back to just status if column missing
        const publishResult = await supabase
          .from('item_draft')
          .update({
            status: publishStatus,
            review_status: publishReviewStatus,
          })
          .eq('id', draftId);

        if (publishResult.error?.message?.includes('schema cache')) {
          await supabase
            .from('item_draft')
            .update({ status: publishStatus })
            .eq('id', draftId);
        }
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
            deliberationUsed: v.deliberationUsed,
            jurorCount: v.jurorReports.length,
            tokensUsed: v.totalTokensUsed,
          })),
          totalDisagreements: juryVerdicts.filter((v) => v.agreement === 'facilitator_synthesized' || v.agreement === 'deliberation_synthesized').length,
          totalFacilitatorInvocations: juryVerdicts.filter((v) => v.facilitatorInvoked).length,
          totalDeliberations: juryVerdicts.filter((v) => v.deliberationUsed).length,
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
