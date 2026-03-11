// Validator contracts (Block B5).
// Defines the deterministic pass/fail gates for each validator family.
// These contracts codify REJECTION_RULES.md and REPAIR_POLICY.md as types.

// ---------------------------------------------------------------------------
// Medical validator contract
// ---------------------------------------------------------------------------

export interface MedicalValidatorContract {
  auto_kill: readonly string[];
  repairable: readonly string[];
  pass_threshold: number;
  dimensions: readonly string[];
  source_requirement: 'correct_answer_must_trace_to_tier_b_source';
}

export const MEDICAL_VALIDATOR_CONTRACT: MedicalValidatorContract = {
  auto_kill: [
    'R-MED-01: Wrong diagnosis',
    'R-MED-02: Wrong treatment',
    'R-MED-03: Contraindicated action correct',
    'R-MED-04: Outdated management',
    'R-MED-05: Fabricated guideline',
    'R-MED-06: Dangerous distractor',
  ],
  repairable: [
    'Defensible but not best answer',
    'Weak distractor',
    'Minor clinical inaccuracy',
  ],
  pass_threshold: 7.0,
  dimensions: [
    'diagnosis_accuracy',
    'treatment_accuracy',
    'distractor_plausibility',
    'clinical_coherence',
  ],
  source_requirement: 'correct_answer_must_trace_to_tier_b_source',
};

// ---------------------------------------------------------------------------
// NBME style validator contract
// ---------------------------------------------------------------------------

export interface NBMEStyleValidatorContract {
  auto_kill: readonly string[];
  repairable: readonly string[];
  pass_threshold: number;
  dimensions: readonly string[];
  structural_rules: readonly string[];
}

export const NBME_STYLE_VALIDATOR_CONTRACT: NBMEStyleValidatorContract = {
  auto_kill: [
    'Diagnosis named in stem',
    'Only 1 plausible answer',
    'Answers not same abstraction',
    'Giveaway labs too early',
  ],
  repairable: [
    'One answer too long',
    'Negative phrasing',
    'Setting inconsistent',
    'Overlapping distractors',
  ],
  pass_threshold: 7.0,
  dimensions: [
    'hinge_quality',
    'distractor_symmetry',
    'vignette_fidelity',
    'suppression_effectiveness',
  ],
  structural_rules: [
    'Single best answer',
    '5 choices A-E',
    'No all/none of above',
    'Question stem format',
    'Clinical chronological order',
  ],
};

// ---------------------------------------------------------------------------
// Structural validator contract
// ---------------------------------------------------------------------------

export interface StructuralValidatorContract {
  checks: readonly string[];
  pass_threshold: number;
  dimensions: readonly string[];
}

export const STRUCTURAL_VALIDATOR_CONTRACT: StructuralValidatorContract = {
  checks: [
    'All fields populated',
    'Citation exists',
    'Task matches node',
    'Setting matches',
    'Age matches',
    'Explanation complete',
    'No duplicate choices',
    'Answer matches choice',
  ],
  pass_threshold: 7.0,
  dimensions: [
    'completeness',
    'consistency',
    'citation_quality',
    'explanation_quality',
  ],
};
