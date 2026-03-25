# Product Requirements Document

## Product Name: **ClawCommand** 🦞

### Tagline: *Mission Control for Your AI Workforce*

---

## Executive Summary

ClawCommand is a comprehensive, TRON-inspired mission control dashboard for OpenClaw - the personal AI assistant gateway. It provides real-time visualization, management, and control of AI agents, skills, tasks, and system resources through an immersive, futuristic interface.

---

## Design Philosophy

### Visual Identity: TRON Aeres + Mission Control

```
┌─────────────────────────────────────────────────────────────────┐
│  DARK FOUNDATION          │  NEON ACCENTS                      │
│  ─────────────────        │  ─────────────                     │
│  #0a0a0f - Deep Void      │  #00f0ff - Cyan (Primary)          │
│  #0d1117 - Slate Core     │  #a855f7 - Purple (Secondary)      │
│  #161b22 - Elevated       │  #10b981 - Green (Success)         │
│                           │  #f97316 - Orange (Warning)        │
│                           │  #ef4444 - Red (Error)             │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principles
1. **Immersive**: Full-screen mission control experience
2. **Real-time**: Live data streams, animated connections
3. **Actionable**: Every element is interactive
4. **Scalable**: From 1 agent to 100+ agents

---

## Feature Matrix

### Phase 1: Foundation (Core Dashboard)

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| **Factory Floor** | P0 | ✅ | TRON-style agent visualization |
| **Agent Management** | P0 | 🚧 | Create, edit, delete agents |
| **Session Viewer** | P0 | 🚧 | Real-time session transcripts |
| **System Monitor** | P0 | 🚧 | CPU, memory, gateway health |
| **File Workspace** | P0 | 🚧 | Edit AGENTS.md, SOUL.md, etc. |

### Phase 2: Control (Operations)

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| **Skills Builder** | P0 | 🚧 | Visual skill creation/editing |
| **Task Builder** | P0 | 🚧 | Build and schedule tasks |
| **Todo Management** | P0 | 🚧 | Agent task assignments |
| **Cron Scheduler** | P1 | 🚧 | Schedule recurring jobs |
| **Message Center** | P1 | 🚧 | Send/receive messages |

### Phase 3: Intelligence (Advanced)

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| **Model Manager** | P1 | 🚧 | Configure providers, models |
| **Tool Configurator** | P1 | 🚧 | Enable/disable tools per agent |
| **Channel Hub** | P1 | 🚧 | WhatsApp, Telegram, Discord |
| **Memory Explorer** | P2 | 📋 | Search agent memories |
| **Governance Panel** | P2 | 📋 | Multi-model voting |

### Phase 4: Power User (Expert)

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| **Hook Manager** | P2 | 📋 | Webhook automation |
| **Node Network** | P2 | 📋 | Multi-device management |
| **API Console** | P2 | 📋 | Direct API interaction |
| **Settings Matrix** | P1 | 🚧 | Full system configuration |

---

## Page Specifications

### 1. 🏭 FACTORY FLOOR (Mission Control Center)

**Purpose**: Real-time visualization of all agents and their interactions

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  CLAWCOMMAND - FACTORY FLOOR          [Stats] [Time]           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │     [Agent1]══════╗                                     │   │
│  │         ║         ║    [Agent2]                         │   │
│  │         ║         ╚═══════╗                             │   │
│  │         ║                 ║                             │   │
│  │     [Agent3]══════════════╝    [Agent4]                 │   │
│  │                                                         │   │
│  │  ═══ Animated data connections                         │   │
│  │  ◉◉◉ Status indicators                                 │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  [System Gauges]  │  [Activity Feed]  │  [Quick Actions]       │
└─────────────────────────────────────────────────────────────────┘
```

**Components**:
- Agent Station Cards (avatar, name, status, metrics)
- Animated SVG Connection Lines
- Real-time Activity Feed
- System Health Gauges
- Quick Action Buttons

**Interactions**:
- Click agent → Open detail panel
- Hover connection → Show message count
- Drag agent → Reposition on floor
- Right-click → Context menu

---

### 2. 👥 AGENT COMMAND (Agent Management)

**Purpose**: Full CRUD for agents with advanced configuration

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  AGENT COMMAND                          [+ Create Agent]        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │             │  │                                         │  │
│  │  Agent      │  │  [Avatar]  Agent Name                   │  │
│  │  List       │  │  ─────────────────────────────────────  │  │
│  │             │  │                                         │  │
│  │  🤖 Chief   │  │  [Identity] [Model] [Tools] [Skills]    │  │
│  │  🔬 Resear  │  │                                         │  │
│  │  ✍️ Writer  │  │  Role: Content Creator                  │  │
│  │  👨‍💻 Coder   │  │  Model: Claude Opus 4.6                 │  │
│  │             │  │  Status: Online                         │  │
│  │             │  │                                         │  │
│  │             │  │  [Edit] [Delete] [Duplicate] [Test]     │  │
│  │             │  │                                         │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- Agent list with search/filter
- Detail view with tabs:
  - Identity (name, emoji, role)
  - Model (provider, model, temperature)
  - Tools (allowlist/blocklist)
  - Skills (assigned skills)
  - Workspace (bootstrap files)
  - Stats (usage, messages, tokens)

---

### 3. 🛠️ SKILLS FORGE (Skills Builder)

**Purpose**: Visual skill creation and management

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  SKILLS FORGE                           [+ Create Skill]        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │             │  │  Skill: web_search                      │  │
│  │  Skill      │  │  ─────────────────────────────────────  │  │
│  │  Library    │  │                                         │  │
│  │             │  │  [Visual Builder] [Code Editor]         │  │
│  │  🔍 web_    │  │                                         │  │
│  │  📧 email   │  │  ┌─────────────────────────────────┐   │  │
│  │  🌤️ weather │  │  │  Trigger: @mention web_search   │   │  │
│  │  📅 calendar│  │  │                                 │   │  │
│  │             │  │  │  Parameters:                    │   │  │
│  │  ─────────  │  │  │  • query (string, required)     │   │  │
│  │  📁 Local   │  │  │  • limit (number, optional)     │   │  │
│  │  🌐 ClawHub │  │  │                                 │   │  │
│  │             │  │  │  Handler:                       │   │  │
│  │             │  │  │  [Code Block]                   │   │  │
│  │             │  │  └─────────────────────────────────┘   │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- Visual skill builder (drag-drop nodes)
- Code editor for handlers
- Parameter configuration
- Test runner
- ClawHub integration (browse/install)
- Version management

---

### 4. 📋 TASK COMMAND (Task Builder + Todo)

**Purpose**: Create, assign, and track tasks

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  TASK COMMAND                           [+ New Task]            │
├─────────────────────────────────────────────────────────────────┤
│  [Board] [List] [Calendar]  │  Filter: [All] [Active] [Done]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  TODO       │  │  IN PROG    │  │  DONE       │            │
│  │             │  │             │  │             │            │
│  │  • Research │  │  • Write    │  │  • Review   │            │
│  │    market   │  │    blog     │  │    PR #42   │            │
│  │    [🔬]     │  │    [✍️]     │  │    [👨‍💻]    │            │
│  │             │  │             │  │             │            │
│  │  • Analyze  │  │  • Code     │  │             │            │
│  │    Q4 data  │  │    feature  │  │             │            │
│  │    [📊]     │  │    [👨‍💻]    │  │             │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- Kanban board view
- List view with filters
- Calendar view for scheduled tasks
- Task assignment to agents
- Priority levels
- Due dates
- Subtasks
- Comments/discussion

---

### 5. 📡 SESSION CENTER (Session Management)

**Purpose**: View and interact with agent sessions

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  SESSION CENTER                         [Search Sessions]       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │             │  │  Session: main (Chief of Staff)         │  │
│  │  Session    │  │  ─────────────────────────────────────  │  │
│  │  List       │  │                                         │  │
│  │             │  │  ┌─────────────────────────────────┐   │  │
│  │  🦞 main    │  │  │  User: Hello!                   │   │  │
│  │  🔬 research│  │  │                                 │   │  │
│  │  ✍️ write   │  │  │  🤖 Assistant: Hi there! How    │   │  │
│  │             │  │  │     can I help you today?       │   │  │
│  │             │  │  │                                 │   │  │
│  │             │  │  │  User: Write a blog post...     │   │  │
│  │             │  │  │                                 │   │  │
│  │             │  │  │  🤖 Assistant: I'd be happy...  │   │  │
│  │             │  │  └─────────────────────────────────┘   │  │
│  │             │  │                                         │  │
│  │             │  │  [Type message...] [Send]              │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- Session list with filters
- Real-time transcript viewer
- Send messages to sessions
- Export transcripts
- Session metadata
- Message search

---

### 6. ⚙️ SETTINGS MATRIX (Configuration)

**Purpose**: Full system configuration

**Tabs**:
- **General**: Theme, timezone, language
- **Gateway**: Ports, CORS, reload mode
- **Models**: Provider config, API keys, failover
- **Channels**: WhatsApp, Telegram, Discord setup
- **Security**: Auth, sessions, SSH
- **Notifications**: Email, webhooks
- **Advanced**: Logs, metrics, tracing

---

## Component Library

### TRON UI Kit

```typescript
// Status Badge
<StatusBadge status="online|working|thinking|idle|error|offline" />

// Neon Button
<NeonButton variant="cyan|purple|green" glow={true}>
  Click Me
</NeonButton>

// Holographic Card
<HoloCard title="Agent Stats" accent="cyan">
  Content here
</HoloCard>

// Data Flow Line
<FlowLine 
  from={{x: 100, y: 100}} 
  to={{x: 300, y: 200}}
  activity="high|medium|low"
  animated={true}
/>

// Gauge
<Gauge 
  value={75} 
  max={100} 
  label="CPU" 
  color="cyan"
/>

// Activity Item
<ActivityItem 
  agent="Chief of Staff"
  type="message|task|error"
  message="Started new task"
  timestamp="2024-01-01T12:00:00Z"
/>
```

---

## Data Models

### Agent
```typescript
interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  status: AgentStatus;
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  tools: {
    allow: string[];
    deny: string[];
  };
  skills: string[];
  workspace: string;
  bootstrapFiles: {
    agents: string;
    soul: string;
    tools: string;
    memory: string;
  };
  metrics: AgentMetrics;
  createdAt: string;
  updatedAt: string;
}
```

### Skill
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: {
    type: 'mention' | 'command' | 'pattern';
    value: string;
  };
  parameters: SkillParameter[];
  handler: string; // Code
  examples: string[];
  version: string;
  author: string;
  isLocal: boolean;
  isEnabled: boolean;
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string; // Agent ID
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  subtasks: SubTask[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}
```

---

## API Integration

### WebSocket Events
```typescript
// Subscribe to events
ws.subscribe('agent.status', (data) => {
  updateAgentStatus(data.agentId, data.status);
});

ws.subscribe('session.message', (data) => {
  appendMessage(data.sessionId, data.message);
});

ws.subscribe('system.metrics', (data) => {
  updateGauges(data);
});
```

### REST Endpoints
```
GET    /api/agents              # List agents
POST   /api/agents              # Create agent
GET    /api/agents/:id          # Get agent
PUT    /api/agents/:id          # Update agent
DELETE /api/agents/:id          # Delete agent

GET    /api/skills              # List skills
POST   /api/skills              # Create skill
PUT    /api/skills/:id          # Update skill

GET    /api/tasks               # List tasks
POST   /api/tasks               # Create task
PUT    /api/tasks/:id           # Update task

GET    /api/sessions            # List sessions
GET    /api/sessions/:id        # Get session
POST   /api/sessions/:id/send   # Send message

GET    /api/system/metrics      # System metrics
GET    /api/system/health       # Health check
```

---

## Navigation Structure

```
ClawCommand
├── 🏭 Factory Floor (Home)
├── 👥 Agent Command
│   ├── All Agents
│   ├── Create Agent
│   └── Agent Detail
├── 🛠️ Skills Forge
│   ├── Skill Library
│   ├── Skill Builder
│   └── ClawHub
├── 📋 Task Command
│   ├── Board View
│   ├── List View
│   └── Calendar View
├── 📡 Session Center
│   ├── Active Sessions
│   └── Archived
├── 📁 Workspace
│   ├── Files
│   └── Editor
├── ⏰ Cron Scheduler
│   ├── Jobs
│   └── History
├── ⚙️ Settings Matrix
│   ├── General
│   ├── Gateway
│   ├── Models
│   ├── Channels
│   ├── Security
│   ├── Notifications
│   └── Advanced
└── 📊 System Monitor
    ├── Overview
    ├── Logs
    └── Metrics
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page Load Time | < 2s |
| WebSocket Latency | < 100ms |
| Agent Count Support | 100+ |
| Concurrent Sessions | 50+ |
| Mobile Responsive | Yes |
| PWA Support | Yes |

---

## Roadmap

### v1.0 - Foundation (Week 1-2)
- [x] Factory Floor visualization
- [ ] Agent Management
- [ ] Session Center
- [ ] System Monitor
- [ ] File Workspace

### v1.1 - Control (Week 3-4)
- [ ] Skills Forge
- [ ] Task Command
- [ ] Cron Scheduler
- [ ] Message Center

### v1.2 - Intelligence (Week 5-6)
- [ ] Model Manager
- [ ] Tool Configurator
- [ ] Channel Hub
- [ ] Memory Explorer

### v1.3 - Power User (Week 7-8)
- [ ] Hook Manager
- [ ] Node Network
- [ ] API Console
- [ ] Advanced Settings

---

*ClawCommand - Mission Control for Your AI Workforce* 🦞
