# ClawCommand User Guide (DOC-001)

Last Updated: 2026-03-10

## 1. Getting Started
1. Open ClawCommand in your browser.
2. Select a workspace/company context from the top-level controls.
3. Use the left navigation to switch modules.

## 2. Factory Floor
- Purpose: real-time visual map of agents and system state.
- Key actions:
  - Single-click agent to inspect status.
  - Double-click agent to open full configuration.
  - Use sizing controls to adjust viewport and node scale.
  - Use tabs for Team Structure and Boardroom views.
- Persistence behavior:
  - Layout and size preferences persist across reloads.
  - Agent config edits persist through runtime-backed mapping.

## 3. Agent Chat
- Purpose: direct message flow with sessions.
- Key actions:
  - Pick a session from grouped sidebar.
  - Send messages in composer.
  - Use aliases to rename sessions for quick identification.
  - Toggle sub-agent visibility when needed.
- Built-in commands:
  - `/help`, `/new`, `/refresh`, `/clear`

## 4. Workflow Builder
- Purpose: design and manage multi-agent workflows.
- Typical flow:
  1. Create/select a workflow.
  2. Add nodes from palette.
  3. Connect and configure nodes.
  4. Validate before execution.

## 5. Budget Control
- Purpose: manage token/cost guardrails per agent.
- Core functions:
  - By-agent budget review and edits.
  - Threshold visibility and alerting posture.
  - Budget trend and utilization checks.

## 6. Agent Swarm
- Purpose: runtime action matrix for multi-agent operations.
- Actions supported:
  - Start, stop, retry, kill, escalate.
- Observability:
  - Live session list and action receipt ledger.

## 7. Voice Integration
- Includes Whisper STT, browser TTS, and ElevenLabs config path.
- Use tabs to switch between transcription and synthesis workflows.

## 8. QMD (Quality Management Database)
- Purpose: quality scoring and trend review for sessions.
- Use filters by status/agent and inspect per-session scorecards.

## 9. Troubleshooting
- If data appears stale, click Refresh in module header.
- If runtime feeds disconnect, verify gateway health and API endpoints.
- If environment warnings appear, run environment validation script from app root.

## 10. Validation Checklist for Operators
Before demos or release checks:
1. `npm run build`
2. `npm test -- --run`
3. Smoke-check Factory Floor, Agent Chat, Workflow, and Budget surfaces.
