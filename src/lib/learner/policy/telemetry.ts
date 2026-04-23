// Policy-decision telemetry spine.
//
// Every ActionPolicy/SelectionPolicy decision writes one row to policy_decision.
// This is the causal ledger Phase B bandits will read to compute per-arm lift
// and regret. Failures are caught and logged — telemetry must never break the
// user request path.

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ActionPolicyContext,
  ActionPolicyDecision,
  ExperimentContext,
  SelectionPolicyContext,
  SelectionPolicyDecision,
} from './types';
import type { PolicyDecisionType } from '@/lib/types/database';

interface LogInput {
  userId: string;
  attemptId: string | null;
  decisionType: PolicyDecisionType;
  policyName: string;
  experiment: ExperimentContext | null;
  contextSnapshot: Record<string, unknown>;
  choice: Record<string, unknown>;
}

export async function logPolicyDecision(input: LogInput): Promise<void> {
  // No-op when Supabase isn't configured (e.g. the regression test script,
  // local dev without .env loaded). Real insert failures are still surfaced.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }
  try {
    const supabase = createAdminClient();
    await supabase.from('policy_decision').insert({
      user_id: input.userId,
      attempt_id: input.attemptId,
      decision_type: input.decisionType,
      policy_name: input.policyName,
      experiment_id: input.experiment?.experimentId || null,
      arm: input.experiment?.arm ?? 'control',
      context_snapshot: input.contextSnapshot,
      choice: input.choice,
    });
  } catch (err) {
    console.error('[policy/telemetry] insert failed', err);
  }
}

export function snapshotActionContext(
  ctx: ActionPolicyContext,
): Record<string, unknown> {
  // Drop attemptId from the context snapshot — it's stored as a column, not
  // a feature of the decision. Keeps the jsonb compact.
  const { attemptId: _attemptId, ...rest } = ctx;
  return rest as Record<string, unknown>;
}

export function snapshotSelectionContext(
  ctx: SelectionPolicyContext,
): Record<string, unknown> {
  const { attemptId: _attemptId, ...rest } = ctx;
  return rest as Record<string, unknown>;
}

export function actionChoiceJson(
  decision: ActionPolicyDecision,
): Record<string, unknown> {
  return {
    action: decision.action,
    reason: decision.reason,
    target_dimension_type: decision.targetDimensionType,
    target_dimension_id: decision.targetDimensionId,
    policy_name: decision.policyName,
  };
}

export function selectionChoiceJson(
  decision: SelectionPolicyDecision,
): Record<string, unknown> {
  return {
    question_id: decision.questionId,
    question_type: decision.questionType,
    strategy: decision.strategy,
    policy_name: decision.policyName,
  };
}
