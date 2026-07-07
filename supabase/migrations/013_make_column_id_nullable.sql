-- ============================================
-- Sprint 5 Bugfix: Make column_id nullable
-- ============================================

ALTER TABLE public.issues ALTER COLUMN column_id DROP NOT NULL;
