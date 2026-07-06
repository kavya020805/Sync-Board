-- ============================================
-- Sync Board — Invites RLS & Triggers
-- Backfill Phase A
-- ============================================

-- ============================
-- PART 1: RLS POLICIES FOR INVITES
-- ============================

-- Allow users to see their own pending invites
create policy "Users can view their own invites"
  on public.workspace_members for select
  using (
    -- Either they are linked by user_id
    user_id = auth.uid()
    or 
    -- Or their profile email matches the invited_email
    invited_email = (select email from public.profiles where id = auth.uid())
  );

-- Allow users to update their own pending invites (to accept/decline)
create policy "Users can update their own invites"
  on public.workspace_members for update
  using (
    user_id = auth.uid()
    or 
    invited_email = (select email from public.profiles where id = auth.uid())
  );

-- ============================
-- PART 2: AUTO-LINK INVITES ON SIGNUP
-- ============================
-- When a user signs up, if they have any pending invites by email,
-- we should link their new user_id to those invites.

create or replace function public.link_invites_on_signup()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.workspace_members
  set user_id = new.id
  where invited_email = new.email
    and user_id is null;
  return new;
end;
$$;

create trigger on_profile_created_link_invites
  after insert on public.profiles
  for each row execute function public.link_invites_on_signup();
