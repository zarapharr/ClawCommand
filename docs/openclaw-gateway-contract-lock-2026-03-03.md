# OpenClaw Gateway Contract Lock (2026-03-03)

Validated in this pass by runtime probe + integration tests.

## Connect handshake (v3)

- Transport: WebSocket
- Connect flow accepts challenge events:
  1. optional `event: connect.challenge`
  2. `req: connect`
  3. `res: { ok: true, payload: { protocol: 3 } }`

Client params now pinned to:
- `minProtocol: 3`, `maxProtocol: 3`
- `client.id: gateway-client`
- `role: operator`
- `scopes: ['operator.admin']`

## Method contracts currently wired

### Confirmed available on this exact OpenClaw instance

- `agents.list` -> `{ agents: AgentLike[] }`
- `sessions.list` -> `{ sessions: SessionLike[] }` with params `{ includeUnknown: true, limit: 120 }`
- `models.list` -> `{ models: {id, provider?}[] }`
- `health` -> `{ ok?: boolean }`
- `chat.history` -> `{ messages: MessageLike[] }` with params `{ sessionKey, limit: 200 }`
- `chat.send` -> ack payload with params `{ sessionKey, message, deliver, idempotencyKey }`
- `chat.abort` -> session stop/kill path
- `sessions.reset` -> session start/retry/escalate path
- `agents.files.list` -> `{ workspace?, files[] }`
- `agents.files.get` -> `{ file? }`

### Confirmed unavailable on this exact OpenClaw instance

- `subagents.list`
- `agents.start`
- `agents.stop`
- `agents.retry`
- `subagents.kill`
- `subagents.steer`

UI behavior now hard-fails these with explicit operator receipts and workaround guidance.

## Guardrails in code

- Zod schemas in `app/src/lib/openclaw-contract.ts`
- Schema mismatch returns API error (`*.schema mismatch`) instead of unsafe casts
- Centralized action matrix for Agent + Swarm pages

## Validation references

- `app/src/lib/openclaw-api.test.ts`
- `ops/openclaw-instance-test-runbook.md`
