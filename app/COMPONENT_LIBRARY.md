# ClawCommand Component Library

Enterprise UI component library for Phase 3B/3C builds.

## Design System

### Colors (Semantic)

All colors are defined in `src/lib/colors.ts` with CSS custom properties for theme switching.

- **Primary**: Main brand color (indigo)
- **Success**: Green, for positive states
- **Warning**: Yellow/amber, for caution states
- **Error**: Red, for failure/danger states
- **Info**: Blue, for informational states
- **Neutral**: Grayscale, for backgrounds and text

Dark mode is default; light mode available via CSS class.

### Typography

- Component text uses Tailwind's default font stack
- All component labels are accessible with aria-labels

### Spacing & Sizing

- Small (sm): Compact, for dense UIs
- Medium (md): Default, balanced
- Large (lg): Spacious, for emphasis

## Components

### 1. ProgressBar
Visual progress indicator, typically for budget/usage metrics.

```tsx
import { ProgressBar } from "@/components/ui/progress-bar";

<ProgressBar
  value={65}
  max={100}
  label="Budget Used"
  color="primary"
  showPercent
  animated
/>
```

**Props:**
- `value: number` - Current value
- `max?: number` - Max value (default: 100)
- `label?: string` - Display label
- `color?: "primary" | "success" | "warning" | "error" | "info"`
- `size?: "sm" | "md" | "lg"`
- `showPercent?: boolean`
- `showLabel?: boolean`
- `animated?: boolean` - Pulse animation

**Accessibility:** Full ARIA support (progressbar role, aria-valuenow, aria-valuemax)

---

### 2. Sparkline
Mini trend chart for activity/metrics over time.

```tsx
import { Sparkline } from "@/components/ui/sparkline";

<Sparkline
  data={[10, 20, 15, 25, 30, 28, 35]}
  color="success"
  height={60}
  showDots
/>
```

**Props:**
- `data: number[]` - Data points to plot
- `color?: "primary" | "success" | "warning" | "error" | "info"`
- `height?: number` - SVG height in pixels
- `width?: string` - Tailwind width class
- `showDots?: boolean` - Draw point markers
- `animate?: boolean`

**Note:** Phase 3B adds full Recharts integration for advanced charts.

---

### 3. Timeline
Workflow/process step visualization with status tracking.

```tsx
import { Timeline } from "@/components/ui/timeline";

<Timeline
  steps={[
    { label: "Build", status: "complete" },
    { label: "Test", status: "current" },
    { label: "Deploy", status: "pending" }
  ]}
  orientation="vertical"
  size="md"
/>
```

**Props:**
- `steps: TimelineStep[]` - Array of workflow steps
- `orientation?: "vertical" | "horizontal"`
- `size?: "sm" | "md" | "lg"`

**Step statuses:** "pending", "current", "complete", "error"

---

### 4. AlertBadge
Status indicator badge for surface alerts/counts.

```tsx
import { AlertBadge } from "@/components/ui/alert-badge";

<AlertBadge
  status="warning"
  label="Budget Alert"
  count={3}
  animated
  onClick={handleClick}
/>
```

**Props:**
- `status: "success" | "warning" | "error" | "info" | "neutral"`
- `label: string` - Badge label
- `count?: number` - Alert count
- `icon?: React.ReactNode`
- `size?: "sm" | "md" | "lg"`
- `animated?: boolean` - Pulse the dot

---

### 5. MetricCard
KPI display card for dashboard metrics.

```tsx
import { MetricCard } from "@/components/ui/metric-card";

<MetricCard
  title="Active Agents"
  value="12"
  unit="agents"
  trend={15}
  trendLabel="vs last hour"
  color="primary"
  layout="vertical"
  icon="⚙️"
/>
```

**Props:**
- `title: string` - Metric name
- `value: string | number` - Current metric value
- `unit?: string` - Unit suffix (e.g., "agents")
- `trend?: number` - Change percentage
- `trendLabel?: string` - Trend context
- `icon?: React.ReactNode`
- `color?: "primary" | "success" | "warning" | "error" | "info"`
- `layout?: "vertical" | "horizontal"`

---

### 6. StatusBand
Grouped status counts (e.g., 5 running, 2 failed, 8 pending).

```tsx
import { StatusBand } from "@/components/ui/status-band";

<StatusBand
  statuses={[
    { label: "Running", count: 5, status: "success" },
    { label: "Failed", count: 2, status: "error" },
    { label: "Pending", count: 8, status: "info" }
  ]}
  layout="inline"
  showTotal
/>
```

**Props:**
- `statuses: StatusItem[]` - Array of status groups
- `size?: "sm" | "md" | "lg"`
- `layout?: "inline" | "stacked"` - Display as pills or rows
- `showTotal?: boolean`

---

### 7. CollapsibleTree
Hierarchical tree for project/workflow structure.

```tsx
import { CollapsibleTree } from "@/components/ui/collapsible-tree";

<CollapsibleTree
  root={{ id: "1", label: "ClawCommand", icon: "📦" }}
  items={[
    { id: "1-1", parentId: "1", label: "Phase 3A", children: true },
    { id: "1-1-1", parentId: "1-1", label: "Core" }
  ]}
  onNodeClick={(id) => console.log(id)}
/>
```

**Props:**
- `root: TreeNode` - Root node
- `items: TreeNode[]` - All tree nodes
- `onNodeClick?: (id: string) => void`

---

### 8. RealTimeTable
Data table with real-time updates support.

```tsx
import { RealTimeTable } from "@/components/ui/real-time-table";

<RealTimeTable
  columns={[
    { id: "name", label: "Project", align: "left" },
    { id: "budget", label: "Budget", align: "right" },
    {
      id: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />
    }
  ]}
  rows={[
    { name: "Phase 3A", budget: "$50K", status: "active" }
  ]}
  loading={false}
  onRowClick={(row) => console.log(row)}
/>
```

**Props:**
- `columns: Column[]` - Table column definitions
- `rows: Row[]` - Table data rows
- `rowKey?: string` - Row identifier key (default: "id")
- `loading?: boolean` - Show loading state
- `highlight?: Set<string>` - IDs to highlight
- `onRowClick?: (row) => void`

---

### 9. KeyboardHint
Display keyboard shortcuts in UI.

```tsx
import { KeyboardHint } from "@/components/ui/keyboard-hint";

<KeyboardHint keys={["Cmd", "K"]} label="Search" />
<KeyboardHint keys={["Esc"]} />
```

**Props:**
- `keys: string[]` - Key sequence
- `label?: string` - Action label
- `size?: "sm" | "md" | "lg"`
- `variant?: "default" | "inverse"`

---

### 10. ConfirmationModal
Reusable confirmation dialog for critical actions.

```tsx
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useState } from "react";

export function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Rollback</button>

      <ConfirmationModal
        isOpen={open}
        title="Rollback Deployment"
        message="Are you sure? This will revert to v0.1"
        description="This action cannot be undone."
        confirmLabel="Rollback"
        variant="danger"
        onConfirm={async () => {
          await api.rollback();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
```

**Props:**
- `isOpen: boolean` - Modal visibility
- `title: string` - Dialog title
- `message: string` - Main message
- `description?: string` - Detailed explanation
- `confirmLabel?: string` - Confirm button text
- `cancelLabel?: string` - Cancel button text
- `variant?: "default" | "danger" | "warning"`
- `loading?: boolean` - Disable buttons while processing
- `onConfirm: () => void | Promise<void>`
- `onCancel: () => void`

---

## Layout Components

### AppLayout
Main application layout with sidebar, top bar, and content area.

```tsx
import { AppLayout } from "@/components/layout/app-layout";

<AppLayout
  topBar={<Header />}
  sidebar={<Sidebar />}
>
  <main>Content</main>
</AppLayout>
```

Features:
- Responsive sidebar (collapsible on mobile)
- Global keyboard shortcut handling (Cmd+K, Esc)
- Mobile overlay support
- Manages layout state via Zustand store

### SidebarNavigation
Collapsible navigation groups for sidebar.

```tsx
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";

<SidebarNavigation
  groups={[
    {
      id: "core",
      label: "Core",
      icon: "📦",
      items: [
        { id: "dashboard", label: "Dashboard", href: "/" },
        { id: "agents", label: "Agents", href: "/agents" }
      ],
      defaultOpen: true
    }
  ]}
  onNavigate={(id, href) => navigate(href)}
  activeItem="dashboard"
/>
```

---

## State Management

### Layout Store (Zustand)

```tsx
import { useStore } from "@/stores/layout-store";

function MyComponent() {
  const { sidebarOpen, toggleSidebar, isConnected } = useStore();

  return <button onClick={toggleSidebar}>Toggle</button>;
}
```

**Store properties:**
- `sidebarOpen: boolean` - Sidebar state
- `darkMode: boolean` - Theme mode
- `modalsOpen: Map<string, boolean>` - Modal open states
- `activeNavItem: string | null` - Current nav item
- `isConnected: boolean` - Real-time connection status

---

## Hooks

### useWebSocket
Manages WebSocket connection with exponential backoff retry.

```tsx
import { useWebSocket } from "@/hooks/useWebSocket";

const { isConnected, lastMessage, send, disconnect } = useWebSocket(
  "ws://localhost:8000",
  {
    maxRetries: 5,
    onMessage: (data) => console.log(data),
    onConnect: () => console.log("Connected"),
    onError: (err) => console.error(err)
  }
);
```

### useRealtimeData
Subscribe to agent/workflow status updates.

```tsx
import { useRealtimeData } from "@/hooks/useRealtimeData";

const { agents, workflows, isConnected } = useRealtimeData("ws://localhost:8000");
```

---

## API Client

### ApiClient
HTTP client with error handling and mock mode.

```tsx
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

// GET
const response = await apiClient.get(API_ENDPOINTS.factoryFloor.getStatus);

// POST
const result = await apiClient.post(
  API_ENDPOINTS.workflows.create,
  { name: "My Workflow" }
);

// Error handling
if (!response.success) {
  console.error(response.error);
}
```

---

## Testing

All components include unit tests with React Testing Library.

```bash
npm run test
```

**Test coverage:**
- Component rendering
- Props validation
- User interactions
- Accessibility (ARIA attributes)
- Responsive behavior

---

## Quality Gates

✓ 0 TypeScript errors (strict mode)
✓ All components have unit tests (80%+ coverage target)
✓ Accessibility: WCAG AA compliant
✓ No console errors/warnings in dev mode
✓ Lighthouse 90+ performance score (Phase 3B)

---

## Contributing

When adding new components:

1. Create component file in `src/components/ui/`
2. Export from `src/components/index.ts`
3. Write unit tests in `src/__tests__/components/`
4. Add documentation here
5. Ensure TypeScript strict mode compliance
6. Run `npm run test` and `npm run build`

---

**Last Updated:** 2026-03-22  
**Phase:** 3A (Core Implementation)
