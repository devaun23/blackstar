/**
 * Mock fixtures for pipeline testing without API calls.
 *
 * Each fixture is a minimal valid object that satisfies the Zod schema
 * for its agent type. These are deterministic and reproducible —
 * the same input always produces the same output.
 *
 * Used when `mockMode: true` in PipelineConfig.
 */

import type { AgentType } from '@/lib/types/database';

const UUID = '00000000-0000-0000-0000-000000000001';
const UUID2 = '00000000-0000-0000-0000-000000000002';
const UUID3 = '00000000-0000-0000-0000-000000000003';
const UUID4 = '00000000-0000-0000-0000-000000000004';

const MOCK_FIXTURES: Partial<Record<AgentType, unknown>> = {
  blueprint_selector: {
    selected_node_id: UUID,
    reasoning: 'Mock: selected first available node',
  },

  algorithm_extractor: {
    algorithm_card: {
      topic: 'mock_acs',
      entry_presentation: 'Chest pain with ST elevation',
      competing_paths: ['STEMI vs NSTEMI', 'ACS vs PE'],
      hinge_feature: 'ST elevation in contiguous leads',
      correct_action: 'Activate cath lab',
      wrong_but_tempting: ['Serial troponins', 'CT angiography'],
    },
    fact_rows: [
      {
        fact_type: 'threshold',
        fact_text: 'ST elevation >= 1mm in 2 contiguous leads',
        confidence: 'high',
        source_ref: 'ACC/AHA 2023',
      },
    ],
  },

  case_planner: {
    cognitive_operation_type: 'rule_application',
    transfer_rule_text: 'When ST elevation is present with chest pain, always activate cath lab before serial troponins',
    hinge_depth_target: 'moderate',
    decision_fork_type: 'management_choice',
    decision_fork_description: 'Immediate intervention vs watchful waiting',
    option_frames: [
      { id: 'A', class: 'management_steps', meaning: 'Activate cath lab for PCI', is_correct: true },
      { id: 'B', class: 'management_steps', meaning: 'Order serial troponins q6h', is_correct: false },
      { id: 'C', class: 'management_steps', meaning: 'Start heparin drip and observe', is_correct: false },
      { id: 'D', class: 'management_steps', meaning: 'Obtain CT pulmonary angiography', is_correct: false },
      { id: 'E', class: 'management_steps', meaning: 'Discharge with stress test in 72h', is_correct: false },
    ],
    option_action_class: 'management_steps',
    correct_option_frame_id: 'A',
    forbidden_option_classes: [],
    target_cognitive_error_id: UUID2,
    target_transfer_rule_id: null,
    target_confusion_set_id: null,
    target_hinge_clue_type_id: null,
    target_action_class_id: null,
    ambiguity_level: 2,
    distractor_strength: 3,
    clinical_complexity: 2,
  },

  skeleton_writer: {
    case_summary: 'A 58-year-old man presents to the ED with acute chest pain radiating to the left arm.',
    hidden_target: 'STEMI requiring emergent PCI',
    correct_action: 'Activate cardiac catheterization lab',
    correct_action_class_id: UUID3,
    option_action_class: 'management_steps',
    option_frames: [
      { id: 'A', class: 'management_steps', meaning: 'Activate cath lab', cognitive_error_id: null },
      { id: 'B', class: 'management_steps', meaning: 'Serial troponins', cognitive_error_id: UUID2 },
      { id: 'C', class: 'management_steps', meaning: 'Heparin drip', cognitive_error_id: UUID3 },
      { id: 'D', class: 'management_steps', meaning: 'CT angiography', cognitive_error_id: UUID4 },
      { id: 'E', class: 'management_steps', meaning: 'Discharge with stress test', cognitive_error_id: UUID },
    ],
    correct_option_frame_id: 'A',
    error_mapping: null,
    hinge_placement: 'ECG findings in the second paragraph',
    hinge_description: 'ST elevation in leads II, III, aVF',
    hinge_depth: 'moderate',
    hinge_buried_by: 'Initial focus on troponin levels and history of anxiety',
  },

  skeleton_validator: {
    skeleton_validated: true,
    issues: [],
    suggestions: [],
  },

  item_planner: {
    blueprint_node_id: UUID,
    lead_in: 'Which of the following is the most appropriate next step in management?',
    hinge_placement: 'Paragraph 2, sentence 3',
    clinical_setting: 'ed',
    temporal_sequence: ['Presents to ED', 'Initial assessment', 'ECG obtained', 'Decision point'],
    distractor_strategy: 'Each distractor represents a distinct cognitive error',
  },

  vignette_writer: {
    vignette: 'A 58-year-old man with a history of hypertension and hyperlipidemia presents to the emergency department with acute onset substernal chest pain radiating to the left arm for the past 45 minutes.',
    stem: 'An electrocardiogram shows 3mm ST-segment elevation in leads II, III, and aVF. Troponin I is 0.04 ng/mL. Which of the following is the most appropriate next step in management?',
    choice_a: 'Percutaneous coronary intervention',
    choice_b: 'Serial cardiac troponin measurements every 6 hours',
    choice_c: 'Continuous intravenous heparin infusion',
    choice_d: 'CT pulmonary angiography',
    choice_e: 'Discharge with outpatient exercise stress test',
    correct_answer: 'A',
    why_correct: 'ST elevation in contiguous leads with chest pain is STEMI until proven otherwise, requiring emergent PCI.',
    why_wrong_a: null,
    why_wrong_b: 'Waiting for serial troponins delays definitive treatment in STEMI.',
    why_wrong_c: 'Heparin is adjunctive but does not address the need for revascularization.',
    why_wrong_d: 'The presentation is classic STEMI, not PE.',
    why_wrong_e: 'Discharging a STEMI patient risks sudden cardiac death.',
    high_yield_pearl: 'Door-to-balloon time < 90 minutes is the target for STEMI.',
  },

  medical_validator: {
    passed: true,
    score: 9,
    issues_found: [],
    repair_instructions: null,
  },

  blueprint_validator: {
    passed: true,
    score: 10,
    issues_found: [],
    repair_instructions: null,
  },

  nbme_quality_validator: {
    passed: true,
    score: 8,
    issues_found: [],
    repair_instructions: null,
  },

  option_symmetry_validator: {
    passed: true,
    score: 9,
    issues_found: [],
    repair_instructions: null,
  },

  explanation_validator: {
    passed: true,
    score: 8,
    issues_found: [],
    repair_instructions: null,
  },

  exam_translation_validator: {
    passed: true,
    score: 9,
    issues_found: [],
    repair_instructions: null,
  },

  repair_agent: {
    vignette: 'Mock repaired vignette.',
    stem: 'Mock repaired stem.',
    choice_a: 'A', choice_b: 'B', choice_c: 'C', choice_d: 'D', choice_e: 'E',
    correct_answer: 'A',
    why_correct: 'Mock repaired explanation.',
    why_wrong_a: null, why_wrong_b: 'B is wrong.', why_wrong_c: 'C is wrong.',
    why_wrong_d: 'D is wrong.', why_wrong_e: 'E is wrong.',
    high_yield_pearl: 'Mock pearl.',
  },

  explanation_writer: {
    decision_logic: 'Mock decision logic for the explanation.',
    hinge_id: 'ST elevation pattern',
    error_diagnosis: { B: 'premature_closure', C: 'anchoring', D: 'wrong_algorithm_branch', E: 'under_triage' },
    transfer_rule: 'When ST elevation is present, activate cath lab before serial troponins.',
    teaching_pearl: 'STEMI management follows the door-to-balloon time paradigm.',
  },
};

/**
 * Get a mock fixture for the given agent type.
 * Returns undefined if no fixture exists (agent will fall back to real API call).
 */
export function getMockFixture(agentType: AgentType): unknown | undefined {
  return MOCK_FIXTURES[agentType];
}
