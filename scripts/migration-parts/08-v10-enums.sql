-- V10 Part A: New enums

DO $$ BEGIN
  CREATE TYPE public.repair_action AS ENUM (
    'advance', 'reinforce', 'contrast', 'remediate', 'transfer_test'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dimension_type AS ENUM (
    'topic', 'transfer_rule', 'confusion_set', 'cognitive_error', 'action_class', 'hinge_clue_type'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
