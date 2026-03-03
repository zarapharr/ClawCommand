# OpenClaw Instance Prod-Readiness Runbook

This runbook validates ClawCommand against a live OpenClaw Gateway using current RPC contracts, action matrix wiring, and live update behavior.

## 1) Prerequisites

```bash
cd /home/eric_pharr/.openclaw/workspace/ClawCommand/app
npm install
```

## 2) Start + verify OpenClaw Gateway

```bash
openclaw gateway status
openclaw gateway start   # only if not running
openclaw gateway status
```

Expected:
- Gateway running
- RPC probe OK
- WS endpoint available (default `ws://127.0.0.1:18789`)

## 3) Contract + integration tests

```bash
npm run test
```

Must pass:
- `openclaw-api.test.ts` (gateway connect challenge + schema guards + action matrix)
- `runtime-adapters.test.ts`
- `runtime-webhook.test.ts`
- mapper/unit tests

## 4) Build validation

```bash
npm run build
```

Must pass TypeScript and Vite build.

## 5) Live runtime smoke test

Use the local bridge path first, this is the most reliable path when direct browser WS is constrained:

```bash
VITE_OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789 \
VITE_DISABLE_MOCK_FALLBACK=1 \
npm run dev
```

The Vite bridge endpoint (`POST /ocapi/call`) executes `openclaw gateway call ...` locally and is attempted before direct WS RPC.

Validate in UI:
- Agent Command loads `agents.list`, `sessions.list`, and action buttons call mapped runtime operations.
- Agent Swarm buttons map to session action matrix:
  - Start/Retry -> `sessions.reset`
  - Stop/Kill -> `chat.abort`
  - Escalate -> `sessions.reset` with escalate payload
- Factory Floor graph is derived from runtime sessions + message counts, not static fixtures.
- Agent Chat shows history from `chat.history`, sends through `chat.send`, and updates via live subscription with polling fallback.
- Memory Explorer supports agent scope switch and reads via `agents.files.list` / `agents.files.get`.

## 6) Live update behavior

Unplug gateway (or stop it) while UI is open:

```bash
openclaw gateway stop
```

Expected:
- Live state shifts to fallback polling.
- Existing pages remain functional with explicit degraded/offline state.

Restart gateway:

```bash
openclaw gateway start
```

Expected:
- UI reconnects and resumes live updates.

## 7) Known limitations (current)

- This gateway build does not expose `agents.start|agents.stop|agents.retry|subagents.list|subagents.kill|subagents.steer`.
  - Workaround: use session-level actions (`sessions.reset`, `chat.abort`) in Swarm, or run CLI actions directly.
  - Agent Command now returns explicit failed receipts instead of silent no-op.
- Subagent live topology falls back to session-derived activity when `subagents.list` is unavailable.
- Chat streaming granularity depends on gateway event payload availability.

## 8) Exit criteria

Prod-readiness pass is complete when:
- Tests pass
- Build passes
- Gateway-contract pages (Agents, Swarm, Factory Floor, Chat, Memory) work against live gateway
- Fallback behavior is explicit and recoverable

## 9) Eric review checklist (immediate)

From `app/`:

1. `npm test`
2. `npm run build`
3. `openclaw gateway status` (must show `RPC probe: ok`)
4. `npm run dev`
5. In browser, verify:
   - Agent Command: pick an agent, click Start, confirm receipt explains unsupported method.
   - Agent Swarm: pick a session, click Start then Stop, confirm success receipts.
   - Factory Floor: confirm node count and session edges update after Refresh.
   - Agent Chat: open a session, send a message, verify message appears and history reloads.
   - Memory: switch agent scope, open `.md` file, content renders read-only.
6. Optional outage drill: `openclaw gateway stop`, verify pages enter fallback state, then `openclaw gateway start` and refresh.

