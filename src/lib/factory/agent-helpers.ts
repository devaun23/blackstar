import { z } from 'zod';
import type { AgentType } from '@/lib/types/database';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import { callClaude } from './claude';
import { fetchActivePrompt, fillTemplate } from './prompts';

/**
 * Shared agent skeleton. Fetches the active prompt for the given agent type,
 * builds the user message from the input, calls Claude, and returns typed output.
 * buildUserMessage can be sync or async (async needed for source context resolution).
 */
export async function runAgent<TIn, TOut extends z.ZodType>(options: {
  agentType: AgentType;
  context: AgentContext;
  input: TIn;
  outputSchema: TOut;
  buildUserMessage: (input: TIn) => Record<string, string> | Promise<Record<string, string>>;
}): Promise<AgentOutput<z.infer<TOut>>> {
  const { agentType, input, outputSchema, buildUserMessage } = options;

  const startTime = Date.now();

  try {
    const prompt = await fetchActivePrompt(agentType);
    const templateVars = await buildUserMessage(input);
    const userMessage = fillTemplate(prompt.user_prompt_template, templateVars);

    const { data, tokensUsed } = await callClaude({
      systemPrompt: prompt.system_prompt,
      userMessage,
      outputSchema,
    });

    return {
      success: true,
      data,
      tokensUsed,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: null as z.infer<TOut>,
      tokensUsed: 0,
      error: message,
    };
  }
}
