'use client';

import type { StudyQuestion } from './study-session';
import Collapsible from '@/components/ui/old-collapsible';
import SectionCard from '@/components/ui/section-card';
import { getLayerConfig, isLayerOpen, isLayerVisible } from './feedback/section-order';
import ResultBanner from './feedback/result-banner';
import ErrorDiagnosisCard from './feedback/error-diagnosis-card';
import TransferRuleCard from './feedback/transfer-rule-card';
import RepairActionCard from './feedback/repair-action-card';
import WhyCorrectSection from './feedback/why-correct-section';
import ReasoningPathway from './feedback/reasoning-pathway';
import DecisionHingeCard from './feedback/decision-hinge-card';
import HighYieldPearl from './feedback/high-yield-pearl';
import PerOptionBreakdown from './feedback/per-option-breakdown';
import VisualExplanation from './feedback/visual-explanation';
import MetacognitiveInputs from './feedback/metacognitive-inputs';

interface RepairInfo {
  action: string;
  reason: string;
  targetDimensionType: string | null;
  targetDimensionId: string | null;
}

interface StudyFeedbackProps {
  question: StudyQuestion;
  selectedAnswer: string;
  onNext: (metacognitive?: { confidencePost?: number; selfLabeledError?: string }) => void;
  repairInfo?: RepairInfo | null;
  errorRepeatCount?: number;
}

export default function StudyFeedback({ question, selectedAnswer, onNext, repairInfo, errorRepeatCount = 0 }: StudyFeedbackProps) {
  const isCorrect = selectedAnswer === question.correct_answer;
  const errorType = isCorrect
    ? null
    : question.error_map[selectedAnswer] ?? null;

  const rich = question.richExplanation;
  const config = getLayerConfig(repairInfo?.action ?? null, isCorrect);

  // ── Rich explanation: 3-layer progressive disclosure ──
  if (rich) {
    const { layers } = rich;

    return (
      <div className="mt-6 space-y-[var(--space-section-gap)]">
        {/* Result banner — always shown */}
        <ResultBanner isCorrect={isCorrect} correctAnswer={question.correct_answer} />

        {/* ═══ Layer 3: THE FIX ═══ */}
        {/* What went wrong & how to fix it — shown first on incorrect */}
        {isLayerVisible(config.fix) && (
          <Collapsible
            title="What Went Wrong & How to Fix It"
            defaultOpen={isLayerOpen(config.fix)}
            variant="fix"
          >
            <div className="space-y-3">
              {!isCorrect && errorType && (
                <ErrorDiagnosisCard
                  errorType={errorType}
                  emphasized={config.emphasize.errorDiagnosis}
                  errorTemplate={layers.fix.errorTemplate}
                  repeatCount={errorRepeatCount}
                />
              )}

              {layers.fix.transferRule && (
                <TransferRuleCard
                  transferRule={layers.fix.transferRule}
                  emphasized={config.emphasize.transferRule}
                />
              )}

              {repairInfo && (
                <RepairActionCard action={repairInfo.action} reason={repairInfo.reason} />
              )}
            </div>
          </Collapsible>
        )}

        {/* ═══ Layer 2: THE BREAKDOWN ═══ */}
        {/* How to think through this question */}
        {isLayerVisible(config.breakdown) && (
          <Collapsible
            title="How to Think Through This Question"
            defaultOpen={isLayerOpen(config.breakdown)}
            variant="breakdown"
          >
            <div className="space-y-3">
              <WhyCorrectSection
                whyCorrect={layers.breakdown.whyCorrect}
                decisionLogic={null}
              />

              {layers.breakdown.reasoningPathway && (
                <ReasoningPathway
                  pathway={layers.breakdown.reasoningPathway}
                  defaultOpen={true}
                />
              )}

              {layers.breakdown.decisionHinge && (
                <DecisionHingeCard
                  hinge={layers.breakdown.decisionHinge}
                  emphasized={config.emphasize.decisionHinge}
                />
              )}

              <PerOptionBreakdown
                options={layers.breakdown.options}
                correctAnswer={question.correct_answer}
                selectedAnswer={selectedAnswer}
                defaultOpen={true}
                scope={config.optionScope}
              />
            </div>
          </Collapsible>
        )}

        {/* ═══ Layer 1: THE MEDICINE ═══ */}
        {/* The clinical content behind it */}
        {isLayerVisible(config.medicine) && (
          <Collapsible
            title="The Medicine Behind This"
            defaultOpen={isLayerOpen(config.medicine)}
            variant="medicine"
          >
            <div className="space-y-3">
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
          </Collapsible>
        )}

        {/* Metacognitive inputs + Next button */}
        <MetacognitiveInputs isCorrect={isCorrect} onReady={onNext} />
      </div>
    );
  }

  // ── Fallback: flat-text explanation (batch questions without richExplanation) ──
  return (
    <div className="mt-6 space-y-[var(--space-section-gap)]">
      <ResultBanner isCorrect={isCorrect} correctAnswer={question.correct_answer} />

      {!isCorrect && errorType && (
        <ErrorDiagnosisCard errorType={errorType} />
      )}

      {question.transfer_rule_text && (
        <TransferRuleCard transferRule={question.transfer_rule_text} />
      )}

      {repairInfo && (
        <RepairActionCard action={repairInfo.action} reason={repairInfo.reason} />
      )}

      <SectionCard label="Why This Answer" variant="default">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {question.explanation_decision}
        </p>
      </SectionCard>

      <Collapsible title="Option-by-Option Breakdown" defaultOpen={!isCorrect}>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
          {question.explanation_options}
        </p>
      </Collapsible>

      <Collapsible title="Exam Strategy" defaultOpen={false}>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {question.explanation_summary}
        </p>
      </Collapsible>

      <MetacognitiveInputs isCorrect={isCorrect} onReady={onNext} />
    </div>
  );
}
