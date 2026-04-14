import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

// ─── Per-Option Explanation ───
export interface PerOptionExplanation {
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  optionText: string;
  whyWrong: string | null;       // null for the correct answer
  whyCorrect: string | null;     // null for wrong answers
  cognitiveError: string | null;  // error_name from taxonomy if this distractor maps to one
}

// ─── 3-Layer Explanation Architecture ───
// Layer 3 (Fix)  — shown first: what went wrong + how to fix it
// Layer 2 (Breakdown) — how to think through this question
// Layer 1 (Medicine)  — the clinical content behind it

export interface FixLayer {
  errorDiagnosis: Record<string, { error_name: string; explanation: string }> | null;
  transferRule: string | null;
  errorTemplate: string | null;
}

export interface BreakdownLayer {
  whyCorrect: string;
  reasoningPathway: string | null;
  decisionHinge: string | null;
  competingDifferential: string | null;
  options: PerOptionExplanation[];
}

export interface MedicineLayer {
  decisionLogic: string | null;
  highYieldPearl: string | null;
  teachingPearl: string | null;
  visualSpecs: VisualSpec[] | null;
}

export interface ExplanationLayers {
  fix: FixLayer;
  breakdown: BreakdownLayer;
  medicine: MedicineLayer;
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

  // Grouped view for progressive disclosure UI
  layers: ExplanationLayers;
}
