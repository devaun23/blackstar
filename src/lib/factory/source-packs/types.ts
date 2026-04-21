// ─── Source Pack Type System ───
// Structured evidence format for Tier B guidelines.
// Every atomic item carries provenance, a normalized claim, and dual IDs.

/** Traces a normalized item back to its source document for auditability. */
export interface Provenance {
  section?: string;
  page_or_location?: string;
  quote_snippet?: string;
}

// ─── Atomic Evidence Items ───

export interface Recommendation {
  rec_id: string;
  display_id: string;
  statement: string;
  normalized_claim: string;
  strength: 'strong' | 'conditional' | 'expert_consensus';
  evidence_quality: 'high' | 'moderate' | 'low' | 'very_low';
  context?: string;
  population?: string;
  provenance: Provenance;
}

export interface DiagnosticCriterion {
  criterion_id: string;
  display_id: string;
  name: string;
  components: string[];
  threshold?: string;
  interpretation: string;
  normalized_claim: string;
  provenance: Provenance;
}

export interface Threshold {
  threshold_id: string;
  display_id: string;
  parameter: string;
  value: string;
  unit?: string;
  clinical_meaning: string;
  normalized_claim: string;
  direction: 'above' | 'below' | 'range' | 'present' | 'absent';
  provenance: Provenance;
}

export interface TreatmentStep {
  step_id: string;
  display_id: string;
  action: string;
  normalized_claim: string;
  timing?: string;
  condition?: string;
  contraindications?: string[];
  escalation?: string;
  drug_details?: {
    drug: string;
    dose?: string;
    route?: string;
    duration?: string;
  };
  provenance: Provenance;
}

export interface RedFlag {
  flag_id: string;
  display_id: string;
  finding: string;
  implication: string;
  action: string;
  urgency: 'immediate' | 'urgent' | 'soon';
  provenance: Provenance;
}

export interface SeverityDefinition {
  severity_id: string;
  display_id: string;
  level: string;
  criteria: string[];
  management_implications: string;
  provenance: Provenance;
}

/** Per-drug board-testable pharmacology (v22 — consumed by explanation_writer). */
export interface DrugPharmacology {
  mechanism: string;                         // one clean sentence
  major_side_effects: string[];              // ≥2 that a board would test
  critical_contraindications: string[];      // absolute contraindications
  monitoring: string;                        // labs/vitals/ECG + intervals
  key_interaction: string | null;            // the single most important interaction
}

/** Drug selection guidance — enables drug-comparison decision forks. */
export interface DrugSelection {
  selection_id: string;
  display_id: string;
  indication: string;
  first_line: { drug: string; dose?: string; route?: string; rationale: string };
  alternatives: { drug: string; dose?: string; when: string }[];
  contraindicated: { drug: string; reason: string }[];
  selection_factors?: string[];  // patient factors that change the choice
  pharmacology?: DrugPharmacology;  // v22 board-testable teaching for the first_line drug
  normalized_claim: string;
  provenance: Provenance;
}

// ─── Source Pack ───

export type PackStatus = 'draft' | 'validated' | 'active' | 'superseded';

export interface SourcePack {
  // ─── Identity ───
  source_pack_id: string;
  source_name: string;
  source_registry_id?: string;
  canonical_url: string;
  publication_year: number;
  guideline_body: string;

  // ─── Scope boundaries ───
  topic_tags: string[];
  allowed_decision_scopes: string[];
  excluded_decision_scopes: string[];

  // ─── Structured evidence ───
  recommendations: Recommendation[];
  diagnostic_criteria: DiagnosticCriterion[];
  thresholds: Threshold[];
  treatment_steps: TreatmentStep[];
  red_flags: RedFlag[];
  severity_definitions: SeverityDefinition[];
  drug_selection?: DrugSelection[];

  // ─── Lifecycle ───
  source_pack_version: number;
  status: PackStatus;
  supersedes?: string;
  last_normalized: string;
  normalizer_version: number;
  last_verified_current?: string;
  reviewed_by?: string;

  // ─── Normalization metadata ───
  normalization_notes: string;

  // ─── Index for citation validation ───
  all_item_ids: string[];
  all_display_ids: string[];
}
