import type {
  RichExplanation,
  PerOptionExplanation,
  ExplanationLayers,
  DownToTwoDiscrimination,
  ExplanationComponents,
  ConceptBlock,
  ComparisonTable,
  ProtocolStep,
  TrapEntry,
  PharmacologyEntry,
} from '@/lib/types/explanation';
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
  explanation_gap_coaching?: string | null;
  // v23 Elite-Tutor fields
  down_to_two_discrimination?: {
    competitor_option: string;
    tipping_detail: string;
    counterfactual: string;
  } | null;
  question_writer_intent?: string | null;
  easy_recognition_check?: string | null;
  // v22 structured depth
  medicine_deep_dive?: {
    pathophysiology: string;
    diagnostic_criteria: string;
    management_algorithm: string;
    monitoring_and_complications: string;
    high_yield_associations: string;
  } | null;
  comparison_table?: {
    confusion_set_id: string | null;
    condition_a: string;
    condition_b: string;
    rows: Array<{ feature: string; condition_a_value: string; condition_b_value: string }>;
  } | null;
  pharmacology_notes?: Array<{
    drug: string;
    appears_as: 'correct_answer' | 'distractor';
    mechanism: string;
    major_side_effects: string[];
    critical_contraindications: string[];
    monitoring: string;
    key_interaction: string | null;
  }> | null;
  // v24 — 7-component adaptive display
  anchor_rule?: string | null;
  illness_script?: string | null;
  reasoning_compressed?: string | null;
  management_protocol?: Array<{
    step_num: number;
    action: string;
    criterion: string | null;
  }> | null;
  traps?: Array<{
    trap_name: string;
    validation: string;
    correction: string;
    maps_to_option: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  }> | null;
}

// ─── v7 components: build with fallbacks so clients always get a renderable payload ───

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return (match?.[0] ?? text).trim();
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  return words.length <= maxWords ? text.trim() : words.slice(0, maxWords).join(' ') + '…';
}

function deriveAnchor(draft: ItemDraftFields, transferRule: string | null): string {
  if (draft.anchor_rule) return draft.anchor_rule;
  const source = draft.high_yield_pearl ?? transferRule ?? draft.why_correct;
  return truncateWords(firstSentence(source), 15).replace(/[.!?]+$/, '');
}

function buildConcept(draft: ItemDraftFields): ConceptBlock | null {
  const dd = draft.medicine_deep_dive;
  if (!dd) return null;
  return {
    pathophysiology: dd.pathophysiology,
    diagnosticCriteria: dd.diagnostic_criteria,
    highYieldAssociations: dd.high_yield_associations,
  };
}

function buildContrast(draft: ItemDraftFields): ComparisonTable | null {
  const ct = draft.comparison_table;
  if (!ct || !Array.isArray(ct.rows) || ct.rows.length === 0) return null;
  return {
    conditionA: ct.condition_a,
    conditionB: ct.condition_b,
    rows: ct.rows.map((r) => ({
      feature: r.feature,
      conditionAValue: r.condition_a_value,
      conditionBValue: r.condition_b_value,
    })),
  };
}

function parseAlgorithmFromProse(prose: string | null | undefined): ProtocolStep[] | null {
  if (!prose) return null;
  // Match "1. ...", "1) ...", "(1) ...", "Step 1: ...", etc. at line-ish boundaries.
  const numberedStep = /(?:^|\n|\.|;)\s*(?:Step\s*)?(?:\(?(\d+)\)?[.:)])\s*([^\n.;]{8,})/gi;
  const steps: ProtocolStep[] = [];
  for (const match of prose.matchAll(numberedStep)) {
    const num = parseInt(match[1], 10);
    const action = match[2].trim();
    if (action.length >= 8 && num >= 1 && num <= 12) {
      steps.push({ stepNum: num, action: action.slice(0, 160), criterion: null });
    }
  }
  return steps.length >= 2 ? steps : null;
}

function buildAlgorithm(draft: ItemDraftFields): ProtocolStep[] | null {
  if (Array.isArray(draft.management_protocol) && draft.management_protocol.length > 0) {
    return draft.management_protocol.map((s) => ({
      stepNum: s.step_num,
      action: s.action,
      criterion: s.criterion,
    }));
  }
  return parseAlgorithmFromProse(draft.medicine_deep_dive?.management_algorithm);
}

function buildTraps(draft: ItemDraftFields): TrapEntry[] | null {
  if (!Array.isArray(draft.traps) || draft.traps.length === 0) return null;
  return draft.traps.map((t) => ({
    trapName: t.trap_name,
    validation: t.validation,
    correction: t.correction,
    mapsToOption: t.maps_to_option,
  }));
}

function buildPharmacology(draft: ItemDraftFields): PharmacologyEntry[] | null {
  if (!Array.isArray(draft.pharmacology_notes) || draft.pharmacology_notes.length === 0) return null;
  return draft.pharmacology_notes.map((p) => ({
    drug: p.drug,
    appearsAs: p.appears_as,
    mechanism: p.mechanism,
    majorSideEffects: p.major_side_effects,
    criticalContraindications: p.critical_contraindications,
    monitoring: p.monitoring,
    keyInteraction: p.key_interaction,
  }));
}

function buildComponents(
  draft: ItemDraftFields,
  transferRule: string | null,
): ExplanationComponents {
  return {
    anchor: deriveAnchor(draft, transferRule),
    pattern: draft.illness_script ?? null,
    concept: buildConcept(draft),
    reasoningFull: draft.why_correct,
    reasoningCompressed: draft.reasoning_compressed ?? null,
    decisionHinge: draft.decision_hinge ?? null,
    contrast: buildContrast(draft),
    algorithm: buildAlgorithm(draft),
    traps: buildTraps(draft),
    pharmacology: buildPharmacology(draft),
  };
}

interface ErrorTaxonomyRow {
  id: string;
  error_name: string;
  explanation_template: string;
  palmerton_coaching_note?: string | null;
}

interface NormalizeDraftOptions {
  draft: ItemDraftFields;
  transferRuleText?: string | null;
  errorMap?: Record<string, { error_id: string; error_name: string; meaning: string }>;
  errorTaxonomyRows?: ErrorTaxonomyRow[];
}

function getOptionText(draft: ItemDraftFields, letter: string): string {
  const key = letter.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
  return draft[`choice_${key}` as keyof ItemDraftFields] as string
    ?? draft[`option_${key}` as keyof ItemDraftFields] as string
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

  const transferRule = draft.explanation_transfer_rule ?? transferRuleText ?? null;

  // Resolve gap coaching: prefer draft-level, fallback to taxonomy-level
  let gapCoaching: string | null = draft.explanation_gap_coaching ?? null;
  if (!gapCoaching && errorTaxonomyRows && errorMap) {
    for (const entry of Object.values(errorMap)) {
      const row = errorTaxonomyRows.find((r) => r.error_name === entry.error_name);
      if (row?.palmerton_coaching_note) {
        gapCoaching = row.palmerton_coaching_note;
        break;
      }
    }
  }

  // v23 Elite-Tutor Rule 4 — down-to-two discrimination
  const downToTwo: DownToTwoDiscrimination | null = draft.down_to_two_discrimination
    ? {
        competitorOption: draft.down_to_two_discrimination.competitor_option as 'A' | 'B' | 'C' | 'D' | 'E',
        tippingDetail: draft.down_to_two_discrimination.tipping_detail,
        counterfactual: draft.down_to_two_discrimination.counterfactual,
      }
    : null;
  const questionWriterIntent = draft.question_writer_intent ?? null;
  const easyRecognitionCheck = draft.easy_recognition_check ?? null;

  const layers: ExplanationLayers = {
    fix: {
      errorDiagnosis,
      transferRule,
      errorTemplate,
      gapCoaching,
      questionWriterIntent,
      easyRecognitionCheck,
    },
    breakdown: {
      whyCorrect: draft.why_correct,
      reasoningPathway: draft.reasoning_pathway ?? null,
      decisionHinge: draft.decision_hinge ?? null,
      competingDifferential: draft.competing_differential ?? null,
      options,
      downToTwo,
    },
    medicine: {
      decisionLogic: draft.explanation_decision_logic ?? null,
      highYieldPearl: draft.high_yield_pearl ?? null,
      teachingPearl: draft.explanation_teaching_pearl ?? null,
      visualSpecs: draft.visual_specs ?? null,
    },
  };

  const components = buildComponents(draft, transferRule);

  return {
    whyCorrect: draft.why_correct,
    transferRule,
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
    gapCoaching,
    downToTwo,
    questionWriterIntent,
    easyRecognitionCheck,
    layers,
    components,
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

  const transferRule = question.transfer_rule_text ?? null;
  const whyCorrect = question.explanation_decision ?? '';

  const layers: ExplanationLayers = {
    fix: {
      errorDiagnosis: null,
      transferRule,
      errorTemplate: null,
      gapCoaching: null,
      questionWriterIntent: null,
      easyRecognitionCheck: null,
    },
    breakdown: {
      whyCorrect,
      reasoningPathway: null,
      decisionHinge: null,
      competingDifferential: null,
      options,
      downToTwo: null,
    },
    medicine: {
      decisionLogic: null,
      highYieldPearl: null,
      teachingPearl: null,
      visualSpecs: null,
    },
  };

  const components: ExplanationComponents = {
    anchor: transferRule ? truncateWords(firstSentence(transferRule), 15).replace(/[.!?]+$/, '') : whyCorrect ? truncateWords(firstSentence(whyCorrect), 15).replace(/[.!?]+$/, '') : '',
    pattern: null,
    concept: null,
    reasoningFull: whyCorrect,
    reasoningCompressed: null,
    decisionHinge: null,
    contrast: null,
    algorithm: null,
    traps: null,
    pharmacology: null,
  };

  return {
    whyCorrect,
    transferRule,
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
    gapCoaching: null,
    downToTwo: null,
    questionWriterIntent: null,
    easyRecognitionCheck: null,
    layers,
    components,
  };
}
