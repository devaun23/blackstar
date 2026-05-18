/**
 * Phase B of the n=1 PE experiment — adversarial student tester.
 *
 * Plan: ~/.claude/plans/you-re-right-to-push-spicy-cookie.md
 *
 * Given an item_draft_id, runs two LLM personas (smart M4, weak M3) against
 * the question, then asks a validator LLM whether:
 *   - smart student picked the keyed answer for the rule-aligned reason
 *   - weak student fell into the intended named-distractor cognitive error
 *     (not just a random wrong answer)
 *   - either persona could have answered without the hinge clue
 *
 * The intended cognitive error for the GOLD_CARD_PE / D-dimer transfer rule
 * is `wrong_algorithm_branch` — ordering D-dimer when pretest probability
 * is HIGH (Wells ≥5). The weak student should be tempted into ordering
 * D-dimer; if it falls into a different distractor, the item has a
 * distractor-mapping problem.
 *
 * Appends results to pilot/n1-experiment/PHASE_B_RESULT.md if that file
 * exists, otherwise writes to pilot/n1-experiment/ADVERSARIAL_RESULT.md.
 *
 * Usage:
 *   npx tsx scripts/n1-adversarial-student.ts --item-draft-id=<uuid>
 *
 * Optional flags:
 *   --persona-model="claude-haiku-4-5-20251001"  (default; same model both personas)
 *   --validator-model="claude-sonnet-4-20250514" (default)
 *   --label="phase-b-winner"                     (label this run in the appended section)
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

// ─── Argv ─────────────────────────────────────────────────────────────────────

interface Args {
  itemDraftId: string;
  personaModel: string;
  validatorModel: string;
  label: string;
}

function parseArgs(): Args {
  const get = (k: string) => process.argv.find((a) => a.startsWith(`${k}=`))?.split('=').slice(1).join('=');
  const itemDraftId = get('--item-draft-id');
  if (!itemDraftId) {
    console.error('  ✗ --item-draft-id=<uuid> is required.');
    process.exit(1);
  }
  return {
    itemDraftId,
    personaModel: get('--persona-model') ?? 'claude-haiku-4-5-20251001',
    validatorModel: get('--validator-model') ?? 'claude-sonnet-4-20250514',
    label: get('--label') ?? 'unlabeled',
  };
}

// ─── Persona prompts ──────────────────────────────────────────────────────────

const SMART_STUDENT_SYSTEM = `You are a strong 4th-year medical student preparing for USMLE Step 2 CK. You have a strong grasp of internal medicine, including pulmonary embolism workup. You know:
- Wells score components and how to interpret the result
- D-dimer test characteristics: high sensitivity, low specificity, useful only when pretest probability is LOW
- When CT pulmonary angiogram (CTPA) is the right test (high pretest probability, or positive D-dimer with low/intermediate pretest)
- Heparin dosing and timing in PE workup
- Hemodynamic instability triggers (consider thrombolytics, ECMO, etc.)

You approach questions methodically: you read the stem carefully, identify the clinical picture, calculate or estimate any relevant scores, then map to the right next step. You do NOT pattern-match without thinking. You do not assume the longest answer is right.

You will be shown a USMLE Step 2 CK question with 5 options. Pick the single best answer (A, B, C, D, or E) and explain your reasoning in 3-6 sentences. Reference specific data from the stem.`;

const WEAK_STUDENT_SYSTEM = `You are a 3rd-year medical student studying for shelf exams. Your test-taking style has the following habits:
- You tend toward over-testing — when in doubt, you order more diagnostics rather than commit to a definitive test
- You anchor on the first plausible diagnosis and don't always update your probability estimate
- You sometimes skip the explicit step of calculating risk scores; you go on gestalt
- You often order D-dimer for "rule out PE" even when pretest probability is high — it feels like the safe screening move
- You worry about radiation and contrast more than your attending does

You will be shown a USMLE Step 2 CK question with 5 options. Pick the single best answer (A, B, C, D, or E) and explain your reasoning in 3-6 sentences. Be authentic to your habits — do not over-correct toward what you think the "right" answer should be. If your gestalt says order D-dimer, say so.`;

const personaOutputSchema = z.object({
  selected_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  reasoning: z.string().min(40),
  named_cited_data: z.array(z.string()).max(10),
  confidence_0_10: z.number().int().min(0).max(10),
});
type PersonaOutput = z.infer<typeof personaOutputSchema>;

function buildPersonaUserMessage(draft: ItemDraft): string {
  const stem = [draft.vignette, '', draft.stem].filter(Boolean).join('\n');
  return [
    'Read the question, pick the single best answer, and explain.',
    '',
    '## Question',
    '',
    stem,
    '',
    '## Options',
    '- A: ' + draft.choice_a,
    '- B: ' + draft.choice_b,
    '- C: ' + draft.choice_c,
    '- D: ' + draft.choice_d,
    '- E: ' + draft.choice_e,
    '',
    'Respond with a JSON object:',
    '```json',
    '{',
    '  "selected_answer": "A",',
    '  "reasoning": "3-6 sentences explaining your choice, referencing specific stem data",',
    '  "named_cited_data": ["heart rate 110", "Wells 6", "etc — short phrases you pulled from the stem"],',
    '  "confidence_0_10": 7',
    '}',
    '```',
  ].join('\n');
}

// ─── Validator prompt ─────────────────────────────────────────────────────────

const VALIDATOR_SYSTEM = `You are a USMLE item-quality auditor. You will be shown a Step 2 CK question, the keyed correct answer, and the intended cognitive-error mapping for distractors. Two simulated student personas (smart M4, weak M3) attempted the question. Your job is to judge construct validity:

1. Did the SMART student pick the keyed correct answer for the RIGHT reason — i.e., reasoning that maps to the intended transfer rule?
2. Did the WEAK student fall into the INTENDED named cognitive-error distractor? For PE / D-dimer items targeting the transfer rule "D-dimer is only useful to EXCLUDE PE in LOW pre-test probability patients," the intended weak-student distractor is the one that involves ordering D-dimer in a high-pretest-probability patient (cognitive error: wrong_algorithm_branch / over-testing).
3. Is the item HINGE-DEPENDENT — i.e., would removing the key clinical detail that triggers the transfer rule (the Wells score features, the explicit Wells number, or equivalent risk-stratification anchor) make either persona unable to reach the correct answer? If yes → hinge_dependent=true. If the personas could correct-answer by pattern-matching without the hinge → hinge_dependent=false (construct validity problem).

If smart_student_valid is FALSE OR weak_student_valid is FALSE OR hinge_dependent is FALSE, the item has a construct-validity issue, even if the rubric_evaluator gave it a high score.

Respond with a JSON object only.`;

const validatorOutputSchema = z.object({
  smart_student_valid: z.boolean(),
  smart_student_explanation: z.string().min(40),
  weak_student_valid: z.boolean(),
  weak_student_explanation: z.string().min(40),
  hinge_dependent: z.boolean(),
  hinge_dependent_explanation: z.string().min(40),
  overall_construct_valid: z.boolean(),
  one_line_verdict: z.string().min(20),
});
type ValidatorOutput = z.infer<typeof validatorOutputSchema>;

function buildValidatorUserMessage(
  draft: ItemDraft,
  smart: PersonaOutput,
  weak: PersonaOutput,
): string {
  return [
    '# Item under review',
    '',
    '## Stem',
    '```',
    draft.vignette ?? '',
    '',
    draft.stem ?? '',
    '```',
    '',
    '## Options',
    '- A: ' + draft.choice_a,
    '- B: ' + draft.choice_b,
    '- C: ' + draft.choice_c,
    '- D: ' + draft.choice_d,
    '- E: ' + draft.choice_e,
    '',
    '**Keyed correct answer:** ' + draft.correct_answer,
    '',
    '## Intended distractor mapping (from GOLD_CARD_PE for the D-dimer transfer rule)',
    '- Intended weak-student distractor: whichever option involves ordering D-dimer in a HIGH-pretest-probability patient',
    '- Cognitive error: wrong_algorithm_branch / over-testing',
    '- nbme_trap: "Ordering D-dimer when pretest probability is HIGH (Wells ≥5)."',
    '',
    '## Smart-student attempt',
    '- selected_answer: ' + smart.selected_answer,
    '- confidence_0_10: ' + smart.confidence_0_10,
    '- reasoning:',
    '  > ' + smart.reasoning.replace(/\n/g, '\n  > '),
    '- named_cited_data: ' + JSON.stringify(smart.named_cited_data),
    '',
    '## Weak-student attempt',
    '- selected_answer: ' + weak.selected_answer,
    '- confidence_0_10: ' + weak.confidence_0_10,
    '- reasoning:',
    '  > ' + weak.reasoning.replace(/\n/g, '\n  > '),
    '- named_cited_data: ' + JSON.stringify(weak.named_cited_data),
    '',
    '## Your task',
    '',
    'Evaluate construct validity per the three criteria in your system prompt. Respond with JSON:',
    '```json',
    '{',
    '  "smart_student_valid": true,',
    '  "smart_student_explanation": "...",',
    '  "weak_student_valid": false,',
    '  "weak_student_explanation": "weak student picked C but the intended over-test distractor was D",',
    '  "hinge_dependent": true,',
    '  "hinge_dependent_explanation": "...",',
    '  "overall_construct_valid": false,',
    '  "one_line_verdict": "..."',
    '}',
    '```',
  ].join('\n');
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemDraft {
  id: string;
  vignette: string | null;
  stem: string | null;
  choice_a: string | null;
  choice_b: string | null;
  choice_c: string | null;
  choice_d: string | null;
  choice_e: string | null;
  correct_answer: string | null;
  why_correct: string | null;
  explanation_transfer_rule: string | null;
  decision_hinge: string | null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  const { createClient } = await import('@supabase/supabase-js');
  const { callClaude } = await import('../src/lib/factory/claude');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: draft, error } = await supabase
    .from('item_draft')
    .select('id, vignette, stem, choice_a, choice_b, choice_c, choice_d, choice_e, correct_answer, why_correct, explanation_transfer_rule, decision_hinge')
    .eq('id', args.itemDraftId)
    .single();
  if (error || !draft) {
    console.error('  ✗ item_draft not found: ' + args.itemDraftId + ' — ' + (error?.message ?? 'no row'));
    process.exit(1);
  }
  const item = draft as ItemDraft;

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ADVERSARIAL STUDENT TESTER');
  console.log('  itemDraftId:     ' + args.itemDraftId);
  console.log('  label:           ' + args.label);
  console.log('  persona model:   ' + args.personaModel);
  console.log('  validator model: ' + args.validatorModel);
  console.log('  keyed correct:   ' + item.correct_answer);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // ── Run smart + weak personas in parallel ───────────────────────────────────
  console.log('  → Running smart + weak personas in parallel…');
  const t0 = Date.now();
  const [smartResult, weakResult] = await Promise.all([
    callClaude({
      systemPrompt: SMART_STUDENT_SYSTEM,
      userMessage: buildPersonaUserMessage(item),
      outputSchema: personaOutputSchema,
      model: args.personaModel,
      maxTokens: 2048,
    }),
    callClaude({
      systemPrompt: WEAK_STUDENT_SYSTEM,
      userMessage: buildPersonaUserMessage(item),
      outputSchema: personaOutputSchema,
      model: args.personaModel,
      maxTokens: 2048,
    }),
  ]);
  const personasElapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const smart = smartResult.data;
  const weak = weakResult.data;
  console.log(`  ✓ Personas done in ${personasElapsed}s`);
  console.log('    smart → ' + smart.selected_answer + ' (conf ' + smart.confidence_0_10 + '/10)');
  console.log('    weak  → ' + weak.selected_answer + ' (conf ' + weak.confidence_0_10 + '/10)');
  console.log('');

  // ── Validator ────────────────────────────────────────────────────────────────
  console.log('  → Running validator…');
  const validatorT0 = Date.now();
  const validatorResult = await callClaude({
    systemPrompt: VALIDATOR_SYSTEM,
    userMessage: buildValidatorUserMessage(item, smart, weak),
    outputSchema: validatorOutputSchema,
    model: args.validatorModel,
    maxTokens: 2048,
  });
  const validator = validatorResult.data;
  const validatorElapsed = ((Date.now() - validatorT0) / 1000).toFixed(1);
  console.log(`  ✓ Validator done in ${validatorElapsed}s`);
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('  VERDICT');
  console.log('═══════════════════════════════════════════════════');
  console.log('  smart_student_valid:      ' + validator.smart_student_valid);
  console.log('  weak_student_valid:       ' + validator.weak_student_valid);
  console.log('  hinge_dependent:          ' + validator.hinge_dependent);
  console.log('  overall_construct_valid:  ' + validator.overall_construct_valid);
  console.log('  one_line: ' + validator.one_line_verdict);
  console.log('');

  const totalTokens =
    smartResult.tokensUsed + weakResult.tokensUsed + validatorResult.tokensUsed;
  await appendResults(args, item, smart, weak, validator, totalTokens);
}

// ─── Append to result markdown ────────────────────────────────────────────────

async function appendResults(
  args: Args,
  item: ItemDraft,
  smart: PersonaOutput,
  weak: PersonaOutput,
  validator: ValidatorOutput,
  totalTokens: number,
): Promise<void> {
  const phaseBPath = path.resolve(__dirname, '../pilot/n1-experiment/PHASE_B_RESULT.md');
  const fallbackPath = path.resolve(__dirname, '../pilot/n1-experiment/ADVERSARIAL_RESULT.md');
  const outPath = fs.existsSync(phaseBPath) ? phaseBPath : fallbackPath;

  const block: string[] = [];
  block.push('');
  block.push('---');
  block.push('');
  block.push(`## Adversarial-student run — label: \`${args.label}\``);
  block.push('');
  block.push(`- itemDraftId: \`${args.itemDraftId}\``);
  block.push(`- keyed correct: **${item.correct_answer}**`);
  block.push(`- persona model: ${args.personaModel}`);
  block.push(`- validator model: ${args.validatorModel}`);
  block.push(`- total tokens: ${totalTokens.toLocaleString()}`);
  block.push('');
  block.push('### Smart-student attempt');
  block.push('');
  block.push(`- **selected:** ${smart.selected_answer} (confidence ${smart.confidence_0_10}/10)`);
  block.push('- **reasoning:**');
  block.push('  > ' + smart.reasoning.replace(/\n/g, '\n  > '));
  block.push('- **cited stem data:** ' + JSON.stringify(smart.named_cited_data));
  block.push('');
  block.push('### Weak-student attempt');
  block.push('');
  block.push(`- **selected:** ${weak.selected_answer} (confidence ${weak.confidence_0_10}/10)`);
  block.push('- **reasoning:**');
  block.push('  > ' + weak.reasoning.replace(/\n/g, '\n  > '));
  block.push('- **cited stem data:** ' + JSON.stringify(weak.named_cited_data));
  block.push('');
  block.push('### Validator verdict');
  block.push('');
  block.push(`| Check | Result | Explanation |`);
  block.push(`|---|---|---|`);
  block.push(`| smart_student_valid | ${validator.smart_student_valid ? '✅' : '❌'} | ${validator.smart_student_explanation} |`);
  block.push(`| weak_student_valid | ${validator.weak_student_valid ? '✅' : '❌'} | ${validator.weak_student_explanation} |`);
  block.push(`| hinge_dependent | ${validator.hinge_dependent ? '✅' : '❌'} | ${validator.hinge_dependent_explanation} |`);
  block.push(`| **overall_construct_valid** | **${validator.overall_construct_valid ? '✅' : '❌'}** | ${validator.one_line_verdict} |`);
  block.push('');

  if (!fs.existsSync(outPath)) {
    fs.writeFileSync(outPath, `# Adversarial student tester results\n\n_Auto-generated by scripts/n1-adversarial-student.ts._\n`);
  }
  fs.appendFileSync(outPath, block.join('\n') + '\n');
  console.log('  ✓ Appended results to ' + outPath);
}

main().catch((err) => {
  console.error('  ✗ Fatal:', err);
  process.exit(1);
});
