import { createAdminClient } from '@/lib/supabase/admin';
import { validatorReportSchema } from '@/lib/factory/schemas';
import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { AgentType, ValidatorType } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

/**
 * Shared validator runner. All 5 validators use the same output schema (ValidatorReportInput)
 * and write to the same validator_report table.
 */
export async function runValidator(options: {
  agentType: AgentType;
  validatorType: ValidatorType;
  context: AgentContext;
  itemDraftId: string;
  model?: string;
  buildTemplateVars: () => Record<string, string> | Promise<Record<string, string>>;
}): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  const { agentType, validatorType, context, itemDraftId, buildTemplateVars, model } = options;

  const result = await runAgent({
    agentType,
    context,
    input: await buildTemplateVars(),
    outputSchema: validatorReportSchema,
    buildUserMessage: (vars) => vars,
    ...(model ? { model } : {}),
  });

  if (!result.success) {
    return { ...result, data: null as unknown as ValidatorReportInput & { reportId: string } };
  }

  // Write validator report to DB
  const supabase = createAdminClient();
  const { data: report, error } = await supabase
    .from('validator_report')
    .insert({
      item_draft_id: itemDraftId,
      validator_type: validatorType,
      ...result.data,
      raw_output: result.data as unknown as Record<string, unknown>,
    })
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
