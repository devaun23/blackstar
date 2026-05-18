# Tier-A reference passages — n=1 PE / D-dimer pretest probability

> **Status:** reference text for the Phase A n=1 experiment.
> **Purpose:** injected into `di_context` via temporary di-loader stub. NOT committed to the seed corpus.
> **Compliance:** primary citation is ESC 2019 PE Guidelines (Tier-A, priority 10–22 per `SOURCE_POLICY.md`).
> StatPearls is included as background-only context — not citation of record (StatPearls is not on the
> priority 10–22 allowlist).

---

## PRIMARY SOURCE — Tier-A — citation of record

**Konstantinides SV, Meyer G, et al. 2019 ESC Guidelines for the diagnosis and
management of acute pulmonary embolism developed in collaboration with the European
Respiratory Society (ERS). Eur Heart J. 2020;41(4):543–603.**

source_pack_id: ESC-PE-2019
source_name: ESC PE Guidelines 2019
source_tier: A

### Clinical probability evaluation

The 2019 ESC Guidelines emphasize that assessing pre-test probability is "a key step
in all diagnostic algorithms for PE." This can be accomplished through either
implicit clinical judgment or explicit prediction rules. The two most commonly used
tools are the revised Geneva rule and the Wells rule, both available in simplified
versions.

Clinical probability categorization yields predictable PE confirmation rates: "the
proportion of patients with confirmed PE can be expected to be ∼10% in the
low-probability category, 30% in the moderate-probability category, and 65% in the
high-probability category." When using a two-level classification, approximately 12%
of PE-unlikely patients and 30% of PE-likely patients have confirmed disease.

### D-dimer testing strategy

D-dimer testing serves primarily as an **exclusionary** tool. The Guidelines note
that "the negative predictive value of D-dimer testing is high, and a normal D-dimer
level renders acute PE or DVT unlikely." However, elevated levels lack diagnostic
specificity and cannot confirm PE.

**Age-adjusted cutoffs:** "Use of the age-adjusted (instead of the 'standard'
500 µg/L) D-dimer cut-off increased the number of patients in whom PE could be
excluded from 6.4 to 30%, without additional false-negative findings."

**Probability-adapted cutoffs (YEARS rule):** Higher thresholds (1000 ng/mL) for
PE-unlikely patients and lower thresholds (500 ng/mL) for those with clinical
suspicion. This approach "avoided CTPA in 48% of the included patients...compared to
34% if the Wells rule and a fixed D-dimer threshold of 500 ng/mL would have been
applied."

**Point-of-care testing:** "Sensitivity of 88% (95% CI 83–92%)" — inferior to
laboratory-based testing. Restrict POC use to low pre-test probability patients.

### CTPA in different probability strata

Multidetector CTPA is endorsed as the imaging method of choice, with overall
sensitivity 83% and specificity 96%. Clinical probability **fundamentally influences
interpretation**. The PIOPED II trial demonstrated that "in patients with a low or
intermediate clinical probability of PE, a negative CTPA had a high negative
predictive value for PE (96 and 89%, respectively), but its negative predictive
value was only 60% if the pre-test probability was high."

Conversely, positive CTPA findings carry strong predictive value in intermediate-to-
high probability patients (92–96% PPV) but substantially weaker evidence in
low-probability patients (58% PPV), suggesting that "clinicians should consider
further testing in case of discordance between clinical judgement and the CTPA
result."

The Guidelines conclude that "a negative CTPA result is an adequate criterion for
the exclusion of PE in patients with low or intermediate clinical probability of PE,"
though controversy persists regarding high-probability patients with negative imaging.

### Integration: the rule

D-dimer testing efficiently excludes disease in **lower-probability** populations;
**CTPA provides definitive diagnosis across probability strata** when imaging is
pursued. For **high pre-test probability** patients, the diagnostic strategy bypasses
D-dimer and proceeds to CTPA. Ordering D-dimer in this group is over-testing — a
positive result mandates CTPA regardless, and a negative result is unreliable
(insufficient negative predictive value at high pre-test probability).

---

## BACKGROUND CONTEXT — open-access, not citation of record

**Vyas V, Sankari A, Goyal A. Acute Pulmonary Embolism. StatPearls. Updated December 11, 2024.**

source_pack_id: STATPEARLS-PE-2024
source_name: StatPearls — Acute Pulmonary Embolism
source_tier: (not Tier-A; reference only — do NOT cite as basis for correct answer)

### Wells score parameters (verbatim, for vignette reasoning)

- Clinical symptoms of DVT: 3
- Other diagnoses less likely than pulmonary embolism: 3
- Heart rate >100 bpm: 1.5
- Immobilization for ≥3 days or surgery in the previous 4 weeks: 1.5
- Previous history of DVT or PE: 1.5
- Hemoptysis: 1
- Malignancy: 1

**Risk strata:** High >6 / Moderate 2–6 / Low <2 (traditional)
**Two-level:** PE likely >4 / PE unlikely ≤4 (simplified)

### Test characteristics

- Quantitative ELISA D-dimer: sensitivity ≥95%
- CTPA (PIOPED II): sensitivity 83%, specificity 96%

### Pretest-probability rule (the hinge for this item)

> "A negative ELISA D-dimer and low clinical probability can exclude PE in
> approximately 30% of suspected patients without further testing."

> "CTPA should be performed emergently in patients with a high likelihood of PE."

The transfer rule the item must test: **when pre-test probability is high, D-dimer
should not be ordered — go directly to CTPA.**

---

## Authoring notes (NOT for prompt injection)

1. The right answer must be **"CT pulmonary angiography"** (or equivalent phrasing
   per option_action_class conventions).
2. The hinge clue should be **a Wells-score-elevating constellation**: recent
   surgery + immobility + tachycardia + clinical suspicion. The vignette must NOT
   spell out "Wells score 7" — the test-taker should assemble it.
3. The most dangerous distractor is **"D-dimer"** — this is the over_testing trap
   the rule names.
4. Other distractors should map cleanly to named errors:
   - V/Q scan → wrong_algorithm_branch (V/Q is for contrast contraindications)
   - Lower-extremity duplex → wrong_algorithm_branch (DVT workup as PE surrogate)
   - Chest X-ray → premature_closure / under_triage (won't rule in or out)
5. Provenance stamp at write time:
   `source_pack_id: ESC-PE-2019`
   `source_name: ESC PE Guidelines 2019`
   `source_tier: A`
