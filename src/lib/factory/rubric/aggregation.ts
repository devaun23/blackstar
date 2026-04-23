// Blackstar Master Rubric — existing-validator → domain-score aggregation.
//
// The rubric_evaluator agent does NOT re-grade the 7 domains for which
// existing validators already produce signal. These helpers convert
// {passed, score, raw_output} from each validator into the rubric's graded
// 0/N/M/max buckets using the bands from BLACKSTAR_MASTER_RUBRIC.md
// §Domain standards.
//
// The mapping is intentionally coarse (4 bands per domain). Existing
// validators emit a 0-10 score; we map that into the rubric's wider range.
// The LLM-graded domains (hinge, learner modeling, adaptive sequencing)
// are the only ones with full 0-max granularity.

import type { ValidatorReportRow } from '@/lib/types/database';
import type { MasterDomainScores } from '@/lib/factory/schemas/master-rubric';

/** Pick a rubric-domain score from a 0-10 validator score using 4 bands. */
function bandScore(
  validatorScore: number | null,
  passed: boolean,
  bands: { max: number; mid: number; low: number; zero: number },
): number {
  if (!passed) return bands.zero;
  const s = validatorScore ?? 5;
  if (s >= 9) return bands.max;
  if (s >= 7) return bands.mid;
  if (s >= 4) return bands.low;
  return bands.zero;
}

// ─── Per-domain mappers ─────────────────────────────────────────────────────

export function aggregateMedicalCorrectnessScope(
  medicalReport: ValidatorReportRow | undefined,
  contraindicationReport: ValidatorReportRow | undefined,
): number {
  // Hard-gate caught unsafe items; if we reach here, both are passing or neither ran.
  // Score 0-15 based on medical_validator strictness + contraindication clean.
  const med = medicalReport;
  if (!med) return 8;  // Partial credit for absence of signal; LLM grader can override.
  const base = bandScore(med.score, med.passed, { max: 15, mid: 12, low: 8, zero: 0 });
  // A contraindication false positive (passed=false but severity=relative) nudges down.
  if (contraindicationReport && contraindicationReport.passed === false) {
    return Math.max(0, base - 3);
  }
  return base;
}

export function aggregateBlueprintAlignment(
  blueprintReport: ValidatorReportRow | undefined,
): number {
  if (!blueprintReport) return 4;
  return bandScore(blueprintReport.score, blueprintReport.passed, { max: 8, mid: 6, low: 3, zero: 0 });
}

export function aggregateNbmeStemFidelity(
  nbmeReport: ValidatorReportRow | undefined,
): number {
  if (!nbmeReport) return 6;
  return bandScore(nbmeReport.score, nbmeReport.passed, { max: 12, mid: 9, low: 5, zero: 0 });
}

export function aggregateOptionSetQualitySymmetry(
  symmetryReport: ValidatorReportRow | undefined,
): number {
  if (!symmetryReport) return 6;
  return bandScore(symmetryReport.score, symmetryReport.passed, { max: 12, mid: 9, low: 5, zero: 0 });
}

export function aggregateKeyIntegrity(
  medicalReport: ValidatorReportRow | undefined,
  symmetryReport: ValidatorReportRow | undefined,
): number {
  // Key integrity is a composite: key is stable only if medical AND symmetry agree.
  if (!medicalReport || !symmetryReport) return 3;
  if (medicalReport.passed && symmetryReport.passed) return 5;
  if (medicalReport.passed || symmetryReport.passed) return 3;
  return 0;
}

export function aggregateExplanationQuality(
  explanationReport: ValidatorReportRow | undefined,
  /** Optional: existing 1-5 scaled rubric output (rubric_scorer v1). */
  rubricScorerOverall: number | null,
): number {
  if (!explanationReport && rubricScorerOverall === null) return 8;
  // Prefer explanationReport score if present; supplement with rubric_scorer
  // overall (1-5) mapped into a small nudge.
  const base = explanationReport
    ? bandScore(explanationReport.score, explanationReport.passed, { max: 15, mid: 12, low: 8, zero: 0 })
    : 12;
  if (rubricScorerOverall !== null) {
    if (rubricScorerOverall >= 4.5) return Math.min(15, base + 1);
    if (rubricScorerOverall < 3.0) return Math.max(0, base - 2);
  }
  return base;
}

export function aggregateProductionReadiness(
  hardGatePass: boolean,
  metadataComplete: boolean,
  /** v23-era fields missing but not gate-failing (reasoning_steps, difficulty_class, etc.). */
  v23StrictMissingCount = 0,
): number {
  // Production readiness is a deterministic check:
  //   - CORE metadata missing → hard gate already fired, 0
  //   - V23_STRICT missing → dock 1 point per missing field (max -4)
  //   - Clean → 10
  if (!hardGatePass) return 0;
  if (!metadataComplete) return 4;                      // Needs structured repair (legacy CORE gap)
  const dock = Math.min(4, v23StrictMissingCount);
  return 10 - dock;
}

// ─── Composite ──────────────────────────────────────────────────────────────

export interface AggregationInput {
  reportsByType: Partial<Record<string, ValidatorReportRow>>;
  rubricScorerOverall: number | null;
  hardGatePass: boolean;
  metadataComplete: boolean;
  v23StrictMissingCount?: number;
}

/**
 * Produce the 7 rubric domain scores that can be derived from existing
 * validator output. The 3 LLM-graded domains (hinge, learner_modeling,
 * adaptive_sequencing) are filled in by the rubric_evaluator agent.
 */
export function aggregateExistingDomains(
  input: AggregationInput,
): Pick<MasterDomainScores,
  'medical_correctness_scope' | 'blueprint_alignment' | 'nbme_stem_fidelity' |
  'option_set_quality_symmetry' | 'key_integrity' | 'explanation_quality' |
  'production_readiness'
> {
  const r = input.reportsByType;
  return {
    medical_correctness_scope:   aggregateMedicalCorrectnessScope(r.medical, r.contraindication),
    blueprint_alignment:         aggregateBlueprintAlignment(r.blueprint),
    nbme_stem_fidelity:          aggregateNbmeStemFidelity(r.nbme_quality),
    option_set_quality_symmetry: aggregateOptionSetQualitySymmetry(r.option_symmetry),
    key_integrity:               aggregateKeyIntegrity(r.medical, r.option_symmetry),
    explanation_quality:         aggregateExplanationQuality(r.explanation_quality, input.rubricScorerOverall),
    production_readiness:        aggregateProductionReadiness(input.hardGatePass, input.metadataComplete, input.v23StrictMissingCount ?? 0),
  };
}
