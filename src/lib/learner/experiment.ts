// Experiment framework.
//
// Provides sticky per-user arm assignment. Phase A: every user is placed on
// the 'default' experiment with arm='control' on first request. Phase B adds
// additional experiments (e.g. 'bandit_vs_rules_repair') and biases the
// registry to return different ActionPolicy/SelectionPolicy impls per arm.
//
// Callers should prefer getAssignment(userId) over direct DB reads so that
// a user's arm never flips mid-session.

import { createAdminClient } from '@/lib/supabase/admin';
import type { ExperimentContext } from './policy';
import type { ExperimentRow } from '@/lib/types/database';

const DEFAULT_EXPERIMENT = 'default';
const DEFAULT_ARM = 'control';

/**
 * Returns the user's assignment for the given experiment (default: 'default').
 * Creates a sticky assignment on first call. If the experiment is inactive or
 * missing, returns the fallback {experimentId: '', experimentName, arm: 'control'}
 * so callers can always tag telemetry with something.
 */
export async function getAssignment(
  userId: string,
  experimentName: string = DEFAULT_EXPERIMENT,
): Promise<ExperimentContext> {
  const supabase = createAdminClient();

  const { data: experiment } = await supabase
    .from('experiment')
    .select('id, name, arms, is_active')
    .eq('name', experimentName)
    .maybeSingle();

  if (!experiment || experiment.is_active === false) {
    return { experimentId: '', experimentName, arm: DEFAULT_ARM };
  }

  const { data: existing } = await supabase
    .from('experiment_assignment')
    .select('arm')
    .eq('user_id', userId)
    .eq('experiment_id', experiment.id)
    .maybeSingle();

  if (existing?.arm) {
    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      arm: existing.arm,
    };
  }

  const arm = pickArmForNewUser(experiment as unknown as ExperimentRow);
  await supabase
    .from('experiment_assignment')
    .insert({
      user_id: userId,
      experiment_id: experiment.id,
      arm,
    });

  return {
    experimentId: experiment.id,
    experimentName: experiment.name,
    arm,
  };
}

/**
 * Explicitly place a user into a specific arm. Overwrites any existing assignment.
 * Intended for manual testing and for admin tooling when rolling out/back an arm.
 */
export async function assignToExperiment(
  userId: string,
  experimentName: string,
  arm: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: experiment } = await supabase
    .from('experiment')
    .select('id')
    .eq('name', experimentName)
    .single();

  if (!experiment) {
    throw new Error(`Experiment not found: ${experimentName}`);
  }

  await supabase
    .from('experiment_assignment')
    .upsert({
      user_id: userId,
      experiment_id: experiment.id,
      arm,
    }, { onConflict: 'user_id,experiment_id' });
}

/**
 * Arm-picking policy for new users. Phase A: single-arm experiments so the
 * only possible arm is the first one. Phase B will replace this with a
 * weighted random draw (e.g. 95/5) keyed to the experiment's arm_weights.
 */
function pickArmForNewUser(experiment: ExperimentRow): string {
  const arms = experiment.arms ?? [];
  if (arms.length === 0) return DEFAULT_ARM;
  return arms[0];
}
