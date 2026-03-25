# Mission Control Hybrid Sprint (2026-02-26)

## Shipped

### 1) Runtime adapter feeds for top 3 views
- **Agents page** now loads from runtime adapters first, then safe fallback:
  - `window.__CLAWCOMMAND_RUNTIME__.agents`
  - `localStorage:clawcommand.runtime.agents`
  - fallback `mockAgents`
- **Sessions page** adapter path:
  - `window.__CLAWCOMMAND_RUNTIME__.sessions`
  - `localStorage:clawcommand.runtime.sessions`
  - fallback `mockSessions`
- **Cron page** adapter path:
  - `window.__CLAWCOMMAND_RUNTIME__.cronJobs`
  - `localStorage:clawcommand.runtime.cron`
  - fallback `mockCronJobs`
- All three show **Live vs Fallback** status badges and adapter source path.

### 2) Real operator actions with confirmation + audit
Implemented actions with confirmation gates and audit logging:
- `start`
- `stop`
- `retry`
- `kill`
- `escalate`

Audit behavior:
- Stored in `localStorage:clawcommand.audit.actions`
- Keeps rolling last 200 entries
- Includes target type/id, action, timestamp, source, actor, payload preview

Runtime execution:
- If `VITE_RUNTIME_ACTION_ENDPOINT` is set, action posts to endpoint
- If not set, action still writes local audit entry and updates UI state

### 3) Observability cards wired to real stores/logs where available
- Agents view now shows cards from adapter paths:
  - interaction total messages
  - active sessions
  - errors in the last hour
  - diagnostics adapter health
- Sources:
  - `window.__CLAWCOMMAND_RUNTIME__.interactionStats`
  - `localStorage:clawcommand.interaction.stats`
  - `window.__CLAWCOMMAND_RUNTIME__.diagnostics`
  - `localStorage:clawcommand.runtime.diagnostics`

### 4) Governance baseline
- Action audit trail implemented and visible in UI (recent entries).
- Redaction checks applied to surfaced payloads via shared sanitizer.
- Session outbound message content is sanitized before append/send.
- Cron payload display is sanitized before rendering.

## Demo runbook

### Setup live adapter quickly
In browser console:

```js
window.__CLAWCOMMAND_RUNTIME__ = {
  agents: [{ ...window.__CLAWCOMMAND_RUNTIME__?.agents?.[0] }],
  sessions: [{ ...window.__CLAWCOMMAND_RUNTIME__?.sessions?.[0] }],
  cronJobs: [{ ...window.__CLAWCOMMAND_RUNTIME__?.cronJobs?.[0] }],
  interactionStats: { totalMessages: 1220, activeSessions: 9, errorsLastHour: 1 },
  diagnostics: { adapterHealth: 'ok', lastSyncAt: new Date().toISOString() }
}
location.reload()
```

Or localStorage mode:

```js
localStorage.setItem('clawcommand.runtime.agents', JSON.stringify([]))
localStorage.setItem('clawcommand.runtime.sessions', JSON.stringify([]))
localStorage.setItem('clawcommand.runtime.cron', JSON.stringify([]))
localStorage.setItem('clawcommand.interaction.stats', JSON.stringify({ totalMessages: 1, activeSessions: 1, errorsLastHour: 0 }))
localStorage.setItem('clawcommand.runtime.diagnostics', JSON.stringify({ adapterHealth: 'degraded', lastSyncAt: new Date().toISOString() }))
location.reload()
```

### Verify operator controls
1. Open Agents page, pick an agent.
2. Run `start`, `retry`, `escalate`, `stop`, `kill` with confirmations.
3. Open browser console and inspect:
   - `JSON.parse(localStorage.getItem('clawcommand.audit.actions'))`
4. Confirm payload previews are redacted in the audit entry.

## Notes
- Endpoint integration is ready via `VITE_RUNTIME_ACTION_ENDPOINT`.
- UI remains resilient without endpoint or runtime adapters by using safe fallback data.
