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
  juryEnabled?: boolean;     // Enable multi-model jury on high-stakes validators
  validatorSampleCount?: number; // Self-consistency sampling: run medical validator N times (default 1)
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
