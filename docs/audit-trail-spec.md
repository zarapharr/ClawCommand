# Audit Trail & Compliance Specification

**Phase:** 2 (Design Evolution & Specs)  
**Date:** 2026-03-23  
**Status:** Production-Ready Specification  
**Audience:** Product & Engineering Teams (Phase 3 Implementation)

---

## Executive Summary

The Audit Trail is a **compliance logging system** for enterprise users requiring change tracking, access logs, and compliance audits. It answers:
- Who triggered this workflow?
- When was this agent config modified?
- What changed (before/after)?
- Why was this action taken?

**Key features:**
- Immutable activity log (no deletions, only versions)
- Change tracking with before/after diffs
- Export for compliance audits (CSV, JSON)
- Retention policies (query by date range)
- Role-based visibility (admins see all, users see own activity)

---

## User Stories

### Primary User: Compliance Officer
**Who:** Finance/Legal lead  
**What:** Export a 6-month audit log of all agent changes for SOC 2 compliance  
**Why:** External auditor requires proof of change control  

**Acceptance criteria:**
- Can filter by date range (e.g., Jan 1 - Jun 30)
- Can export all changes (JSON or CSV)
- Includes: timestamp, actor, action, before/after, approval status
- Data cannot be modified/deleted (immutable)

### Secondary User: Operations Lead Tracking Rollbacks
**Who:** Operations engineer  
**What:** See all rollbacks of Agent-X in the last 7 days  
**Why:** Debugging why Agent-X keeps reverting to old behavior  

**Acceptance criteria:**
- Can filter activity log by action type (e.g., "rollback")
- Can filter by agent (e.g., "Agent-X")
- Can filter by date range (e.g., "last 7 days")
- Can see: who triggered it, when, which version was restored, why

### Tertiary User: Finance Lead Approving High-Cost Runs
**Who:** Finance lead  
**What:** Approve or reject a $500 workflow before it runs  
**Why:** Control spend, ensure business justification  

**Acceptance criteria:**
- High-cost runs (> $100) require approval before execution
- Can view pending approvals in dashboard
- Can approve/reject with comment
- Audit log records: approver, time, decision reason

---

## Wireframe: Audit Trail Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ ClawCommand  [Search]  [Settings]  [User]                     │
├─────────────────────────────────────────────────────────────────┤
│ [Factory Floor] [Workflows] [Budget] [Audit] ← You are here       │
│                                                                  │
│ ACTIVITY LOG                                                     │
│ Filters:                                                         │
│ [Date range: Last 30 days ▼] [Action: All ▼] [Actor: All ▼]     │
│ [Agent: All ▼] [Export: CSV | JSON]                              │
│                                                                  │
│ Results: 45 entries                                              │
│                                                                  │
│ Timestamp          │ Actor         │ Action        │ Details     │
│ ─────────────────────────────────────────────────────────────── │
│ 2026-03-23 15:30  │ eric@         │ Trigger       │ Workflow    │
│ 15:30:42 UTC      │ company.com   │ workflow      │ "DailySync" │
│                   │               │               │ (Cost: $15) │
│                   │               │               │ [Approve]   │
│ ─────────────────────────────────────────────────────────────── │
│ 2026-03-23 14:15  │ eric@         │ Modify        │ Agent-X     │
│ 14:15:20 UTC      │ company.com   │ agent config  │ Prompt: ... │
│                   │               │               │ [Show diff] │
│ ─────────────────────────────────────────────────────────────── │
│ 2026-03-23 13:00  │ system        │ Auto-pause    │ Agent-Y     │
│ 13:00:05 UTC      │ (cost spike)  │ agent         │ Cost spike  │
│                   │               │               │ +45%        │
│ ─────────────────────────────────────────────────────────────── │
│ 2026-03-22 09:30  │ sarah@        │ Approve       │ Workflow    │
│ 09:30:15 UTC      │ company.com   │ workflow      │ "weekly"    │
│                   │               │               │ Approved    │
│                   │               │               │ reason: OK  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ [Load more entries]                                              │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ Selected entry: 2026-03-23 14:15 (Modify agent config)          │
│                                                                  │
│ CHANGE DETAILS (Diff view)                                      │
│                                                                  │
│ Agent: Agent-X                                                   │
│ Modified by: eric@company.com                                    │
│ Modified at: 2026-03-23 14:15:20 UTC                             │
│ Change reason: "Improve accuracy"                                │
│ Status: Active                                                   │
│                                                                  │
│ BEFORE:                                                          │
│ {                                                               │
│   "name": "Agent-X",                                             │
│   "prompt": "You are a helpful assistant...",                    │
│   "model": "gpt-4-turbo"                                         │
│ }                                                               │
│                                                                  │
│ AFTER:                                                           │
│ {                                                               │
│   "name": "Agent-X",                                             │
│   "prompt": "You are a helpful assistant specializing in...",    │
│   "model": "gpt-4-turbo"                                         │
│ }                                                               │
│                                                                  │
│ DIFF:                                                            │
│ - "prompt": "You are a helpful assistant..."                     │
│ + "prompt": "You are a helpful assistant specializing in..."     │
│                                                                  │
│ [Rollback to previous version] [Export as JSON]                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Activity Log Entry

```json
{
  "audit_id": "audit-abc123",
  "workspace_id": "ws-001",
  "timestamp": "2026-03-23T14:15:20Z",
  "actor": {
    "actor_id": "user-123",
    "actor_email": "eric@company.com",
    "actor_type": "human" | "system" | "api"
  },
  "action": "modify_agent_config",
  "resource_type": "agent",
  "resource_id": "agent-x",
  "resource_name": "Agent-X",
  "change_summary": "Modified prompt",
  "details": {
    "project_id": "proj-bodypulse",
    "reason": "Improve accuracy"
  },
  "before": { ... },
  "after": { ... },
  "impact": {
    "affected_resources": ["workflow-daily-sync", "workflow-batch"],
    "estimated_cost_change_percent": 5
  },
  "status": "completed"
}
```

### Approval Request

```json
{
  "approval_id": "appr-001",
  "workspace_id": "ws-001",
  "requested_at": "2026-03-23T15:30:00Z",
  "requested_by": "eric@company.com",
  "action_type": "trigger_workflow",
  "action_details": {
    "workflow_id": "wf-daily-sync",
    "estimated_cost_usd": 150.00
  },
  "status": "pending",
  "required_approvers": ["finance-lead", "ops-lead"],
  "approvals": [
    {
      "approver_email": "sarah@company.com",
      "approval_status": "approved",
      "approved_at": "2026-03-23T15:31:00Z",
      "reason": "Approved for business purposes"
    }
  ]
}
```

### Change Record (Version History)

```json
{
  "change_id": "change-abc123",
  "resource_type": "agent",
  "resource_id": "agent-x",
  "version_number": 5,
  "created_at": "2026-03-23T14:15:20Z",
  "created_by": "eric@company.com",
  "change_reason": "Improve accuracy",
  "previous_version": 4,
  "before": { ... },
  "after": { ... },
  "diff": [
    {
      "path": "prompt",
      "operation": "modify",
      "old_value": "You are a helpful assistant...",
      "new_value": "You are a helpful assistant specializing in..."
    }
  ]
}
```

### API Endpoints

#### GET /api/audit/activity-log
Returns audit trail entries, filtered and paginated.

**Query params:**
- `start_date`: YYYY-MM-DD (defaults to 30 days ago)
- `end_date`: YYYY-MM-DD (defaults to today)
- `action_type`: "all" | "trigger" | "modify" | "approve" | "rollback"
- `actor_email`: filter by email
- `resource_type`: "agent" | "workflow" | "config"
- `resource_id`: specific resource ID
- `limit`: 25 (max 500)
- `offset`: 0

**Response:**
```json
{
  "entries": [ ... ],
  "total": 45,
  "limit": 25,
  "offset": 0
}
```

#### GET /api/audit/changes/{resource_type}/{resource_id}
Returns version history for a resource.

**Query params:**
- `limit`: 10
- `offset`: 0

**Response:**
```json
{
  "resource_id": "agent-x",
  "changes": [
    { "version": 5, "created_at": "...", "created_by": "...", "reason": "..." },
    { "version": 4, "created_at": "...", "created_by": "...", "reason": "..." },
    { ... }
  ]
}
```

#### GET /api/audit/changes/{resource_type}/{resource_id}/versions/{version}
Returns before/after for a specific version change.

**Response:**
```json
{
  "version": 5,
  "created_at": "2026-03-23T14:15:20Z",
  "created_by": "eric@company.com",
  "before": { ... },
  "after": { ... },
  "diff": [ ... ]
}
```

#### GET /api/approvals/pending
Returns pending approval requests.

**Query params:**
- `for_approver_email`: filter by current user

**Response:**
```json
{
  "pending_approvals": [
    {
      "approval_id": "appr-001",
      "requested_by": "eric@company.com",
      "action_type": "trigger_workflow",
      "action_details": { ... },
      "created_at": "2026-03-23T15:30:00Z"
    }
  ],
  "total": 3
}
```

#### POST /api/approvals/{approval_id}/approve
Approves a pending action.

**Request:**
```json
{
  "approver_email": "sarah@company.com",
  "reason": "Approved for business purposes"
}
```

**Response:**
```json
{
  "approval_id": "appr-001",
  "status": "approved",
  "approved_at": "2026-03-23T15:31:00Z"
}
```

#### POST /api/audit/export
Exports audit log as CSV or JSON.

**Request:**
```json
{
  "format": "csv" | "json",
  "start_date": "2026-01-01",
  "end_date": "2026-03-31",
  "action_type": "all",
  "resource_type": "all"
}
```

**Response:** File download (CSV or JSON)

---

## Interaction Flows

### Flow 1: Review Change History of an Agent

1. Operations lead goes to Audit tab
2. Filters: Agent = "Agent-X", Date range = "Last 30 days"
3. Sees 5 modifications of Agent-X
4. Clicks one → detail panel shows before/after
5. Spots that v4 → v5 changed prompt significantly
6. Clicks [Rollback to v4] button → confirmation modal
7. Confirms → Agent-X reverts to v4 config
8. Audit log records: "Rollback to v4 by eric@... reason: Previous behavior was better"

### Flow 2: Export 6-Month Audit Log

1. Compliance officer goes to Audit tab
2. Sets date range: Jan 1 - Jun 30
3. Leaves all filters as "all"
4. Clicks [Export: JSON]
5. Browser downloads audit-trail-2026-01-01-to-2026-06-30.json
6. Contains: 500+ entries with timestamps, actors, actions, before/after
7. Uploads to compliance platform for auditor review

### Flow 3: Approve High-Cost Workflow

1. Operations lead triggers a $500 workflow
2. System detects cost > $100 threshold
3. Creates approval request, notifies Finance lead
4. Finance lead gets notification: "Workflow 'monthly-report' awaiting approval ($500)"
5. Clicks notification → opens Approvals dashboard
6. Sees pending request, reviews workflow details
7. Clicks [Approve] → enters reason: "Approved for monthly reporting"
8. Workflow proceeds, audit log records approval with finance lead's reason

### Flow 4: Track Who Changed a Config

1. Project lead notices Agent-X behaving differently
2. Goes to Audit tab → filters: Resource = "Agent-X"
3. Sees all changes to Agent-X (last 6 months)
4. Clicks change at 2026-03-20 14:15 → sees diff
5. Realizes eric@company.com changed the prompt yesterday
6. Reaches out to eric: "Why did you change the prompt?"
7. Eric explains: "Improving accuracy" (reason is recorded in audit log)

---

## Detailed Component Specs

### Activity Log Table

**Columns:** Timestamp | Actor | Action | Details | Status  
**Sorting:** Click header to sort (defaults: newest first)  
**Filtering:** Dropdowns above table for date range, action type, actor, resource  
**Pagination:** Show 25 per page, "Load more" button  

**Row content:**
```
2026-03-23 14:15:20 UTC | eric@company.com | Modify agent config | Agent-X (prompt) | Active
```

**Row interactions:**
- Click row → expand to show full details (before/after)
- Right-click → context menu (Rollback, Export, View resource)

### Change Details Panel

**Layout:** Side panel (desktop) or modal (mobile)  
**Sections:**
1. **Metadata:** Actor, timestamp, reason, status
2. **Tabs:** [Before] [After] [Diff]

**Before tab:**
- JSON code block with syntax highlighting
- Collapsible nested objects
- [Copy] button

**After tab:**
- Same as Before

**Diff tab:**
- Line-by-line diff (red = removed, green = added)
- Highlighted changes
- Line numbers on left

**Actions:**
- [Rollback to this version] (if applicable)
- [Export as JSON]
- [Compare to previous version]

### Approval Request Card

**Location:** Approvals dashboard (new)  
**Content:**
```
┌─────────────────────────────────────┐
│ Workflow: monthly-report            │
│ Requested by: eric@company.com      │
│ Requested at: 2026-03-23 15:30 UTC  │
│                                     │
│ Estimated cost: $500.00             │
│ Duration: ~30 minutes               │
│                                     │
│ Reason: "Monthly reporting job"    │
│                                     │
│ [Approve] [Reject] [More details]   │
└─────────────────────────────────────┘
```

**Approval flow:**
1. Click [Approve]
2. Modal: "Add comment (optional): ___"
3. Click [Confirm approve]
4. Request status → "approved"
5. Timestamp recorded (2026-03-23 15:31 UTC)
6. Audit log entry created

---

## Mobile-Specific Design

### Portrait View (320-640px)

```
┌────────────────────────────────┐
│ Audit Trail                    │
├────────────────────────────────┤
│ [Date range ▼] [Action ▼]      │
│ [Actor ▼] [Resource ▼]         │
├────────────────────────────────┤
│ ACTIVITY LOG (Simplified)      │
│ 2026-03-23 14:15              │
│ eric@ → Modify agent           │
│ Agent-X (prompt)               │
│ [View details]                 │
│                                │
│ 2026-03-22 09:30              │
│ system → Auto-pause agent      │
│ Agent-Y (cost spike)           │
│ [View details]                 │
│                                │
│ [Load more]                    │
├────────────────────────────────┤
│ DETAIL (Full screen modal)     │
│ 2026-03-23 14:15:20 UTC       │
│ Actor: eric@company.com        │
│ Action: Modify agent config    │
│ Reason: "Improve accuracy"    │
│                                │
│ BEFORE:                        │
│ { "prompt": "..." }            │
│                                │
│ AFTER:                         │
│ { "prompt": "..." }            │
│                                │
│ DIFF (Green/red highlights)    │
│ [Rollback] [Export]            │
│                                │
│ [Close]                        │
│                                │
└────────────────────────────────┘
```

---

## Implementation Notes

### Tech Stack

- **Frontend:** React 18+ with TanStack Query
- **Data table:** TanStack Table (v8+) with built-in sorting/filtering
- **Diff visualization:** react-diff-viewer or custom
- **Code highlighting:** Prism.js
- **Backend:** PostgreSQL with jsonb columns for before/after

### Database Schema (Audit Table)

```sql
CREATE TABLE audit_log (
  audit_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  resource_name TEXT,
  before JSONB,
  after JSONB,
  reason TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  INDEX (workspace_id, timestamp DESC),
  INDEX (action),
  INDEX (resource_type, resource_id),
  INDEX (actor_email)
);

CREATE TABLE approvals (
  approval_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB,
  status TEXT NOT NULL, -- pending, approved, rejected
  requested_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  INDEX (workspace_id, status, created_at DESC)
);
```

### Immutability Guarantee

- Audit log entries are inserted once, never updated or deleted
- Deletion requests are logged as separate "delete_audit_entry" (blocked with reason)
- Compliance export validates: "All records are original (not modified)"

### Role-Based Access

- **Admin:** View all audit logs, export, approve/reject actions
- **Project lead:** View audit logs for their project only
- **Developer:** View only own actions (trigger events, config changes)

### Performance Considerations

1. **Large result sets:** Use pagination (25 entries per page)
2. **Date range queries:** Index on `(workspace_id, timestamp DESC)`
3. **Search by actor:** Index on `actor_email`
4. **Export:** Generate CSV/JSON asynchronously (background job), email download link

### Common Gotchas

**Gotcha 1: Timestamp consistency**
- Always use server timestamp (not client)
- Store in UTC, convert on display
- Ensure clock skew between services doesn't cause ordering issues

**Gotcha 2: Before/after JSON serialization**
- Store full object state (don't store diffs)
- Diffs are calculated on read (frontend)
- This prevents lossy compression and allows future format changes

**Gotcha 3: Actor identification**
- Some actions are triggered by system (cost alerts, auto-pause)
- Log as `actor_type: "system"` with reason
- Don't mix human and system actions (filter separately)

**Gotcha 4: Approval workflow timing**
- If approval takes 2 hours, don't block execution (queue instead)
- Allow "approved after execution" for urgent cases
- Log the deviation clearly

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Audit log completeness** | 100% of mutations recorded | Spot-check that all changes are logged |
| **Compliance export accuracy** | 100% of records present | Compare export to DB, validate signatures |
| **Approval turnaround time** | < 1 hour | Track approval request → decision time |
| **Rollback success rate** | 99%+ | Monitor rollback executions, no failures |
| **Access control enforcement** | 0 unauthorized reads | Audit access patterns, verify RBAC |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-23 | Initial Audit Trail spec (Phase 2) |

---

**Next:** Implement audit logging layer, approval workflow, and export system in Phase 3.
