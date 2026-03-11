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
export type AgentType = 'blueprint_selector' | 'algorithm_extractor' | 'item_planner' | 'vignette_writer' | 'medical_validator' | 'nbme_quality_validator' | 'blueprint_validator' | 'option_symmetry_validator' | 'explanation_validator' | 'exam_translation_validator' | 'repair_agent' | 'explanation_writer';
export type CardStatus = 'draft' | 'truth_verified' | 'translation_verified' | 'generation_ready' | 'retired';
export type PipelineStatus = 'running' | 'completed' | 'failed' | 'killed';
export type UserRole = 'student' | 'admin';
export type SourceUse = 'scope' | 'truth' | 'inspiration';
export type CorrectAnswer = 'A' | 'B' | 'C' | 'D' | 'E';

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
  repair_count: number;
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
