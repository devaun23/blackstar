// Domain types derived from Zod schemas
// These are the "clean" types used in application code

import type {
  BlueprintNodeInput,
  BlueprintSelectorOutput,
  AlgorithmCardInput,
  FactRowInput,
  AlgorithmExtractorOutput,
  ItemPlanInput,
  ItemDraftInput,
  ExplanationOutput,
  ValidatorReportInput,
  CasePlanInput,
  OptionFrame,
  QuestionSkeletonInput,
  SkeletonValidatorOutput,
} from '../factory/schemas';

import type { AgentType, ItemStatus, PipelineStatus } from './database';

// Re-export Zod-inferred types as domain types
export type {
  BlueprintNodeInput,
  BlueprintSelectorOutput,
  AlgorithmCardInput,
  FactRowInput,
  AlgorithmExtractorOutput,
  ItemPlanInput,
  ItemDraftInput,
  ExplanationOutput,
  ValidatorReportInput,
  CasePlanInput,
  OptionFrame,
  QuestionSkeletonInput,
  SkeletonValidatorOutput,
};

// --- Pipeline types ---

export interface PipelineConfig {
  blueprintNodeId?: string;  // If provided, skip selector
  shelf?: string;            // Filter for selector
  yieldTier?: string;        // Filter for selector
  mockMode?: boolean;        // Use mock responses
  skipExplanation?: boolean; // Skip explanation writing + publish (harness mode)
  skipRubricEvaluator?: boolean; // v26: Skip Master Rubric evaluation (dev/harness mode)
  skipRubricScorer?: boolean; // v26: Skip HealthBench-style 8-dim rubric scoring (dev/harness/cost mode — adds ~4k tokens/item)
  // Model override for the rubric scorer + rubric evaluator (steps 8 + 9).
  // Separation-of-powers: running evaluators on a different model than the
  // generator (e.g. generator=Opus, evaluator=Haiku) prevents pure self-grading.
  // Falsy → agents use callClaude's default. Stored in item_rubric_score.scorer_model
  // and rubric_score.grader_model for provenance.
  evaluatorModel?: string;
  juryEnabled?: boolean;     // Enable multi-model jury on high-stakes validators
  validatorSampleCount?: number; // Self-consistency sampling: run medical validator N times (default 1)
  // v23: Elite-Tutor Rule 2 — batch-time difficulty hint; passed to case_planner v5
  difficultyClassHint?: 'easy_recognition' | 'decision_fork' | 'hard_discrimination';
}

export interface AgentStepResult {
  agent: AgentType;
  success: boolean;
  tokensUsed: number;
  durationMs: number;
  output: unknown;
  error?: string;
}

export interface PipelineResult {
  runId: string;
  status: PipelineStatus;
  itemDraftId?: string;
  finalStatus: ItemStatus;
  steps: AgentStepResult[];
  totalTokens: number;
  totalDurationMs: number;
}

// --- Agent I/O types ---

export interface AgentContext {
  pipelineRunId: string;
  mockMode: boolean;
}

export interface AgentInput<T = unknown> {
  context: AgentContext;
  data: T;
}

export interface AgentOutput<T = unknown> {
  success: boolean;
  data: T;
  tokensUsed: number;
  error?: string;
}
