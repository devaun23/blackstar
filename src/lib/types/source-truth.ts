// Source-grounded truth contracts (Block B2).
// Defines the lineage chain from source documents to algorithm cards,
// conflict resolution policy, and invalidation rules.

// ---------------------------------------------------------------------------
// Source document — a single guideline, review, or textbook chapter
// ---------------------------------------------------------------------------

export interface SourceDocument {
  canonical_id: string;                   // SRC.{TIER}.{ABBREV}.{YEAR}
  source_registry_id: string;            // FK to source_registry table
  title: string;
  version: string;
  effective_date: string;                 // ISO date
  superseded_by: string | null;           // canonical_id of replacement
  document_type: 'guideline' | 'review' | 'meta_analysis' | 'textbook_chapter' | 'content_outline';
  url: string | null;
}

// ---------------------------------------------------------------------------
// Source excerpt — a specific claim extracted from a document
// ---------------------------------------------------------------------------

export interface SourceExcerpt {
  canonical_id: string;                   // EXPT.{SRC_ID}.{SEQ}
  source_document_id: string;             // FK to SourceDocument.canonical_id
  excerpt_text: string;
  section_reference: string | null;       // e.g. "Table 3, p.12"
  confidence: 'verbatim' | 'paraphrased' | 'synthesized';
}

// ---------------------------------------------------------------------------
// Source reference — links an algorithm card to its supporting excerpts
// ---------------------------------------------------------------------------

export interface SourceRef {
  algorithm_card_id: string;
  source_excerpt_id: string;
  fact_row_id: string | null;
  relevance: 'primary' | 'supporting' | 'context';
}

// ---------------------------------------------------------------------------
// Lineage policy — how invalidation propagates through the chain
// ---------------------------------------------------------------------------
// Chain: source_document → source_excerpt → fact_row → algorithm_card
//        → item_plan → item_draft → validator_report → item_performance

export interface LineagePolicy {
  source_change: 'flag_dependent_cards_for_review';
  card_invalidated: 'kill_dependent_item_plans';
  draft_failed: 'repair_or_kill';
  max_propagation_depth: 'full_chain';
  human_override_required_for: readonly ['killing_published_items', 'promoting_without_source_ref'];
}

export const LINEAGE_POLICY: LineagePolicy = {
  source_change: 'flag_dependent_cards_for_review',
  card_invalidated: 'kill_dependent_item_plans',
  draft_failed: 'repair_or_kill',
  max_propagation_depth: 'full_chain',
  human_override_required_for: ['killing_published_items', 'promoting_without_source_ref'],
};

// ---------------------------------------------------------------------------
// Source conflict resolution policy
// ---------------------------------------------------------------------------

export interface SourceConflictPolicy {
  resolution_hierarchy: readonly string[];
  invalidation_rules: {
    guideline_superseded: 'revalidate_all_dependent_cards';
    source_retracted: 'kill_all_dependent_items';
    conflicting_new_evidence: 'flag_cards_for_review';
  };
}

export const SOURCE_CONFLICT_POLICY: SourceConflictPolicy = {
  resolution_hierarchy: [
    'most_recent_society_guideline',
    'higher_tier_source',
    'higher_evidence_level',
    'flag_for_human_review',
  ],
  invalidation_rules: {
    guideline_superseded: 'revalidate_all_dependent_cards',
    source_retracted: 'kill_all_dependent_items',
    conflicting_new_evidence: 'flag_cards_for_review',
  },
};
