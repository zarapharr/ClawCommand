# ClawCommand PRD — Mission Control Dashboard for OpenClaw

**Document:** Product Requirements Document  
**Version:** 1.0  
**Date:** 2026-03-24  
**Status:** Ready for Build (Track D)  
**Authors:** ops-research (Track A), ops-triage (Track B), ops-synthesizer (Track C)

---

## 1. Product Vision

**ClawCommand is real-time mission control for the full OpenClaw stack running on a Mac Studio.**

Every panel shows live data from local infrastructure. No mocks anywhere. Single-owner dashboard (Eric profile only) providing complete visibility into:
- Agent orchestration and lifecycle
- Session execution and token tracking
- Cost forecasting and budget alerts
- Cron job management and execution history
- System health (CPU, memory, disk, Docker)
- Live audit logs and activity trails
- Real-time chat with running agents

Success metric: Eric can see all critical system state without touching CLI or config files.

---

## 2. Data Source Mapping

This section documents the exact data source for every panel. All data flows through backend proxy (except Qdrant, which is accessed directly).

### 2.1 Data Source Endpoints

| Source | Protocol | Host | Port | Purpose | Auth |
|--------|----------|------|------|---------|------|
| **Gateway** | WebSocket | 127.0.0.1 | 18789 | Agent control, chat, cron RPC | Bearer token (OPENCLAW_GATEWAY_TOKEN) |
| **Backend Proxy** | HTTP REST | 127.0.0.1 | 8000 | Unified proxy for all services | Express session (local) |
| **Langfuse** | HTTP REST | localhost | 3000 | Trace ingestion, cost tracking, durations | No auth (local) |
| **Qdrant** | HTTP REST | localhost | 6333 | Vector collections, collection stats | No auth (local) |
| **Ollama** | HTTP REST | 127.0.0.1 | 11434 | Loaded models list, model status | No auth (local) |
| **Docker Daemon** | Unix socket | /var/run/docker.sock | — | Container status, logs | Via backend proxy /api/docker |
| **Audit Logs** | File (JSONL) | /Users/eric_pharr/.openclaw/workspace/logs/audit/ | — | Immutable activity ledger | Read-only filesystem access |
| **GitHub API** | HTTPS | api.github.com | 443 | zarapharr/ClawCommand, enterprise-claw-command-sandbox repos | Via backend proxy /api/github |
| **System Metrics** | HTTP REST | 127.0.0.1 | 8000 | CPU, memory, disk usage | Via backend proxy /api/system/metrics |
| **Cron Jobs** | HTTP REST | 127.0.0.1 | 8000 | Job status, run history, triggers | Via backend proxy /api/cron |

### 2.2 Backend Proxy Architecture

**Purpose:** Single unified HTTP/WebSocket proxy serving all local services to React frontend.

**Implementation:** Express server at `server/src/index.ts`

**Endpoints:**
```
GET  /api/health                    → Service health check
GET  /api/system/metrics            → CPU, memory, disk (polling interval: 5s)
GET  /api/docker/containers         → List containers with status
GET  /api/docker/logs/:id           → Stream container logs
GET  /api/cron/jobs                 → List scheduled jobs
POST /api/cron/jobs/:id/run         → Trigger job immediately
GET  /api/cron/jobs/:id/history     → Run history with timestamps
GET  /api/github/repos/:owner/:repo → Repository metadata
GET  /api/github/issues             → Open issues for configured repos
GET  /api/qdrant/collections        → List collections, vector count
GET  /api/qdrant/stats/:collection  → Collection statistics
GET  /api/langfuse/traces           → Recent traces (last N hours)
GET  /api/langfuse/costs            → Cost aggregation
WS   /api/gateway                   → WebSocket proxy to Gateway
```

**Request/Response Format:**
```json
// Request
{
  "method": "GET",
  "path": "/api/system/metrics"
}

// Response
{
  "success": true,
  "data": {
    "cpu": { "usage": 24.5, "cores": 10 },
    "memory": { "used": 16.2, "total": 32, "percent": 50.6 },
    "disk": { "used": 450, "total": 1000, "percent": 45 }
  },
  "timestamp": "2026-03-24T01:30:00Z",
  "ttl": 5000
}
```

---

## 3. Views & Pages (with Panel Specifications)

This section defines every page/view in the dashboard: panels it contains, data source for each, real-time update cadence, and success criteria.

### 3.1 Factory Floor (Agent Status Overview)

**Purpose:** At-a-glance view of all 16 agents and their current state.

**Layout:** Sidebar (left) + Main grid (center) + Detail drawer (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Min Size | Collapse |
|-------|---------|-------------|----------------|----------|----------|
| **Sidebar Navigation** | Agent list, nav links (Chat, Sessions, Budget, Cron, Logs, etc.) | Local state | Static | 180px | No |
| **Agent Status Grid** | 16 agent cards with status, last heartbeat, model, task | Gateway RPC (list agents) + WebSocket events | Event-driven (agent.status.*) | 320px | No |
| **Agent Detail Drawer** | Selected agent: full status, scopes, role, last activity, task progress | Gateway RPC + WebSocket | Event-driven | 280px (collapsed) | Yes |
| **System Health Badge** | CPU %, Memory %, Disk %, Gateway connected | Backend proxy /api/system/metrics | Poll 5s | Small (badge) | No |

#### Agent Status Grid Card Spec

```tsx
// Each card displays:
{
  name: "ops-builder",              // Agent name
  status: "active",                 // active | idle | deferred | blocked
  riskClass: "medium",              // low | medium | high | critical
  lastActivity: "2 min ago",         // Human-readable timestamp
  currentTask: "Building task #123", // Current task name or null
  owningTopic: 85,                  // Topic ID this agent serves
  model: "claude-haiku-4-5",        // Active model
  sessionCount: 3,                  // Concurrent sessions
  heartbeat: "healthy",             // healthy | slow | stale
}
```

**Color Coding:**
- Status active → green (#10B981)
- Status idle → blue (#3B82F6)
- Status deferred → gray (#9CA3AF)
- Status blocked → red (#EF4444)
- Risk low → green, medium → yellow, high → orange, critical → red

#### Success Criteria

- [ ] All 16 agents visible on initial load (within 2 seconds)
- [ ] Agent status updates in <200ms when WebSocket event arrives
- [ ] Clicking agent card opens detail drawer without blocking grid
- [ ] System health badges update every 5 seconds
- [ ] Gateway connection status always visible (green dot + "Connected")
- [ ] Keyboard: Arrow keys navigate grid, Enter opens detail, Esc closes drawer

---

### 3.2 Agent Command (Agent Lifecycle Management)

**Purpose:** Control individual agent lifecycle, view detailed status, manage permissions.

**Layout:** Split panel: agent tree (left) + command panel (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Agent Tree** | Hierarchical list of 16 agents grouped by risk class | Local state (from Factory Floor) | On selection | Find any agent in <300ms |
| **Command Panel** | Status details, action buttons (pause/resume/reload), audit log | Gateway RPC (get agent status, audit logs) | Event-driven + 10s poll | Actions execute in <1s |
| **Permissions Viewer** | Scopes, role, allowed topics | Gateway RPC | Static (on load) | Display all scopes without truncation |
| **Last Activity Log** | 10 most recent activities for selected agent | Backend proxy /api/audit (filtered by agent) | Poll 5s | Show activities within 10s of event |

#### Command Actions

```json
{
  "pause_agent": { "description": "Pause execution", "icon": "pause", "color": "yellow" },
  "resume_agent": { "description": "Resume execution", "icon": "play", "color": "green" },
  "reload_agent": { "description": "Reload config", "icon": "reload", "color": "blue" },
  "view_logs": { "description": "Open agent logs", "icon": "logs", "color": "gray" },
  "monitor_sessions": { "description": "View active sessions", "icon": "window", "color": "cyan" }
}
```

#### Success Criteria

- [ ] Open Agent Command for any agent within 300ms
- [ ] Pause/resume completes in <1 second
- [ ] Audit log for selected agent loads in <500ms
- [ ] Keyboard: Ctrl+A opens Agent Command; arrow keys navigate tree
- [ ] Optimistic update: UI updates immediately, reverts if action fails

---

### 3.3 Agent Chat (Real-Time Chat with Agents)

**Purpose:** Send messages to agents and receive responses. Full conversation history per session.

**Layout:** Full-width chat: conversation history (top) + input (bottom) + session picker (right sidebar)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Conversation History** | Messages (agent and system) with timestamps, token counts | Gateway RPC (chat.history) + WebSocket (chat events) | Event-driven | New message appears in <200ms |
| **Session Picker** | Dropdown list of active sessions, selected session highlighted | Local state (from Sessions Center) | On page load | 50+ sessions load in <1s |
| **Message Input** | Text input, send button, abort button (if message in flight) | Local state | N/A | Send on Enter or button click |
| **Token Meter** | Current session tokens used (input/output split), cost | Gateway RPC (session.token_count) | Poll 5s or event-driven | Update within 1s of token use |

#### Chat Message Format

```json
{
  "id": "msg-uuid",
  "sessionKey": "default",
  "author": "user|agent|system",
  "text": "What is the status?",
  "timestamp": "2026-03-24T01:30:00Z",
  "tokens": { "input": 150, "output": 0 },
  "status": "sent|pending|failed"
}
```

#### Gateway RPC Integration

```typescript
// Send message
gateway.call('chat.send', {
  sessionKey: 'default',
  text: 'What agents are running?',
  idempotencyKey: 'msg-xyz'
});

// Subscribe to responses
gateway.on('chat', (event) => {
  // event.type = 'message' | 'error' | 'tool-call' | 'completion'
  updateConversation(event);
});

// Fetch history
gateway.call('chat.history', {
  sessionKey: 'default',
  limit: 50
});
```

#### Success Criteria

- [ ] Send message appears in UI within 100ms (optimistic)
- [ ] Agent response appears within 2s of completion
- [ ] Token count updates in real-time as agent streams
- [ ] Abort button stops in-flight message
- [ ] Conversation history persists across page reloads
- [ ] Keyboard: Enter to send, Ctrl+Z to undo, Shift+Enter for multiline

---

### 3.4 Session Center (Session List, Transcripts, Usage)

**Purpose:** View all active/completed sessions, drill down into execution details, track token/cost per session.

**Layout:** Three-panel: session list (left) + waterfall timeline (center) + details (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Session List** | All sessions: ID, agent, duration, token count, cost, status | Backend proxy /api/gateway (or local cache from events) | Event-driven (session.created/completed) | Load 100 sessions in <1s |
| **Waterfall Timeline** | Chronological events: LLM calls, tool calls, errors, completions | Langfuse /api/traces or Gateway RPC (session.events) | Event-driven | Show events within 500ms of arrival |
| **Event Details Panel** | Selected event: full prompt, completion, metadata, tokens, latency | Langfuse API | On selection | Load within 300ms |
| **Session Aggregates** | Total tokens, total cost, agent name, start/end time, framework | Computed from events | On page load | Compute and display in <500ms |

#### Waterfall Event Types

```json
{
  "type": "llm_call",
  "provider": "anthropic",
  "model": "claude-haiku-4-5",
  "inputTokens": 1250,
  "outputTokens": 450,
  "latency": 2340,
  "timestamp": "2026-03-24T01:30:10Z"
},
{
  "type": "tool_call",
  "tool": "fetch_url",
  "input": { "url": "..." },
  "output": { "statusCode": 200, "body": "..." },
  "latency": 1200,
  "timestamp": "2026-03-24T01:30:12Z"
},
{
  "type": "error",
  "message": "Rate limit exceeded",
  "stack": "...",
  "timestamp": "2026-03-24T01:30:14Z"
}
```

#### Success Criteria

- [ ] List 100 sessions, filter by agent/status, load in <1s
- [ ] Click session → waterfall loads in <500ms
- [ ] Hover event → highlight related events (same tool chain)
- [ ] Drill into event detail in <300ms
- [ ] Token count aggregation correct within <100ms
- [ ] Cost calculation reflects current pricing

---

### 3.5 Budget Control (Cost Tracking, Forecasting, Alerts)

**Purpose:** Monitor spending, forecast daily/weekly/monthly costs, set budget alerts.

**Layout:** Three-panel: spending trend (left) + budget alerts (center) + model breakdown (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Spending Trend** | Line chart: daily spend (last 30 days), cumulative, forecast | Langfuse /api/costs + computed trend line | Poll 60s | Display last 30 days in <500ms |
| **Budget Alerts** | Alert rules with thresholds (daily, weekly, monthly) and current status | Local config (budgets.json) + Backend proxy | Event-driven when threshold hit | Alert fires within 10s of threshold |
| **Model Breakdown** | Table: model name, tokens used, cost per model | Langfuse /api/costs (grouped by model) | Poll 60s | Calculate breakdown in <500ms |
| **Cost Forecast** | Projected daily/weekly/monthly costs based on 7-day trend | Computed in frontend | Poll 60s | Update forecast in <500ms |

#### Budget Alert Schema

```json
{
  "id": "alert-1",
  "name": "Daily Spend Alert",
  "type": "daily|weekly|monthly",
  "threshold": 50.00,
  "notifyAt": 75,
  "severity": "info|warning|critical",
  "enabled": true
}
```

#### Cost Aggregation Format

```json
{
  "period": "2026-03-24",
  "totalCost": 12.34,
  "breakdown": [
    {
      "model": "claude-haiku-4-5",
      "provider": "anthropic",
      "tokens": 125000,
      "cost": 6.25,
      "agents": ["ops-research", "ops-triage"]
    },
    {
      "model": "local-model",
      "provider": "ollama",
      "tokens": 50000,
      "cost": 0.00,
      "agents": ["ops-builder"]
    }
  ]
}
```

#### Success Criteria

- [ ] Display last 30 days of spending in <500ms
- [ ] Cost forecast accurate within ±5% of actual
- [ ] Alert fires within 10s of threshold breach
- [ ] Model breakdown groups correctly by provider
- [ ] Daily trend updates every 60s
- [ ] No cost calculation errors (verify against Langfuse)

---

### 3.6 Workflow Builder (Visual Workflow Editor)

**Purpose:** View and edit agent workflows (not execution, read-only for MVP).

**Layout:** Sidebar (components) + Canvas (workflow diagram) + Properties panel (right)

**Status:** Read-only in MVP. Node-dragging, edge creation deferred to Phase 2.

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Component Library** | Draggable list of agents, tools, decision nodes | Local component registry | Static | Load 50+ components in <500ms |
| **Canvas** | Visual workflow DAG (directed acyclic graph) | Backend proxy (fetch workflow definition) | On load | Render 20-node workflow in <1s |
| **Properties Panel** | Selected node: agent, inputs, outputs, config | Local state | On selection | Show properties in <200ms |
| **Validation** | Syntax check, cyclic dependency detection | Computed in frontend | On edit | Validate workflow in <500ms |

#### Workflow Node Format

```json
{
  "id": "node-1",
  "type": "agent|tool|decision",
  "label": "ops-builder",
  "position": { "x": 100, "y": 200 },
  "config": {
    "agent": "ops-builder",
    "timeout": 300,
    "retryCount": 3
  },
  "inputs": ["task"],
  "outputs": ["result", "error"]
}
```

#### Success Criteria

- [ ] Load workflow in <500ms
- [ ] Render 20-node DAG in <1s without layout thrashing
- [ ] Highlight invalid nodes (cycles, missing inputs)
- [ ] Keyboard: arrow keys pan, +/- zoom, Esc deselect
- [ ] MVP: Read-only only (no drag/drop, no edge creation)

---

### 3.7 Cron Scheduler (Job Management)

**Purpose:** List scheduled jobs, view run history, trigger manually, enable/disable.

**Layout:** Three-panel: job list (left) + schedule editor (center) + run history (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Job List** | All cron jobs: name, schedule, last run, next run, status | Backend proxy /api/cron/jobs | Poll 10s | Load 100 jobs in <500ms |
| **Schedule Editor** | Cron expression, human-readable schedule, next 5 runs | Local state (on edit) + computed | On edit | Parse/display cron in <200ms |
| **Run History** | Table: timestamp, duration, exit code, output/error | Backend proxy /api/cron/jobs/:id/history | Poll 15s | Load 50 runs in <300ms |
| **Action Panel** | Buttons: run now, enable/disable, edit, delete | Local state + Gateway RPC | N/A | Execute action in <1s |

#### Cron Job Schema

```json
{
  "id": "cron-1",
  "name": "Daily Backup",
  "schedule": "0 2 * * *",
  "description": "Backup database daily at 2 AM",
  "agent": "ops-release",
  "command": "backup --full",
  "enabled": true,
  "lastRun": { "timestamp": "2026-03-23T02:00:00Z", "duration": 1230, "exitCode": 0 },
  "nextRun": "2026-03-24T02:00:00Z"
}
```

#### Run History Entry

```json
{
  "jobId": "cron-1",
  "timestamp": "2026-03-23T02:00:00Z",
  "duration": 1230,
  "exitCode": 0,
  "stdout": "Backup complete: 5.2 GB",
  "stderr": null,
  "triggeredBy": "scheduler|manual"
}
```

#### Success Criteria

- [ ] List all jobs, filter by enabled/disabled, load in <500ms
- [ ] Parse cron expression, show next 5 runs in <200ms
- [ ] Manual trigger completes in <1s (optimistic UI update)
- [ ] Run history loads with 50 entries in <300ms
- [ ] Enable/disable toggles in <500ms
- [ ] Keyboard: Ctrl+Shift+J opens Cron Scheduler, arrow keys navigate list

---

### 3.8 Logs (Live Log Streaming)

**Purpose:** Real-time tail of all system logs with search/filter, severity levels.

**Layout:** Two-panel: log viewer (main) + filter sidebar (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Log Viewer** | Live tail of logs (DEBUG, INFO, WARN, ERROR), with timestamps | Backend proxy /api/logs (WebSocket stream) + file tail (audit logs) | Event-driven (push) | New log appears in <100ms |
| **Filter Sidebar** | Severity selector (checkboxes), search box, agent filter | Local state | N/A | Filter updates in <200ms |
| **Export Panel** | Button to export visible logs to file (JSON/CSV) | Local state + file download | On click | Download 10K logs in <1s |
| **Log Stats** | Count by severity (ERROR: 5, WARN: 23, INFO: 145) | Computed from stream | Poll 5s | Count updates in <500ms |

#### Log Entry Format

```json
{
  "timestamp": "2026-03-24T01:30:10.234Z",
  "level": "ERROR",
  "source": "gateway-proxy.ts",
  "agent": "ops-builder",
  "message": "Failed to connect to gateway: ECONNREFUSED",
  "stack": "Error: ECONNREFUSED\n  at connect (gateway-proxy.ts:45)",
  "context": { "sessionId": "sess-123" }
}
```

#### Success Criteria

- [ ] Tail live logs at 100+ lines/second
- [ ] Filter by severity in <100ms
- [ ] Search logs by keyword in <500ms (client-side)
- [ ] Export 10K logs to file in <1s
- [ ] Pause/resume button freezes log stream for inspection
- [ ] Keyboard: Ctrl+L opens Logs, Ctrl+F to search

---

### 3.9 Analytics (Usage Metrics, Model Routing)

**Purpose:** Aggregate usage across all agents, show model routing decisions, cost per agent.

**Layout:** Three-panel: metrics dashboard (left) + model routing table (center) + trending (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Metrics Dashboard** | Total tokens, total cost, agent count, session count, uptime | Langfuse /api/costs + Gateway RPC | Poll 60s | Update aggregates in <500ms |
| **Model Routing Table** | Model, provider, token pricing, context window, active agents, fallback chain | Backend proxy /api/models (or hardcoded from openclaw.json) | Static (on load) | Display 10+ models without truncation |
| **Usage Trend** | 7-day line chart: tokens/day, cost/day | Langfuse API | Poll 60s | Render 7-day trend in <500ms |
| **Agent Leaderboard** | Top 10 agents by tokens used, by cost, by session count | Computed from event stream | Poll 60s | Sort leaderboard in <500ms |

#### Model Routing Schema

```json
{
  "model": "claude-haiku-4-5",
  "provider": "anthropic",
  "pricing": { "input": 0.000080, "output": 0.0004 },
  "contextWindow": 32000,
  "activeAgents": ["ops-research", "ops-triage", "ops-triage"],
  "fallback": "local-model",
  "enabled": true
}
```

#### Success Criteria

- [ ] Display aggregates for all metrics in <500ms
- [ ] Model routing table loads in <300ms
- [ ] 7-day trend line renders in <500ms
- [ ] Leaderboard sorts by any column in <300ms
- [ ] Cost per model calculated correctly
- [ ] Keyboard: Ctrl+Shift+A opens Analytics

---

### 3.10 Settings (Configuration Management)

**Purpose:** View/edit configuration (auth, routing, model selection). Read-only display of current config.

**Layout:** Two-panel: settings form (main) + validation warnings (right)

**Status:** Read-only in MVP. Full config mutation deferred to Phase 2.

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Connection Settings** | Gateway URL, gateway token (masked), backend proxy URL | Backend proxy /api/config | On load | Load config in <300ms |
| **Model Settings** | Model selection per agent, fallback chain | openclaw.json (read-only) | On load | Display model config in <200ms |
| **Auth Settings** | Current user (Eric), session timeout, device identity (if applicable) | Local auth state | Static | Show device ID if configured |
| **Validation Panel** | Configuration schema validation, errors, warnings | Computed in frontend | On load | Validate config in <500ms |

#### Config Schema (Read-Only Display)

```json
{
  "gateway": {
    "url": "ws://127.0.0.1:18789",
    "token": "***masked***",
    "connected": true
  },
  "models": {
    "default": "claude-haiku-4-5",
    "fallback": "local-model",
    "perAgent": {
      "ops-builder": "claude-3-5-sonnet",
      "ops-research": "claude-haiku-4-5"
    }
  },
  "auth": {
    "user": "eric@example.com",
    "sessionTimeout": 3600,
    "mfa": false
  }
}
```

#### Success Criteria

- [ ] Load current config in <300ms
- [ ] Display all settings without truncation
- [ ] Mask sensitive fields (tokens, passwords)
- [ ] Validate config schema in <500ms
- [ ] Show validation errors clearly
- [ ] MVP: Read-only only (no edit buttons, no save)

---

### 3.11 Audit Trail (Immutable Activity Log)

**Purpose:** Complete audit log of all system actions (read-only, immutable).

**Layout:** Full-width log table with filters

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **Audit Log Table** | All audit events: timestamp, actor, action, resource, result | Audit logs from /Users/eric_pharr/.openclaw/workspace/logs/audit/ (JSONL files) | Poll 10s for new files | Load 1000 entries in <1s |
| **Filter Sidebar** | Actor filter (agent name), action filter, result filter (success/fail) | Local state | N/A | Filter in <200ms |
| **Event Details Modal** | Selected event: full JSON, timestamp, actor, action, payload | Audit log file | On selection | Display in <200ms |
| **Export Panel** | Export filtered logs to file (CSV/JSON) | Local state + file download | On click | Export 1000 entries in <1s |

#### Audit Log Entry Schema

```json
{
  "timestamp": "2026-03-24T01:30:10.234Z",
  "actor": "user:eric|agent:ops-builder",
  "action": "agent.pause|agent.resume|cron.run|config.update",
  "resource": "agent:ops-builder|cron:daily-backup",
  "result": "success|error",
  "details": {
    "reason": "Manual trigger",
    "error": null
  }
}
```

#### Success Criteria

- [ ] Load audit logs from JSONL files in <500ms
- [ ] Display 1000 entries with pagination in <1s
- [ ] Filter by actor/action in <200ms
- [ ] Export logs to file in <1s
- [ ] Logs are immutable (read-only display)
- [ ] Keyboard: Ctrl+Shift+L opens Audit Trail, Ctrl+F to search

---

### 3.12 System Health (CPU, Memory, Disk, Docker)

**Purpose:** Real-time system metrics and container status.

**Layout:** Three-panel: metrics gauges (left) + docker container list (center) + service health (right)

#### Panels

| Panel | Content | Data Source | Update Cadence | Success Criteria |
|-------|---------|-------------|----------------|------------------|
| **CPU Gauge** | Current CPU usage %, 1/5/15-min averages, cores | Backend proxy /api/system/metrics | Poll 5s | Update in <500ms |
| **Memory Gauge** | Used/total memory (GB), percentage, swap usage | Backend proxy /api/system/metrics | Poll 5s | Update in <500ms |
| **Disk Gauge** | Used/total disk (GB), percentage, warning at 80%+ | Backend proxy /api/system/metrics | Poll 10s | Update in <500ms |
| **Docker Containers** | List of containers: name, image, status, resource usage | Backend proxy /api/docker/containers | Poll 10s | Load 20 containers in <500ms |
| **Service Health** | Status of: Gateway, Langfuse, Qdrant, Ollama, Docker daemon | Backend proxy /api/health | Poll 10s | Check all services in <500ms |
| **Alerts** | Alert if CPU >80%, Memory >85%, Disk >90%, service down | Computed in frontend | Poll 5s | Alert within 10s of threshold |

#### System Metrics Response

```json
{
  "cpu": {
    "usage": 24.5,
    "cores": 10,
    "avg1": 1.2,
    "avg5": 1.5,
    "avg15": 1.8
  },
  "memory": {
    "used": 16.2,
    "total": 32.0,
    "percent": 50.6,
    "swap": { "used": 0, "total": 8.0 }
  },
  "disk": {
    "used": 450.5,
    "total": 1000.0,
    "percent": 45.0
  }
}
```

#### Docker Container Schema

```json
{
  "id": "abc123def456",
  "name": "qdrant",
  "image": "qdrant/qdrant:latest",
  "status": "running",
  "created": "2026-03-20T12:00:00Z",
  "state": "running|exited|restarting",
  "cpuUsage": 5.2,
  "memoryUsage": { "used": 512, "total": 1024 }
}
```

#### Success Criteria

- [ ] Display all 3 gauges (CPU, memory, disk) in <500ms
- [ ] Gauges update every 5 seconds
- [ ] List 20 docker containers in <500ms
- [ ] Container status updates every 10s
- [ ] Alert fires within 10s of threshold breach
- [ ] All services reachable (health check in <1s)

---

## 4. Resizable Panel Specification

### 4.1 Library: react-resizable-panels

**Version:** 4.2.2 (already installed)  
**Rationale:** Lightweight (~12 KB gzip), already in package.json, full TypeScript support, Tailwind compatible.

### 4.2 Layout Persistence

**Strategy:** localStorage with key pattern `clawcommand-layout-{viewName}`

```typescript
// Persist on resize
<PanelGroup 
  onLayoutChange={(sizes) => {
    localStorage.setItem(
      'clawcommand-layout-factory-floor',
      JSON.stringify(sizes)
    );
  }}
>
  {/* panels */}
</PanelGroup>

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('clawcommand-layout-factory-floor');
  if (saved) {
    // Apply saved layout
    setPanelSizes(JSON.parse(saved));
  }
}, []);
```

### 4.3 Default Layouts Per View

| View | Layout | Panel Sizes | Orientation | Notes |
|------|--------|------------|-------------|-------|
| **Factory Floor** | Sidebar + Main + Drawer | 20% + 65% + 15% | Horizontal | Drawer collapses to 0% when not selected |
| **Agent Command** | Tree + Command + Logs | 25% + 50% + 25% | Horizontal | All visible, resizable |
| **Agent Chat** | History + Input + Sidebar | 100% (stacked) | Vertical | Input fixed at 200px, history fills |
| **Session Center** | List + Timeline + Details | 20% + 50% + 30% | Horizontal | Details collapse when not selected |
| **Budget Control** | Trend + Alerts + Breakdown | 40% + 30% + 30% | Horizontal | All visible by default |
| **Workflow Builder** | Library + Canvas + Properties | 20% + 60% + 20% | Horizontal | Canvas fills, lib/props collapsible |
| **Cron Scheduler** | Jobs + Editor + History | 25% + 50% + 25% | Horizontal | All visible, resizable |
| **Logs** | Viewer + Filters | 80% + 20% | Horizontal | Filters collapsible |
| **Analytics** | Dashboard + Routing + Trending | 33% + 33% + 34% | Horizontal | Three-way split |
| **Settings** | Form + Validation | 70% + 30% | Horizontal | Validation right sidebar |
| **Audit Trail** | Table + Details | 85% + 15% | Horizontal | Details modal (not resizable panel) |
| **System Health** | Gauges + Containers + Health | 25% + 50% + 25% | Horizontal | All visible by default |

### 4.4 Minimum/Maximum Panel Sizes

```typescript
<Panel 
  defaultSize={20}
  minSize={10}        // Never collapse below 10% of container
  maxSize={80}        // Never expand beyond 80% of container
>
  {/* content */}
</Panel>
```

**Global Rules:**
- Minimum panel: 10% of container width/height
- Maximum panel: 80% of container width/height
- Sidebar (left): min 150px (fixed), no max
- Main content: min 200px, max 80%
- Detail drawer: min 150px, collapses to 0px

### 4.5 Collapse Behavior

**Collapsible Panels:**
- Detail drawers (Factory Floor, Session Center, Settings validation)
- Filter sidebars (Logs, Analytics)
- Library panel (Workflow Builder)

**Implementation:**
```typescript
const [isCollapsed, setIsCollapsed] = useState(false);

<Panel defaultSize={20} minSize={isCollapsed ? 0 : 10}>
  {!isCollapsed && <DetailContent />}
</Panel>

// Collapse button
<button onClick={() => setIsCollapsed(!isCollapsed)}>
  {isCollapsed ? 'Expand' : 'Collapse'} (Ctrl+/)
</button>
```

**Keyboard Shortcut:** Ctrl+/ to toggle collapse on focused panel

### 4.6 Mobile Responsive Behavior (Below 768px)

**Stack vertically below 768px width:**

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

<PanelGroup direction={isMobile ? 'vertical' : 'horizontal'}>
  {/* panels stack vertically on mobile */}
</PanelGroup>
```

**Mobile-Specific Changes:**
- Factory Floor: Stack sidebar → main → drawer vertically
- Session Center: Stack list → timeline → details vertically (accordion-style)
- All sidebar panels collapse by default on mobile

**Success Criteria:**
- Horizontal layouts responsive below 768px (not tested in MVP, deferred to Phase 2)
- Touch-friendly collapse/expand buttons (40px+ tap target)
- No horizontal scroll on mobile

---

## 5. WebSocket Gateway Connection

### 5.1 Gateway Device Identity Requirement

**CRITICAL DECISION:** The OpenClaw Gateway requires client authentication via either:

1. **Option A:** Set `gateway.controlUi.allowInsecureAuth: true` in openclaw.json
2. **Option B:** Implement Ed25519 device identity in the backend proxy

### 5.2 Recommendation: Option B (Ed25519 Device Identity)

**Rationale:**
- Option A loosens security (allows any local client)
- Option B is proper security: device-specific identity, cryptographically signed
- Implementation effort: ~50 lines of crypto code
- Long-term approach for production

### 5.3 Ed25519 Device Identity Implementation Spec

#### 5.3.1 Keypair Generation & Persistence

**On first startup of backend proxy:**

1. Check if keypair exists at `~/.openclaw/clawcommand-backend.key`
2. If not, generate Ed25519 keypair:
   ```typescript
   import crypto from 'crypto';

   const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
     privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
     publicKeyEncoding: { format: 'pem', type: 'spki' }
   });

   // Save to file with restricted permissions (0600)
   fs.writeFileSync(
     path.join(os.homedir(), '.openclaw/clawcommand-backend.key'),
     JSON.stringify({ privateKey, publicKey }),
     { mode: 0o600 }
   );
   ```

3. Derive `deviceId` from SHA-256 hash of public key:
   ```typescript
   const deviceId = crypto
     .createHash('sha256')
     .update(publicKey)
     .digest('hex')
     .slice(0, 16);  // Use first 16 chars
   ```

#### 5.3.2 Connect Frame Signing

**When connecting to gateway:**

1. Receive `connect.challenge` event from gateway with `nonce`:
   ```json
   {
     "event": "connect.challenge",
     "nonce": "abc123xyz789..."
   }
   ```

2. Build payload to sign:
   ```typescript
   const payload = {
     deviceId: "abc123xyz789...",    // From public key hash
     clientId: "gateway-client",
     clientMode: "backend",
     role: "operator",
     scopes: ["operator.admin"],
     signedAtMs: Date.now(),
     token: process.env.OPENCLAW_GATEWAY_TOKEN,
     nonce: challenge.nonce
   };
   ```

3. Sign payload with private key:
   ```typescript
   const sign = crypto.createSign('sha256');
   sign.update(JSON.stringify(payload));
   const signature = sign.sign(privateKey, 'hex');
   ```

4. Send connect frame with device identity:
   ```json
   {
     "type": "req",
     "id": "<uuid>",
     "method": "connect",
     "params": {
       "minProtocol": 3,
       "maxProtocol": 3,
       "client": {
         "id": "gateway-client",
         "version": "1.0.0",
         "platform": "node",
         "mode": "backend"
       },
       "role": "operator",
       "scopes": ["operator.admin"],
       "auth": {
         "token": "<OPENCLAW_GATEWAY_TOKEN>",
         "deviceSignature": "<signature>",
         "devicePublicKey": "<public-key-pem>",
         "deviceId": "<device-id>"
       }
     }
   }
   ```

#### 5.3.3 Auto-Pairing on First Local Connection

**Gateway behavior (provided by gateway, no action needed):**
- On first local connection, gateway silently pairs the device identity
- No user approval required for local clients
- Device ID is stored and trusted for future connections
- Remote connections still require explicit pairing approval

### 5.4 Implementation Path

**Phase 1 (Immediate):** Unblock dev by setting `gateway.controlUi.allowInsecureAuth: true`

```json
{
  "gateway": {
    "controlUi": {
      "allowInsecureAuth": true
    }
  }
}
```

**Phase 2 (Before Production):** Implement Ed25519 signing in `server/src/gateway-proxy.ts`

```typescript
// File: server/src/gateway-proxy.ts

import crypto from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';

class DeviceIdentity {
  private privateKey: string;
  private publicKey: string;
  private deviceId: string;

  static load(): DeviceIdentity {
    const keyPath = path.join(os.homedir(), '.openclaw', 'clawcommand-backend.key');
    
    if (!fs.existsSync(keyPath)) {
      return DeviceIdentity.generate();
    }

    const data = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
    const instance = new DeviceIdentity();
    instance.privateKey = data.privateKey;
    instance.publicKey = data.publicKey;
    instance.deviceId = DeviceIdentity.deriveDeviceId(data.publicKey);
    return instance;
  }

  static generate(): DeviceIdentity {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
      privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
      publicKeyEncoding: { format: 'pem', type: 'spki' }
    });

    const keyPath = path.join(os.homedir(), '.openclaw', 'clawcommand-backend.key');
    fs.mkdirSync(path.dirname(keyPath), { recursive: true });
    fs.writeFileSync(keyPath, JSON.stringify({ privateKey, publicKey }), { mode: 0o600 });

    const instance = new DeviceIdentity();
    instance.privateKey = privateKey;
    instance.publicKey = publicKey;
    instance.deviceId = DeviceIdentity.deriveDeviceId(publicKey);
    return instance;
  }

  static deriveDeviceId(publicKey: string): string {
    return crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .slice(0, 16);
  }

  sign(payload: Record<string, any>): string {
    const sign = crypto.createSign('sha256');
    sign.update(JSON.stringify(payload));
    return sign.sign(this.privateKey, 'hex');
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getPublicKey(): string {
    return this.publicKey;
  }
}

// In WebSocket connection handler:
const deviceIdentity = DeviceIdentity.load();

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.event === 'connect.challenge') {
    const payload = {
      deviceId: deviceIdentity.getDeviceId(),
      clientId: 'gateway-client',
      clientMode: 'backend',
      role: 'operator',
      scopes: ['operator.admin'],
      signedAtMs: Date.now(),
      token: process.env.OPENCLAW_GATEWAY_TOKEN || '',
      nonce: msg.nonce
    };

    const signature = deviceIdentity.sign(payload);

    ws.send(JSON.stringify({
      type: 'req',
      id: generateUUID(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'gateway-client',
          version: '1.0.0',
          platform: 'node',
          mode: 'backend'
        },
        role: 'operator',
        scopes: ['operator.admin'],
        auth: {
          token: process.env.OPENCLAW_GATEWAY_TOKEN || '',
          deviceSignature: signature,
          devicePublicKey: deviceIdentity.getPublicKey(),
          deviceId: deviceIdentity.getDeviceId()
        }
      }
    }));
  }
});
```

### 5.5 Testing Device Identity

**Manual test in backend console:**

```bash
# Test Ed25519 key generation
node -e "
  const crypto = require('crypto');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' }
  });
  
  const sign = crypto.createSign('sha256');
  sign.update(JSON.stringify({ test: 'payload', nonce: 'abc123' }));
  const sig = sign.sign(privateKey, 'hex');
  
  console.log('Signature (first 50 chars):', sig.slice(0, 50));
"
```

---

## 6. Agent Roster

All 16 core agents are visible in the Factory Floor. Each agent card shows:

| Field | Type | Source | Example |
|-------|------|--------|---------|
| **Name** | string | AGENTS.md | "main" (Zara), "ops-builder" |
| **Status** | enum | WebSocket event (agent.status) | active, idle, deferred, blocked |
| **Risk Class** | enum | AGENTS.md | low, medium, high, critical |
| **Last Activity** | timestamp | WebSocket event + local cache | "2 min ago" |
| **Current Task** | string | WebSocket event (agent.task) | "Building task #123" or null |
| **Owning Topic** | number | AGENTS.md | 85 (BodyPulse), 208 (Architecture) |

### 6.1 Agent Roster (Complete List)

| # | Name | Owning Domain | Role | Risk Class | Status | Check-in |
|---|------|---|---|---|---|---|
| 1 | **main** (Zara) | Topic 208 | Personal assistant, governance coordination | MEDIUM | PLATFORM STANDARD | Per-turn |
| 2 | **ops-runtime** | Topic 208 | System management, runtime control | HIGH | APPROVED WITH GATING | Pre-deployment |
| 3 | **ops-critic** | Topic 85 | Code review, quality assessment | LOW | PLATFORM STANDARD | Per-task |
| 4 | **ops-triage** | Topic 1 | Intake triage, urgency classification | MEDIUM | PLATFORM STANDARD | Per-item |
| 5 | **ops-validator** | Topic 85 | Build/test validation, test execution | LOW | PLATFORM STANDARD | Post-build |
| 6 | **ops-research** | Topic 85 | Research, knowledge synthesis | LOW | PLATFORM STANDARD | Per-task |
| 7 | **ops-builder** | Topic 85 | Build automation, deployment prep | MEDIUM | APPROVED WITH GATING | Pre-release |
| 8 | **ops-release** | Topic 85 | Deployment execution, release validation | HIGH | APPROVED WITH GATING | Pre/post-deploy |
| 9 | **ops-qa** | Topic 85 | QA testing, test plan execution | LOW | PLATFORM STANDARD | Per-test-cycle |
| 10 | **ops-content** | Topic 85 | Content generation, draft creation | MEDIUM | APPROVED WITH GATING | Pre-publish |
| 11 | **ops-sentiment** | Topic 85 | Sentiment analysis, signal detection | LOW | PLATFORM STANDARD | Per-analysis |
| 12 | **ops-trends** | Topic 85 | Trend analysis, metrics extraction | LOW | PLATFORM STANDARD | Per-reporting |
| 13 | **ops-sentinel** | Topic 208 | Monitoring/alerting, threshold tuning | HIGH | DEFERRED | Post-tuning |
| 14 | **ops-outreach** | — | External communication, outbound messaging | CRITICAL | DEFERRED | Pre-send |
| 15 | **ops-cashflow** | — | Financial operations, transactions | CRITICAL | DEFERRED | Pre-transaction |
| 16 | **ops-synthesizer** | Topic 85 | Synthesis, aggregation, summaries | LOW | PLATFORM STANDARD | Per-synthesis |

### 6.2 Agent Card Component Spec

```tsx
<AgentCard
  name="ops-builder"
  status="active"
  riskClass="medium"
  lastActivity="2 min ago"
  currentTask="Building task #123"
  owningTopic={85}
  model="claude-3-5-sonnet"
  sessionCount={3}
  onClick={() => openDetailDrawer('ops-builder')}
/>
```

**Visual Design:**
- Card size: 160px × 120px (minimum)
- Status indicator: colored dot (green/blue/gray/red)
- Risk badge: top-right corner with icon
- Task text: truncated with ellipsis if >50 chars
- Hover: expand to show full details, cursor becomes pointer

---

## 7. Success Criteria (Per-Panel)

| View | Panel | Success Criteria |
|------|-------|------------------|
| **Factory Floor** | Agent Grid | All 16 agents visible in <2s; status updates <200ms |
| | System Health | CPU, Memory, Disk, Gateway status update every 5s |
| | Detail Drawer | Opens without blocking grid; keyboard nav works |
| **Agent Command** | Agent Tree | Find any agent in <300ms; keyboard nav works |
| | Command Panel | Actions execute in <1s (pause/resume/reload) |
| | Permissions | All scopes visible; no truncation |
| | Activity Log | Load 10 activities in <500ms |
| **Agent Chat** | Conversation | New messages appear in <200ms (optimistic) |
| | Session Picker | Load 50+ sessions in <1s |
| | Token Meter | Update real-time as tokens are used |
| | Input | Send on Enter; Abort button stops message |
| **Session Center** | Session List | Load 100 sessions in <1s; filter works |
| | Waterfall | Load and render events in <500ms |
| | Event Details | Display event JSON in <300ms |
| | Aggregates | Compute tokens/cost in <500ms |
| **Budget Control** | Trend Chart | Display 30 days in <500ms; forecast accurate ±5% |
| | Alerts | Fire within 10s of threshold |
| | Model Breakdown | Group by model/provider correctly |
| **Workflow Builder** | Canvas | Render 20-node DAG in <1s |
| | Validation | Detect cycles/missing inputs in <500ms |
| **Cron Scheduler** | Job List | Load 100 jobs in <500ms |
| | Schedule Editor | Parse cron, show next 5 runs in <200ms |
| | Run History | Load 50 runs in <300ms |
| **Logs** | Log Viewer | Tail 100+ lines/sec; no lag |
| | Filters | Filter by severity in <100ms |
| **Analytics** | Dashboard | Display aggregates in <500ms |
| | Model Routing | Load 10+ models in <300ms |
| | Trend Chart | Render 7 days in <500ms |
| **Settings** | Config Display | Load config in <300ms; mask sensitive data |
| **Audit Trail** | Log Table | Load 1000 entries with pagination in <1s |
| | Filters | Filter by actor/action in <200ms |
| **System Health** | Gauges | Update CPU/Memory/Disk every 5s |
| | Containers | Load 20 containers in <500ms |
| | Service Health | Check all services in <500ms |

---

## 8. Non-Goals

ClawCommand does **NOT**:

1. **Execute agents directly** — ClawCommand is read-only dashboard + chat interface. No agent spawning or orchestration logic.
2. **Mutate config files** — Settings panel is read-only. No save/apply buttons. Config changes only via CLI or direct file edit.
3. **Manage secrets** — Token management, key rotation, secret provisioning handled outside ClawCommand. Dashboard shows masked tokens only.
4. **Support multi-user RBAC** — Single-owner dashboard (Eric profile only). No user roles, permissions, or access control.
5. **Mobile parity** — Desktop-first (Mac Studio). Mobile responsive deferred to Phase 2.
6. **Visual workflow editor with drag/drop** — Workflow Builder is read-only in MVP. Node dragging/edge creation deferred to Phase 2.
7. **Real-time system profiling** — No CPU/memory profiling per agent or process. System Health shows aggregate metrics only.
8. **External API integrations** — No Slack bots, email notifications, webhook callbacks. Notifications only within ClawCommand UI.
9. **Governance voting or approval workflows** — No decision-making UI. All governance decisions made in Topic 208 (Telegram).
10. **Agent training or fine-tuning** — No model upload, LoRA management, or training interface.

---

## 9. Technical Constraints

### 9.1 Frontend Stack

| Constraint | Requirement | Rationale |
|-----------|-------------|-----------|
| **React Version** | 19+ with TypeScript strict mode | Latest React, full type safety |
| **CSS Framework** | Tailwind CSS v3.4.19, dark mode default | Already installed, consistent design |
| **Build Tool** | Vite (current config) | Fast build, HMR, ES modules |
| **Package Manager** | pnpm (current) | Faster installs, workspace-friendly |
| **Module Format** | ES modules only (no CommonJS) | Modern standards, tree-shaking |

### 9.2 Bundle Size & Performance

| Metric | Target | Justification |
|--------|--------|---------------|
| **Total bundle (gzipped)** | <500 KB | Single-page app, must load in <2s |
| **JavaScript** | <300 KB | React (43KB) + DOM (37KB) + libs (200KB) + app (20KB) |
| **CSS** | <50 KB | Tailwind minified + custom theme |
| **Initial Paint** | <1s | Lazy-load non-critical panels (Workflow Builder, Audit Trail) |
| **Time to Interactive** | <2s | WebSocket connection in parallel with render |

### 9.3 Dependencies (Approved)

| Package | Version | Gzip Size | Status | Notes |
|---------|---------|-----------|--------|-------|
| react | 19.2.0 | 43 KB | ✓ Installed | Core framework |
| react-dom | 19.2.0 | 37 KB | ✓ Installed | DOM rendering |
| zustand | 5.0.12 | 2.5 KB | ✓ Installed | State management |
| react-resizable-panels | 4.2.2 | 12 KB | ✓ Installed | Resizable layouts |
| tailwindcss | 3.4.19 | 50 KB | ✓ Installed | CSS framework |
| @radix-ui/core | Latest | 2 KB each | ✓ Installed | Accessible components |
| recharts | 2.15.4 | 60 KB | ✓ Installed | Charts (if used) |

**New Dependencies (NOT approved):**
- ❌ Redux, Redux Toolkit (use Zustand instead)
- ❌ Material-UI, Chakra UI (use Tailwind + Radix instead)
- ❌ D3.js, Plotly.js (use Recharts instead)
- ❌ Socket.io, ws (use native WebSocket API)

### 9.4 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

### 9.5 Data Flow Architecture

```
┌─────────────────┐
│  React UI       │
│  (Browser)      │
└────────┬────────┘
         │
         │ HTTP REST + WebSocket
         ▼
┌─────────────────────────────────┐
│  Backend Proxy (Express)        │
│  http://127.0.0.1:8000         │
└─┬─────────────────────────────┬─┘
  │                             │
  │ HTTP REST                   │ WebSocket
  ▼                             ▼
┌──────────────────┐  ┌────────────────────────┐
│ Local Services   │  │  OpenClaw Gateway      │
├──────────────────┤  │  ws://127.0.0.1:18789  │
│ Langfuse:3000   │  │                        │
│ Qdrant:6333     │  │ (Agent control, chat,  │
│ Ollama:11434    │  │  cron RPC, logs)       │
│ Docker daemon   │  └────────────────────────┘
│ System metrics  │
└──────────────────┘
```

**Rules:**
- Frontend always goes through backend proxy (except Qdrant direct, if needed)
- Backend proxy handles auth, rate limiting, timeouts
- WebSocket upgraded via `/api/gateway` endpoint
- All data serialized as JSON
- No direct frontend-to-service connections

---

## 10. Implementation Roadmap (Track D)

### Phase 1: Foundation (Week 1-2)

**Deliverables:**
- Base layout with react-resizable-panels
- Sidebar navigation (links to all views)
- WebSocket connection to Gateway
- Agent status grid (mock data, no real events)
- System health badges (polling /api/system/metrics)

**Acceptance Criteria:**
- React app builds with Vite
- Layout renders without console errors
- Agent grid displays 16 agents with status colors
- System health badges update every 5 seconds

### Phase 2: Real-Time Updates (Week 3-4)

**Deliverables:**
- WebSocket event subscription (agent.status, session.*, cron.*)
- Agent status grid updates on events
- Session list and drill-down view
- Chat interface with gateway RPC
- Token meter (real-time update)

**Acceptance Criteria:**
- Agent status updates <200ms on WebSocket event
- Session list loads in <1s
- Chat messages send/receive in <500ms
- Token count updates live as session runs

### Phase 3: Dashboard Panels (Week 5-6)

**Deliverables:**
- Budget Control (cost trend, alerts)
- Workflow Builder (read-only DAG view)
- Cron Scheduler (job list, manual trigger)
- Analytics (metrics dashboard, model routing)
- System Health (gauges, docker containers)

**Acceptance Criteria:**
- All panels load data in <500ms
- Charts render 30+ days of data smoothly
- Cron job manual trigger works in <1s

### Phase 4: Polish & Edge Cases (Week 7+)

**Deliverables:**
- Logs panel with live tail
- Audit Trail (file-based JSONL read)
- Settings panel (read-only config display)
- Keyboard navigation (Ctrl+K command palette, arrow keys)
- Error handling and reconnection logic

**Acceptance Criteria:**
- All 12 views functional and tested
- No console errors or unhandled exceptions
- Bundle size <500 KB gzipped
- Offline fallback (graceful disconnection message)

---

## 11. Appendices

### A. WebSocket Message Examples

#### 11.A.1 Connect Frame (with device identity)

```json
{
  "type": "req",
  "id": "req-1234-5678",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "gateway-client",
      "version": "1.0.0",
      "platform": "node",
      "mode": "backend"
    },
    "role": "operator",
    "scopes": ["operator.admin"],
    "auth": {
      "token": "sk-...",
      "deviceSignature": "abc123xyz789...",
      "devicePublicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "deviceId": "abc123xyz789abc1"
    }
  }
}
```

#### 11.A.2 Chat Send RPC

```json
{
  "type": "req",
  "id": "req-chat-123",
  "method": "chat.send",
  "params": {
    "sessionKey": "default",
    "text": "What is the status of ops-builder?",
    "idempotencyKey": "msg-xyz-123"
  }
}
```

#### 11.A.3 Event Stream (Agent Status Update)

```json
{
  "type": "event",
  "id": "evt-status-456",
  "timestamp": "2026-03-24T01:30:00Z",
  "event": "agent.status",
  "agent": "ops-builder",
  "data": {
    "status": "active",
    "sessionCount": 3,
    "lastHeartbeat": "2026-03-24T01:30:00Z",
    "currentTask": "Building task #123"
  }
}
```

### B. Environment Variables

```bash
# Backend proxy (.env file)
OPENCLAW_GATEWAY_TOKEN=sk-...                # From ~.openclaw/openclaw.json
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789    # Local gateway
LANGFUSE_URL=http://localhost:3000
LANGFUSE_SECRET=...                          # If required
QDRANT_URL=http://localhost:6333
OLLAMA_URL=http://127.0.0.1:11434
DOCKER_HOST=unix:///var/run/docker.sock      # macOS default
NODE_ENV=production
PORT=8000                                     # Backend proxy listen port
```

### C. File Structure

```
ClawCommand/
├── app/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FactoryFloor.tsx
│   │   │   ├── AgentCommand.tsx
│   │   │   ├── AgentChat.tsx
│   │   │   ├── SessionCenter.tsx
│   │   │   ├── BudgetControl.tsx
│   │   │   ├── WorkflowBuilder.tsx
│   │   │   ├── CronScheduler.tsx
│   │   │   ├── Logs.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── AuditTrail.tsx
│   │   │   └── SystemHealth.tsx
│   │   ├── hooks/
│   │   │   ├── useGateway.ts
│   │   │   ├── useSystemMetrics.ts
│   │   │   └── usePanelLayout.ts
│   │   ├── store/
│   │   │   ├── agent.ts        # Zustand agent state
│   │   │   ├── session.ts      # Zustand session state
│   │   │   └── ui.ts           # UI state (selected agent, etc.)
│   │   ├── lib/
│   │   │   ├── gateway.ts      # GatewayClient class
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── server/                       # Backend proxy
│   ├── src/
│   │   ├── index.ts
│   │   ├── gateway-proxy.ts     # WebSocket gateway proxy (device identity here)
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   ├── system.ts        # /api/system/metrics
│   │   │   ├── docker.ts        # /api/docker/*
│   │   │   ├── cron.ts          # /api/cron/*
│   │   │   ├── github.ts        # /api/github/*
│   │   │   ├── qdrant.ts        # /api/qdrant/*
│   │   │   └── langfuse.ts      # /api/langfuse/*
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── errorHandler.ts
│   │       └── logging.ts
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── docs/
│   ├── PRD.md                   # This document
│   ├── RESEARCH-FINDINGS.md
│   ├── TRIAGE-REPORT.md
│   └── ...
└── README.md
```

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Factory Floor** | Main dashboard view showing all 16 agents and system health |
| **Agent Card** | Individual widget representing one agent (status, task, heartbeat) |
| **Detail Drawer** | Right-side panel showing expanded details for selected item |
| **WebSocket Event** | Push message from Gateway (e.g., agent.status, session.created) |
| **Session** | One execution context for an agent (with start/end, tokens, events) |
| **Waterfall** | Chronological timeline of events in a session (LLM calls, tool calls, errors) |
| **Langfuse** | Observability platform tracking LLM calls, costs, durations |
| **Qdrant** | Vector database for embeddings and collections |
| **Ollama** | Local LLM runtime (alternative to cloud models) |
| **Device Identity** | Ed25519 keypair for secure backend authentication to Gateway |
| **Backend Proxy** | Express server unifying HTTP access to all local services |
| **Optimistic Update** | UI updates immediately before server confirmation (reverts on error) |

---

## 13. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-24 | ops-synthesizer | Initial PRD synthesis from Track A research + Track B triage |

---

**PRD READY FOR TRACK D BUILD**

This document is the source of truth for ClawCommand implementation. Track D (ops-builder) should reference this PRD for all requirements, panel specifications, data sources, and success criteria.

**Key Decisions Locked:**
1. react-resizable-panels for layout (already installed)
2. Event-driven WebSocket architecture (no polling)
3. Backend proxy pattern (unified HTTP + WS)
4. Option B device identity (Ed25519 signing)
5. 12 views with per-panel success criteria
6. <500 KB bundle size target
7. Dark mode by default (Tailwind)
8. React 19 + TypeScript strict mode

**Next Step:** ops-builder begins Phase 1 implementation.
