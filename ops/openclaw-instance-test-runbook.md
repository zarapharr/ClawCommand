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

```bash
VITE_OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789 \
VITE_DISABLE_MOCK_FALLBACK=1 \
npm run dev
```

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

- Agent action methods (`agents.start|stop|retry`) depend on runtime support. Unsupported methods return failed receipts and are surfaced in UI.
- Subagent stream event names vary by gateway build. Current client handles `subagents.update` plus fallback polling.
- Chat streaming granularity depends on gateway event payload availability.

## 8) Exit criteria

Prod-readiness pass is complete when:
- Tests pass
- Build passes
- Gateway-contract pages (Agents, Swarm, Factory Floor, Chat, Memory) work against live gateway
- Fallback behavior is explicit and recoverable
