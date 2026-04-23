// Rule-based ActionPolicy.
//
// Wraps the existing diagnoseRepairAction decision tree without moving the
// logic. Writes one row to policy_decision on every choose() call so the
// causal ledger captures rules-arm data today. Phase B will introduce
// BanditActionPolicy as a second implementation selected by the policy
// registry based on the user's experiment arm.

import { diagnoseRepairAction } from '../repair-engine';
import {
  actionChoiceJson,
  logPolicyDecision,
  snapshotActionContext,
} from './telemetry';
import type {
  ActionPolicy,
  ActionPolicyContext,
  ActionPolicyDecision,
  ExperimentContext,
} from './types';

const POLICY_NAME = 'rule_action_v1';

export class RuleActionPolicy implements ActionPolicy {
  readonly name = POLICY_NAME;
  private readonly experiment: ExperimentContext | null;

  constructor(experiment: ExperimentContext | null = null) {
    this.experiment = experiment;
  }

  async choose(ctx: ActionPolicyContext): Promise<ActionPolicyDecision> {
    const decision = diagnoseRepairAction(ctx);
    const tagged: ActionPolicyDecision = { ...decision, policyName: this.name };

    await logPolicyDecision({
      userId: ctx.userId,
      attemptId: ctx.attemptId ?? null,
      decisionType: 'action',
      policyName: this.name,
      experiment: this.experiment,
      contextSnapshot: snapshotActionContext(ctx),
      choice: actionChoiceJson(tagged),
    });

    return tagged;
  }
}
