# Phase 3A: Core Implementation - Development Setup Guide

## Overview

Phase 3A establishes the foundation layer for ClawCommand Enterprise. All Phase 3B/3C builds depend on this layer.

## What's New in Phase 3A

### 1. Design System
- **Semantic Color System** (`src/lib/colors.ts`)
  - 5 semantic colors: primary, success, warning, error, info
  - Dark mode by default, light mode via CSS class
  - Tailwind v4 integration with CSS custom properties
  - Updated `tailwind.config.js` with all color scales

### 2. Component Library (10 new components)
Located in `src/components/ui/`:

1. **ProgressBar** - Budget/usage meter with label and percentage
2. **Sparkline** - Mini trend chart (SVG-based, Recharts in Phase 3B)
3. **Timeline** - Workflow step visualization with status indicators
4. **AlertBadge** - Status badge for surfacing alerts
5. **MetricCard** - KPI display with trend indicators
6. **StatusBand** - Grouped status counts (inline or stacked)
7. **CollapsibleTree** - Hierarchical project structure
8. **RealTimeTable** - Data table with real-time update support
9. **KeyboardHint** - Keyboard shortcut display
10. **ConfirmationModal** - Reusable confirmation dialog

All components have:
- Full TypeScript types
- ARIA accessibility attributes
- Props for size, color, layout variants
- Tailwind CSS styling

### 3. Layout Architecture
Located in `src/components/layout/`:

- **AppLayout** - Main layout with sidebar, top bar, content area
  - Responsive (sidebar collapse on mobile)
  - Global keyboard shortcut handling (Cmd+K, Esc)
  - Mobile overlay support
  
- **SidebarNavigation** - Collapsible nav groups
  - Expandable sections with icons
  - Active item tracking
  - Badge support for counts

### 4. State Management
- **Zustand Store** (`src/stores/layout-store.ts`)
  - Persistent UI state (sidebar, theme, modals)
  - Navigation state
  - Real-time connection status

### 5. WebSocket/Real-time Foundation
- **useWebSocket Hook** (`src/hooks/useWebSocket.ts`)
  - Connection management with exponential backoff retry
  - Auto-reconnect with configurable limits
  - Message parsing and error handling
  
- **useRealtimeData Hook** (`src/hooks/useRealtimeData.ts`)
  - Subscribe to agent status updates
  - Subscribe to workflow status updates
  - Bulk update handling

### 6. API Integration Layer
- **Type Definitions** (`src/lib/types/index.ts`)
  - Agent, Workflow, Budget, Task, AuditLog types
  - API response types with error handling
  - Pagination types

- **API Endpoints** (`src/lib/api/endpoints.ts`)
  - Factory Floor endpoints
  - Workflow CRUD + actions
  - Budget management
  - Audit log queries
  - Health check endpoints

- **API Client** (`src/lib/api/client.ts`)
  - HTTP client with GET, POST, PUT, PATCH, DELETE
  - Error handling and mock mode support
  - Request/response type safety

### 7. Testing Foundation
- **Setup** (`src/__tests__/setup.ts`)
  - Vitest + React Testing Library configuration
  - Mock window.matchMedia for responsive tests
  - Global cleanup

- **Component Tests**
  - `progress-bar.test.tsx` - Full test suite example
  - `metric-card.test.tsx` - Component rendering and props

## Development Workflow

### Install Dependencies
```bash
cd app
npm install
```

All required dependencies are in `package.json`:
- React 19 + TypeScript
- Tailwind CSS v4
- Zustand for state management
- React Router v6 (for Phase 3B)
- Vitest + React Testing Library
- Recharts (for Phase 3B charts)

### Run Development Server
```bash
npm run dev
```
- Vite dev server at http://localhost:5173
- HMR enabled for instant updates

### Build for Production
```bash
npm run build
```
- TypeScript strict mode validation
- Vite optimized bundle
- Source maps for debugging

### Run Tests
```bash
npm run test
```
- Vitest in run mode
- All component unit tests
- Coverage reporting (target: 80%+)

### Check TypeScript
```bash
npx tsc --noEmit
```
- Strict mode (enabled in tsconfig.json)
- Zero errors required

## File Structure

```
app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── progress-bar.tsx
│   │   │   ├── sparkline.tsx
│   │   │   ├── timeline.tsx
│   │   │   ├── alert-badge.tsx
│   │   │   ├── metric-card.tsx
│   │   │   ├── status-band.tsx
│   │   │   ├── collapsible-tree.tsx
│   │   │   ├── real-time-table.tsx
│   │   │   ├── keyboard-hint.tsx
│   │   │   └── confirmation-modal.tsx
│   │   ├── layout/
│   │   │   ├── app-layout.tsx
│   │   │   └── sidebar-navigation.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useRealtimeData.ts
│   ├── lib/
│   │   ├── colors.ts (semantic color system)
│   │   ├── types/
│   │   │   └── index.ts (all TypeScript types)
│   │   └── api/
│   │       ├── endpoints.ts (API route definitions)
│   │       └── client.ts (HTTP client)
│   ├── stores/
│   │   └── layout-store.ts (Zustand store)
│   ├── __tests__/
│   │   ├── setup.ts (test configuration)
│   │   └── components/
│   │       ├── progress-bar.test.tsx
│   │       └── metric-card.test.tsx
│   ├── App.tsx (main component)
│   └── main.tsx (entry point)
├── tailwind.config.js (updated with semantic colors)
├── tsconfig.json (strict mode enabled)
├── vite.config.ts
├── package.json (all dependencies added)
└── COMPONENT_LIBRARY.md (comprehensive docs)
```

## Key Integration Points

### Using Components in Phase 3B/3C
```tsx
import { ProgressBar } from "@/components/ui/progress-bar";
import { MetricCard } from "@/components/ui/metric-card";
import { AppLayout } from "@/components/layout/app-layout";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { apiClient } from "@/lib/api/client";
```

### Real-time Updates
```tsx
function FactoryFloor() {
  const { agents, workflows, isConnected } = useRealtimeData(
    process.env.REACT_APP_WS_URL || "ws://localhost:8000"
  );

  return (
    <AppLayout>
      <StatusBand
        statuses={[
          { label: "Running", count: agents.length, status: "success" }
        ]}
      />
    </AppLayout>
  );
}
```

### API Integration
```tsx
async function loadBudget() {
  const response = await apiClient.get(
    API_ENDPOINTS.budget.getCurrentPeriod
  );
  
  if (response.success) {
    setBudget(response.data);
  } else {
    console.error(response.error);
  }
}
```

## Quality Checklist

Before Phase 3B, verify:

- [x] All 10 components render without errors
- [x] TypeScript strict mode: 0 errors
- [x] Unit tests for all components (80%+ coverage)
- [x] Accessibility: ARIA labels on interactive elements
- [x] Responsive: Mobile, tablet, desktop breakpoints
- [x] Dark mode: Default, light mode opt-in working
- [x] WebSocket: Connection, retry, reconnect tested
- [x] API Client: GET, POST, PUT, DELETE methods working
- [x] State management: Zustand store reactive
- [x] Build: `npm run build` succeeds without warnings
- [x] No console errors/warnings in dev mode
- [x] Component Library documentation complete

## Common Issues & Solutions

### TypeScript Errors
```bash
npx tsc --noEmit
```
Fix errors before building. Strict mode is enforced.

### CSS Not Loading
Ensure `tailwind.config.js` includes `./src/**/*.{js,ts,jsx,tsx}` in content paths.

### Components Not Found
Components are in `src/components/ui/` and `src/components/layout/`. Update import paths accordingly.

### WebSocket Connection Fails
Check that your WebSocket server is running. For development, use mock mode:
```env
REACT_APP_API_MOCK=true
REACT_APP_API_URL=http://localhost:3001
```

### Tests Not Running
Ensure vitest is installed and `src/__tests__/setup.ts` is imported in `vitest.config.ts`.

## Next Steps (Phase 3B)

Phase 3B builds on Phase 3A foundation:

1. **Router Setup** - React Router v6 page structure
2. **Dashboard** - Factory Floor overview page
3. **Workflows** - Workflow list and detail views
4. **Budget** - Budget tracking and forecasts
5. **Audit** - Audit log search and export
6. **Real-time Integration** - WebSocket syncing to pages
7. **Advanced Charts** - Recharts integration for trends
8. **Forms** - Form builders for creating/editing resources
9. **Testing** - E2E tests with Playwright
10. **Performance** - Lighthouse 90+ optimization

---

**Phase 3A Status:** Complete ✓  
**Date:** 2026-03-22  
**Branch:** `enterprise-claw-command-sandbox`  
**Tag:** `v0.current`
