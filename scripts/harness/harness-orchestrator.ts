/**
 * Harness Orchestrator — runs N pipeline-v2 executions with bounded concurrency.
 *
 * Calls the API route POST /api/factory/run-v2 for each item, then fetches
 * validator reports and draft content from DB for classification and reporting.
 *
 * Requires a running dev server (next dev) on localhost:3000.
 */

import { createClient } from '@supabase/supabase-js';
import type { ValidatorReportRow, ItemDraftRow, BlueprintNodeRow } from '../../src/lib/types/database';
import type { PipelineResult } from '../../src/lib/types/factory';
import type { HarnessConfig, HarnessItemResult } from './types';
import { estimateCostUsd } from './types';
import { classifyFailures, countRepairCycles } from './failure-classifier';

const API_BASE = 'http://localhost:3000';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Run a single pipeline item via the API route.
 */
async function runSinglePipeline(config: HarnessConfig): Promise<PipelineResult> {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  const body: Record<string, unknown> = {};
  if (config.blueprintNodeId) body.blueprintNodeId = config.blueprintNodeId;
  if (config.shelf) body.shelf = config.shelf;
  if (config.yieldTier) body.yieldTier = config.yieldTier;
  if (config.skipExplanation) body.skipExplanation = true;

  const res = await fetch(`${API_BASE}/api/factory/run-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pipeline API returned ${res.status}: ${text}`);
  }

  return res.json() as Promise<PipelineResult>;
}

/**
 * Fetch validator reports for a given item draft.
 */
async function fetchValidatorReports(itemDraftId: string): Promise<ValidatorReportRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('validator_report')
    .select('*')
    .eq('item_draft_id', itemDraftId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Failed to fetch validator reports for ${itemDraftId}:`, error.message);
    return [];
  }
  return (data ?? []) as ValidatorReportRow[];
}

/**
 * Fetch the final item draft content.
 */
async function fetchDraft(itemDraftId: string): Promise<ItemDraftRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('item_draft')
    .select('*')
    .eq('id', itemDraftId)
    .single();

  if (error) return null;
  return data as ItemDraftRow;
}

/**
 * Fetch blueprint node for topic/system info.
 */
async function fetchNode(nodeId: string): Promise<BlueprintNodeRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blueprint_node')
    .select('*')
    .eq('id', nodeId)
    .single();

  if (error) return null;
  return data as BlueprintNodeRow;
}

/**
 * Process a single pipeline result into a HarnessItemResult.
 */
async function processResult(
  index: number,
  result: PipelineResult
): Promise<HarnessItemResult> {
  const validatorReports = result.itemDraftId
    ? await fetchValidatorReports(result.itemDraftId)
    : [];

  const draft = result.itemDraftId ? await fetchDraft(result.itemDraftId) : null;

  // Get blueprint node for topic info
  let node: BlueprintNodeRow | null = null;
  if (draft?.blueprint_node_id) {
    node = await fetchNode(draft.blueprint_node_id);
  }

  const failures = classifyFailures(result, validatorReports);
  const repairCycles = countRepairCycles(result);

  // Map final status
  let status: HarnessItemResult['status'];
  if (result.status === 'failed') {
    status = 'error';
  } else if (result.finalStatus === 'published' || result.finalStatus === 'passed') {
    status = 'published'; // 'passed' means skipExplanation mode — treat as success
  } else if (result.finalStatus === 'killed') {
    status = 'killed';
  } else {
    status = 'failed';
  }

  return {
    item_index: index,
    pipeline_run_id: result.runId,
    blueprint_node_id: node?.id ?? null,
    topic: node?.topic ?? 'unknown',
    system: node?.system ?? 'unknown',
    shelf: node?.shelf ?? 'unknown',
    status,

    draft: draft
      ? {
          vignette: draft.vignette,
          stem: draft.stem,
          choices: [draft.choice_a, draft.choice_b, draft.choice_c, draft.choice_d, draft.choice_e],
          correct_answer: draft.correct_answer,
        }
      : null,

    validator_scores: Array.from(
      validatorReports
        // Deduplicate to latest per validator type
        .reduce((acc, r) => {
          acc.set(r.validator_type, r);
          return acc;
        }, new Map<string, ValidatorReportRow>())
        .values()
      ).map((r) => ({
        validator_type: r.validator_type,
        passed: r.passed,
        score: r.score,
        issues: r.issues_found ?? [],
        repair_instructions: r.repair_instructions,
      })),

    classified_failures: failures,
    repair_cycles: repairCycles,

    total_tokens: result.totalTokens,
    estimated_cost_usd: estimateCostUsd(result.totalTokens),
    duration_ms: result.totalDurationMs,

    step_log: result.steps.map((s) => ({
      agent: s.agent,
      tokens: s.tokensUsed,
      duration_ms: s.durationMs,
      success: s.success,
      error: s.error,
    })),

    error_message: result.status === 'failed'
      ? result.steps.find((s) => !s.success)?.error
      : undefined,
  };
}

/**
 * Run a batch of pipeline executions with bounded concurrency.
 *
 * @param config - Harness configuration
 * @param onItemComplete - Callback for streaming results (e.g., writing JSONL)
 */
export async function runBatch(
  config: HarnessConfig,
  onItemComplete?: (result: HarnessItemResult) => void
): Promise<HarnessItemResult[]> {
  const results: HarnessItemResult[] = [];
  let nextIndex = 0;
  let activeCount = 0;

  // Check dev server is running
  try {
    const healthCheck = await fetch(`${API_BASE}`, { method: 'HEAD' });
  } catch {
    throw new Error(
      `Cannot reach dev server at ${API_BASE}. Start it with: npx next dev`
    );
  }

  return new Promise((resolve, reject) => {
    let completed = 0;
    const total = config.count;

    function startNext() {
      if (nextIndex >= total) return;

      const index = nextIndex++;
      activeCount++;

      console.log(`  [${index + 1}/${total}] Starting pipeline run...`);

      runSinglePipeline(config)
        .then((pipelineResult) => processResult(index, pipelineResult))
        .then((itemResult) => {
          results.push(itemResult);
          completed++;
          activeCount--;

          const icon = itemResult.status === 'published' ? '✓' : itemResult.status === 'killed' ? '✗' : '!';
          console.log(
            `  [${completed}/${total}] ${icon} ${itemResult.topic} — ${itemResult.status}` +
            ` (${itemResult.total_tokens} tokens, ${(itemResult.duration_ms / 1000).toFixed(1)}s)`
          );

          if (onItemComplete) onItemComplete(itemResult);

          if (completed === total) {
            resolve(results);
          } else {
            startNext();
          }
        })
        .catch((err) => {
          completed++;
          activeCount--;

          const errorResult: HarnessItemResult = {
            item_index: index,
            pipeline_run_id: '',
            blueprint_node_id: null,
            topic: 'unknown',
            system: 'unknown',
            shelf: 'unknown',
            status: 'error',
            draft: null,
            validator_scores: [],
            classified_failures: [{
              code: 'GEN-AGENT-ERROR',
              category: 'GEN',
              severity: 'kill',
              validator_type: null,
              score: null,
              issues: [err instanceof Error ? err.message : String(err)],
            }],
            repair_cycles: 0,
            total_tokens: 0,
            estimated_cost_usd: 0,
            duration_ms: 0,
            step_log: [],
            error_message: err instanceof Error ? err.message : String(err),
          };

          results.push(errorResult);
          console.log(`  [${completed}/${total}] ! ERROR — ${errorResult.error_message}`);

          if (onItemComplete) onItemComplete(errorResult);

          if (completed === total) {
            resolve(results);
          } else {
            startNext();
          }
        });
    }

    // Start initial batch up to concurrency limit
    const initialBatch = Math.min(config.concurrency, total);
    for (let i = 0; i < initialBatch; i++) {
      startNext();
    }
  });
}
