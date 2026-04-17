import { createAdminClient } from '@/lib/supabase/admin';
import { validatorReportSchema } from '@/lib/factory/schemas';
import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { AgentType, ValidatorType } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

/**
 * Compute binary entropy: H = -p*log2(p) - (1-p)*log2(1-p)
 * Returns 0 when all samples agree, 1.0 when 50/50 split (maximum uncertainty).
 */
function binaryEntropy(passCount: number, total: number): number {
  if (total <= 1) return 0;
  const p = passCount / total;
  if (p === 0 || p === 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

/**
 * Aggregate N validator samples into a single report.
 * Uses majority vote for passed, mean for score, union for issues,
 * and binary entropy as a consistency signal.
 */
function aggregateSamples(samples: ValidatorReportInput[]): {
  aggregate: ValidatorReportInput;
  consistencyScore: number;
} {
  const passCount = samples.filter((s) => s.passed).length;
  const total = samples.length;
  const majorityPassed = passCount > total / 2;
  const meanScore = samples.reduce((sum, s) => sum + s.score, 0) / total;

  // Union all issues (deduplicated)
  const allIssues = [...new Set(samples.flatMap((s) => s.issues_found))];

  // Use repair instructions from the most critical (lowest score) sample
  const mostCritical = samples.reduce((min, s) => (s.score < min.score ? s : min), samples[0]);

  // Use most common failure category
  const categories = samples
    .map((s) => s.failure_category)
    .filter((c): c is NonNullable<typeof c> => c != null);
  const categoryFreqs = new Map<string, number>();
  for (const c of categories) categoryFreqs.set(c, (categoryFreqs.get(c) ?? 0) + 1);
  const topCategory = categories.length > 0
    ? [...categoryFreqs.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return {
    aggregate: {
      passed: majorityPassed,
      score: Math.round(meanScore * 100) / 100,
      issues_found: allIssues,
      repair_instructions: mostCritical.repair_instructions,
      failure_category: topCategory as ValidatorReportInput['failure_category'],
    },
    consistencyScore: Math.round(binaryEntropy(passCount, total) * 1000) / 1000,
  };
}

/**
 * Shared validator runner. All 6 validators use the same output schema (ValidatorReportInput)
 * and write to the same validator_report table.
 *
 * Self-consistency sampling (research-backed):
 * When sampleCount > 1, runs the validator N times and aggregates results.
 * The consistency_score (binary entropy of pass/fail) predicts correctness:
 * high entropy = model is uncertain = flag for human review even if majority passed.
 */
export async function runValidator(options: {
  agentType: AgentType;
  validatorType: ValidatorType;
  context: AgentContext;
  itemDraftId: string;
  model?: string;
  sampleCount?: number;
  buildTemplateVars: () => Record<string, string> | Promise<Record<string, string>>;
}): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  const { agentType, validatorType, context, itemDraftId, buildTemplateVars, model, sampleCount = 1 } = options;

  const templateVars = await buildTemplateVars();

  // Single sample (default path — no overhead)
  if (sampleCount <= 1) {
    const result = await runAgent({
      agentType,
      context,
      input: templateVars,
      outputSchema: validatorReportSchema,
      buildUserMessage: (vars) => vars,
      ...(model ? { model } : {}),
    });

    if (!result.success) {
      return { ...result, data: null as unknown as ValidatorReportInput & { reportId: string } };
    }

    const supabase = createAdminClient();
    // Only include known DB columns (exclude fields the DB may not have)
    const reportPayload: Record<string, unknown> = {
      item_draft_id: itemDraftId,
      validator_type: validatorType,
      passed: result.data.passed,
      score: result.data.score,
      issues_found: result.data.issues_found,
      repair_instructions: result.data.repair_instructions ?? null,
      raw_output: result.data as unknown as Record<string, unknown>,
    };
    let { data: report, error } = await supabase
      .from('validator_report')
      .insert(reportPayload)
      .select('id')
      .single();

    if (error || !report) {
      return {
        success: false,
        data: null as unknown as ValidatorReportInput & { reportId: string },
        tokensUsed: result.tokensUsed,
        error: `Failed to insert validator_report: ${error?.message}`,
      };
    }

    return {
      success: true,
      data: { ...result.data, reportId: report.id },
      tokensUsed: result.tokensUsed,
    };
  }

  // Multi-sample: run N times in parallel, aggregate
  const samplePromises = Array.from({ length: sampleCount }, () =>
    runAgent({
      agentType,
      context,
      input: templateVars,
      outputSchema: validatorReportSchema,
      buildUserMessage: (vars) => vars,
      ...(model ? { model } : {}),
    })
  );

  const sampleResults = await Promise.all(samplePromises);
  const successfulSamples = sampleResults.filter((r) => r.success);
  const totalTokensUsed = sampleResults.reduce((sum, r) => sum + r.tokensUsed, 0);

  if (successfulSamples.length === 0) {
    return {
      success: false,
      data: null as unknown as ValidatorReportInput & { reportId: string },
      tokensUsed: totalTokensUsed,
      error: `All ${sampleCount} samples failed`,
    };
  }

  const { aggregate, consistencyScore } = aggregateSamples(
    successfulSamples.map((r) => r.data)
  );

  // Write aggregate report + raw samples to DB — only include known columns
  const supabase = createAdminClient();
  const aggPayload: Record<string, unknown> = {
    item_draft_id: itemDraftId,
    validator_type: validatorType,
    passed: aggregate.passed,
    score: aggregate.score,
    issues_found: aggregate.issues_found,
    repair_instructions: aggregate.repair_instructions ?? null,
    raw_output: {
      aggregate,
      consistency_score: consistencyScore,
      sample_count: sampleCount,
      successful_samples: successfulSamples.length,
      samples: successfulSamples.map((r) => r.data),
    } as unknown as Record<string, unknown>,
  };
  // Try including consistency_score if column exists, fall back without it
  let { data: report, error } = await supabase
    .from('validator_report')
    .insert({ ...aggPayload, consistency_score: consistencyScore })
    .select('id')
    .single();
  if (error?.message?.includes('schema cache')) {
    const retry = await supabase
      .from('validator_report')
      .insert(aggPayload)
      .select('id')
      .single();
    report = retry.data;
    error = retry.error;
  }

  if (error || !report) {
    return {
      success: false,
      data: null as unknown as ValidatorReportInput & { reportId: string },
      tokensUsed: totalTokensUsed,
      error: `Failed to insert validator_report: ${error?.message}`,
    };
  }

  return {
    success: true,
    data: { ...aggregate, reportId: report.id },
    tokensUsed: totalTokensUsed,
  };
}
