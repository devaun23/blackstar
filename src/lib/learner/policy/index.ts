// Policy registry.
//
// Returns the active ActionPolicy / SelectionPolicy for a given experiment
// context. Phase A returns the rule-based implementation unconditionally;
// Phase B will branch on experiment.arm to return a bandit policy for users
// in the treatment arm of `bandit_vs_rules_repair`.
//
// The experiment context is bound to the policy instance at construction time
// so every policy_decision row is correctly tagged with the user's arm.

import { RuleActionPolicy } from './rule-action-policy';
import { RuleSelectionPolicy } from './rule-selection-policy';
import type { ActionPolicy, ExperimentContext, SelectionPolicy } from './types';

export * from './types';
export { RuleActionPolicy } from './rule-action-policy';
export { RuleSelectionPolicy } from './rule-selection-policy';
export { logPolicyDecision } from './telemetry';

export function getActionPolicy(
  experiment?: ExperimentContext | null,
): ActionPolicy {
  return new RuleActionPolicy(experiment ?? null);
}

export function getSelectionPolicy(
  experiment?: ExperimentContext | null,
): SelectionPolicy {
  return new RuleSelectionPolicy(experiment ?? null);
}
