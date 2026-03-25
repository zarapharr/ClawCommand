# CC-004 Phase 2 Follow-up Packets

Created: 2026-03-09

## Packet A: Factory Floor Config Persistence Hardening
- Scope: move Agent Config edits from localStorage-only updates to runtime API-backed persistence with conflict handling.
- Effort: M
- Risk: Medium (schema and adapter drift)
- Acceptance:
  - Save action writes skills/tools/budget/routing to runtime backend contract.
  - Reload reflects backend state across sessions.

## Packet B: Team Structure Data Model
- Scope: replace derived UI hierarchy with explicit team graph model (lead, manager, contributors, reporting lines).
- Effort: M
- Risk: Low
- Acceptance:
  - Team Structure view reads from graph model and supports empty/error states.
  - Unit tests for mapping and fallback.

## Packet C: Boardroom Project Registry
- Scope: replace mock/derived boardroom cards with project registry and participant mapping.
- Effort: M
- Risk: Medium
- Acceptance:
  - Boardroom cards sourced from project registry.
  - Per-project status metrics linked to runtime/session health.

## Packet D: Factory Floor UX Polish
- Scope: persist canvas size and node size preferences, improve mobile controls.
- Effort: S
- Risk: Low
- Acceptance:
  - Size presets and slider values survive page reload.
  - Controls remain accessible on smaller screens.
