-- v23: Elite-Tutor Rules — pipeline + learner columns
--
-- Ten rules from elite Step 2 CK tutors and 270+ scorers, codified in
-- ELITE_TUTOR_PRINCIPLES.md, require new persisted fields across three tables:
--
--   case_plan         — Rule 1 (multi-step reasoning chain), Rule 2 (difficulty_class)
--                       Rule 3 archetype lives inside the existing option_frames jsonb
--                       and needs no column change.
--   item_draft        — Rule 4 (down_to_two_discrimination), Rule 10 (question_writer_intent),
--                       Rule 2 signal (easy_recognition_check).
--   attempt_v2        — Rule 6 (what_were_you_thinking free-text capture). self_labeled_error
--                       column already exists per v12; this migration documents that it is wired.
--   learner_model     — Rule 9 (user_progression_phase derived from total_attempts).
--                       Implemented as a generated column so selectors read it directly.
--
-- All additions are nullable/additive — legacy rows remain valid, validators enforce
-- presence on newly-generated items.

-- ─── Rule 1 — Multi-step reasoning chain on case_plan ───
alter table case_plan
  add column if not exists reasoning_step_count integer,
  add column if not exists reasoning_steps jsonb,
  add column if not exists difficulty_class text
    check (difficulty_class is null
      or difficulty_class in ('easy_recognition', 'decision_fork', 'hard_discrimination'));

comment on column case_plan.reasoning_step_count is
  'Rule 1 — Number of sequential decisions the item requires (2-4)';
comment on column case_plan.reasoning_steps is
  'Rule 1 — Ordered array of {step_number, what_student_must_recognize, clinical_signal}; length must equal reasoning_step_count';
comment on column case_plan.difficulty_class is
  'Rule 2 — easy_recognition | decision_fork | hard_discrimination; drives batch quotas, session mix, and easy-miss signal';

create index if not exists idx_case_plan_difficulty_class on case_plan (difficulty_class);

-- ─── Rule 4 / 10 / 2 — Explanation layer fields on item_draft ───
alter table item_draft
  add column if not exists down_to_two_discrimination jsonb,
  add column if not exists question_writer_intent text,
  add column if not exists easy_recognition_check text;

comment on column item_draft.down_to_two_discrimination is
  'Rule 4 — { competitor_option, tipping_detail, counterfactual } — teaches the "down to two" discrimination skill';
comment on column item_draft.question_writer_intent is
  'Rule 10 — One sentence matching "This question tests whether you prioritize X over Y when Z"';
comment on column item_draft.easy_recognition_check is
  'Rule 2 — One-line pattern a competent student should see; populated only when case_plan.difficulty_class = easy_recognition';

-- ─── Rule 6 — Free-text metacognitive capture on attempt_v2 ───
alter table attempt_v2
  add column if not exists what_were_you_thinking text;

comment on column attempt_v2.what_were_you_thinking is
  'Rule 6 — Free-text student reasoning captured on wrong answers. Not analyzed computationally; stored for later pattern mining.';

-- ─── Rule 9 — User progression phase on learner_model ───
-- Generated column; PostgreSQL evaluates on read so new attempts automatically
-- flip the phase when total_attempts crosses a threshold. Selector reads this directly.
alter table learner_model
  add column if not exists user_progression_phase text generated always as (
    case
      when total_attempts < 200 then 'system_clustered'
      when total_attempts < 800 then 'partially_mixed'
      else 'fully_random'
    end
  ) stored;

comment on column learner_model.user_progression_phase is
  'Rule 9 — Generated from total_attempts: system_clustered (<200), partially_mixed (<800), fully_random (≥800). Selector uses this to cluster early users by system.';

create index if not exists idx_learner_model_progression_phase on learner_model (user_progression_phase);
