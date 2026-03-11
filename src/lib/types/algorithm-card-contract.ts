// Algorithm card contract (Block T5).
// The core bridge between truth grounding (B2) and item generation.
// This defines the formal shape a card must satisfy before it can
// produce items — independent of the DB schema.

import type { CardStatus } from './database';

// ---------------------------------------------------------------------------
// Decision path — the clinical reasoning structure within a card
// ---------------------------------------------------------------------------

export interface DecisionPathStep {
  step: number;
  description: string;        // e.g. "Assess hemodynamic stability"
  branches: string[];          // e.g. ["Stable → workup", "Unstable → stabilize first"]
  decisive_data: string;       // What data point resolves this step
}

// ---------------------------------------------------------------------------
// Source reference within a card (typed for the contract, not the DB)
// ---------------------------------------------------------------------------

export interface CardSourceRef {
  source_excerpt_canonical_id: string;
  relevance: 'primary' | 'supporting';
  claim_grounded: string;      // Which specific claim this excerpt supports
}

// ---------------------------------------------------------------------------
// Generation readiness gate — what a card must have to produce items
// ---------------------------------------------------------------------------

export interface GenerationReadinessGate {
  min_source_refs: number;
  min_competing_paths: number;
  hinge_must_be_late_revealable: boolean;
  decision_path_min_steps: number;
  human_review_required: boolean;
}

export const DEFAULT_GENERATION_GATE: GenerationReadinessGate = {
  min_source_refs: 1,
  min_competing_paths: 2,
  hinge_must_be_late_revealable: true,
  decision_path_min_steps: 2,
  human_review_required: true,
};

// ---------------------------------------------------------------------------
// Algorithm card contract — full spec-layer shape
// ---------------------------------------------------------------------------

export interface AlgorithmCardContract {
  // Identity
  canonical_id: string;                    // e.g. CARD.MED.CARD.ACS.NSTEMI
  blueprint_node_canonical_id: string;

  // Clinical content (mirrors DB schema fields)
  entry_presentation: string;
  competing_paths: string[];               // >= 2 for tier_1
  hinge_feature: string;
  correct_action: string;

  // Decision path — the teaching structure
  decision_path: DecisionPathStep[];

  // Truth grounding (B2)
  source_refs: CardSourceRef[];

  // Negative space
  contraindications: string[];
  common_traps: string[];
  excluded_content: string[];

  // Status lifecycle
  status: CardStatus;

  // Gate
  generation_ready_requires: GenerationReadinessGate;
}

// ---------------------------------------------------------------------------
// Validation helper — checks if a card meets its generation gate
// ---------------------------------------------------------------------------

export function isGenerationReady(card: AlgorithmCardContract): { ready: boolean; failures: string[] } {
  const gate = card.generation_ready_requires;
  const failures: string[] = [];

  const primaryRefs = card.source_refs.filter(r => r.relevance === 'primary').length;
  if (primaryRefs < gate.min_source_refs) {
    failures.push(`Need ${gate.min_source_refs} primary source ref(s), have ${primaryRefs}`);
  }
  if (card.competing_paths.length < gate.min_competing_paths) {
    failures.push(`Need ${gate.min_competing_paths} competing paths, have ${card.competing_paths.length}`);
  }
  if (card.decision_path.length < gate.decision_path_min_steps) {
    failures.push(`Need ${gate.decision_path_min_steps} decision steps, have ${card.decision_path.length}`);
  }
  if (card.status !== 'generation_ready') {
    failures.push(`Status is '${card.status}', must be 'generation_ready'`);
  }

  return { ready: failures.length === 0, failures };
}
