-- Migration v20: Palmerton gap type classification
-- Adds gap type (skills/noise/consistency) and coaching note to error taxonomy
-- Based on Palmerton Methodology — 3 transfer gaps framework

ALTER TABLE error_taxonomy
  ADD COLUMN IF NOT EXISTS palmerton_gap_type text
    CHECK (palmerton_gap_type IN ('skills', 'noise', 'consistency')),
  ADD COLUMN IF NOT EXISTS palmerton_coaching_note text;

-- Add gap coaching field to item_drafts for explanation output
ALTER TABLE item_drafts
  ADD COLUMN IF NOT EXISTS explanation_gap_coaching text;

-- Backfill gap types for existing error taxonomy rows
UPDATE error_taxonomy SET palmerton_gap_type = 'noise', palmerton_coaching_note = 'Noise Gap: You likely knew the right answer but stopped too early. Be the Judge, not the Lawyer — rule IN your top diagnosis by checking all supporting evidence before moving on.' WHERE error_name = 'premature_closure';
UPDATE error_taxonomy SET palmerton_gap_type = 'noise', palmerton_coaching_note = 'Noise Gap: You fixated on one finding and let it override contradicting evidence. Weigh ALL the evidence like a judge — the best answer fits 80% of the data, not just the loudest detail.' WHERE error_name = 'anchoring';
UPDATE error_taxonomy SET palmerton_gap_type = 'skills', palmerton_coaching_note = 'Skills Gap: You identified the condition correctly but couldn''t navigate the decision fork. Drill the branching criteria until the fork point is automatic — finding → branch, no hesitation.' WHERE error_name = 'wrong_algorithm_branch';
UPDATE error_taxonomy SET palmerton_gap_type = 'skills', palmerton_coaching_note = 'Skills Gap: You couldn''t interpret the severity markers from the vitals and findings. Drill severity thresholds until the pattern is automatic — vital signs → severity level, no guessing.' WHERE error_name = 'under_triage';
UPDATE error_taxonomy SET palmerton_gap_type = 'consistency', palmerton_coaching_note = 'Consistency Gap: You know when to act but defaulted to ordering more tests. The fix is process discipline — before ordering, ask: "Do I already have enough to act?" If yes, act.' WHERE error_name = 'over_testing';
UPDATE error_taxonomy SET palmerton_gap_type = 'consistency', palmerton_coaching_note = 'Consistency Gap: You ran on autopilot — saw a trigger and reflexed to the standard response without checking context. The fix: pause after recognizing the trigger and ask "Does the full picture still support this action?"' WHERE error_name = 'reflex_response_to_finding';
UPDATE error_taxonomy SET palmerton_gap_type = 'consistency', palmerton_coaching_note = 'Consistency Gap: You know the principle — treat the patient, not the lab — but didn''t apply it here. Before treating any lab value, ask: "Is this patient symptomatic? Does this number need intervention?"' WHERE error_name = 'treating_labs_instead_of_patient';
UPDATE error_taxonomy SET palmerton_gap_type = 'skills', palmerton_coaching_note = 'Skills Gap: You misread the hemodynamic picture from the vitals. Drill vital sign interpretation — HR, BP, pulse pressure, MAP — until you can instantly classify stable vs compensated vs decompensated.' WHERE error_name = 'misreading_hemodynamic_status';
UPDATE error_taxonomy SET palmerton_gap_type = 'consistency', palmerton_coaching_note = 'Consistency Gap: You know the diagnostic sequence but skipped a required step. Before choosing treatment, run the checklist: "Have I confirmed the diagnosis? Have I completed prerequisites?" Don''t jump ahead.' WHERE error_name = 'skipping_required_diagnostic_step';
UPDATE error_taxonomy SET palmerton_gap_type = 'noise', palmerton_coaching_note = 'Noise Gap: You chose the more aggressive option when conservative management was correct. Be the Judge — weigh ALL evidence. The aggressive option felt safer, but the clinical picture didn''t warrant it.' WHERE error_name = 'premature_escalation';
UPDATE error_taxonomy SET palmerton_gap_type = 'consistency', palmerton_coaching_note = 'Consistency Gap: You identified the right actions but executed them in the wrong order. Before answering, run the priority check: Airway → Breathing → Circulation → stabilize before diagnose → diagnose before treat.' WHERE error_name = 'wrong_priority_sequence';
UPDATE error_taxonomy SET palmerton_gap_type = 'skills', palmerton_coaching_note = 'Skills Gap: You misclassified severity because you couldn''t interpret the criteria from the findings. Drill the classification systems for this condition until severity → management is automatic.' WHERE error_name = 'misreading_severity';
