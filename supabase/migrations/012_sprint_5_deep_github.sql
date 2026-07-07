-- ============================================
-- Sprint 5: Deep GitHub Integration
-- Two-way Issue Sync, GitHub Tokens, In-App PRs
-- ============================================

-- 1. Create table for securely storing user GitHub tokens
CREATE TABLE IF NOT EXISTS public.user_github_tokens (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS so only the owner can read/write their token
ALTER TABLE public.user_github_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own github tokens"
  ON public.user_github_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Add GitHub tracking columns to issues
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS github_issue_number INT,
ADD COLUMN IF NOT EXISTS github_issue_url TEXT;

-- Create an index to quickly lookup issues by GitHub number and project
CREATE INDEX IF NOT EXISTS idx_issues_github_number ON public.issues(project_id, github_issue_number);
