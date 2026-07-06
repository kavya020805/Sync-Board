-- ============================================
-- Sync Board — Bugfixes for Invites & Realtime
-- ============================================

-- 1. Fix Realtime Filter silently dropping events
-- For Supabase Realtime to filter on `project_id` during UPDATE/DELETE,
-- the table must have REPLICA IDENTITY FULL so the payload includes all columns.
alter table public.issues replica identity full;
alter table public.board_columns replica identity full;
alter table public.sprints replica identity full;

-- 2. Fix Case Sensitivity in Invite Linking
-- Make sure if someone invites 'Test@example.com' and they sign up as 'test@example.com',
-- the trigger still matches them.
create or replace function public.link_invites_on_signup()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.workspace_members
  set user_id = new.id
  where lower(invited_email) = lower(new.email)
    and user_id is null;
  return new;
end;
$$;
