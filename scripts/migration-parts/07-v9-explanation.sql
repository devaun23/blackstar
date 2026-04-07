-- V9: Explanation structure columns
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_decision_logic TEXT;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_hinge_id UUID REFERENCES hinge_clue_type(id) ON DELETE SET NULL;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_error_diagnosis JSONB;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_transfer_rule TEXT;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_teaching_pearl TEXT;
