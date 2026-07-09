<p align="center">
  <h1 align="center">🔄 Sync Board</h1>
  <p align="center">
    A real-time, AI-powered collaborative project management platform.
    <br />
    Designed for high-velocity software teams, powered by Supabase and Gemini AI.
  </p>
</p>

---

## Overview

Sync Board is a full-stack, multi-tenant team project management web application built for development teams who need a fast, intelligent, and collaborative tool to manage their agile workflows. 

At its core, Sync Board provides a **WebSocket-driven real-time Kanban board**, interactive Gantt charts, and deep hierarchical workflows (Epics & Subtasks). It leverages a custom **Automations Rules Engine** to programmatically trigger state changes based on external events (like GitHub PR merges). To eliminate manual overhead, Sync Board deeply integrates **Gemini AI** to auto-triage incoming issues, generate comprehensive task drafts, and predictively break down complex epics into actionable subtasks.

---

## 🌟 Key Features

### 🤖 Gemini AI Integrations
- **Magic Draft:** AI-generates comprehensive, well-structured issue descriptions and acceptance criteria from a simple title.
- **Smart Breakdown:** AI predictively analyzes Epics and automatically generates a checklist of actionable subtasks.
- **Auto Triage:** AI reads incoming issue descriptions and automatically assigns the correct severity/priority level.
- **Sprint Summaries:** AI generates human-readable sprint velocity reports and progress summaries based on closed/open issues.

### ⚙️ Automations Rules Engine
- Custom serverless rules engine powered by Supabase Edge Functions.
- Triggers autonomous workflow transitions based on GitHub webhook events.
- Dynamically moves issues across Kanban columns (e.g., auto-closing issues when a PR is merged).

### 📋 Real-Time Kanban & Workflows
- WebSocket-driven synchronization across all connected clients.
- Fully customizable workflow columns per project.
- Deep hierarchical structure linking **Epics**, **Issues**, and **Subtasks**.
- Float midpoint ordering ensures drag-and-drop reordering requires only a single DB write.

### 📅 Gantt Timelines & Sprints
- Interactive Gantt chart timeline for visually scheduling Epics and Issues.
- Time-boxed sprints with dynamic velocity tracking and burndown charts.
- Overdue tasks are automatically highlighted with visual indicators.

### 🗂️ Multi-Tenant Security & RBAC
- Dedicated Workspaces for isolating different organizations or teams.
- Role-based access control (Owner, Admin, Member).
- Strict data isolation enforced natively at the database level via **PostgreSQL Row-Level Security (RLS)**.

### 🔗 Deep GitHub Integration
- OAuth integration to link GitHub repositories directly to projects.
- Pull Requests containing issue IDs (`sb-<id>`) are automatically linked.
- Live PR status badges (Open / Merged / Closed) update instantly on the board.

### ⚡ Productivity & UX
- `Ctrl+K` command palette for lightning-fast global search and navigation.
- Live user presence avatars (see who is actively viewing the board).
- Threaded Markdown comments with `@mention` autocomplete and in-app notifications.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, shadcn/ui |
| **Artificial Intelligence** | Google Gemini API (2.5 Flash) |
| **State Management** | Zustand, TanStack Query (React Query) |
| **Interactions** | dnd-kit (Drag & Drop), Recharts (Analytics) |
| **Database** | Supabase (PostgreSQL) |
| **Security** | Supabase Auth, Row-Level Security (RLS) |
| **Realtime** | Supabase Realtime (WebSockets + Presence) |
| **Serverless** | Supabase Edge Functions (Deno) |
| **Deployment** | Vercel (Frontend) + Supabase (Backend) |