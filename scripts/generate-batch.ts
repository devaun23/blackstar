import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { batchQuestionSchema, batchOutputSchema, type BatchQuestion } from '../src/lib/factory/schemas/batch-question';
import { SYSTEM_PROMPT, BATCH_PROMPTS, EXPECTED_COUNTS } from './batch-prompts';

// ── Args ──────────────────────────────────────────────
const args = process.argv.slice(2);
const batchIdx = args.indexOf('--batch');
const batchNum = batchIdx !== -1 ? parseInt(args[batchIdx + 1], 10) : NaN;
const dryRun = args.includes('--dry-run');

if (isNaN(batchNum) || batchNum < 1 || batchNum > 6) {
  console.error('Usage: npx tsx --env-file .env.local scripts/generate-batch.ts --batch <1-6> [--dry-run]');
  process.exit(1);
}

// ── Clients ───────────────────────────────────────────
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Code-fence stripping (from claude.ts:74-77) ──────
function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

// ── Call Claude with retry ────────────────────────────
async function callClaudeBatch(
  anthropic: Anthropic,
  userPrompt: string,
): Promise<{ questions: unknown[]; tokensUsed: number }> {
  const systemWithJson = `${SYSTEM_PROMPT}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON array.`;

  let lastRaw: string | undefined;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: Anthropic.MessageParam[] = [];

    if (attempt === 0) {
      messages.push({ role: 'user', content: userPrompt });
    } else {
      messages.push(
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: lastRaw! },
        {
          role: 'user',
          content: `Your previous response failed JSON validation:\n${lastError}\n\nPlease fix the JSON and respond again. Output ONLY a valid JSON array.`,
        },
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: systemWithJson,
      messages,
    });

    const rawText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    lastRaw = rawText;

    const tokensUsed =
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    const cleaned = stripCodeFences(rawText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      lastError = `Invalid JSON: ${cleaned.slice(0, 200)}...`;
      if (attempt === 1) throw new Error(`Claude returned invalid JSON after 2 attempts: ${lastError}`);
      console.warn(`  Attempt ${attempt + 1}: JSON parse failed, retrying...`);
      continue;
    }

    // Validate full array
    const arrayResult = batchOutputSchema.safeParse(parsed);
    if (arrayResult.success) {
      return { questions: arrayResult.data, tokensUsed };
    }

    // If array validation fails on first attempt, retry
    lastError = JSON.stringify(arrayResult.error.issues.slice(0, 5), null, 2);
    if (attempt === 1) {
      // On second failure, try validating individually
      console.warn('  Full-array validation failed twice. Validating individually...');
      if (!Array.isArray(parsed)) throw new Error('Claude output is not an array');
      return { questions: parsed, tokensUsed };
    }
    console.warn(`  Attempt ${attempt + 1}: Schema validation failed, retrying...`);
  }

  throw new Error('callClaudeBatch: unexpected loop exit');
}

// ── Main ──────────────────────────────────────────────
async function main() {
  console.log(`\n=== Batch ${batchNum} ${dryRun ? '(DRY RUN)' : ''} ===`);
  console.log(`Expected: ${EXPECTED_COUNTS[batchNum]} questions\n`);

  const anthropic = new Anthropic();
  const supabase = createAdminClient();

  // Load confusion sets → Map<name, id>
  const { data: csSets } = await supabase.from('confusion_sets').select('id, name');
  const csMap = new Map((csSets ?? []).map((cs) => [cs.name, cs.id]));
  console.log(`Loaded ${csMap.size} confusion sets`);

  // Load transfer rules → Map<rule_text, id>
  const { data: trRules } = await supabase.from('transfer_rules').select('id, rule_text');
  const trMap = new Map((trRules ?? []).map((tr) => [tr.rule_text, tr.id]));
  console.log(`Loaded ${trMap.size} transfer rules\n`);

  // For Batch 6, query current distribution and inject into prompt
  let userPrompt = BATCH_PROMPTS[batchNum];
  if (batchNum === 6) {
    const { data: existing } = await supabase.from('questions').select('system_topic, error_bucket, difficulty');
    if (existing && existing.length > 0) {
      const systems = new Map<string, number>();
      const errors = new Map<string, number>();
      const diffs = new Map<string, number>();
      for (const q of existing) {
        systems.set(q.system_topic, (systems.get(q.system_topic) ?? 0) + 1);
        errors.set(q.error_bucket, (errors.get(q.error_bucket) ?? 0) + 1);
        diffs.set(q.difficulty, (diffs.get(q.difficulty) ?? 0) + 1);
      }
      const ctx = `\n\nCURRENT DATABASE STATE (${existing.length} questions so far):\n` +
        `Systems: ${[...systems.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}\n` +
        `Error buckets: ${[...errors.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}\n` +
        `Difficulty: ${[...diffs.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}\n` +
        `\nFill the specific gaps shown above. Prioritize underrepresented systems and error buckets.`;
      userPrompt += ctx;
      console.log('Batch 6: injected current distribution into prompt');
    }
  }

  // Call Claude
  console.log('Calling Claude...');
  const { questions: rawQuestions, tokensUsed } = await callClaudeBatch(
    anthropic,
    userPrompt,
  );
  console.log(`Received ${rawQuestions.length} questions (${tokensUsed} tokens)\n`);

  // Validate + insert each question
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < rawQuestions.length; i++) {
    const raw = rawQuestions[i];
    const result = batchQuestionSchema.safeParse(raw);

    if (!result.success) {
      console.error(`  Q${i + 1}: FAILED validation — ${result.error.issues[0]?.message}`);
      failed++;
      continue;
    }

    const q: BatchQuestion = result.data;

    if (dryRun) {
      console.log(`  Q${i + 1}: ${q.system_topic} / ${q.error_bucket} / ${q.difficulty}`);
      console.log(`    Stem: ${q.stem.slice(0, 80)}...`);
      console.log(`    Answer: ${q.correct_answer}`);
      console.log(`    Transfer: ${q.transfer_rule_text.slice(0, 80)}`);
      console.log(`    Confusion set: ${q.confusion_set_name ?? 'none'}\n`);
      inserted++;
      continue;
    }

    // Resolve confusion_set_name → id
    let confusionSetId: string | null = null;
    if (q.confusion_set_name) {
      confusionSetId = csMap.get(q.confusion_set_name) ?? null;
      if (!confusionSetId) {
        console.warn(`  Q${i + 1}: confusion set "${q.confusion_set_name}" not found in DB`);
      }
    }

    // Resolve transfer_rule_text → id (upsert if new)
    let transferRuleId: string | null = trMap.get(q.transfer_rule_text) ?? null;
    if (!transferRuleId) {
      const { data: newRule, error: trErr } = await supabase
        .from('transfer_rules')
        .insert({ rule_text: q.transfer_rule_text, category: q.error_bucket })
        .select('id')
        .single();
      if (trErr) {
        console.warn(`  Q${i + 1}: failed to insert new transfer rule — ${trErr.message}`);
      } else if (newRule) {
        transferRuleId = newRule.id;
        trMap.set(q.transfer_rule_text, newRule.id);
      }
    }

    // Insert question
    const { error: insertErr } = await supabase.from('questions').insert({
      vignette: q.vignette,
      stem: q.stem,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      correct_answer: q.correct_answer,
      error_map: q.error_map,
      transfer_rule_id: transferRuleId,
      transfer_rule_text: q.transfer_rule_text,
      explanation_decision: q.explanation_decision,
      explanation_options: q.explanation_options,
      explanation_summary: q.explanation_summary,
      system_topic: q.system_topic,
      confusion_set_id: confusionSetId,
      error_bucket: q.error_bucket,
      difficulty: q.difficulty,
      batch_number: batchNum,
    });

    if (insertErr) {
      console.error(`  Q${i + 1}: INSERT FAILED — ${insertErr.message}`);
      failed++;
    } else {
      console.log(`  Q${i + 1}: inserted (${q.system_topic} / ${q.error_bucket} / ${q.difficulty})`);
      inserted++;
    }
  }

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Inserted: ${inserted}/${rawQuestions.length}`);
  console.log(`Failed:   ${failed}/${rawQuestions.length}`);
  console.log(`Tokens:   ${tokensUsed}`);
  if (dryRun) console.log('(dry run — nothing written to DB)');
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
