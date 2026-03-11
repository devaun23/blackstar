import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic();

export interface CallClaudeOptions<T extends z.ZodType> {
  systemPrompt: string;
  userMessage: string;
  outputSchema: T;
  model?: string;
  maxTokens?: number;
}

export interface CallClaudeResult<T> {
  data: T;
  tokensUsed: number;
}

/**
 * Calls Claude with a system prompt and user message, parses the response
 * with the provided Zod schema. Retries once on parse failure, sending
 * validation errors back to Claude for self-correction.
 */
export async function callClaude<T extends z.ZodType>(
  options: CallClaudeOptions<T>
): Promise<CallClaudeResult<z.infer<T>>> {
  const {
    systemPrompt,
    userMessage,
    outputSchema,
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4096,
  } = options;

  const systemWithJson = `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.`;

  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: Anthropic.MessageParam[] = [];

    if (attempt === 0) {
      messages.push({ role: 'user', content: userMessage });
    } else {
      // Retry: include original message + failed response + error feedback
      messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: lastRawResponse! },
        {
          role: 'user',
          content: `Your previous response failed JSON validation:\n${lastError}\n\nPlease fix the JSON and respond again. Output ONLY valid JSON.`,
        }
      );
    }

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemWithJson,
      messages,
    });

    const rawText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    lastRawResponse = rawText;

    const tokensUsed =
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      lastError = `Invalid JSON: ${cleaned.slice(0, 200)}...`;
      if (attempt === 1) {
        throw new Error(`Claude returned invalid JSON after 2 attempts: ${lastError}`);
      }
      continue;
    }

    const result = outputSchema.safeParse(parsed);
    if (result.success) {
      return { data: result.data, tokensUsed };
    }

    lastError = JSON.stringify(result.error.issues, null, 2);
    if (attempt === 1) {
      throw new Error(`Claude output failed schema validation after 2 attempts:\n${lastError}`);
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error('callClaude: unexpected loop exit');
}

// Track raw response for retry
let lastRawResponse: string | undefined;
