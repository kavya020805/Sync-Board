# Sprint 1 — Foundation, Auth & Workspaces

**Duration:** 3 weeks  
**Goal:** Set up the project from scratch, implement full authentication flow, user profiles, workspace & project management with role-based access.

---

## 🎯 Sprint Goals

- Scaffold the React + Vite project with Tailwind CSS and shadcn/ui
- Set up Supabase (database, auth, storage)
- Build complete auth flow (sign up, sign in, sign out, forgot password)
- User profile management with avatar uploads
- Workspace creation, settings, and member invitations
- Project CRUD within workspaces
- Dark mode toggle (persisted)
- RLS policies for all tables

---

## 📦 Deliverables

### 1. Project Setup
- [ ] Initialize React + Vite + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui component library
- [ ] Set up project folder structure (`components/`, `hooks/`, `lib/`, `pages/`, `types/`, `stores/`)
- [ ] Configure Supabase client (`lib/supabase.ts`)
- [ ] Set up React Router for routing
- [ ] Set up TanStack Query for data fetching
- [ ] Configure environment variables (`.env`)
- [ ] Add `.gitignore` with proper exclusions

### 2. Authentication
- [ ] Create `auth.users` trigger to sync to `profiles` table
- [ ] Sign up page (email + password)
- [ ] Sign in page (email + password)
- [ ] Forgot password / reset password flow
- [ ] Email verification handling
- [ ] Auth state listener (`onAuthStateChange`)
- [ ] Protected route wrapper component
- [ ] Redirect unauthenticated users to sign in
- [ ] Sign out functionality

### 3. User Profiles
- [ ] `profiles` table (id, email, display_name, avatar_url, created_at)
- [ ] Profile settings page (edit display name)
- [ ] Avatar upload to Supabase Storage
- [ ] Avatar display in navbar

### 4. Workspaces
- [ ] `workspaces` table (id, name, slug, created_by, created_at)
- [ ] `workspace_members` table (workspace_id, user_id, role, invited_email, status, joined_at)
- [ ] RLS policies — members can only access their own workspaces
- [ ] Create workspace page/modal
- [ ] Workspace list / selector in sidebar
- [ ] Workspace settings page (rename, delete)
- [ ] Invite members by email (send invitation)
- [ ] Accept/decline invitation flow
- [ ] Role management (Owner, Admin, Member)
- [ ] Remove member from workspace

### 5. Projects
- [ ] `projects` table (id, workspace_id, name, description, key, created_by, created_at)
- [ ] RLS policies — scoped to workspace membership
- [ ] Create project modal
- [ ] Project list page within a workspace
- [ ] Project settings page (rename, delete, update description)
- [ ] Project key for issue numbering (e.g., `SB-1`, `SB-2`)

### 6. Layout & Dark Mode
- [ ] App shell layout (navbar, sidebar, main content area)
- [ ] Navbar with user avatar, workspace selector, notifications placeholder
- [ ] Sidebar with project navigation
- [ ] Dark mode toggle using `class` strategy
- [ ] Persist dark mode preference in `localStorage`
- [ ] Responsive layout basics

---

## 🗄️ Database Tables (this sprint)

```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- workspace_members
create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  invited_email text,
  status text check (status in ('pending', 'accepted')) default 'accepted',
  joined_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  key text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(workspace_id, key)
);
```

---

## ✅ Definition of Done

- User can sign up, sign in, sign out, and reset password
- User can update their display name and avatar
- User can create a workspace and see it in the sidebar
- User can invite members by email and assign roles
- User can create projects within a workspace
- Dark mode works and persists across sessions
- All data is protected by RLS — users can only access their workspaces
- No backend server — everything through Supabase client
