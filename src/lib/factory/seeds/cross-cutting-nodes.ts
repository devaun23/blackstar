/**
 * Cross-cutting blueprint nodes (A3).
 *
 * These four buckets are systematically under-tested in student-built decks
 * yet appear on the NBME Step 2 CK content outline. They don't fit cleanly
 * into the disease-centric `MedicineNodeSpec` shape (no `disease_family`,
 * no `presentation_pattern`, no `suppression_style`), so they're seeded
 * directly as `BlueprintNodeInput` rows and concatenated into
 * `blueprintNodes` alongside the disease-centric medicine nodes.
 *
 * See BLACKSTAR_BLUEPRINT_COVERAGE.md for the rationale.
 */

import type { BlueprintNodeInput } from '@/lib/factory/schemas';
import type { TaskType, ClinicalSetting, AgeGroup, TimeHorizon, YieldTier } from '@/lib/types/database';

type Node = Omit<BlueprintNodeInput, 'shelf'>;

function node(
  system: string,
  topic: string,
  subtopic: string | null,
  task_type: TaskType,
  clinical_setting: ClinicalSetting,
  age_group: AgeGroup,
  time_horizon: TimeHorizon,
  yield_tier: YieldTier,
  frequency_score: number,
): Node {
  return {
    system,
    topic,
    ...(subtopic ? { subtopic } : {}),
    task_type,
    clinical_setting,
    age_group,
    time_horizon,
    yield_tier,
    frequency_score,
  };
}

// ─── Geriatrics — cross-cutting ──────────────────────────────────────────────
//
// Falls, polypharmacy, drug clearance, frailty, end-of-life planning. These
// have a clinical fork ("manage X in an 82-year-old vs a 52-year-old?") but
// the underlying mechanism varies by case — what makes them their own bucket
// is that the *age* IS the hinge.

const GERIATRICS_NODES: Node[] = [
  node('Geriatrics', 'Falls Assessment', 'Multifactorial Workup',
    'next_step', 'outpatient', 'elderly', 'days', 'tier_1', 75),
  node('Geriatrics', 'Polypharmacy', 'Beers Criteria',
    'next_step', 'outpatient', 'elderly', 'chronic', 'tier_1', 72),
  node('Geriatrics', 'Drug Clearance in Elderly', 'Renal/Hepatic Dose Adjustment',
    'next_step', 'inpatient', 'elderly', 'days', 'tier_1', 68),
  node('Geriatrics', 'Frailty Syndrome', null,
    'risk_identification', 'outpatient', 'elderly', 'chronic', 'tier_2', 60),
  node('Geriatrics', 'End-of-Life Care Planning', 'Goals of Care',
    'next_step', 'inpatient', 'elderly', 'days', 'tier_1', 70),
  node('Geriatrics', 'Delirium vs Dementia', 'Acute on Chronic',
    'diagnosis', 'inpatient', 'elderly', 'hours', 'tier_1', 78),
];

// ─── Ethics & Communication ─────────────────────────────────────────────────
//
// Informed consent, capacity, advance directives, breaking bad news,
// conflicts of interest. All `next_step` task type — "what should the
// physician do?" — with capacity / disclosure / autonomy frameworks.

const ETHICS_NODES: Node[] = [
  node('Ethics & Communication', 'Informed Consent', 'Elements',
    'next_step', 'inpatient', 'middle_aged', 'immediate', 'tier_1', 75),
  node('Ethics & Communication', 'Decisional Capacity', 'Capacity Assessment',
    'next_step', 'inpatient', 'elderly', 'hours', 'tier_1', 72),
  node('Ethics & Communication', 'Advance Directives', 'Surrogate Decision Maker',
    'next_step', 'inpatient', 'elderly', 'days', 'tier_1', 68),
  node('Ethics & Communication', 'Breaking Bad News', 'SPIKES Protocol',
    'next_step', 'outpatient', 'middle_aged', 'immediate', 'tier_2', 60),
  node('Ethics & Communication', 'Confidentiality & Disclosure', 'Mandatory Reporting',
    'next_step', 'outpatient', 'young_adult', 'immediate', 'tier_1', 65),
  node('Ethics & Communication', 'Conflicts of Interest', 'Industry Relationships',
    'next_step', 'outpatient', 'middle_aged', 'chronic', 'tier_2', 55),
];

// ─── Patient Safety / Quality Improvement ───────────────────────────────────
//
// Handoffs, root-cause analysis, near-miss reporting, error disclosure,
// sentinel events, medication reconciliation. Part of Step 2 CK content
// outline; UWorld covers all of these; student-built decks usually don't.

const PATIENT_SAFETY_NODES: Node[] = [
  node('Patient Safety', 'Handoff Communication', 'IPASS Framework',
    'next_step', 'inpatient', 'middle_aged', 'immediate', 'tier_1', 65),
  node('Patient Safety', 'Root-Cause Analysis', 'Sentinel Event Workflow',
    'complication_recognition', 'inpatient', 'middle_aged', 'days', 'tier_2', 58),
  node('Patient Safety', 'Medical Error Disclosure', 'Open Disclosure Conversation',
    'next_step', 'inpatient', 'middle_aged', 'hours', 'tier_1', 62),
  node('Patient Safety', 'Medication Reconciliation', 'Transitions of Care',
    'next_step', 'inpatient', 'elderly', 'hours', 'tier_1', 70),
  node('Patient Safety', 'Near-Miss Reporting', 'Just-Culture Framework',
    'next_step', 'inpatient', 'middle_aged', 'days', 'tier_2', 55),
  node('Patient Safety', 'Hospital-Acquired Conditions', 'CAUTI / CLABSI Prevention',
    'complication_recognition', 'inpatient', 'elderly', 'days', 'tier_1', 68),
];

// ─── Biostatistics & Epidemiology ───────────────────────────────────────────
//
// Sensitivity/specificity, PPV/NPV, likelihood ratios, study design,
// NNT/NNH, bias types. These are tested with calculation vignettes; the
// closest existing TaskType match is `risk_identification` for "interpret
// the screening result" stems and `diagnostic_test` for "which test
// performs best" stems.

const BIOSTATS_NODES: Node[] = [
  node('Biostatistics & Epidemiology', 'Sensitivity & Specificity', 'Screening Interpretation',
    'risk_identification', 'outpatient', 'middle_aged', 'immediate', 'tier_1', 72),
  node('Biostatistics & Epidemiology', 'PPV & NPV', 'Pre-test Probability',
    'risk_identification', 'outpatient', 'middle_aged', 'immediate', 'tier_1', 70),
  node('Biostatistics & Epidemiology', 'Likelihood Ratios', 'Bayesian Reasoning',
    'risk_identification', 'outpatient', 'middle_aged', 'immediate', 'tier_2', 62),
  node('Biostatistics & Epidemiology', 'Study Design Identification', 'Case-Control vs Cohort vs RCT',
    'diagnostic_test', 'outpatient', 'middle_aged', 'immediate', 'tier_1', 75),
  node('Biostatistics & Epidemiology', 'NNT & NNH', 'Absolute Risk Reduction',
    'risk_identification', 'outpatient', 'middle_aged', 'chronic', 'tier_2', 58),
  node('Biostatistics & Epidemiology', 'Bias & Confounding', 'Selection / Recall / Lead-time',
    'risk_identification', 'outpatient', 'middle_aged', 'immediate', 'tier_1', 68),
];

export const CROSS_CUTTING_BLUEPRINT_NODES: BlueprintNodeInput[] = [
  ...GERIATRICS_NODES,
  ...ETHICS_NODES,
  ...PATIENT_SAFETY_NODES,
  ...BIOSTATS_NODES,
].map((n) => ({ shelf: 'medicine' as const, ...n }));
