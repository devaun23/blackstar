'use client';

import { useState } from 'react';
import type { StudyQuestion } from './study-session';
import { getLayerConfig, isLayerVisible } from './feedback/section-order';
import ResultBanner from './feedback/result-banner';
import WhyCorrectSection from './feedback/why-correct-section';
import ReasoningPathway from './feedback/reasoning-pathway';
import DecisionHingeCard from './feedback/decision-hinge-card';
import HighYieldPearl from './feedback/high-yield-pearl';
import PerOptionBreakdown from './feedback/per-option-breakdown';
import VisualExplanation from './feedback/visual-explanation';
import MetacognitiveInputs from './feedback/metacognitive-inputs';
import SectionCard from '@/components/ui/section-card';
import Collapsible from '@/components/ui/old-collapsible';

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

interface RepairInfo {
  action: string;
  reason: string;
  targetDimensionType: string | null;
  targetDimensionId: string | null;
}

interface StudyFeedbackProps {
  question: StudyQuestion;
  selectedAnswer: string;
  onNext: (metacognitive?: { selfLabeledError?: string }) => void;
  repairInfo?: RepairInfo | null;
  errorRepeatCount?: number;
}

export default function StudyFeedback({ question, selectedAnswer, onNext, repairInfo, errorRepeatCount = 0 }: StudyFeedbackProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const isCorrect = selectedAnswer === question.correct_answer;
  const errorType = isCorrect
    ? null
    : question.error_map[selectedAnswer] ?? null;

  const rich = question.richExplanation;
  const config = getLayerConfig(repairInfo?.action ?? null, isCorrect);

  // ── Rich explanation: single-screen layout ──
  if (rich) {
    const { layers } = rich;

    return (
      <>
        <div className="mt-4 space-y-3 pb-40">
          {/* ═══ TOP: Always visible, never collapsed ═══ */}
          <ResultBanner isCorrect={isCorrect} correctAnswer={question.correct_answer} />

          {/* Error badge + transfer rule: one card, always visible */}
          {isLayerVisible(config.fix) && !isCorrect && (errorType || layers.fix.transferRule) && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-incorrect-border)] bg-[var(--color-incorrect-bg)] p-[var(--space-card-padding)]">
              <div className="flex items-center gap-2 flex-wrap">
                {errorType && (
                  <span className="rounded-full bg-[var(--color-incorrect-base)] px-2.5 py-0.5 text-xs font-semibold text-black">
                    {ERROR_LABELS[errorType] ?? errorType.replace(/_/g, ' ')}
                  </span>
                )}
                {errorRepeatCount >= 2 && (
                  <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-black">
                    {errorRepeatCount}x repeat
                  </span>
                )}
              </div>
              {layers.fix.transferRule && (
                <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-text-primary)]">
                  {layers.fix.transferRule}
                </p>
              )}
              {layers.fix.gapCoaching && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-400 border-l-2 border-zinc-600 pl-3">
                  {layers.fix.gapCoaching}
                </p>
              )}
              {errorRepeatCount >= 3 && (
                <p className="mt-1.5 text-xs font-medium text-amber-400">
                  This is a pattern. The rule above targets this specific error.
                </p>
              )}
              {repairInfo && (
                <p className="mt-2 text-xs text-zinc-500">
                  {repairInfo.action === 'advance' ? "Moving on — you've got this."
                    : repairInfo.action === 'contrast' ? 'Next: a contrasting case to sharpen the distinction.'
                    : repairInfo.action === 'remediate' ? 'Next: targeted practice on this pattern.'
                    : repairInfo.action === 'transfer_test' ? 'Next: same rule, different setting.'
                    : repairInfo.action === 'reinforce' ? 'Next: reinforcing this concept.'
                    : ''}
                </p>
              )}
            </div>
          )}

          {/* ═══ MIDDLE: Compact, expandable depth ═══ */}

          {/* Why This Answer — shown directly, no accordion */}
          {isLayerVisible(config.breakdown) && (
            <>
              <WhyCorrectSection
                whyCorrect={layers.breakdown.whyCorrect}
                decisionLogic={null}
              />

              {layers.breakdown.decisionHinge && (
                <DecisionHingeCard
                  hinge={layers.breakdown.decisionHinge}
                  emphasized={config.emphasize.decisionHinge}
                />
              )}

              {/* Option breakdown — behind a tap */}
              {layers.breakdown.options.length > 0 && config.optionScope !== 'none' && (
                <>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <span className="text-[10px]">{showOptions ? '\u25BE' : '\u25B8'}</span>
                    {showOptions ? 'Hide option breakdown' : 'Show option breakdown'}
                  </button>
                  {showOptions && (
                    <PerOptionBreakdown
                      options={layers.breakdown.options}
                      correctAnswer={question.correct_answer}
                      selectedAnswer={selectedAnswer}
                      defaultOpen={true}
                      scope={config.optionScope}
                      bare
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* Learn more — inline expand for medicine content */}
          {isLayerVisible(config.medicine) && (
            <>
              <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-400 transition-colors"
              >
                <span className="text-[10px]">{showMore ? '\u25BE' : '\u25B8'}</span>
                {showMore ? 'Hide' : 'Learn more'}
              </button>
              {showMore && (
                <div className="space-y-3">
                  {layers.breakdown?.reasoningPathway && (
                    <ReasoningPathway
                      pathway={layers.breakdown.reasoningPathway}
                      defaultOpen={true}
                    />
                  )}
                  {layers.medicine.decisionLogic && (
                    <SectionCard label="Clinical Decision Logic" variant="default">
                      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {layers.medicine.decisionLogic}
                      </p>
                    </SectionCard>
                  )}
                  {layers.medicine.highYieldPearl && (
                    <HighYieldPearl
                      pearl={layers.medicine.highYieldPearl}
                      teachingPearl={layers.medicine.teachingPearl}
                    />
                  )}
                  {layers.medicine.visualSpecs && layers.medicine.visualSpecs.length > 0 && (
                    <VisualExplanation
                      specs={layers.medicine.visualSpecs}
                      defaultOpen={true}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ BOTTOM: Pinned to viewport ═══ */}
        <MetacognitiveInputs isCorrect={isCorrect} onReady={onNext} />
      </>
    );
  }

  // ── Fallback: flat-text explanation (batch questions without richExplanation) ──
  return (
    <>
      <div className="mt-4 space-y-3 pb-40">
        <ResultBanner isCorrect={isCorrect} correctAnswer={question.correct_answer} />

        {/* Error + transfer rule merged */}
        {!isCorrect && (errorType || question.transfer_rule_text) && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-incorrect-border)] bg-[var(--color-incorrect-bg)] p-[var(--space-card-padding)]">
            {errorType && (
              <span className="rounded-full bg-[var(--color-incorrect-base)] px-2.5 py-0.5 text-xs font-semibold text-black">
                {ERROR_LABELS[errorType] ?? errorType.replace(/_/g, ' ')}
              </span>
            )}
            {question.transfer_rule_text && (
              <p className={`${errorType ? 'mt-2' : ''} text-sm font-medium leading-relaxed text-[var(--color-text-primary)]`}>
                {question.transfer_rule_text}
              </p>
            )}
            {repairInfo && (
              <p className="mt-2 text-xs text-zinc-500">
                {repairInfo.action === 'contrast' ? 'Next: a contrasting case.'
                  : repairInfo.action === 'remediate' ? 'Next: targeted practice.'
                  : repairInfo.action === 'transfer_test' ? 'Next: same rule, different setting.'
                  : ''}
              </p>
            )}
          </div>
        )}

        <SectionCard label="Why This Answer" variant="default">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {question.explanation_decision}
          </p>
        </SectionCard>

        <Collapsible title="Option-by-Option Breakdown" defaultOpen={false}>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
            {question.explanation_options}
          </p>
        </Collapsible>

        <Collapsible title="Exam Strategy" defaultOpen={false}>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {question.explanation_summary}
          </p>
        </Collapsible>
      </div>

      <MetacognitiveInputs isCorrect={isCorrect} onReady={onNext} />
    </>
  );
}
