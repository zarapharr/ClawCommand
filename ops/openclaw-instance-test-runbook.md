# OpenClaw Instance MVP Test Runbook

This runbook validates ClawCommand against a live OpenClaw Gateway (real RPC contracts, no assumed REST endpoints).

## 1) Prerequisites

```bash
cd /home/eric_pharr/.openclaw/workspace/ClawCommand/app
npm install
```

Expected output:
- Install completes without npm errors.

## 2) Start and verify OpenClaw Gateway

```bash
openclaw gateway status
```

If not running:

```bash
openclaw gateway start
openclaw gateway status
```

Expected output:
- `Runtime: running`
- `RPC probe: ok`
- Gateway listening on `ws://127.0.0.1:18789` (or your configured URL).

## 3) Unit + Integration Test Pass

```bash
npm run test
```

Expected output:
- `runtime-adapters.test.ts` passes.
- `runtime-webhook.test.ts` passes.
- Vitest exits with `0 failed`.

## 3) Build Validation

```bash
npm run build
```

Expected output:
- TypeScript build succeeds.
- Vite build succeeds and prints `dist/` bundle summary.

## 5) Runtime Smoke Test (live Gateway wiring)

```bash
VITE_OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789 \
VITE_DISABLE_MOCK_FALLBACK=1 \
npm run dev
```

Expected output in UI:
- Agents page loads from `agents.list` and `sessions.list`.
- Models page loads from `models.list`.
- Memory page loads from `agents.files.list` / `agents.files.get`.
- Agent Chat loads sessions and history from `sessions.list` + `chat.history`, send uses `chat.send`.
- Factory Floor and Agent Swarm use live sessions/agents data, no static REST mocks.

If Gateway is unreachable or auth fails:
- UI shows explicit errors with required fix (start gateway, set token/password env).

## 5) Ledger Endpoint Smoke Test (optional local mock)

Start a local mock ledger endpoint in another terminal:

```bash
node -e "
const http = require('http');
let snapshot = { audit: [], decisions: [], adapterHealth: 'ok', lastSyncAt: new Date().toISOString() };
http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/ledger') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify(snapshot));
  }
  if (req.method === 'POST' && req.url === '/ledger') {
    let body='';
    req.on('data', c => body += c);
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');
      if (parsed.kind === 'audit') snapshot.audit = [parsed.entry, ...snapshot.audit].slice(0, 10);
      if (parsed.kind === 'decision') snapshot.decisions = [parsed.entry, ...snapshot.decisions].slice(0, 10);
      snapshot.lastSyncAt = new Date().toISOString();
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(7788, () => console.log('ledger mock listening on :7788'));
"
```

Then run app with endpoint:

```bash
VITE_RUNTIME_LEDGER_ENDPOINT=http://localhost:7788/ledger npm run dev
```

Expected output in UI:
- Diagnostics adapter health moves to healthy/ok after reconciliation.
- Operator actions append local receipt and persist to mock ledger.

## 6) Webhook Contract Validation (test-only)

The webhook verification contract is validated via Vitest (`runtime-webhook.test.ts`) and checks:
- Bearer auth and signature validation.
- Malformed payload handling (`400`).
- Retry/idempotency handling with repeated event IDs (`202 duplicate`).

## 7) Exit Criteria

MVP readiness for this pass is met when:
- Tests pass.
- Build passes.
- Degraded behavior is explicit when runtime endpoints are unavailable.
- Ledger and action flow are validated through integration tests and optional local smoke test.
