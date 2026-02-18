# ClawCommand - Task Tracking
## Development & Bug Fix Tracker

---

## CRITICAL BUGS (Must Fix Before Release)

### BUG-001: Workflow Builder - Cannot Add Nodes
**Status:** 🔴 Open  
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
**Actual:** Nothing happens

**Root Cause Analysis:**
- Node palette buttons are disabled when workflow is selected
- No click handler implemented for adding nodes
- Missing `addNode` function call

**Fix Required:**
```typescript
// In WorkflowPage.tsx
const handleAddNode = (type: NodeType) => {
  if (!selectedWorkflow) return;
  addNode(selectedWorkflow.id, {
    type,
    position: { x: 200, y: 200 }, // Default position
    config: {}
  });
};
```

---

### BUG-002: Workflow Builder - Cannot Connect Nodes
**Status:** 🔴 Open  
**Priority:** P0 - Critical  
**Component:** Workflow Builder  

**Description:**  
No way to create connections between nodes.

**Expected:** Drag from output port to input port to create edge  
**Actual:** No connection mechanism exists

**Fix Required:**
- Add connection ports to nodes
- Implement drag-to-connect functionality
- Add `addEdge` function integration

---

### BUG-003: Workflow Builder - Cannot Edit Node Properties
**Status:** 🔴 Open  
**Priority:** P0 - Critical  
**Component:** Workflow Builder  

**Description:**  
No property panel for configuring selected nodes.

**Expected:** Right-click or double-click node to edit properties  
**Actual:** No property editing UI

**Fix Required:**
- Add property panel sidebar
- Implement node configuration form
- Support agent assignment for agent nodes

---

### BUG-004: Budget Control - Cannot Adjust Per-Agent Budget
**Status:** 🔴 Open  
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
**Actual:** Card is selectable but not editable

**Fix Required:**
- Add "Edit Budget" button to agent cards
- Create budget edit dialog
- Implement `updateBudget` function call

---

### BUG-005: Budget Control - Alert Configuration Missing
**Status:** 🔴 Open  
**Priority:** P0 - Critical  
**Component:** Budget Control  

**Description:**  
Cannot configure alert thresholds or auto-actions.

**Expected:** UI for setting:
- Alert threshold percentage
- Hard limit toggle
- Auto-action on exceed (pause/downgrade/notify/escalate)

**Actual:** No alert configuration UI

---

### BUG-006: Factory Floor - Agent Config Dialog Incomplete
**Status:** 🟡 In Progress  
**Priority:** P1 - High  
**Component:** Factory Floor  

**Description:**  
Agent configuration dialog is missing key fields.

**Missing Fields:**
- Skills assignment
- Bootstrap files configuration
- Budget settings
- Routing rules
- Tool allow/deny lists

**Fix Required:**
- Add all configuration sections
- Implement proper form handling
- Add validation

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
**Status:** 🆕 New  
**Priority:** P1 - High  
**Estimated Effort:** 5 days  

**Requirements:**
- Playwright test setup
- Test all P0 features
- Test all P1 features
- Visual regression tests
- CI/CD integration

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
- [ ] BUG-001: Workflow Builder - Add Nodes
- [ ] BUG-002: Workflow Builder - Connect Nodes
- [ ] BUG-003: Workflow Builder - Edit Properties
- [ ] BUG-004: Budget Control - Adjust Budget
- [ ] BUG-005: Budget Control - Alert Config

### Sprint 2: Agent Chat & Enhancements (Week 2)
- [ ] FEAT-001: Agent Chat Module
- [ ] BUG-006: Factory Floor - Complete Config Dialog
- [ ] TEST-001: Sub-Agent Testing Framework

### Sprint 3: Advanced Features (Week 3)
- [ ] FEAT-002: Agent Swarm Module
- [ ] FEAT-003: Whisper STT
- [ ] FEAT-004: TTS

### Sprint 4: Voice & QMD (Week 4)
- [ ] FEAT-005: ElevenLabs Integration
- [ ] FEAT-006: QMD Integration
- [ ] TEST-002: E2E Test Suite

### Sprint 5: Polish & Release (Week 5)
- [ ] DOC-001: User Guide
- [ ] DOC-002: API Documentation
- [ ] Final bug fixes
- [ ] Performance optimization
- [ ] Production release

---

## METRICS

### Bug Metrics
| Severity | Open | In Progress | Fixed | Verified |
|----------|------|-------------|-------|----------|
| Critical | 5 | 0 | 0 | 0 |
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
| E2E | 0 | 0 | 0% |

---

*Last Updated: 2026-02-17*
*Next Update: Daily during active development*
