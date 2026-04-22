import { createAdminClient } from '@/lib/supabase/admin';
import type { ValidatorReportInput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow, CasePlanRow } from '@/lib/types/database';
import { runValidator } from './validator-base';

interface ExplanationValidatorInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
}

// Rule 10 — question_writer_intent must fit "prioritize X over Y when Z" template
const writerIntentRegex = /\bpriorit(?:y|ize|izes|izing|ized)\b.+\bover\b.+\bwhen\b/i;

/**
 * v22 — deterministic pre-checks for explanation depth. Produces a list of
 * concrete, board-prep-critical issues. These run before the LLM judge so
 * missing shape is caught cheaply and shows up verbatim in the validator_report.
 */
async function runDepthChecks(draft: ItemDraftRow): Promise<string[]> {
  const issues: string[] = [];
  const mdd = draft.medicine_deep_dive;

  // Check 1: medicine_deep_dive_complete
  if (!mdd) {
    issues.push('medicine_deep_dive missing — shelf prep requires full teaching layer');
  } else {
    const minLens = {
      pathophysiology: 80,
      diagnostic_criteria: 40,
      management_algorithm: 120,
      monitoring_and_complications: 40,
      high_yield_associations: 20,
    } as const;
    for (const [field, min] of Object.entries(minLens)) {
      const value = mdd[field as keyof typeof minLens] ?? '';
      if (value.length < min) {
        issues.push(
          `medicine_deep_dive.${field} below threshold (${value.length} < ${min} chars) — shelf prep requires full teaching`
        );
      }
    }
  }

  // Check 2: comparison_table_when_confusion_set
  if (draft.case_plan_id) {
    const supabase = createAdminClient();
    const { data: casePlan } = await supabase
      .from('case_plan')
      .select('target_confusion_set_id')
      .eq('id', draft.case_plan_id)
      .single();
    const targetCsId = (casePlan as { target_confusion_set_id?: string | null } | null)
      ?.target_confusion_set_id;
    if (targetCsId) {
      const ct = draft.comparison_table;
      if (!ct) {
        issues.push('confusion set targeted but no discriminating comparison table provided');
      } else {
        const rows = ct.rows ?? [];
        if (rows.length < 5) {
          issues.push(`comparison_table has only ${rows.length} rows (min 5 discriminating features required)`);
        }
        const nonDiscriminating = rows.filter(
          (r) => (r.condition_a_value ?? '').trim() === (r.condition_b_value ?? '').trim()
        );
        if (nonDiscriminating.length > 0) {
          issues.push(
            `comparison_table has ${nonDiscriminating.length} non-discriminating row(s) — both columns identical`
          );
        }
      }
    }
  }

  // Check 4: no_invented_pharmacology (shape sanity — drug/mechanism/side-effects present)
  if (draft.pharmacology_notes) {
    for (const [i, entry] of draft.pharmacology_notes.entries()) {
      if (!entry.drug || entry.drug.trim() === '') {
        issues.push(`pharmacology_notes[${i}] missing drug name`);
      }
      if (!entry.mechanism || entry.mechanism.length < 20) {
        issues.push(`pharmacology_notes[${i}] (${entry.drug}) mechanism too short`);
      }
      if (!entry.major_side_effects || entry.major_side_effects.length < 2) {
        issues.push(`pharmacology_notes[${i}] (${entry.drug}) needs ≥2 major_side_effects`);
      }
    }
  }

  // Rule 4 (R-EXP-03) — down_to_two_discrimination presence and quality
  const d2t = draft.down_to_two_discrimination;
  if (!d2t) {
    issues.push('R-EXP-03: down_to_two_discrimination missing — Rule 4 requires this on every item');
  } else {
    if (!d2t.tipping_detail || d2t.tipping_detail.length < 10) {
      issues.push(`R-EXP-03: down_to_two_discrimination.tipping_detail too short (${d2t.tipping_detail?.length ?? 0} chars, min 10)`);
    }
    if (!d2t.counterfactual || d2t.counterfactual.length < 20) {
      issues.push(`R-EXP-03: down_to_two_discrimination.counterfactual too short (${d2t.counterfactual?.length ?? 0} chars, min 20)`);
    }
  }

  // Rule 10 (R-EXP-04) — question_writer_intent presence and template shape
  const intent = draft.question_writer_intent;
  if (!intent) {
    issues.push('R-EXP-04: question_writer_intent missing — Rule 10 requires this on every item');
  } else if (intent.length < 20 || intent.length > 200) {
    issues.push(`R-EXP-04: question_writer_intent length ${intent.length} outside 20-200 char range`);
  } else if (!writerIntentRegex.test(intent)) {
    issues.push(
      `R-EXP-04: question_writer_intent does not match template "This question tests whether you prioritize X over Y when Z"`
    );
  }

  // Rule 2 — easy_recognition_check required only when case_plan.difficulty_class === 'easy_recognition'
  if (draft.case_plan_id) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('case_plan')
      .select('difficulty_class')
      .eq('id', draft.case_plan_id)
      .single();
    const difficultyClass = (data as Pick<CasePlanRow, 'difficulty_class'> | null)?.difficulty_class;
    if (difficultyClass === 'easy_recognition' && !draft.easy_recognition_check) {
      issues.push(
        'Rule 2: easy_recognition_check missing — required when case_plan.difficulty_class = easy_recognition'
      );
    }
    if (difficultyClass !== 'easy_recognition' && draft.easy_recognition_check) {
      issues.push(
        `Rule 2: easy_recognition_check set but difficulty_class='${difficultyClass}' (expected null)`
      );
    }
  }

  return issues;
}

/**
 * Validates explanation quality. When v2 5-component fields are present
 * (explanation_decision_logic, explanation_error_diagnosis, etc.),
 * includes them in the validation context for completeness checking.
 *
 * v22: runs deterministic depth checks first. Their issues are merged into
 * the final report regardless of the LLM judge's verdict.
 */
export async function run(
  context: AgentContext,
  input: ExplanationValidatorInput
): Promise<AgentOutput<ValidatorReportInput & { reportId: string }>> {
  const depthIssues = await runDepthChecks(input.draft);

  const result = await runValidator({
    agentType: 'explanation_validator',
    validatorType: 'explanation_quality',
    context,
    itemDraftId: input.draft.id,
    buildTemplateVars: () => {
      const vars: Record<string, string> = {
        item_draft: JSON.stringify(input.draft, null, 2),
        algorithm_card: JSON.stringify(input.card, null, 2),
      };
      // Include v2 structured explanation fields if present
      const hasStructuredExplanation = input.draft.explanation_decision_logic
        || input.draft.explanation_error_diagnosis
        || input.draft.explanation_transfer_rule
        || input.draft.explanation_teaching_pearl;
      if (hasStructuredExplanation) {
        vars.structured_explanation = JSON.stringify({
          decision_logic: input.draft.explanation_decision_logic,
          hinge_id: input.draft.explanation_hinge_id,
          error_diagnosis: input.draft.explanation_error_diagnosis,
          transfer_rule: input.draft.explanation_transfer_rule,
          teaching_pearl: input.draft.explanation_teaching_pearl,
        }, null, 2);
      }
      return vars;
    },
  });

  // Merge deterministic depth issues — they always make it to the report
  if (result.success && depthIssues.length > 0) {
    result.data.issues_found = [
      ...new Set([...result.data.issues_found, ...depthIssues]),
    ];
    result.data.passed = result.data.passed && depthIssues.length === 0;
  }

  return result;
}
