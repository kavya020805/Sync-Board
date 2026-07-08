-- ============================================
-- Sprint 6: Advanced Workflows & Timelines
-- ============================================

-- 1. Create Epics Table
create table if not exists public.epics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('planning', 'in_progress', 'completed')) default 'planning' not null,
  start_date timestamptz,
  due_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Triggers for Epics updated_at
create trigger on_epic_updated
  before update on public.epics
  for each row execute function public.handle_updated_at();

alter table public.epics enable row level security;

create policy "Members can view epics"
  on public.epics for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = epics.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can modify epics"
  on public.epics for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = epics.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

-- 2. Modify Issues Table (Timeline, Epics, Subtasks)
alter table public.issues
  add column if not exists start_date timestamptz,
  add column if not exists epic_id uuid references public.epics(id) on delete set null,
  add column if not exists parent_id uuid references public.issues(id) on delete cascade;

-- 3. Create Automations Table
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  trigger_event text not null,  -- e.g., 'github_pr_merged', 'github_pr_opened'
  action_type text not null,    -- e.g., 'move_issue', 'ping_assignee'
  action_payload jsonb not null, -- e.g., {"column_id": "uuid-here"}
  created_at timestamptz default now() not null
);

alter table public.automations enable row level security;

create policy "Members can view automations"
  on public.automations for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = automations.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can modify automations"
  on public.automations for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = automations.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );
