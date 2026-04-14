# Blackstar Architecture vNext

## Diagnosis

Blackstar has two complete subsystems that have never been connected:

1. **Item Factory** — 15 agents, 2 pipeline versions, 6 validators, repair cycles.
   Generates questions. Never validated at scale.

2. **Learning Engine** — 6-dimension mastery model, Bayesian smoothing, spaced repetition,
   diagnostic repair routing (5 actions), metacognitive calibration, session management, full study UI.
   Adapts to students. Has no validated content to serve.

The gap is not "missing systems." It is **missing connective tissue:**
- Confusion sets that link related clinical scenarios
- Transfer rules that test the same principle across contexts
- Pattern families that name recurring NBME structures
- Difficulty calibration that feeds back from student performance to question selection
- The full validator gauntlet running in the terminal (not just medical_validator)
- Score prediction based on mastery trajectories

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 5: OUTCOME LOOP                        │
│  Score predictor · Calibration feedback · Outcome tracking      │
├─────────────────────────────────────────────────────────────────┤
│                    LAYER 4: DELIVERY ENGINE                     │
│  Session manager · Adaptive selector · Repair router            │
│  (EXISTS: selector.ts, repair-engine.ts, scheduler.ts)          │
├─────────────────────────────────────────────────────────────────┤
│                    LAYER 3: LEARNER MODEL                       │
│  6-dim mastery · Bayesian smoothing · Spaced repetition         │
│  (EXISTS: model.ts, calibration.ts, attempt-v2 pipeline)        │
├─────────────────────────────────────────────────────────────────┤
│                    LAYER 2: CONTENT GRAPH                       │
│  Confusion sets · Transfer rules · Pattern families             │
│  Error taxonomy · Hinge types · Action classes                  │
│  (PARTIAL: error taxonomy seeded, confusion/transfer empty)     │
├─────────────────────────────────────────────────────────────────┤
│                    LAYER 1: ITEM FACTORY                        │
│  Algorithm cards · Pipelines · 15 agents · 6 validators         │
│  (EXISTS: pipeline-v2.ts, all agents, test-factory.ts)          │
└─────────────────────────────────────────────────────────────────┘
```

**The bottleneck is Layer 2.** Everything above and below it is built. Layer 2 is the
reasoning ontology that makes the factory produce adaptive content and the engine deliver
it intelligently. Without it, the factory generates generic questions and the engine
adapts on surface-level dimensions.

---

## Module Specifications

### MODULE 1: Confusion Set Seed Library
**Priority: HIGHEST — everything downstream depends on this**

A confusion set is a family of clinical scenarios that students confuse with each other.
The PE validator failure demonstrated this: PE-vs-postoperative-pain is a confusion set
that requires explicit architecture, not just a good prompt.

```
File: src/lib/factory/seeds/confusion-sets.ts

Interface:
  ConfusionSetSeed {
    name: string                    // "acs_stemi_vs_pericarditis"
    conditions: string[]            // ["STEMI", "Pericarditis", "Aortic dissection"]
    discriminating_clues: {
      condition: string             // "Pericarditis"
      clue: string                  // "Diffuse concave-up ST elevation"
      clue_type: HingeClueType      // "physical_exam_sign"
    }[]
    common_traps: string[]          // ["Anchoring on ST elevation = STEMI"]
    override_rules: string[]        // ["Recent surgery overrides age-adjusted D-dimer"]
    cognitive_errors: string[]      // ["premature_closure", "anchoring"]
    topic: string                   // "Acute Coronary Syndrome"
    yield_tier: "tier_1" | "tier_2" // board frequency
  }

Target: 30-50 confusion sets covering all 20 T1 topics
Each set generates 2-5 contrastive questions via the contrast repair action

Examples:
  - acs_stemi_vs_pericarditis (Cardiology)
  - pe_vs_postop_pain (Pulmonology)
  - dka_vs_starvation_ketosis (Endocrine)
  - chf_exacerbation_vs_pneumonia (Cardiology/Pulm)
  - uti_vs_pyelonephritis (Renal)
  - meningitis_vs_encephalitis (Neuro)
  - appendicitis_vs_ovarian_torsion (Surgery/GYN)
  - dvt_vs_cellulitis (Vascular)
  - gi_bleed_upper_vs_lower (GI)
  - stroke_ischemic_vs_hemorrhagic (Neuro)
```

### MODULE 2: Transfer Rule Seed Library
**Priority: HIGH — enables transfer_test repair action**

A transfer rule is a clinical principle that applies across contexts. Mastery means
applying the rule in novel settings, not just recognizing it in the original context.

```
File: src/lib/factory/seeds/transfer-rules.ts

Interface:
  TransferRuleSeed {
    rule_text: string               // "Unstable patients get stabilized before diagnosed"
    category: string                // "management_priority"
    trigger_pattern: string         // "Hemodynamic instability in any setting"
    action_priority: number         // 1 (highest — stabilize before everything)
    suppressions: string[]          // ["Diagnostic workup", "Definitive treatment"]
    wrong_pathways: {
      pathway: string               // "Order CT scan first"
      error: string                 // "over_testing"
      why_wrong: string             // "Unstable patients decompensate during transport"
    }[]
    contexts: {                     // Where this rule applies
      topic: string                 // "Acute Coronary Syndrome"
      clinical_setting: string      // "ed"
      specific_example: string      // "Cardiogenic shock → IV fluids before cath"
    }[]
    source_citation: string         // "ACLS Guidelines 2020"
  }

Target: 40-60 transfer rules
Each rule spans 2-5 clinical contexts for transfer testing

Examples:
  - "Stabilize before diagnose" (applies: GI bleed, PE, sepsis, trauma)
  - "Empiric antibiotics before culture results in sepsis" (applies: pneumonia, UTI, meningitis)
  - "Age-adjusted D-dimer only valid with low pre-test probability" (applies: PE workup)
  - "Treat the patient, not the lab value" (applies: hyponatremia, mild hyperkalemia)
  - "PCI > fibrinolytics when available within 120 min" (applies: STEMI management)
  - "Contraindications override standard protocols" (applies: tPA for stroke, anticoagulation)
```

### MODULE 3: Pattern Family Library
**Priority: HIGH — names the ~300 recurring NBME patterns**

A pattern family is a named, testable structure that recurs across NBME exams.
Students who master the pattern can recognize it in any topic dress.

```
File: src/lib/factory/seeds/pattern-families.ts

Interface:
  PatternFamilySeed {
    name: string                    // "the_stable_mimic"
    description: string             // "Benign condition that mimics a dangerous one"
    structure: string               // "Present scary symptoms → reveal benign discriminator"
    hinge_type: string              // "lab_pattern" or "physical_exam_sign"
    cognitive_trap: string          // "premature_closure"
    examples: {
      topic: string                 // "Cardiology"
      scenario: string              // "Pericarditis mimicking STEMI"
      hinge: string                 // "Diffuse ST changes, not territorial"
    }[]
    reverse_pattern?: string        // "the_dangerous_mimic" (stable thing that's actually dangerous)
    frequency: "high" | "medium"    // How often this pattern appears on boards
  }

Target: Start with 30 high-frequency patterns, grow to 300

Core pattern families:
  - the_stable_mimic: benign mimics dangerous
  - the_dangerous_mimic: dangerous mimics benign
  - the_time_fork: same condition, different management based on timing
  - the_contraindication_override: standard treatment blocked by patient factor
  - the_severity_escalator: same disease at two severity tiers
  - the_age_switcher: presentation or management changes with age
  - the_pregnant_exception: pregnancy changes standard management
  - the_lab_trap: abnormal lab that doesn't need treatment
  - the_reflex_blocker: standard reflex action blocked by context
  - the_priority_sorter: multiple correct actions, only one is MOST appropriate
  - the_dont_delay: action required before complete information
  - the_watchful_wait: correct answer is observation, not intervention
  - the_subtle_discriminator: two similar conditions split by one finding
  - the_cascade_error: choosing wrong step 1 leads to wrong step 2
  - the_wrong_direction: right diagnosis, wrong intervention direction
```

### MODULE 4: Full Validator Suite in CLI
**Priority: HIGH — the terminal harness only runs medical_validator**

Extend `scripts/test-factory.ts` to run all 6 validators with the same bypass
pattern (inline prompts, direct callClaude, no Supabase).

```
New flag: --validate-full

Runs in parallel:
  1. medical_validator      → clinical accuracy (auto-kill < 3)
  2. blueprint_validator    → topic/task/setting alignment
  3. nbme_quality_validator → hinge placement, cold chart, plausibility
  4. option_symmetry_validator → option class purity, distractor quality
  5. explanation_validator  → decision focus, why_wrong specificity
  6. exam_translation_validator → board-testable fork, not guideline recall

Output: consolidated report card with per-validator scores
Kill decision: any auto-kill → KILLED, all pass → PASSED

Repair loop: if --repair flag, automatically rewrite and re-validate (max 3 cycles)
```

### MODULE 5: Source Precedence Enforcer
**Priority: MEDIUM — prevents the PE-style dangerous failures**

The PE failure happened because "age-adjusted D-dimer" overrode "recent surgery = high risk."
This is a precedence problem: hard contraindications must beat clever heuristics.

```
File: src/lib/factory/seeds/precedence-rules.ts

Interface:
  PrecedenceRuleSeed {
    rule: string                    // "Recent major surgery overrides D-dimer thresholds"
    overrides: string               // "Age-adjusted D-dimer exclusion"
    condition: string               // "Surgery within 4 weeks"
    authority: "absolute" | "strong" | "moderate"
    source: string                  // "Wells score components, ACEP guidelines"
  }

Integration point: case_planner prompt includes precedence rules as constraints.
The skeleton_validator checks that no precedence violation exists in the skeleton.
```

### MODULE 6: Difficulty Calibration Feedback Loop
**Priority: MEDIUM — closes the gap between calibration.ts and selector.ts**

Currently calibration.ts tracks confidence-accuracy alignment but selector.ts
doesn't use difficulty data when choosing questions.

```
Changes to existing files:

selector.ts — selectForDimension():
  Current: picks weakest dimension, finds any matching question
  New: picks weakest dimension, filters by difficulty bracket

  Difficulty brackets based on mastery:
    mastery < 0.3  → easy (clinical_complexity 1-2)
    mastery 0.3-0.6 → medium (clinical_complexity 2-3)
    mastery 0.6-0.8 → hard (clinical_complexity 3-4)
    mastery > 0.8  → expert (clinical_complexity 4-5)

  Requires: item_draft.clinical_complexity field (from case_plan)

calibration.ts → getCalibrationScore():
  Current: returns overconfident/underconfident topics
  New: also returns recommended_difficulty_adjustment per dimension

  If overconfident on topic X → increase difficulty by 1 bracket
  If underconfident on topic X → decrease difficulty by 1 bracket
```

### MODULE 7: Score Predictor
**Priority: LOWER — requires real student data to calibrate**

```
File: src/lib/learner/predictor.ts

Interface:
  PredictedScore {
    shelf: string                   // "medicine"
    predicted_score: number         // 0-100 (percentile)
    confidence_interval: [number, number]  // [low, high]
    dimension_breakdown: {
      dimension: string             // "Cardiology"
      predicted_accuracy: number    // 0-1
      sample_size: number           // attempts on this dimension
      confidence: "high" | "low"    // based on sample size
    }[]
    limiting_factors: string[]      // ["Low mastery on Pulmonology", "High error rate on premature_closure"]
    recommendations: string[]       // ["Focus on PE vs pneumonia confusion set", "Review stabilize-first transfer rule"]
  }

Algorithm:
  1. For each blueprint system, compute weighted mastery:
     system_mastery = avg(topic_mastery, cognitive_error_mastery, confusion_set_mastery)
  2. Weight by system's USMLE frequency: system_weight × system_mastery
  3. Apply calibration adjustment: if overconfident, penalize by (confidence - accuracy)
  4. Aggregate: predicted_score = sum(weighted_mastery) / sum(weights)
  5. Confidence interval: wider with fewer attempts, narrower with more

Requires: minimum 50 attempts across 5+ topics to produce meaningful prediction
```

---

## Build Sequence

### Phase 0: Seed the Reasoning Ontology (CURRENT BLOCKER)
```
0a. Write confusion-sets.ts with 30 sets covering all T1 topics
0b. Write transfer-rules.ts with 40 rules spanning multiple contexts
0c. Write pattern-families.ts with 30 high-frequency patterns
0d. Write precedence-rules.ts with hard override conditions
0e. Add seed route to populate these tables in Supabase
0f. Apply migrations v7-v10 to Supabase
```

### Phase 1: Validate the Full Pipeline in Terminal
```
1a. Add all 6 validators to test-factory.ts (--validate-full)
1b. Add repair loop to test-factory.ts (--repair)
1c. Add explanation writer to test-factory.ts
1d. Run on 3 topics (ACS, PE, DKA) × 3 runs each = 9 questions
1e. Score: pass rate, kill rate, per-validator scores
1f. Gate: pass rate ≥ 40%, no medically dangerous passes
```

### Phase 2: Connect Factory Output to Learner Engine
```
2a. Wire confusion_set_id into case_planner output
2b. Wire transfer_rule_id into case_planner output
2c. Wire pattern_family into skeleton_writer output
2d. Ensure item_draft carries all ontology IDs for learner model updates
2e. Test: generate 3 items, serve them in study mode, verify all 6 dimensions update
```

### Phase 3: Difficulty Calibration Loop
```
3a. Add clinical_complexity to question selection filter in selector.ts
3b. Add difficulty_adjustment to calibration.ts output
3c. Test: simulate 20 attempts, verify difficulty adjusts correctly
```

### Phase 4: Score Predictor (requires Phase 2+3 data)
```
4a. Build predictor.ts with weighted mastery aggregation
4b. Add /api/learner/prediction endpoint
4c. Add prediction display to study UI
```

---

## Success Criteria

| Metric | Target | Measured By |
|--------|--------|-------------|
| Pipeline pass rate | ≥ 40% | test-factory.ts --validate-full |
| Kill rate | 10-30% | test-factory.ts kill tracking |
| Medical accuracy score | ≥ 8.0/10 avg | medical_validator |
| NBME quality score | ≥ 7.0/10 avg | nbme_quality_validator |
| No dangerous passes | 0 | medical_validator auto-kill |
| Confusion sets populated | ≥ 30 | seed count |
| Transfer rules populated | ≥ 40 | seed count |
| Pattern families defined | ≥ 30 | seed count |
| Difficulty adjusts with mastery | verified | integration test |
| All 6 dimensions update on attempt | verified | study flow test |

---

## What NOT to Build Yet

- ML-based difficulty calibration (not enough data)
- Peer comparison / cohort analytics (need users first)
- Learning trajectory prediction (need longitudinal data)
- Graph-based prerequisite learning (premature complexity)
- Automated pattern discovery from generated items (cool but premature)

The system needs validated content and real user data before any of these add value.
Build the ontology, validate the factory, connect the engine. Everything else follows.
