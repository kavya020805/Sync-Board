-- ============================================
-- Sprint 5: Dashboards, Analytics, Productivity
-- ============================================

-- Add story_points and due_date to issues table
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS story_points integer,
ADD COLUMN IF NOT EXISTS due_date timestamptz;
