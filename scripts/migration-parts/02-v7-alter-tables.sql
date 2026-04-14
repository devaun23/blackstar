-- V7 Part A: Extend transfer_rules and error_taxonomy
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS trigger_pattern TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS action_priority TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS suppressions TEXT[];
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS wrong_pathways JSONB;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE transfer_rules ADD COLUMN IF NOT EXISTS source_citation TEXT;

ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS frequency_rank INT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS detection_prompt TEXT;
ALTER TABLE error_taxonomy ADD COLUMN IF NOT EXISTS repair_strategy TEXT;
