// Simulator harness types.
//
// A SimulatedStudent takes an item and returns a simulated response. This is
// the core primitive that lets us score policies offline — run N personas
// through a session, observe what the tutor does, and compute metrics like
// regret, contrast-success-rate, and mastery trajectory without burning real
// users.
//
// Phase A: FixtureStudent (deterministic, no LLM) to prove the harness works.
// Phase B: SimulatedStudentAgent (Claude-driven, persona-traited) replaces it.

import type { DimensionType } from '@/lib/types/database';

export interface SimulatedItem {
  itemDraftId: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  // Optional context: which dimensions the item targets. Lets a persona apply
  // its weakness vector (e.g. "misses cardio confusion-set items 60% of the time").
  targets?: {
    topicId?: string | null;
    transferRuleId?: string | null;
    confusionSetId?: string | null;
    cognitiveErrorId?: string | null;
    actionClassId?: string | null;
    hingeClueTypeId?: string | null;
  };
}

export interface SimulatedResponse {
  selected: 'A' | 'B' | 'C' | 'D' | 'E';
  isCorrect: boolean;
  confidence: number;      // 1-5 Likert
  timeMs: number;
  rationale?: string | null;
}

export interface SimulatedStudent {
  readonly personaId: string;
  answer(item: SimulatedItem): Promise<SimulatedResponse>;
}

// A persona's weakness vector: per-dimension p(correct). Missing keys default
// to the persona's baseline accuracy. Drives how FixtureStudent decides right
// vs. wrong on a given item.
export interface Persona {
  id: string;
  label: string;
  baselineAccuracy: number;   // e.g. 0.7
  meanTimeMs: number;         // e.g. 45_000
  timeJitterMs: number;       // e.g. 15_000
  confidenceOnCorrect: number;   // 1-5
  confidenceOnWrong: number;     // 1-5
  weaknesses?: Partial<Record<DimensionType, Record<string, number>>>;
}
