import { createAdminClient } from '@/lib/supabase/admin';
import type { AgentType, AgentPromptRow } from '@/lib/types/database';

/**
 * Fetches the active prompt for a given agent type from the agent_prompt table.
 * There should be exactly one active prompt per agent type (enforced by DB unique index).
 */
export async function fetchActivePrompt(agentType: AgentType): Promise<AgentPromptRow> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('agent_prompt')
    .select('*')
    .eq('agent_type', agentType)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error(`No active prompt found for agent type "${agentType}": ${error?.message}`);
  }

  return data as AgentPromptRow;
}

/**
 * Replaces {{variable}} placeholders in a template string with provided values.
 * Throws if any placeholder has no matching value.
 */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in vars)) {
      throw new Error(`Missing template variable: {{${key}}}`);
    }
    return vars[key];
  });
}
