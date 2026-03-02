# Overnight Production-Readiness Update (2026-03-02)

## Shipped Scope
- Reworked runtime adapter feed contract to include health, stale, freshness, and last-sync metadata.
- Added production guard for mock fallback. In production mode (or when `VITE_DISABLE_MOCK_FALLBACK=1`), empty feeds are returned instead of mock datasets.
- Added polling runtime hook (`useRuntimeFeed`) for adapter-driven refresh.
- Added explicit runtime status bar with loading/error/fresh-stale/degraded indicators.
- Added health and connection status panel for Agents, Sessions, and Cron pages.
- Added action receipt ledger panel with command IDs and success/failed status.
- Added minimal decision log storage and UI panel.
- Expanded action receipts to include status/result/error and command ID.

## Known Gaps
- Receipts are still local-ledger first unless `VITE_RUNTIME_ACTION_ENDPOINT` is configured.
- Decision log is local and not yet synced to a canonical runtime store.
- No typed confirmation flow yet for destructive actions.
- Polling is interval-based, no SSE/WebSocket transport yet.

## Demo / Run
1. `cd app`
2. `npm install`
3. `npm run test`
4. `npm run build`
5. `npm run dev`

Optional strict mode:
- `VITE_DISABLE_MOCK_FALLBACK=1 npm run dev`
