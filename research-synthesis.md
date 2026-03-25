# ClawCommand Enterprise Dashboard — Research & Synthesis
## Phase 1: Best-in-Class Reference Analysis

**Date:** March 23, 2026  
**Phase:** 1 (Research & Design Pattern Synthesis)  
**Objective:** Analyze industry-leading mission control, observability, and complex data dashboards to extract design principles for ClawCommand's evolution.

---

## Executive Summary

Premium mission control dashboards excel in three dimensions:
1. **Information architecture** that guides operators from overview → concern → action without cognitive overload
2. **Real-time data density** achieved through semantic color, micro-interactions, and collapsible hierarchies
3. **Operational feedback loops** that surface anomalies proactively while remaining transparent and auditable

ClawCommand's current design is strong on **agent visibility** but weak on **operational hierarchy** and **context switching efficiency**. Phase 2 should focus on: Factory Floor overview design, workflow drill-down patterns, and budget/cost control surfacing.

---

## Reference Designs Analyzed

### 1. **AgentOps Dashboard** (AI Observability)
**URL:** agentops.ai | **Focus:** LLM agent tracing & cost tracking

#### Information Architecture
- **Overview level:** Cost per agent, event count, failure rate in summary cards
- **Detail level:** Time-travel debugging, session replay, individual LLM call waterfall
- **Hierarchy:** Agents → Sessions → Events → Trace logs
- **Balance:** High-level KPIs visible; drill-down requires 2-3 clicks

#### Visual Design
- Semantic color: Red for errors, yellow for warnings, green for success
- Text contrast: White on dark bg, accessible at a glance
- Motion: Loading spinners, subtle state transitions (no distracting animations)
- Typography: Clear hierarchy (h2/h3 for sections, code font for IDs)

#### Interaction Model
- Search/filter accessible from every level
- Replay button prominent on session cards
- Keyboard navigation: Tab through summary cards, Enter to drill down
- Feedback: Inline success/error messages, no modal dialogs for critical actions

#### Data Density
- Cards show 4-6 metrics per session (time, cost, tokens, status)
- Horizontal scrolling avoided; responsive grid collapses gracefully
- Real-time updates via WebSocket (visible loading state)
- Trend sparklines on summary cards

#### Operational Sophistication
- Alerts: Cost threshold warnings surface at top of dashboard
- Filtering by status, date range, agent type
- Cost analysis broken down by model, token type
- Exportable session data for audit trail

**Strengths for ClawCommand:**
- Cost tracking visual hierarchy directly applicable to budget control
- Time-travel debugging metaphor could apply to workflow step replay
- Semantic color coding scalable to agent status (running, idle, failed)

**Weaknesses to avoid:**
- Modals for settings (use sidebar instead)
- Click depth beyond 3 levels discourages exploration

---

### 2. **Langfuse Dashboard** (LLM Engineering Platform)
**URL:** github.com/langfuse/langfuse | **Focus:** Prompt management, observability, evaluation

#### Information Architecture
- **Overview:** Production metrics (latency, cost, token usage)
- **Detail:** Traces (nested LLM calls), datasets, evaluations
- **Hierarchy:** Projects → Traces → Spans → Logs
- **Real-time:** SSE updates for active traces

#### Visual Design
- Dark mode optimized for monitoring environments
- Color: Semantic (latency → green/yellow/red gradient)
- Micro-typography: Timestamps, request IDs in monospace
- Cards have visual borders (not just drop shadows)

#### Interaction Model
- Sidebar navigation (not top nav); filters persist across views
- Inline editing for prompt versions
- Full-text search across all traces
- Keyboard shortcuts for power users (cmd+k for search)

#### Data Density
- Timeline view for latency trends
- Sparklines for individual trace performance
- Collapsible panels for long traces
- Horizontal scroll within tables (not ideal, but necessary for dense data)

#### Operational Sophistication
- Alert thresholds configurable per model/prompt
- Datasets for regression testing
- Evaluation framework integrated (pass/fail rates visible)
- Audit log for all config changes

**Strengths for ClawCommand:**
- Sidebar + persistent filters = scalable navigation as feature count grows
- Timeline visualization for workflow execution over time
- Evaluation framework could apply to agent quality gates
- Version control metaphor for prompt/config changes

**Weaknesses to avoid:**
- Nested traces can get confusing; limit depth to 3-4 levels
- Horizontal scroll on tables is cognitive friction

---

### 3. **Linear.app Dashboard** (Product Development System)
**URL:** linear.app | **Focus:** Issue tracking, workflow optimization, team visibility

#### Information Architecture
- **Overview:** Backlog status, in-progress count, team velocity
- **Detail:** Individual issues with comments, linked issues, PRs
- **Hierarchy:** Project → Board (Kanban) → Issues → Activity
- **Smart defaults:** Inbox vs. Backlog vs. View (scoped)

#### Visual Design
- Minimalist: Removes color except for semantic status indicators
- Icons + text labels for clarity
- Consistent spacing (8px grid)
- Responsive: Single-column on mobile, multi-column on desktop

#### Interaction Model
- Click card to expand; Cmd+Click to open in sidebar
- Drag-to-reorder (gestural, not click-heavy)
- Keyboard shortcuts discoverable (cmd+k)
- AI integration: Drafting assistance, auto-labeling

#### Data Density
- Backlog shows title, assignee, priority, status
- Kanban columns show limited cards (5-8 visible); scroll within column
- Issue detail shows full context: description, comments, linked issues, PRs

#### Operational Sophistication
- Triage workflow (inbox → board)
- Filtering by assignee, label, milestone, date range
- Team velocity tracking (burndown implicit in column motion)
- Bulk actions (select multiple, apply label/status)

**Strengths for ClawCommand:**
- Inbox/Backlog/View pattern = triage + main view + custom filter pattern
- Drag-to-reorder for workflow priority
- Kanban columns could represent agent state (queued, running, succeeded, failed)
- AI-assisted labeling/tagging applicable to agent error classification

**Weaknesses to avoid:**
- Over-reliance on drag-to-reorder (accessibility issue for keyboard-only users)
- Too many sidebar expandables (use tabs instead)

---

### 4. **Vercel Dashboard** (Deployment Platform)
**URL:** vercel.com/dashboard | **Focus:** Deployment status, analytics, real-time build logs

#### Information Architecture
- **Overview:** Deployment status (production/preview), recent builds
- **Detail:** Full build log, analytics (edge request count, response time)
- **Hierarchy:** Organization → Project → Deployment → Function/Edge
- **Real-time:** Live log streaming, status badge updates

#### Visual Design
- Card-based layout with consistent spacing
- Build status prominently displayed (large status badge)
- Color: Green for success, red for failure (high contrast)
- Typography: Monospace for logs, sans-serif for UI

#### Interaction Model
- One-click to re-deploy
- Logs auto-scroll during active build
- Copy log to clipboard button
- Filter deployments by status, branch, author

#### Data Density
- Deployment list: Project, status, timestamp, trigger (push/manual), duration
- Build log: Full output in monospace, searchable
- Analytics: Line charts for response time, bandwidth over 24h

#### Operational Sophistication
- Environment variable management visible
- Deployment preview links auto-generated
- Rollback one-click (redeploy previous commit)
- Status page integration (incident notifications)

**Strengths for ClawCommand:**
- Live log streaming design (applies to real-time agent execution output)
- Status badge pattern scalable to multiple agent states
- One-click rollback = one-click pause/resume for workflows
- Build duration tracking = workflow execution time visibility

**Weaknesses to avoid:**
- Live log auto-scrolling can miss important events (add pause button)
- Dense monospace output needs search/filter to be useful

---

### 5. **Doppler Secrets Management** (Developer Configuration)
**URL:** doppler.com | **Focus:** Configuration management, environment secrets, audit trail

#### Information Architecture
- **Overview:** Environment status (staging, prod), secrets summary (count, last updated)
- **Detail:** Individual secrets (name, value masked), change history
- **Hierarchy:** Organization → Project → Environment → Secret
- **Version control:** Immutable history with diff view

#### Visual Design
- Table-based layout for secrets (security expectation)
- Masking: Values hidden by default, reveal on demand
- Icon indicators for secret type (API key, password, etc.)
- Red highlight for deprecated secrets

#### Interaction Model
- Copy secret to clipboard (temporary auto-mask after paste)
- Inline edit with confirmation
- Bulk update environment variables
- Undo recent changes (with timestamp)

#### Data Density
- Secrets table: Name, type, last updated, sync status
- Change log: Who changed it, when, from what to what (redacted)

#### Operational Sophistication
- Audit trail: Every read/write logged with user, IP, timestamp
- Sync notifications: When secrets are pulled by services
- Access control: Role-based (read, write, admin)
- Alerts: Unauthorized access attempts

**Strengths for ClawCommand:**
- Audit trail pattern directly applicable to workflow execution history
- Immutable change log (no deletion, only versioning)
- Role-based access = agent permission model
- Masked display of sensitive data (API keys, tokens)

**Weaknesses to avoid:**
- Table-heavy design can feel administrative (warm it up with cards for summary)
- Inline editing can be risky; require confirmation modal for sensitive fields

---

### 6. **Bloomberg Terminal** (Trading Observability) — Industry Pattern
**Reference:** Industry knowledge + NOC design patterns  
**Focus:** Real-time market data density, alert prioritization, multi-screen layouts

#### Information Architecture
- **Overview:** Market summary (indices, trending pairs), personal portfolio at top
- **Detail:** Individual security with full quote, news, charts, order book
- **Hierarchy:** Market → Sector → Security → Intraday movements
- **Customization:** User-configurable watchlists and alerts

#### Visual Design
- High information density: 4-6 columns of data per row
- Color-coded performance: Green (up), red (down), white (neutral)
- Flash animation on price change (transient, not persistent)
- Dark background (reduced eye strain for 8-hour shifts)

#### Interaction Model
- Keyboard-first (Bloomberg terminals are keyboard-driven)
- Natural language commands (type ticker symbol, hit enter)
- Function keys for common tasks (F1 = news, F2 = charts)
- Right-click context menu for advanced options

#### Data Density
- Quote window: 20+ data points (bid, ask, volume, volatility, Greeks)
- News feed: Headline, timestamp, relevance ranking (top stories)
- Charts: Candlestick with volume, overlaid indicators, zoom in/out

#### Operational Sophistication
- Alert system: User sets thresholds, breaches generate notifications
- Risk management: Portfolio Greeks (delta, gamma, vega) at a glance
- Order execution: Direct from quote window (no modal dialogs)
- Audit trail: All trades logged with timestamp, execution price, slippage

**Strengths for ClawCommand:**
- Keyboard-first interaction = power-user friendly (developers love this)
- Customizable watchlists = personalized agent monitoring views
- Alert severity stratification (critical, warning, info)
- Natural language command input for agent operations

**Weaknesses to avoid:**
- Extreme density causes cognitive overload (simplify for initial users)
- Keyboard-only accessibility excludes non-power-users

---

### 7. **NASA/SpaceX Mission Control** — Industry Pattern
**Reference:** Visual hierarchy research, NOC design  
**Focus:** Complex system visualization, alert prioritization, team coordination

#### Information Architecture
- **Overview:** Mission status (timeline position, key milestones), system health (telemetry summary)
- **Detail:** Individual subsystem state (propellant, avionics, thermal)
- **Hierarchy:** Mission → Vehicle → Subsystem → Parameter
- **Real-time:** High-frequency telemetry updates, synchronized across team

#### Visual Design
- Large displays (60"+ screens) with remote viewing
- Color-coded status: Green (nominal), yellow (caution), red (critical)
- Grouped by spatial layout: Propulsion left, avionics center, power right
- No animations (distraction risk during high-stakes moments)

#### Interaction Model
- Joystick/console for manual control (not keyboard/mouse)
- Large physical buttons for critical functions (abort, jettison)
- Redundant displays (backup screens, no single point of failure)
- Voice communication integrated (headsets for team talk)

#### Data Density
- 100+ parameters visible simultaneously
- Grouped into subsystems (max 12-15 parameters per subsystem)
- Sparklines for recent history (last 5 minutes)
- Limit data points per screen to avoid overwhelming (principle of 7±2)

#### Operational Sophistication
- Predictive alerts: "In 30 seconds, fuel will cross red line"
- Abort triggers (hard limits, automated alerts)
- Checklist integration: Procedure linked to telemetry
- Playback: Replay mission segment with full telemetry

**Strengths for ClawCommand:**
- Spatial grouping by subsystem = grouping agents by project/type
- Predictive alerts (not just reactive)
- Redundancy principle = fallback dashboards/views
- Checklist integration = workflow templates attached to agent runs

**Weaknesses to avoid:**
- 100+ parameters is overkill for most dashboards; prioritize ruthlessly
- Physical joystick not relevant; keep mouse/keyboard primary
- Voice integration adds complexity; implement only if multi-team coordination is priority

---

### 8. **Network Operations Center (NOC) Design Patterns**
**Reference:** Wikipedia, industry standard practices  
**Focus:** Monitoring, alerting, multi-screen ergonomics

#### Information Architecture
- **Overview:** Network backbone health, regional status
- **Detail:** Individual node/link status, traffic patterns
- **Hierarchy:** Network → Region → Node → Link/Interface
- **Real-time:** SNMP polling (1-5min intervals), syslog aggregation

#### Visual Design
- Large geographic maps with status overlays
- Traffic heat maps (volume per link, color intensity)
- Status boards: LED-style (bright green/red, visible from distance)
- Minimal text; visual patterns dominant

#### Interaction Model
- Large physical panels with indicator lights
- Alert bells/sounds for critical events (audio cues essential)
- Telephone integration (direct lines to on-call engineers)
- Multi-person workflow (analyst + supervisor)

#### Data Density
- Map shows 500+ nodes with rolled-up status
- Drill-down to specific node shows interface statistics
- Traffic trends over 24h (aggregated by hour)

#### Operational Sophistication
- Alert escalation: Auto-page on-call if issue unresolved in 5min
- Known issue suppression (maintenance window, pre-approved alerts)
- Root cause analysis: Topology-aware (if core router down, suppress edge alerts)
- SLA tracking: MTTR, availability percentage, incident log

**Strengths for ClawCommand:**
- Alert prioritization and suppression logic
- Geographic/logical grouping of resources
- Multi-person workflows (coordinator + executor)
- SLA visibility and incident tracking

**Weaknesses to avoid:**
- Audio alerts can be annoying in shared spaces (make optional)
- Physical panel design not applicable (digital only)
- Geographic maps overkill unless truly distributed

---

## Key Patterns: Premium vs. Mediocre Dashboards

### Information Architecture Patterns

#### DO:
1. **Three-level hierarchy:** Overview (summary cards) → Focused view (list/table) → Detail (modal/sidebar)
   - Prevents cognitive overload
   - Clear drilling path from concern → root cause
   - Example: AgentOps (costs) → Langfuse (traces) → Time-travel replay

2. **Semantic grouping:** Group by business concern, not technical implementation
   - Agent status by project (not by internal service)
   - Workflow steps by execution phase (not by underlying module)
   - Reduces context switching

3. **Persistent context:** Filter/search selections survive navigation
   - User clicks "show failures only" → applies across all views
   - Sidebar with scoped filters (not top-level global)

4. **Smart defaults:** Show 80% use case immediately; hide advanced filters
   - Most operators want: Status + recent activity + alerts
   - Power users can enable: Cost, performance metrics, historical trends

#### DON'T:
1. **Flat hierarchy:** Shoving all data into one giant table (mediocre pattern)
   - Overwhelms; requires extensive filtering to find concerns
   - Example: "Here's all 500 events, now search"

2. **Deep hierarchy:** Requiring 4+ clicks to see detail (mediocre pattern)
   - Discourages exploration
   - Example: Dashboard → Project → Team → Agent → Run → Step (too deep)

3. **Competing patterns:** Overview + Detail + Settings all on same screen
   - No clear focal point
   - User doesn't know where to look first

4. **Context loss:** Filters reset when navigating away
   - User loses mental model
   - Frustrating for power users

---

### Visual Design Patterns

#### DO:
1. **Semantic color:** Color = status/severity (not decoration)
   - Red = critical, Yellow = warning, Green = nominal
   - Applies consistently across all views
   - Accessible to colorblind users (add icons/text labels)

2. **High contrast:** Dark background + light text
   - Reduces eye strain during long monitoring sessions
   - Improves readability of real-time updates
   - Example: Langfuse, trading platforms

3. **Minimal motion:** Loading states + state transitions; no eye candy
   - Spinners OK (indicate activity)
   - Hover effects OK (indicate interactivity)
   - Avoid: Auto-scrolling, animated backgrounds, transitions > 300ms

4. **Visual hierarchy:** Card > list > table
   - Cards for summaries and overview (easier to scan)
   - Lists for filtered results (medium density)
   - Tables for dense operational data (expert users)

#### DON'T:
1. **Rainbow color:** Color for aesthetic reasons
   - Looks playful; feels unprofessional in mission control
   - Hard to distinguish when colorblind
   - Example: Gradient backgrounds, per-agent color coding (use status instead)

2. **Motion overload:** Animations for every state change
   - Distracts from data changes
   - Slows perception (user waits for animation, then reads)
   - Example: Slide-in panels, spinning icons, fade-outs

3. **Low contrast:** Light gray on white, small text
   - Unreadable from monitoring distance (2+ feet)
   - Accessibility violation (WCAG AA fails)

4. **Visual inconsistency:** Different card styles, spacing, borders
   - Makes UI feel unpolished
   - User can't predict where to look

---

### Interaction Model Patterns

#### DO:
1. **Progressive disclosure:** Show summary; detail on demand
   - Click card → expand in place or open sidebar
   - Reduces initial cognitive load
   - Example: Linear.app (click issue → sidebar), Vercel (click deployment → details)

2. **Keyboard shortcuts:** Power users can bypass mouse
   - Cmd+K = global search
   - Tab = navigate cards
   - Enter = drill into detail
   - Example: Bloomberg, Linear.app

3. **Undo/rollback:** Reversible actions (no confirmation modals for read-only)
   - Pause agent = click once, resume = click once
   - Modify filter → shows results, then "undo" link if wrong
   - Example: Doppler (undo recent changes)

4. **Feedback loop:** Action → immediate visible feedback
   - "Pausing agent..." → spinning icon → "Paused at step 5"
   - "Copied to clipboard" → toast notification (2-3 sec, auto-dismisses)
   - Example: Vercel (build log updates in real-time)

#### DON'T:
1. **Modal dialogs for non-critical actions:** "Are you sure you want to filter by status?" (annoying)
   - OK for destructive actions (delete, abort)
   - Not OK for navigation, filtering, state changes

2. **Context switching:** Require user to open 3 tabs to understand issue
   - Should be: Status visible → drill down → see logs all in one place
   - Example: Bad = agent fails, must go to logs page, then metric page, then trace page

3. **Slow feedback:** Action taken, but user doesn't know it worked
   - API call takes 2s, no loading state
   - Log updates every 5s, user thinks it's frozen
   - Example: AgentOps avoids this with WebSocket updates

4. **One-way actions without visibility:** Pause a run, but can't see pause reason
   - All actions should be loggable/auditable
   - User should see: "Paused by Eric at 3:45 PM due to cost overage"

---

### Data Density Patterns

#### DO:
1. **Responsive density:** Card on mobile, table on desktop
   - Mobile: 2-3 data points per card
   - Tablet: 5-6 data points per card
   - Desktop: 10-12 data points per card (if necessary)
   - Example: Linear.app (responsive Kanban)

2. **Collapsible sections:** Hide secondary data by default
   - "Show advanced metrics" → reveals sparklines, historical trends
   - Keeps initial view clean
   - Example: Langfuse (collapsible trace spans)

3. **Horizontal scrolling within cards:** If unavoidable, isolate it
   - Don't force horizontal scroll on entire page
   - Use within a contained table/section
   - Example: Trading platforms (necessary evil)

4. **Pagination + infinite scroll:** Show first 20 items, load next 20 on scroll
   - Faster initial load
   - Less overwhelming
   - Example: Linear.app (Kanban columns with scroll)

#### DON'T:
1. **Show everything:** 100 columns, no way to hide
   - Cognitive overload
   - User gets lost
   - Example: Spreadsheet-style dashboards

2. **Horizontal scroll on main page:** Forces side-to-side navigation
   - Breaks responsive design
   - Accessibility issue (keyboard navigation is painful)

3. **Scrolljacking:** Auto-scroll log output while user is reading
   - User misses important events
   - Feels out of control
   - Example: Vercel (good: has pause button)

4. **No filtering for dense data:** Show 1000 events with no search
   - Requires extensive scrolling
   - User can't find relevant data

---

### Operational Sophistication Patterns

#### DO:
1. **Predictive alerts:** "Cost will exceed budget in 2 hours" (not just "Over budget")
   - Gives operator time to respond
   - Prevents cascading failures
   - Example: Bloomberg (30-sec fuel warning)

2. **Alert aggregation:** Group related alerts (don't spam 100 notifications)
   - "5 agents failed in project X" (not 5 separate alerts)
   - Reduce alert fatigue
   - Example: NOC pattern (suppress child alerts if parent fails)

3. **Audit trail:** Every action logged with who/when/why
   - Essential for compliance
   - Helps with troubleshooting
   - Example: Doppler, Langfuse (change logs)

4. **Customizable views:** Power users can arrange/hide elements
   - Different roles need different data
   - Example: AgentOps (filterable dashboard), Linear.app (custom views)

#### DON'T:
1. **Alert storm:** 100+ alerts per minute (unusable)
   - Set thresholds to reduce noise
   - Test alerts before deployment

2. **Black-box decisions:** Auto-actions without visibility
   - Example: Agent pauses automatically, but no log entry
   - Always show: who/what/when/why for auto-actions

3. **No audit trail:** Can't trace back why something happened
   - Essential for debugging and compliance
   - Example: "Agent stopped, but no log" = bad

4. **Fixed layout:** User can't customize for their workflow
   - Power users want to rearrange
   - Example: Langfuse's sidebar is fixed (could be better)

---

## Current ClawCommand Assessment

### Strengths

1. **Agent visibility is solid**
   - Real-time status updates work well
   - Drill-down from overview → agent detail is intuitive
   - Color coding (running, idle, failed) is semantic

2. **Real-time responsiveness**
   - WebSocket updates feel snappy
   - No lag between action and feedback
   - Log streaming works

3. **Information architecture is 3-level** (good foundation)
   - Overview (all agents) → Focused (project agents) → Detail (single agent logs)
   - Hierarchy is clear and navigable

### Weaknesses

1. **No operational hierarchy / alert prioritization**
   - All agents equally visible (no "critical failures first")
   - No predictive alerts (e.g., "cost will overage in 2 hours")
   - No alert aggregation (100 failed steps = 100 notifications)

2. **Factory Floor missing**
   - No overview of "what's broken right now"
   - No incident queue or triage workflow
   - User must click into each project to see status

3. **Workflow execution context lacking**
   - Can see individual agent runs, but not workflow as a whole
   - No timeline view of multi-step workflows
   - Drill-down from workflow → steps → logs is clunky

4. **Budget/cost control invisible**
   - No cost per agent, per workflow, per project
   - No budget alerts
   - No cost trend visualization
   - Critical for enterprise users tracking spend

5. **Customization missing**
   - Layout is fixed
   - Can't hide/show columns
   - Power users can't optimize for their workflow
   - No saved filters ("show failures in project X from last 24h")

6. **Audit trail incomplete**
   - Can see agent outputs, but not: who triggered it, why, approval status
   - No change history for configs
   - Compliance gaps

### Specific UI/UX Gaps

1. **No workspace-level overview**
   - Where's the "all projects" dashboard?
   - Quick health check (X agents running, Y failed, Z queued)?

2. **No filtering on main view**
   - Hard-coded status columns
   - Can't search across all agents

3. **Cost visibility is nil**
   - No per-run cost estimate
   - No cumulative spend tracker
   - No budget threshold alerts

4. **Workflow drill-down is deep**
   - 4+ clicks to get from workflow → single step output
   - Should be 2-3 clicks max

5. **No keyboard navigation**
   - Mouse-only interaction
   - Power users want shortcuts

---

## Design Evolution Recommendations for Phase 2

### Phase 2A: Factory Floor (Overview Dashboard)

**Goal:** Give operator instant health check of entire workspace in < 5 seconds.

**Key sections:**
1. **Status band (top):** 
   - "3 agents running | 2 paused | 5 idle | 1 failed"
   - Click to filter by status
   - Shows update timestamp ("Updated 10s ago")

2. **Project cards (main area):**
   - Per-project summary: [Project Name] [Status Badge] [Agent Count] [Recent Cost]
   - Color-coded by worst agent status in project
   - Click to drill into project (opens Factory Floor for that project)

3. **Alerts/Incidents (right sidebar):**
   - Ordered by severity: Critical, Warning, Info
   - "Agent X exceeded cost budget by $50"
   - "Workflow Y stalled for 15min (no progress)"
   - Click alert to jump to relevant agent

4. **Quick actions (floating button):**
   - "+ New Agent" or "+ Run Workflow"
   - Don't bury in menu

**Design principles:**
- All info fits on one 1920×1080 screen (no scrolling)
- Status badge = color + icon (accessible to colorblind)
- Real-time updates (WebSocket) with subtle visual feedback
- Keyboard: Arrow keys to navigate projects, Enter to drill down

**Reference:** Vercel (project list), Linear.app (overview with status), Bloomberg (market summary)

---

### Phase 2B: Workflow Builder & Execution Timeline

**Goal:** Show multi-step workflow as visual timeline; easy to see where delays occur.

**Key sections:**
1. **Timeline view (main):**
   - Horizontal timeline, each step = box
   - [Step 1: Running (3s)] → [Step 2: Queued (5s)] → [Step 3: Not started]
   - Color: Green (done), Yellow (running), Gray (queued), Red (failed)
   - Hover over step → see logs (tooltip or sidebar)

2. **Workflow controls (top):**
   - Pause / Resume buttons (large, obvious)
   - Rollback to step (skip steps 4-8, restart at step 3)
   - Re-run this workflow

3. **Step detail (sidebar):**
   - Click step → shows logs in right sidebar
   - Input/output for that step
   - Cost for that step (e.g., "$0.12 for 400 tokens")
   - Execution time

**Design principles:**
- Spatial layout = logical flow (left to right = first to last)
- Color = status (no text-only status)
- No scrolling on timeline (fit 8-12 steps on screen)
- Responsive: Mobile collapses to vertical timeline

**Reference:** Vercel (build log timeline), NASA (checklist linked to telemetry), Langfuse (trace span visualization)

---

### Phase 2C: Budget Control & Cost Tracking

**Goal:** Make cost visibility as important as agent status.

**Key sections:**
1. **Budget meter (top of Factory Floor):**
   - "Monthly budget: $2,000 | Used: $1,200 (60%) | Remaining: $800"
   - Color-coded: Green < 70%, Yellow 70-90%, Red > 90%
   - Trend sparkline (cost over last 7 days)

2. **Cost breakdown table (expandable section):**
   - Per-agent cost (last 7 days)
   - Per-project cost (last 30 days)
   - Per-model cost (e.g., "Claude 3.5 Sonnet: $800, GPT-4: $300")
   - Filterable by time range

3. **Cost alerts (in Alerts sidebar):**
   - "Agent X spent $50 in last hour (2x typical)"
   - "Project Y will exceed monthly budget in 3 days at current run rate"
   - "GPT-4 usage spiked 40% (investigate overage)"

4. **Cost per run (in agent detail):**
   - Each run shows estimated cost before starting
   - Actual cost after completion
   - Cost breakdown: "400 input tokens @ $0.30/1M = $0.12"

**Design principles:**
- Cost always visible (not hidden behind clicks)
- Predictive alerts (not just "over budget")
- Comparison context (vs. last week, vs. budget allocation)
- Exportable cost reports (for finance team)

**Reference:** AgentOps (cost tracking), Doppler (environment cost), Vercel (analytics)

---

### Phase 2D: Audit Trail & Compliance

**Goal:** Satisfy enterprise compliance: who did what, when, why, approved by whom.

**Key sections:**
1. **Activity log (new tab):**
   - Timestamp | Actor | Action | Details | Impact
   - Example: "2026-03-23 15:23 | eric@company.com | Triggered workflow X | Cost: $5.23 | Completed in 45s"
   - Searchable by actor, action, date range

2. **Approval workflow (if RBAC is enabled):**
   - High-cost runs require approval
   - "Pending approval" state with comment field
   - Audit: who approved, when, approval reason

3. **Config change history (per agent/workflow):**
   - Every config change logged
   - Diff view (old vs. new)
   - Rollback button (revert config to previous version)

**Design principles:**
- Immutable log (no deletions, only versions)
- Timestamp = server time (not client), in UTC
- Accessible to admins only (unless user is viewing own activity)

**Reference:** Doppler (change log), Langfuse (activity tab)

---

## Specific UI/UX Decisions for Implementation

### 1. Navigation Structure (Sidebar vs. Top Nav)
**Decision:** Sidebar (persistent, scoped filters don't reset)
- Left sidebar: Workspace, Projects, Saved Filters
- Top nav: Search, Settings, Notifications
- Rationale: Langfuse pattern works well; top nav gets crowded

### 2. Color Palette (Mission Control)
**Decision:** Dark background + semantic color
- Background: #0f1419 (dark, not pure black)
- Success: #10b981 (green)
- Warning: #f59e0b (amber)
- Critical: #ef4444 (red)
- Neutral: #6b7280 (gray)
- Rationale: Reduce eye strain, semantic meaning

### 3. Card vs. Table for Data Display
**Decision:** Cards for overview, tables for detail
- Factory Floor: Project cards (large, scannable)
- Project detail: Agent list (table, dense)
- Agent detail: Run log (card-based timeline)
- Rationale: Progressive disclosure; responsive design

### 4. Real-time Update Strategy
**Decision:** WebSocket for active views, polling for background
- Active dashboard: WebSocket (visible update immediately)
- Background tab: Poll every 5s (cheaper than WebSocket)
- Rationale: Responsive for operators, efficient for system

### 5. Alert Notification Routing
**Decision:** Severity-based, aggregated, with "snooze" option
- Critical: Immediate toast + badge
- Warning: Batch every 30s (don't spam)
- Info: Only in sidebar, not notifications
- User can snooze alert for 1h / until resolved
- Rationale: AgentOps/NOC patterns reduce alert fatigue

### 6. Customization & Saved Filters
**Decision:** Sidebar "Saved Filters" + drag-to-reorder dashboard cards
- "Show failures last 24h" = saved filter (2 clicks to activate)
- Dashboard card order = drag-to-reorder (persisted to user profile)
- Rationale: Power users get customization; new users get smart defaults

### 7. Keyboard Navigation
**Decision:** CMD+K for global search, Tab for card navigation, arrow keys for project nav
- CMD+K: Opens search modal (agents, workflows, runs, logs)
- Tab: Move focus between cards
- Arrow keys: Navigate sidebar (projects)
- Enter: Drill into detail
- ESC: Back / close modal
- Rationale: Bloomberg-style keyboard-first for power users

### 8. Mobile Responsiveness
**Decision:** Single-column layout on mobile, sidebar collapses to hamburger
- Factory Floor: Stacked project cards (one per row)
- Agent detail: Simplified (status, logs, no cost table)
- Workflow timeline: Vertical (not horizontal)
- Rationale: Most operators use desktop for monitoring; mobile is secondary

---

## Critical Success Metrics for Phase 2

1. **Time to first concern:** < 5 seconds from login to "knowing what's broken"
2. **Drill-down clicks:** Max 3 clicks from overview to root cause
3. **Alert fatigue:** Ops team should see < 10 alerts per day (after aggregation)
4. **Keyboard power-users:** 30% of operators should use search/shortcuts regularly
5. **Cost visibility adoption:** 90% of teams should set budget alerts within first month
6. **Customization uptake:** 50% of power users should save > 3 custom filters

---

## Implementation Roadmap

**Phase 2A (Factory Floor):** 3 weeks
- Status band + project cards
- Alert sidebar
- Alert aggregation logic

**Phase 2B (Workflow Timeline):** 4 weeks
- Timeline visualization
- Step drill-down
- Rollback to step UI

**Phase 2C (Budget Control):** 2 weeks
- Budget meter + cost table
- Cost alerts
- Cost per-run tracking

**Phase 2D (Audit Trail):** 2 weeks
- Activity log tab
- Config change history
- Approval workflow (if RBAC exists)

**Total Phase 2:** 11 weeks (~3 months)

---

## Conclusion

Premium mission control dashboards succeed by:
1. **Ruthless prioritization:** Show the 20% of data that matters; hide the 80%
2. **Clear hierarchy:** Overview → concern → action; max 3 levels deep
3. **Semantic design:** Color = status, layout = relationships
4. **Proactive alerts:** Predict problems, don't just report them
5. **Power-user ergonomics:** Keyboard navigation, saved filters, customization

ClawCommand's Phase 2 should focus on Factory Floor (overview) and Budget Control (enterprise-critical). Timeline view and Audit Trail can follow in Phase 3.

The goal: operators should be able to:
- **Glance** at Factory Floor and know workspace health in 5 seconds
- **Click once** to drill into any concern
- **See cost implications** at every decision point
- **Understand history** (who did what, when, why)

This positions ClawCommand as an enterprise-grade mission control platform, not just an agent monitoring tool.

---

**Research completed:** 2026-03-23 03:45 UTC  
**Next phase:** Design mockups and interaction prototypes (Phase 2A)
