import { createAdminClient } from '@/lib/supabase/admin';
import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, CasePlanRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface NbmeQualityValidatorInput {
  draft: ItemDraftRow;
}

/**
 * v23 — Elite-Tutor Rule 1 (multi-step reasoning) deterministic pre-checks.
 * Each issue maps to R-REAS-01 or R-REAS-02 and makes it into the validator_report
 * regardless of the LLM judge's verdict.
 */
async function runReasoningChainChecks(draft: ItemDraftRow): Promise<string[]> {
  const issues: string[] = [];
  if (!draft.case_plan_id) return issues;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('case_plan')
    .select('reasoning_step_count, reasoning_steps')
    .eq('id', draft.case_plan_id)
    .single();

  const plan = data as Pick<CasePlanRow, 'reasoning_step_count' | 'reasoning_steps'> | null;
  if (!plan) return issues;

  const count = plan.reasoning_step_count ?? 0;
  const steps = plan.reasoning_steps ?? [];

  if (count < 2) {
    issues.push(
      `R-REAS-01: single-step question (reasoning_step_count=${count}, expected ≥2) — Rule 1 requires 2-4 sequential decisions`
    );
  }
  if (steps.length !== count) {
    issues.push(
      `R-REAS-01: reasoning_steps.length (${steps.length}) does not match reasoning_step_count (${count})`
    );
  }

  // Rule 1 hidden-leap check: every clinical_signal must be a substring of the vignette
  // (after lowercasing and stripping punctuation). A signal that can't be found in the
  // stem is a hidden knowledge leap — R-REAS-02.
  const normalize = (s: string): string => s.toLowerCase().replace(/[.,;:()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  const stemText = normalize(`${draft.vignette} ${draft.stem}`);
  for (const step of steps) {
    const signal = normalize(step.clinical_signal);
    // First try exact substring, then try keyword intersection (≥70% of signal words appear in stem)
    if (stemText.includes(signal)) continue;
    const signalWords = signal.split(' ').filter((w) => w.length >= 4);
    if (signalWords.length === 0) continue;
    const hits = signalWords.filter((w) => stemText.includes(w)).length;
    if (hits / signalWords.length < 0.7) {
      issues.push(
        `R-REAS-02: reasoning_steps[${step.step_number}].clinical_signal "${step.clinical_signal}" is not resolvable from stem text — hidden knowledge leap`
      );
    }
  }

  return issues;
}

export async function run(
  context: AgentContext,
  input: NbmeQualityValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  const reasoningIssues = await runReasoningChainChecks(input.draft);

  const result = await runValidator({
    agentType: 'nbme_quality_validator',
    validatorType: 'nbme_quality',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: () => ({
      item_draft: JSON.stringify(input.draft, null, 2),
    }),
  });

  if (result.success && reasoningIssues.length > 0) {
    result.data.issues_found = [
      ...new Set([...result.data.issues_found, ...reasoningIssues]),
    ];
    result.data.passed = result.data.passed && reasoningIssues.length === 0;
  }

  return result;
}
