// Rule-based SelectionPolicy.
//
// Wraps the existing selectNextQuestion cascade without moving the logic.
// Writes one row to policy_decision per choose() call. Phase B will introduce
// BanditSelectionPolicy / AttributeAwareSelectionPolicy as alternate
// implementations selected by the policy registry.

import { selectNextQuestion } from '../selector';
import {
  logPolicyDecision,
  selectionChoiceJson,
  snapshotSelectionContext,
} from './telemetry';
import type {
  ExperimentContext,
  SelectionPolicy,
  SelectionPolicyContext,
  SelectionPolicyDecision,
} from './types';

const POLICY_NAME = 'rule_selection_v1';

export class RuleSelectionPolicy implements SelectionPolicy {
  readonly name = POLICY_NAME;
  private readonly experiment: ExperimentContext | null;

  constructor(experiment: ExperimentContext | null = null) {
    this.experiment = experiment;
  }

  async choose(
    ctx: SelectionPolicyContext,
  ): Promise<SelectionPolicyDecision | null> {
    const result = await selectNextQuestion(
      ctx.userId,
      ctx.lastRepairAction ?? null,
      ctx.lastDimensionType ?? null,
      ctx.lastDimensionId ?? null,
      ctx.lastCorrectOptionFrameId ?? null,
      {
        sessionMode: ctx.sessionMode ?? null,
        sessionId: ctx.sessionId ?? null,
        forceDimension: ctx.forceDimension ?? null,
      },
    );
    if (!result) return null;

    const tagged: SelectionPolicyDecision = { ...result, policyName: this.name };

    await logPolicyDecision({
      userId: ctx.userId,
      attemptId: ctx.attemptId ?? null,
      decisionType: 'selection',
      policyName: this.name,
      experiment: this.experiment,
      contextSnapshot: snapshotSelectionContext(ctx),
      choice: selectionChoiceJson(tagged),
    });

    return tagged;
  }
}
