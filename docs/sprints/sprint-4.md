# Sprint 4 — Activity, Comments, Notifications & GitHub Integration

**Duration:** 3 weeks  
**Goal:** Build the activity feed, threaded comments with @mentions, real-time notifications, and GitHub PR integration with webhooks.

**Depends on:** Sprint 2 (Issues), Sprint 3 (Realtime)

---

## 🎯 Sprint Goals

- Activity feed logging all issue changes
- Threaded comments with markdown support and @mention autocomplete
- Real-time notification system with unread count
- GitHub OAuth App integration for linking repositories
- Automatic PR ↔ issue linking via branch names and PR body
- Supabase Edge Function for GitHub webhook verification

---

## 📦 Deliverables

### 1. Activity Feed
- [ ] `activity_log` table (id, issue_id, user_id, action, field_changed, old_value, new_value, metadata, created_at)
- [ ] RLS policies
- [ ] Log activity on: status change, priority change, assignee add/remove, label add/remove, sprint assignment, milestone assignment, PR linked
- [ ] Activity feed component in the issue detail modal (chronological list)
- [ ] Activity entry format: `"Kavya changed priority from Medium to High"`, `"Kavya moved issue to In Progress"`
- [ ] Use database triggers or application-level logging (on every issue update, insert activity row)

### 2. Threaded Comments
- [ ] `comments` table (id, issue_id, user_id, body, parent_id, created_at, updated_at)
- [ ] RLS policies
- [ ] Comment input with markdown editor
- [ ] Comment display with rendered markdown (react-markdown)
- [ ] Edit own comment
- [ ] Delete own comment
- [ ] Thread replies (reply to a comment — `parent_id` reference)
- [ ] Real-time: new comments appear instantly via Supabase Realtime

### 3. @Mentions
- [ ] Typing `@` in a comment opens an autocomplete dropdown
- [ ] Dropdown shows workspace members (filtered by typing)
- [ ] Selecting a member inserts `@display_name` into the comment body
- [ ] On comment submit, parse `@mentions` and create notifications for mentioned users

### 4. Notifications
- [ ] `notifications` table (id, user_id, type, title, message, issue_id, is_read, created_at)
- [ ] Notification types: `mention`, `assigned`, `comment`, `status_change`
- [ ] RLS policies — users can only see their own notifications
- [ ] Notification bell icon in navbar with unread count badge
- [ ] Notification dropdown/panel listing recent notifications
- [ ] Click notification → navigate to the relevant issue
- [ ] Mark as read (individual + mark all as read)
- [ ] Real-time: subscribe to `notifications` table for current user → update badge count instantly
- [ ] Create notifications on: @mention, issue assigned to user, comment on assigned issue

### 5. GitHub OAuth Integration
- [ ] Add `github_repo_url`, `github_repo_owner`, `github_repo_name` columns to `projects` table
- [ ] GitHub OAuth App setup (client ID + client secret)
- [ ] "Connect GitHub Repo" button in project settings
- [ ] OAuth flow to get user's access token
- [ ] Repo picker — list user's repos and select one to link
- [ ] Store repo info on the project record
- [ ] Disconnect repo option

### 6. GitHub Webhook — Edge Function
- [ ] Create Supabase Edge Function: `supabase/functions/github-webhook/index.ts`
- [ ] Verify incoming webhook payload with HMAC-SHA256 using `GITHUB_WEBHOOK_SECRET`
- [ ] Handle `pull_request` events (opened, closed, merged, reopened)
- [ ] Parse branch name for pattern `sb-<issue_number>` or PR body/title for `#<issue_number>`
- [ ] Match to issue in the correct project
- [ ] Upsert into `pull_requests` table

### 7. Pull Requests Table & Display
- [ ] `pull_requests` table (id, issue_id, project_id, pr_number, title, branch_name, status, pr_url, author, created_at, updated_at)
- [ ] PR statuses: `open`, `merged`, `closed`
- [ ] RLS policies
- [ ] PR status badge on issue cards (🟢 Open, 🟣 Merged, 🔴 Closed)
- [ ] PR details section in issue detail modal (link to GitHub, status, branch)
- [ ] Real-time: subscribe to `pull_requests` changes → update badges instantly

---

## 🗄️ Database Tables (this sprint)

```sql
-- activity_log
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  user_id uuid references profiles(id),
  action text not null, -- 'status_changed', 'priority_changed', 'assignee_added', etc.
  field_changed text,
  old_value text,
  new_value text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  user_id uuid references profiles(id),
  body text not null,
  parent_id uuid references comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- 'mention', 'assigned', 'comment', 'status_change'
  title text not null,
  message text,
  issue_id uuid references issues(id) on delete set null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- pull_requests
create table pull_requests (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  pr_number int not null,
  title text,
  branch_name text,
  status text check (status in ('open', 'merged', 'closed')) default 'open',
  pr_url text,
  author text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## ✅ Definition of Done

- Every issue change is logged in the activity feed
- Users can leave threaded markdown comments on issues
- @mention autocomplete works and triggers notifications
- Notification inbox shows unread count in real time
- Clicking a notification navigates to the correct issue
- GitHub repo can be linked to a project
- PRs matching `sb-<number>` or `#<number>` auto-link to issues
- Webhook Edge Function verifies HMAC signature and updates PR status
- PR badges appear on issue cards and update in real time
