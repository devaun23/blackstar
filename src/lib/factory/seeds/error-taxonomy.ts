export interface ErrorTaxonomySeed {
  error_name: string;
  definition: string;
  explanation_template: string;
  example_scenario: string;
  // v7 structured fields
  category: string;
  frequency_rank: number;
  detection_prompt: string;
  repair_strategy: string;
}

export const errorTaxonomy: ErrorTaxonomySeed[] = [
  {
    error_name: 'premature_closure',
    definition: 'Accepting a diagnosis before it has been fully verified, failing to consider alternatives once an initial impression is formed.',
    explanation_template: 'This question targets premature closure. Students who select {{wrong_answer}} likely stopped reasoning after the initial presentation suggested {{surface_diagnosis}}, without considering {{correct_diagnosis}} given {{distinguishing_feature}}.',
    example_scenario: 'A patient presents with chest pain and ST elevations — the student diagnoses STEMI without noticing the diffuse, concave-up pattern consistent with pericarditis.',
    category: 'premature_closure',
    frequency_rank: 1,
    detection_prompt: 'Did the learner stop at the first plausible diagnosis without checking distinguishing features?',
    repair_strategy: 'Present the same clinical scenario with a subtle discriminating feature that changes the diagnosis. Force explicit comparison.',
  },
  {
    error_name: 'anchoring',
    definition: 'Over-relying on the first piece of information encountered (the anchor) when making decisions, even when subsequent data contradicts it.',
    explanation_template: 'This question targets anchoring bias. Students who anchor on {{anchor_finding}} may select {{wrong_answer}}, overlooking {{key_finding}} that redirects the diagnosis to {{correct_answer}}.',
    example_scenario: 'A patient with a history of anxiety presents with palpitations — the student anchors on the psych history and misses new-onset atrial fibrillation.',
    category: 'premature_closure',
    frequency_rank: 2,
    detection_prompt: 'Did the learner fixate on a salient but misleading detail while ignoring contradicting evidence?',
    repair_strategy: 'Present cases where the anchor is present but the actual diagnosis differs. Build the habit of checking all data.',
  },
  {
    error_name: 'wrong_algorithm_branch',
    definition: 'Correctly identifying the clinical scenario but following the wrong management pathway at a decision fork.',
    explanation_template: 'This question tests algorithm branching. The key fork is {{decision_point}}. Students who select {{wrong_answer}} followed the correct algorithm but took the wrong branch at {{branch_point}}, not accounting for {{distinguishing_factor}}.',
    example_scenario: 'Correctly identifying ACS but choosing PCI for NSTEMI in a patient who should receive medical management based on TIMI score.',
    category: 'next_step_error',
    frequency_rank: 3,
    detection_prompt: 'Did the learner identify the correct condition but pick the wrong management branch at a decision fork?',
    repair_strategy: 'Present the same algorithm with the branching criterion made explicit, then test with a case on the other side of the fork.',
  },
  {
    error_name: 'over_testing',
    definition: 'Ordering unnecessary or premature diagnostic tests when the clinical picture already provides enough information to act.',
    explanation_template: 'This question penalizes over-testing. Students who select {{wrong_answer}} want more data before acting, but {{clinical_picture}} already provides sufficient information. The correct action is {{correct_answer}} because {{rationale}}.',
    example_scenario: 'Ordering a CT pulmonary angiogram for a patient with a Wells score of 1 and negative D-dimer.',
    category: 'next_step_error',
    frequency_rank: 5,
    detection_prompt: 'Did the learner order a test when existing information was sufficient to act?',
    repair_strategy: 'Present cases with clear clinical pictures and ask for the single next step. Reinforce when-to-act thresholds.',
  },
  {
    error_name: 'under_triage',
    definition: 'Failing to recognize the urgency or severity of a clinical situation, leading to insufficient escalation of care.',
    explanation_template: 'This question targets under-triage. Students who select {{wrong_answer}} underestimate the severity indicated by {{severity_markers}}. The correct response is {{correct_answer}} because {{urgency_rationale}}.',
    example_scenario: 'Sending a patient with altered mental status and a lactate of 4.5 to the floor instead of the ICU.',
    category: 'severity_miss',
    frequency_rank: 4,
    detection_prompt: 'Did the learner underestimate severity markers that should have triggered escalation?',
    repair_strategy: 'Present paired cases at different severity levels with the same condition. Drill severity thresholds explicitly.',
  },
  {
    error_name: 'treating_labs_instead_of_patient',
    definition: 'Treating an abnormal lab value rather than the clinical condition it represents, or treating labs in the absence of clinical indication.',
    explanation_template: 'This question tests whether students treat the patient or the lab value. {{wrong_answer}} addresses the {{lab_value}} in isolation. The correct approach ({{correct_answer}}) recognizes that {{clinical_context}} makes treatment {{appropriate_or_not}}.',
    example_scenario: 'Aggressively correcting mild asymptomatic hyponatremia (Na 131) in a euvolemic patient.',
    category: 'next_step_error',
    frequency_rank: 7,
    detection_prompt: 'Did the learner treat a lab value rather than the clinical condition?',
    repair_strategy: 'Present abnormal labs in asymptomatic patients. Reinforce thresholds for when lab correction is clinically indicated.',
  },
  {
    error_name: 'reflex_response_to_finding',
    definition: 'Automatically performing a standard action in response to a finding without considering whether the full clinical context warrants it.',
    explanation_template: 'This question challenges reflex responses. Students who select {{wrong_answer}} reflexively respond to {{trigger_finding}} with a standard action, without considering {{modifying_context}} that changes the appropriate response to {{correct_answer}}.',
    example_scenario: 'Reflexively anticoagulating for new atrial fibrillation without checking CHA₂DS₂-VASc score in a young patient with no risk factors.',
    category: 'next_step_error',
    frequency_rank: 6,
    detection_prompt: 'Did the learner reflexively apply a standard response without checking modifying context?',
    repair_strategy: 'Present the trigger finding in contexts where the standard response is wrong. Build conditional reasoning.',
  },
  {
    error_name: 'misreading_hemodynamic_status',
    definition: 'Incorrectly assessing a patient\'s hemodynamic stability, leading to either under- or over-aggressive management.',
    explanation_template: 'This question tests hemodynamic assessment. Students who select {{wrong_answer}} misread the patient\'s hemodynamic status. {{vital_signs}} indicate {{actual_status}}, making {{correct_answer}} the appropriate intervention.',
    example_scenario: 'Missing compensated shock in a young patient with normal blood pressure but tachycardia and narrowed pulse pressure.',
    category: 'severity_miss',
    frequency_rank: 8,
    detection_prompt: 'Did the learner misinterpret hemodynamic status from the vital signs provided?',
    repair_strategy: 'Present vital sign patterns across shock stages. Drill recognition of compensated vs decompensated shock.',
  },
  {
    error_name: 'skipping_required_diagnostic_step',
    definition: 'Jumping to treatment or advanced testing without completing a required preliminary diagnostic step.',
    explanation_template: 'This question tests diagnostic sequencing. Students who select {{wrong_answer}} skip {{required_step}}, which must be performed before {{premature_action}} because {{rationale}}.',
    example_scenario: 'Starting antibiotics for suspected meningitis without first obtaining blood cultures and LP.',
    category: 'next_step_error',
    frequency_rank: 9,
    detection_prompt: 'Did the learner skip a required diagnostic step before proceeding to treatment?',
    repair_strategy: 'Present cases where the correct answer is a prerequisite step, not the definitive treatment.',
  },
  {
    error_name: 'premature_escalation',
    definition: 'Escalating to invasive procedures or specialist care when conservative management is still appropriate.',
    explanation_template: 'This question targets premature escalation. Students who select {{wrong_answer}} escalate to {{invasive_option}} prematurely. Given {{clinical_status}}, the correct first step is {{correct_answer}} because {{rationale}}.',
    example_scenario: 'Recommending surgery for a patient with uncomplicated diverticulitis who should be managed with antibiotics and bowel rest.',
    category: 'next_step_error',
    frequency_rank: 10,
    detection_prompt: 'Did the learner escalate to invasive or specialist intervention when conservative management was appropriate?',
    repair_strategy: 'Present cases at different severity thresholds for the same condition. Drill indications for escalation vs conservative management.',
  },
  {
    error_name: 'wrong_priority_sequence',
    definition: 'Identifying the correct set of actions but executing them in the wrong order, potentially causing harm or delay.',
    explanation_template: 'This question tests priority sequencing. Both {{wrong_answer}} and {{correct_answer}} are needed, but {{correct_answer}} must come first because {{priority_rationale}}.',
    example_scenario: 'Ordering imaging before securing the airway in a trauma patient with a GCS of 7.',
    category: 'next_step_error',
    frequency_rank: 11,
    detection_prompt: 'Did the learner identify the right actions but sequence them incorrectly?',
    repair_strategy: 'Present multi-step management scenarios. Reinforce priority frameworks (ABCs, stabilize-before-diagnose).',
  },
  {
    error_name: 'misreading_severity',
    definition: 'Incorrectly classifying the severity of a condition, leading to management appropriate for a different severity level.',
    explanation_template: 'This question tests severity classification. Students who select {{wrong_answer}} misclassify the severity based on {{misread_indicator}}. The {{severity_criteria}} place this patient in {{correct_category}}, requiring {{correct_answer}}.',
    example_scenario: 'Classifying severe persistent asthma as mild intermittent because the patient is currently asymptomatic, ignoring FEV1 < 60%.',
    category: 'severity_miss',
    frequency_rank: 12,
    detection_prompt: 'Did the learner misclassify the severity of the condition based on available criteria?',
    repair_strategy: 'Present cases with explicit severity criteria. Drill classification systems and their management implications.',
  },
];
