# Sprint 6: Advanced Workflows, Epics & Timelines

**Goal**: Transform Sync Board from a standard Kanban tool into a high-powered project management suite by introducing dynamic workflows, rules-based automation, hierarchical task management, and visual timelines.

## Core Features

### 1. Custom Statuses (Workflows)
Instead of forcing teams into standard "To Do", "In Progress", and "Done" columns, users can now create, edit, and reorganize custom columns (e.g., "In Review", "QA", "Blocked") tailored to their specific development process.

### 2. Automations & Rules Engine
We are replacing hardcoded integrations with a dynamic rules engine. Teams can set up triggers and actions to automate repetitive tasks:
- *Example*: "If a GitHub PR is merged, move the linked issue to 'QA' and ping the assignee."

### 3. Epics & Subtasks
To support massive, multi-month deliverables, users can now group smaller tasks into **Epics**. Issues can also have parent-child relationships (Subtasks), allowing for deep task hierarchy and better tracking of complex feature rollouts.

### 4. Timeline (Gantt) View
A brand-new calendar-based view that maps out issues visually across time. By utilizing `start_date` and `due_date`, teams can see when issues overlap, when they are scheduled to finish, and how long Epics will take to complete.

## Technical Scope
- **Database**: Add `epics`, `automations` tables. Add `start_date`, `parent_id`, and `epic_id` to the `issues` table.
- **Backend**: Overhaul the `github-webhook` Edge Function to query the `automations` table dynamically rather than using hardcoded `status` transitions.
- **Frontend**: New UI tabs for Timelines and Epics, updated Issue Modals to select parent/epic hierarchy, and UI for Automation setup.
