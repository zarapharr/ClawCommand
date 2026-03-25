# ClawCommand Backend Server

Production-ready proxy and data integration server for ClawCommand dashboard. Wires all 9 live data sources with authentication, error handling, and real-time streaming.

## Overview

The ClawCommand backend serves as a unified data layer between the React frontend and multiple backend services:

- **OpenClaw Gateway** - WebSocket proxy with token forwarding
- **Langfuse** - Trace, observation, and scoring data
- **Qdrant** - Vector collection metadata (direct connection)
- **Ollama** - LLM model management
- **Docker Daemon** - Container monitoring and stats
- **GitHub API** - Repository and workflow data
- **System Metrics** - OS-level CPU, memory, disk, network
- **Audit Logs** - Action audit trail (JSONL)
- **Cron Jobs** - Job scheduling and status

## Quick Start

### Installation

```bash
cd /Users/eric_pharr/.openclaw/workspace/ClawCommand/server
npm install
```

### Configuration

Copy `.env.example` to `.env` and populate with your API keys:

```bash
cp .env.example .env
```

Edit `.env`:

```
OPENCLAW_GATEWAY_TOKEN=5048528cccc8bc2eee7652dcf229b4be0ea067f12019c2db
LANGFUSE_API_KEY=your-api-key
GITHUB_TOKEN=your-pat
PROXY_SERVER_PORT=8000
```

### Development

```bash
npm run dev
```

Server starts on `http://127.0.0.1:8000`

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health

```
GET /health
```

Returns server status and uptime.

### WebSocket Gateway Proxy

```
WS ws://127.0.0.1:8000/ws
```

Authenticated WebSocket proxy to OpenClaw Gateway. Automatically injects bearer token.

### Langfuse

```
GET /api/proxy/langfuse/traces?page=1&limit=100
GET /api/proxy/langfuse/observations?page=1&limit=100
GET /api/proxy/langfuse/scores?page=1&limit=100
```

### Ollama

```
GET /api/proxy/ollama/tags
POST /api/proxy/ollama/generate
```

### Docker

```
GET /api/docker/containers        # List all containers
GET /api/docker/stats             # CPU/memory for all running containers
GET /api/docker/stats/:id         # Stats for specific container
```

### GitHub

```
GET /api/github/repos?owner=zarapharr
GET /api/github/issues?owner=zarapharr&repo=ClawCommand
GET /api/github/workflows?owner=zarapharr&repo=ClawCommand
```

### System Metrics

```
GET /api/system/metrics           # One-shot snapshot (cached 5s)
GET /api/system/metrics/stream    # SSE stream (updates every 5s)
```

### Audit Logs

```
GET /api/audit/logs?limit=100&offset=0&agent=ops-builder&action=deploy
```

Filters: `agent` (partial match), `action` (partial match)

### Cron Jobs

```
GET /api/cron/jobs?limit=50&offset=0
GET /api/cron/jobs/:jobId
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           React App (Vite)                          │
│  (useGateway, useLangfuse, useDocker, etc.)         │
└────────────────┬────────────────────────────────────┘
                 │ HTTP + WebSocket
                 ▼
┌─────────────────────────────────────────────────────┐
│      ClawCommand Backend (Express + Node.js)        │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  WebSocket Proxy (Gateway)                   │  │
│  │  - Inject auth token                         │  │
│  │  - Message queueing                          │  │
│  │  - Auto-reconnect                            │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  REST Proxies (Langfuse, Ollama, GitHub)     │  │
│  │  - API key injection                         │  │
│  │  - Error handling                            │  │
│  │  - Rate limiting (future)                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  File Readers (Audit Logs, Cron Jobs)        │  │
│  │  - Pagination                                │  │
│  │  - Filtering                                 │  │
│  │  - JSONL parsing                             │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Docker SDK (Container stats)                │  │
│  │  - Read-only access                          │  │
│  │  - Stats aggregation                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  System Metrics (systeminformation lib)      │  │
│  │  - CPU, memory, disk, network                │  │
│  │  - Cached (5s)                               │  │
│  │  - SSE streaming                             │  │
│  └──────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────┘
         │
         ├─────────────────────────┬──────────────────────────────┬─────────────────┬──────────────┐
         ▼                         ▼                              ▼                 ▼              ▼
    ┌─────────┐           ┌──────────────┐           ┌────────────────┐   ┌──────────────┐  ┌────────┐
    │ Gateway │           │   Langfuse   │           │    Qdrant      │   │   Ollama     │  │ Docker │
    │ (18789) │           │    (3000)    │           │    (6333)      │   │   (11434)    │  │ Socket │
    └─────────┘           └──────────────┘           └────────────────┘   └──────────────┘  └────────┘
         │
         ├──────────────────────────────────┬────────────────────────┬──────────────────────┐
         ▼                                  ▼                        ▼                      ▼
    ┌──────────┐                   ┌───────────────┐       ┌───────────────┐      ┌───────────┐
    │  GitHub  │                   │  Audit Logs   │       │  Cron Jobs    │      │  System   │
    │  API     │                   │  (JSONL)      │       │  (JSON)       │      │  Metrics  │
    │  (HTTPS) │                   │  (Filesystem) │       │ (Filesystem)  │      │   (OS)    │
    └──────────┘                   └───────────────┘       └───────────────┘      └───────────┘
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENCLAW_GATEWAY_URL` | No | `ws://127.0.0.1:18789` | Gateway WebSocket URL |
| `OPENCLAW_GATEWAY_TOKEN` | Yes | — | Gateway auth token (40 hex chars) |
| `LANGFUSE_API_KEY` | Yes | — | Langfuse API key |
| `LANGFUSE_BASE_URL` | No | `http://localhost:3000` | Langfuse endpoint |
| `OLLAMA_BASE_URL` | No | `http://127.0.0.1:11434` | Ollama endpoint |
| `GITHUB_TOKEN` | Yes | — | GitHub PAT or OAuth token |
| `DOCKER_SOCKET_PATH` | No | `/Users/eric_pharr/.docker/run/docker.sock` | Docker socket |
| `AUDIT_LOGS_PATH` | No | `~/.openclaw/workspace/logs/audit` | Audit logs directory |
| `CRON_JOBS_PATH` | No | `~/.openclaw/.cron/jobs.json` | Cron jobs file |
| `PROXY_SERVER_PORT` | No | `8000` | Server port |
| `PROXY_SERVER_HOST` | No | `127.0.0.1` | Server host (loopback only) |
| `NODE_ENV` | No | `development` | Environment (development/production) |

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Error message",
  "timestamp": "2026-03-23T12:00:00Z"
}
```

Common status codes:
- `200` - Success
- `404` - Not found
- `500` - Server error (check logs)

## Logging

Logs are output to stdout with request logging:

```
[200] GET /api/system/metrics 45ms
[404] GET /api/nonexistent 2ms
! Gateway connection closed
→ Reconnecting gateway in 1234ms
```

## Testing

Run backend tests:

```bash
npm test
npm run test:coverage
```

E2E tests (from app directory):

```bash
npm run e2e
```

## Performance

- System metrics API: <100ms (cached)
- Docker stats: <500ms per request
- Gateway reconnect: exponential backoff (1s → 30s max)
- WebSocket message buffering: up to 1000 pending messages
- File I/O: streaming JSONL for large audit logs

## TypeScript

Compiled with strict mode enabled:

```bash
npm run build
```

Output: `dist/index.js` and type definitions

## Production Deployment

### Via PM2

```bash
npm install -g pm2
pm2 start dist/index.js --name clawcommand-backend
pm2 save
pm2 startup
```

### Via Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8000
CMD ["node", "dist/index.js"]
```

### Via systemd

Create `/etc/systemd/system/clawcommand-backend.service`:

```ini
[Unit]
Description=ClawCommand Backend
After=network.target

[Service]
Type=simple
User=eric_pharr
WorkingDirectory=/Users/eric_pharr/.openclaw/workspace/ClawCommand/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## License

MIT
