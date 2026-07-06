# 📋 Sync Board — Sprint Plan

This document outlines the sprint breakdown for the Sync Board project. Each sprint is ~3 weeks.

---

## Sprint Summary

| Sprint | Name | Focus Area | Duration |
|--------|------|------------|----------|
| 1 | Foundation, Auth & Workspaces | Project setup, auth, profiles, workspaces, projects, roles, RLS, dark mode | 3 weeks |
| 2 | Kanban Board & Issues | Columns, issue cards, drag-and-drop, float midpoint ordering, WIP limits, labels, assignees, markdown editor, priority, story points, due dates | 3 weeks |
| 3 | Real-time, Sprints & Collaboration | Supabase Realtime sync, presence, sprint planning, backlog, burndown & velocity charts, milestones | 3 weeks |
| 4 | Activity, Comments, Notifications & GitHub | Activity feed, threaded comments, @mentions, notification inbox, GitHub OAuth, PR auto-linking, webhook Edge Function | 3 weeks |
| 5 | Dashboards, Productivity & Deployment | Project dashboard, workspace analytics, command palette, keyboard shortcuts, responsive polish, deployment | 2 weeks |

**Total estimated duration: ~14 weeks**

---

## Dependency Graph

```
Sprint 1 (Auth & Workspaces)
  └── Sprint 2 (Kanban & Issues)
        ├── Sprint 3 (Realtime, Sprints & Collaboration)
        │     └── Sprint 5 (Dashboards & Deployment)
        └── Sprint 4 (Activity, Notifications & GitHub)
              └── Sprint 5 (Dashboards & Deployment)
```

---

## Individual Sprint Docs

| Sprint | Document |
|--------|----------|
| Sprint 1 | [sprint-1.md](./sprint-1.md) |
| Sprint 2 | [sprint-2.md](./sprint-2.md) |
| Sprint 3 | [sprint-3.md](./sprint-3.md) |
| Sprint 4 | [sprint-4.md](./sprint-4.md) |
| Sprint 5 | [sprint-5.md](./sprint-5.md) |
