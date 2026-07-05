-- ============================================
-- Sync Board — Initial Database Schema
-- Sprint 1: Auth, Profiles, Workspaces, Projects
-- ============================================
-- IMPORTANT: Tables first, then helper functions,
-- then RLS policies. Helper functions use SECURITY
-- DEFINER to avoid infinite recursion on self-
-- referencing policies.
-- ============================================


-- ============================
-- PART 1: CREATE TABLES
-- ============================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member')) default 'member' not null,
  invited_email text,
  status text check (status in ('pending', 'accepted')) default 'accepted' not null,
  joined_at timestamptz default now() not null,
  unique(workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  key text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null,
  unique(workspace_id, key)
);

create table public.board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  position float not null default 0,
  wip_limit int,
  created_at timestamptz default now() not null
);


-- ============================
-- PART 2: HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================
-- These bypass RLS internally to avoid infinite
-- recursion when workspace_members policies
-- reference workspace_members itself.

-- Check if current user is a member of a workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = 'public'
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and status = 'accepted'
  );
$$;

-- Get current user's role in a workspace (returns null if not a member)
create or replace function public.get_workspace_role(ws_id uuid)
returns text
language sql
security definer
set search_path = 'public'
stable
as $$
  select role from workspace_members
  where workspace_id = ws_id
    and user_id = auth.uid()
    and status = 'accepted'
  limit 1;
$$;


-- ============================
-- PART 3: AUTO-PROFILE TRIGGER
-- ============================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================
-- PART 4: ENABLE RLS
-- ============================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.board_columns enable row level security;


-- ============================
-- PART 5: RLS POLICIES
-- ============================

-- ---- PROFILES ----
create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---- WORKSPACES ----
create policy "Members can view workspace"
  on public.workspaces for select
  using (
    created_by = auth.uid()
    or public.is_workspace_member(id)
  );

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() is not null);

create policy "Admins can update workspace"
  on public.workspaces for update
  using (public.get_workspace_role(id) in ('owner', 'admin'));

create policy "Owners can delete workspace"
  on public.workspaces for delete
  using (public.get_workspace_role(id) = 'owner');

-- ---- WORKSPACE MEMBERS ----
-- SELECT: user can see members of workspaces they belong to
create policy "Members can view workspace members"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

-- INSERT: user can add themselves (creating workspace) OR admins can invite
create policy "Users can join or admins can invite"
  on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    or
    public.get_workspace_role(workspace_id) in ('owner', 'admin')
  );

-- UPDATE: admins/owners can change roles
create policy "Admins can update members"
  on public.workspace_members for update
  using (public.get_workspace_role(workspace_id) in ('owner', 'admin'));

-- DELETE: self-remove or admin/owner remove
create policy "Self or admins can remove members"
  on public.workspace_members for delete
  using (
    user_id = auth.uid()
    or
    public.get_workspace_role(workspace_id) in ('owner', 'admin')
  );

-- ---- PROJECTS ----
create policy "Members can view projects"
  on public.projects for select
  using (public.is_workspace_member(workspace_id));

create policy "Members can create projects"
  on public.projects for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Admins can update projects"
  on public.projects for update
  using (public.get_workspace_role(workspace_id) in ('owner', 'admin'));

create policy "Admins can delete projects"
  on public.projects for delete
  using (public.get_workspace_role(workspace_id) in ('owner', 'admin'));

-- ---- BOARD COLUMNS ----
create policy "Members can view board columns"
  on public.board_columns for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = board_columns.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can create board columns"
  on public.board_columns for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = board_columns.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can update board columns"
  on public.board_columns for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = board_columns.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can delete board columns"
  on public.board_columns for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = board_columns.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );


-- ============================
-- PART 6: STORAGE
-- ============================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() is not null);

create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');
