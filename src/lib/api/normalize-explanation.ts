import type { RichExplanation, PerOptionExplanation } from '@/lib/types/explanation';
import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

// ─── Item Draft normalization ───

interface ItemDraftFields {
  correct_answer: string;
  choice_a?: string; option_a?: string;
  choice_b?: string; option_b?: string;
  choice_c?: string; option_c?: string;
  choice_d?: string; option_d?: string;
  choice_e?: string; option_e?: string;
  why_correct: string;
  why_wrong_a?: string | null;
  why_wrong_b?: string | null;
  why_wrong_c?: string | null;
  why_wrong_d?: string | null;
  why_wrong_e?: string | null;
  reasoning_pathway?: string | null;
  decision_hinge?: string | null;
  competing_differential?: string | null;
  high_yield_pearl?: string | null;
  visual_specs?: VisualSpec[] | null;
  explanation_decision_logic?: string | null;
  explanation_error_diagnosis?: Record<string, unknown> | null;
  explanation_transfer_rule?: string | null;
  explanation_teaching_pearl?: string | null;
}

interface ErrorTaxonomyRow {
  id: string;
  error_name: string;
  explanation_template: string;
}

interface NormalizeDraftOptions {
  draft: ItemDraftFields;
  transferRuleText?: string | null;
  errorMap?: Record<string, { error_id: string; error_name: string; meaning: string }>;
  errorTaxonomyRows?: ErrorTaxonomyRow[];
}

function getOptionText(draft: ItemDraftFields, letter: string): string {
  const key = letter.toLowerCase();
  return (draft as Record<string, unknown>)[`choice_${key}`] as string
    ?? (draft as Record<string, unknown>)[`option_${key}`] as string
    ?? '';
}

function getWhyWrong(draft: ItemDraftFields, letter: string): string | null {
  const key = `why_wrong_${letter.toLowerCase()}` as keyof ItemDraftFields;
  return (draft[key] as string | null | undefined) ?? null;
}

function hydrateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  // Strip any remaining unfilled placeholders
  return result.replace(/\{\{[^}]+\}\}/g, '___');
}

export function normalizeItemDraftExplanation({
  draft,
  transferRuleText,
  errorMap,
  errorTaxonomyRows,
}: NormalizeDraftOptions): RichExplanation {
  // Build per-option breakdown
  const options: PerOptionExplanation[] = LETTERS.map((letter) => {
    const isCorrect = letter === draft.correct_answer;
    const errorEntry = errorMap?.[letter];
    return {
      letter,
      optionText: getOptionText(draft, letter),
      whyWrong: isCorrect ? null : getWhyWrong(draft, letter),
      whyCorrect: isCorrect ? draft.why_correct : null,
      cognitiveError: errorEntry?.error_name ?? null,
    };
  });

  // Parse explanation_error_diagnosis into typed shape
  let errorDiagnosis: Record<string, { error_name: string; explanation: string }> | null = null;
  if (draft.explanation_error_diagnosis) {
    errorDiagnosis = {};
    for (const [key, val] of Object.entries(draft.explanation_error_diagnosis)) {
      if (val && typeof val === 'object' && 'error_name' in val) {
        const v = val as { error_name: string; explanation?: string };
        errorDiagnosis[key] = {
          error_name: v.error_name,
          explanation: v.explanation ?? '',
        };
      }
    }
    if (Object.keys(errorDiagnosis).length === 0) errorDiagnosis = null;
  }

  // Hydrate error template if we have taxonomy rows and a diagnosed error
  let errorTemplate: string | null = null;
  if (errorTaxonomyRows && errorMap) {
    // Find the first diagnosed error with a template
    for (const entry of Object.values(errorMap)) {
      const row = errorTaxonomyRows.find((r) => r.error_name === entry.error_name);
      if (row?.explanation_template) {
        errorTemplate = hydrateTemplate(row.explanation_template, {
          wrong_answer: entry.meaning || 'the selected answer',
          correct_answer: getOptionText(draft, draft.correct_answer),
        });
        break;
      }
    }
  }

  return {
    whyCorrect: draft.why_correct,
    transferRule: draft.explanation_transfer_rule ?? transferRuleText ?? null,
    options,
    reasoningPathway: draft.reasoning_pathway ?? null,
    decisionHinge: draft.decision_hinge ?? null,
    competingDifferential: draft.competing_differential ?? null,
    highYieldPearl: draft.high_yield_pearl ?? null,
    visualSpecs: draft.visual_specs ?? null,
    decisionLogic: draft.explanation_decision_logic ?? null,
    errorDiagnosis,
    teachingPearl: draft.explanation_teaching_pearl ?? null,
    errorTemplate,
  };
}

// ─── Batch Question normalization ───

interface BatchQuestionFields {
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  explanation_decision?: string;
  explanation_options?: string;
  explanation_summary?: string;
  transfer_rule_text?: string | null;
  error_map?: Record<string, string>;
}

export function normalizeQuestionExplanation(
  question: BatchQuestionFields,
): RichExplanation {
  // Build per-option from flat text (best effort — no structured why_wrong per option)
  const options: PerOptionExplanation[] = LETTERS.map((letter) => {
    const key = `option_${letter.toLowerCase()}` as keyof BatchQuestionFields;
    const isCorrect = letter === question.correct_answer;
    const errorName = question.error_map?.[letter] ?? null;
    return {
      letter,
      optionText: (question[key] as string) ?? '',
      whyWrong: null, // batch questions don't have per-option why_wrong
      whyCorrect: isCorrect ? (question.explanation_decision ?? null) : null,
      cognitiveError: isCorrect ? null : errorName,
    };
  });

  return {
    whyCorrect: question.explanation_decision ?? '',
    transferRule: question.transfer_rule_text ?? null,
    options,
    reasoningPathway: null,
    decisionHinge: null,
    competingDifferential: null,
    highYieldPearl: null,
    visualSpecs: null,
    decisionLogic: null,
    errorDiagnosis: null,
    teachingPearl: null,
    errorTemplate: null,
  };
}
