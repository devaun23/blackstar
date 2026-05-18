/**
 * Phase B of the n=1 PE experiment — best-of-N + cross-family judge.
 *
 * Plan: ~/.claude/plans/you-re-right-to-push-spicy-cookie.md
 * Phase A scaffolding: pilot/n1-experiment/
 *
 * Generates N=4 candidate items in parallel against the same PE blueprint
 * node via runPipelineV2 (with BLACKSTAR_N1_OVERRIDE=1 active so the
 * di-loader injects pilot/n1-experiment/refs.md). For each candidate, reads
 * the existing rubric_score row, then asks an Opus 4.7 judge to pick the
 * winner against the master rubric. Writes pilot/n1-experiment/PHASE_B_RESULT.md.
 *
 * Usage:
 *   BLACKSTAR_N1_OVERRIDE=1 npx tsx scripts/n1-best-of-n.ts
 *
 * Optional flags:
 *   --topic="Pulmonary Embolism"        (default; matched against blueprint_node.topic)
 *   --node-id="<uuid>"                  (explicit blueprint_node id; overrides --topic)
 *   --n=4                               (number of candidates; default 4)
 *   --difficulty=fork                   (default fork)
 *   --judge-model="claude-opus-4-7"     (default; fallback claude-opus-4-20250514 if unavailable)
 *
 * NOT committed to the seed corpus. Throwaway per the plan's cleanup commitments.
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Load .env.local before importing any code that reads process.env at module-init
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

// ─── Argv ─────────────────────────────────────────────────────────────────────

interface Args {
  topic: string;
  nodeId: string | undefined;
  n: number;
  difficulty: 'easy_recognition' | 'decision_fork' | 'hard_discrimination';
  judgeModel: string;
  reuseRuns: string[] | null;
}

function parseArgs(): Args {
  const get = (k: string) => process.argv.find((a) => a.startsWith(`${k}=`))?.split('=').slice(1).join('=');
  const difficultyAliases: Record<string, Args['difficulty']> = {
    easy: 'easy_recognition',
    easy_recognition: 'easy_recognition',
    fork: 'decision_fork',
    decision_fork: 'decision_fork',
    hard: 'hard_discrimination',
    hard_discrimination: 'hard_discrimination',
  };
  const reuseRunsRaw = get('--reuse-runs');
  return {
    topic: get('--topic') ?? 'Pulmonary Embolism',
    nodeId: get('--node-id'),
    n: Number(get('--n') ?? '4'),
    difficulty: difficultyAliases[get('--difficulty') ?? 'fork'] ?? 'decision_fork',
    judgeModel: get('--judge-model') ?? 'claude-opus-4-7',
    reuseRuns: reuseRunsRaw ? reuseRunsRaw.split(',').map((s) => s.trim()).filter(Boolean) : null,
  };
}

// ─── Judge output schema ──────────────────────────────────────────────────────

const judgeOutputSchema = z.object({
  winner_index: z.number().int().min(0),
  ranking: z.array(z.number().int().min(0)),
  rationale: z.string().min(50),
  hard_gate_concerns: z.array(z.object({
    candidate: z.number().int().min(0),
    gate: z.string(),
    why: z.string(),
  })),
  confidence_calibration: z.enum(['high', 'medium', 'low']),
  per_candidate_one_line: z.array(z.string()),
});
type JudgeOutput = z.infer<typeof judgeOutputSchema>;

// ─── Judge prompt ─────────────────────────────────────────────────────────────

const JUDGE_SYSTEM_PROMPT = `You are an experienced NBME item-writer reviewer evaluating candidate USMLE Step 2 CK questions on Pulmonary Embolism workup. Multiple candidates were generated from the same blueprint targeting the same transfer rule. Your job is to pick the single best candidate and rank the rest.

Your evaluation criteria is the Blackstar Master Rubric (10 weighted domains summing to 100, plus 8 hard gates). You will receive each candidate's existing rubric_score (computed by the project's rubric-evaluator agent) — your job is NOT to re-grade from scratch but to (a) sanity-check the scores against the actual item content, (b) make trade-off judgments the rubric can't see (which candidate would an NBME editor actually choose for the bank), and (c) flag any hard-gate concerns the rubric-evaluator may have missed.

The targeted transfer rule is: "D-dimer is only useful to EXCLUDE PE in LOW pre-test probability patients."
The targeted hinge: high Wells score (≥5) → skip D-dimer, go directly to CTPA.
The targeted cognitive-error distractor: wrong_algorithm_branch — ordering D-dimer when pretest probability is HIGH.
NBME trap from GOLD_CARD_PE: "Ordering D-dimer when pretest probability is HIGH (Wells ≥5)."

You must pick a winner even if all candidates are weak. Your rationale must reference SPECIFIC features of the candidates (not generic praise/criticism).

Hard gates (any fail → cannot publish):
1. medical_inaccuracy_or_unsafe
2. no_single_best_answer (multiple defensible options)
3. diagnosis_given_away (stem or explanation telegraphs the answer)
4. option_symmetry_broken (one option obviously weaker)
5. wrong_transfer_rule_taught (explanation teaches a different rule than the target)
6. out_of_shelf_scope
7. distractors_implausible (no plausible reason a competent test-taker would pick them)
8. missing_required_metadata

Weighted domains (out of 100): medical_correctness_scope (15), blueprint_alignment (8), nbme_stem_fidelity (12), hinge_design_ambiguity (10), option_set_quality_symmetry (12), key_integrity (5), explanation_quality (15), learner_modeling_value (8), adaptive_sequencing_utility (5), production_readiness (10).`;

function buildJudgeUserMessage(candidates: CandidateData[]): string {
  const sections: string[] = [];
  sections.push(`# ${candidates.length} candidate items for review`);
  sections.push('');
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    sections.push(`## CANDIDATE ${i}`);
    sections.push('');
    sections.push(`**runId:** ${c.runId}`);
    sections.push(`**itemDraftId:** ${c.itemDraftId ?? '(none — pipeline killed before item creation)'}`);
    sections.push(`**finalStatus:** ${c.finalStatus}`);
    sections.push(`**totalTokens:** ${c.totalTokens.toLocaleString()}`);
    sections.push('');
    if (!c.itemDraft) {
      sections.push('_No item content (pipeline failed before vignette write)._');
      sections.push('');
      continue;
    }
    sections.push('### Stem / vignette');
    sections.push('```');
    sections.push(c.itemDraft.vignette ?? '(no vignette)');
    sections.push('');
    sections.push(c.itemDraft.stem ?? '(no stem)');
    sections.push('```');
    sections.push('');
    sections.push('### Options');
    sections.push(`- A: ${c.itemDraft.choice_a}`);
    sections.push(`- B: ${c.itemDraft.choice_b}`);
    sections.push(`- C: ${c.itemDraft.choice_c}`);
    sections.push(`- D: ${c.itemDraft.choice_d}`);
    sections.push(`- E: ${c.itemDraft.choice_e}`);
    sections.push(`**Correct answer:** ${c.itemDraft.correct_answer}`);
    sections.push('');
    sections.push('### Explanation (key fields)');
    sections.push(`- why_correct: ${c.itemDraft.why_correct ?? '(none)'}`);
    sections.push(`- transfer_rule taught: ${c.itemDraft.explanation_transfer_rule ?? '(none)'}`);
    sections.push(`- decision_hinge: ${c.itemDraft.decision_hinge ?? '(none)'}`);
    for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
      const v = c.itemDraft[`why_wrong_${letter}` as keyof typeof c.itemDraft];
      if (v) sections.push(`- why_wrong_${letter.toUpperCase()}: ${v}`);
    }
    sections.push('');
    sections.push('### Master rubric score (from rubric-evaluator)');
    if (c.rubricScore) {
      sections.push(`- **total_score: ${c.rubricScore.total_score} / 100**`);
      sections.push(`- publish_decision: \`${c.rubricScore.publish_decision}\``);
      sections.push(`- hard_gate_pass: ${c.rubricScore.hard_gate_pass}`);
      if (c.rubricScore.hard_gate_fail_reasons?.length) {
        sections.push(`- hard_gate_fail_reasons: ${c.rubricScore.hard_gate_fail_reasons.join(', ')}`);
      }
      const so = c.rubricScore.score_object as Record<string, unknown> | null;
      if (so && so.scores) {
        const s = so.scores as Record<string, number>;
        sections.push('- domain scores:');
        for (const k of Object.keys(s)) {
          sections.push(`  - ${k}: ${s[k]}`);
        }
      }
    } else {
      sections.push('_No rubric_score row (pipeline killed at validator step — rubric_evaluator only runs when validators pass)._');
    }
    if (c.validatorReports.length > 0) {
      sections.push('');
      sections.push('### Validator reports (latest cycle)');
      for (const r of c.validatorReports) {
        const icon = r.passed ? '✅' : '❌';
        sections.push(`- ${icon} **${r.validator_type}** passed=${r.passed} score=${r.score ?? '—'}`);
        if (!r.passed && r.issues_found?.length) {
          for (const iss of r.issues_found.slice(0, 4)) {
            sections.push(`  - ${iss}`);
          }
        }
      }
    }
    sections.push('');
  }
  sections.push('---');
  sections.push('');
  sections.push('# Your task');
  sections.push('');
  sections.push('Pick the single best candidate by index (0..N-1), rank all candidates best-to-worst, and explain your choice. The rationale must reference SPECIFIC content of the candidates — quoting stem fragments or naming the cognitive-error each distractor targets is more useful than generic praise. Flag any hard-gate concerns the rubric-evaluator missed.');
  sections.push('');
  sections.push('Respond with a JSON object:');
  sections.push('```json');
  sections.push('{');
  sections.push('  "winner_index": 0,');
  sections.push('  "ranking": [0, 2, 1, 3],');
  sections.push('  "rationale": "...",');
  sections.push('  "hard_gate_concerns": [{"candidate": 1, "gate": "diagnosis_given_away", "why": "..."}],');
  sections.push('  "confidence_calibration": "medium",');
  sections.push('  "per_candidate_one_line": ["one-line verdict on each candidate, in order 0..N-1"]');
  sections.push('}');
  sections.push('```');
  return sections.join('\n');
}

// ─── Candidate data ───────────────────────────────────────────────────────────

interface CandidateData {
  runId: string;
  itemDraftId: string | null;
  finalStatus: string;
  totalTokens: number;
  itemDraft: Record<string, string | null> | null;
  rubricScore: {
    total_score: number;
    publish_decision: string;
    hard_gate_pass: boolean;
    hard_gate_fail_reasons: string[] | null;
    score_object: unknown;
  } | null;
  validatorReports: Array<{
    validator_type: string;
    passed: boolean;
    score: number | null;
    issues_found: string[] | null;
  }>;
  error: string | null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (process.env.BLACKSTAR_N1_OVERRIDE !== '1') {
    console.error('  ✗ Set BLACKSTAR_N1_OVERRIDE=1 before running. The override');
    console.error('    activates the di-loader fallback that injects pilot/n1-experiment/refs.md.');
    process.exit(1);
  }

  const args = parseArgs();
  if (args.n < 2 || args.n > 8) {
    console.error(`  ✗ --n must be in [2,8] (got ${args.n}).`);
    process.exit(1);
  }

  const { runPipelineV2 } = await import('../src/lib/factory/pipeline-v2');
  const { createClient } = await import('@supabase/supabase-js');
  const { callClaude } = await import('../src/lib/factory/claude');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── Resolve blueprint node ──────────────────────────────────────────────────
  let blueprintNodeId = args.nodeId;
  if (!blueprintNodeId) {
    const { data, error } = await supabase
      .from('blueprint_node')
      .select('id, topic, system, shelf')
      .eq('topic', args.topic)
      .limit(1)
      .single();
    if (error || !data) {
      console.error(`  ✗ No blueprint_node found for topic="${args.topic}" — ${error?.message ?? 'no rows'}`);
      console.error('    Pass --node-id=<uuid> or pick a different --topic.');
      process.exit(1);
    }
    blueprintNodeId = data.id;
    console.log(`  Resolved blueprint_node: ${data.id} (topic=${data.topic} shelf=${data.shelf})`);
  } else {
    console.log(`  Using explicit blueprint_node: ${blueprintNodeId}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  if (args.reuseRuns) {
    console.log('  PHASE B — REUSE MODE (judge only, no new pipelines)');
    console.log('  Reusing runIds:  [' + args.reuseRuns.join(', ') + ']');
  } else {
    console.log('  PHASE B — N=' + args.n + ' BEST-OF-N + CROSS-FAMILY JUDGE');
  }
  console.log('  Override:        BLACKSTAR_N1_OVERRIDE=1');
  console.log('  Topic:           ' + args.topic);
  console.log('  Difficulty hint: ' + args.difficulty);
  console.log('  Judge model:     ' + args.judgeModel);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // ── Step 1: Fire N pipeline runs in parallel (or reuse) ─────────────────────
  const t0 = Date.now();
  const candidates: CandidateData[] = [];
  type RunResultLike = { runId: string; itemDraftId: string | null; finalStatus: string; totalTokens: number };

  let runResults: Array<{ status: 'fulfilled' | 'rejected'; value?: RunResultLike; reason?: { message?: string } }>;
  if (args.reuseRuns) {
    console.log(`  → Reusing ${args.reuseRuns.length} existing pipeline runs (no new pipelines)…`);
    runResults = await Promise.all(
      args.reuseRuns.map(async (runId) => {
        const { data: run } = await supabase
          .from('pipeline_run')
          .select('id, status, total_tokens_used')
          .eq('id', runId)
          .single();
        const { data: drafts } = await supabase
          .from('item_draft')
          .select('id, status')
          .eq('pipeline_run_id', runId)
          .order('created_at', { ascending: false })
          .limit(1);
        const draft = drafts?.[0];
        const itemDraftId = draft?.id ?? null;
        const finalStatus = draft ? (draft.status as string) : (run?.status as string ?? 'unknown');
        return {
          status: 'fulfilled' as const,
          value: {
            runId,
            itemDraftId,
            finalStatus,
            totalTokens: run?.total_tokens_used ?? 0,
          },
        };
      })
    );
  } else {
    console.log(`  → Firing ${args.n} pipeline runs in parallel…`);
    runResults = await Promise.allSettled(
      Array.from({ length: args.n }, (_, i) =>
        runPipelineV2({
          blueprintNodeId,
          shelf: 'medicine',
          difficultyClassHint: args.difficulty,
        }).then((result) => {
          console.log(`    [${i}] runId=${result.runId} status=${result.finalStatus} tokens=${result.totalTokens.toLocaleString()}`);
          return { runId: result.runId, itemDraftId: result.itemDraftId ?? null, finalStatus: result.finalStatus, totalTokens: result.totalTokens };
        }).catch((err) => {
          console.error(`    [${i}] FAILED: ${err.message}`);
          throw err;
        })
      )
    );
  }

  const runElapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  ✓ ${runResults.length} candidates resolved in ${runElapsedSec}s`);
  console.log('');

  // ── Step 2: Hydrate each candidate from DB ──────────────────────────────────
  for (let i = 0; i < runResults.length; i++) {
    const settled = runResults[i];
    if (settled.status === 'rejected') {
      candidates.push({
        runId: '(failed before run start)',
        itemDraftId: null,
        finalStatus: 'errored',
        totalTokens: 0,
        itemDraft: null,
        rubricScore: null,
        validatorReports: [],
        error: String(settled.reason?.message ?? settled.reason),
      });
      continue;
    }
    const result = settled.value!;

    let itemDraft: Record<string, string | null> | null = null;
    let rubricScore: CandidateData['rubricScore'] = null;
    let validatorReports: CandidateData['validatorReports'] = [];

    if (result.itemDraftId) {
      const { data: draft } = await supabase
        .from('item_draft')
        .select('*')
        .eq('id', result.itemDraftId)
        .single();
      itemDraft = (draft ?? null) as Record<string, string | null> | null;

      const { data: rs } = await supabase
        .from('rubric_score')
        .select('total_score, publish_decision, hard_gate_pass, hard_gate_fail_reasons, score_object')
        .eq('item_draft_id', result.itemDraftId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (rs) rubricScore = rs as unknown as CandidateData['rubricScore'];

      // Fetch latest validator_report per validator_type for this draft
      const { data: reports } = await supabase
        .from('validator_report')
        .select('validator_type, passed, score, issues_found, created_at')
        .eq('item_draft_id', result.itemDraftId)
        .order('created_at', { ascending: false });
      const seen = new Set<string>();
      for (const r of (reports ?? []) as Array<{ validator_type: string; passed: boolean; score: number | null; issues_found: string[] | null }>) {
        if (seen.has(r.validator_type)) continue;
        seen.add(r.validator_type);
        validatorReports.push({
          validator_type: r.validator_type,
          passed: r.passed,
          score: r.score,
          issues_found: r.issues_found,
        });
      }
    }

    candidates.push({
      runId: result.runId,
      itemDraftId: result.itemDraftId ?? null,
      finalStatus: result.finalStatus,
      totalTokens: result.totalTokens,
      itemDraft,
      rubricScore,
      validatorReports,
      error: null,
    });
  }

  const scorable = candidates.filter((c) => c.itemDraft);
  console.log(`  ${scorable.length}/${candidates.length} candidates have an item_draft (judgeable).`);

  if (scorable.length === 0) {
    console.error('  ✗ No candidates produced a scorable item. Aborting before judge call.');
    await writeResultMarkdown(candidates, null, args, runElapsedSec, 0);
    process.exit(1);
  }

  // ── Step 3: Call the cross-family judge ─────────────────────────────────────
  console.log(`  → Calling judge (${args.judgeModel}) over ${candidates.length} candidates…`);
  const judgeT0 = Date.now();
  let judgeOutput: JudgeOutput;
  let judgeTokens = 0;
  try {
    const result = await callClaude({
      systemPrompt: JUDGE_SYSTEM_PROMPT,
      userMessage: buildJudgeUserMessage(candidates),
      outputSchema: judgeOutputSchema,
      model: args.judgeModel,
      maxTokens: 4096,
    });
    judgeOutput = result.data;
    judgeTokens = result.tokensUsed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Judge call failed with model=${args.judgeModel}: ${msg}`);
    console.error('  → Retrying with fallback model claude-opus-4-20250514…');
    try {
      const result = await callClaude({
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        userMessage: buildJudgeUserMessage(candidates),
        outputSchema: judgeOutputSchema,
        model: 'claude-opus-4-20250514',
        maxTokens: 4096,
      });
      judgeOutput = result.data;
      judgeTokens = result.tokensUsed;
    } catch (err2) {
      const msg2 = err2 instanceof Error ? err2.message : String(err2);
      console.error(`  ✗ Fallback judge call also failed: ${msg2}`);
      await writeResultMarkdown(candidates, null, args, runElapsedSec, 0);
      process.exit(1);
    }
  }
  const judgeElapsedSec = ((Date.now() - judgeT0) / 1000).toFixed(1);
  console.log(`  ✓ Judge complete in ${judgeElapsedSec}s, tokens=${judgeTokens.toLocaleString()}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('  WINNER:                  candidate ' + judgeOutput.winner_index);
  console.log('  Ranking (best→worst):    [' + judgeOutput.ranking.join(', ') + ']');
  console.log('  Confidence:              ' + judgeOutput.confidence_calibration);
  console.log('  Hard-gate concerns:      ' + judgeOutput.hard_gate_concerns.length);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  await writeResultMarkdown(candidates, judgeOutput, args, runElapsedSec, judgeTokens);

  // Print the winning item_draft_id so it can be piped into the adversarial-student script
  const winner = candidates[judgeOutput.winner_index];
  if (winner?.itemDraftId) {
    console.log('  Winning itemDraftId: ' + winner.itemDraftId);
    console.log('');
    console.log('  Next: npx tsx scripts/n1-adversarial-student.ts --item-draft-id=' + winner.itemDraftId);
    console.log('');
  }
}

// ─── Result markdown writer ───────────────────────────────────────────────────

async function writeResultMarkdown(
  candidates: CandidateData[],
  judge: JudgeOutput | null,
  args: Args,
  pipelineElapsedSec: string,
  judgeTokens: number,
): Promise<void> {
  const totalPipelineTokens = candidates.reduce((s, c) => s + c.totalTokens, 0);
  const outPath = path.resolve(__dirname, '../pilot/n1-experiment/PHASE_B_RESULT.md');

  const lines: string[] = [];
  lines.push('# Phase B Result — best-of-N + cross-family judge');
  lines.push('');
  lines.push('> Generated by `scripts/n1-best-of-n.ts`. Plan: `~/.claude/plans/you-re-right-to-push-spicy-cookie.md`.');
  lines.push('> Phase A scaffolding: `pilot/n1-experiment/CHOICE.md`, `STAGING.md`, `RESULT.md`, `refs.md`.');
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push(`- Transfer rule: **D-dimer is only useful to EXCLUDE PE in LOW pre-test probability patients**`);
  lines.push(`- Topic: ${args.topic}`);
  lines.push(`- Difficulty hint: ${args.difficulty}`);
  lines.push(`- N candidates: ${args.n}`);
  lines.push(`- Generator: existing vignette-writer agent (Sonnet 4) via runPipelineV2`);
  lines.push(`- Judge: ${args.judgeModel}`);
  lines.push(`- Override: \`BLACKSTAR_N1_OVERRIDE=1\` (di-loader injects \`pilot/n1-experiment/refs.md\`)`);
  lines.push('');
  lines.push('## Cost / time');
  lines.push('');
  lines.push(`- Pipeline runs total tokens: ${totalPipelineTokens.toLocaleString()}`);
  lines.push(`- Pipeline runs wall-clock: ${pipelineElapsedSec}s (parallel)`);
  lines.push(`- Judge tokens: ${judgeTokens.toLocaleString()}`);
  lines.push('');
  lines.push('## Candidates');
  lines.push('');
  lines.push('| # | runId | itemDraftId | finalStatus | rubric total | publish_decision | tokens |');
  lines.push('|---|-------|-------------|-------------|--------------|------------------|--------|');
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    lines.push(`| ${i} | \`${c.runId}\` | \`${c.itemDraftId ?? '—'}\` | ${c.finalStatus} | ${c.rubricScore?.total_score ?? '—'} | ${c.rubricScore?.publish_decision ?? '—'} | ${c.totalTokens.toLocaleString()} |`);
  }
  lines.push('');

  if (judge) {
    lines.push('## Judge verdict');
    lines.push('');
    lines.push(`- **Winner:** candidate ${judge.winner_index}`);
    lines.push(`- **Ranking (best → worst):** [${judge.ranking.join(', ')}]`);
    lines.push(`- **Confidence calibration:** \`${judge.confidence_calibration}\``);
    lines.push('');
    lines.push('### Per-candidate one-liners');
    lines.push('');
    for (let i = 0; i < judge.per_candidate_one_line.length; i++) {
      lines.push(`- **${i}:** ${judge.per_candidate_one_line[i]}`);
    }
    lines.push('');
    lines.push('### Rationale');
    lines.push('');
    lines.push(judge.rationale);
    lines.push('');
    if (judge.hard_gate_concerns.length > 0) {
      lines.push('### Hard-gate concerns flagged by judge');
      lines.push('');
      for (const c of judge.hard_gate_concerns) {
        lines.push(`- candidate ${c.candidate} / gate \`${c.gate}\`: ${c.why}`);
      }
      lines.push('');
    }
  } else {
    lines.push('## Judge verdict');
    lines.push('');
    lines.push('_(Judge call failed — see console for details.)_');
    lines.push('');
  }

  lines.push('## Winning candidate (full content)');
  lines.push('');
  if (judge) {
    const winner = candidates[judge.winner_index];
    if (winner.itemDraft) {
      lines.push('### Stem / vignette');
      lines.push('```');
      lines.push(String(winner.itemDraft.vignette ?? ''));
      lines.push('');
      lines.push(String(winner.itemDraft.stem ?? ''));
      lines.push('```');
      lines.push('');
      lines.push('### Options');
      lines.push(`- A: ${winner.itemDraft.choice_a}`);
      lines.push(`- B: ${winner.itemDraft.choice_b}`);
      lines.push(`- C: ${winner.itemDraft.choice_c}`);
      lines.push(`- D: ${winner.itemDraft.choice_d}`);
      lines.push(`- E: ${winner.itemDraft.choice_e}`);
      lines.push(`- **Correct answer:** ${winner.itemDraft.correct_answer}`);
      lines.push('');
      lines.push('### Explanation');
      lines.push(`- why_correct: ${winner.itemDraft.why_correct ?? '(none)'}`);
      lines.push(`- transfer_rule taught: ${winner.itemDraft.explanation_transfer_rule ?? '(none)'}`);
      lines.push(`- decision_hinge: ${winner.itemDraft.decision_hinge ?? '(none)'}`);
      for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
        const v = winner.itemDraft[`why_wrong_${letter}`];
        if (v) lines.push(`- why_wrong_${letter.toUpperCase()}: ${v}`);
      }
    } else {
      lines.push('_(Winning candidate has no item_draft — pipeline failed before write.)_');
    }
  }
  lines.push('');
  lines.push('## Adversarial-student test results');
  lines.push('');
  lines.push('_To be populated by `scripts/n1-adversarial-student.ts`._');
  lines.push('');
  lines.push('## Phase A baseline (for comparison)');
  lines.push('');
  lines.push('_See `pilot/n1-experiment/RESULT.md` Cycle 1 fields. After Phase A is run, manually copy the rubric total + publish_decision here for side-by-side comparison._');
  lines.push('');
  lines.push('## 7-point hand audit (per pilot/04-audit-protocol.md)');
  lines.push('');
  lines.push('_To be filled in by the user on the winning candidate._');
  lines.push('');
  lines.push('| Point | Phase A baseline | Phase B winner |');
  lines.push('|---|---|---|');
  lines.push('| 1. Stem NBME compliance | [ ] | [ ] |');
  lines.push('| 2. Lead-in form | [ ] | [ ] |');
  lines.push('| 3. Option plausibility | [ ] | [ ] |');
  lines.push('| 4. Correct answer not longest | [ ] | [ ] |');
  lines.push('| 5. Confusion-set distractor present | [ ] | [ ] |');
  lines.push('| 6. Explanation quality | [ ] | [ ] |');
  lines.push('| 7. No medical errors | [ ] | [ ] |');
  lines.push('');
  lines.push('## Decision');
  lines.push('');
  lines.push('Phase B passes iff **all three**:');
  lines.push('1. [ ] Phase B winner master rubric total > Phase A baseline rubric total');
  lines.push('2. [ ] Phase B winner passes adversarial-student validation (smart correct, weak in intended distractor, hinge-dependent)');
  lines.push('3. [ ] Phase B winner passes 7/7 hand audit');
  lines.push('');
  lines.push('If pass → write Phase C proposal (extend to Sepsis, ACS, AKI, GI Bleed).');
  lines.push('If fail → diagnose which gear failed.');
  lines.push('');

  fs.writeFileSync(outPath, lines.join('\n') + '\n');
  console.log('  ✓ Wrote ' + outPath);
}

main().catch((err) => {
  console.error('  ✗ Fatal:', err);
  process.exit(1);
});
