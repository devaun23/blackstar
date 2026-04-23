/**
 * Harness types — failure taxonomy, run results, configuration.
 *
 * The failure taxonomy classifies *generation* failures (why the factory
 * failed to produce a good item), distinct from the learner cognitive
 * error taxonomy (why a student might answer wrong).
 */

import type {
  AgentType,
  ValidatorType,
  ItemStatus,
  Shelf,
  YieldTier,
} from '../../src/lib/types/database';

// ─── Failure Taxonomy ───────────────────────────────────────────

export const FAILURE_CODES = {
  // Generation-stage failures (before validation)
  'GEN-SOURCE': { name: 'source_insufficient', severity: 'kill' as const, category: 'GEN' as const },
  'GEN-SKELETON': { name: 'skeleton_rejected', severity: 'kill' as const, category: 'GEN' as const },
  'GEN-AGENT-ERROR': { name: 'agent_error', severity: 'kill' as const, category: 'GEN' as const },

  // Validator-detected failures
  'VAL-MED-KILL': { name: 'medical_accuracy_kill', severity: 'kill' as const, category: 'VAL' as const },
  'VAL-MED-FAIL': { name: 'medical_accuracy_fail', severity: 'repairable' as const, category: 'VAL' as const },
  'VAL-BP': { name: 'blueprint_misalignment', severity: 'repairable' as const, category: 'VAL' as const },
  'VAL-NBME': { name: 'nbme_quality_failure', severity: 'repairable' as const, category: 'VAL' as const },
  'VAL-OPT': { name: 'option_symmetry_failure', severity: 'repairable' as const, category: 'VAL' as const },
  'VAL-EXP': { name: 'explanation_quality_failure', severity: 'repairable' as const, category: 'VAL' as const },
  'VAL-TRANS': { name: 'exam_translation_recall', severity: 'kill' as const, category: 'VAL' as const },
  'VAL-CCV': { name: 'contraindication_trigger', severity: 'repairable' as const, category: 'VAL' as const },
  'VAL-COVERAGE': { name: 'qmatrix_coverage_gap', severity: 'repairable' as const, category: 'VAL' as const },
  'VAL-MASTER-RUBRIC': { name: 'master_rubric_fail', severity: 'repairable' as const, category: 'VAL' as const },

  // Repair-stage failures
  'RPR-EXHAUSTED': { name: 'repair_cycles_exhausted', severity: 'kill' as const, category: 'RPR' as const },
} as const;

export type FailureCode = keyof typeof FAILURE_CODES;
export type FailureCategory = 'GEN' | 'VAL' | 'RPR';
export type FailureSeverity = 'kill' | 'repairable';

export interface ClassifiedFailure {
  code: FailureCode;
  category: FailureCategory;
  severity: FailureSeverity;
  validator_type: ValidatorType | null;
  score: number | null;
  issues: string[];
}

// ─── Validator Scores ───────────────────────────────────────────

export interface ValidatorScore {
  validator_type: ValidatorType;
  passed: boolean;
  score: number | null;
  issues: string[];
  repair_instructions: string | null;
}

// ─── Item Result ────────────────────────────────────────────────

export interface HarnessItemResult {
  item_index: number;
  pipeline_run_id: string;
  blueprint_node_id: string | null;
  topic: string;
  system: string;
  shelf: string;
  status: 'published' | 'killed' | 'failed' | 'error';

  // Draft content (for reviewing worst failures)
  draft: {
    vignette: string;
    stem: string;
    choices: string[];
    correct_answer: string;
  } | null;

  // Validation
  validator_scores: ValidatorScore[];
  classified_failures: ClassifiedFailure[];
  repair_cycles: number;

  // Cost
  total_tokens: number;
  estimated_cost_usd: number;
  duration_ms: number;

  // Per-step breakdown
  step_log: Array<{
    agent: AgentType;
    tokens: number;
    duration_ms: number;
    success: boolean;
    error?: string;
  }>;

  // Pipeline error (if status === 'error')
  error_message?: string;
}

// ─── Run Metadata ───────────────────────────────────────────────

export interface PromptVersionSnapshot {
  agent_type: AgentType;
  prompt_id: string;
  version: number;
  updated_at: string;
}

export interface HarnessRunMeta {
  run_id: string;
  tag: string;
  started_at: string;
  completed_at: string;
  config: HarnessConfig;
  prompt_versions: PromptVersionSnapshot[];
  total_items: number;
  passed_count: number;
  killed_count: number;
  error_count: number;
  total_tokens: number;
  estimated_cost_usd: number;
  failure_distribution: Partial<Record<FailureCode, number>>;
}

// ─── Configuration ──────────────────────────────────────────────

export interface HarnessConfig {
  count: number;
  concurrency: number;
  tag: string;
  shelf?: Shelf;
  yieldTier?: YieldTier;
  blueprintNodeId?: string;
  compareRunId?: string;
  skipExplanation: boolean;
  maxRepairs: number;
  /** Generate until this many items PASS (overrides count as a hard cap) */
  targetYield?: number;
  /** Filter to specific body systems (e.g., ['cardiology', 'pulmonology', 'renal']) */
  systems?: string[];
  /** Enable multi-model jury on medical + exam_translation validators */
  juryEnabled?: boolean;
}

// ─── Cost Constants ─────────────────────────────────────────────

// Claude Sonnet pricing (per 1K tokens)
export const COST_PER_1K_INPUT = 0.003;
export const COST_PER_1K_OUTPUT = 0.015;

// Rough estimate: ~40% of tokens are output
export function estimateCostUsd(totalTokens: number): number {
  const inputTokens = totalTokens * 0.6;
  const outputTokens = totalTokens * 0.4;
  return (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;
}
