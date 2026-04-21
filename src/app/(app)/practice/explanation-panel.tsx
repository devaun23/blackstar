'use client';

import type { Question } from './practice-session';
import SectionCard from '@/components/ui/section-card';
import StepIndicator from '@/components/ui/step-indicator';
import Collapsible from '@/components/ui/old-collapsible';
import ChoiceBadge from '@/components/ui/choice-badge';
import VisualRenderer from '@/components/visuals/visual-renderer';
import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

interface ExplanationPanelProps {
  question: Question;
  selectedAnswer: string;
  onNext: () => void;
  isLast: boolean;
}

const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

const WHY_WRONG_MAP: Record<string, keyof Question> = {
  A: 'why_wrong_a',
  B: 'why_wrong_b',
  C: 'why_wrong_c',
  D: 'why_wrong_d',
  E: 'why_wrong_e',
};

export default function ExplanationPanel({ question, selectedAnswer, onNext, isLast }: ExplanationPanelProps) {
  const isCorrect = selectedAnswer === question.correct_answer;

  // Parse reasoning pathway into steps
  const reasoningSteps = question.reasoning_pathway
    ? question.reasoning_pathway
        .split(/\n|;\s*/)
        .filter(Boolean)
        .map(s => s.replace(/^\d+\.\s*/, ''))
    : [];

  return (
    <div className="mt-6 space-y-[var(--space-section-gap)]">
      {/* 1. Correct/Incorrect Banner */}
      <SectionCard label="" variant={isCorrect ? 'correct' : 'incorrect'}>
        <p className={`text-sm font-semibold ${isCorrect ? 'text-[var(--color-correct-base)]' : 'text-[var(--color-incorrect-base)]'}`}>
          {isCorrect ? 'Correct!' : `Incorrect — the answer is ${question.correct_answer}`}
        </p>
      </SectionCard>

      {/* 2. Why Correct */}
      <SectionCard label="Why Correct" variant="default">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {question.why_correct}
        </p>
      </SectionCard>

      {/* 3. Reasoning Pathway */}
      {reasoningSteps.length > 0 && (
        <SectionCard label="Reasoning Pathway" variant="default">
          <StepIndicator steps={reasoningSteps} maxVisible={8} />
        </SectionCard>
      )}

      {/* 4. Visual Explanations */}
      {question.visual_specs && question.visual_specs.length > 0 && (
        <SectionCard label="Visual Explanation" variant="default">
          <div className="space-y-4">
            {(question.visual_specs as VisualSpec[]).map((spec, i) => (
              <VisualRenderer key={i} spec={spec} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 5. All Distractors */}
      <div className="space-y-[var(--space-inner-gap)]">
        {CHOICE_KEYS.filter(key => key !== question.correct_answer).map(key => {
          const whyWrong = question[WHY_WRONG_MAP[key]] as string | null;
          if (!whyWrong) return null;

          const isSelectedWrong = !isCorrect && selectedAnswer === key;

          return (
            <Collapsible
              key={key}
              title={`Why ${key} is wrong`}
              defaultOpen={isSelectedWrong}
              variant={isSelectedWrong ? 'incorrect' : 'default'}
            >
              <div className="flex items-start gap-2">
                <ChoiceBadge label={key} variant={isSelectedWrong ? 'incorrect' : 'default'} size="sm" />
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {whyWrong}
                </p>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* 6. Decision Hinge */}
      {question.decision_hinge && (
        <SectionCard label="Decision Hinge" variant="accent">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {question.decision_hinge}
          </p>
        </SectionCard>
      )}

      {/* 7. High-Yield Pearl */}
      {question.high_yield_pearl && (
        <SectionCard label="High-Yield Pearl" variant="pearl">
          <p className="text-sm leading-relaxed text-[var(--color-pearl-text)]">
            {question.high_yield_pearl}
          </p>
        </SectionCard>
      )}

      {/* 8. The Medicine Behind This — v22 UWorld-equivalent depth */}
      {question.medicine_deep_dive && (
        <SectionCard label="The Medicine Behind This" variant="default">
          <div className="space-y-3">
            <Collapsible title="Pathophysiology" defaultOpen>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {question.medicine_deep_dive.pathophysiology}
              </p>
            </Collapsible>
            <Collapsible title="Diagnostic Criteria">
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {question.medicine_deep_dive.diagnostic_criteria}
              </p>
            </Collapsible>
            <Collapsible title="Complete Management Algorithm">
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
                {question.medicine_deep_dive.management_algorithm}
              </p>
            </Collapsible>
            <Collapsible title="Monitoring & Complications">
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {question.medicine_deep_dive.monitoring_and_complications}
              </p>
            </Collapsible>
            <Collapsible title="High-Yield Associations">
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {question.medicine_deep_dive.high_yield_associations}
              </p>
            </Collapsible>
          </div>
        </SectionCard>
      )}

      {/* 9. Comparison Table — v22 confusion-set discriminator */}
      {question.comparison_table && question.comparison_table.rows.length > 0 && (
        <SectionCard label="Key Differences" variant="accent">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 pr-4 font-semibold">Feature</th>
                  <th className="text-left py-2 pr-4 font-semibold">{question.comparison_table.condition_a}</th>
                  <th className="text-left py-2 font-semibold">{question.comparison_table.condition_b}</th>
                </tr>
              </thead>
              <tbody>
                {question.comparison_table.rows.map((row, i) => {
                  const isDiscriminating = row.condition_a_value.trim() !== row.condition_b_value.trim();
                  return (
                    <tr key={i} className="border-b border-[var(--color-border)]/40">
                      <td className="py-2 pr-4 font-medium text-[var(--color-text-secondary)]">{row.feature}</td>
                      <td className={`py-2 pr-4 ${isDiscriminating ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                        {row.condition_a_value}
                      </td>
                      <td className={`py-2 ${isDiscriminating ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                        {row.condition_b_value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* 10. Pharmacology Notes — v22 per-drug teaching */}
      {question.pharmacology_notes && question.pharmacology_notes.length > 0 && (
        <SectionCard label="Pharmacology Reference" variant="default">
          <div className="space-y-4">
            {question.pharmacology_notes.map((entry, i) => (
              <div key={i} className="rounded-[var(--radius-button)] border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{entry.drug}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${entry.appears_as === 'correct_answer' ? 'bg-[var(--color-correct-bg)] text-[var(--color-correct-base)]' : 'bg-[var(--color-border)]/30 text-[var(--color-text-secondary)]'}`}>
                    {entry.appears_as === 'correct_answer' ? 'Correct answer' : 'Distractor'}
                  </span>
                </div>
                <p className="text-sm font-medium mb-2">{entry.mechanism}</p>
                <dl className="text-xs space-y-1 text-[var(--color-text-secondary)]">
                  {entry.major_side_effects.length > 0 && (
                    <div><dt className="inline font-semibold">Major side effects: </dt><dd className="inline">{entry.major_side_effects.join('; ')}</dd></div>
                  )}
                  {entry.critical_contraindications.length > 0 && (
                    <div><dt className="inline font-semibold">Contraindications: </dt><dd className="inline">{entry.critical_contraindications.join('; ')}</dd></div>
                  )}
                  <div><dt className="inline font-semibold">Monitoring: </dt><dd className="inline">{entry.monitoring}</dd></div>
                  {entry.key_interaction && (
                    <div><dt className="inline font-semibold">Key interaction: </dt><dd className="inline">{entry.key_interaction}</dd></div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 11. Image Pointer — v22 placeholder (curation pending) */}
      {question.image_pointer && (
        <SectionCard label="Reference Image" variant="default">
          <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-button)] p-6 text-center text-[var(--color-text-secondary)]">
            <p className="text-xs uppercase tracking-wide mb-1">{question.image_pointer.image_type} — pending curation</p>
            <p className="text-sm italic">{question.image_pointer.alt_text}</p>
          </div>
        </SectionCard>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-base)] py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        {isLast ? 'Finish Session' : 'Next Question'}
      </button>
    </div>
  );
}
