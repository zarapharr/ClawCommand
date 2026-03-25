# Workflow Timeline Specification

**Phase:** 2 (Design Evolution & Specs)  
**Date:** 2026-03-23  
**Status:** Production-Ready Specification  
**Audience:** Product & Engineering Teams (Phase 3 Implementation)

---

## Executive Summary

The Workflow Timeline is a **visual representation of multi-step agent workflows** showing the sequence of steps, their current status, execution time, and inputs/outputs. It enables operators to understand what's happening right now and quickly drill down to logs of any step.

**Key features:**
- **Horizontal timeline:** Steps laid out left-to-right (start → end)
- **Status visualization:** Color-coded step cards (running, complete, failed, queued)
- **Real-time progress:** Live updates as steps execute
- **Drill-down:** Click step → see logs + inputs/outputs in sidebar
- **Rollback UI:** Pause, resume, re-run from step N
- **Export/import:** JSON format for audit and replay

---

## User Stories

### Primary User: Operations Lead Debugging a Stalled Workflow
**Who:** Eric  
**What:** See a workflow that's been "running" for 10 minutes, understand where it's stuck  
**Why:** Need to decide: let it continue, pause, or restart from an earlier step  

**Acceptance criteria:**
- See all workflow steps at a glance
- Identify which step is running (spinner animation)
- Click running step to see logs in real-time
- Pause/resume without losing state
- Re-run from step 3 (skip steps 1-2)

### Secondary User: Developer Implementing a Workflow
**Who:** Engineer building a 5-step data pipeline  
**What:** Test the workflow, see if data flows correctly between steps  
**Why:** Want to verify outputs of step 1 feed correctly into step 2  

**Acceptance criteria:**
- See inputs/outputs for each step (JSON blob)
- Verify data schema at each stage
- Click "Re-run from step 2" to test just the mid-pipeline steps
- Export workflow execution (JSON) for analysis

### Tertiary User: Compliance Officer
**Who:** Finance/Compliance lead  
**What:** Audit a completed workflow, see trace of who triggered it and when  
**Why:** Need to verify workflow executed correctly (no unauthorized modifications)  

**Acceptance criteria:**
- See step-by-step execution with timestamps
- See cost impact per step (tokens, API calls)
- Export audit trail (CSV or JSON)
- Verify rollback history (if step was re-run)

---

## Wireframe: Workflow Timeline Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ ClawCommand  [Search]  [Settings]  [User]                     │
├─────────────────────────────────────────────────────────────────┤
│ Workflow: "Daily Email Digest"          [Pause] [Re-run] [...]   │
│ Status: 3/5 steps complete | 45s elapsed | $2.34 cost           │
│                                                                  │
│ TIMELINE (Horizontal flow)                                      │
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┐             │
│ │ Step 1  │ Step 2  │ Step 3  │ Step 4  │ Step 5  │             │
│ │ Fetch   │ Filter  │ Summarize│ Format  │ Send    │             │
│ │ ✓ Done  │ ✓ Done  │ ⏳ Running│ ⟳ Queued│ ⟳ Queued│             │
│ │ 8s      │ 12s     │ 15s     │ --      │ --      │             │
│ │ $0.45   │ $0.89   │ $1.00   │ --      │ --      │             │
│ └─────────┴─────────┴─────────┴─────────┴─────────┘             │
│                       ↑ Click to expand                         │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ DETAIL PANEL (Right sidebar on desktop, modal on mobile)       │
│                                                                  │
│ Step 3: Summarize                                              │
│ Status: ⏳ Running (5s elapsed)                                 │
│ Duration: --                                                    │
│ Cost: $1.00 (estimated) | 425 tokens                            │
│                                                                  │
│ [Inputs] [Outputs] [Logs]                                       │
│                                                                  │
│ INPUTS:                                                         │
│ {                                                               │
│   "emails": [ { "from": "...", "subject": "..." }, ... ],      │
│   "max_length": 500                                             │
│ }                                                               │
│                                                                  │
│ LOGS (Real-time):                                               │
│ 15:30:45 | Model loaded: gpt-4-turbo                            │
│ 15:30:47 | Processing 12 emails...                              │
│ 15:30:50 | Summarize complete                                   │
│                                                                  │
│ [Copy logs] [Export as JSON]                                    │
│                                                                  │
│ [Pause] [Re-run from here] [Abort]                              │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ WORKFLOW METADATA (Bottom)                                      │
│ Triggered by: eric@company.com                                  │
│ Triggered at: 2026-03-23 15:30:42 UTC                           │
│ Workflow ID: wf-daily-email-digest                              │
│ Execution ID: exec-abc123def456                                 │
│ [View all executions] [Export audit log]                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Workflow Definition

```json
{
  "workflow_id": "wf-daily-email-digest",
  "name": "Daily Email Digest",
  "description": "Fetch emails, filter, summarize, format, and send digest",
  "steps": [
    {
      "step_id": "step-1",
      "step_number": 1,
      "name": "Fetch",
      "agent_id": "agent-fetch-emails",
      "type": "agent",
      "timeout_seconds": 60,
      "retry_policy": {
        "max_attempts": 3,
        "backoff_multiplier": 2
      }
    },
    {
      "step_id": "step-2",
      "step_number": 2,
      "name": "Filter",
      "agent_id": "agent-filter",
      "type": "agent",
      "depends_on": ["step-1"],
      "timeout_seconds": 30
    },
    {
      "step_id": "step-3",
      "step_number": 3,
      "name": "Summarize",
      "agent_id": "agent-summarize",
      "type": "agent",
      "model": "gpt-4-turbo",
      "depends_on": ["step-2"],
      "timeout_seconds": 90
    },
    {
      "step_id": "step-4",
      "step_number": 4,
      "name": "Format",
      "agent_id": "agent-format-html",
      "type": "agent",
      "depends_on": ["step-3"],
      "timeout_seconds": 30
    },
    {
      "step_id": "step-5",
      "step_number": 5,
      "name": "Send",
      "agent_id": "agent-send-email",
      "type": "agent",
      "depends_on": ["step-4"],
      "timeout_seconds": 30
    }
  ]
}
```

### Workflow Execution

```json
{
  "execution_id": "exec-abc123def456",
  "workflow_id": "wf-daily-email-digest",
  "status": "in_progress",
  "triggered_by": "eric@company.com",
  "triggered_at": "2026-03-23T15:30:42Z",
  "step_executions": [
    {
      "step_id": "step-1",
      "step_number": 1,
      "name": "Fetch",
      "status": "completed",
      "started_at": "2026-03-23T15:30:42Z",
      "completed_at": "2026-03-23T15:30:50Z",
      "duration_seconds": 8,
      "cost": {
        "tokens_input": 150,
        "tokens_output": 200,
        "api_calls": 1,
        "total_cost_usd": 0.45
      },
      "inputs": {
        "email_account": "inbox@example.com",
        "days_back": 1
      },
      "outputs": {
        "emails": [ { "id": "email-1", "from": "...", "subject": "..." }, ... ],
        "count": 45
      }
    },
    {
      "step_id": "step-2",
      "step_number": 2,
      "name": "Filter",
      "status": "completed",
      "started_at": "2026-03-23T15:30:51Z",
      "completed_at": "2026-03-23T15:31:03Z",
      "duration_seconds": 12,
      "cost": { ... },
      "inputs": {
        "emails": [ ... ],
        "filters": { "from": ["important@...", "critical@..."] }
      },
      "outputs": {
        "filtered_emails": [ ... ],
        "count": 12
      }
    },
    {
      "step_id": "step-3",
      "step_number": 3,
      "name": "Summarize",
      "status": "in_progress",
      "started_at": "2026-03-23T15:31:04Z",
      "completed_at": null,
      "duration_seconds": null,
      "cost": {
        "tokens_input": 2450,
        "tokens_output": 150,
        "api_calls": 1,
        "total_cost_usd": 1.00
      },
      "inputs": {
        "emails": [ ... ],
        "max_length": 500
      },
      "outputs": null,
      "logs": [
        { "timestamp": "2026-03-23T15:30:45Z", "level": "INFO", "message": "Model loaded: gpt-4-turbo" },
        { "timestamp": "2026-03-23T15:30:47Z", "level": "INFO", "message": "Processing 12 emails..." },
        { "timestamp": "2026-03-23T15:31:04Z", "level": "INFO", "message": "Summarize in progress" }
      ]
    },
    {
      "step_id": "step-4",
      "step_number": 4,
      "name": "Format",
      "status": "queued",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "cost": null,
      "inputs": null,
      "outputs": null,
      "logs": []
    },
    {
      "step_id": "step-5",
      "step_number": 5,
      "name": "Send",
      "status": "queued",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "cost": null,
      "inputs": null,
      "outputs": null,
      "logs": []
    }
  ],
  "total_cost": 2.34,
  "total_duration_seconds": 45
}
```

### API Endpoints

#### GET /api/workflows/{workflow_id}
Returns workflow definition (steps, dependencies, metadata).

**Response:**
```json
{
  "workflow_id": "wf-daily-email-digest",
  "name": "Daily Email Digest",
  "steps": [ ... ]
}
```

#### GET /api/executions/{execution_id}
Returns current execution status (step statuses, progress, cost).

**Query params:**
- `include`: "inputs,outputs,logs,cost,metadata"

**Response:**
```json
{
  "execution_id": "exec-abc123def456",
  "workflow_id": "wf-daily-email-digest",
  "status": "in_progress",
  "step_executions": [ ... ]
}
```

#### POST /api/executions/{execution_id}/pause
Pauses workflow execution (current step completes, subsequent steps queued).

**Request:**
```json
{
  "reason": "Operator paused for debugging"
}
```

**Response:**
```json
{
  "execution_id": "exec-abc123def456",
  "status": "paused",
  "paused_at": "2026-03-23T15:31:10Z",
  "paused_by": "eric@company.com"
}
```

#### POST /api/executions/{execution_id}/resume
Resumes paused workflow execution.

**Response:**
```json
{
  "execution_id": "exec-abc123def456",
  "status": "in_progress",
  "resumed_at": "2026-03-23T15:31:20Z"
}
```

#### POST /api/executions/{execution_id}/rollback
Rolls back workflow to a specific step (re-runs that step and all downstream).

**Request:**
```json
{
  "step_id": "step-3",
  "reason": "Incorrect output from step 3"
}
```

**Response:**
```json
{
  "execution_id": "exec-abc123def456",
  "rolled_back_to_step": "step-3",
  "affected_steps": ["step-3", "step-4", "step-5"],
  "rollback_reason": "Incorrect output from step 3",
  "rollback_timestamp": "2026-03-23T15:31:30Z"
}
```

#### WebSocket: /ws/executions/{execution_id}
Real-time updates to execution status, step progress, and logs.

**Messages:**
```json
{
  "type": "step_status_change",
  "payload": {
    "step_id": "step-3",
    "status": "completed",
    "completed_at": "2026-03-23T15:31:20Z",
    "duration_seconds": 16,
    "cost": { ... }
  }
}
```

```json
{
  "type": "step_log",
  "payload": {
    "step_id": "step-3",
    "log": {
      "timestamp": "2026-03-23T15:31:15Z",
      "level": "INFO",
      "message": "Processing emails..."
    }
  }
}
```

```json
{
  "type": "execution_status",
  "payload": {
    "status": "paused",
    "paused_by": "eric@company.com",
    "paused_at": "2026-03-23T15:31:30Z"
  }
}
```

---

## Interaction Flows

### Flow 1: Monitor Running Workflow

1. User navigates to `/workflows/{id}/executions/{exec_id}`
2. Timeline loads: shows 5 steps (left to right)
3. Step 1-2 are green (complete) with duration badges
4. Step 3 shows orange spinner (running for 15s)
5. Step 4-5 are gray (queued)
6. Every 2s, WebSocket pushes log update from step 3 (logs scroll in detail panel)
7. When step 3 completes, spinner stops, bar turns green, step 4 spinner starts

### Flow 2: Understand a Step's Output

1. User sees step 3 completed with $1.00 cost
2. Clicks step 3 → detail panel opens on right (desktop) or modal (mobile)
3. Sees "Inputs" tab: original email list
4. Clicks "Outputs" tab: sees summarized text
5. Verifies output is correct (or sees it's corrupted)

### Flow 3: Pause & Debug a Stalled Workflow

1. Workflow has been "running" for 10 minutes (no progress)
2. User clicks [Pause] button → `POST /api/executions/{id}/pause`
3. Step 3 stops accepting new inputs
4. Current activity completes, subsequent steps queued
5. User clicks step 3, reads logs to find issue
6. Decides to kill the workflow or restart from step 2

### Flow 4: Rollback & Re-run

1. Step 3 output is incorrect (corrupted data)
2. User clicks step 3 → detail panel → [Re-run from here]
3. UI highlights affected nodes: step 3, 4, 5 (grayed out)
4. User confirms: "Re-run steps 3-5"
5. API: `POST /api/executions/{id}/rollback` with `step_id: "step-3"`
6. Execution state resets: step 3 status = queued, step 4-5 = queued
7. Step 3 re-executes, logs stream into detail panel
8. When complete, step 4 auto-starts

### Flow 5: Export Audit Trail

1. Workflow completed
2. User clicks [Export] → "Audit log (CSV)" or "Full execution (JSON)"
3. Downloads file with:
   - Execution ID, workflow ID, triggered by, triggered at
   - Step-by-step: status, duration, cost, inputs, outputs
   - Rollback history (if any)
   - Who paused/resumed and when

---

## State Transitions

### Step Status Flow

```
[queued] → [in_progress] → [completed]
            ↓
          [failed] → [retrying] → [completed] (if retry succeeds)
                                ↘ [failed] (after max retries)
          
[paused_by_operator] → [queued] (after resume)
```

### Execution Status Flow

```
[queued] → [in_progress] → [completed]
            ↓              ↓
          [paused]    [failed]
            ↓
          [in_progress] (after resume)
```

---

## Detailed Component Specs

### Timeline Step Card

**Size:** 140px width × 80px height  
**Content:**
```
[Icon: Status] Step Name
Status: "✓ Done" | "⏳ Running" | "⟳ Queued" | "✗ Failed"
Duration: "8s" | "--"
Cost: "$0.45" | "--"
```

**Colors:**
- Completed: Green (#10b981) background, white text
- Running: Orange (#f59e0b) background, white text, spinner animation
- Queued: Gray (#6b7280) background, white text
- Failed: Red (#ef4444) background, white text

**Interactions:**
- Click → expand detail panel
- Hover → show tooltip (step name, duration, cost)
- Right-click → context menu (Logs, Re-run, Rollback)

**Responsive:**
- Desktop: Full card (140px width)
- Tablet: Compact (100px width, text → initials)
- Mobile: Collapsed to circles (40px diameter) in vertical timeline

### Timeline Connector

**Visual:** Line connecting step cards  
**Color:**
- Green line if both steps completed
- Orange line if start of connection is in-progress
- Gray dashed line if end of connection is queued

**Arrow:** Small arrow at end of line (direction left → right)

### Detail Panel (Sidebar / Modal)

**Desktop:** Fixed right sidebar (320px), scrollable  
**Tablet/Mobile:** Full-screen modal, swipe to dismiss

**Sections:**
1. **Step header:** Step name, status badge, duration, cost
2. **Tabs:** [Inputs] [Outputs] [Logs]
3. **Content area:** JSON code block (syntax highlighted)
4. **Actions:** [Copy] [Export as JSON] [Pause] [Re-run] [Abort]

**Tabs:**

#### Inputs Tab
```
{
  "email_account": "inbox@example.com",
  "days_back": 1
}
```
*Scrollable, code syntax highlighting, copyable*

#### Outputs Tab
```
{
  "emails": [ { "id": "email-1", "from": "...", ... }, ... ],
  "count": 45
}
```
*Expandable nested objects*

#### Logs Tab
```
15:30:45 | INFO | Model loaded: gpt-4-turbo
15:30:47 | INFO | Processing 12 emails...
15:31:04 | INFO | Summarize complete
```
*Real-time streaming, auto-scroll to bottom, search filter*

### Workflow Metadata Footer

**Location:** Bottom of main content  
**Content:**
```
Triggered by: eric@company.com | Triggered at: 2026-03-23 15:30:42 UTC
Workflow ID: wf-daily-email-digest | Execution ID: exec-abc123def456
[View all executions] [Export audit log] [Diff with previous run]
```

---

## Rollback UI Detail

When user initiates rollback:

1. **Highlight affected nodes:** Steps 3, 4, 5 turn gray with "to be re-run" label
2. **Show confirmation modal:**
   ```
   "Re-run steps 3-5?"
   Step 3 output will be discarded.
   Steps 4-5 will start from scratch.
   [Cancel] [Confirm]
   ```
3. **After confirm:**
   - Step 3 status → queued
   - Step 4-5 status → queued
   - Display: "Rolled back to step 3 by eric@company.com at 15:31:30Z"
4. **Execution resumes:** Step 3 re-runs, logs stream live

---

## Export / Import JSON Format

### Export Format (Full Execution)

```json
{
  "export_version": "1.0",
  "exported_at": "2026-03-23T15:35:00Z",
  "exported_by": "eric@company.com",
  "workflow": {
    "workflow_id": "wf-daily-email-digest",
    "name": "Daily Email Digest",
    "steps": [ ... ]
  },
  "execution": {
    "execution_id": "exec-abc123def456",
    "status": "completed",
    "triggered_at": "2026-03-23T15:30:42Z",
    "triggered_by": "eric@company.com",
    "total_duration_seconds": 120,
    "total_cost_usd": 2.34,
    "step_executions": [ ... ]
  },
  "audit_log": [
    { "timestamp": "...", "actor": "eric@company.com", "action": "paused", "reason": "..." },
    { "timestamp": "...", "actor": "eric@company.com", "action": "resumed" },
    { "timestamp": "...", "actor": "eric@company.com", "action": "rollback", "step_id": "step-3" }
  ]
}
```

### Import Format (Re-run Execution)

```json
{
  "workflow_id": "wf-daily-email-digest",
  "rerun_from_step": "step-1",
  "rerun_reason": "Test complete pipeline",
  "override_inputs": {
    "step-1": { "days_back": 2 }
  }
}
```

---

## Mobile-Specific Design

### Portrait View (320-640px)

Timeline collapses to vertical (top-to-bottom):

```
┌────────────────────────────────┐
│ Workflow: Daily Email...        │
│ Status: In Progress             │
├────────────────────────────────┤
│ ○ Step 1: Fetch (Done, 8s)      │
│ │                              │
│ ○ Step 2: Filter (Done, 12s)    │
│ │                              │
│ ○ Step 3: Summarize (Running)   │
│ │  [Spinner] 15s elapsed        │
│ │ [Tap to expand]              │
│ │                              │
│ ○ Step 4: Format (Queued)       │
│ │                              │
│ ○ Step 5: Send (Queued)         │
├────────────────────────────────┤
│ [Pause] [Re-run] [Abort]        │
└────────────────────────────────┘
```

**Interactions:**
- Tap circle → expand detail modal
- Swipe modal up/down → dismiss
- Scroll timeline → see previous/next steps
- Long-press step → context menu

---

## Implementation Notes

### Tech Stack

- **Frontend:** React 18+ with D3.js or Recharts for timeline rendering
- **Real-time:** Socket.io for execution status streaming
- **Syntax highlighting:** Prism.js or Monaco Editor for code blocks
- **State:** TanStack Query for execution data, Zustand for UI state

### Performance Considerations

1. **Virtualization:** If 50+ steps, render only visible steps (use react-window)
2. **Log streaming:** Cap to last 1000 log lines (pagination available)
3. **Memoization:** Wrap step cards with `React.memo()` to prevent re-renders
4. **WebSocket throttling:** Batch updates every 100-200ms

### Common Gotchas

**Gotcha 1: Long-running steps**
- If step runs for > 10 minutes, show elapsed time in large font
- Provide "Pause" button prominently (don't bury)
- Warn if step duration exceeds `timeout_seconds` by 80%

**Gotcha 2: Log line ordering**
- Logs can arrive out-of-order from async workers
- Sort logs by timestamp, not arrival time
- Show "[6 new logs]" badge if user scrolled away

**Gotcha 3: Rollback state inconsistency**
- If rollback is triggered while a step is running, stop that step first
- Ensure all downstream steps are truly queued (not half-complete)
- Log rollback reason for audit trail

**Gotcha 4: Mobile modal dismiss**
- WebSocket connection should NOT disconnect when modal closes
- Keep logs streaming in background
- Resume streaming when modal re-opens

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Time to identify problem step** | < 10s | Usability testing, task completion |
| **Drill-down interaction time** | < 3s | Analytics: click → modal open |
| **Rollback success rate** | 99%+ | Execution tracking, error logs |
| **Real-time update latency** | < 2s | WebSocket message timing |
| **Mobile scroll performance** | 60fps | Performance profiling |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-23 | Initial Workflow Timeline spec (Phase 2) |

---

**Next:** Implement timeline UI, WebSocket integration, and detail panel in Phase 3.
