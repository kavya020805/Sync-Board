-- ============================================
-- Sync Board — Sprints & Milestones
-- Sprint 3
-- ============================================

-- ============================
-- PART 1: CREATE TABLES
-- ============================

create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  goal text,
  start_date date,
  end_date date,
  status text check (status in ('planned', 'active', 'completed')) default 'planned' not null,
  created_at timestamptz default now() not null
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  target_date date,
  status text check (status in ('open', 'closed')) default 'open' not null,
  created_at timestamptz default now() not null
);

-- Alter issues to reference sprints and milestones
alter table public.issues
  add column sprint_id uuid references public.sprints(id) on delete set null,
  add column milestone_id uuid references public.milestones(id) on delete set null;

-- ============================
-- PART 2: RLS POLICIES
-- ============================

alter table public.sprints enable row level security;
alter table public.milestones enable row level security;

-- Sprints Policies
create policy "Members can view sprints"
  on public.sprints for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = sprints.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can create sprints"
  on public.sprints for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = sprints.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can update sprints"
  on public.sprints for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = sprints.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can delete sprints"
  on public.sprints for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = sprints.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

-- Milestones Policies
create policy "Members can view milestones"
  on public.milestones for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can create milestones"
  on public.milestones for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can update milestones"
  on public.milestones for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can delete milestones"
  on public.milestones for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );
