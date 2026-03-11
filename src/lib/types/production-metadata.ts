// Production metadata types (Block B7).
// Psychometrics, lifecycle, versioning, observability, and release thresholds.
// These types are future-compatible — they define shapes that will be
// populated as the pipeline matures past Phase 1.5.

// ---------------------------------------------------------------------------
// Release thresholds — quantitative gates for the production pipeline
// ---------------------------------------------------------------------------

export interface ReleaseThresholds {
  // Validator gates
  validator_pass_score: number;
  medical_validator_consecutive_fail_limit: number;

  // Source grounding
  min_source_refs_per_card: number;
  min_competing_paths_per_tier1_card: number;

  // Gold harness
  gold_harness_min_pass_rate: number;

  // Duplicate detection
  duplicate_similarity_auto_flag: number;
  max_same_disease_family_per_session: number;
  max_blueprint_quota_deviation_pct: number;

  // Shadow-to-live promotion
  shadow_min_exposures: number;
  shadow_min_discrimination: number;
  shadow_p_value_range: [number, number];
  shadow_min_distractor_selection: number;

  // Repair limits (from REPAIR_POLICY.md)
  max_repair_cycles: number;
  identical_repair_output: 'kill';

  // All thresholds are provisional and adjustable
  _provisional: boolean;
}

export const DEFAULT_RELEASE_THRESHOLDS: ReleaseThresholds = {
  validator_pass_score: 7.0,
  medical_validator_consecutive_fail_limit: 2,
  min_source_refs_per_card: 1,
  min_competing_paths_per_tier1_card: 2,
  gold_harness_min_pass_rate: 0.90,
  duplicate_similarity_auto_flag: 0.85,
  max_same_disease_family_per_session: 2,
  max_blueprint_quota_deviation_pct: 15,
  shadow_min_exposures: 50,
  shadow_min_discrimination: 0.15,
  shadow_p_value_range: [0.30, 0.85],
  shadow_min_distractor_selection: 0.05,
  max_repair_cycles: 3,
  identical_repair_output: 'kill',
  _provisional: true,
};

// ---------------------------------------------------------------------------
// Extended item status — full lifecycle beyond the current ItemStatus enum
// ---------------------------------------------------------------------------

export type ExtendedItemStatus =
  | 'draft'
  | 'validating'
  | 'passed'
  | 'failed'
  | 'repaired'
  | 'published'
  | 'shadow'
  | 'calibrated'
  | 'live'
  | 'degraded'
  | 'retired'
  | 'killed';

// ---------------------------------------------------------------------------
// Item psychometrics — statistical properties from student responses
// ---------------------------------------------------------------------------

export interface ItemPsychometrics {
  item_draft_id: string;
  p_value: number | null;                  // Proportion correct
  discrimination: number | null;           // Point-biserial correlation
  choice_distribution: Record<string, number> | null;  // A-E selection rates
  median_time_seconds: number | null;
  sample_size: number;
  last_computed_at: string;                // ISO date
}

// ---------------------------------------------------------------------------
// Review task — human review assignment
// ---------------------------------------------------------------------------

export interface ReviewTask {
  id: string;
  target_type: 'algorithm_card' | 'item_draft' | 'source_document';
  target_id: string;
  reviewer_id: string | null;
  decision: 'pending' | 'approved' | 'rejected' | 'needs_revision' | null;
  override_reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ---------------------------------------------------------------------------
// Content version — tracks changes to versioned objects
// ---------------------------------------------------------------------------

export interface ContentVersion {
  target_type: 'algorithm_card' | 'item_draft' | 'blueprint_node';
  target_id: string;
  version_number: number;
  change_summary: string;
  changed_by: 'system' | 'human';
  created_at: string;
}

// ---------------------------------------------------------------------------
// Duplicate cluster — groups of near-duplicate items
// ---------------------------------------------------------------------------

export interface DuplicateCluster {
  item_ids: string[];
  similarity_type: 'vignette_overlap' | 'hinge_overlap' | 'answer_set_overlap';
  score: number;
  resolution: 'pending' | 'kept_first' | 'merged' | 'all_kept' | null;
}

// ---------------------------------------------------------------------------
// Teaching explanation — structured explanation for student learning
// ---------------------------------------------------------------------------

export interface TeachingExplanation {
  item_draft_id: string;
  correctness_rationale: string;
  hinge_explanation: string;
  decision_path_walkthrough: string;
  distractor_reconciliation: Record<string, string>;  // choice → why it's wrong
  takeaway_rule: string;
}

// ---------------------------------------------------------------------------
// Telemetry event types — for pipeline observability
// ---------------------------------------------------------------------------

export type TelemetryEventType =
  | 'blueprint_selected'
  | 'source_loaded'
  | 'algorithm_generated'
  | 'algorithm_validated'
  | 'item_planned'
  | 'draft_generated'
  | 'validator_passed'
  | 'validator_failed'
  | 'human_approved'
  | 'item_shadowed'
  | 'item_promoted'
  | 'item_degraded'
  | 'item_retired'
  | 'duplicate_detected'
  | 'source_conflict_detected';

export interface TelemetryEvent {
  event_type: TelemetryEventType;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}
