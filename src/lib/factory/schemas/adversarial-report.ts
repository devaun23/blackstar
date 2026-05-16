import { z } from 'zod';

/**
 * Surface-cue families a "smart student" can use to eliminate a distractor
 * *without* knowing the underlying transfer rule. Each cue corresponds to a
 * specific tell that strong NBME items eliminate.
 */
export const eliminationCueEnum = z.enum([
  'length',           // option is markedly longer or shorter than peers
  'register',         // formality/medical-register mismatch (lay phrasing in a clinical option set)
  'specificity',      // one option carries more clinical detail than its peers
  'syntactic_shape',  // parallel structure broken (e.g., one option is the only verb-led phrase)
  'vocabulary',       // jargon density or technical term presence that signals "this is the right one"
  'implausibility',   // option is clinically absurd; eliminable on safety grounds alone
  'category_mismatch',// option belongs to a different action class than its peers (e.g., a dose in a list of tests)
  'absolute_language',// "always" / "never" / "the only" — usually a tell for a wrong absolute claim
]);
export type EliminationCue = z.infer<typeof eliminationCueEnum>;

/**
 * Per-distractor adversarial assessment. The "smart student" agent must reason
 * about each non-correct option independently.
 */
export const distractorEliminabilitySchema = z.object({
  option_id: z.enum(['A', 'B', 'C', 'D', 'E']),
  cues_used: z.array(eliminationCueEnum),     // empty array = nothing tells; distractor survives
  eliminable: z.boolean(),                     // true if cues_used.length > 0 AND the student would act on them
  rationale: z.string().min(10).max(400),      // 1–2 sentences explaining how the student eliminated (or kept) it
});
export type DistractorEliminability = z.infer<typeof distractorEliminabilitySchema>;

/**
 * Adversarial-student output. Combined with the existing ValidatorReport shape
 * so it can flow through the same validator_report table without a schema change.
 *
 *   passed = surviving_distractor_count >= 3 (≥3 of 4 distractors survive)
 *   score  = 10 * (surviving_distractor_count / 4)
 *
 * Cross-references R-OPT-06 (new auto-kill rule, see REJECTION_RULES.md).
 */
export const adversarialStudentReportSchema = z.object({
  per_distractor_eliminability: z.array(distractorEliminabilitySchema).length(4), // 4 distractors (not 5 — the correct is excluded)
  surviving_distractor_count: z.number().int().min(0).max(4),
  eliminability_cues_flagged: z.array(eliminationCueEnum),     // union of cues seen across all distractors
  weakest_distractor: z.enum(['A', 'B', 'C', 'D', 'E']),       // the distractor with the most cues used
  passed: z.boolean(),
  score: z.number().min(0).max(10),
  issues_found: z.array(z.string()),
  repair_instructions: z.string().nullable().optional(),
});
export type AdversarialStudentReport = z.infer<typeof adversarialStudentReportSchema>;

/**
 * Jury battle-test output. A second model (GPT or Gemini) attempts the question
 * and reports its choice + reasoning. We classify the verdict.
 *
 *   right-reason  — picked the keyed answer for the keyed reason (PASS)
 *   wrong-reason  — picked the keyed answer but for a non-keyed reason (FAIL —
 *                   means the question is correct by coincidence, not by craft)
 *   wrong-answer  — picked a non-keyed answer (FAIL — and which distractor
 *                   matters: if it's primary_competitor for the named cognitive
 *                   error, the trap worked. If it's any other, the trap missed.)
 */
export const juryVerdictEnum = z.enum(['right-reason', 'wrong-reason', 'wrong-answer']);
export type JuryVerdict = z.infer<typeof juryVerdictEnum>;

export const juryReportSchema = z.object({
  jury_model: z.string().min(1),                            // e.g., "gpt-5", "gemini-2.5-pro"
  jury_chosen_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  jury_reasoning_trace: z.string().min(50).max(2000),       // the chain-of-thought the jury produced
  jury_verdict: juryVerdictEnum,
  matched_keyed_archetype: z.enum([
    'correct', 'primary_competitor', 'near_miss', 'zebra', 'implausible', 'neutral',
  ]).nullable(),                                            // which archetype the jury's pick maps to (if known)
  passed: z.boolean(),                                       // jury_verdict === 'right-reason'
  score: z.number().min(0).max(10),                          // 10 right-reason, 5 wrong-reason, 0 wrong-answer
  issues_found: z.array(z.string()),
  repair_instructions: z.string().nullable().optional(),
});
export type JuryReport = z.infer<typeof juryReportSchema>;
