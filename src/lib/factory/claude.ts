import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// ─── Provider Clients (lazy-initialized) ───

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let googleClient: GoogleGenerativeAI | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

function getOpenAI(): OpenAI {
  if (!openaiClient) openaiClient = new OpenAI();
  return openaiClient;
}

function getGoogle(): GoogleGenerativeAI {
  if (!googleClient) {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error('Missing GOOGLE_AI_API_KEY environment variable');
    googleClient = new GoogleGenerativeAI(key);
  }
  return googleClient;
}

// ─── Provider Detection ───

type Provider = 'anthropic' | 'openai' | 'google';

function detectProvider(model: string): Provider {
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  if (model.startsWith('gemini-')) return 'google';
  // Default to Anthropic for backward compatibility
  return 'anthropic';
}

// ─── Public Interface (unchanged) ───

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
 * Calls an LLM with a system prompt and user message, parses the response
 * with the provided Zod schema. Routes to the appropriate provider based on
 * model string prefix. Retries once on parse failure with validation feedback.
 *
 * Providers:
 *   claude-*  → Anthropic SDK
 *   gpt-*    → OpenAI SDK
 *   gemini-* → Google Generative AI SDK
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

  const provider = detectProvider(model);

  const systemWithJson = `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.`;

  let lastError: string | null = null;
  let lastRawResponse: string | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    let rawText: string;
    let tokensUsed: number;

    if (provider === 'anthropic') {
      ({ rawText, tokensUsed } = await callAnthropic(
        model, systemWithJson, userMessage, maxTokens, attempt, lastRawResponse, lastError,
      ));
    } else if (provider === 'openai') {
      ({ rawText, tokensUsed } = await callOpenAI(
        model, systemWithJson, userMessage, maxTokens, attempt, lastRawResponse, lastError,
      ));
    } else {
      ({ rawText, tokensUsed } = await callGoogle(
        model, systemWithJson, userMessage, maxTokens, attempt, lastRawResponse, lastError,
      ));
    }

    lastRawResponse = rawText;

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
        throw new Error(`${model} returned invalid JSON after 2 attempts: ${lastError}`);
      }
      continue;
    }

    const result = outputSchema.safeParse(parsed);
    if (result.success) {
      return { data: result.data, tokensUsed };
    }

    // Debug: log the problematic fields
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      let val: unknown = parsed;
      for (const key of issue.path) {
        val = (val as Record<string | number, unknown>)?.[key as string | number];
      }
      console.error(`[callClaude] Validation failed at ${path}: value=${JSON.stringify(val)} (${issue.message})`);
    }

    lastError = JSON.stringify(result.error.issues, null, 2);
    if (attempt === 1) {
      throw new Error(`${model} output failed schema validation after 2 attempts:\n${lastError}`);
    }
  }

  throw new Error('callClaude: unexpected loop exit');
}

// ─── Provider Implementations ───

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  attempt: number,
  lastRawResponse: string | undefined,
  lastError: string | null,
): Promise<{ rawText: string; tokensUsed: number }> {
  const client = getAnthropic();
  const messages: Anthropic.MessageParam[] = [];

  if (attempt === 0) {
    messages.push({ role: 'user', content: userMessage });
  } else {
    messages.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: lastRawResponse! },
      {
        role: 'user',
        content: `Your previous response failed JSON validation:\n${lastError}\n\nPlease fix the JSON and respond again. Output ONLY valid JSON.`,
      },
    );
  }

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  return { rawText, tokensUsed };
}

async function callOpenAI(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  attempt: number,
  lastRawResponse: string | undefined,
  lastError: string | null,
): Promise<{ rawText: string; tokensUsed: number }> {
  const client = getOpenAI();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (attempt === 0) {
    messages.push({ role: 'user', content: userMessage });
  } else {
    messages.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: lastRawResponse! },
      {
        role: 'user',
        content: `Your previous response failed JSON validation:\n${lastError}\n\nPlease fix the JSON and respond again. Output ONLY valid JSON.`,
      },
    );
  }

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages,
    response_format: { type: 'json_object' },
  });

  const rawText = response.choices[0]?.message?.content ?? '';
  const tokensUsed =
    (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0);

  return { rawText, tokensUsed };
}

async function callGoogle(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  attempt: number,
  lastRawResponse: string | undefined,
  lastError: string | null,
): Promise<{ rawText: string; tokensUsed: number }> {
  const client = getGoogle();
  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  });

  let prompt: string;
  if (attempt === 0) {
    prompt = userMessage;
  } else {
    prompt = `${userMessage}\n\n---\nYour previous response:\n${lastRawResponse}\n\nFailed JSON validation:\n${lastError}\n\nPlease fix the JSON and respond again. Output ONLY valid JSON.`;
  }

  const result = await genModel.generateContent(prompt);
  const response = result.response;
  const rawText = response.text();
  const usage = response.usageMetadata;
  const tokensUsed =
    (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0);

  return { rawText, tokensUsed };
}
