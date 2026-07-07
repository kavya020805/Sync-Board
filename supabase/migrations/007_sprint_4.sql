-- ============================================
-- Sprint 4: Activity, Comments, Notifications, GitHub Integration
-- ============================================

-- 1. Modify Projects table for GitHub repo linking
alter table public.projects 
add column if not exists github_repo_url text,
add column if not exists github_repo_owner text,
add column if not exists github_repo_name text;

-- 2. Create activity_log table
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text not null,
  field_changed text,
  old_value text,
  new_value text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS for activity_log
alter table public.activity_log enable row level security;
create policy "Workspace members can view activity logs"
  on public.activity_log for select
  using (
    exists (
      select 1 from public.issues i
      join public.projects p on i.project_id = p.id
      join public.workspace_members wm on p.workspace_id = wm.workspace_id
      where i.id = activity_log.issue_id
      and wm.user_id = auth.uid()
    )
  );

-- 3. Create comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  user_id uuid references public.profiles(id),
  body text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for comments
alter table public.comments enable row level security;
create policy "Workspace members can view comments"
  on public.comments for select
  using (
    exists (
      select 1 from public.issues i
      join public.projects p on i.project_id = p.id
      join public.workspace_members wm on p.workspace_id = wm.workspace_id
      where i.id = comments.issue_id
      and wm.user_id = auth.uid()
    )
  );

create policy "Workspace members can create comments"
  on public.comments for insert
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.issues i
      join public.projects p on i.project_id = p.id
      join public.workspace_members wm on p.workspace_id = wm.workspace_id
      where i.id = issue_id
      and wm.user_id = auth.uid()
    )
  );

create policy "Users can update their own comments"
  on public.comments for update
  using (user_id = auth.uid());

create policy "Users can delete their own comments"
  on public.comments for delete
  using (user_id = auth.uid());


-- 4. Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  issue_id uuid references public.issues(id) on delete set null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS for notifications
alter table public.notifications enable row level security;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update their own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());


-- 5. Create pull_requests table
create table if not exists public.pull_requests (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  pr_number int not null,
  title text,
  branch_name text,
  status text check (status in ('open', 'merged', 'closed')) default 'open',
  pr_url text,
  author text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, pr_number)
);

-- RLS for pull_requests
alter table public.pull_requests enable row level security;
create policy "Workspace members can view pull_requests"
  on public.pull_requests for select
  using (
    exists (
      select 1 from public.projects p
      join public.workspace_members wm on p.workspace_id = wm.workspace_id
      where p.id = pull_requests.project_id
      and wm.user_id = auth.uid()
    )
  );


-- ============================================
-- 6. Triggers for Activity Logging and Notifications
-- ============================================

-- Function to handle auto-updating `updated_at` on comments
create or replace function public.update_comments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_comment_updated
  before update on public.comments
  for each row execute function public.update_comments_updated_at();


-- Function to automatically log issue activities
create or replace function public.log_issue_activity()
returns trigger
language plpgsql
security definer
as $$
declare
  _user_id uuid := auth.uid();
begin
  -- Track column change
  if old.column_id is distinct from new.column_id then
    insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    values (new.id, _user_id, 'column_changed', 'column_id', old.column_id::text, new.column_id::text);
  end if;

  -- Track priority change
  if old.priority is distinct from new.priority then
    insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    values (new.id, _user_id, 'priority_changed', 'priority', old.priority, new.priority);
  end if;

  -- Track assignee change
  if old.assignee_id is distinct from new.assignee_id then
    if new.assignee_id is null then
      insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      values (new.id, _user_id, 'assignee_removed', 'assignee_id', old.assignee_id::text, null);
    else
      insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      values (new.id, _user_id, 'assignee_added', 'assignee_id', old.assignee_id::text, new.assignee_id::text);
      
      -- Send notification to assigned user
      if _user_id is null or new.assignee_id != _user_id then
        insert into public.notifications (user_id, type, title, message, issue_id)
        values (new.assignee_id, 'assigned', 'Issue Assigned', 'You were assigned to issue: ' || new.title, new.id);
      end if;
    end if;
  end if;

  -- Track sprint change
  if old.sprint_id is distinct from new.sprint_id then
    insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    values (new.id, _user_id, 'sprint_changed', 'sprint_id', old.sprint_id::text, new.sprint_id::text);
  end if;

  return new;
end;
$$;

create trigger on_issue_updated_log_activity
  after update on public.issues
  for each row execute function public.log_issue_activity();


-- Function to automatically log issue creation
create or replace function public.log_issue_creation()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.activity_log (issue_id, user_id, action)
  values (new.id, auth.uid(), 'issue_created');
  
  -- Send notification if assigned directly at creation
  if new.assignee_id is not null and new.assignee_id != auth.uid() then
    insert into public.notifications (user_id, type, title, message, issue_id)
    values (new.assignee_id, 'assigned', 'Issue Assigned', 'You were assigned to issue: ' || new.title, new.id);
  end if;
  
  return new;
end;
$$;

create trigger on_issue_created_log_activity
  after insert on public.issues
  for each row execute function public.log_issue_creation();
