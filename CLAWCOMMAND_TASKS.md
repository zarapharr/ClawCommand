# ClawCommand - Task Tracking
## Development & Bug Fix Tracker

---

## CRITICAL BUGS (Must Fix Before Release)

### BUG-001: Workflow Builder - Cannot Add Nodes
**Status:** ✅ Implemented, tracker was stale  
**Priority:** P0 - Critical  
**Component:** Workflow Builder  
**Assigned:** TBD  

**Description:**  
Clicking on node palette items does not add nodes to the canvas.

**Steps to Reproduce:**
1. Navigate to Workflow Builder
2. Click "New" to create workflow
3. Click on any node type in palette (Agent, Supervisor, etc.)
4. Observe: Node is not added to canvas

**Expected:** Node should appear on canvas at default position  
**Actual:** Node creation now works in the current UI.

**Tracker Drift Note:**
- The bug text above describes the original failure, but the implementation has already landed.
- `CLAWCOMMAND_TASKS.md` had not been updated to reflect the shipped fix and test coverage.

**Implementation Evidence:**
- `app/src/pages/WorkflowPage.tsx`: palette buttons call `handleAddNode`, which computes a viewport-aware default position, applies default config, and persists via `addNode(...)`.
- `app/src/lib/workflow-utils.ts`: `getDefaultNodePosition(...)` and `getDefaultNodeConfig(...)` support predictable placement and starter config.
- `app/e2e/critical-flows.spec.ts`: `new workflow can add nodes from palette` covers the create-workflow plus add-node regression path.
- **E2E Evidence Run:** 2026-03-12, `npm run test:e2e` passed (4/4).

---

### BUG-002: Workflow Builder - Cannot Connect Nodes
**Status:** ✅ Implemented, e2e coverage added  
**Priority:** P0 - Critical  
**Component:** Workflow Builder  

**Description:**  
No way to create connections between nodes.

**Expected:** Drag from output port to input port to create edge  
**Actual:** Port-to-port connection creation now works in the current UI.

**Tracker Drift Note:**
- The bug text above reflects the original gap, not the present implementation state.
- The remaining drift was missing e2e evidence for the full node-connection flow.

**Implementation Evidence:**
- `app/src/pages/WorkflowPage.tsx`: node cards now render input/output ports, set `connectionStart` on port mouse down, resolve valid source/target pairs on port mouse up, and persist new edges with `addEdge(...)`.
- `app/src/lib/workflow-connections.ts`: `resolveWorkflowConnection(...)` rejects self-links and same-port links, and normalizes edge direction.
- `app/src/lib/workflow-connections.test.ts`: unit coverage exists for valid and invalid connection resolution.
- `app/e2e/critical-flows.spec.ts`: `new workflow can connect two added nodes through ports` now covers create workflow -> add two nodes -> connect ports -> assert edge count increments.
- **E2E Evidence Run:** 2026-03-12, `npm run test:e2e` passed (4/4).

---

### BUG-003: Workflow Builder - Cannot Edit Node Properties
**Status:** ✅ Implemented, e2e coverage added  
**Priority:** P0 - Critical  
**Component:** Workflow Builder  

**Description:**  
No property panel for configuring selected nodes.

**Expected:** Right-click or double-click node to edit properties  
**Actual:** Node properties panel is available and persists edits.

**Implementation Evidence:**
- `app/src/pages/WorkflowPage.tsx`: selected node panel now supports label, timeout, retry, and condition edits with `updateSelectedNodeConfig(...)` handling.
- `app/e2e/critical-flows.spec.ts`: `selected node properties can be edited and stay in workflow state` covers create workflow -> add node -> edit label/timeout/retry -> reopen config to confirm persistence.
- **E2E Evidence Run:** 2026-03-12, `npm run test:e2e` passed (5/5).

---

### BUG-004: Budget Control - Cannot Adjust Per-Agent Budget
**Status:** ✅ Implemented, e2e coverage added  
**Priority:** P0 - Critical  
**Component:** Budget Control  

**Description:**  
No UI for editing agent budget settings.

**Steps to Reproduce:**
1. Navigate to Budget Control
2. Click "By Agent" tab
3. Click on any agent card
4. Observe: No edit option available

**Expected:** Should open budget edit dialog  
**Actual:** Budget edit dialog and update flow now work in the current UI.

**Implementation Evidence:**
- `app/src/pages/BudgetPage.tsx`: agent cards render edit buttons, open the edit dialog, and call `updateBudget(...)` on save.
- `app/src/stores/enterprise-store.ts`: `updateBudget(...)` updates the per-agent budget state.
- `app/e2e/critical-flows.spec.ts`: `per-agent budget edits and alert settings persist in UI state` covers edit, save, and UI persistence validation.
- **E2E Evidence Run:** 2026-03-12, `npm run test:e2e -- e2e/critical-flows.spec.ts` passed (6/6).

---

### BUG-005: Budget Control - Alert Configuration Missing
**Status:** ✅ Implemented, e2e coverage added  
**Priority:** P0 - Critical  
**Component:** Budget Control  

**Description:**  
Cannot configure alert thresholds or auto-actions.

**Expected:** UI for setting:
- Alert threshold percentage
- Hard limit toggle
- Auto-action on exceed (pause/downgrade/notify/escalate)

**Actual:** Alert configuration controls are now present in the budget edit dialog and persist in the UI state.

**Implementation Evidence:**
- `app/src/pages/BudgetPage.tsx`: alert threshold slider, hard limit switch, and auto-action select are wired into `editingBudget` and saved via `handleSaveBudget`.
- `app/e2e/critical-flows.spec.ts`: `per-agent budget edits and alert settings persist in UI state` verifies alert settings updates and persistence.
- **E2E Evidence Run:** 2026-03-12, `npm run test:e2e -- e2e/critical-flows.spec.ts` passed (6/6).

---

### BUG-006: Factory Floor - Agent Config Dialog Incomplete
**Status:** ✅ Implemented, unit coverage added  
**Priority:** P1 - High  
**Component:** Factory Floor / Agent Command  

**Description:**  
Factory Floor routes to Agent Command for full agent configuration, including editable bootstrap files.

**Current Behavior (Implemented):**
- Factory Floor double-click on an agent routes to Agent Command with that agent preselected.
- Config sections for skills, tool allow/deny, budget, routing, and workspace bootstrap files are editable and saved in UI state.

**Implementation Evidence:**
- `app/src/pages/FactoryFloorPage.tsx`: `onDoubleClick` calls `onOpenAgentCommand?.(agent.id)`.
- `app/src/App.tsx`: `openAgentCommand(...)` routes to `view=agents` and injects selected `agent` query param.
- `app/src/pages/AgentsPage.tsx`: workspace bootstrap files participate in draft/save flow and persist in UI state.
- `app/src/lib/agent-config.ts`: `applyAgentConfigDraft` applies bootstrap file edits on save.
- `app/src/lib/agent-config.test.ts`: `persists bootstrap file edits when saving config` validates bootstrap file update on save.
- **Unit Evidence Run:** 2026-03-12, `npx vitest run src/lib/agent-config.test.ts` passed (1/1).

---

## NEW FEATURES (Implementation Required)

### FEAT-001: Agent Chat Module
**Status:** 🆕 New  
**Priority:** P0 - Critical  
**Component:** New Module  
**Estimated Effort:** 3 days  

**Requirements:**
- Real-time chat interface
- Message history with search
- File attachments
- Code syntax highlighting
- Token usage display
- Cost tracking
- Typing indicators

**Implementation Plan:**
1. Create `AgentChatPage.tsx`
2. Implement message store
3. Add chat UI components
4. Integrate with WebSocket
5. Add file upload support

---

### FEAT-002: Agent Swarm Module
**Status:** 🆕 New  
**Priority:** P1 - High  
**Component:** New Module  
**Estimated Effort:** 5 days  

**Requirements:**
- Swarm creation UI
- Agent role assignment (supervisor/worker/specialist)
- Communication pattern configuration
- Task distribution settings
- Swarm monitoring dashboard
- Message flow visualization

---

### FEAT-003: Voice Integration - Whisper STT
**Status:** 🆕 New  
**Priority:** P2 - Medium  
**Component:** New Feature  
**Estimated Effort:** 2 days  

**Requirements:**
- Speech-to-text transcription
- Voice message processing
- Multi-language support
- Real-time transcription UI

---

### FEAT-004: Voice Integration - TTS
**Status:** 🆕 New  
**Priority:** P2 - Medium  
**Component:** New Feature  
**Estimated Effort:** 2 days  

**Requirements:**
- Text-to-speech playback
- Voice selection
- Speed control
- Play/pause controls

---

### FEAT-005: ElevenLabs Integration
**Status:** 🆕 New  
**Priority:** P2 - Medium  
**Component:** New Feature  
**Estimated Effort:** 3 days  

**Requirements:**
- API key configuration
- Voice cloning setup
- Podcast generation from chats
- Voice library management
- Audio export

---

### FEAT-006: QMD Integration
**Status:** 🆕 New  
**Priority:** P2 - Medium  
**Component:** New Feature  
**Estimated Effort:** 4 days  

**Requirements:**
- Review queue management
- Rating system (1-5 stars)
- Feedback collection
- Performance metrics dashboard
- Regression detection alerts

---

## UAT POLICY (MANDATORY FOR EVERY PHASE)

All phases/sprints require full functional UAT for the impacted feature set before phase closure.

UAT minimum requirements:
- Execute functional checklist for all affected user flows
- Capture pass/fail evidence
- Log defects with severity (P0/P1/P2)
- Re-test after fixes
- Record explicit phase sign-off: GO / CONDITIONAL GO / NO-GO

No task is considered complete without UAT evidence attached.

## TESTING TASKS

### TEST-001: Create Sub-Agent Testing Framework
**Status:** 🆕 New  
**Priority:** P1 - High  
**Estimated Effort:** 3 days  

**Requirements:**
- Test agent configuration
- Automated UI navigation
- Test scenario definitions
- Bug report generation
- Performance benchmarking

---

### TEST-002: Implement E2E Test Suite
**Status:** 🟡 In Progress  
**Priority:** P1 - High  
**Estimated Effort:** 5 days  

**Requirements:**
- Playwright test setup
- Test all P0 features
- Test all P1 features
- Visual regression tests
- CI/CD integration

**Latest Evidence:**
- 2026-03-12: `npm run test:e2e` passed (4/4) covering critical workflow flows.

---

## DOCUMENTATION TASKS

### DOC-001: User Guide
**Status:** 🆕 New  
**Priority:** P2 - Medium  

**Sections:**
- Getting Started
- Agent Configuration
- Workflow Tutorial
- Budget Management
- Troubleshooting

---

### DOC-002: API Documentation
**Status:** 🆕 New  
**Priority:** P2 - Medium  

**Sections:**
- REST API Reference
- WebSocket Events
- Authentication
- Error Codes

---

## COMPLETED TASKS

### ✅ TASK-001: Channel Hub Implementation
**Status:** ✅ Complete  
**Completed:** 2026-02-17  
**Notes:** Full implementation with WhatsApp, Telegram, Discord, Email, Slack

### ✅ TASK-002: Tool Configurator Implementation
**Status:** ✅ Complete  
**Completed:** 2026-02-17  
**Notes:** Full tool management with enable/disable/configure

### ✅ TASK-003: Model Manager Implementation
**Status:** ✅ Complete  
**Completed:** 2026-02-17  
**Notes:** Provider management with token tracking

### ✅ TASK-004: Factory Floor Environment Profiles
**Status:** ✅ Complete  
**Completed:** 2026-02-17  
**Notes:** 6 profiles implemented (Office, Factory, Farm, Medical, Bakery, Retail)

### ✅ TASK-005: Multi-Company Support
**Status:** ✅ Complete  
**Completed:** 2026-02-17  
**Notes:** Company selector with visual indicators

---

## SPRINT PLANNING

### Sprint 1: Critical Bug Fixes (Week 1)
- [x] BUG-001: Workflow Builder - Add Nodes
- [x] BUG-002: Workflow Builder - Connect Nodes
- [x] BUG-003: Workflow Builder - Edit Properties
- [x] BUG-004: Budget Control - Adjust Budget
- [x] BUG-005: Budget Control - Alert Config
- [x] UAT: Full functional validation and sign-off for Sprint 1 scope
  - **Status:** ✅ COMPLETE (2026-03-15)
  - **Sign-Off:** GO for Sprint 1 Closure
  - **Evidence:** docs/SPRINT1-UAT-SIGNOFF.md
  - **Test Results:** 6/6 e2e tests passing, build clean, no regressions
  - **Deployment Ready:** YES

### Sprint 2: Agent Chat & Enhancements (Week 2)
- [ ] FEAT-001: Agent Chat Module
- [ ] BUG-006: Factory Floor - Complete Config Dialog
- [ ] TEST-001: Sub-Agent Testing Framework
- [ ] UAT: Full functional validation and sign-off for Sprint 2 scope

### Sprint 3: Advanced Features (Week 3)
- [ ] FEAT-002: Agent Swarm Module
- [ ] FEAT-003: Whisper STT
- [ ] FEAT-004: TTS
- [ ] UAT: Full functional validation and sign-off for Sprint 3 scope

### Sprint 4: Voice & QMD (Week 4)
- [ ] FEAT-005: ElevenLabs Integration
- [ ] FEAT-006: QMD Integration
- [ ] TEST-002: E2E Test Suite
- [ ] UAT: Full functional validation and sign-off for Sprint 4 scope

### Sprint 5: Polish & Release (Week 5)
- [ ] DOC-001: User Guide
- [ ] DOC-002: API Documentation
- [ ] Final bug fixes
- [ ] Performance optimization
- [ ] Production release
- [ ] UAT: Full release-candidate validation and sign-off

---

## METRICS

### Bug Metrics
| Severity | Open | In Progress | Fixed | Verified |
|----------|------|-------------|-------|----------|
| Critical | 0 | 0 | 5 | 0 |
| High | 1 | 0 | 0 | 0 |
| Medium | 0 | 0 | 0 | 0 |
| Low | 0 | 0 | 0 | 0 |

### Feature Metrics
| Status | Count |
|--------|-------|
| Complete | 5 |
| In Progress | 1 |
| New | 6 |

### Test Coverage
| Category | Tests | Passing | Coverage |
|----------|-------|---------|----------|
| Unit | 0 | 0 | 0% |
| Integration | 0 | 0 | 0% |
| E2E | 6 | 6 | Starter (critical flows) |

---

*Last Updated: 2026-03-15*
*Next Update: Sprint 2 commencement (BUG-006, FEAT-001)*
