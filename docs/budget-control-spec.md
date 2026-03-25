# Budget Control & Cost Tracking Specification

**Phase:** 2 (Design Evolution & Specs)  
**Date:** 2026-03-23  
**Status:** Production-Ready Specification  
**Audience:** Product & Engineering Teams (Phase 3 Implementation)

---

## Executive Summary

Budget Control is the **cost visibility and governance layer** for ClawCommand. It provides:
- Real-time cost tracking (per-agent, per-workflow, per-model)
- Budget alerts (exhaustion, cost spike, threshold breach)
- Spend forecasting (project spend with current burn rate)
- Per-run cost breakdown (token count, API costs, model routing)
- Integration with OpenClaw session tracking and model pricing

This is a **high-priority feature** for enterprise users tracking LLM spend.

---

## User Stories

### Primary User: Finance Lead Reconciling Monthly Spend
**Who:** Eric (monitoring cash flow across 3 ventures)  
**What:** See total LLM spend YTD, broken down by project and model  
**Why:** Need to forecast Q2 spend, inform roadmap investment decisions  

**Acceptance criteria:**
- Dashboard shows: Monthly budget, Used YTD, Projected total, Burn rate
- Per-project breakdown: Cost, % of budget, trend (up/down)
- Per-model breakdown: GPT-4 vs Claude vs Gemini costs
- Can set budget thresholds: Alert at 70%, 90%, 100%
- Can export spend report (CSV) for accounting

### Secondary User: Project Manager Controlling Runaway Costs
**Who:** Product lead for BodyPulse  
**What:** See that BodyPulse spend spiked 40% this week, identify root cause  
**Why:** Need to optimize agent prompts or reduce execution frequency  

**Acceptance criteria:**
- See cost trend graph (last 30 days) with anomaly detection
- Click on spike date → see which agents ran that day
- Identify expensive agent (Agent-X costs $50/day vs others at $5/day)
- Set per-agent cost limit: Alert if Agent-X exceeds $10/day

### Tertiary User: Operations Lead Preventing Budget Exhaustion
**Who:** Operations team member  
**What:** Monthly budget is $2,000; at day 15, already spent $1,200  
**Why:** Need to pause low-priority workflows before month-end  

**Acceptance criteria:**
- Alert: "At current burn rate, budget exhausted in 8 days"
- Can see which workflows are expensive (sort by cost)
- Can toggle workflows "active/paused" to control spend
- Can set emergency threshold: Pause all workflows at 80% budget

---

## Wireframe: Budget Control Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ ClawCommand  [Search]  [Settings]  [User]                     │
├─────────────────────────────────────────────────────────────────┤
│ [Factory Floor] [Workflows] [Budget Control] [Audit]             │
│                                                                  │
│ BUDGET OVERVIEW (Top cards)                                     │
│ ┌────────────────┬────────────────┬────────────────┐             │
│ │ Monthly Budget │ Used MTD       │ Remaining      │             │
│ │ $2,000         │ $1,240 (62%)   │ $760           │             │
│ │                │ [████░░░░░░░░] │               │             │
│ └────────────────┴────────────────┴────────────────┘             │
│ ┌────────────────┬────────────────┬────────────────┐             │
│ │ Burn Rate      │ Days Until 100%│ Projected Total│             │
│ │ $42.50/day     │ ~18 days       │ $1,462 (73%)   │             │
│ │ [Trend: ↑ +5%] │ [Alert: ⚠️ Low]│ [✓ Under budget]            │
│ └────────────────┴────────────────┴────────────────┘             │
│                                                                  │
│ SPEND TREND GRAPH (Last 30 days)                                │
│ Cost                                                             │
│ │     ╱╲                                                         │
│ │    ╱  ╲  ╱╲                                                    │
│ │───╱────╲╱──╲───────────────────────────────                   │
│ └─────────────────────────────────────────────────→ Date        │
│                                                                  │
│ [Anomaly detected: +40% on 2026-03-20]                          │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ PER-PROJECT BREAKDOWN (Table)                                   │
│ Project      │ MTD     │ % Budget │ Trend  │ Avg/Day │ Actions │
│ ─────────────┼─────────┼──────────┼────────┼─────────┼─────────│
│ BodyPulse    │ $245.32 │ 12.3%    │ ↑+12%  │ $12.27  │ [...]   │
│ TradeNavAI   │ $189.45 │ 9.5%     │ ↓-5%   │ $9.47   │ [...]   │
│ ClawCommand  │ $112.08 │ 5.6%     │ ↔ 2%   │ $5.60   │ [...]   │
│ Cedar Ridge  │ $45.23  │ 2.3%     │ ↓-8%   │ $2.26   │ [...]   │
│ ─────────────┴─────────┴──────────┴────────┴─────────┴─────────│
│ [Expand BodyPulse]                                              │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ PER-MODEL BREAKDOWN (Expanded)                                  │
│ Model              │ Cost   │ % of Total │ Tokens (M) │ Avg Cost │
│ ─────────────────────────────────────────────────────────────── │
│ GPT-4-Turbo        │ $542   │ 43.7%      │ 1.2M       │ $0.45/M  │
│ Claude 3.5 Sonnet  │ $450   │ 36.3%      │ 2.1M       │ $0.21/M  │
│ Gemini 2.0 Flash   │ $180   │ 14.5%      │ 1.8M       │ $0.10/M  │
│ GPT-4-Mini         │ $68    │ 5.5%       │ 0.8M       │ $0.085/M │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ ALERT RULES (Right sidebar)                                    │
│ [Budget Exhaustion Threshold]                                   │
│ ☑ Alert at 70%: $1,400  [✓ Enabled]                             │
│ ☑ Alert at 90%: $1,800  [✓ Enabled]                             │
│ ☑ Pause workflows at 100%: [✓ Enabled]                          │
│                                                                  │
│ [Cost Spike Threshold]                                          │
│ ☑ Alert if daily cost > +50%: [✓ Enabled]                       │
│ ☑ Alert if project cost > +40%: [✓ Enabled]                     │
│                                                                  │
│ [Per-Agent Limit]                                               │
│ Agent-X max cost/day: $10.00  [Edit]                            │
│ ☑ Pause agent if exceeded: [✓ Enabled]                          │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ COST ALERTS (Last 7 days)                                       │
│ 2026-03-23 15:30 | 🟠 WARNING | BodyPulse cost spike +40%       │
│ 2026-03-22 09:15 | 🔵 INFO    | Daily cost: $42.50 (normal)     │
│ 2026-03-21 14:00 | 🔵 INFO    | Agent-X exceeded limit ($10.50) │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Budget Configuration

```json
{
  "budget_config_id": "cfg-001",
  "workspace_id": "ws-001",
  "monthly_budget_usd": 2000,
  "budget_start_date": "2026-03-01",
  "budget_end_date": "2026-03-31",
  "alerts": {
    "exhaustion_thresholds": [
      { "percentage": 70, "enabled": true, "notify_at_percentage": 0.7 },
      { "percentage": 90, "enabled": true, "notify_at_percentage": 0.9 }
    ],
    "cost_spike_threshold": {
      "daily_increase_percent": 50,
      "enabled": true
    },
    "project_spike_threshold": {
      "project_increase_percent": 40,
      "enabled": true
    },
    "auto_pause_at_percent": 100
  },
  "per_agent_limits": [
    {
      "agent_id": "agent-x",
      "daily_cost_limit_usd": 10.00,
      "enabled": true,
      "auto_pause_if_exceeded": true
    }
  ]
}
```

### Cost Summary (Daily)

```json
{
  "date": "2026-03-23",
  "workspace_id": "ws-001",
  "cost_summary": {
    "total_cost_usd": 42.50,
    "tokens_input": 125000,
    "tokens_output": 45000,
    "api_calls": 87
  },
  "by_project": {
    "proj-bodypulse": {
      "cost_usd": 18.50,
      "tokens_input": 60000,
      "tokens_output": 20000,
      "api_calls": 35
    },
    "proj-tradenav": {
      "cost_usd": 15.30,
      "tokens_input": 50000,
      "tokens_output": 18000,
      "api_calls": 30
    },
    "proj-clawcommand": {
      "cost_usd": 8.70,
      "tokens_input": 15000,
      "tokens_output": 7000,
      "api_calls": 22
    }
  },
  "by_model": {
    "gpt-4-turbo": {
      "cost_usd": 18.90,
      "tokens_input": 80000,
      "tokens_output": 12000
    },
    "claude-3-5-sonnet": {
      "cost_usd": 15.20,
      "tokens_input": 45000,
      "tokens_output": 20000
    },
    "gemini-2-0-flash": {
      "cost_usd": 8.40,
      "tokens_input": 0,
      "tokens_output": 13000
    }
  }
}
```

### Per-Run Cost Breakdown

```json
{
  "execution_id": "exec-abc123",
  "run_timestamp": "2026-03-23T15:30:42Z",
  "total_cost_usd": 2.34,
  "cost_breakdown": {
    "model_used": "gpt-4-turbo",
    "tokens_input": 2200,
    "tokens_output": 450,
    "input_cost_usd": 0.066,
    "output_cost_usd": 0.054,
    "api_call_cost_usd": 0.00,
    "markup_percent": 10,
    "total_with_markup_usd": 2.34
  },
  "cost_estimate_vs_actual": {
    "estimated_cost_usd": 2.30,
    "actual_cost_usd": 2.34,
    "variance_percent": 1.7
  }
}
```

### API Endpoints

#### GET /api/budget/summary
Returns current month budget status.

**Query params:**
- `date`: YYYY-MM-DD (defaults to today)
- `include`: "trend,forecast,alerts"

**Response:**
```json
{
  "monthly_budget_usd": 2000,
  "used_mtd_usd": 1240,
  "remaining_usd": 760,
  "remaining_percent": 38,
  "burn_rate_daily_usd": 42.50,
  "burn_rate_trend": "up_5_percent",
  "days_until_exhaustion": 18,
  "projected_total_usd": 1462,
  "projected_percent": 73,
  "alerts_active": 2,
  "last_updated_at": "2026-03-23T15:30:00Z"
}
```

#### GET /api/budget/trend
Returns cost trend (daily) over a date range.

**Query params:**
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `group_by`: "daily" | "weekly" | "monthly"

**Response:**
```json
{
  "trend_data": [
    { "date": "2026-02-23", "cost_usd": 35.20, "anomaly": false },
    { "date": "2026-02-24", "cost_usd": 38.50, "anomaly": false },
    { "date": "2026-02-25", "cost_usd": 52.30, "anomaly": true },
    { ... }
  ],
  "avg_daily_cost_usd": 40.15,
  "max_daily_cost_usd": 52.30,
  "anomalies": [
    { "date": "2026-02-25", "cost_usd": 52.30, "percent_increase": 36 }
  ]
}
```

#### GET /api/budget/by-project
Returns per-project cost breakdown.

**Query params:**
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `sort`: "cost" | "name" | "trend"

**Response:**
```json
{
  "projects": [
    {
      "project_id": "proj-bodypulse",
      "name": "BodyPulse",
      "cost_usd": 245.32,
      "percent_of_budget": 12.3,
      "avg_daily_cost_usd": 12.27,
      "trend": "up",
      "trend_percent": 12
    },
    { ... }
  ]
}
```

#### GET /api/budget/by-model
Returns per-model cost breakdown.

**Response:**
```json
{
  "models": [
    {
      "model_id": "gpt-4-turbo",
      "cost_usd": 542.00,
      "percent_of_total": 43.7,
      "tokens_input": 1200000,
      "tokens_output": 150000,
      "price_per_1m_tokens_input": 10.00,
      "price_per_1m_tokens_output": 30.00
    },
    { ... }
  ]
}
```

#### GET /api/executions/{execution_id}/cost
Returns per-run cost breakdown.

**Response:**
```json
{
  "execution_id": "exec-abc123",
  "model_used": "gpt-4-turbo",
  "tokens_input": 2200,
  "tokens_output": 450,
  "total_cost_usd": 2.34,
  "cost_breakdown": { ... }
}
```

#### POST /api/budget/config
Creates or updates budget config and alert rules.

**Request:**
```json
{
  "monthly_budget_usd": 2500,
  "alerts": { ... }
}
```

**Response:**
```json
{
  "budget_config_id": "cfg-001",
  "monthly_budget_usd": 2500,
  "alerts": { ... }
}
```

#### WebSocket: /ws/budget/live
Real-time updates to cost summary and alerts.

**Messages:**
```json
{
  "type": "cost_update",
  "payload": {
    "cost_usd": 2.34,
    "total_mtd_usd": 1242.34,
    "percent_of_budget": 62.1
  }
}
```

```json
{
  "type": "alert_threshold_crossed",
  "payload": {
    "threshold_type": "exhaustion",
    "threshold_percent": 70,
    "current_percent": 70.1,
    "alert_severity": "warning"
  }
}
```

---

## Interaction Flows

### Flow 1: Set Monthly Budget & Thresholds

1. Finance lead clicks [Budget Control] tab
2. Sees default budget ($2,000)
3. Clicks [Edit budget] → modal form:
   ```
   Monthly budget: $2,000
   Alert at 70%: ☑ Enabled
   Alert at 90%: ☑ Enabled
   Pause workflows at 100%: ☑ Enabled
   ```
4. Changes budget to $2,500, disables 70% alert
5. Clicks [Save]
6. Config saved, page refreshes with new budget

### Flow 2: Identify Cost Spike

1. Operator sees on Factory Floor: Cost +40% (red alert)
2. Clicks alert → navigates to Budget Control
3. Cost trend graph highlights spike on 2026-03-20
4. Below graph, breakdown shows: BodyPulse +40%, others stable
5. Expands BodyPulse → sees Agent-X cost $50/day (vs normal $5/day)
6. Realizes recent prompt change increased tokens
7. Updates prompt, cost should normalize

### Flow 3: Set Per-Agent Cost Limit

1. Operations lead identifies Agent-X as expensive
2. In Budget Control, finds [Per-Agent Limit] section
3. Enters: "Agent-X max cost/day: $10.00"
4. Enables: "Auto-pause if exceeded"
5. Saves
6. Next time Agent-X exceeds $10/day, it auto-pauses
7. Alert is sent to Slack/email

### Flow 4: Forecast Spend & Plan Accordingly

1. On March 15, budget is $2,000, already spent $1,000
2. Burn rate: $50/day → projected total: $1,500 (if constant)
3. Budget Control shows: "18 days until exhaustion at current rate"
4. Finance lead decides to reduce scope or increase budget
5. Adjusts project priorities → pauses low-priority workflows
6. Re-calculates forecast → now shows 25 days until exhaustion

### Flow 5: Export Cost Report

1. Finance lead clicks [Export] button
2. Options: "CSV" or "JSON"
3. Selects CSV → downloads file with:
   - Monthly summary (budget, used, remaining)
   - Daily breakdown (date, cost, project, model)
   - Anomalies (spike dates)
   - Alert history
4. Imports into accounting system

---

## Detailed Component Specs

### Budget Meter Card

**Visual:** Horizontal progress bar  
**Content:**
```
Monthly Budget: $2,000
Used: $1,240 (62%) | Remaining: $760 (38%)
[████████░░░░░░░░] (filled to 62%)
```

**Colors:**
- 0-70%: Green (#10b981)
- 70-90%: Amber (#f59e0b)
- 90-100%: Red (#ef4444)

**Interactions:**
- Hover → shows exact cost ($1,240.32)
- Click → opens budget settings modal

### Cost Trend Graph

**Library:** Recharts LineChart  
**X-axis:** Date (last 30 days)  
**Y-axis:** Daily cost (USD)  
**Line color:** Green (normal), Red (anomaly)  
**Anomaly detection:** Days where cost > avg + 1.5 * std_dev  
**Tooltip:** Hover → shows exact cost, tokens, API calls for that day  

**Annotations:**
- Red vertical line on anomaly dates
- Label: "+40% on 2026-03-20"

### Per-Project Table

**Columns:** Project | MTD Cost | % Budget | Trend | Avg/Day | Actions  
**Sorting:** Click column header to sort  
**Row interactions:**
- Click row → expand to show agents in that project
- Right-click → context menu (View agents, Set limit, Drill down)

**Expansion (Sub-rows):**
```
BodyPulse     | $245.32 | 12.3% | ↑+12% | $12.27 | [...]
  Agent-001   |  $50.23 | 2.5%  | ↑+20% | $2.51  | [...]
  Agent-002   |  $40.10 | 2.0%  | ↑+5%  | $2.01  | [...]
  Agent-003   |  $30.80 | 1.5%  | ↔ 0%  | $1.54  | [...]
```

### Cost Spike Detector

**Algorithm:**
```
1. Calculate 7-day moving average: avg_7d
2. Calculate standard deviation: std_dev_7d
3. For each day: if cost > avg_7d + 1.5 * std_dev_7d → anomaly
4. Show alert: "Cost spike on [date]: +[percent]%"
```

**UI Feedback:**
- Red dot on trend graph
- Tooltip with details
- "Investigate" button → drill down to that day's executions

### Alert Rules Configuration

**Location:** Right sidebar (sticky)  
**Sections:**
1. Budget Exhaustion (checkboxes + thresholds)
2. Cost Spike Detection (toggle + % threshold)
3. Per-Agent Limits (table)
4. Per-Project Limits (table)

**Example:**
```
[☑] Alert at 70% budget ($1,400)
[☑] Alert at 90% budget ($1,800)
[☑] Auto-pause at 100% budget
```

**Save behavior:** Changes persist immediately (API call on change)

---

## Mobile-Specific Design

### Portrait View (320-640px)

```
┌────────────────────────────────┐
│ Budget Control                 │
├────────────────────────────────┤
│ SUMMARY CARDS (Stacked)        │
│ ┌─────────────────────────────┐│
│ │ $2,000 Budget              ││
│ │ $1,240 Used (62%)          ││
│ │ $760 Remaining             ││
│ └─────────────────────────────┘│
│ ┌─────────────────────────────┐│
│ │ $42.50/day burn rate       ││
│ │ ~18 days left              ││
│ │ $1,462 projected total     ││
│ └─────────────────────────────┘│
├────────────────────────────────┤
│ TREND GRAPH (Simplified)       │
│ [Chart with 1.5x height zoom] │
├────────────────────────────────┤
│ PER-PROJECT (Collapsed)        │
│ [BodyPulse: $245 ↑+12%]        │
│ [TradeNavAI: $189 ↓-5%]        │
│ [Show all projects]            │
├────────────────────────────────┤
│ ALERTS                         │
│ [2026-03-23] Spike +40%        │
│ [View all alerts]              │
│                                │
│ [Settings] [Export]            │
└────────────────────────────────┘
```

**Changes:**
- Summary cards stack vertically
- Trend graph height: auto (scrollable if needed)
- Per-project table → collapsed list (expandable)
- Alert rules → bottom sheet modal

---

## Implementation Notes

### Tech Stack

- **Frontend:** React 18+ with TanStack Query
- **Charts:** Recharts (lightweight, responsive)
- **Real-time:** Socket.io for cost updates
- **Storage:** Backend cost DB (PostgreSQL with fast time-series queries)

### Model Pricing Lookup

Each model has a fixed price (updated monthly):

```json
{
  "model_id": "gpt-4-turbo",
  "provider": "openai",
  "price_input_per_1m_tokens": 10.00,
  "price_output_per_1m_tokens": 30.00,
  "effective_date": "2026-03-01"
}
```

When calculating cost:
```
cost = (tokens_input / 1000000) * price_input + (tokens_output / 1000000) * price_output
```

### OpenClaw Session Tracking Integration

ClawCommand tracks all model API calls via OpenClaw's telemetry layer. Each execution logs:
- `execution_id` (unique per run)
- `model_used` (e.g., "gpt-4-turbo")
- `tokens_input`, `tokens_output`
- `timestamp`

Backend aggregates these into daily cost summaries.

### Performance Considerations

1. **Trend graph:** Only fetch last 30 days (avoid huge datasets)
2. **Per-project table:** Paginate (show first 10, load next on scroll)
3. **Cost alerts:** Cache alert config (don't fetch on every page load)
4. **WebSocket throttling:** Batch cost updates every 30s (avoid spam)

### Common Gotchas

**Gotcha 1: Token cost calculation**
- Different models have different input/output ratios
- GPT-4: input 3x cheaper than output; Claude: more balanced
- Always use server-side calculation (don't trust client-side math)

**Gotcha 2: Cost data freshness**
- Cost data is calculated every 30-60s (not real-time)
- Show timestamp: "Cost updated at 15:30:42Z"
- Don't claim real-time accuracy

**Gotcha 3: Multi-tenant pricing**
- If running multiple workspaces, ensure costs are scoped
- Filter by workspace_id in all queries
- Test with multiple workspaces to avoid cross-workspace leaks

**Gotcha 4: Budget period definition**
- Budget periods don't always align with calendar months
- Support custom start/end dates (e.g., "March 1 - March 31")
- Show clear dates on budget meter

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Budget overage prevention** | 0 unplanned budget exhaustion | Track cost overage incidents |
| **Cost spike detection accuracy** | 95%+ precision | Alert review, false positive rate |
| **Time to identify expensive agent** | < 5 min | Usability testing, task timing |
| **Forecast accuracy** | 85%+ (within 15% of actual) | Compare projected vs. actual at month end |
| **Alert fatigue** | < 5 false alerts/day | Alert dismissal/snooze rate tracking |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-23 | Initial Budget Control spec (Phase 2) |

---

**Next:** Implement budget dashboard, cost aggregation, and WebSocket integration in Phase 3.
