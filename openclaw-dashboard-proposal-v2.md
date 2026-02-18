# OpenClaw Dashboard Proposal v2

## Executive Summary

A comprehensive, secure web-based dashboard for managing your OpenClaw instance on Raspberry Pi. Accessible from your ROG laptop via SSH tunnel on LAN, with authentication for internet access. All API keys stored in encrypted format.

---

## OpenClaw File Structure (Complete)

Based on documentation review, here's the complete OpenClaw filesystem:

```
~/.openclaw/
├── openclaw.json                    # Main configuration file
├── credentials/                     # OAuth tokens, API keys (SENSITIVE)
│   ├── anthropic.json
│   ├── openai.json
│   └── ...
├── agents/
│   └── <agentId>/
│       └── sessions/
│           ├── sessions.json        # Session store (sessionKey -> metadata)
│           ├── <SessionId>.jsonl    # Session transcripts
│           └── <SessionId>-topic-<threadId>.jsonl  # Telegram topic sessions
├── skills/                          # Managed skills
│   └── <skill-name>/
│       ├── skill.json
│       └── ...
├── sandboxes/                       # Sandboxed workspaces (when enabled)
│   └── <sandbox-id>/
├── workspace/                       # Default agent workspace
│   ├── AGENTS.md                    # Operating instructions
│   ├── SOUL.md                      # Persona, tone, boundaries
│   ├── USER.md                      # User identity
│   ├── IDENTITY.md                  # Agent name, vibe, emoji
│   ├── TOOLS.md                     # Tool notes and conventions
│   ├── HEARTBEAT.md                 # Heartbeat checklist
│   ├── BOOT.md                      # Startup checklist
│   ├── BOOTSTRAP.md                 # One-time first-run ritual
│   ├── MEMORY.md                    # Curated long-term memory
│   ├── memory/                      # Daily memory logs
│   │   └── YYYY-MM-DD.md
│   ├── skills/                      # Workspace-specific skills
│   └── canvas/                      # Canvas UI files
│       └── index.html
└── workspace-<profile>/             # Profile-specific workspace (if OPENCLAW_PROFILE set)

/tmp/openclaw/
└── openclaw-YYYY-MM-DD.log          # Gateway logs (configurable)
```

**Default Gateway Port**: 18789 (we will use a different port)

---

## Security Architecture

### Authentication System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐         │
│  │    Client    │────────▶│   Login      │────────▶│   JWT        │         │
│  │   (Browser)  │         │   Screen     │         │   Issued     │         │
│  └──────────────┘         └──────────────┘         └──────────────┘         │
│         │                                                   │                │
│         │                                                   ▼                │
│         │                                            ┌──────────────┐       │
│         │                                            │   Secure     │       │
│         │                                            │   Cookie     │       │
│         │                                            │   (httpOnly) │       │
│         │                                            └──────────────┘       │
│         │                                                   │                │
│         └───────────────────────────────────────────────────┘                │
│                             All API Requests                                 │
│                         (JWT Verified + CSRF Token)                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Methods

| Access Type | Authentication | Notes |
|-------------|----------------|-------|
| **Local (127.0.0.1)** | Optional | Can disable auth for local development |
| **LAN (192.168.x.x)** | Required | Username + Password + TOTP (optional) |
| **Internet** | Required | Username + Password + TOTP Mandatory |

### Password Security
- **Hashing**: Argon2id (memory-hard, resistant to GPU cracking)
- **Salt**: 32-byte random per-user salt
- **Pepper**: Additional server-side secret

### Session Security
- **JWT**: RS256 (RSA-signed, short-lived access tokens)
- **Refresh Tokens**: Rotating, stored hashed in database
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: 5 attempts per IP per minute

---

## Encrypted API Key Storage

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API KEY ENCRYPTION ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ENCRYPTION LAYERS                                 │   │
│  │                                                                       │   │
│  │   Layer 1: AES-256-GCM (File Encryption)                             │   │
│  │   ├── Key: Derived from master key + salt                            │   │
│  │   ├── IV: 96-bit random per encryption                               │   │
│  │   └── Auth Tag: 128-bit GCM authentication                           │   │
│  │                                                                       │   │
│  │   Layer 2: Master Key Protection                                     │   │
│  │   ├── Master key encrypted with password-derived key                 │   │
│  │   ├── PBKDF2: 600,000 iterations (OWASP recommendation)              │   │
│  │   └── Master key never stored in plaintext                           │   │
│  │                                                                       │   │
│  │   Layer 3: File System Permissions                                   │   │
│  │   ├── File: 600 (owner read/write only)                              │   │
│  │   └── Directory: 700 (owner only)                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Storage Location: ~/.openclaw-dashboard/secrets/                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  File: api-keys.enc                                                  │   │
│  │  Format:                                                             │   │
│  │  {                                                                   │   │
│  │    "version": 1,                                                     │   │
│  │    "salt": "base64...",                                              │   │
│  │    "encryptedData": "base64...",                                     │   │
│  │    "iv": "base64...",                                                │   │
│  │    "tag": "base64..."                                                │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Port Selection

**Selected Port**: `28471`

### Rationale
- Not in any OpenClaw documentation
- Not in common port lists (avoids conflicts)
- Ephemeral port range (49152-65535 is standard, but 28471 is safely obscure)
- Easy to remember: 2-8-4-7-1 (no pattern)

### Port Usage Summary
| Service | Port | Purpose |
|---------|------|---------|
| OpenClaw Gateway | 18789 | Default gateway (unchanged) |
| **OpenClaw Dashboard** | **28471** | **Our dashboard** |
| SSH Tunnel | 22 | Standard SSH access |

---

## Updated Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROG LAPTOP (Client)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Web Browser                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │   Login     │  │   Agents    │  │   Config    │  │   Logs     │ │   │
│  │  │   Screen    │  │   Manager   │  │   Editor    │  │   Viewer   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                         SSH Tunnel (Port 28471)                             │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RASPBERRY PI (Server)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              OpenClaw Dashboard Server (Port 28471)                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │  Auth       │  │  API        │  │  File       │  │  WebSocket │ │   │
│  │  │  Service    │  │  Routes     │  │  Watcher    │  │  Server    │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │  Encrypted  │  │  OpenClaw   │  │  System     │                  │   │
│  │  │  Key Store  │  │  CLI Exec   │  │  Monitor    │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐ │
│  │                                 ▼                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │ │
│  │  │~/.openclaw   │  │~/.openclaw/  │  │ /tmp/openclaw│  │  Session  │ │ │
│  │  │/workspace    │  │agents/*/     │  │/*.log        │  │  Store    │ │ │
│  │  │/*.md         │  │sessions/     │  │              │  │           │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘ │ │
│  │         │                 │                  │              │        │ │
│  │         └─────────────────┴──────────────────┴──────────────┘        │ │
│  │                              OpenClaw Gateway (Port 18789)            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Pages & Features

### 1. Login Page
- Username/password form
- TOTP input (if enabled)
- "Remember this device" option
- Rate-limited attempts

### 2. Dashboard Overview
- **KPI Cards**: Active agents, sessions, API status, Pi health
- **Activity Chart**: 24h agent activity timeline
- **Resource Monitor**: Pi CPU, Memory, Temperature (real-time)
- **Recent Sessions**: Last 10 sessions with status
- **Live Log Stream**: Tail of OpenClaw logs
- **Quick Actions**: Restart gateway, clear logs, backup configs

### 3. Agents Management
- **List View**: All agents with status, last active, session count
- **Kanban View**: Scheduled → Running → Complete → Reviewed
- **Agent Detail**:
  - Identity editor (name, emoji, avatar)
  - Sub-agent tree visualization
  - Session history
  - Performance metrics
  - Workspace files browser
- **Actions**: Start, stop, delete, clone agent

### 4. Workspace File Editor
- **File Browser**: Tree view of `~/.openclaw/workspace/`
- **Markdown Editor**: Monaco Editor with live preview
  - AGENTS.md, SOUL.md, USER.md, IDENTITY.md, etc.
- **JSON Editor**: Schema-validated config editing
  - Syntax highlighting
  - Error validation
  - Auto-formatting
- **Version History**: Track changes with git integration
- **Auto-save**: With conflict detection

### 5. Sessions Viewer
- **Session List**: Filter by agent, date, status
- **Session Detail**: Full transcript viewer
- **Search**: Full-text search across all sessions
- **Export**: Download session as JSON/JSONL

### 6. Configuration Manager
- **openclaw.json Editor**: Full config with schema validation
- **Agent Configs**: Per-agent configuration
- **Skills Manager**: Enable/disable, configure API keys
- **Channel Settings**: WhatsApp, Telegram, Discord, etc.
- **Environment Variables**: Manage dashboard env vars

### 7. Logs & Monitoring
- **Live Tail**: Real-time log streaming
- **Filter**: By level (DEBUG, INFO, WARN, ERROR), agent, time
- **Search**: Regex support
- **Export**: Download filtered logs
- **Log Levels**: Color-coded entries

### 8. System Status
- **Pi Health**: CPU, Memory, Disk, Temperature graphs
- **OpenClaw Service**: Status, uptime, version
- **Gateway Connection**: WebSocket status, latency
- **LLM Models**: Available models, quota usage
- **Network**: Tailscale status (if configured)

### 9. Settings & Security
- **User Management**: Add/remove dashboard users
- **API Keys**: Encrypted storage for LLM API keys
- **Authentication**: TOTP setup, password change
- **Backup/Restore**: Export/import all configs
- **System**: Update dashboard, restart services

---

## Data Models

### User
```typescript
interface User {
  id: string;
  username: string;
  passwordHash: string;      // Argon2id
  salt: string;
  totpSecret?: string;       // Encrypted
  role: 'admin' | 'viewer';
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}
```

### Agent
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'error' | 'stopped';
  workspacePath: string;           // ~/.openclaw/workspace or custom
  identity: {
    name: string;
    emoji: string;
    theme?: string;
    avatar?: string;
  };
  parentAgentId?: string;          // for sub-agents
  subAgentIds: string[];
  config: AgentConfig;
  createdAt: Date;
  lastActiveAt: Date;
  sessionCount: number;
  totalTasksCompleted: number;
  averageResponseTime: number;
}
```

### Session
```typescript
interface Session {
  id: string;
  agentId: string;
  agentName: string;
  sessionKey: string;              // e.g., "main", "agent:main:main"
  status: 'active' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  contextTokens: number;
  transcriptPath: string;          // Path to .jsonl file
  origin?: {
    channel: string;
    peerId?: string;
  };
}
```

### ConfigFile
```typescript
interface ConfigFile {
  path: string;
  name: string;
  type: 'json' | 'markdown';
  content: string;
  lastModified: Date;
  size: number;
  schema?: object;                 // for JSON validation
  isDirty: boolean;                // unsaved changes
}
```

### EncryptedApiKeys
```typescript
interface EncryptedApiKeys {
  version: number;
  salt: string;                    // base64
  encryptedData: string;           // base64 (AES-256-GCM)
  iv: string;                      // base64
  tag: string;                     // base64 (GCM auth tag)
}
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/login          # Login, receive JWT
POST   /api/auth/logout         # Logout, invalidate token
POST   /api/auth/refresh        # Refresh access token
GET    /api/auth/me             # Get current user
POST   /api/auth/totp/setup     # Setup TOTP
POST   /api/auth/totp/verify    # Verify TOTP code
```

### Agents
```
GET    /api/agents               # List all agents
POST   /api/agents               # Create new agent
GET    /api/agents/:id           # Get agent details
PUT    /api/agents/:id           # Update agent
DELETE /api/agents/:id           # Delete agent
POST   /api/agents/:id/start     # Start agent session
POST   /api/agents/:id/stop      # Stop agent session
GET    /api/agents/:id/sessions  # Get agent sessions
```

### Workspace Files
```
GET    /api/files                # List workspace files
GET    /api/files/:path          # Get file content
PUT    /api/files/:path          # Update file
POST   /api/files/:path          # Create new file
DELETE /api/files/:path          # Delete file
GET    /api/files/:path/history  # Get file git history
```

### Sessions
```
GET    /api/sessions              # List all sessions
GET    /api/sessions/:id          # Get session details
GET    /api/sessions/:id/transcript # Get session transcript
DELETE /api/sessions/:id          # Delete session
```

### Configuration
```
GET    /api/config                # Get openclaw.json
PUT    /api/config                # Update openclaw.json
GET    /api/config/schema         # Get JSON schema
POST   /api/config/apply          # Apply and restart
GET    /api/config/agents/:id     # Get agent config
PUT    /api/config/agents/:id     # Update agent config
```

### Logs
```
GET    /api/logs                  # Get logs (with filters)
GET    /api/logs/stream           # WebSocket stream
GET    /api/logs/levels           # Get log levels
```

### System
```
GET    /api/system/status         # Pi health status
GET    /api/system/resources      # CPU, Memory, Temp
GET    /api/system/openclaw       # OpenClaw service status
POST   /api/system/openclaw/restart # Restart OpenClaw
GET    /api/system/gateway        # Gateway connection status
```

### API Keys (Encrypted)
```
GET    /api/keys                  # List stored keys (names only)
POST   /api/keys                  # Store new key
PUT    /api/keys/:name            # Update key
DELETE /api/keys/:name            # Delete key
POST   /api/keys/unlock           # Unlock key store (requires password)
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + TypeScript + Vite | Dashboard UI |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive design |
| **State** | Zustand | Global state management |
| **Charts** | Recharts | Data visualization |
| **Editor** | Monaco Editor | JSON/Markdown editing |
| **Backend** | Node.js + Express | API server |
| **Database** | SQLite (better-sqlite3) | User/sessions data |
| **Auth** | Passport.js + JWT | Authentication |
| **Encryption** | crypto (Node.js built-in) | AES-256-GCM, Argon2id |
| **Real-time** | Socket.io | Live updates |
| **File Watch** | chokidar | Monitor file changes |
| **Process** | node-pty | Terminal integration |

---

## File Structure on Pi

```
~/openclaw-dashboard/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts           # Authentication routes
│   │   │   ├── agents.ts         # Agent CRUD API
│   │   │   ├── files.ts          # File management API
│   │   │   ├── sessions.ts       # Session API
│   │   │   ├── config.ts         # Config API
│   │   │   ├── logs.ts           # Log streaming API
│   │   │   ├── system.ts         # System status API
│   │   │   └── keys.ts           # Encrypted API keys API
│   │   ├── services/
│   │   │   ├── auth.ts           # Auth service (Argon2id, JWT)
│   │   │   ├── encryption.ts     # AES-256-GCM encryption
│   │   │   ├── fileWatcher.ts    # Watch OpenClaw files
│   │   │   ├── openclaw.ts       # CLI execution
│   │   │   ├── systemMonitor.ts  # Pi resource monitoring
│   │   │   └── keyStore.ts       # Encrypted API key storage
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── rateLimit.ts      # Rate limiting
│   │   │   └── csrf.ts           # CSRF protection
│   │   ├── models/
│   │   │   ├── User.ts           # User model
│   │   │   ├── Agent.ts          # Agent model
│   │   │   └── Session.ts        # Session model
│   │   └── index.ts              # Express server
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Dashboard pages
│   │   ├── hooks/                # Custom React hooks
│   │   ├── stores/               # Zustand stores
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── secrets/                      # Encrypted secrets (600 permissions)
│   └── api-keys.enc
├── database/                     # SQLite database
│   └── dashboard.db
└── README.md
```

---

## SSH Access Setup (LAN)

### From ROG Laptop to Pi:
```bash
# One-time: Add Pi to known hosts
ssh pi@raspberrypi.local

# Create SSH tunnel for dashboard access
# Forwards port 28471 on laptop to port 28471 on Pi
ssh -L 28471:localhost:28471 pi@raspberrypi.local

# Access dashboard at: https://localhost:28471 on ROG laptop
```

### Persistent Tunnel (autossh)
```bash
# Install autossh
sudo apt install autossh

# Persistent tunnel with auto-reconnect
autossh -M 0 -N -L 28471:localhost:28471 pi@raspberrypi.local
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Initialize React + Node.js project
- [ ] Set up authentication system (Argon2id, JWT)
- [ ] Create encrypted API key storage
- [ ] Build login page
- [ ] Implement basic middleware (auth, rate limit, CSRF)

### Phase 2: Core Features (Week 2)
- [ ] Dashboard overview with KPI cards
- [ ] Pi resource monitoring (CPU, Memory, Temp)
- [ ] Agent list and detail views
- [ ] File browser for workspace
- [ ] Basic JSON/Markdown editor

### Phase 3: Advanced Features (Week 3)
- [ ] Session viewer with transcripts
- [ ] Live log streaming (WebSocket)
- [ ] Configuration editor with schema validation
- [ ] Sub-agent tree visualization
- [ ] Quick actions panel

### Phase 4: Polish & Security (Week 4)
- [ ] TOTP authentication
- [ ] User management
- [ ] Backup/restore functionality
- [ ] SSL/HTTPS setup
- [ ] Documentation

---

## Security Checklist

- [ ] Argon2id for password hashing
- [ ] AES-256-GCM for API key encryption
- [ ] JWT with RS256 signing
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] Secure cookie settings (httpOnly, secure, sameSite)
- [ ] File permissions (600 for secrets, 700 for directories)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (content-type headers, CSP)
- [ ] HTTPS for production
- [ ] TOTP for internet access

---

## Next Steps

1. **Approve this proposal** - Confirm architecture, port, and security
2. **Initialize project** - Set up React + Node.js codebase
3. **Build authentication** - Login, JWT, encrypted key store
4. **Create dashboard shell** - Sidebar, routing, layout
5. **Implement file watchers** - Monitor OpenClaw directories
6. **Build core views** - Agents, files, sessions
7. **Add real-time features** - WebSocket, live logs
8. **Test SSH access** - Verify tunnel from ROG laptop
9. **Security audit** - Review all security measures
10. **Deploy and iterate** - Run on Pi, refine based on usage
