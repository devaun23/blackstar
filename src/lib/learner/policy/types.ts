// Policy-layer interfaces.
//
// Two decisions that together drive the adaptive tutor:
//
//   1. ActionPolicy    — given the latest attempt, pick the *kind* of next move
//                        (advance, reinforce, contrast, remediate, transfer_test).
//                        Today's impl is RuleActionPolicy; Phase B adds a bandit.
//
//   2. SelectionPolicy — given the chosen action, pick the specific question.
//                        Today's impl is RuleSelectionPolicy; Phase B adds a
//                        contextual bandit and/or attribute-aware selector.
//
// Both accept a PolicyContext and return a PolicyDecision that includes the
// policyName and arm — this is the data the telemetry spine (policy_decision
// table) needs to compute per-arm lift and regret later.

import type { DimensionType, RepairAction, SessionMode } from '@/lib/types/database';
import type { PalmertonGapType } from '@/lib/factory/seeds/error-taxonomy';
import type { SelectionStrategy } from '../types';

// -----------------------------------------------------------------------------
// ActionPolicy
// -----------------------------------------------------------------------------

export interface ActionPolicyContext {
  userId: string;
  isCorrect: boolean;
  timeSpentMs: number | null;
  confidencePre: number | null;
  diagnosedCognitiveErrorId: string | null;
  diagnosedHingeMiss: boolean;
  diagnosedActionClassConfusion: boolean;
  errorRepeatCount: number;
  dimensionMastery: number | null;
  confusionSetId: string | null;
  lastCorrectOptionFrameId: string | null;
  palmertonGapType?: PalmertonGapType | null;
  // Telemetry-only; passed through to policy_decision.attempt_id.
  attemptId?: string | null;
}

export interface ActionPolicyDecision {
  action: RepairAction;
  reason: string;
  targetDimensionType: DimensionType | null;
  targetDimensionId: string | null;
  policyName: string;
}

export interface ActionPolicy {
  readonly name: string;
  choose(ctx: ActionPolicyContext): Promise<ActionPolicyDecision>;
}

// -----------------------------------------------------------------------------
// SelectionPolicy
// -----------------------------------------------------------------------------

export interface SelectionPolicyContext {
  userId: string;
  sessionMode?: SessionMode | null;
  sessionId?: string | null;
  lastRepairAction?: RepairAction | null;
  lastDimensionType?: DimensionType | null;
  lastDimensionId?: string | null;
  lastCorrectOptionFrameId?: string | null;
  forceDimension?: { type: DimensionType; id: string } | null;
  // Telemetry-only; generally null at selection time since the next attempt
  // hasn't been created yet. Kept for parity with ActionPolicyContext.
  attemptId?: string | null;
}

export interface SelectionPolicyDecision {
  questionId: string;
  questionType: 'item_draft' | 'question';
  strategy: SelectionStrategy;
  policyName: string;
}

export interface SelectionPolicy {
  readonly name: string;
  choose(ctx: SelectionPolicyContext): Promise<SelectionPolicyDecision | null>;
}

// -----------------------------------------------------------------------------
// ExperimentContext — every policy decision is tagged with the arm the user is
// in, so downstream causal analysis can compute per-arm lift. Phase A assigns
// everyone to arm='control' on a 'default' experiment.
// -----------------------------------------------------------------------------

export interface ExperimentContext {
  experimentId: string;
  experimentName: string;
  arm: string;
}
