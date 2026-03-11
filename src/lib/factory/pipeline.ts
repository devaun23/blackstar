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
} from '@/lib/types/database';
import * as agents from './agents';
import { checkSourceSufficiency } from './source-packs/sufficiency';
import { topicSourceMap } from './source-packs/topic-source-map';

const MAX_REPAIR_CYCLES = 3;

/**
 * Runs the full item generation pipeline:
 * 1. Blueprint selection (or use provided node)
 * 2. Algorithm extraction → card + facts
 * 3. Item planning → question architecture
 * 4. Vignette writing → draft question
 * 5. Validation loop (max 3 cycles): 5 validators → repair if needed
 * 6. Explanation writing (if passed)
 * 7. Publish
 */
export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
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

  // Helper to track steps
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

    // Update current agent in pipeline_run
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

    // Update pipeline with selected node
    await supabase
      .from('pipeline_run')
      .update({ blueprint_node_id: node.id })
      .eq('id', pipelineRunId);

    // ─── STEP 1.5: Source Sufficiency Gate ───
    // For scoped topics (in topicSourceMap), hard-fail if evidence is insufficient.
    // For unscoped topics, log a warning but allow training-data extraction.
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

    // Fetch full card and facts from DB
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

    // ─── STEP 3: Item Planning ───
    const { data: errors } = await supabase
      .from('error_taxonomy')
      .select('*');

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

    // ─── STEP 4: Vignette Writing ───
    const vignetteOutput = await trackStep('vignette_writer', () =>
      agents.vignetteWriter.run(context, {
        node,
        card: card as AlgorithmCardRow,
        plan: plan as ItemPlanRow,
        facts: facts as FactRowRow[],
        pipelineRunId,
      })
    );

    let draftId = vignetteOutput.itemDraftId;

    // ─── STEP 5: Validation Loop ───
    let passed = false;
    for (let cycle = 0; cycle < MAX_REPAIR_CYCLES; cycle++) {
      // Fetch current draft
      const { data: draft } = await supabase
        .from('item_draft')
        .select('*')
        .eq('id', draftId)
        .single();
      if (!draft) throw new Error('Failed to fetch draft for validation');

      // Update status to validating
      await supabase
        .from('item_draft')
        .update({ status: 'validating' })
        .eq('id', draftId);

      // Run all 6 validators
      const validatorResults = await Promise.all([
        trackStep('medical_validator', () =>
          agents.medicalValidator.run(context, {
            draft: draft as ItemDraftRow,
            card: card as AlgorithmCardRow,
            facts: facts as FactRowRow[],
            topic: node.topic,
          })
        ),
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
        trackStep('exam_translation_validator', () =>
          agents.examTranslationValidator.run(context, {
            draft: draft as ItemDraftRow,
            card: card as AlgorithmCardRow,
            node,
          })
        ),
      ]);

      const allPassed = validatorResults.every((r) => r.passed);

      if (allPassed) {
        await supabase
          .from('item_draft')
          .update({ status: 'passed' })
          .eq('id', draftId);
        passed = true;
        break;
      }

      // Check for auto-kill conditions (medical accuracy = 0, or score < 3)
      const medicalReport = validatorResults[0];
      if (medicalReport.score !== null && medicalReport.score < 3) {
        await supabase
          .from('item_draft')
          .update({ status: 'killed' })
          .eq('id', draftId);
        break;
      }

      if (cycle >= MAX_REPAIR_CYCLES - 1) {
        // Last cycle, no more repairs allowed
        await supabase
          .from('item_draft')
          .update({ status: 'killed' })
          .eq('id', draftId);
        break;
      }

      // Fetch all validator reports for this draft
      const { data: reports } = await supabase
        .from('validator_report')
        .select('*')
        .eq('item_draft_id', draftId);

      // Repair
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

    // ─── STEP 6: Explanation Writer (only if passed) ───
    if (passed) {
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
          })
        );

        // Set final status to published
        await supabase
          .from('item_draft')
          .update({ status: 'published' })
          .eq('id', draftId);
      }
    }

    // ─── Finalize pipeline run ───
    const finalStatus = passed ? 'published' : 'killed';
    await supabase
      .from('pipeline_run')
      .update({
        status: 'completed',
        current_agent: null,
        agent_log: agentLog,
        total_tokens_used: totalTokens,
        completed_at: new Date().toISOString(),
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
