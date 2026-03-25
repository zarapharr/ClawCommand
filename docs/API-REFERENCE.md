# ClawCommand API Reference (DOC-002)

Last Updated: 2026-03-10

This document captures the runtime API contract ClawCommand consumes.

## Base Configuration
- `VITE_OPENCLAW_API_URL`
- `VITE_WEBSOCKET_URL`

## HTTP Endpoints

### Runtime Status
- `GET /api/runtime/status`
- Used by: Factory Floor, Agent Swarm, runtime status surfaces
- Response highlights:
  - sessions[]
  - agents[]
  - health indicators

### Sessions
- `GET /api/sessions`
- `GET /api/sessions/:sessionKey/messages`
- `POST /api/sessions/:sessionKey/send`
- Used by: Agent Chat

### Agent Operations
- `GET /api/agents`
- `POST /api/agents`
- `PUT /api/agents/:id`
- `DELETE /api/agents/:id`
- Used by: Agents, Factory Floor config edit flows

### Runtime Actions
- `POST /api/runtime/actions`
- Request shape:
```json
{
  "targetType": "session",
  "targetId": "session-key",
  "action": "start"
}
```
- Supported actions in UI: `start`, `stop`, `retry`, `kill`, `escalate`
- Used by: Agent Swarm

## WebSocket Events
Expected event categories consumed in app:
- `tick`
- `chat`
- `subagents`

Event usage:
- `tick`: refreshes status/session aggregates
- `chat`: refreshes active session messages
- `subagents`: refreshes swarm status surfaces

## Frontend Adapter Layer
Primary files:
- `app/src/lib/openclaw-api.ts`
- `app/src/lib/openclaw-contract.ts`
- `app/src/lib/runtime-adapters.ts`
- `app/src/lib/openclaw-mappers.ts`

Responsibilities:
- Contract coercion
- Safe defaults and null guards
- Domain mapping for page stores/components

## Error Handling Contract
All adapter calls normalize to:
```ts
{ ok: true, data: T }
{ ok: false, error: string }
```

UI behavior expectation:
- Show non-blocking inline error copy where possible.
- Preserve last known-good state when feed updates fail.

## Validation
Run:
```bash
npm test -- --run
```

Key API contract tests:
- `src/lib/openclaw-contract.test.ts`
- `src/lib/openclaw-api.test.ts`
- `src/lib/runtime-adapters.test.ts`
