# ClawCommand Master PRD
## Desktop Real-Data MVP (Final Planning Draft)

Status: Master Draft for Owner Review  
Owner: Zara ⚡  
Date: 2026-02-27

## 1. Product Intent
ClawCommand is the desktop mission-control application for OpenClaw operators. This MVP is explicitly scoped to replace mock behavior with live runtime data, provide safe and auditable operator actions, and support high-confidence daily operations from one desktop interface.

## 2. Problem Statement
Current ClawCommand surfaces are UI-strong but integration-light. Operators need:
- trusted live status across agents, sessions, cron, and tasks,
- one-step intervention controls with receipts,
- reliable triage without command-line context switching,
- clear degraded-state visibility when runtime data is stale or unavailable.

## 3. MVP Goals
1. Eliminate production mock data paths.
2. Deliver live runtime observability with freshness and quality indicators.
3. Execute top operator actions with canonical audit receipts.
4. Ship desktop-first (Electron) with secure local bridge and operational hardening.
5. Enable a practical daily loop: brief, triage, act, verify.

## 4. MVP Non-Goals
- Mobile app parity
- Multi-tenant RBAC and enterprise isolation
- Visual skill/workflow builder
- Advanced recommendation analytics
- Governance voting panel

## 5. Target User
Primary user: single-owner OpenClaw operator (Eric profile) managing active agent workflows and requiring command confidence.

MVP operating mode: **single-owner authority model only**.

## 6. Scope (MVP Modules)
### In Scope
- Factory Floor Live View
- Session + Task Command Center
- Cron Health + Retry Panel
- Action Console with canonical receipts
- Morning Brief Panel
- Settings (connection/auth/routing visibility)

### Out of Scope
- Multi-user management
- Third-party plugin marketplace
- Full memory exploration UI
- Deep governance workflows

## 7. Functional Requirements
### FR-1: Live Event Ingestion
System must ingest OpenClaw runtime events via selected transport with fallback.

Requirements:
- Event transport decision by **Week 1 Day 2** (default fallback: polling-first hybrid).
- Typed event normalization into: `session`, `task`, `tool`, `cron`, `message`, `system`.
- Freshness indicator and degraded banner on data quality issues.

Acceptance:
- P95 render latency: critical events <=2s, non-critical <=5s.
- Event loss <=0.1% over 24h soak test.
- Degraded banner appears <=5s after stream disruption.

### FR-2: Action Execution and Receipts
System must support operator actions with immutable receipt visibility.

Required actions:
- spawn task
- stop run
- send message
- retry task
- retry cron

Requirements:
- Every action emits `ActionReceipt` with command id, actor, target, timestamp, status, result/error.
- Canonical source of truth: server append-only action log.
- Local ledger is cache and must reconcile on reconnect.

Acceptance:
- 100% of initiated actions produce visible receipt.
- >=99.9% receipt reconciliation with canonical log.
- Last 200 actions filterable by status/target/actor.

### FR-3: Session and Tool Timeline
Provide per-session timeline with root-cause triage support.

Requirements:
- Unified timeline for session events and tool calls.
- Filters by agent, severity, event type, time window.

Acceptance:
- Timeline load <=2s for last 24 hours on target machine.

### FR-4: Cron Operations
Expose cron reliability and operator recovery actions.

Requirements:
- Show schedule, last run, failure streak, next run, severity.
- One-click retry with confirmation and receipt.
- Persistent failure definition: >=3 consecutive failures OR streak >24h.

Acceptance:
- In fixture of 50 cron jobs, operator identifies persistent failures <=30s.

### FR-5: Morning Brief
Generate a daily desktop operational brief.

Requirements:
- Configurable window (default 06:30-07:00 America/Chicago).
- Include top risks, blocked tasks, cron failures, stale agents, suggested actions.
- Show per-section confidence and missing-source reason when partial.

Acceptance:
- >=95% on-time brief generation over 14 days.
- On healthy data days, at least 4/5 sections populated.

## 8. Data Contracts and Source of Truth
### Contract Objects
- `AgentStatusSnapshot`
- `EventEnvelope`
- `ActionReceipt`
- `CronHealthRecord`
- `MorningBrief`

### `EventEnvelope` Required Fields
- `event_id`
- `source_ts`
- `ingest_ts`
- `sequence`
- `source`
- `severity`
- `dedupe_key`
- `event_type`
- `payload`

Rules:
- Idempotent upsert by `event_id`.
- Stable ordering by `source_ts`, then `sequence`.
- Duplicate display rate <=0.5%.

### Persistence
- Desktop cache: SQLite, 30-day default retention.
- Canonical run/action state remains in OpenClaw runtime stores.

## 9. Security and Governance (MVP Level)
- Single-owner mode only, no multi-user RBAC in MVP.
- Strict IPC allowlist, no arbitrary eval.
- Secrets never rendered in UI.
- Tokens stored only in secure process/env context.
- Typed confirmation required for destructive actions (stop/retry-all).
- Append-only action audit log required.

Acceptance:
- Secret scan and IPC allowlist tests pass in CI.
- 0 accidental destructive actions in usability set (n>=20).

## 10. Desktop Architecture
- UI: React + TypeScript
- Desktop shell: Electron
- Optional local service: Node bridge for auth + event normalization
- Offline-read cache: SQLite

Operational behavior:
- Auto reconnect with exponential backoff
- Circuit-breaker for repeated command failures
- Clear stale/offline/degraded state language

## 11. UX Principles
1. Trust first: every primary widget shows freshness timestamp and source state.
2. Triage-first home: health, incidents, queue, then details.
3. One-screen intervention loop: detect, inspect, act, confirm.
4. Desktop operator speed: keyboard shortcuts + dense-but-readable layouts.

## 12. Master Success Metrics
1. Detection speed: P90 time-to-detect critical incident <=45s from ingest.
2. Remediation speed: P90 time-to-first-action <=75s.
3. Receipt integrity: 100% receipt generation, >=99.9% canonical reconciliation.
4. Event reliability: event loss <=0.1% per 24h; duplicate display <=0.5%.
5. Latency: P95 critical <=2s, non-critical <=5s.
6. Trust signals: 100% primary widgets show freshness and source state.
7. Operational usefulness: >=80% critical incidents handled fully in-app (no CLI fallback).
8. Brief reliability: >=95% on-time brief generation across 14 days.
9. Performance: warm start first meaningful paint <=2.5s median.
10. Mock elimination: 0 production mock paths, enforced by CI gate.
11. Rollout scorecard: weekly report on live coverage %, mock coverage %, action failure rate.

## 13. Delivery Plan (30 Days)
### Week 1: Data Plane Foundation
- Finalize schema v0 and transport decision.
- Implement ingestion + normalization + local cache.
- Replace mock feeds in Agents, Sessions, Cron core views.

Exit Gate:
- schema freeze v0 complete
- transport selected
- 24h ingestion soak test passed

### Week 2: Action Plane + Audit
- Implement top 5 operator actions end-to-end.
- Add confirmations, receipts, reconciliation.
- Build action ledger and filter UX.

Exit Gate:
- audited action path complete
- reconciliation pass rate >=99.9%

### Week 3: Triage Reliability Surfaces
- Session/tool timeline with filters.
- Persistent cron failure detection + retry UX.
- Incident severity routing and stale-state handling.

Exit Gate:
- cron persistent-failure detection test pass
- timeline performance test pass

### Week 4: Brief + Hardening + Readiness
- Morning brief pipeline + confidence annotations.
- Reliability passes (disconnect/reconnect/retry/circuit-breaker).
- Desktop packaging + canary rollout + readiness checks.

Exit Gate:
- canary pass
- readiness checks green
- production mock-path CI gate enforced

## 14. Risks and Mitigations
1. Scope creep into non-MVP modules
   - Mitigation: backlog gate to real-data P0/P1 only.
2. Event contract churn
   - Mitigation: schema versioning and adapter layer.
3. Trust loss from stale/missing data
   - Mitigation: mandatory freshness/source badges and degraded banners.
4. Security drift in desktop bridge
   - Mitigation: IPC/security tests + secret scan in CI.
5. Operational noise overload
   - Mitigation: triage severity defaults and digested notifications.

## 15. Open Decisions with Lock Dates
1. Event transport (SSE/WebSocket/polling hybrid)
   - Lock by Week 1 Day 2.
2. Confirmation policy details (typed confirmations and cooldown behavior)
   - Lock by Week 2 Day 1.
3. Brief delivery mode (pull at launch only vs optional desktop notification)
   - Lock by Week 3 Day 1.

Default if unresolved:
- polling-first hybrid transport,
- single-owner strict confirmations,
- pull-on-open brief.

## 16. Exit Criteria for Planning Completion
Planning is complete when:
- this Master PRD is approved by owner,
- decisions list is locked with no unresolved blockers,
- implementation backlog can be created without inventing new requirements,
- launch gates and metrics are testable and assigned.
