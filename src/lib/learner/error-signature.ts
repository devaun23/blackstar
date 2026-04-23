// Error-signature derivation — pure function over existing attempt_v2 fields.
//
// Takes the signals Blackstar already captures (is_correct, confidence_pre,
// time_spent_ms, diagnosed_cognitive_error_id, diagnosed_hinge_miss,
// diagnosed_action_class_confusion, confusion_set_id, error_map lookup) and
// produces a structured signature usable by the explanation engine to pick
// WHICH component to lead with ("why YOU missed it") — not just how deep to
// go, which the current mastery-tier system already handles.
//
// This is pure computation. No DB, no side effects. Callers read the attempt
// row, look up the error_map entry for the selected option, and pass both in.
// The return value is a narrow, stable type intended for UI consumption.
//
// Priority ordering of the lead classification matters: calibration issues
// (overconfident-and-wrong) are surfaced above trap-type issues because
// "you were confident, this is a classic X/Y trap" is usually more useful
// to the learner than pure trap identification.

export type TrapCategory =
  | 'anchoring'
  | 'premature_closure'
  | 'wrong_action'
  | 'hinge_miss'
  | 'confusion_pair'
  | 'severity_misread'
  | 'procedural_skip'
  | 'timing_pressure'
  | 'other';

export type ExplanationLead =
  | 'calibration_feedback'   // "You were confident; this is a classic X/Y trap"
  | 'hinge_reveal'           // "The decisive clue was late in sentence N"
  | 'contrast_option'        // "The attractive wrong answer is X because..."
  | 'anchoring_clue'         // "You locked on to Y; the reframe is Z"
  | 'next_best_step'         // "Wrong action_class; the ordering principle is..."
  | 'pattern_teaching'       // Standard pattern explanation
  | 'reinforcement';         // Correct: reinforce pattern / transfer rule

export type Calibration = 'overconfident' | 'underconfident' | 'calibrated' | 'unknown';

export type Timing = 'fast' | 'normal' | 'slow' | 'very_slow' | 'unknown';

export interface ErrorSignatureInput {
  is_correct: boolean;
  selected_answer: 'A' | 'B' | 'C' | 'D' | 'E';
  time_spent_ms: number | null;
  confidence_pre: number | null;                   // 1–5; null when client omitted
  diagnosed_cognitive_error_name: string | null;   // from error_taxonomy, e.g. "anchoring"
  diagnosed_hinge_miss: boolean;
  diagnosed_action_class_confusion: boolean;
  confusion_set_id: string | null;
  option_error_name: string | null;                // error_map[selected_answer], may be null
}

export interface ErrorSignature {
  outcome: 'correct' | 'incorrect';
  trap_category: TrapCategory | null;              // null when correct
  primary_lead: ExplanationLead;
  calibration: Calibration;
  timing: Timing;
  notes: string[];                                 // human-readable reasons (for debug/logging)
}

// Palmerton brackets from timing-analysis.ts, inlined to keep this module pure.
const FAST_MAX_MS = 30_000;
const NORMAL_MAX_MS = 90_000;
const SLOW_MAX_MS = 120_000;

function classifyTiming(ms: number | null): Timing {
  if (ms === null) return 'unknown';
  if (ms < FAST_MAX_MS) return 'fast';
  if (ms < NORMAL_MAX_MS) return 'normal';
  if (ms < SLOW_MAX_MS) return 'slow';
  return 'very_slow';
}

function classifyCalibration(isCorrect: boolean, confidencePre: number | null): Calibration {
  if (confidencePre === null) return 'unknown';
  // 1–5 scale; threshold matches src/lib/learner/calibration.ts
  const confident = confidencePre >= 4;
  const unsure = confidencePre <= 2;
  if (confident && !isCorrect) return 'overconfident';
  if (unsure && isCorrect) return 'underconfident';
  return 'calibrated';
}

// Trap classification walks the available signals in priority order. The
// diagnosed_* booleans come from case_plan target_* fields — they are
// ground truth for what the item was designed to test.
function classifyTrap(input: ErrorSignatureInput): TrapCategory {
  if (input.diagnosed_hinge_miss) return 'hinge_miss';
  if (input.diagnosed_action_class_confusion) return 'wrong_action';

  const errName = (input.diagnosed_cognitive_error_name ?? input.option_error_name ?? '').toLowerCase();
  if (errName.includes('anchoring')) return 'anchoring';
  if (errName.includes('premature_closure')) return 'premature_closure';
  if (errName.includes('severity') || errName.includes('misreading_severity')) return 'severity_misread';
  if (errName.includes('skipping') || errName.includes('required_diagnostic')) return 'procedural_skip';
  if (errName.includes('wrong_algorithm') || errName.includes('wrong_priority')) return 'wrong_action';

  if (input.confusion_set_id) return 'confusion_pair';
  return 'other';
}

function chooseLead(
  isCorrect: boolean,
  calibration: Calibration,
  timing: Timing,
  trap: TrapCategory | null,
): ExplanationLead {
  if (isCorrect) {
    // Correct but very slow / underconfident still has teaching value: reinforce pattern.
    if (timing === 'very_slow' || calibration === 'underconfident') return 'reinforcement';
    return 'reinforcement';
  }

  // Wrong answer. Calibration leads when overconfident — that's the signal the
  // learner most needs to hear before any trap-specific teaching.
  if (calibration === 'overconfident') return 'calibration_feedback';

  switch (trap) {
    case 'hinge_miss':         return 'hinge_reveal';
    case 'anchoring':          return 'anchoring_clue';
    case 'premature_closure':  return 'contrast_option';
    case 'confusion_pair':     return 'contrast_option';
    case 'wrong_action':       return 'next_best_step';
    case 'severity_misread':   return 'next_best_step';
    case 'procedural_skip':    return 'next_best_step';
    case 'timing_pressure':    return 'pattern_teaching';
    case 'other':
    case null:                 return 'pattern_teaching';
  }
}

export function deriveErrorSignature(input: ErrorSignatureInput): ErrorSignature {
  const timing = classifyTiming(input.time_spent_ms);
  const calibration = classifyCalibration(input.is_correct, input.confidence_pre);
  const trap = input.is_correct ? null : classifyTrap(input);
  const primary_lead = chooseLead(input.is_correct, calibration, timing, trap);

  const notes: string[] = [];
  if (calibration === 'overconfident') notes.push('confidence_pre >= 4 and answer was wrong');
  if (calibration === 'underconfident') notes.push('confidence_pre <= 2 and answer was correct');
  if (input.diagnosed_hinge_miss) notes.push('hinge-miss diagnosed from case_plan');
  if (input.diagnosed_action_class_confusion) notes.push('action-class confusion diagnosed from case_plan');
  if (input.diagnosed_cognitive_error_name) notes.push(`cognitive_error: ${input.diagnosed_cognitive_error_name}`);
  if (input.option_error_name && input.option_error_name !== input.diagnosed_cognitive_error_name) {
    notes.push(`option_error (from error_map): ${input.option_error_name}`);
  }
  if (input.confusion_set_id) notes.push(`confusion_set: ${input.confusion_set_id}`);
  if (timing === 'very_slow') notes.push('time_spent > 120s — Palmerton threshold');
  if (timing === 'fast' && !input.is_correct) notes.push('fast answer and wrong — possible rushed decision');

  return {
    outcome: input.is_correct ? 'correct' : 'incorrect',
    trap_category: trap,
    primary_lead,
    calibration,
    timing,
    notes,
  };
}
