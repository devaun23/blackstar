/**
 * Negative-instruction block injected into vignette-writer (and any future
 * generation agent) prompts to enforce the open-source-or-internal-only
 * constraint at generation time.
 *
 * Operational doc: .claude/skills/source-firewall/SKILL.md
 * Worked example: .claude/skills/source-firewall/cardio-worked-example.md
 */
export const FIREWALL_INSTRUCTIONS = `SOURCE-FIREWALL CONSTRAINTS — read before writing the vignette.

Do NOT reproduce vignette structures, stem openings, distractor sets, or
explanation paraphrases from UWorld, AMBOSS, Bootcamp, Divine, NBME release
items, or any commercial qbank. Construct the clinical scenario from the
supplied guideline facts only. If you find yourself reaching for a phrasing
that feels memorized rather than constructed from the supplied facts, stop
and reframe.

Forbidden stem openings (qbank signatures):
  - "A patient presents with..."
  - "The following patient..."
  - "Which of the following BEST describes..." as a lead-in (NBME does not
     use ALL-CAPS emphasis)

Forbidden vignette constructs:
  - Any patient demographic + clinical-twist combination distinctive enough
    that a competent MS3 could trace it to a specific UWorld or NBME item.
  - "Out-of-town businessman with chest pain" — NBME signature; avoid.
  - "Patient just returned from [country] with [symptom]" unless the
    geographic exposure is medically essential (epidemiology of the dx).

Forbidden distractor patterns:
  - Verbatim copies of UWorld or AMBOSS distractor wording.
  - "Consult [specialty]" as a non-answer when the guideline specifies a
    concrete action.
  - "Reassess in [time]" used as time-waster distractor with the exact
    UWorld phrasing.

If any forbidden pattern would otherwise be the best phrasing, REPLACE it
with construction-from-facts. Better to produce a plainer item than to
echo a qbank.`;
