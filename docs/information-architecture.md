# Information Architecture v2.0

**Phase:** 2 (Design Evolution & Specs)  
**Date:** 2026-03-23  
**Status:** Production-Ready Specification  
**Audience:** Product & Engineering Teams (Phase 3 Implementation)

---

## Executive Summary

ClawCommand's information architecture defines:
- **Navigation model:** Sidebar (persistent, scoped) + Top bar (global actions)
- **Page hierarchy:** 11 existing pages + 4 new pages (Phase 2)
- **Persistent state:** Filters, view preferences, alerts maintained across navigation
- **Accessibility:** Keyboard navigation, ARIA labels, screen reader support
- **Mobile responsiveness:** 3 breakpoints (mobile, tablet, desktop) with layout changes

This spec ensures the platform scales from MVP (5 pages) to enterprise (15+ pages) without cognitive overload.

---

## Navigation Model

### Sidebar (Left, Persistent)

**Desktop:** 256px wide, fixed on left  
**Tablet:** 64px wide (collapsed, icons only)  
**Mobile:** Hidden (hamburger menu, slide-in from left)

**Sections:**

```
[Logo: ⚡ ClawCommand]

WORKSPACE
├─ Dashboard
│  ├─ Factory Floor
│  ├─ Overview (summary metrics)
│
PROJECTS
├─ BodyPulse
├─ TradeNavAI
├─ ClawCommand
├─ Cedar Ridge
├─ [+ Add Project]
│
OPERATIONS
├─ Workflows
├─ Agents
├─ Budget Control
├─ Audit Trail
│
SAVED FILTERS (Collapsible)
├─ Show failures (last 24h)
├─ High cost (MTD)
├─ My agents
├─ [+ New filter]
│
SETTINGS
├─ Account
├─ Workspace settings
├─ Integrations
├─ Documentation
│
[Help] [Logout]
```

**Behavior:**
- Collapse/expand with icon (persisted to user profile)
- Keyboard: Arrow down/up to navigate, Enter to select, Escape to close
- Hover: Show tooltips on desktop, auto-show on tablet
- Active item: Highlighted with left border + background

### Top Bar (Right, Persistent)

**Width:** Full width, ~48px height  
**Content (left to right):**
1. Breadcrumbs (current page path)
2. Search bar [Cmd+K] (global search)
3. Notifications bell (with badge)
4. Settings icon
5. User avatar + dropdown

**Breadcrumbs:**
```
Factory Floor > BodyPulse > Agents > Agent-001
```
Clickable, navigate to parent page on click.

**Search Bar:**
```
[Search agents, workflows, logs, runs, costs...] [Cmd+K]
```
Global full-text search:
- Agents (by name, ID)
- Workflows (by name)
- Recent runs (by execution ID)
- Logs (by message content, limited)

**Notifications:**
Badge shows count of unread alerts.  
Click → drawer slides in from right with alert list.

**User Menu:**
```
Account Settings
Workspace Settings
Integrations
Documentation
Logout
```

---

## Page Hierarchy: Phase 1 + Phase 2

### Phase 1 (Existing, 11 pages)

#### Tier 1: Dashboard & Overview

| Page | URL | Purpose | Key Components |
|------|-----|---------|-----------------|
| **Dashboard (Factory Floor)** | `/dashboard/factory-floor` | Workspace health at a glance | Status band, project cards, alerts |
| **Overview** | `/dashboard/overview` | Metrics summary (cost, agents, workflows) | Summary cards, trend charts |

#### Tier 2: Project Management

| Page | URL | Purpose | Key Components |
|------|-----|---------|-----------------|
| **Projects List** | `/projects` | All projects, create new | Project cards, search, filters |
| **Project Detail** | `/projects/{id}` | Single project overview | Agents, workflows, cost, settings |
| **Project Agents** | `/projects/{id}/agents` | All agents in project | Agent list, status, last run |
| **Project Workflows** | `/projects/{id}/workflows` | All workflows in project | Workflow list, schedule, status |

#### Tier 3: Agents

| Page | URL | Purpose | Key Components |
|------|-----|---------|-----------------|
| **Agent Detail** | `/projects/{id}/agents/{id}` | Single agent config + runs | Config, logs, executions, cost |
| **Agent Executions** | `/projects/{id}/agents/{id}/executions` | All runs of an agent | Execution list, status, timeline |

#### Tier 4: Workflows

| Page | URL | Purpose | Key Components |
|------|-----|---------|-----------------|
| **Workflow List** | `/workflows` | All workflows across projects | Workflow cards, search, filters |
| **Workflow Detail** | `/workflows/{id}` | Single workflow config + executions | Steps, schedule, history |
| **Workflow Execution** | `/workflows/{id}/executions/{id}` | Single execution timeline | Timeline UI, step details, logs |

#### Tier 5: Settings

| Page | URL | Purpose | Key Components |
|------|-----|---------|-----------------|
| **Workspace Settings** | `/settings/workspace` | Billing, integrations, danger zone | Billing, API keys, integrations |

### Phase 2 (New, 4 pages)

| Page | URL | Purpose | Key Components |
|------|-----|---------|-----------------|
| **Budget Control** | `/budget-control` | Cost tracking, forecasting, alerts | Budget meter, trend graph, per-project breakdown |
| **Audit Trail** | `/audit` | Compliance logging, change history | Activity log, change details, export |
| **Approvals** | `/approvals` | Pending approval requests | Approval list, approve/reject UI |
| **Factory Floor Detail** | `/projects/{id}/factory-floor` | Project-scoped Factory Floor | Project status, agents by status, alerts |

**Total: 15 pages**

---

## Page Map (Tree View)

```
Dashboard
├─ /dashboard/factory-floor (Factory Floor)
└─ /dashboard/overview (Metrics)

Projects
├─ /projects (List)
├─ /projects/{id} (Detail)
├─ /projects/{id}/agents (List)
│  └─ /projects/{id}/agents/{agent_id} (Detail)
│     └─ /projects/{id}/agents/{agent_id}/executions (Runs)
├─ /projects/{id}/workflows (List)
│  └─ /workflows/{id} (Detail)
│     └─ /workflows/{id}/executions/{exec_id} (Timeline)
└─ /projects/{id}/factory-floor (Project-scoped)

Workflows
├─ /workflows (List)
└─ [Links to above]

Operations
├─ /budget-control (Cost tracking)
├─ /audit (Compliance)
├─ /approvals (Pending approvals)
└─ /settings/workspace (Settings)
```

---

## Persistent State Management

### State That Persists Across Navigation

#### Filters
```json
{
  "project_id": "proj-bodypulse",
  "status": "failed",
  "date_range": "last_24h",
  "sort_by": "cost_desc"
}
```
Applied across all views that support those filters (e.g., agents list, workflows list).

#### View Preferences
```json
{
  "view_type": "grid", // or "list"
  "items_per_page": 25,
  "expanded_sections": ["alerts", "cost_breakdown"]
}
```

#### Recent Selections
```json
{
  "last_project_id": "proj-bodypulse",
  "last_agent_id": "agent-001",
  "last_workflow_id": "wf-daily-sync"
}
```
Used for breadcrumbs and quick navigation.

#### User Preferences
```json
{
  "theme": "dark",
  "sidebar_collapsed": false,
  "keyboard_shortcuts_enabled": true,
  "notification_settings": { ... }
}
```

**Storage:** Combination of URL params (for sharing) + localStorage (for persistence) + server-side (for syncing across devices).

**Refresh behavior:** Filters survive page reload; sidebar state persists; view preferences restored.

---

## Navigation Patterns

### Pattern 1: Breadcrumb Navigation (Up)
```
User is on: /projects/bodypulse/agents/agent-001
Breadcrumb: Factory Floor > Projects > BodyPulse > Agents > Agent-001

Click "BodyPulse" → /projects/bodypulse
Click "Agents" → /projects/bodypulse/agents
Click "Projects" → /projects
```

### Pattern 2: Sidebar Navigation (Left)
```
User is on: /projects/bodypulse/agents
Sidebar: [Projects] is highlighted
Click "Workflows" → /projects/bodypulse/workflows
Click "+ Add Project" → /projects/new
Click "Dashboard" → /dashboard/factory-floor
```

### Pattern 3: Drill-Down Navigation (Click)
```
User is on: /projects/bodypulse/agents
Sees agent card: "Agent-001"
Click card → /projects/bodypulse/agents/agent-001
In detail view, see "Last run: execution-xyz"
Click run → /projects/bodypulse/agents/agent-001/executions/execution-xyz
```

### Pattern 4: Search Navigation (Global)
```
User presses Cmd+K
Search bar opens: "Search..."
Types "agent-001"
Results show: [Agent] Agent-001 (BodyPulse) [Workflow] daily-sync [Run] execution-xyz
Click "Agent-001" → /projects/bodypulse/agents/agent-001
```

### Pattern 5: Saved Filter Navigation (Shortcut)
```
User is on: /projects
Sidebar shows "Saved Filters" section
User clicks "Show failures (last 24h)"
Applied to current view: filters agents/workflows by (status=failed AND age<24h)
Navigating to other views preserves filter context
```

---

## Accessibility Design

### Keyboard Navigation

| Key | Scope | Action |
|-----|-------|--------|
| **Tab** | Page | Move focus to next interactive element (buttons, links, inputs) |
| **Shift+Tab** | Page | Move focus to previous element |
| **Enter** | Button/Link | Activate |
| **Space** | Checkbox/Radio | Toggle |
| **Arrow Up/Down** | List/Menu | Navigate items |
| **Arrow Left/Right** | Sidebar | Collapse/expand sections |
| **Escape** | Modal/Sidebar | Close |
| **Cmd+K** | Global | Open search |
| **/** | Page | Focus search (optional, GitHub style) |

### ARIA Labels & Roles

**Page regions:**
```html
<header role="banner">
  [Top bar]
</header>

<nav role="navigation" aria-label="Main">
  [Sidebar]
</nav>

<main role="main">
  [Page content]
</main>

<aside role="complementary" aria-label="Alerts">
  [Alerts sidebar]
</aside>
```

**Interactive elements:**
```html
<!-- Button -->
<button aria-label="Pause workflow">
  [Pause icon]
</button>

<!-- Status badge -->
<span role="status" aria-live="polite">
  Agent running (2m 30s)
</span>

<!-- Alert toast -->
<div role="alert" aria-live="assertive">
  Cost spike detected! +40%
</div>
```

**Form labels:**
```html
<label for="project-filter">Project</label>
<select id="project-filter">
  <option>All Projects</option>
  ...
</select>
```

**Landmarks:**
- `<header>` for top bar
- `<nav>` for sidebar
- `<main>` for page content
- `<aside>` for secondary content (alerts, details)
- `<footer>` for footer (if present)

### Screen Reader Support

**Page announcements:**
- Loading state: "Loading agents, please wait"
- Data updates: "Page refreshed, 3 new alerts"
- Navigation: "Now on Factory Floor page"

**Inline text alternatives:**
- Status badges: Use `aria-label` for icons (not just color)
- Charts: Provide data table alternative
- Cost trend: "Cost up 12% from last week"

**Focus management:**
- Modal opens: Move focus to first input
- Modal closes: Move focus back to trigger button
- Page navigation: Announce page title

---

## Mobile Responsiveness (3 Breakpoints)

### Breakpoint 1: Mobile (320-640px)

**Layout:**
```
┌─────────────────────┐
│ ☰ Dashboard 🔔 👤  │  (Top bar, hamburger menu)
├─────────────────────┤
│ CONTENT             │  (Single column, full width)
│ (Sidebar hidden)    │
│                     │
└─────────────────────┘
```

**Changes:**
- Sidebar hidden (hamburger menu slides in on ☰ click)
- Breadcrumbs collapsed (show only current page)
- Search bar takes full width
- Project cards stack vertically (1 per row)
- Data tables collapse to card view
- Modals full-screen
- Notifications drawer full-screen

### Breakpoint 2: Tablet (641-1024px)

**Layout:**
```
┌──────────────────────────────────┐
│ Dashboard                  🔔 👤 │  (Top bar, breadcrumbs)
├────┬────────────────────────────┤
│ ☰  │ CONTENT                    │  (Sidebar collapsed to icons)
│ [D]│                            │
│ [P]│                            │
│ [A]│                            │
│ [B]│                            │
│    │                            │
└────┴────────────────────────────┘
```

**Changes:**
- Sidebar collapsed (64px wide, icons only)
- Hover to show tooltip with full text
- Project cards: 2 per row
- Cost trend chart: Reduced height
- Tables: Horizontal scroll if needed
- Modals: 90% width (not full-screen)

### Breakpoint 3: Desktop (1025px+)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Dashboard  [Search] [Notifications] [Settings] [User]  │  (Top bar)
├───────────┬───────────────────────────────────────────┤
│ Sidebar   │ CONTENT                                    │
│ (256px)   │ (responsive grid)                          │
│           │                                            │
│           ├──────────────────────────────────────────┐ │
│           │ Right sidebar (optional):                │ │
│           │ - Alerts (collapsible)                   │ │
│           │ - Details (collapsible)                  │ │
│           │ - Quick actions                          │ │
│           └──────────────────────────────────────────┘ │
│           │                                            │
└───────────┴───────────────────────────────────────────┘
```

**Changes:**
- Full sidebar (256px wide, text labels visible)
- Optional right sidebar for alerts/details
- Project cards: 3-4 per row
- Full tables (no horizontal scroll)
- Cost trend chart: Full height
- Modals: 600px max width, centered

---

## Route Map (URL Structure)

```
/dashboard
  /factory-floor              Factory Floor (main dashboard)
  /overview                   Metrics overview

/projects
  /                           Projects list
  /{id}                       Project detail
  /{id}/factory-floor         Project-scoped Factory Floor
  /{id}/agents                Agents in project
    /{agent_id}               Agent detail
      /executions             Agent execution history
        /{exec_id}            Single execution (logs)
  /{id}/workflows             Workflows in project
    /{workflow_id}            Workflow detail
      /executions             Workflow execution history
        /{exec_id}            Single execution (timeline)

/workflows
  /                           Workflows list (all projects)
  /{id}                       Workflow detail

/budget-control               Budget & cost tracking

/audit                        Compliance audit trail

/approvals                    Pending approvals

/settings
  /workspace                  Workspace settings
  /account                    Account settings
  /integrations               Integrations
```

---

## Search & Filtering Strategy

### Global Search (Cmd+K)

Indexes:
- Agents (by name, ID, project)
- Workflows (by name, project)
- Recent executions (by ID, status)
- Logs (keyword search, limited)

Results grouped by type:
```
[AGENTS]
Agent-001 (BodyPulse)
Agent-X (TradeNavAI)

[WORKFLOWS]
Daily Email Digest (BodyPulse)
Weekly Report (TradeNavAI)

[RECENT RUNS]
Execution ABC123 (completed)
Execution DEF456 (failed)
```

### Contextual Filters (Per-Page)

**Factory Floor:**
- Status: Running, Paused, Idle, Failed
- Project: All, BodyPulse, TradeNavAI, ...
- Cost range: $0-$100, $100-$500, $500+

**Agents List:**
- Status: Running, Paused, Idle, Failed
- Project: All, BodyPulse, ...
- Last run: Today, Last 7 days, Last 30 days
- Cost range: $0-$10, $10-$50, $50+

**Audit Trail:**
- Date range: Last 7 days, 30 days, Custom
- Action type: Trigger, Modify, Approve, Rollback
- Actor: All, eric@, sarah@, ...
- Resource: All, agents, workflows, configs

---

## State Persistence Examples

### Example 1: Filter Persistence

1. User is on `/projects/bodypulse/agents`
2. Filters: Status = "failed", Date = "last 24h"
3. Clicks agent → `/projects/bodypulse/agents/agent-001`
4. Reads logs, clicks breadcrumb "Agents" → back to `/projects/bodypulse/agents`
5. **Filter is restored:** Status = "failed", Date = "last 24h" (not reset)

### Example 2: View Preference Persistence

1. User prefers "list view" over "grid view"
2. Sets view → localStorage: `view_type: "list"`
3. Navigates to `/projects/tradenav/agents`
4. **View is applied automatically:** Shows as list (not grid)
5. Even after browser restart, preference persists

### Example 3: Recent Selection Breadcrumb

1. User was on `/projects/bodypulse/agents/agent-001`
2. Navigates to `/workflows` (different section)
3. User checks notifications, comes back to sidebar "BodyPulse"
4. **Quick nav:** Sidebar shows "Agent-001" as recent (quick jump link)

---

## Mobile Navigation Patterns

### Sidebar as Drawer (Mobile)

```
[☰] Dashboard [🔔] [👤]
├────────────────────────────┐
│ [✕] MENU                   │
│                            │
│ WORKSPACE                  │
│ ├─ Dashboard               │
│ ├─ Overview                │
│                            │
│ PROJECTS                   │
│ ├─ BodyPulse [5]           │
│ ├─ TradeNavAI [3]           │
│ ├─ ClawCommand [2]         │
│                            │
│ OPERATIONS                 │
│ ├─ Budget Control          │
│ ├─ Audit Trail             │
│                            │
│ [Logout]                   │
└────────────────────────────┘
```

Behavior:
- Hamburger click → drawer slides in from left
- Overlay backdrop (semi-transparent)
- Click backdrop or ✕ button → drawer closes
- Click menu item → navigate + close drawer
- Keyboard ESC → close drawer

---

## Information Density by Page

### High Density (Expert Users)
- **Audit Trail:** 1000+ entries, full-featured filtering, exports
- **Budget Control:** Per-model, per-project, per-agent breakdowns
- **Workflow Timeline:** All steps visible at once (8-12 steps)

### Medium Density (Mixed Users)
- **Projects List:** 10-20 projects, sortable, searchable
- **Agents List:** 20-50 agents, paginated, filters
- **Workflows List:** 10-30 workflows, status badges

### Low Density (Onboarding)
- **Dashboard/Factory Floor:** 5-10 project cards, one status band, 3 alerts
- **Project Detail:** 5-8 summary cards, not overwhelming

---

## Design Principles

1. **Progressive Disclosure:** Show summary, details on demand
2. **Semantic Grouping:** Related items grouped (Operations section)
3. **Persistent Context:** Filters/preferences survive navigation
4. **Keyboard-First:** Power users can operate without mouse
5. **Mobile-First:** Design for mobile, enhance for desktop
6. **Consistency:** Same interaction pattern across pages
7. **Accessibility:** WCAG AA compliant, screen reader friendly

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Phase 1 | Initial 11-page IA (Factory Floor through Settings) |
| 2.0 | 2026-03-23 | Added 4 pages (Budget Control, Audit, Approvals, Project Factory Floor) |

---

## Phase 3 Roadmap (Expected)

Potential additions for Phase 3:
- **Reports:** Custom report builder
- **Integrations:** Slack, Teams, webhooks
- **Templates:** Workflow templates, agent templates
- **Collaboration:** Team notes, comments on runs
- **Advanced:** Custom dashboards, data export

---

**Next:** Implement IA in React Router, persistent state management, and mobile navigation in Phase 3.
