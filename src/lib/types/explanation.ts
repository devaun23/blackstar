import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

// ─── Per-Option Explanation ───
export interface PerOptionExplanation {
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  optionText: string;
  whyWrong: string | null;       // null for the correct answer
  whyCorrect: string | null;     // null for wrong answers
  cognitiveError: string | null;  // error_name from taxonomy if this distractor maps to one
}

// ─── Rich Explanation (unified across question types) ───
export interface RichExplanation {
  // Core — always present
  whyCorrect: string;
  transferRule: string | null;

  // Per-option breakdown
  options: PerOptionExplanation[];

  // Reasoning chain (item_draft native; null for batch questions)
  reasoningPathway: string | null;
  decisionHinge: string | null;
  competingDifferential: string | null;

  // Teaching aids
  highYieldPearl: string | null;
  visualSpecs: VisualSpec[] | null;

  // V2 5-component structured fields (item_draft only)
  decisionLogic: string | null;
  errorDiagnosis: Record<string, { error_name: string; explanation: string }> | null;
  teachingPearl: string | null;

  // Hydrated error template (filled from error_taxonomy.explanation_template)
  errorTemplate: string | null;
}
