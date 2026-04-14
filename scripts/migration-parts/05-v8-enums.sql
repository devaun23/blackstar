-- V8 Part A: Extend agent_type enum
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'case_planner';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'skeleton_writer';
ALTER TYPE public.agent_type ADD VALUE IF NOT EXISTS 'skeleton_validator';
