-- Migration v9: 5-Component Explanation Structure
-- Enhances item_draft with structured explanation fields
-- Run in Supabase SQL Editor AFTER v8 migration

-- ============================================
-- Add 5-component explanation columns to item_draft
-- ============================================
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_decision_logic TEXT;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_hinge_id UUID REFERENCES hinge_clue_type(id) ON DELETE SET NULL;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_error_diagnosis JSONB;
-- Structure: { "B": { "error_id": "uuid", "error_name": "anchoring", "explanation": "..." }, ... }
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_transfer_rule TEXT;
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS explanation_teaching_pearl TEXT;
