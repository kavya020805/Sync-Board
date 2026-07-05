<p align="center">
  <h1 align="center">🔄 Sync Board</h1>
  <p align="center">
    A real-time collaborative project management tool for small dev teams.
    <br />
    Lightweight alternative to Jira & Linear — powered entirely by Supabase.
  </p>
</p>

---

## Overview

Sync Board is a full-stack team project management web application built for small development teams who need a clean, fast, and collaborative tool to manage their work — without the bloat of enterprise software.

At its core, Sync Board provides a **real-time kanban board** where issues can be dragged between columns and every connected teammate sees the change instantly. No refreshing, no polling — powered entirely by **Supabase Realtime**. There is no separate backend server — the entire backend runs on Supabase (PostgreSQL, Auth, Realtime, Storage), with the only server-side code being a single Supabase Edge Function for GitHub webhook verification.

---

## Features

### 🗂️ Workspaces & Teams
- Create workspaces to organize projects
- Invite members by email with role-based access: **Owner**, **Admin**, **Member**
- Row Level Security (RLS) enforced at the database level

### 📋 Kanban Board
- Drag-and-drop issues between customizable columns
- Real-time sync across all connected clients via Supabase Realtime
- Float midpoint ordering — reordering requires only a single DB write
- WIP (Work In Progress) limits with visual warnings

### 📝 Issues
- Title, Markdown description, priority level, story points, due date
- Colour-coded labels and multiple assignees
- Overdue issues auto-highlighted with a red border
- Linked GitHub PRs shown as status badges (open / merged / closed)

### 🏃 Sprint Planning
- Time-boxed sprints with name, goal, and start/end dates
- Pull issues from backlog into active sprints
- **Burndown chart** — remaining story points vs ideal completion line
- **Velocity chart** — story points completed across the last 6 sprints

### 🎯 Milestones
- Group issues under larger goals (product launch, version release)
- Track progress across multiple sprints

### 💬 Activity & Comments
- Activity feed logging every status change, assignee update, priority change, and linked PR
- Threaded comments with full Markdown support
- `@mention` autocomplete — triggers instant notifications

### 🔔 Notifications
- Real-time notification inbox with unread count badge
- Click to jump directly to the relevant issue

### 🔗 GitHub Integration
- Link a GitHub repo to a project via OAuth App
- PRs matching `sb-<issue_number>` or containing `#<issue_number>` auto-link to issues
- PR status badges update in real time via webhook (HMAC-SHA256 verified)

### 📊 Dashboards & Analytics
- **Project Dashboard** — issues by status, sprint progress, recent activity, overdue issues
- **Workspace Analytics** — issues created/closed, team velocity, priority distribution

### ⚡ Productivity
- `Ctrl+K` command palette — search issues, jump to boards, create issues
- `?` keyboard shortcut reference overlay
- Live presence avatars on the board
- Dark mode (persists across sessions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, shadcn/ui |
| **State & Data** | TanStack Query (React Query) |
| **Drag & Drop** | dnd-kit |
| **Markdown** | react-markdown + remark-gfm |
| **Charts** | Recharts |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Realtime** | Supabase Realtime (Postgres Changes + Presence) |
| **Storage** | Supabase Storage |
| **Edge Functions** | Supabase Edge Functions (Deno) |
| **Deployment** | Vercel (frontend) + Supabase (backend) |