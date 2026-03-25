# CC-006 Regression Harness

Last Updated: 2026-03-10
Owner: Zara

## Purpose
Provide repeatable validation commands for ClawCommand P0 and Phase 2 surfaces before merge/release.

## Required Preconditions
- Node/npm dependencies installed (`app/node_modules` present)
- `.env.local` synced from `.env` (handled by prebuild/pretest)
- Run from `ClawCommand/app`

## Command Suite

```bash
npm run build
npm test -- --run
```

## Targeted Validation Scope

### 1) Workflow Builder (P0 fix verification)
- Open Workflow Builder page.
- Verify node add, connection, property edit affordances render and remain interactive.
- Verify no console/runtime errors during basic create/edit flow.

### 2) Budget Control (P0 fix verification)
- Open Budget page and switch tabs.
- Validate by-agent controls, thresholds, and action settings render.
- Validate totals/progress bars update and stay stable across filter changes.

### 3) Agent Chat (Phase 2 hardening)
- Verify session list loads and preserves ordering/filter selections.
- Verify alias edit/save/clear flow.
- Verify send path and local draft guardrails.

### 4) Factory Floor (CC-005/007/008/009 + Packets A/D)
- Verify config dialog includes skills, bootstrap files, budget, routing, tool allow/deny controls.
- Verify canvas sizing + node size preset persistence survives reload.
- Verify Team Structure and Boardroom tabs load with empty/error-safe rendering.

## Packet Gate Mapping
- Packet 1 gate: build + tests + P0 smoke (Workflow/Budget) pass.
- Packet 2 gate: Factory Floor controls + Team Structure/Boardroom smoke pass.
- Packet 3 gate: persistence checks pass after reload.
- Packet 4/5 gate: Agent Swarm + Voice + QMD pages render with no runtime errors.
- Packet 6 gate: docs complete and traceability updated.

## Latest Run Evidence (2026-03-10)
- `npm run build`: PASS
- `npm test -- --run`: PASS (8 files, 46 tests)
