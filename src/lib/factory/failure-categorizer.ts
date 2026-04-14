/**
 * Infers failure_category from validator type and issues.
 *
 * Research (P2 — QUEST-AI) shows repair only works with specific error
 * categorization. This module classifies validator failures into actionable
 * categories so the repair agent can apply targeted strategies.
 */

import type { ValidatorType } from '@/lib/types/database';
import type { FailureCategory } from './schemas/validator-report';

interface FailedReport {
  validator_type: ValidatorType;
  score: number;
  issues_found: string[];
  repair_instructions: string | null | undefined;
}

/**
 * Infer the most likely failure category from a failed validator report.
 * Uses keyword matching on issues_found and validator_type context.
 */
export function inferFailureCategory(report: FailedReport): FailureCategory {
  const issuesText = report.issues_found.join(' ').toLowerCase();
  const repairText = (report.repair_instructions ?? '').toLowerCase();
  const combined = `${issuesText} ${repairText}`;

  // Medical validator failures
  if (report.validator_type === 'medical') {
    if (matchesAny(combined, ['multiple correct', 'both correct', 'also correct', 'defensible', 'two correct'])) {
      return 'multiple_correct';
    }
    if (matchesAny(combined, ['correct answer is wrong', 'correct answer is incorrect', 'wrong answer keyed', 'answer key'])) {
      return 'wrong_answer_keyed';
    }
    if (matchesAny(combined, ['no correct', 'none of the options', 'none correct'])) {
      return 'no_correct_answer';
    }
    return 'medical_error';
  }

  // Blueprint validator failures
  if (report.validator_type === 'blueprint') {
    return 'scope_violation';
  }

  // NBME quality validator failures
  if (report.validator_type === 'nbme_quality') {
    if (matchesAny(combined, ['clue', 'cue', 'testwise', 'grammatical', 'length'])) {
      return 'stem_clue_leak';
    }
    if (matchesAny(combined, ['hinge', 'buried', 'late'])) {
      return 'hinge_missing';
    }
    return 'stem_clue_leak';
  }

  // Option symmetry validator failures
  if (report.validator_type === 'option_symmetry') {
    return 'option_asymmetry';
  }

  // Explanation validator failures
  if (report.validator_type === 'explanation_quality') {
    return 'explanation_gap';
  }

  // Exam translation validator failures
  if (report.validator_type === 'exam_translation') {
    return 'recall_not_decision';
  }

  return 'medical_error'; // fallback
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

/**
 * Build a structured failure summary for the repair agent.
 * Groups failures by category and provides targeted repair guidance.
 */
export function buildRepairBrief(
  failures: { validatorType: ValidatorType; category: FailureCategory; issues: string[] }[]
): string {
  const lines: string[] = ['## Failure Analysis\n'];

  for (const f of failures) {
    lines.push(`### ${f.validatorType} — ${f.category}`);
    lines.push(`Category: **${CATEGORY_DESCRIPTIONS[f.category]}**`);
    lines.push(`Strategy: ${REPAIR_STRATEGIES[f.category]}`);
    lines.push(`Issues:`);
    for (const issue of f.issues) {
      lines.push(`  - ${issue}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

const CATEGORY_DESCRIPTIONS: Record<FailureCategory, string> = {
  multiple_correct: 'More than one answer choice is clinically defensible',
  wrong_answer_keyed: 'The declared correct answer is not the best answer',
  no_correct_answer: 'None of the answer choices is fully correct',
  medical_error: 'Factual medical inaccuracy in stem, options, or explanation',
  option_asymmetry: 'Answer choices are not parallel in structure or specificity',
  stem_clue_leak: 'The stem contains cues that reveal the answer',
  scope_violation: 'Question topic is outside the target content outline',
  recall_not_decision: 'Tests fact recall instead of clinical decision-making',
  explanation_gap: 'Explanation fails to teach the reasoning pathway',
  hinge_missing: 'No clear decision hinge differentiates the correct answer',
};

const REPAIR_STRATEGIES: Record<FailureCategory, string> = {
  multiple_correct: 'Make the correct answer uniquely defensible. Strengthen the distractor cognitive errors so wrong options are clearly wrong for specific, named reasons.',
  wrong_answer_keyed: 'Verify the correct answer against the algorithm card. If the card agrees with the keyed answer, fix the clinical scenario. If not, re-key to the correct option.',
  no_correct_answer: 'Ensure at least one option matches current guideline-recommended management. May need to replace an option entirely.',
  medical_error: 'Cross-reference against the algorithm card and fact rows. Fix factual errors in thresholds, drug choices, contraindications, or clinical presentation.',
  option_asymmetry: 'Rewrite options to be parallel in grammatical structure, length, and specificity. All options should be from the same action class.',
  stem_clue_leak: 'Remove grammatical cues (article agreement, singular/plural), length imbalance, and convergence patterns. Ensure the stem does not hint at the answer.',
  scope_violation: 'Adjust the clinical scenario to fall within the target shelf and content outline. May need to change the diagnosis or management focus.',
  recall_not_decision: 'Rewrite to test a clinical decision with competing plausible options, not a factual lookup. The question must have a genuine decision fork.',
  explanation_gap: 'Ensure why_correct explains the reasoning chain, not just the fact. Each why_wrong must reference the specific cognitive error that makes that option wrong.',
  hinge_missing: 'Add a pivotal clinical finding that changes the management decision. The hinge should be present but not immediately obvious.',
};
