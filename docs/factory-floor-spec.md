# Factory Floor Specification

**Phase:** 2 (Design Evolution & Specs)  
**Date:** 2026-03-23  
**Status:** Production-Ready Specification  
**Audience:** Product & Engineering Teams (Phase 3 Implementation)

---

## Executive Summary

The Factory Floor is the **primary workspace dashboard** showing real-time health of all agents, projects, and workflows. It's the first view operators see after login and should answer the question *"What's broken right now?"* in < 5 seconds.

**Key features:**
- **Status band:** At-a-glance count of agents by status
- **Project cards:** Grid of projects with per-project health
- **Alert surfacing:** High-priority issues float to top
- **Real-time updates:** WebSocket-driven, no page refresh
- **Responsive:** Desktop (full cards) → Tablet (collapsed) → Mobile (single-column)

---

## User Stories

### Primary User: Operations Lead
**Who:** Eric (Operations Director for 3 concurrent ventures)  
**What:** Land on Factory Floor, know within 5s if any agents are failing  
**Why:** Needs to prioritize the most critical issues to debug  

**Acceptance criteria:**
- All projects visible in viewport (no scroll)
- Status badge clearly indicates health (not red = run smoothly)
- Can click any failing project to drill into details
- Alerts highlight cost overages, stalled workflows, failed agents

### Secondary User: Developer / Agent Implementer
**Who:** Engineer building a new agent for BodyPulse  
**What:** Monitor their agent's status while developing  
**Why:** Want to see if recent changes broke anything  

**Acceptance criteria:**
- Can filter by project (show only BodyPulse agents)
- See last run timestamp and status
- Click agent card to see logs
- Keyboard shortcuts to jump between agents (Tab, arrow keys)

### Tertiary User: Finance / Compliance
**Who:** Finance lead verifying budget tracking  
**What:** See cost breakdowns per project, month-to-date spend  
**Why:** Need to reconcile with invoices, forecast future spend  

**Acceptance criteria:**
- Project cards show MTD cost
- Can click to see cost drill-down (per-agent, per-model)
- Cost trend visible (up/down arrow, % change)
- Budget threshold alerts visible

---

## Wireframe: Factory Floor Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ ClawCommand         [Search] [Settings] [User] [Theme]        │
├─────────────────────────────────────────────────────────────────┤
│ [Sidebar]           │ FACTORY FLOOR                              │
│ - Dashboard         │                                             │
│ - Projects          │ Status Band:                               │
│ - Workflows         │ ┌──────────────┬──────────────┐             │
│ - Budget            │ │ ✓ 8 Running  │ ⏸ 2 Paused  │             │
│ - Audit             │ │ ✓ 12 Idle    │ ✗ 1 Failed  │             │
│ - Settings          │ └──────────────┴──────────────┘             │
│                     │ Updated 3s ago                              │
│ Saved Filters:      │                                             │
│ - Show failures     │ ALERTS & INCIDENTS (3)                     │
│   (24h)             │ ┌─────────────────────────────────────────┐│
│ - High cost         │ │ 🔴 CRITICAL: Agent-007 failed (5min ago)││
│   (MTD)             │ │    Workflow "DailyCron" stalled         ││
│ - All projects      │ │    Cost: $15.23                         ││
│                     │ ├─────────────────────────────────────────┤│
│                     │ │ 🟠 WARNING: BodyPulse cost +40% vs avg   ││
│                     │ │    Budget: $2,000 | Used: $1,400 (70%)  ││
│                     │ ├─────────────────────────────────────────┤│
│                     │ │ 🔵 INFO: 3 agents completed today       ││
│                     │ └─────────────────────────────────────────┘│
│                     │                                             │
│                     │ PROJECT CARDS (Grid: 1-4 per row)          │
│                     │                                             │
│                     │ ┌──────────────┐ ┌──────────────┐          │
│                     │ │ ✓ BodyPulse  │ │ ✗ TradeNavAI │          │
│                     │ │              │ │              │          │
│                     │ │ 12 agents    │ │ 8 agents     │          │
│                     │ │ 8 running    │ │ 1 failed     │          │
│                     │ │              │ │ 1 queued     │          │
│                     │ │ $245 MTD     │ │ $189 MTD     │          │
│                     │ │ +12% trend   │ │ -5% trend    │          │
│                     │ └──────────────┘ └──────────────┘          │
│                     │                                             │
│                     │ ┌──────────────┐ ┌──────────────┐          │
│                     │ │ ✓ ClawCommand│ │ ⏸ Cedar Ridge         │
│                     │ │              │ │ (dormant)    │          │
│                     │ │ 5 agents     │ │ 2 agents     │          │
│                     │ │ 3 running    │ │ 0 running    │          │
│                     │ │              │ │              │          │
│                     │ │ $112 MTD     │ │ $45 MTD      │          │
│                     │ │ -2% trend    │ │ N/A          │          │
│                     │ └──────────────┘ └──────────────┘          │
│                     │                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Core Entities

#### Workspace (Summary)
```json
{
  "workspace_id": "ws-001",
  "status_summary": {
    "total_agents": 23,
    "running": 8,
    "paused": 2,
    "idle": 12,
    "failed": 1
  },
  "cost_summary": {
    "monthly_budget": 2000,
    "used_mtd": 1240,
    "remaining": 760,
    "burn_rate_daily": 42.5,
    "projected_total": 1462
  },
  "alerts": [
    { "severity": "critical", "count": 1 },
    { "severity": "warning", "count": 2 },
    { "severity": "info", "count": 5 }
  ],
  "last_update": "2026-03-23T15:30:45Z"
}
```

#### Project (Card Data)
```json
{
  "project_id": "proj-bodypulse",
  "name": "BodyPulse",
  "status": "running",
  "agent_count": 12,
  "agent_status_breakdown": {
    "running": 8,
    "paused": 1,
    "idle": 3,
    "failed": 0
  },
  "cost_summary": {
    "mtd": 245.32,
    "daily_avg": 12.27,
    "trend": {
      "value": 12,
      "direction": "up"
    }
  },
  "recent_activity": {
    "last_run": "2026-03-23T15:25:00Z",
    "last_agent_id": "bodypulse-agent-001",
    "run_status": "completed"
  },
  "health": {
    "status_color": "success",
    "status_text": "Healthy"
  }
}
```

#### Alert / Incident
```json
{
  "alert_id": "alert-001",
  "severity": "critical",
  "title": "Agent-007 failed",
  "description": "Workflow 'DailyCron' stalled for 5 minutes",
  "context": {
    "project_id": "proj-tradenav",
    "agent_id": "tradenav-agent-007",
    "workflow_id": "wf-daily-cron"
  },
  "cost_impact": 15.23,
  "triggered_at": "2026-03-23T15:20:00Z",
  "action_url": "/projects/tradenav/agents/007"
}
```

### API Endpoints

#### GET /api/workspace/status
Returns workspace summary (status counts, cost, alerts).

**Query params:**
- `include`: comma-separated flags (cost, alerts, projects)
- `project_ids`: filter to specific projects

**Response:**
```json
{
  "status_summary": { ... },
  "cost_summary": { ... },
  "alerts": [ ... ],
  "last_update": "2026-03-23T15:30:45Z"
}
```

#### GET /api/projects
Returns all projects with summary data.

**Query params:**
- `status_filter`: "all" | "running" | "failed" | "idle"
- `sort`: "name" | "cost" | "status"

**Response:**
```json
{
  "projects": [
    { "project_id": "proj-bodypulse", "name": "BodyPulse", ... },
    { ... }
  ],
  "total": 4
}
```

#### GET /api/alerts
Returns active alerts ordered by severity and age.

**Query params:**
- `severity`: "critical" | "warning" | "info"
- `limit`: 10 (max 50)
- `offset`: 0

**Response:**
```json
{
  "alerts": [ ... ],
  "total": 12,
  "unread_count": 3
}
```

#### WebSocket: /ws/workspace/live
Real-time updates to workspace status, alerts, and project cards.

**Messages:**
```json
{
  "type": "status_update",
  "payload": {
    "running": 8,
    "paused": 2,
    "idle": 12,
    "failed": 1
  },
  "timestamp": "2026-03-23T15:30:45Z"
}
```

```json
{
  "type": "alert_new",
  "payload": { "alert_id": "alert-002", ... },
  "timestamp": "2026-03-23T15:31:00Z"
}
```

```json
{
  "type": "project_update",
  "payload": {
    "project_id": "proj-bodypulse",
    "status": "running",
    "cost_mtd": 245.32
  },
  "timestamp": "2026-03-23T15:31:15Z"
}
```

---

## Interaction Flows

### Flow 1: Land on Factory Floor

1. User logs in → Redirected to `/dashboard/factory-floor`
2. Page loads: shows cached/stale data (last 30s)
3. WebSocket connects: live status band + alerts update in real-time
4. All project cards load (with skeleton loaders while fetching)
5. User scans for red/orange status badges (takes < 5s)

### Flow 2: Identify & Triage a Problem

1. Operator sees a red badge on "TradeNavAI" card
2. Reads alert: "Agent-007 failed (5 min ago) - cost $15.23"
3. Clicks alert → navigates to `/projects/tradenav/agents/007/logs`
4. Alternative: Clicks project card → `/projects/tradenav/factory-floor` (project-specific view)

### Flow 3: Monitor a Running Project

1. Operator has BodyPulse open in a browser tab
2. WebSocket pushes cost update: "$245.32 MTD" (updates live on card)
3. Sees trend arrow: "+12% vs 7-day avg"
4. Decides to set budget alert: Clicks card → Budget tab → "Set alert at $300"

### Flow 4: Filter & Save View

1. Operator wants to watch only high-cost projects
2. Clicks "Saved Filters" → "+ New filter"
3. Sets: Status = any, Cost trend = > +10%
4. Saves as "High cost trend" (added to sidebar)
5. Next login: quick access to this filtered view

### Flow 5: Keyboard Navigation

1. Tab through project cards (focus visible on card border)
2. Arrow left/right to navigate between cards
3. Arrow down to view project's agents list (expands in place)
4. Enter to drill into selected agent
5. Escape to collapse/return

---

## State Transitions

### Alert States

```
[Not triggered]
    ↓
[Active] → [Acknowledged] → [Resolved]
    ↓
[Snoozed (1h)] → [Active again]
```

### Project Status States

```
[Idle] ← [Running] ↔ [Paused]
         ↓
      [Failed]
```

### View States

```
[Factory Floor Overview] → [Project Cards Grid]
                        ↓
                [Alert Sidebar Open/Closed]
                        ↓
                [Project Card Expanded (showing agents list)]
```

---

## Detailed Component Specs

### Status Band

**Location:** Top of main content area, below page title  
**Height:** 80px (2 rows × 40px)  
**Content:**
```
[✓ 8 Running] [⏸ 2 Paused] [✓ 12 Idle] [✗ 1 Failed]
Updated 3s ago | [Refresh] [Settings]
```

**Behavior:**
- Each status badge is clickable → filters project cards by status
- Active filter shows with primary color background
- Refresh button fetches latest (manual update)
- Auto-updates every 5s via WebSocket
- Settings button opens status customization (hide/show statuses)

### Project Cards (Grid)

**Grid layout:**
- Desktop (1025px+): 4 cards per row, 16px gap
- Tablet (641-1024px): 2 cards per row, 16px gap
- Mobile (320-640px): 1 card per row, 8px gap

**Card size:** 240px × 160px (desktop)

**Card content:**
```
┌─────────────────────────────────────────┐
│ [Status Badge] BodyPulse                │
│ [Icon: Agent Count]                     │
│ 12 agents                               │
│ 8 running | 3 idle | 1 paused           │
│                                         │
│ Cost: $245.32 MTD                       │
│ [Arrow Up +12%] vs 7-day avg            │
│ [Trend sparkline]                       │
└─────────────────────────────────────────┘
```

**Card interactions:**
- **Click:** Navigate to `/projects/{id}/factory-floor`
- **Hover:** Background lightens, slight shadow increase
- **Right-click:** Context menu (Run test, View budget, Export logs)
- **Keyboard:** Tab to focus, Enter to navigate, Arrow keys to move between cards

**Responsive behavior:**
- Mobile: Hide sparkline, simplify text (agent count only)
- Tablet: Show all data, smaller text (13px → 12px)

### Alert Sidebar

**Location:** Right side of screen (desktop only)  
**Width:** 320px (fixed)  
**Height:** Full viewport  
**Header:** "Alerts & Incidents" + badge showing count  
**Scrollable:** Yes (if > 5 alerts)

**Alert item:**
```
┌─────────────────────────────────────────┐
│ [Icon] Severity: Critical               │
│ Agent-007 failed (5 min ago)            │
│ Workflow "DailyCron" stalled            │
│ [Project tag: TradeNavAI]                │
│ Cost impact: $15.23                     │
│ [Acknowledge] [Snooze 1h] [Dismiss]    │
└─────────────────────────────────────────┘
```

**Alert ordering:**
1. Critical, age < 1h (sorted by age, newest first)
2. Warning, age < 24h
3. Info, age < 1w
4. Resolved (collapsed by default)

**Responsive behavior:**
- Tablet: Collapse to hamburger → slide-in from right
- Mobile: Full screen modal on alert click

### Real-Time Updates

**Update frequency:**
- Workspace status: Every 5s (or immediate on WebSocket message)
- Project cards: Every 10s
- Alerts: Immediate (push)
- Cost data: Every 30s (less frequent to avoid visual noise)

**Visual feedback:**
- Subtle highlight (1s) when value changes
- Icon animation: Small pulse when alert triggers
- Toast notification: New critical alert (auto-dismisses after 5s)

---

## Mobile-Specific Design

### Portrait View (320-640px)

```
┌────────────────────────────────┐
│ ☰ Dashboard ⚡ [Search] [User] │
├────────────────────────────────┤
│ Status Band                    │
│ [8 Running] [2 Paused]         │
│ [12 Idle] [1 Failed]           │
├────────────────────────────────┤
│ Alerts                         │
│ [Critical: Agent-007]          │
│ [Warning: High cost]           │
├────────────────────────────────┤
│ Projects (Single column)       │
│ [BodyPulse Card]               │
│ [TradeNavAI Card]              │
│ [ClawCommand Card]             │
│ [Cedar Ridge Card]             │
└────────────────────────────────┘
```

**Changes:**
- Sidebar collapses to hamburger menu
- Alert sidebar becomes full-screen modal (swipe to dismiss)
- Project cards stack vertically (1 per row)
- Status band shows status counts as horizontal scroll
- Cost sparklines hidden (show trend arrow only)

---

## Implementation Notes

### Tech Stack

- **Frontend:** React 18+ with Vite
- **State:** TanStack Query (data fetching) + Zustand (UI state)
- **Real-time:** Socket.io (WebSocket wrapper)
- **Grid:** CSS Grid + Tailwind responsive classes
- **Charts/Sparklines:** Recharts (lightweight)

### Performance Considerations

1. **Lazy loading:** Project cards load in batches (first 4, then next 4 on scroll)
2. **WebSocket throttling:** Batch updates every 100-200ms (don't push every state change)
3. **Skeleton loading:** Show placeholders while cards fetch (improves perceived performance)
4. **Memoization:** Wrap card components with `React.memo()` to prevent re-renders
5. **CSS containment:** Use `contain: layout style` on cards for better rendering performance

### Common Gotchas

**Gotcha 1: WebSocket reconnection**
- WebSocket disconnects on tab blur or network loss
- Implement exponential backoff (1s → 2s → 4s → 8s) for reconnect attempts
- Show banner: "Connection lost. Reconnecting..." with status spinner
- Cache last 30s of data while offline; merge with live updates on reconnect

**Gotcha 2: Cost data staleness**
- Cost data is calculated every 30s (not real-time)
- If user triggers expensive run, cost won't update for up to 30s
- Show disclaimer: "Cost updated at [timestamp]" on card

**Gotcha 3: Alert ordering consistency**
- Client-side sorting of alerts can differ from server (clock skew)
- Always use server timestamp for ordering
- If local and server timestamps differ by > 60s, flag for time sync issue

**Gotcha 4: Responsive grid layout**
- CSS Grid doesn't support "flow until 4 items, then wrap" easily
- Use `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` for responsive cards
- Test on actual mobile device (browser DevTools responsive view can be misleading)

### Testing Strategy

1. **Unit tests:** Factory Floor component, card component, alert list
2. **Integration tests:** WebSocket mock + API mock for status updates
3. **E2E tests:** Land on Factory Floor, see status band, click card, navigate
4. **Performance tests:** Render 50+ cards with animations (60fps target)
5. **Accessibility tests:** Keyboard navigation, screen reader testing

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Time to first meaningful paint** | < 2s | Lighthouse, Web Vitals |
| **Status comprehension time** | < 5s | User interviews, usability testing |
| **Alert signal-to-noise ratio** | 90%+ relevant | Alert dismissal rate tracking |
| **Keyboard navigation adoption** | 30%+ users | Analytics: keyboard event tracking |
| **Mobile usability** | 85%+ task completion | Usability testing on mobile |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-23 | Initial Factory Floor spec (Phase 2) |

---

**Next:** Implement Factory Floor component, WebSocket integration, and responsive grid in Phase 3.
