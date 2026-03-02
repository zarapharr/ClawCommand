# Overnight Production-Readiness Update (2026-03-02)

## Shipped Scope
- Reworked runtime adapter feed contract to include health, stale, freshness, and last-sync metadata.
- Added production guard for mock fallback. In production mode (or when `VITE_DISABLE_MOCK_FALLBACK=1`), empty feeds are returned instead of mock datasets.
- Added polling runtime hook (`useRuntimeFeed`) for adapter-driven refresh.
- Added explicit runtime status bar with loading/error/fresh-stale/degraded indicators.
- Added health and connection status panel for Agents, Sessions, and Cron pages.
- Added action receipt ledger panel with command IDs and success/failed status.
- Added server-canonical reconciliation for action receipts + decision log through `VITE_RUNTIME_LEDGER_ENDPOINT`:
  - `reconcileOperatorLedgers()` pulls canonical snapshot (`GET`) and refreshes local cache.
  - `appendOperatorAudit()` / `appendDecisionLog()` now persist locally first, then attempt canonical `POST` write.
  - Explicit degraded/offline ledger status is stored and surfaced through diagnostics when endpoint is missing or failing.
- Added a shared freshness label formatter so freshness/degraded handling is consistent across Agents, Sessions, and Cron.
- Added safe route-level code splitting in `App.tsx` using `React.lazy` + `Suspense` to reduce main bundle pressure without changing route behavior.
- Expanded tests for canonical reconciliation, diagnostics degradation behavior, and freshness formatting.

## Adapter Contract (Minimal)
When `VITE_RUNTIME_LEDGER_ENDPOINT` is configured:
- `GET /ledger` returns:
  - `{ audit: OperatorAuditEntry[], decisions: DecisionLogEntry[], adapterHealth?: 'ok'|'degraded'|'offline', lastSyncAt?: string }`
- `POST /ledger` accepts:
  - `{ kind: 'audit' | 'decision', entry: OperatorAuditEntry | DecisionLogEntry }`

If this endpoint is not configured or errors, the UI remains functional with local cache and marked degraded/offline diagnostics.

## Remaining Gaps
- Polling remains interval-based, no SSE/WebSocket transport yet.
- Ledger endpoint contract is minimal and optimistic, auth/signature and conflict handling are not yet implemented.
- No typed confirmation flow yet for destructive actions.

## Demo / Run
1. `cd app`
2. `npm install`
3. `npm run test`
4. `npm run build`
5. `npm run dev`

Optional strict mode:
- `VITE_DISABLE_MOCK_FALLBACK=1 npm run dev`
