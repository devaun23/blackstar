/**
 * Failure Classifier — maps PipelineResult + validator reports to structured failure codes.
 *
 * Examines pipeline status, step errors, and validator reports to produce
 * ClassifiedFailure objects. Uses keyword matching on issues_found[] strings
 * so existing validators need no changes.
 */

import type { ValidatorReportRow, ValidatorType } from '../../src/lib/types/database';
import type { PipelineResult, AgentStepResult } from '../../src/lib/types/factory';
import type { ClassifiedFailure, FailureCode } from './types';
import { FAILURE_CODES } from './types';

const MAX_REPAIR_CYCLES = 3;

// Map validator_type → failure code for non-passing reports
const VALIDATOR_TO_FAILURE: Record<ValidatorType, FailureCode> = {
  medical: 'VAL-MED-FAIL',
  blueprint: 'VAL-BP',
  nbme_quality: 'VAL-NBME',
  option_symmetry: 'VAL-OPT',
  explanation_quality: 'VAL-EXP',
  exam_translation: 'VAL-TRANS',
};

/**
 * Classify failures from a pipeline result that errored before validation.
 */
function classifyPipelineError(result: PipelineResult): ClassifiedFailure[] {
  const failures: ClassifiedFailure[] = [];

  // Find the failing step
  const failedStep = result.steps.find((s) => !s.success);
  const errorMsg = failedStep?.error ?? '';

  let code: FailureCode = 'GEN-AGENT-ERROR';
  if (errorMsg.includes('source_insufficient')) {
    code = 'GEN-SOURCE';
  } else if (errorMsg.includes('Skeleton failed') || errorMsg.includes('skeleton_validator')) {
    code = 'GEN-SKELETON';
  }

  failures.push({
    code,
    category: FAILURE_CODES[code].category,
    severity: FAILURE_CODES[code].severity,
    validator_type: null,
    score: null,
    issues: errorMsg ? [errorMsg] : ['Pipeline failed with unknown error'],
  });

  return failures;
}

/**
 * Classify failures from validator reports (post-validation).
 * Only reports that did NOT pass are classified.
 */
function classifyValidatorFailures(reports: ValidatorReportRow[]): ClassifiedFailure[] {
  const failures: ClassifiedFailure[] = [];

  for (const report of reports) {
    if (report.passed) continue;

    // Medical validator with score < 3 is a kill
    if (report.validator_type === 'medical' && report.score !== null && report.score < 3) {
      failures.push({
        code: 'VAL-MED-KILL',
        category: 'VAL',
        severity: 'kill',
        validator_type: report.validator_type,
        score: report.score,
        issues: report.issues_found ?? [],
      });
      continue;
    }

    const code = VALIDATOR_TO_FAILURE[report.validator_type];
    if (!code) continue;

    failures.push({
      code,
      category: FAILURE_CODES[code].category,
      severity: FAILURE_CODES[code].severity,
      validator_type: report.validator_type,
      score: report.score,
      issues: report.issues_found ?? [],
    });
  }

  return failures;
}

/**
 * Check if the item exhausted all repair cycles without passing.
 */
function classifyRepairExhaustion(
  result: PipelineResult,
  finalReports: ValidatorReportRow[]
): ClassifiedFailure | null {
  // Count repair_agent steps to determine repair cycles used
  const repairSteps = result.steps.filter((s) => s.agent === 'repair_agent');
  const anyFailing = finalReports.some((r) => !r.passed);

  if (repairSteps.length >= MAX_REPAIR_CYCLES && anyFailing) {
    return {
      code: 'RPR-EXHAUSTED',
      category: 'RPR',
      severity: 'kill',
      validator_type: null,
      score: null,
      issues: [`Item failed after ${repairSteps.length} repair cycles`],
    };
  }

  return null;
}

/**
 * Main classifier entry point.
 *
 * @param result - PipelineResult from runPipelineV2()
 * @param validatorReports - All validator_report rows for the item's draft(s).
 *   For items that went through repair, this includes reports from ALL cycles.
 *   We use the LATEST reports (highest created_at per validator_type) for classification.
 */
export function classifyFailures(
  result: PipelineResult,
  validatorReports: ValidatorReportRow[]
): ClassifiedFailure[] {
  // If pipeline itself failed before reaching validators
  if (result.status === 'failed' && validatorReports.length === 0) {
    return classifyPipelineError(result);
  }

  // Get the latest report per validator type (most recent cycle)
  const latestByType = new Map<ValidatorType, ValidatorReportRow>();
  const sorted = [...validatorReports].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  for (const report of sorted) {
    latestByType.set(report.validator_type, report);
  }
  const latestReports = Array.from(latestByType.values());

  const failures: ClassifiedFailure[] = [];

  // Pipeline-level errors (e.g., source insufficiency before validation)
  if (result.status === 'failed') {
    failures.push(...classifyPipelineError(result));
  }

  // Validator failures from the latest cycle
  failures.push(...classifyValidatorFailures(latestReports));

  // Repair exhaustion
  const repairExhaustion = classifyRepairExhaustion(result, latestReports);
  if (repairExhaustion) {
    failures.push(repairExhaustion);
  }

  return failures;
}

/**
 * Count repair cycles from pipeline steps.
 */
export function countRepairCycles(result: PipelineResult): number {
  return result.steps.filter((s) => s.agent === 'repair_agent').length;
}
