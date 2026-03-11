-- Migration v5: Add visual_specs column to item_draft
-- Visual specs are optional jsonb arrays produced by the explanation_writer agent.
-- Null means no visuals — text explanations remain primary.

ALTER TABLE public.item_draft ADD COLUMN IF NOT EXISTS visual_specs jsonb;

COMMENT ON COLUMN public.item_draft.visual_specs IS 'Optional array of visual spec objects (comparison_table, severity_ladder, etc.) produced by explanation_writer agent';
