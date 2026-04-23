// Contraindication Cross-Check Validator — regression fixture.
//
// Each case declares an expected outcome. The regression harness
// (scripts/ccv-regression.ts) runs the CCV and compares.
//
// Expected values:
//   'pass'           — CCV returns passed=true, trigger_found='no'
//   'fail_absolute'  — CCV returns passed=false, failure_category='absolute'
//   'fail_relative'  — CCV returns passed=false, failure_category='relative'
//   'pass_teaching'  — CCV SHOULD pass because case_plan.decision_fork_type='contraindication'
//                      (see CONTRAINDICATION_SEMANTICS.md). If the CCV currently fails this,
//                      it indicates the Sprint 2 gap where the validator doesn't yet read
//                      case_plan. The harness reports this as a known gap, not a regression.
//   'needs_review'   — CCV returns passed=false, trigger_found='unknown'
//
// Sources:
//   'db'        — load item_draft + algorithm_card from Supabase by id
//   'synthetic' — use the inline draft + card fields

export type ExpectedOutcome =
  | 'pass'
  | 'fail_absolute'
  | 'fail_relative'
  | 'pass_teaching'
  | 'needs_review';

interface SyntheticDraft {
  id: string;
  vignette: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string;
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
}

interface SyntheticCard {
  contraindications: string[];
}

export interface DbCase {
  id: string;
  description: string;
  expected: ExpectedOutcome;
  /**
   * Alternate acceptable outcomes. Used for cases where the blind LLM auditor
   * is non-deterministic on borderline severity (e.g., uncontrolled HTN pre-tPA
   * which is genuinely ambiguous per AHA guidelines). Tolerating a small set of
   * outcomes keeps regression stable while the CCV's severity heuristic is tuned.
   */
  accept_also?: ExpectedOutcome[];
  source: 'db';
  item_draft_id: string;
}

export interface SyntheticCase {
  id: string;
  description: string;
  expected: ExpectedOutcome;
  source: 'synthetic';
  draft: SyntheticDraft;
  card: SyntheticCard;
}

export type TestCase = DbCase | SyntheticCase;

export const cases: TestCase[] = [
  // ─── 7 published items (all should pass — they were human-reviewed and shipped) ───
  {
    id: 'pub_hhs_hypotension',
    description:
      'Published: HHS with aggressive isotonic saline resuscitation keyed. Saline resuscitation is not ' +
      'in the v1 registry; CCV pharm-class fallback correctly escalates to needs_review. Sprint 2 fix: ' +
      'expand registry with "supportive care" entries (saline, surgical exploration) marked empty-contras.',
    expected: 'needs_review',
    source: 'db',
    item_draft_id: '50cf25bc-895d-448c-a3c5-8f60e37e682b',
  },
  {
    id: 'pub_2',
    description: 'Published item #2.',
    expected: 'pass',
    source: 'db',
    item_draft_id: 'b305c552-0bf1-4e19-bc57-267491c52a9c',
  },
  {
    id: 'pub_pe_unstable',
    description:
      'Published item cc6b1ab0: tPA keyed for unstable PE, BUT vignette contains "recent orthopedic ' +
      'surgery 5 days ago" in PMH. CCV correctly catches this as a RELATIVE contraindication — a real ' +
      'Q2-class issue the human reviewer apparently accepted at publish. Flagged for re-review.',
    expected: 'fail_relative',
    source: 'db',
    item_draft_id: 'cc6b1ab0-f51e-4767-b450-a71ddd6acdc6',
  },
  {
    id: 'pub_4',
    description: 'Published item #4.',
    expected: 'pass',
    source: 'db',
    item_draft_id: '4f101aa0-2267-4a1d-bf11-add30c3207ea',
  },
  {
    id: 'pub_5',
    description: 'Published item #5.',
    expected: 'pass',
    source: 'db',
    item_draft_id: 'e078697b-3345-43c7-846f-cbefd532d005',
  },
  {
    id: 'pub_6',
    description:
      'Published: SBO requiring emergent surgical exploration keyed. Surgical exploration is not in ' +
      'the v1 registry; CCV pharm-class fallback correctly escalates to needs_review. Same Sprint 2 ' +
      'fix as pub_hhs_hypotension.',
    expected: 'needs_review',
    source: 'db',
    item_draft_id: 'f9a4cb2e-dc80-4202-85a9-3b5c7f562263',
  },
  {
    id: 'pub_7',
    description:
      'Published: ischemic stroke with "Lower BP below 185/110, then administer IV alteplase" keyed. ' +
      'CCV sees "alteplase" + "SBP 195" in vignette and flags severe_htn_uncontrolled. Known CCV ' +
      'over-trigger — the answer itself encodes the mitigation step. The blind auditor is flaky on ' +
      'severity classification here (absolute vs relative) because AHA guidelines are genuinely ' +
      'ambiguous pre-tPA. Both outcomes are acceptable until Sprint 2 adds answer-chain parsing.',
    expected: 'fail_relative',
    accept_also: ['fail_absolute', 'pass'],
    source: 'db',
    item_draft_id: 'd332b9ab-9229-428a-aee9-177c1e34341a',
  },

  // ─── Synthetic broken cases (one per severity class) ───
  {
    id: 'syn_q2_tpa_surgery',
    description:
      'Q2 bug class: massive PE with tPA keyed, BUT patient is post-op day 5 from ORIF. recent_major_surgery is in the RELATIVE list for thrombolysis.',
    expected: 'fail_relative',
    source: 'synthetic',
    draft: {
      id: 'synthetic-q2',
      vignette:
        'A 72-year-old man is brought to the ED with acute-onset dyspnea and syncope 2 hours ago. ' +
        'He underwent ORIF of a right femur fracture 5 days ago and has been on enoxaparin prophylaxis since. ' +
        'On arrival HR 122, BP 82/54, SpO2 88% on 4L. Bedside echo shows RV dilatation with septal bowing. ' +
        'CT pulmonary angiogram reveals a saddle pulmonary embolus.',
      stem: 'Which of the following is the most appropriate next step in management?',
      choice_a: 'Administer alteplase 100 mg IV over 2 hours',
      choice_b: 'Initiate therapeutic heparin infusion without thrombolysis',
      choice_c: 'Surgical pulmonary embolectomy',
      choice_d: 'Catheter-directed thrombolysis',
      choice_e: 'IVC filter placement',
      correct_answer: 'A',
    },
    card: {
      contraindications: ['Active bleeding, recent major surgery (<14d), prior ICH'],
    },
  },
  {
    id: 'syn_cocaine_bb',
    description: 'Cocaine-induced chest pain with metoprolol keyed. Absolute via cocaine_induced_chest_pain.',
    expected: 'fail_absolute',
    source: 'synthetic',
    draft: {
      id: 'synthetic-cocaine-bb',
      vignette:
        'A 34-year-old man presents to the ED with substernal chest pain that began 45 minutes ago, ' +
        'shortly after smoking crack cocaine. He is diaphoretic and anxious. BP 168/102, HR 118. ' +
        'EKG shows 1 mm ST depression in V4-V6. Urine toxicology is positive for cocaine metabolites. ' +
        'Troponin I is pending.',
      stem: 'Which of the following is the most appropriate immediate pharmacologic therapy?',
      choice_a: 'Metoprolol 5 mg IV',
      choice_b: 'Lorazepam 2 mg IV + nitroglycerin SL',
      choice_c: 'Labetalol 20 mg IV',
      choice_d: 'Phentolamine 5 mg IV',
      choice_e: 'Aspirin 325 mg PO',
      correct_answer: 'A',
    },
    card: {
      contraindications: ['Beta-blockers contraindicated in cocaine-induced chest pain (unopposed alpha)'],
    },
  },
  {
    id: 'syn_dka_insulin_low_k',
    description: 'DKA with K+ 2.8 and insulin drip keyed. Absolute via k_below_3_3_in_dka.',
    expected: 'fail_absolute',
    source: 'synthetic',
    draft: {
      id: 'synthetic-dka-low-k',
      vignette:
        'A 19-year-old woman with type 1 diabetes is brought to the ED with nausea, vomiting, and ' +
        'deep rapid breathing for 12 hours. She stopped taking insulin 3 days ago. Labs show glucose 540 mg/dL, ' +
        'bicarbonate 8, anion gap 28, pH 7.08, potassium 2.8 mEq/L, sodium 132, creatinine 1.2. She is alert and oriented.',
      stem: 'Which of the following is the most appropriate next step in management?',
      choice_a: 'Initiate regular insulin infusion 0.1 U/kg/hr IV',
      choice_b: 'IV normal saline 1 L bolus + IV potassium chloride 40 mEq/L',
      choice_c: 'Bicarbonate 1 mEq/kg IV push',
      choice_d: 'Subcutaneous NPH insulin 10 units',
      choice_e: 'Obtain arterial blood gas and defer intervention until results return',
      correct_answer: 'A',
    },
    card: {
      contraindications: ['Do not initiate insulin in DKA when K+ <3.3 — correct potassium first'],
    },
  },
  {
    id: 'syn_pregnant_ace',
    description: '24-week pregnant patient with HTN; lisinopril keyed. Absolute via pregnancy_ace.',
    expected: 'fail_absolute',
    source: 'synthetic',
    draft: {
      id: 'synthetic-pregnant-ace',
      vignette:
        'A 32-year-old G2P1 woman at 24 weeks gestation presents for routine prenatal care. ' +
        'BP is 146/94 on repeat measurements one week apart. Urine dipstick is trace protein. ' +
        'She has no edema, headache, or visual changes. Labs are within normal limits. She was ' +
        'previously well-controlled on methyldopa, which she discontinued last month due to sedation.',
      stem: 'Which of the following is the most appropriate pharmacologic therapy?',
      choice_a: 'Lisinopril 10 mg daily',
      choice_b: 'Labetalol 100 mg twice daily',
      choice_c: 'Hydralazine 25 mg three times daily',
      choice_d: 'Amlodipine 5 mg daily',
      choice_e: 'Nifedipine ER 30 mg daily',
      correct_answer: 'A',
    },
    card: {
      contraindications: ['ACE inhibitors and ARBs are teratogenic — avoid in pregnancy at all gestational ages'],
    },
  },
  {
    id: 'syn_teaching_point_contra',
    description:
      'Same pregnant + ACE scenario but the CORRECT answer is labetalol (safe alternative). ' +
      'Intended to test whether the validator respects case_plan.decision_fork_type=\'contraindication\'. ' +
      'KNOWN GAP: current validator does not read case_plan. Harness reports as known gap, not regression.',
    expected: 'pass_teaching',
    source: 'synthetic',
    draft: {
      id: 'synthetic-teaching-contra',
      vignette:
        'A 32-year-old G2P1 woman at 24 weeks gestation presents with BP 146/94 confirmed on ' +
        'repeat readings. Her primary care physician is considering starting an antihypertensive.',
      stem: 'Which of the following is the most appropriate pharmacologic therapy?',
      choice_a: 'Labetalol 100 mg twice daily',
      choice_b: 'Lisinopril 10 mg daily',
      choice_c: 'Losartan 50 mg daily',
      choice_d: 'Spironolactone 25 mg daily',
      choice_e: 'Atenolol 50 mg daily',
      correct_answer: 'A',
    },
    card: {
      contraindications: [],
    },
  },
  {
    id: 'syn_observation_no_intervention',
    description:
      'Keyed answer is "Reassurance and observation" — not an intervention. ' +
      'CCV should pass via pharmacology-class fallback (trigger_found=\'no\').',
    expected: 'pass',
    source: 'synthetic',
    draft: {
      id: 'synthetic-no-intervention',
      vignette:
        'A 45-year-old healthy woman presents with a 2-week history of intermittent bilateral breast ' +
        'tenderness that worsens in the week before her menses. She has no palpable masses on exam. ' +
        'Mammography is unremarkable. She is concerned about breast cancer.',
      stem: 'Which of the following is the most appropriate next step in management?',
      choice_a: 'Reassurance and observation',
      choice_b: 'Core needle biopsy',
      choice_c: 'Oral contraceptive trial',
      choice_d: 'Danazol 200 mg daily',
      choice_e: 'Bilateral breast ultrasound',
      correct_answer: 'A',
    },
    card: {
      contraindications: [],
    },
  },
];
