-- Blackstar: Schema Migration v2
-- Adds missing fields from master plan reconciliation
-- Run this in the Supabase SQL Editor AFTER the initial schema

-- ============================================
-- 1. Add missing fields to blueprint_node
-- ============================================
ALTER TABLE public.blueprint_node ADD COLUMN IF NOT EXISTS subtopic text;
ALTER TABLE public.blueprint_node ADD COLUMN IF NOT EXISTS frequency_score numeric(4,2);
ALTER TABLE public.blueprint_node ADD COLUMN IF NOT EXISTS discrimination_score numeric(4,2);

-- ============================================
-- 2. Add missing fields to algorithm_card
-- ============================================
ALTER TABLE public.algorithm_card ADD COLUMN IF NOT EXISTS time_horizon text;
ALTER TABLE public.algorithm_card ADD COLUMN IF NOT EXISTS severity_markers text[];

-- ============================================
-- 3. Add missing values to agent_type enum
-- ============================================
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'blueprint_validator';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'option_symmetry_validator';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'explanation_validator';
