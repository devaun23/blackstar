-- v25: Contraindication Cross-Check Validator (CCV)
--
-- Extends three Postgres enums so the existing validator_report / agent_prompt /
-- item_draft infrastructure can carry the new safety validator without schema
-- changes to the tables themselves.
--
--   validator_type += 'contraindication'            -> row in validator_report per CCV run
--   agent_type     += 'contraindication_validator'  -> row in agent_prompt with CCV prompt
--   item_status    += 'needs_human_review'          -> distinct from 'killed' so reviewers
--                                                      can filter CCV-flagged items out of
--                                                      the regular kill queue
--
-- Rationale for the new status: CCV's routing needs three outcomes, not two.
-- Absolute contraindication -> repair loop to case_planner. Relative contraindication or
-- unknown-intervention match -> human reviewer. Collapsing the second bucket into 'killed'
-- hides the safety signal from the person who needs to act on it.
--
-- Uses ADD VALUE IF NOT EXISTS so re-running this migration is a no-op.

alter type public.validator_type add value if not exists 'contraindication';

alter type public.agent_type add value if not exists 'contraindication_validator';

alter type public.item_status add value if not exists 'needs_human_review';
