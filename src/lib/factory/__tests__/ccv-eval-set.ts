// Adversarial regression harness for the Contraindication Cross-Check Validator.
//
// This file has TWO layers of evaluation:
//
//   Layer 1 — Alias-matcher tests (offline, no Claude, runs in milliseconds).
//     Tests that token-set alias matching correctly routes keyed-answer text to
//     the right registry entry. This is the gatekeeper — if the matcher is
//     wrong, CCV never sees the right contraindication list.
//
//   Layer 2 — End-to-end stem-trigger tests (requires pipeline + Claude).
//     Tests that, given a matched registry entry, the blind-auditor prompt
//     correctly identifies which stem details trigger which contraindications.
//     Runs via scripts/run-ccv-eval.ts against a live or mocked CCV.
//
// How to use this file:
//   - When you ADD a new registry entry, add at least 1 TP + 1 TN eval case
//     for that intervention before shipping. Without it, you have no regression
//     safety net — the next change to a sibling entry could break this one.
//   - When you CHANGE a stem_trigger list, re-run the eval set to confirm
//     existing matches still fire.
//
// Invariants:
//   - Every TP must name the registry id it expects to match (expected_contraindication_id).
//   - Every TN must assert no triggers found for the given keyed answer.
//   - Edge cases (alias near-miss, off-registry interventions, non-interventions)
//     each need their own expected_routing.

import { findMatchingInterventions } from '../agents/contraindication-validator';

// ─── Layer 1: Alias-matcher tests ───
// Format: { keyed_answer, expected_intervention_ids }
// Empty array = expect NO match (non-intervention or off-registry).

export interface AliasMatcherCase {
  label: string;
  keyed_answer: string;
  expected_intervention_ids: string[]; // empty = expect no match
  rationale: string;
}

export const aliasMatcherEvalSet: AliasMatcherCase[] = [
  // ─ Matches ─
  {
    label: 'Q2 PE case — full-sentence keyed answer for alteplase',
    keyed_answer: 'Administer alteplase 100 mg IV over 2 hours',
    expected_intervention_ids: ['thrombolysis_systemic'],
    rationale: 'Token-set match: "alteplase" alias tokens are all present in keyed text.',
  },
  {
    label: 'tPA abbreviation',
    keyed_answer: 'IV tPA',
    expected_intervention_ids: ['thrombolysis_systemic'],
    rationale: 'Alias "tpa" matches after lowercase+punctuation strip.',
  },
  {
    label: 'tenecteplase variant',
    keyed_answer: 'Tenecteplase 40 mg IV bolus',
    expected_intervention_ids: ['thrombolysis_systemic'],
    rationale: 'Alias "tenecteplase" matches single token.',
  },

  // ─ Non-matches (non-interventions) ─
  {
    label: 'Observation',
    keyed_answer: 'Reassure the patient and observe',
    expected_intervention_ids: [],
    rationale: 'No intervention — pharmacology-class fallback should also say is_intervention=false.',
  },
  {
    label: 'Diagnostic test',
    keyed_answer: 'Obtain a CT pulmonary angiogram',
    expected_intervention_ids: [],
    rationale: 'Diagnostic, not a therapeutic intervention — no registry match expected.',
  },

  // ─ Off-registry intervention (the "unknown" case) ─
  {
    label: 'Off-registry drug (acetaminophen) — currently no registry entry',
    keyed_answer: 'Administer acetaminophen 1000 mg PO',
    expected_intervention_ids: [],
    rationale:
      'No registry entry exists. Pharmacology-class fallback should say is_intervention=true, ' +
      'so CCV routes to needs_human_review. Failing silently here would be catastrophic once ' +
      'acetaminophen becomes a keyed answer in a liver-failure stem.',
  },

  // ─ TODO: MS4 to add one TP case for each new registry entry (anticoag, beta-blocker, ACEi, contrast) ─
];

// ─── Layer 2: End-to-end stem-trigger tests ───
// These require a running CCV (pipeline or mocked Claude). Each case provides
// a full stem + keyed answer; the runner asserts trigger_found and, for TP cases,
// that the expected contraindication_id appears in triggers[].

export interface StemTriggerCase {
  label: string;
  category: 'true_positive' | 'true_negative' | 'edge_case';
  vignette: string;
  stem: string;
  keyed_answer_text: string;
  keyed_answer_option: 'A' | 'B' | 'C' | 'D' | 'E';
  expected: {
    trigger_found: 'yes' | 'no' | 'unknown';
    matched_intervention_id: string | null;
    // For TPs, any of these contraindication_ids should appear in triggers[]:
    expected_contraindication_ids?: string[];
  };
  rationale: string;
}

export const stemTriggerEvalSet: StemTriggerCase[] = [
  // ─── True positives (3/5 filled — MS4 to author 2 more after completing registry) ───

  {
    label: 'Q2 reconstruction — massive PE + recent orthopedic surgery',
    category: 'true_positive',
    vignette:
      '58-year-old man is brought to the ED 5 days after total hip arthroplasty with sudden ' +
      'shortness of breath, chest pain, and hypotension. HR 128, SBP 82 on norepinephrine drip. ' +
      'JVD present. RV/LV ratio 1.2 on bedside echo. CTA shows saddle embolus.',
    stem: 'Which of the following is the most appropriate next step in management?',
    keyed_answer_text: 'Administer alteplase 100 mg IV over 2 hours',
    keyed_answer_option: 'A',
    expected: {
      trigger_found: 'yes',
      matched_intervention_id: 'thrombolysis_systemic',
      expected_contraindication_ids: ['recent_major_surgery'],
    },
    rationale:
      'Post-op day 5 orthopedic surgery is a relative contraindication to systemic thrombolysis. ' +
      'This is the canonical Q2 bug — CCV must catch it.',
  },

  {
    label: 'Thrombolysis in stroke patient with prior ICH',
    category: 'true_positive',
    vignette:
      '72-year-old woman presents 2 hours after sudden onset of right hemiplegia and aphasia. ' +
      'Medical history notable for a prior intracranial hemorrhage 4 years ago after a fall. ' +
      'NIHSS 18. CT head shows no acute bleed.',
    stem: 'Which of the following is the most appropriate next step?',
    keyed_answer_text: 'IV alteplase',
    keyed_answer_option: 'B',
    expected: {
      trigger_found: 'yes',
      matched_intervention_id: 'thrombolysis_systemic',
      expected_contraindication_ids: ['ich_ever'],
    },
    rationale: 'Prior ICH is absolute contraindication to tPA — must auto-reject to case_planner.',
  },

  {
    label: 'Thrombolysis with aortic dissection disguised as MI',
    category: 'true_positive',
    vignette:
      '64-year-old man presents with tearing chest pain radiating to the back. BP 188/102 in right ' +
      'arm, 142/78 in left arm. Widened mediastinum on CXR. ECG shows ST depression in inferior leads.',
    stem: 'Which of the following is the most appropriate next step?',
    keyed_answer_text: 'Administer tenecteplase',
    keyed_answer_option: 'A',
    expected: {
      trigger_found: 'yes',
      matched_intervention_id: 'thrombolysis_systemic',
      expected_contraindication_ids: ['aortic_dissection_suspected'],
    },
    rationale:
      'Dissection features (tearing pain, pulse differential, widened mediastinum) are absolute ' +
      'contraindication to lysis — this catches the "MI masquerade" trap.',
  },

  // TODO (MS4): add 2 more TP stems once anticoagulation + beta-blocker registry entries are authored.
  // Suggested: (a) therapeutic anticoag in a patient with platelets 18k, (b) beta-blocker in cocaine-induced chest pain.

  // ─── True negatives (2/5 filled) ───

  {
    label: 'Clean thrombolysis case — no contraindications',
    category: 'true_negative',
    vignette:
      '54-year-old man presents 90 minutes after sudden-onset left hemiplegia. BP 152/88. ' +
      'NIHSS 14. CT head shows no bleed. No prior surgeries, no anticoagulants, no recent trauma. ' +
      'INR 1.0.',
    stem: 'Which of the following is the most appropriate next step?',
    keyed_answer_text: 'IV alteplase 0.9 mg/kg',
    keyed_answer_option: 'C',
    expected: {
      trigger_found: 'no',
      matched_intervention_id: 'thrombolysis_systemic',
    },
    rationale: 'Baseline lytic-eligible stroke — must pass cleanly with no triggers.',
  },

  {
    label: 'Observation keyed answer — not an intervention',
    category: 'true_negative',
    vignette:
      '22-year-old woman presents with a 2-day history of mild sore throat, subjective fever, and ' +
      'fatigue. Exam: erythematous pharynx without exudate, anterior cervical lymphadenopathy. ' +
      'Monospot negative, strep rapid negative.',
    stem: 'Which of the following is the most appropriate next step?',
    keyed_answer_text: 'Reassure and observe with symptomatic care',
    keyed_answer_option: 'A',
    expected: {
      trigger_found: 'no',
      matched_intervention_id: null,
    },
    rationale: 'Non-intervention keyed answer — CCV should pass without Claude call (N/A path).',
  },

  // TODO (MS4): add 3 more TN stems across the 5 registered interventions.

  // ─── Edge cases (1/5 filled) ───

  {
    label: 'Alias near-miss — "IV thrombolytic therapy" (paraphrase)',
    category: 'edge_case',
    vignette:
      '62-year-old woman presents with sudden-onset right-sided weakness 1 hour ago. ' +
      'BP 160/95. NIHSS 12. CT shows no bleed. No relevant history.',
    stem: 'Which of the following should be administered first?',
    keyed_answer_text: 'IV thrombolytic therapy',
    keyed_answer_option: 'B',
    expected: {
      // The phrase "IV thrombolytic" doesn't literally contain "alteplase" or "tpa". Token-set
      // against alias "iv thrombolysis" requires tokens {"iv", "thrombolysis"}. Keyed text has
      // {"iv", "thrombolytic", "therapy"} — no match. Expected behavior: pharmacology-class
      // fallback says is_intervention=true, CCV routes to needs_human_review.
      trigger_found: 'unknown',
      matched_intervention_id: null,
    },
    rationale:
      'Tests the fallback path. "IV thrombolytic therapy" is clearly an intervention but our ' +
      'alias tokens don\'t match "thrombolytic". This is a known false-negative zone — routing ' +
      'to human review is the safe outcome. If this becomes a frequent false-positive on clean ' +
      'items, add "thrombolytic" as an alias token.',
  },

  // TODO (MS4): add 4 more edge cases:
  //   - A stem where card.contraindications flags something the registry misses
  //   - A stem with two overlapping contraindications (absolute takes precedence)
  //   - A stem with an unusual phrasing of a real contraindication (tests LLM-inferred path)
  //   - A stem where the keyed answer is a procedure (e.g. "cardioversion") not yet in registry
];

// Convenience: combined export for the runner script.
export const ccvEvalSet = {
  aliasMatcherCases: aliasMatcherEvalSet,
  stemTriggerCases: stemTriggerEvalSet,
};

// ─── Layer 1 self-check helper (pure, no side effects) ───
// The runner script calls this; you can also import and call it from a REPL.

export interface AliasCaseResult {
  label: string;
  passed: boolean;
  expected: string[];
  actual: string[];
  rationale: string;
}

export function runAliasMatcherEval(): AliasCaseResult[] {
  return aliasMatcherEvalSet.map((c) => {
    const matched = findMatchingInterventions(c.keyed_answer);
    const actualIds = matched.map((m) => m.intervention_id).sort();
    const expectedIds = [...c.expected_intervention_ids].sort();
    const passed =
      actualIds.length === expectedIds.length &&
      actualIds.every((id, i) => id === expectedIds[i]);
    return {
      label: c.label,
      passed,
      expected: expectedIds,
      actual: actualIds,
      rationale: c.rationale,
    };
  });
}
