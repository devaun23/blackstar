// Deterministic fixture student. No LLM. CI-safe.
//
// Given a persona's baseline accuracy and weakness vector, returns a response
// seeded by (personaId, itemDraftId) so two runs of the same harness against
// the same items produce identical output — essential for regression-style
// gates on the simulator layer.
//
// Phase B will add SimulatedStudentAgent (Claude-driven) alongside this; the
// harness picks which student to use via --student flag.

import type {
  Persona,
  SimulatedItem,
  SimulatedResponse,
  SimulatedStudent,
} from './types';
import type { DimensionType } from '@/lib/types/database';

// FNV-1a 32-bit hash — fast, stable, string-friendly. Used to derive a seed
// from (personaId, itemDraftId) so responses are deterministic per item.
function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const ALL_OPTIONS: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];

export class FixtureStudent implements SimulatedStudent {
  readonly personaId: string;

  constructor(private readonly persona: Persona) {
    this.personaId = persona.id;
  }

  async answer(item: SimulatedItem): Promise<SimulatedResponse> {
    const rng = makeRng(hashSeed(`${this.persona.id}|${item.itemDraftId}`));

    const pCorrect = this.pCorrectForItem(item);
    const isCorrect = rng() < pCorrect;

    const selected: 'A' | 'B' | 'C' | 'D' | 'E' = isCorrect
      ? item.correctAnswer
      : pickWrongOption(item.correctAnswer, rng);

    const timeMs = Math.max(
      1_000,
      Math.round(
        this.persona.meanTimeMs + (rng() - 0.5) * 2 * this.persona.timeJitterMs,
      ),
    );
    const confidence = isCorrect
      ? this.persona.confidenceOnCorrect
      : this.persona.confidenceOnWrong;

    return { selected, isCorrect, confidence, timeMs, rationale: null };
  }

  private pCorrectForItem(item: SimulatedItem): number {
    // Start at baseline, then apply the weakness vector for each dimension
    // this item targets. Weakness values are per-dim p(correct) overrides —
    // most-weak dimension wins (lowest p).
    let p = this.persona.baselineAccuracy;
    const w = this.persona.weaknesses;
    if (!w || !item.targets) return clamp01(p);

    const check = (dim: DimensionType, id: string | null | undefined) => {
      if (!id) return;
      const override = w[dim]?.[id];
      if (typeof override === 'number') p = Math.min(p, override);
    };

    check('topic', item.targets.topicId);
    check('transfer_rule', item.targets.transferRuleId);
    check('confusion_set', item.targets.confusionSetId);
    check('cognitive_error', item.targets.cognitiveErrorId);
    check('action_class', item.targets.actionClassId);
    check('hinge_clue_type', item.targets.hingeClueTypeId);

    return clamp01(p);
  }
}

function pickWrongOption(
  correct: 'A' | 'B' | 'C' | 'D' | 'E',
  rng: () => number,
): 'A' | 'B' | 'C' | 'D' | 'E' {
  const pool = ALL_OPTIONS.filter((o) => o !== correct);
  return pool[Math.floor(rng() * pool.length)];
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Built-in Phase A persona. Broad baseline, one confusion-set weakness to
// exercise the contrast loop, one cognitive-error weakness to exercise
// remediate routing.
export const FIXTURE_V1: Persona = {
  id: 'fixture_v1',
  label: 'Phase-A baseline student',
  baselineAccuracy: 0.7,
  meanTimeMs: 45_000,
  timeJitterMs: 12_000,
  confidenceOnCorrect: 4,
  confidenceOnWrong: 3,
  // Weaknesses seeded empty; the CLI can load a per-run weakness vector from a
  // JSON file in a future iteration. For Phase A the baseline alone exercises
  // the full action/selection loop.
  weaknesses: {},
};
