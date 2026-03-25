# ClawCommand - Claude Code Context

## Overview
Web-based mission control dashboard for OpenClaw. Provides management of AI agents, channels, tools, workflows, and system monitoring through a TRON-inspired interface. Acts as the visual command center for the OpenClaw agent gateway.

## Tech Stack
- **Frontend:** React 19 + Vite 7 + TypeScript 5.9 (strict via project references)
- **Styling:** Tailwind CSS 3.4 + shadcn/ui (Radix primitives) + tailwindcss-animate
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod v4 validation
- **Drag & Drop:** dnd-kit
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Linting:** ESLint 9 + typescript-eslint

## Architecture

```
ClawCommand/
├── app/                     # Main application
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   │   ├── FactoryFloorPage.tsx    # Real-time agent visualization
│   │   │   ├── AgentsPage.tsx          # Agent CRUD
│   │   │   ├── AgentChatPage.tsx       # Direct agent communication
│   │   │   ├── AgentSwarmPage.tsx      # Multi-agent orchestration
│   │   │   ├── SessionsPage.tsx        # Chat sessions
│   │   │   ├── TasksPage.tsx           # Kanban task board
│   │   │   ├── ChannelsPage.tsx        # Multi-channel integrations
│   │   │   ├── ToolsPage.tsx           # Tool configuration
│   │   │   ├── SkillsPage.tsx          # Skill builder
│   │   │   ├── ModelsPage.tsx          # Provider/model management
│   │   │   ├── RoutingPage.tsx         # Model routing rules
│   │   │   ├── WorkflowPage.tsx        # Visual workflow builder
│   │   │   ├── BudgetPage.tsx          # Per-agent budget control
│   │   │   ├── CronPage.tsx            # Cron scheduler
│   │   │   ├── AnalyticsPage.tsx       # Usage/cost analytics
│   │   │   ├── LogsPage.tsx            # System logs
│   │   │   ├── MemoryPage.tsx          # Agent memory management
│   │   │   ├── VoicePage.tsx           # STT/TTS integration
│   │   │   ├── QMDPage.tsx             # Quality Management Database
│   │   │   ├── SettingsPage.tsx        # System settings
│   │   │   └── MissionControlDemoPage.tsx
│   │   ├── components/      # Reusable UI components
│   │   ├── config/          # App configuration
│   │   ├── data/            # Static/mock data
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── stores/          # State management
│   │   └── types/           # TypeScript type definitions
│   ├── scripts/
│   │   ├── sync-vite-env.mjs         # Env sync for Vite
│   │   └── validate-environment-session.mjs
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json        # Project references (app + node)
│   ├── tsconfig.app.json
│   └── tsconfig.node.json
├── CLAWCOMMAND_PRD.md       # Product Requirements Document
└── CLAUDE.md                # This file
```

## NPM Scripts (run from `app/` directory)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start Vite dev server with HMR |
| `build` | `tsc -b && vite build` | Type-check + production build |
| `lint` | `eslint .` | Run ESLint |
| `preview` | `vite preview` | Preview production build |
| `test` | `vitest run` | Run unit tests |
| `test:e2e` | `playwright test` | Run end-to-end tests |
| `test:e2e:list` | `playwright test --list` | List available e2e tests |
| `validate:environment` | `node scripts/validate-environment-session.mjs` | Validate env setup |
| `sync:vite-env` | `node scripts/sync-vite-env.mjs` | Sync env vars for Vite |

Note: `predev`, `prebuild`, and `pretest` hooks auto-run `sync:vite-env`.

## OpenClaw Bridge
The Vite config includes an `openclawBridgePlugin` that proxies `/ocapi/call` POST requests to the OpenClaw CLI, enabling the dashboard to communicate with the gateway during development.

## Path Aliases
- `@/*` resolves to `./src/*`

## Current Branch
`prod-readiness-sandbox-2026-03-03`

## Deployment
Frontend-only SPA. Communicates with OpenClaw gateway via REST API bridge.

## Code Conventions
- TypeScript strict mode via project references
- ESM modules throughout
- shadcn/ui component patterns
- dnd-kit for drag-and-drop interactions
- Vitest for unit testing, Playwright for e2e
- TRON-inspired dark UI theme

## Definition of Done
1. `npm run build` succeeds (tsc + vite build) from `app/` directory
2. `npm run lint` passes with 0 errors
3. `npm run test` passes all unit tests
4. No untracked files left uncommitted
