# OpenClaw Factory Floor - Design Document

## Vision

A futuristic TRON/Aeres-style "factory floor" visualization that represents the OpenClaw agent workspace as a high-tech mission control center. Agents are visualized as workers at their stations, collaborating in real-time with glowing data flows connecting them.

## Design Inspiration

### Visual Style: TRON + Mission Control
- **Dark base**: Deep black/charcoal (#0a0a0f, #0d1117)
- **Neon accents**: 
  - Cyan (#00f0ff, #00d4ff) - Primary agent connections
  - Purple (#a855f7, #8b5cf6) - Secondary/data flows
  - Green (#10b981, #22c55e) - Active/healthy status
  - Orange (#f97316) - Warning states
  - Red (#ef4444) - Error states

### Key Visual Elements
1. **Isometric Office Grid** - Top-down view of workstations
2. **Glowing Connection Lines** - Data flowing between agents
3. **Holographic Agent Cards** - Floating info panels
4. **Animated Status Indicators** - Pulsing activity rings
5. **Particle Effects** - Data packets moving along connections

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  FACTORY FLOOR - MISSION CONTROL                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │    [Agent1]═══╗    [Agent2]                            │   │
│  │       ║       ║       ║                                │   │
│  │       ╚═══════╬═══════╝                                │   │
│  │                 ║                                      │   │
│  │    [Agent3]═════╝    [Agent4]═══╗                     │   │
│  │                                 ║                      │   │
│  │    [Agent5]════════════════════╝                     │   │
│  │                                                        │   │
│  │  ═══ Glowing data connections                         │   │
│  │  ◉◉◉ Animated activity nodes                          │   │
│  │  ▓▓▓ Workstation desks                                │   │
│  │                                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │ AGENT DETAILS   │  │ ACTIVITY FEED   │  │ SYSTEM STATS │   │
│  │ (Holographic)   │  │ (Live Stream)   │  │ (Gauges)     │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Workstation Grid
- **Layout**: Isometric or top-down hexagonal grid
- **Spacing**: 120px between stations
- **Background**: Subtle grid pattern with faint glow
- **Grid Lines**: 1px cyan at 10% opacity

### 2. Agent Station
```
┌─────────────────┐
│    ╭─────╮      │
│    │ 🤖 │      │  <- Agent Avatar (40x40)
│    ╰─────╯      │
│  ┌─────────┐    │
│  │  DESK   │    │  <- Workstation (60x40)
│  │ ▓▓▓▓▓▓▓ │    │
│  └─────────┘    │
│   Agent Name    │
│   ● Status      │  <- Status indicator
└─────────────────┘
```

### 3. Connection Lines
- **Style**: Animated SVG paths with gradient stroke
- **Animation**: Dashed line moving along path
- **Colors**: 
  - Active: Cyan gradient (transparent → #00f0ff → transparent)
  - Data flow: Purple pulse traveling along line
- **Glow**: Box-shadow/filter: drop-shadow(0 0 8px color)

### 4. Status Indicators
- **Online**: Pulsing green ring
- **Working**: Spinning cyan arc
- **Idle**: Static blue dot
- **Error**: Pulsing red X
- **Thinking**: Animated purple ripple

### 5. Holographic Info Panel
- **Style**: Glassmorphism with neon border
- **Border**: 1px gradient (cyan → purple)
- **Background**: rgba(10, 10, 15, 0.85)
- **Backdrop-filter**: blur(12px)
- **Glow**: box-shadow: 0 0 30px rgba(0, 240, 255, 0.2)

## Animations

### 1. Data Flow Animation
```css
@keyframes dataFlow {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
/* Duration: 2s, linear, infinite */
```

### 2. Status Pulse
```css
@keyframes statusPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}
/* Duration: 2s, ease-in-out, infinite */
```

### 3. Connection Glow
```css
@keyframes connectionGlow {
  0%, 100% { filter: drop-shadow(0 0 4px #00f0ff); }
  50% { filter: drop-shadow(0 0 12px #00f0ff); }
}
/* Duration: 3s, ease-in-out, infinite */
```

### 4. Hologram Flicker
```css
@keyframes hologramFlicker {
  0%, 100% { opacity: 1; }
  5% { opacity: 0.8; }
  10% { opacity: 1; }
  15% { opacity: 0.9; }
  20% { opacity: 1; }
}
/* Duration: 5s, random intervals */
```

## Color Palette

### Backgrounds
- `--bg-primary`: #0a0a0f (main background)
- `--bg-secondary`: #0d1117 (card background)
- `--bg-tertiary`: #161b22 (elevated surfaces)
- `--bg-grid`: rgba(0, 240, 255, 0.03) (grid lines)

### Accents
- `--accent-cyan`: #00f0ff (primary)
- `--accent-cyan-dim`: #00d4ff
- `--accent-purple`: #a855f7 (secondary)
- `--accent-purple-dim`: #8b5cf6
- `--accent-green`: #10b981 (success)
- `--accent-orange`: #f97316 (warning)
- `--accent-red`: #ef4444 (error)

### Text
- `--text-primary`: #ffffff
- `--text-secondary`: rgba(255, 255, 255, 0.7)
- `--text-muted`: rgba(255, 255, 255, 0.5)

### Glows
- `--glow-cyan`: 0 0 20px rgba(0, 240, 255, 0.5)
- `--glow-purple`: 0 0 20px rgba(168, 85, 247, 0.5)
- `--glow-green`: 0 0 20px rgba(16, 185, 129, 0.5)

## Interactive Features

### Hover States
- Agent station scales up (1.05x)
- Connection lines brighten
- Info panel appears with slide-in animation

### Click Actions
- Select agent (highlight with cyan ring)
- Show detailed info panel
- Focus on agent's connections

### Real-time Updates
- New messages trigger pulse along connections
- Status changes animate smoothly
- Activity feed scrolls with new entries

## Responsive Breakpoints

- **Desktop** (>1200px): Full isometric view, all panels visible
- **Tablet** (768-1200px): Simplified view, collapsible panels
- **Mobile** (<768px): List view with map thumbnail

## Technical Implementation

### Libraries
- **React** + **TypeScript** for components
- **Framer Motion** for animations
- **SVG** for connection lines (animated stroke-dasharray)
- **CSS Grid** for workstation layout

### Performance
- Use `transform` and `opacity` for animations (GPU accelerated)
- Limit particle count to 50 max
- Use `will-change` on animated elements
- Implement intersection observer for off-screen elements

## File Structure

```
src/
├── pages/
│   └── FactoryFloorPage.tsx      # Main factory floor page
├── components/
│   └── factory-floor/
│       ├── WorkstationGrid.tsx   # Grid layout container
│       ├── AgentStation.tsx      # Individual agent workstation
│       ├── ConnectionLines.tsx   # SVG connection paths
│       ├── StatusIndicator.tsx   # Animated status icons
│       ├── InfoPanel.tsx         # Holographic info card
│       ├── ActivityFeed.tsx      # Real-time activity stream
│       └── SystemGauges.tsx      # Performance gauges
├── hooks/
│   └── useAgentPositions.ts      # Agent positioning logic
└── styles/
    └── factory-floor.css         # Custom animations & styles
```

## Mock Data Structure

```typescript
interface FactoryAgent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  status: 'online' | 'working' | 'idle' | 'error' | 'thinking';
  currentTask?: string;
  position: { x: number; y: number };
  connections: string[]; // Agent IDs
  metrics: {
    messagesToday: number;
    tokensUsed: number;
    lastActive: string;
  };
}

interface Connection {
  from: string;
  to: string;
  activity: 'high' | 'medium' | 'low' | 'none';
  lastMessage?: string;
}
```

## Next Steps

1. ✅ Create design document (this file)
2. ⬜ Set up base styles and CSS variables
3. ⬜ Create WorkstationGrid component
4. ⬜ Create AgentStation component with animations
5. ⬜ Create ConnectionLines with SVG animations
6. ⬜ Create InfoPanel with glassmorphism
7. ⬜ Add ActivityFeed and SystemGauges
8. ⬜ Integrate with existing dashboard
9. ⬜ Test animations and performance
10. ⬜ Deploy and validate
