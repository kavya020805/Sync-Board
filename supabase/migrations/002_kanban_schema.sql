-- ============================================
-- Sync Board — Kanban Schema Additions
-- Sprint 2: Kanban Board (Issues & State)
-- ============================================

-- ============================
-- PART 1: CREATE TABLES
-- ============================

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  column_id uuid references public.board_columns(id) on delete cascade not null,
  title text not null,
  description text,
  position float not null default 0,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium' not null,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================
-- PART 2: TRIGGERS
-- ============================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_issue_updated
  before update on public.issues
  for each row execute function public.handle_updated_at();

-- ============================
-- PART 3: RLS POLICIES
-- ============================

alter table public.issues enable row level security;

create policy "Members can view issues"
  on public.issues for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = issues.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can create issues"
  on public.issues for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = issues.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can update issues"
  on public.issues for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = issues.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );

create policy "Members can delete issues"
  on public.issues for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = issues.project_id
        and public.is_workspace_member(projects.workspace_id)
    )
  );
