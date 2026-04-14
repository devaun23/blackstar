-- v15: Human review queue
-- Adds review workflow status to item_draft for physician review before publishing.
-- Research (P2 — QUEST-AI) shows physician review at 3.21 min/question is essential.

-- Add review status enum
DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending_review', 'approved', 'rejected', 'needs_revision');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add review columns to item_draft
ALTER TABLE item_draft
  ADD COLUMN IF NOT EXISTS review_status review_status DEFAULT null,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) DEFAULT null,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS review_notes text DEFAULT null;

-- Index for fetching the review queue efficiently
CREATE INDEX IF NOT EXISTS idx_item_draft_review_status
  ON item_draft(review_status)
  WHERE review_status IS NOT NULL;

COMMENT ON COLUMN item_draft.review_status IS 'Human review workflow: pending_review → approved/rejected/needs_revision';
COMMENT ON COLUMN item_draft.reviewed_by IS 'User ID of the reviewer who approved/rejected';
COMMENT ON COLUMN item_draft.reviewed_at IS 'Timestamp of the review decision';
COMMENT ON COLUMN item_draft.review_notes IS 'Free-text notes from the reviewer';
