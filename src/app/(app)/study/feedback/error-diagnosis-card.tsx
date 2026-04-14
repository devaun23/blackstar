'use client';

const ERROR_LABELS: Record<string, string> = {
  severity_miss: 'Severity Miss',
  next_step_error: 'Next Step Error',
  premature_closure: 'Premature Closure',
  confusion_set_miss: 'Confusion Set Miss',
  test_interpretation_miss: 'Test Interpretation Miss',
  anchoring: 'Anchoring',
  wrong_algorithm_branch: 'Wrong Algorithm Branch',
  over_testing: 'Over-Testing',
  under_triage: 'Under-Triage',
  treating_labs_instead_of_patient: 'Treating Labs',
  reflex_response_to_finding: 'Reflex Response',
  misreading_hemodynamic_status: 'Hemodynamic Misread',
  skipping_required_diagnostic_step: 'Skipped Step',
  premature_escalation: 'Premature Escalation',
  wrong_priority_sequence: 'Wrong Priority',
  misreading_severity: 'Misreading Severity',
};

const ERROR_DESCRIPTIONS: Record<string, string> = {
  severity_miss: 'You missed a sign of hemodynamic instability or urgency that should have changed management priority.',
  next_step_error: 'You identified the diagnosis correctly but chose the wrong management step, timing, or sequence.',
  premature_closure: 'You anchored to the most obvious finding without considering contradicting data that redirects the diagnosis.',
  confusion_set_miss: 'You confused two similar conditions \u2014 the discriminating feature was in the vignette but you missed it.',
  test_interpretation_miss: 'You misinterpreted lab values, imaging findings, or diagnostic data that were key to the decision.',
  anchoring: 'You over-relied on the first piece of information, even when later data pointed elsewhere.',
  wrong_algorithm_branch: 'You identified the right scenario but took the wrong fork in the management algorithm.',
  over_testing: 'You ordered unnecessary diagnostics when the clinical picture already supported action.',
  under_triage: 'You underestimated the urgency and failed to escalate care appropriately.',
  treating_labs_instead_of_patient: 'You treated a lab value rather than the clinical condition it represents.',
  reflex_response_to_finding: 'You reflexively applied a standard response without checking if the full context warrants it.',
  misreading_hemodynamic_status: 'You misread hemodynamic stability, leading to inappropriate escalation or under-treatment.',
  skipping_required_diagnostic_step: 'You jumped to treatment without completing a required preliminary step.',
  premature_escalation: 'You escalated to invasive intervention when conservative management was still appropriate.',
  wrong_priority_sequence: 'You identified the right actions but executed them in the wrong order.',
  misreading_severity: 'You misclassified the severity of the condition, choosing management for a different level.',
};

interface ErrorDiagnosisCardProps {
  errorType: string;
  emphasized?: boolean;
  errorTemplate?: string | null;
  repeatCount?: number;
}

export default function ErrorDiagnosisCard({ errorType, emphasized, errorTemplate, repeatCount = 0 }: ErrorDiagnosisCardProps) {
  const borderClass = emphasized
    ? 'border-[var(--color-incorrect-base)] ring-1 ring-[var(--color-incorrect-base)]/30'
    : 'border-[var(--color-incorrect-border)]';

  return (
    <div className={`rounded-[var(--radius-card)] border ${borderClass} bg-[var(--color-incorrect-bg)] p-[var(--space-card-padding)]`}>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[var(--color-incorrect-base)] px-2.5 py-0.5 text-xs font-semibold text-black">
          {ERROR_LABELS[errorType] ?? errorType.replace(/_/g, ' ')}
        </span>
        {repeatCount >= 2 && (
          <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-black">
            {repeatCount}x repeat
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {errorTemplate ?? ERROR_DESCRIPTIONS[errorType] ?? 'Review the vignette carefully for the discriminating feature.'}
      </p>
      {repeatCount >= 3 && (
        <p className="mt-1.5 text-xs font-medium text-amber-400">
          This is a pattern. Focus on the transfer rule below — it targets this specific error.
        </p>
      )}
    </div>
  );
}
