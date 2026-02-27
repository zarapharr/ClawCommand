# Subagent Execution System, ClawCommand Desktop MVP

## Objective
Ship a stable desktop MVP in 2 weeks with real operational data wired into core views (Agents, Sessions, Cron), while keeping scope tight and release-ready.

## Constraints
- Desktop MVP only, no mobile scope.
- Real data first, no new mock-only features.
- Prefer integration over redesign.
- Keep existing UX stable while replacing data plumbing.
- Every packet must produce testable output in the app.

## Subagent Roles

### 1) architect
- Owns technical plan, sequencing, interfaces, and risk register.
- Approves packet dependency order.
- Final reviewer on cross-cutting decisions.

### 2) frontend-integrator
- Replaces mocked UI feeds with runtime adapters.
- Implements loading, empty, error, stale-data states.
- Keeps existing design language and interaction patterns.

### 3) runtime-integrator
- Implements/extends runtime bridge for agents, sessions, cron data.
- Adds data normalization, shape validation, and safe fallbacks.
- Ensures no secrets leak in UI payload previews.

### 4) qa/reliability
- Validates acceptance criteria per packet.
- Adds smoke checks and regression checklist for core workflows.
- Tracks defects to closure with severity and repro notes.

### 5) docs/release
- Maintains operator docs, release notes, known issues.
- Produces MVP handoff checklist and rollback notes.
- Confirms onboarding steps are runnable by a new operator.

## Work Intake Template
Use for every new packet:

```text
Packet ID:
Title:
Owner Role:
Problem:
Scope In:
Scope Out:
Dependencies:
Acceptance Criteria:
Evidence Required (screenshots/logs/tests):
Estimate (hours):
Priority (P0/P1/P2):
```

## Definition of Done
A packet is done only if all are true:
1. Acceptance criteria pass.
2. Real data path verified in-app (or explicitly documented fallback).
3. QA checklist completed with evidence.
4. Docs/release notes updated if behavior changed.
5. No unresolved P0/P1 defects introduced.

## Daily Operating Cadence
- 09:00: 15-minute plan sync, confirm packet ownership and blockers.
- 12:30: Midday integration checkpoint, merge-ready status only.
- 16:30: QA + release readiness review, decide carry-over.
- End of day: update backlog status and next-day top 3 packets.

## Escalation Rules
Escalate immediately to architect when:
- A packet is blocked more than 2 working hours.
- Runtime contract changes break another role's packet.
- Any P0 defect appears in core MVP flows.
- Scope pressure threatens the desktop/real-data constraints.

Escalation path:
1. Owner raises blocker with impact and proposed options.
2. architect decides within same business block.
3. docs/release records decision and scope change note.
