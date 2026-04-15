-- Migration v16: Flatten source tiers (Scope + Content)
-- Removes the 3-tier system (scope/truth/inspiration) in favor of 2 tiers (scope/content).
-- All former 'truth' and 'inspiration' sources become 'content'.

-- Step 1: Add 'content' to the enum
ALTER TYPE public.source_use ADD VALUE IF NOT EXISTS 'content';

-- Step 2: Update existing rows
UPDATE public.source_registry
SET allowed_use = 'content'
WHERE allowed_use IN ('truth', 'inspiration');

-- Note: PostgreSQL does not support removing values from an enum type.
-- The old values ('truth', 'inspiration') remain in the enum but are no longer used.
-- The TypeScript type `SourceUse = 'scope' | 'content'` prevents new inserts with old values.
