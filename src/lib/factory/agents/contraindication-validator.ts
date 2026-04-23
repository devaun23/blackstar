import { createAdminClient } from '@/lib/supabase/admin';
import {
  contraindicationReportSchema,
  type ContraindicationReportInput,
} from '@/lib/factory/schemas/contraindication-report';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow } from '@/lib/types/database';
import {
  contraindicationSeeds,
  type ContraindicationSeed,
} from '@/lib/factory/seeds/contraindications';
import { runAgent } from '../agent-helpers';
import { z } from 'zod';

interface ContraindicationValidatorInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
  model?: string;
}

// ─── Token-set alias matching ───
// Lowercase + strip punctuation, split into tokens, require ALL alias tokens
// present in the keyed answer (order-independent). Intentionally permissive on
// the keyed-answer side, strict on the alias side — so "Administer alteplase
// 100 mg IV over 2 hours" matches the alias "alteplase" but the alias "tpa"
// won't accidentally match "carbapenem" via the "pa" substring.

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'to', 'for', 'with', 'in', 'on']);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0 && !STOPWORDS.has(t)),
  );
}

function aliasMatches(alias: string, keyedAnswer: string): boolean {
  const aliasTokens = tokenize(alias);
  if (aliasTokens.size === 0) return false;
  const keyedTokens = tokenize(keyedAnswer);
  for (const t of aliasTokens) {
    if (!keyedTokens.has(t)) return false;
  }
  return true;
}

export function findMatchingInterventions(keyedAnswer: string): ContraindicationSeed[] {
  const matches: ContraindicationSeed[] = [];
  for (const entry of contraindicationSeeds) {
    for (const alias of entry.aliases) {
      if (aliasMatches(alias, keyedAnswer)) {
        matches.push(entry);
        break;
      }
    }
  }
  return matches;
}

// ─── Pharmacology-class fallback ───
// Fires only when zero registry entries match. Asks a narrow question: does the
// keyed answer describe a drug/procedure/management step at all? If yes, we
// can't silently pass — we don't have severity info to route, so we escalate
// to needs_human_review. If no (e.g. "Reassure and observe"), CCV is N/A.

const pharmClassSchema = z.object({
  is_intervention: z.boolean(),
  intervention_kind: z.enum(['drug', 'procedure', 'management_step', 'none']),
  rationale: z.string(),
});

async function scanPharmacologyClass(
  keyedAnswerText: string,
  context: AgentContext,
): Promise<z.infer<typeof pharmClassSchema>> {
  // Use the vignette_writer's Claude config via runAgent would require a prompt
  // row for a new agent type, which is overkill for this narrow check. We call
  // Claude directly with a minimal inline prompt.
  const { callClaude } = await import('../claude');
  const { data } = await callClaude({
    systemPrompt:
      'You classify answer choices in medical board questions. You answer only the structural question asked — you do not judge correctness.',
    userMessage: `Classify this keyed answer:\n\n"${keyedAnswerText}"\n\nReturn JSON:\n{\n  "is_intervention": <true if the answer describes administering a drug, performing a procedure, or initiating a management step; false if it is observation, reassurance, counseling, or a diagnostic test>,\n  "intervention_kind": "drug" | "procedure" | "management_step" | "none",\n  "rationale": "<one sentence>"\n}`,
    outputSchema: pharmClassSchema,
    maxTokens: 200,
  });
  return data;
  void context; // currently unused; reserved for mock-mode parity with other agents
}

// ─── Main run function ───
// Invariants:
//   - Fail-closed: any thrown error or Claude failure returns passed=false +
//     trigger_found='unknown' so the pipeline routes to human review.
//   - No silent pass: if no alias match AND pharmacology-class scan says this
//     IS an intervention, we emit trigger_found='unknown' (routes to human
//     review), never 'no'.
//   - Blind to explanations: we do NOT pass why_correct, reasoning_pathway,
//     why_wrong_*, high_yield_pearl into the prompt.

function optionLetterForCorrect(draft: ItemDraftRow): 'A' | 'B' | 'C' | 'D' | 'E' {
  return draft.correct_answer;
}

function textForCorrectOption(draft: ItemDraftRow): string {
  const letter = draft.correct_answer.toLowerCase();
  const choiceKey = `choice_${letter}` as 'choice_a' | 'choice_b' | 'choice_c' | 'choice_d' | 'choice_e';
  return draft[choiceKey];
}

function buildFailClosedReport(
  draft: ItemDraftRow,
  issue: string,
): ContraindicationReportInput {
  return {
    passed: false,
    score: 0,
    issues_found: [issue],
    repair_instructions: null,
    failure_category: null,
    trigger_found: 'unknown',
    matched_intervention_id: null,
    keyed_answer_option: optionLetterForCorrect(draft),
    triggers: [],
  };
}

async function insertReport(
  itemDraftId: string,
  report: ContraindicationReportInput,
): Promise<{ reportId: string | null; error: string | null }> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {
    item_draft_id: itemDraftId,
    validator_type: 'contraindication',
    passed: report.passed,
    score: report.score,
    issues_found: report.issues_found,
    repair_instructions: report.repair_instructions ?? null,
    raw_output: report as unknown as Record<string, unknown>,
  };
  const { data, error } = await supabase
    .from('validator_report')
    .insert(payload)
    .select('id')
    .single();
  if (error || !data) return { reportId: null, error: error?.message ?? 'insert failed' };
  return { reportId: data.id, error: null };
}

export async function run(
  context: AgentContext,
  input: ContraindicationValidatorInput,
): Promise<AgentOutput<ContraindicationReportInput & { reportId: string }>> {
  const { draft, card, model } = input;
  const keyedText = textForCorrectOption(draft);

  try {
    const matchedEntries = findMatchingInterventions(keyedText);

    // ── No registry match ──
    if (matchedEntries.length === 0) {
      // Fallback: is this even an intervention? If yes, escalate; if no, pass.
      let isIntervention = false;
      try {
        const pharm = await scanPharmacologyClass(keyedText, context);
        isIntervention = pharm.is_intervention;
      } catch {
        // If the fallback Claude call itself fails, fail-closed.
        isIntervention = true;
      }

      if (!isIntervention) {
        // Keyed answer is "observe", "reassure", "counsel", etc. CCV N/A.
        const passReport: ContraindicationReportInput = {
          passed: true,
          score: 10,
          issues_found: [],
          repair_instructions: null,
          failure_category: null,
          trigger_found: 'no',
          matched_intervention_id: null,
          keyed_answer_option: optionLetterForCorrect(draft),
          triggers: [],
        };
        const { reportId } = await insertReport(draft.id, passReport);
        return {
          success: true,
          data: { ...passReport, reportId: reportId ?? 'ccv-pass-na' },
          tokensUsed: 0,
        };
      }

      // Intervention but no registry entry → route to human review.
      const unknownReport: ContraindicationReportInput = {
        passed: false,
        score: 5,
        issues_found: [
          `Keyed answer "${keyedText}" describes an intervention but has no matching registry entry. Cannot route deterministically — human review required.`,
        ],
        repair_instructions: null,
        failure_category: null,
        trigger_found: 'unknown',
        matched_intervention_id: null,
        keyed_answer_option: optionLetterForCorrect(draft),
        triggers: [],
      };
      const { reportId } = await insertReport(draft.id, unknownReport);
      return {
        success: true,
        data: { ...unknownReport, reportId: reportId ?? 'ccv-unknown' },
        tokensUsed: 0,
      };
    }

    // ── Registry match — invoke blind auditor via runAgent ──
    const registrySlice = matchedEntries.map((e) => ({
      intervention_id: e.intervention_id,
      display_name: e.display_name,
      absolute_contraindications: e.absolute_contraindications,
      relative_contraindications: e.relative_contraindications,
    }));

    const result = await runAgent({
      agentType: 'contraindication_validator',
      context,
      input: {
        vignette: draft.vignette,
        stem: draft.stem,
        keyed_answer_text: keyedText,
        keyed_answer_option: draft.correct_answer,
        card_contraindications: card.contraindications ?? [],
        registry_slice: registrySlice,
      },
      outputSchema: contraindicationReportSchema,
      buildUserMessage: (vars) => ({
        vignette: vars.vignette,
        stem: vars.stem,
        keyed_answer_text: vars.keyed_answer_text,
        keyed_answer_option: vars.keyed_answer_option,
        card_contraindications: JSON.stringify(vars.card_contraindications, null, 2),
        registry: JSON.stringify(vars.registry_slice, null, 2),
      }),
      ...(model ? { model } : {}),
    });

    if (!result.success) {
      const failClosed = buildFailClosedReport(
        draft,
        `CCV Claude call failed: ${result.error ?? 'unknown error'}. Fail-closed to needs_human_review.`,
      );
      const { reportId } = await insertReport(draft.id, failClosed);
      return {
        success: true,
        data: { ...failClosed, reportId: reportId ?? 'ccv-fail-closed' },
        tokensUsed: result.tokensUsed,
      };
    }

    const report = result.data;
    const { reportId } = await insertReport(draft.id, report);
    return {
      success: true,
      data: { ...report, reportId: reportId ?? 'ccv-inserted' },
      tokensUsed: result.tokensUsed,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failClosed = buildFailClosedReport(draft, `CCV threw: ${message}. Fail-closed to needs_human_review.`);
    const { reportId } = await insertReport(draft.id, failClosed);
    return {
      success: true,
      data: { ...failClosed, reportId: reportId ?? 'ccv-exception' },
      tokensUsed: 0,
    };
  }
}
