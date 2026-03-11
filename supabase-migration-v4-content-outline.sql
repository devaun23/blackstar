-- Blackstar: Migration v4 — USMLE Content Outline Integration
-- Adds 4 tables for the USMLE Step 2 CK content outline (Tier A scope authority)
-- Run this in the Supabase SQL Editor AFTER v3 migration

-- ============================================
-- 1. Content System — 15 USMLE organ systems
-- ============================================
create table public.content_system (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  display_name text not null,
  usmle_label text not null,
  weight_min numeric(4,2) not null,
  weight_max numeric(4,2) not null,
  sort_order integer not null,
  created_at timestamptz default now() not null
);

alter table public.content_system enable row level security;

create policy "Authenticated users can read content_system"
  on public.content_system for select
  to authenticated
  using (true);

-- ============================================
-- 2. Content Competency — 12 physician tasks
-- ============================================
create table public.content_competency (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  display_name text not null,
  usmle_label text not null,
  weight_min numeric(4,2) not null,
  weight_max numeric(4,2) not null,
  maps_to_task_types text[] not null default '{}',
  sort_order integer not null,
  created_at timestamptz default now() not null
);

alter table public.content_competency enable row level security;

create policy "Authenticated users can read content_competency"
  on public.content_competency for select
  to authenticated
  using (true);

-- ============================================
-- 3. Content Discipline — 5 discipline specs
-- ============================================
create table public.content_discipline (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  display_name text not null,
  usmle_label text not null,
  weight_min numeric(4,2) not null,
  weight_max numeric(4,2) not null,
  maps_to_shelves text[] not null default '{}',
  sort_order integer not null,
  created_at timestamptz default now() not null
);

alter table public.content_discipline enable row level security;

create policy "Authenticated users can read content_discipline"
  on public.content_discipline for select
  to authenticated
  using (true);

-- ============================================
-- 4. Content Topic — full testable universe
-- ============================================
create table public.content_topic (
  id uuid default gen_random_uuid() primary key,
  content_system_id uuid references public.content_system(id) on delete cascade not null,
  topic_name text not null,
  category text,
  is_high_yield boolean not null default false,
  created_at timestamptz default now() not null,
  unique (content_system_id, topic_name)
);

alter table public.content_topic enable row level security;

create policy "Authenticated users can read content_topic"
  on public.content_topic for select
  to authenticated
  using (true);

-- ============================================
-- 5. ALTER blueprint_node — add FK to content_system
-- ============================================
alter table public.blueprint_node
  add column content_system_id uuid references public.content_system(id) on delete set null;

-- ============================================
-- INDEXES
-- ============================================
create index idx_content_topic_system
  on public.content_topic (content_system_id);

create index idx_content_topic_name
  on public.content_topic (topic_name);

create index idx_blueprint_node_content_system
  on public.blueprint_node (content_system_id);
