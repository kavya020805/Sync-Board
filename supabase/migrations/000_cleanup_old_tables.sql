-- ============================================
-- Sync Board — Cleanup Old Tables
-- Run this BEFORE 001_initial_schema.sql
-- ============================================
-- WARNING: This drops ALL existing tables and data.
-- Only run this if you're okay losing everything in this project.

-- Drop existing triggers first
drop trigger if exists on_auth_user_created on auth.users;

-- Drop existing functions
drop function if exists public.handle_new_user();
drop function if exists public.is_workspace_member(uuid);
drop function if exists public.get_workspace_role(uuid);

-- Drop all existing tables (order matters due to foreign keys)
-- Drop tables that reference others first
drop table if exists public._migrations cascade;
drop table if exists public.linked_prs cascade;
drop table if exists public.issue_labels cascade;
drop table if exists public.issue_assignees cascade;
drop table if exists public.issue_events cascade;
drop table if exists public.issue_status_log cascade;
drop table if exists public.sprint_issues cascade;
drop table if exists public.comments cascade;
drop table if exists public.notifications cascade;
drop table if exists public.labels cascade;
drop table if exists public.issues cascade;
drop table if exists public.columns cascade;
drop table if exists public.boards cascade;
drop table if exists public.sprints cascade;
drop table if exists public.board_columns cascade;
drop table if exists public.projects cascade;
drop table if exists public.workspace_members cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.profiles cascade;

-- Clean up storage policies if any exist
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Avatars are publicly accessible" on storage.objects;
