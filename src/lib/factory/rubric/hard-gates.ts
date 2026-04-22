// Blackstar Master Rubric — deterministic hard-gate detector.
//
// Runs BEFORE the LLM grader. Any fire here short-circuits to
// publish_decision='reject' without spending tokens. Each of the 8 hard
// gates from BLACKSTAR_MASTER_RUBRIC.md §Hard gate fail conditions is
// implemented as an independent check so we can log which gate(s) fired.
//
// Inputs are already-produced artifacts; we do not call LLMs here.

import type {
  ValidatorReportRow,
  ItemDraftRow,
  CasePlanRow,
  BlueprintNodeRow,
} from '@/lib/types/database';
import type { HardGateReason } from '@/lib/factory/schemas/master-rubric';

export interface HardGateInput {
  draft: ItemDraftRow;
  casePlan: CasePlanRow | null;
  node: BlueprintNodeRow | null;
  /** Keyed by validator_type for O(1) lookup. */
  validatorReports: Partial<Record<string, ValidatorReportRow>>;
}

export interface HardGateResult {
  pass: boolean;
  reasons: HardGateReason[];
  /** Per-gate detail for debugging and report storage. */
  detail: Record<HardGateReason, string | null>;
}

// ─── Individual gate checks ─────────────────────────────────────────────────

function gateMedicalInaccuracy(
  reports: HardGateInput['validatorReports'],
): string | null {
  const medical = reports.medical;
  const contra = reports.contraindication;
  if (medical && medical.passed === false) {
    return `medical_validator failed: ${medical.issues_found[0] ?? 'unspecified'}`;
  }
  if (contra && contra.passed === false) {
    return `contraindication_validator failed: ${contra.issues_found[0] ?? 'unspecified'}`;
  }
  return null;
}

function gateNoSingleBestAnswer(
  reports: HardGateInput['validatorReports'],
): string | null {
  const sym = reports.option_symmetry;
  const med = reports.medical;
  // option_symmetry carries a "multiple correct" signal in raw_output.
  const symFlag = sym?.raw_output?.multiple_correct === true
    || sym?.raw_output?.no_single_best === true;
  const medFlag = med?.raw_output?.multiple_correct === true;
  if (symFlag) return 'option_symmetry flagged multiple-correct / no-single-best';
  if (medFlag) return 'medical_validator flagged multiple-correct';
  return null;
}

function gateDiagnosisGivenAway(
  reports: HardGateInput['validatorReports'],
): string | null {
  // nbme_quality_validator raw_output carries diagnosis-narration signal.
  const nbme = reports.nbme_quality;
  const flag = nbme?.raw_output?.gives_away_diagnosis === true
    || nbme?.raw_output?.diagnosis_narrated === true;
  if (flag) return 'nbme_quality flagged diagnosis given away';
  return null;
}

function gateOptionSymmetryBroken(
  reports: HardGateInput['validatorReports'],
  casePlan: CasePlanRow | null,
): string | null {
  const sym = reports.option_symmetry;
  if (!sym || sym.passed !== false) return null;
  // Allowed when the case_plan explicitly encodes a clinical fork as the
  // decision_fork_type — the asymmetry is the teaching point.
  const justifiedFork = casePlan?.decision_fork_type === 'contraindication'
    || casePlan?.decision_fork_type === 'severity_ambiguity';
  if (justifiedFork) return null;
  return `option_symmetry failed without justified clinical fork: ${sym.issues_found[0] ?? 'unspecified'}`;
}

function gateWrongTransferRule(
  draft: ItemDraftRow,
  casePlan: CasePlanRow | null,
): string | null {
  if (!casePlan || !casePlan.transfer_rule_text) return null;
  if (!draft.explanation_transfer_rule) return null;
  // Soft check: explanation should reference the case_plan's rule verbatim-ish.
  // Treat 40% token-set overlap as "matches"; lower means the explanation is
  // teaching a different rule than was pre-declared.
  const pre = tokens(casePlan.transfer_rule_text);
  const post = tokens(draft.explanation_transfer_rule);
  if (pre.size === 0 || post.size === 0) return null;
  let overlap = 0;
  for (const t of pre) if (post.has(t)) overlap++;
  const ratio = overlap / pre.size;
  if (ratio < 0.4) {
    return `explanation_transfer_rule overlaps only ${(ratio * 100).toFixed(0)}% with case_plan.transfer_rule_text`;
  }
  return null;
}

function gateOutOfShelfScope(
  reports: HardGateInput['validatorReports'],
): string | null {
  const bp = reports.blueprint;
  if (bp && bp.passed === false) {
    return `blueprint_validator failed: ${bp.issues_found[0] ?? 'unspecified'}`;
  }
  return null;
}

function gateDistractorsImplausible(
  reports: HardGateInput['validatorReports'],
): string | null {
  const sym = reports.option_symmetry;
  if (!sym) return null;
  const est = sym.distractor_estimates;
  if (!est) return null;
  // If any distractor functions at <10% (effectively never selected),
  // it's implausible / joke-like.
  const weak = Object.entries(est).filter(([, v]) => typeof v === 'number' && v < 0.10);
  if (weak.length > 0) {
    const names = weak.map(([k]) => k).join(', ');
    return `distractors with <10% estimated selection: ${names}`;
  }
  return null;
}

// The 15 required metadata fields from BLACKSTAR_MASTER_RUBRIC.md §Required metadata.
// Missing any → this gate fires.
function gateMissingMetadata(
  input: HardGateInput,
): string | null {
  const { draft, casePlan, node } = input;
  const missing: string[] = [];

  if (!draft.id) missing.push('item_id');
  if (!node?.shelf) missing.push('shelf');
  if (!node?.system) missing.push('system');
  if (!node?.topic) missing.push('blueprint_node');

  // concepts_tested — fallback to reasoning_steps[].what_student_must_recognize
  const hasConcepts = casePlan?.reasoning_steps && casePlan.reasoning_steps.length > 0;
  if (!hasConcepts) missing.push('concepts_tested');

  if (!casePlan?.cognitive_operation_type) missing.push('cognitive_operation');
  if (!casePlan?.transfer_rule_text) missing.push('transfer_rule_text');
  if (!casePlan?.final_decisive_clue) missing.push('hinge_clue');
  if (!casePlan?.hinge_depth_target) missing.push('hinge_depth_target');
  if (!casePlan?.target_confusion_set_id) missing.push('confusion_set');
  if (!casePlan?.target_cognitive_error_id) missing.push('cognitive_error_targets');
  if (!casePlan?.difficulty_class) missing.push('difficulty_target');
  if (!node?.yield_tier) missing.push('intended_user_stage');
  if (!casePlan?.explanation_teaching_goal) missing.push('explanation_goal');

  if (missing.length > 0) {
    return `missing required metadata: ${missing.join(', ')}`;
  }
  return null;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

// ─── Runner ─────────────────────────────────────────────────────────────────

export function detectHardGates(input: HardGateInput): HardGateResult {
  const { draft, casePlan, validatorReports } = input;

  const detail: Record<HardGateReason, string | null> = {
    medical_inaccuracy_or_unsafe:   gateMedicalInaccuracy(validatorReports),
    no_single_best_answer:          gateNoSingleBestAnswer(validatorReports),
    diagnosis_given_away:           gateDiagnosisGivenAway(validatorReports),
    option_symmetry_broken:         gateOptionSymmetryBroken(validatorReports, casePlan),
    wrong_transfer_rule_taught:     gateWrongTransferRule(draft, casePlan),
    out_of_shelf_scope:             gateOutOfShelfScope(validatorReports),
    distractors_implausible:        gateDistractorsImplausible(validatorReports),
    missing_required_metadata:      gateMissingMetadata(input),
  };

  const reasons = (Object.keys(detail) as HardGateReason[])
    .filter((k) => detail[k] !== null);

  return {
    pass: reasons.length === 0,
    reasons,
    detail,
  };
}
