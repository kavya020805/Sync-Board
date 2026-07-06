# Sprint 2 — Kanban Board & Issues

**Duration:** 3 weeks  
**Goal:** Build the full kanban board with drag-and-drop, issue CRUD with all fields, labels, and assignees.

**Depends on:** Sprint 1 (Auth, Workspaces, Projects)

---

## 🎯 Sprint Goals

- Customizable board columns with ordering and WIP limits
- Full issue CRUD with all fields (title, description, priority, story points, due date)
- Drag-and-drop between columns and within columns using float midpoint ordering
- Colour-coded labels system
- Multi-assignee support
- Issue detail modal with markdown editor
- Overdue issue highlighting

---

## 📦 Deliverables

### 1. Board Columns
- [ ] `board_columns` table (id, project_id, name, position, wip_limit, created_at)
- [ ] RLS policies scoped to workspace membership
- [ ] Default columns on project creation (Backlog, To Do, In Progress, Done)
- [ ] Add new column
- [ ] Rename column
- [ ] Delete column (with confirmation — moves issues to another column or deletes them)
- [ ] Reorder columns via drag-and-drop
- [ ] WIP limit setting per column
- [ ] Visual warning when column exceeds WIP limit (highlighted header, count badge)

### 2. Issues — Core CRUD
- [ ] `issues` table (id, project_id, column_id, sprint_id, milestone_id, title, description, priority, story_points, due_date, position, issue_number, created_by, created_at, updated_at)
- [ ] RLS policies scoped to workspace membership
- [ ] Auto-increment issue number per project (e.g., SB-1, SB-2, SB-3)
- [ ] Create issue — quick create (title only) from column header
- [ ] Create issue — full form with all fields
- [ ] Edit issue (inline title edit on card, full edit in modal)
- [ ] Delete issue (with confirmation)
- [ ] Issue card component displaying: title, issue number, priority icon, assignee avatars, label badges, due date, story points

### 3. Drag & Drop
- [ ] Install and configure `@dnd-kit` (core, sortable, utilities)
- [ ] Drag issue cards between columns (updates `column_id` + `position`)
- [ ] Drag issue cards within a column to reorder (updates `position`)
- [ ] Float midpoint ordering: new position = `(cardAbove.position + cardBelow.position) / 2`
- [ ] Handle edge cases: drop at top (position = first / 2), drop at bottom (position = last + 1000)
- [ ] Drag column headers to reorder columns
- [ ] Visual drag overlay / placeholder
- [ ] Optimistic UI updates (move card instantly, sync to DB in background)

### 4. Issue Detail Modal
- [ ] Full-screen or side-panel modal for issue details
- [ ] Title (editable inline)
- [ ] Markdown description with editor and preview toggle (using `react-markdown` + `remark-gfm`)
- [ ] Priority selector (None, Low, Medium, High, Urgent) with colour-coded icons
- [ ] Story points input
- [ ] Due date picker (with calendar component from shadcn/ui)
- [ ] Status / column selector dropdown
- [ ] Created by & created date display
- [ ] Delete issue button

### 5. Labels
- [ ] `labels` table (id, project_id, name, color, created_at)
- [ ] `issue_labels` junction table (issue_id, label_id)
- [ ] RLS policies
- [ ] Create label (name + colour picker)
- [ ] Edit label
- [ ] Delete label
- [ ] Assign/remove labels on an issue (multi-select dropdown)
- [ ] Label badges on issue cards

### 6. Assignees
- [ ] `issue_assignees` junction table (issue_id, user_id)
- [ ] RLS policies
- [ ] Assign members to an issue (multi-select dropdown showing workspace members)
- [ ] Remove assignee
- [ ] Assignee avatar stack on issue cards (show first 3, +N for more)

### 7. Due Date Highlighting
- [ ] Issues past due date get a red border / badge on the card
- [ ] Due date shows relative time (e.g., "2 days overdue", "Due tomorrow")

---

## 🗄️ Database Tables (this sprint)

```sql
-- board_columns
create table board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  position float not null default 0,
  wip_limit int,
  created_at timestamptz default now()
);

-- issues
create table issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  column_id uuid references board_columns(id) on delete set null,
  sprint_id uuid, -- FK added in Sprint 3
  milestone_id uuid, -- FK added in Sprint 3
  title text not null,
  description text,
  priority text check (priority in ('none', 'low', 'medium', 'high', 'urgent')) default 'none',
  story_points int,
  due_date date,
  position float not null default 0,
  issue_number int not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- labels
create table labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- issue_labels
create table issue_labels (
  issue_id uuid references issues(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (issue_id, label_id)
);

-- issue_assignees
create table issue_assignees (
  issue_id uuid references issues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (issue_id, user_id)
);
```

---

## ✅ Definition of Done

- User can see a kanban board with customizable columns
- User can create, edit, and delete issues with all fields
- Drag-and-drop works for both issues and columns with smooth animations
- Float midpoint ordering — only the moved card writes to DB
- WIP limits show visual warnings when exceeded
- Labels can be created, coloured, and assigned to issues
- Multiple assignees can be added to an issue
- Overdue issues are visually highlighted
- Issue detail modal shows full markdown preview
