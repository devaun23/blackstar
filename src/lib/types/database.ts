// Raw database types matching supabase-schema.sql
// These represent rows as they come from the DB

export type Shelf = 'medicine' | 'surgery' | 'pediatrics' | 'obgyn' | 'psychiatry' | 'family_medicine' | 'neurology' | 'emergency_medicine';
export type TaskType = 'next_step' | 'diagnostic_test' | 'diagnosis' | 'stabilization' | 'risk_identification' | 'complication_recognition';
export type ClinicalSetting = 'outpatient' | 'inpatient' | 'ed' | 'icu';
export type AgeGroup = 'neonate' | 'infant' | 'child' | 'adolescent' | 'young_adult' | 'middle_aged' | 'elderly';
export type TimeHorizon = 'immediate' | 'hours' | 'days' | 'weeks' | 'chronic';
export type YieldTier = 'tier_1' | 'tier_2' | 'tier_3';
export type FactType = 'threshold' | 'drug_choice' | 'contraindication' | 'diagnostic_criterion' | 'risk_factor' | 'complication' | 'management_step';
export type ConfidenceLevel = 'high' | 'moderate' | 'low';
export type ItemStatus = 'draft' | 'validating' | 'passed' | 'failed' | 'repaired' | 'published' | 'killed';
export type ValidatorType = 'medical' | 'blueprint' | 'nbme_quality' | 'option_symmetry' | 'explanation_quality' | 'exam_translation';
export type AgentType = 'blueprint_selector' | 'algorithm_extractor' | 'item_planner' | 'vignette_writer' | 'medical_validator' | 'nbme_quality_validator' | 'blueprint_validator' | 'option_symmetry_validator' | 'explanation_validator' | 'exam_translation_validator' | 'repair_agent' | 'explanation_writer' | 'case_planner' | 'skeleton_writer' | 'skeleton_validator';
export type DimensionType = 'topic' | 'transfer_rule' | 'confusion_set' | 'cognitive_error' | 'action_class' | 'hinge_clue_type';
export type RepairAction = 'advance' | 'reinforce' | 'contrast' | 'remediate' | 'transfer_test';
export type CardStatus = 'draft' | 'truth_verified' | 'translation_verified' | 'generation_ready' | 'retired';
export type PipelineStatus = 'running' | 'completed' | 'failed' | 'killed';
export type SessionMode = 'retention' | 'training' | 'assessment';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type UserRole = 'student' | 'admin';
export type SourceUse = 'scope' | 'content';
export type CorrectAnswer = 'A' | 'B' | 'C' | 'D' | 'E';
export type ReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'needs_revision';

// --- Row types ---

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  target_score: number | null;
  study_goals: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlueprintNodeRow {
  id: string;
  shelf: Shelf;
  system: string;
  topic: string;
  subtopic: string | null;
  task_type: TaskType;
  clinical_setting: ClinicalSetting;
  age_group: AgeGroup;
  time_horizon: TimeHorizon;
  yield_tier: YieldTier;
  frequency_score: number | null;
  discrimination_score: number | null;
  content_system_id: string | null;
  published_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlgorithmCardRow {
  id: string;
  blueprint_node_id: string;
  status: CardStatus;
  entry_presentation: string;
  competing_paths: string[];
  hinge_feature: string;
  correct_action: string;
  contraindications: string[];
  source_citations: string[];
  time_horizon: string | null;
  severity_markers: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface FactRowRow {
  id: string;
  algorithm_card_id: string;
  fact_type: FactType;
  fact_text: string;
  threshold_value: string | null;
  source_name: string;
  source_tier: 'A' | 'B' | 'C';
  confidence: ConfidenceLevel;
  created_at: string;
}

export interface ItemPlanRow {
  id: string;
  algorithm_card_id: string;
  blueprint_node_id: string;
  target_hinge: string;
  competing_options: string[];
  target_cognitive_error: string;
  noise_elements: string[];
  option_class: string;
  distractor_rationale: string;
  created_at: string;
}

export interface ItemDraftRow {
  id: string;
  item_plan_id: string;
  blueprint_node_id: string;
  pipeline_run_id: string | null;
  status: ItemStatus;
  version: number;
  vignette: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string;
  correct_answer: CorrectAnswer;
  why_correct: string;
  why_wrong_a: string | null;
  why_wrong_b: string | null;
  why_wrong_c: string | null;
  why_wrong_d: string | null;
  why_wrong_e: string | null;
  high_yield_pearl: string | null;
  reasoning_pathway: string | null;
  decision_hinge: string | null;
  competing_differential: string | null;
  visual_specs: unknown[] | null;
  // v8 FKs
  case_plan_id: string | null;
  question_skeleton_id: string | null;
  // v9 5-component explanation
  explanation_decision_logic: string | null;
  explanation_hinge_id: string | null;
  explanation_error_diagnosis: Record<string, unknown> | null;
  explanation_transfer_rule: string | null;
  explanation_teaching_pearl: string | null;
  repair_count: number;
  // v15: Human review queue
  review_status: ReviewStatus | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidatorReportRow {
  id: string;
  item_draft_id: string;
  validator_type: ValidatorType;
  passed: boolean;
  score: number | null;
  issues_found: string[];
  repair_instructions: string | null;
  raw_output: Record<string, unknown> | null;
  created_at: string;
}

export interface ErrorTaxonomyRow {
  id: string;
  error_name: string;
  definition: string;
  explanation_template: string;
  example_scenario: string | null;
  // v7 structured fields
  category: string | null;
  frequency_rank: number | null;
  detection_prompt: string | null;
  repair_strategy: string | null;
  created_at: string;
}

export interface SourceRegistryRow {
  id: string;
  category: string;
  name: string;
  allowed_use: SourceUse;
  priority_rank: number;
  url: string | null;
  notes: string | null;
  created_at: string;
}

export type UspstfGrade = 'A' | 'B' | 'C' | 'D' | 'I';

export interface UspstfScreeningRow {
  id: string;
  display_id: string;
  condition: string;
  screening_test: string;
  sex: string | null;
  age_start: number | null;
  age_end: number | null;
  risk_group: string | null;
  population_detail: string | null;
  grade: UspstfGrade;
  is_recommended: boolean;
  frequency_text: string | null;
  frequency_months: number | null;
  special_notes: string | null;
  topic_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ItemPerformanceRow {
  id: string;
  item_draft_id: string;
  total_attempts: number;
  correct_count: number;
  accuracy_rate: number | null;
  avg_time_seconds: number | null;
  distractor_distribution: Record<string, number> | null;
  discrimination_index: number | null;
  flagged_for_review: boolean;
  retired: boolean;
  updated_at: string;
}

export interface AgentLogEntry {
  agent: AgentType;
  started_at: string;
  completed_at: string | null;
  tokens_used: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface PipelineRunRow {
  id: string;
  blueprint_node_id: string | null;
  status: PipelineStatus;
  current_agent: AgentType | null;
  agent_log: AgentLogEntry[];
  total_tokens_used: number;
  error_message: string | null;
  validator_summary: Record<string, { score: number | null; passed: boolean }> | null;
  started_at: string;
  completed_at: string | null;
}

export interface AgentPromptRow {
  id: string;
  agent_type: AgentType;
  version: number;
  is_active: boolean;
  system_prompt: string;
  user_prompt_template: string;
  notes: string | null;
  created_at: string;
}

export interface ContentSystemRow {
  id: string;
  code: string;
  display_name: string;
  usmle_label: string;
  weight_min: number;
  weight_max: number;
  sort_order: number;
  created_at: string;
}

export interface ContentCompetencyRow {
  id: string;
  code: string;
  display_name: string;
  usmle_label: string;
  weight_min: number;
  weight_max: number;
  maps_to_task_types: string[];
  sort_order: number;
  created_at: string;
}

export interface ContentDisciplineRow {
  id: string;
  code: string;
  display_name: string;
  usmle_label: string;
  weight_min: number;
  weight_max: number;
  maps_to_shelves: string[];
  sort_order: number;
  created_at: string;
}

export interface ContentTopicRow {
  id: string;
  content_system_id: string;
  topic_name: string;
  category: string | null;
  is_high_yield: boolean;
  created_at: string;
}

export interface UserResponseRow {
  id: string;
  user_id: string;
  item_draft_id: string;
  selected_answer: CorrectAnswer;
  is_correct: boolean;
  time_spent_seconds: number | null;
  created_at: string;
}

// --- v7 Reasoning Ontology row types ---

export interface HingeClueTypeRow {
  id: string;
  name: string;
  description: string;
  example: string | null;
  sort_order: number;
  created_at: string;
}

export interface AlternateTerminologyRow {
  id: string;
  nbme_phrasing: string;
  clinical_concept: string;
  context: string | null;
  created_at: string;
}

export interface ActionClassRow {
  id: string;
  name: string;
  priority_rank: number;
  description: string;
  example_actions: string[] | null;
  created_at: string;
}

export interface ConfusionSetRow {
  id: string;
  name: string;
  conditions: unknown; // JSONB: string[]
  discriminating_clues: unknown; // JSONB: { condition, clue, clue_type }[]
  common_traps: string[];
  shelf: string | null;
  created_at: string;
}

export interface TransferRuleRow {
  id: string;
  rule_text: string;
  category: string;
  times_violated: number;
  times_mastered: number;
  trigger_pattern: string | null;
  action_priority: string | null;
  suppressions: string[] | null;
  wrong_pathways: unknown | null; // JSONB
  topic: string | null;
  source_citation: string | null;
  created_at: string;
}

export interface PatternFamilyRow {
  id: string;
  name: string;
  display_name: string;
  description: string;
  structure: string;
  hinge_type: string;
  cognitive_trap: string;
  frequency: 'high' | 'medium';
  examples: unknown; // JSONB
  reverse_pattern: string | null;
  created_at: string;
}

export interface CognitiveErrorTagRow {
  id: string;
  error_taxonomy_id: string;
  item_draft_id: string | null;
  question_id: string | null;
  option_letter: CorrectAnswer;
  is_correct_answer: boolean;
  notes: string | null;
  created_at: string;
}

// --- v8 Case Plan + Skeleton row types ---

export type CognitiveOperationType =
  | 'rule_application'
  | 'threshold_recognition'
  | 'diagnosis_disambiguation'
  | 'management_sequencing'
  | 'risk_stratification';

export type HingeDepth = 'surface' | 'moderate' | 'deep';

export type DecisionForkType =
  | 'competing_diagnoses'
  | 'management_tradeoff'
  | 'contraindication'
  | 'timing_decision'
  | 'severity_ambiguity';

export interface CasePlanRow {
  id: string;
  blueprint_node_id: string;
  algorithm_card_id: string;
  // Structured generation fields (REQUIRED)
  cognitive_operation_type: CognitiveOperationType;
  transfer_rule_text: string;
  hinge_depth_target: HingeDepth;
  decision_fork_type: DecisionForkType;
  decision_fork_description: string;
  option_action_class: string;
  // Pre-specified option frames — answer semantics are system-controlled
  option_frames: Array<{ id: string; class: string; meaning: string }>;
  correct_option_frame_id: string;
  distractor_rationale_by_frame?: Record<string, string>;
  forbidden_option_classes?: string[];
  // Ontology targets
  target_transfer_rule_id: string | null;
  target_confusion_set_id: string | null;
  target_cognitive_error_id: string | null;
  target_hinge_clue_type_id: string | null;
  target_action_class_id: string | null;
  // Difficulty
  ambiguity_level: number;
  distractor_strength: number;
  clinical_complexity: number;
  // Strategy
  ambiguity_strategy: string | null;
  distractor_design: Record<string, unknown> | null;
  final_decisive_clue: string | null;
  explanation_teaching_goal: string | null;
  created_at: string;
}

export interface QuestionSkeletonRow {
  id: string;
  case_plan_id: string;
  case_summary: string;
  hidden_target: string;
  correct_action: string;
  correct_action_class_id: string | null;
  option_action_class: string;
  option_frames: Array<{
    id: string;
    class: string;
    meaning: string;
    cognitive_error_id: string | null;
    action_class_id?: string | null;
    rendered_text?: string | null;
  }>;
  correct_option_frame_id: string;
  error_mapping: Record<string, unknown> | null;
  hinge_placement: string;
  hinge_description: string;
  hinge_depth: HingeDepth;
  hinge_buried_by: string;
  skeleton_validated: boolean;
  created_at: string;
}

// --- v10 Learner Model row types ---

export interface LearnerModelRow {
  id: string;
  user_id: string;
  dimension_type: DimensionType;
  dimension_id: string;
  dimension_label: string;
  mastery_level: number;
  total_attempts: number;
  correct_count: number;
  consecutive_correct: number;
  next_review_due: string;
  avg_time_ms: number | null;
  error_frequency: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface AttemptV2Row {
  id: string;
  user_id: string;
  item_draft_id: string | null;
  question_id: string | null;
  selected_answer: CorrectAnswer;
  is_correct: boolean;
  time_spent_ms: number | null;
  confidence_pre: number | null;
  diagnosed_cognitive_error_id: string | null;
  diagnosed_hinge_miss: boolean;
  diagnosed_action_class_confusion: boolean;
  repair_action: RepairAction | null;
  session_id: string | null;
  session_mode: SessionMode | null;
  confidence_post: number | null;
  self_labeled_error: string | null;
  // Phase 1 instrumentation
  is_contrast_question: boolean;
  contrast_success: boolean | null;
  confusion_set_id: string | null;
  created_at: string;
}

export interface LearningSessionRow {
  id: string;
  user_id: string;
  mode: SessionMode;
  status: SessionStatus;
  target_count: number;
  completed_count: number;
  correct_count: number;
  target_dimension_type: DimensionType | null;
  target_dimension_id: string | null;
  time_limit_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}
