# Sprint 3 — Real-time Sync, Sprints & Collaboration

**Duration:** 3 weeks  
**Goal:** Make the board real-time with Supabase Realtime, add presence tracking, build sprint planning with charts, and implement milestones.

**Depends on:** Sprint 2 (Kanban Board & Issues)

---

## 🎯 Sprint Goals

- Real-time board sync — all changes visible instantly to all connected users
- Live presence avatars showing who's viewing the board
- Sprint CRUD with backlog management
- Burndown and velocity charts
- Milestones for grouping work under larger goals

---

## 📦 Deliverables

### 1. Supabase Realtime — Board Sync
- [ ] Subscribe to `issues` table changes (INSERT, UPDATE, DELETE) filtered by project_id
- [ ] Subscribe to `board_columns` table changes
- [ ] Subscribe to `issue_labels` and `issue_assignees` changes
- [ ] On remote change → update local TanStack Query cache (invalidate or patch)
- [ ] Handle conflicts: if a user drags an issue that was just deleted by another user, show a toast and remove it
- [ ] Optimistic updates for local user + realtime updates for remote users
- [ ] Unsubscribe from channels on unmount / project switch

### 2. Live Presence
- [ ] Use Supabase Presence to track users on a board channel
- [ ] On board mount → track user (send user_id, display_name, avatar_url)
- [ ] On board unmount → untrack user
- [ ] Display presence avatars in the board header (avatar stack with tooltip showing names)
- [ ] Animate avatar entry/exit (fade in/out)

### 3. Sprint Planning
- [ ] `sprints` table (id, project_id, name, goal, start_date, end_date, status, created_at)
- [ ] Sprint statuses: `planned`, `active`, `completed`
- [ ] RLS policies scoped to workspace membership
- [ ] Create sprint (name, goal, start date, end date)
- [ ] Edit sprint details
- [ ] Start sprint (change status to `active` — only one active sprint at a time)
- [ ] Complete sprint (move incomplete issues back to backlog or next sprint)
- [ ] Delete sprint

### 4. Backlog Management
- [ ] Backlog view — shows all issues not assigned to any sprint
- [ ] Assign issues to a sprint (from backlog or board)
- [ ] Remove issues from a sprint (back to backlog)
- [ ] Sprint filter on the board — toggle to show only issues in the active sprint
- [ ] Bulk actions: select multiple issues → assign to sprint

### 5. Burndown Chart
- [ ] Track daily snapshot of remaining story points for the active sprint
- [ ] Create a `sprint_snapshots` table or calculate on the fly from `activity_log`
- [ ] Line chart with two lines:
  - **Ideal line** — linear from total story points to 0 over sprint duration
  - **Actual line** — remaining story points per day
- [ ] Built with Recharts
- [ ] Display on the sprint detail page

### 6. Velocity Chart
- [ ] Bar chart showing story points completed per sprint (last 6 sprints)
- [ ] Calculate from completed issues in each sprint
- [ ] Show average velocity line
- [ ] Built with Recharts
- [ ] Display on the sprint detail page

### 7. Milestones
- [ ] `milestones` table (id, project_id, name, description, target_date, status, created_at)
- [ ] Milestone statuses: `open`, `closed`
- [ ] RLS policies
- [ ] Create milestone (name, description, target date)
- [ ] Edit and delete milestones
- [ ] Assign issues to a milestone (dropdown in issue detail)
- [ ] Milestone progress bar (% of linked issues completed)
- [ ] Milestones list page within a project

---

## 🗄️ Database Tables (this sprint)

```sql
-- sprints
create table sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  goal text,
  start_date date,
  end_date date,
  status text check (status in ('planned', 'active', 'completed')) default 'planned',
  created_at timestamptz default now()
);

-- milestones
create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  target_date date,
  status text check (status in ('open', 'closed')) default 'open',
  created_at timestamptz default now()
);

-- Add FK to issues table
alter table issues
  add constraint issues_sprint_fk foreign key (sprint_id) references sprints(id) on delete set null,
  add constraint issues_milestone_fk foreign key (milestone_id) references milestones(id) on delete set null;
```

---

## ✅ Definition of Done

- Board changes sync in real time across all connected clients
- Presence avatars show who's currently viewing the board
- User can create, start, and complete sprints
- Backlog view works and issues can be assigned to sprints
- Burndown chart renders correctly for the active sprint
- Velocity chart shows data from the last 6 completed sprints
- Milestones can be created and issues linked to them
- All new tables protected by RLS
