-- ============================================
-- Sync Board — Enable Supabase Realtime
-- Backfill Phase A / Bugfixes
-- ============================================

-- By default, Supabase does not broadcast changes for all tables.
-- We must explicitly add the tables to the supabase_realtime publication.

-- We are enabling realtime for:
-- 1. issues
-- 2. board_columns
-- 3. sprints (for future use)

alter publication supabase_realtime add table issues;
alter publication supabase_realtime add table board_columns;
alter publication supabase_realtime add table sprints;
