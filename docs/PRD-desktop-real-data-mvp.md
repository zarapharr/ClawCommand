# ClawCommand PRD vNext
## Desktop Real-Data MVP (Planning Baseline)

Status: Draft for peer review
Owner: Zara ⚡
Date: 2026-02-27

## 1) Product Intent
ClawCommand becomes the desktop command center for OpenClaw operators who need a reliable, actionable control surface, not a demo dashboard. The MVP prioritizes real runtime data, auditable actions, and fast triage over broad module count.

## 2) Problem Statement
Current dashboard concepts are visually strong but too dependent on mock data. Operators need:
- trustworthy live status,
- safe execution controls,
- one place to triage agent, task, and cron issues,
- desktop-first workflows that reduce command-line switching.

## 3) MVP Goals (Desktop)
1. Replace fake activity with live OpenClaw runtime events.
2. Execute top operator actions with receipts and rollback-safe UX.
3. Provide a daily operations view (brief + queue + incidents).
4. Ship as desktop app first (Electron + local secure bridge).

### Non-Goals for MVP
- Mobile app parity
- Full visual builder for skills/workflows
- Complex analytics warehouse
- Multi-tenant enterprise features

## 4) Target User
Primary: Eric-level operator running multiple active agent workflows and requiring command confidence.
Secondary: Technical assistant users who need low-friction observability and intervention.

## 5) Core User Stories
1. As an operator, I can see which agents are healthy, degraded, or stalled right now.
2. As an operator, I can run core commands (spawn, stop, message, retry) and get a receipt.
3. As an operator, I can inspect session timeline and tool events for root-cause triage.
4. As an operator, I can review cron failures and retry from one place.
5. As an operator, I get a desktop morning brief summarizing risk, backlog, and priorities.

## 6) MVP Scope
### In Scope Modules
- Factory Floor Live View
- Task and Session Command Center
- Cron Health and Retry
- Action Console (audited command execution)
- Brief Panel (daily summary)
- Settings (connection/auth/model routing visibility)

### Out of Scope (for MVP)
- Visual skill builder
- Deep memory exploration UI
- Governance voting panel
- Third-party plugin marketplace

## 7) Functional Requirements
### FR-1 Live Event Ingestion
- Connect to OpenClaw Gateway event stream or poll endpoints with fallback.
- Normalize events to typed schema: `session`, `task`, `tool`, `cron`, `message`, `system`.
- Display freshness indicator and stale-data warning.

Acceptance:
- At least 95% of live events shown in UI within 3 seconds of gateway receipt.
- If stream fails, UI shows degraded state within 5 seconds.

### FR-2 Action Execution with Receipts
- Support commands: spawn agent task, stop run, send message, retry task, retry cron.
- Every action returns: command id, status, timestamp, actor, target, result/error.
- Store command ledger locally + server-side append log.

Acceptance:
- 100% of initiated actions produce visible receipt (success or error).
- User can filter last 200 actions by status and target.

### FR-3 Session and Tool Timeline
- Unified timeline per session with tool calls and errors.
- Search/filter by agent, severity, event type, and time window.

Acceptance:
- Timeline load under 2 seconds for recent 24 hours.

### FR-4 Cron Operations Panel
- Show schedules, last run, failure streak, next run, and alert severity.
- One-click retry with confirmation and receipt.

Acceptance:
- Operator can detect persistent failures in under 30 seconds.

### FR-5 Morning Brief
- Desktop brief card generated at configurable window.
- Includes: top 5 risks, blocked tasks, cron failures, stale agents, suggested actions.

Acceptance:
- Brief generation succeeds daily with fallback message on partial data.

## 8) Data and Integration Requirements
### Runtime Sources
- OpenClaw session/task tools APIs
- Cron logs and run statuses
- Gateway health + model usage surfaces

### Data Contracts
Define JSON contracts before implementation:
- `AgentStatusSnapshot`
- `EventEnvelope`
- `ActionReceipt`
- `CronHealthRecord`
- `MorningBrief`

### Persistence
- Local desktop cache: SQLite for offline-read and short-term history.
- Retention default: 30 days for local cache; source-of-truth remains OpenClaw runtime stores.

## 9) Desktop Architecture
- UI: React + TypeScript
- Shell: Electron
- IPC bridge: strict allowlist channels, no arbitrary eval
- Optional backend bridge: local Node service for event normalization and auth token handling

Security requirements:
- Tokens never rendered in UI
- Secrets isolated to secure process/env storage
- Action endpoints require explicit user context + confirmation for destructive commands

## 10) Reliability and Safety
- Heartbeat monitor for stream health
- Automatic reconnect with backoff
- Circuit-breaker for repeated failed actions
- Clear degraded/offline state language in UI
- Immutable action audit trail

## 11) UX Principles for MVP
1. Trust over flash: every widget must reference live data timestamp.
2. Triage-first home screen: health, incidents, queue, then detail.
3. One-screen intervention: detect, inspect, act, confirm.
4. Desktop-optimized density with keyboard shortcuts for operator speed.

## 12) MVP Success Metrics
- Time-to-detect critical issue: < 60 seconds
- Time-to-first-remediation action: < 90 seconds
- Action receipt coverage: 100%
- Daily active operator usage: >= 1 meaningful session/day
- Fake-data dependency: 0 in production build

## 13) Delivery Plan (30 Days)
### Week 1: Event Backbone
- Finalize event schemas
- Build gateway ingestion + local cache
- Replace mock feeds in factory floor and activity panels

### Week 2: Action Console
- Implement top 5 operator actions
- Add confirmations, receipts, error handling
- Introduce action ledger UI

### Week 3: Triage Surfaces
- Session timeline and filters
- Cron health panel + retry
- Incident badges and severity routing

### Week 4: Brief + Hardening
- Morning brief generation + UI
- Reliability passes (disconnects, retries, stale data)
- Desktop packaging and smoke tests

## 14) Risks and Mitigations
1. Scope creep from non-MVP modules
   - Mitigation: strict backlog gate, only P0/P1 real-data items.
2. Event model churn
   - Mitigation: schema versioning and adapter layer.
3. Trust loss due to missing/late data
   - Mitigation: freshness labels, degraded banners, and fallback logs.
4. Desktop security drift
   - Mitigation: IPC allowlist tests and secret-scan checks in CI.

## 15) Open Questions
1. Preferred event transport for MVP: SSE, WebSocket, or polling-first hybrid?
2. Command authority model: role levels vs single-owner approval?
3. Local cache retention and compliance constraints beyond 30 days?
4. Should morning brief be pull-only at app open, or also push notification?

## 16) Exit Criteria for Planning Phase
This PRD is review-ready when:
- peer-reviewed by Claude and OpenAI,
- unresolved design conflicts are reduced to decision list,
- MVP backlog can be decomposed into implementation tickets without inventing new requirements.
