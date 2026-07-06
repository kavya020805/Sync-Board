# Sprint 5 — Dashboards, Productivity & Deployment

**Duration:** 2 weeks  
**Goal:** Build project and workspace dashboards, add productivity features (command palette, keyboard shortcuts), polish the UI, and deploy.

**Depends on:** Sprints 1–4 (all features built)

---

## 🎯 Sprint Goals

- Project dashboard as the home screen for each project
- Workspace-level analytics page
- Command palette (`Ctrl+K`) for quick navigation
- Keyboard shortcuts with `?` reference overlay
- Responsive design polish
- Production deployment

---

## 📦 Deliverables

### 1. Project Dashboard
- [ ] Dashboard as the default landing page when entering a project
- [ ] **Issues by Status** — donut/pie chart showing issue count per column (Recharts)
- [ ] **Current Sprint Progress** — progress bar or mini burndown showing remaining vs completed story points
- [ ] **Recent Activity** — last 10 activity log entries across the project
- [ ] **Overdue Issues** — list of issues past their due date with links to each
- [ ] **Quick Stats Cards** — total issues, open issues, completed issues, active sprint name
- [ ] All data fetched via Supabase queries (no separate API)

### 2. Workspace Analytics
- [ ] Analytics page accessible from workspace sidebar
- [ ] **Issues Created vs Closed (This Month)** — bar chart comparing created and closed issues week by week
- [ ] **Team Velocity** — line chart showing story points completed per sprint across all projects
- [ ] **Priority Distribution** — stacked bar or pie chart showing issue count by priority level
- [ ] **Member Activity** — table showing issues assigned, completed, and commented per member
- [ ] Date range selector (this week, this month, last 30 days)

### 3. Command Palette (`Ctrl+K`)
- [ ] Global `Ctrl+K` (or `Cmd+K` on Mac) keyboard listener
- [ ] Modal with search input and results list
- [ ] Search across:
  - Issues (by title and issue number)
  - Projects (by name)
  - Board columns / views
- [ ] Action items:
  - "Create new issue"
  - "Go to board"
  - "Go to backlog"
  - "Go to settings"
- [ ] Keyboard navigation (arrow keys + Enter to select)
- [ ] Fuzzy matching for search results
- [ ] `Esc` to close

### 4. Keyboard Shortcuts
- [ ] `?` — open keyboard shortcut reference modal
- [ ] `N` — create new issue (when on board view)
- [ ] `Ctrl+K` — command palette
- [ ] `Esc` — close any open modal or palette
- [ ] Shortcut reference modal listing all available shortcuts
- [ ] Shortcuts disabled when typing in an input/textarea

### 5. UI Polish & Responsive Design
- [ ] Review all pages on mobile, tablet, and desktop breakpoints
- [ ] Sidebar collapses to hamburger menu on mobile
- [ ] Board scrolls horizontally on smaller screens
- [ ] Issue detail modal is full-screen on mobile
- [ ] Loading skeletons for all data-fetching states
- [ ] Empty states with helpful illustrations/messages (no blank pages)
- [ ] Toast notifications for success/error actions (using sonner or shadcn toast)
- [ ] Consistent spacing, typography, and colour usage throughout
- [ ] Smooth transitions and micro-animations (hover effects, modal entrances)
- [ ] Accessibility basics (focus rings, aria labels, keyboard navigation)

### 6. Deployment
- [ ] Build production bundle (`npm run build`)
- [ ] Deploy frontend to **Vercel**
  - Connect GitHub repo
  - Set environment variables
  - Configure build command and output directory
- [ ] Supabase production setup
  - Run all migrations on production Supabase project
  - Enable Realtime on required tables
  - Deploy Edge Function (`supabase functions deploy github-webhook`)
  - Set Edge Function secrets (`GITHUB_WEBHOOK_SECRET`)
  - Configure Storage bucket and policies
- [ ] Configure custom domain (if applicable)
- [ ] Test full flow end-to-end on production
  - Sign up → create workspace → invite member → create project → board → sprints → comments → notifications

---

## ✅ Definition of Done

- Project dashboard shows live stats, sprint progress, recent activity, and overdue issues
- Workspace analytics displays charts for velocity, priority distribution, and issue trends
- `Ctrl+K` opens command palette with search and quick actions
- `?` opens keyboard shortcut reference
- App is responsive and looks good on all screen sizes
- All empty states and loading states are polished
- App is deployed and accessible via a public URL
- Full end-to-end flow works in production
