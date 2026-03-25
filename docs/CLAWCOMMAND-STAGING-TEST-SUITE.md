# ClawCommand Staging Test Suite

Date: 2026-03-10
Project: ClawCommand
Purpose: Server-readiness validation before staged pilot and production decision.

## Test Metadata
- Environment: Staging server
- Tester: ____________________
- Build/Commit: ____________________
- Start Time: ____________________
- End Time: ____________________
- Result: PASS / FAIL / CONDITIONAL

---

## 1) Boot and Health

### 1.1 Initial Load
- [ ] App loads without white screen
- [ ] No fatal startup error in console
- [ ] Sidebar/navigation renders

### 1.2 Runtime Connectivity
- [ ] Session/runtime context resolves
- [ ] No repeated API/auth failures on initial load

Pass Criteria:
- UI is usable within 10 seconds
- No P0 blocking errors

---

## 2) Factory Floor Core Validation

### 2.1 Floor Resizing
- [ ] Floor/canvas size slider updates viewport height
- [ ] Resize behavior is smooth and stable

### 2.2 Agent Node Sizing
- [ ] Node size presets (Small/Medium/Large) work
- [ ] Node scale slider updates all agent stations consistently
- [ ] Layout remains readable (no overlap regression)

### 2.3 Refresh Behavior
- [ ] Reload page after changes
- [ ] Expected persisted values are retained

Pass Criteria:
- No layout breakage
- No JS errors during resize/scale interactions

---

## 3) Factory Floor Sub-Screens

### 3.1 Team Structure Tab
- [ ] Tab opens without delay/errors
- [ ] Hierarchy/roles render correctly
- [ ] Empty/fallback state displays cleanly

### 3.2 Boardroom Tab
- [ ] Tab opens cleanly
- [ ] Participant list renders
- [ ] Per-project summary cards render and refresh safely

Pass Criteria:
- Both tabs render without crash
- Data/fallback states are understandable

---

## 4) Agent Configuration (PRD Fields)

### 4.1 Edit/Save Flow
- [ ] From Factory Floor, double-click agent and confirm Agent Command opens with that agent preselected
- [ ] Modify skills assignment
- [ ] Modify tools allow/deny lists
- [ ] Modify budget settings
- [ ] Modify routing model/rules
- [ ] Save without error

### 4.2 Post-Save Validation
- [ ] Updated values appear in UI immediately
- [ ] Reload and verify expected persistence behavior

Pass Criteria:
- Full save path works
- No field corruption or silent reset

---

## 5) Workflow + Budget Regression

### 5.1 Workflow Builder
- [ ] Add node(s)
- [ ] Connect node(s)
- [ ] Edit node properties
- [ ] Save/open workflow

### 5.2 Budget Control
- [ ] Edit per-agent budget
- [ ] Alert threshold controls usable
- [ ] Guardrail interactions behave as expected

Pass Criteria:
- No blocker defects in workflow or budget flows

---

## 6) Sessions and Agent Chat

### 6.1 Session Center
- [ ] Sessions list loads
- [ ] Session selection stable

### 6.2 Agent Chat
- [ ] Send message succeeds
- [ ] Message history/timeline refreshes
- [ ] Sidebar remains stable during updates

Pass Criteria:
- Core chat loop works without regressions

---

## 7) Operations Pages Sanity

- [ ] Agents page loads and actions do not error
- [ ] Cron page loads expected data/state
- [ ] Logs page renders without crash

Pass Criteria:
- No P1 breakages on key ops pages

---

## 8) Voice and QMD Controlled Validation

### 8.1 Voice
- [ ] Voice page loads
- [ ] Controls visible/usable
- [ ] If backend capability missing, failure is graceful

### 8.2 QMD
- [ ] QMD page loads
- [ ] Data or fallback states display cleanly

Pass Criteria:
- Module surfaces do not crash app

---

## 9) Performance Sanity

- [ ] Navigate across 6-8 major pages rapidly
- [ ] No major lag, freeze, or memory spike symptoms

Pass Criteria:
- Responsive operation under normal test usage

---

## 10) Gate Decision

### P0/P1 Defect Summary
- P0 defects: ______
- P1 defects: ______

### Recommendation
- [ ] GO (staged pilot)
- [ ] CONDITIONAL GO (with listed mitigations)
- [ ] NO-GO (blocking defects)

### Notes / Defects / Follow-up Actions

1. __________________________________
2. __________________________________
3. __________________________________

---

## Final Sign-off

- Tester: ____________________
- Date: ____________________
- Approved for next stage: YES / NO
