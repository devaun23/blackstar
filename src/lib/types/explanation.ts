import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

// ─── Per-Option Explanation ───
export interface PerOptionExplanation {
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  optionText: string;
  whyWrong: string | null;       // null for the correct answer
  whyCorrect: string | null;     // null for wrong answers
  cognitiveError: string | null;  // error_name from taxonomy if this distractor maps to one
}

// ─── v7 adaptive display components ───

export interface TrapEntry {
  trapName: string;
  validation: string;    // "Starting insulin seems urgent because..."
  correction: string;    // mechanism of error + the rule
  mapsToOption: 'A' | 'B' | 'C' | 'D' | 'E' | null;
}

export interface ProtocolStep {
  stepNum: number;
  action: string;
  criterion: string | null;
}

export interface ConceptBlock {
  pathophysiology: string;
  diagnosticCriteria: string;
  highYieldAssociations: string;
}

export interface ComparisonTableRow {
  feature: string;
  conditionAValue: string;
  conditionBValue: string;
}

export interface ComparisonTable {
  conditionA: string;
  conditionB: string;
  rows: ComparisonTableRow[];
}

export interface PharmacologyEntry {
  drug: string;
  appearsAs: 'correct_answer' | 'distractor';
  mechanism: string;
  majorSideEffects: string[];
  criticalContraindications: string[];
  monitoring: string;
  keyInteraction: string | null;
}

/** The 7-component payload consumed by the adaptive display layer. */
export interface ExplanationComponents {
  anchor: string;                        // anchor_rule OR fallback: high_yield_pearl truncated
  pattern: string | null;                // illness_script
  concept: ConceptBlock | null;          // composed from medicine_deep_dive
  reasoningFull: string;                 // why_correct
  reasoningCompressed: string | null;    // reasoning_compressed
  decisionHinge: string | null;
  contrast: ComparisonTable | null;      // comparison_table (normalized)
  algorithm: ProtocolStep[] | null;      // management_protocol OR parsed from management_algorithm
  traps: TrapEntry[] | null;
  pharmacology: PharmacologyEntry[] | null;
}

// ─── Rule 4 — Down-to-two discrimination ───
export interface DownToTwoDiscrimination {
  competitorOption: 'A' | 'B' | 'C' | 'D' | 'E';
  tippingDetail: string;
  counterfactual: string;
}

// ─── 3-Layer Explanation Architecture ───
// Layer 3 (Fix)  — shown first: what went wrong + how to fix it
// Layer 2 (Breakdown) — how to think through this question
// Layer 1 (Medicine)  — the clinical content behind it

export interface FixLayer {
  errorDiagnosis: Record<string, { error_name: string; explanation: string }> | null;
  transferRule: string | null;
  errorTemplate: string | null;
  gapCoaching: string | null;
  questionWriterIntent: string | null;   // Rule 10
  easyRecognitionCheck: string | null;    // Rule 2 — signal when case_plan.difficulty_class === 'easy_recognition'
}

export interface BreakdownLayer {
  whyCorrect: string;
  reasoningPathway: string | null;
  decisionHinge: string | null;
  competingDifferential: string | null;
  options: PerOptionExplanation[];
  downToTwo: DownToTwoDiscrimination | null;  // Rule 4
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

  // Palmerton gap coaching (skills/noise/consistency-specific process coaching)
  gapCoaching: string | null;

  // Rule 4 / 10 / 2 — populated by explanation_writer v6, rendered progressively
  downToTwo: DownToTwoDiscrimination | null;
  questionWriterIntent: string | null;
  easyRecognitionCheck: string | null;

  // Grouped view for progressive disclosure UI (legacy layer shape, kept for fallback)
  layers: ExplanationLayers;

  // v7 — 7-component adaptive display payload. Fully populated by normalizer with
  // v6/v5 fallbacks when v24 columns are null. Clients render from this.
  components: ExplanationComponents;
}
