# ClawCommand Backend API Reference

Complete endpoint documentation with request/response examples.

## Base URL

```
http://127.0.0.1:8000
WebSocket: ws://127.0.0.1:8000/ws
```

## Health & Status

### GET /health

Server health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-23T12:00:00.000Z",
  "uptime": 3600.5
}
```

## WebSocket Gateway Proxy

### WS ws://127.0.0.1:8000/ws

Authenticated WebSocket tunnel to OpenClaw Gateway. Client connects without auth; server injects token.

**Features:**
- Message queueing while offline
- Auto-reconnect with exponential backoff
- Broadcast to all connected clients

**Example (Browser):**
```javascript
const ws = new WebSocket('ws://127.0.0.1:8000/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({ method: 'gateway.rpc', params: {} }));
};
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Gateway message:', data);
};
```

## Langfuse Proxy

### GET /api/proxy/langfuse/traces

Fetch traces with pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 100 | Results per page |

**Response:**
```json
{
  "data": [
    {
      "id": "trace-123",
      "name": "Generate Summary",
      "startTime": "2026-03-23T12:00:00Z",
      "endTime": "2026-03-23T12:00:01Z",
      "duration": 1000,
      "cost": 0.0015
    }
  ]
}
```

### GET /api/proxy/langfuse/observations

Fetch observations (individual LLM calls).

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 100 | Results per page |

**Response:**
```json
{
  "data": [
    {
      "id": "obs-123",
      "type": "llm",
      "traceId": "trace-123",
      "name": "claude-haiku",
      "startTime": "2026-03-23T12:00:00Z",
      "endTime": "2026-03-23T12:00:01Z",
      "duration": 1000
    }
  ]
}
```

### GET /api/proxy/langfuse/scores

Fetch quality scores and feedback.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 100 | Results per page |

**Response:**
```json
{
  "data": [
    {
      "id": "score-123",
      "traceId": "trace-123",
      "name": "quality",
      "value": 0.95,
      "timestamp": "2026-03-23T12:00:02Z"
    }
  ]
}
```

## Ollama Proxy

### GET /api/proxy/ollama/tags

List loaded models.

**Response:**
```json
{
  "models": [
    {
      "name": "llama3.2:1b",
      "size": 1300000000,
      "modified_at": "2026-03-23T12:00:00Z"
    }
  ]
}
```

### POST /api/proxy/ollama/generate

Generate text completion.

**Request Body:**
```json
{
  "model": "llama3.2:1b",
  "prompt": "Write a haiku about AI",
  "stream": false
}
```

**Response:**
```json
{
  "model": "llama3.2:1b",
  "created_at": "2026-03-23T12:00:00Z",
  "response": "Circuits think and dream...",
  "done": true
}
```

## GitHub Proxy

### GET /api/github/repos

List user repositories.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | zarapharr | GitHub username |

**Response:**
```json
[
  {
    "id": 123456,
    "name": "ClawCommand",
    "full_name": "zarapharr/ClawCommand",
    "description": "OpenClaw dashboard",
    "url": "https://github.com/zarapharr/ClawCommand",
    "stars": 42,
    "forks": 3,
    "language": "TypeScript"
  }
]
```

### GET /api/github/issues

List repository issues.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | zarapharr | GitHub username |
| `repo` | string | ClawCommand | Repository name |

**Response:**
```json
[
  {
    "id": 987654,
    "number": 42,
    "title": "Add real data integration",
    "state": "open",
    "created_at": "2026-03-20T00:00:00Z",
    "updated_at": "2026-03-23T12:00:00Z",
    "url": "https://github.com/zarapharr/ClawCommand/issues/42"
  }
]
```

### GET /api/github/workflows

List CI/CD workflows.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | zarapharr | GitHub username |
| `repo` | string | ClawCommand | Repository name |

**Response:**
```json
{
  "workflows": [
    {
      "id": 12345,
      "name": "CI",
      "path": ".github/workflows/ci.yml",
      "state": "active",
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-23T12:00:00Z"
    }
  ]
}
```

## Docker API

### GET /api/docker/containers

List all Docker containers.

**Response:**
```json
[
  {
    "id": "abc123def456",
    "name": "langfuse",
    "image": "langfuse/langfuse:3",
    "status": "Up 2 days",
    "state": "running",
    "ports": [
      {
        "ip": "0.0.0.0",
        "privatePort": 3000,
        "publicPort": 3000,
        "type": "tcp"
      }
    ]
  }
]
```

### GET /api/docker/stats

Get CPU/memory stats for all running containers.

**Response:**
```json
{
  "timestamp": "2026-03-23T12:00:00Z",
  "containers": [
    {
      "id": "abc123def456",
      "name": "langfuse",
      "cpu_percent": "2.45",
      "memory_usage": 314572800,
      "memory_limit": 8589934592,
      "memory_percent": "3.66"
    }
  ]
}
```

### GET /api/docker/stats/:containerId

Get stats for specific container.

**Path Parameters:**
| Param | Description |
|-------|-------------|
| `containerId` | Docker container ID (short or full) |

**Response:**
```json
{
  "cpu_percent": "2.45",
  "memory_usage": 314572800,
  "memory_limit": 8589934592,
  "memory_percent": "3.66"
}
```

## System Metrics

### GET /api/system/metrics

One-shot system metrics (cached 5 seconds).

**Response:**
```json
{
  "timestamp": "2026-03-23T12:00:00Z",
  "cpu": {
    "user": 15,
    "system": 8,
    "idle": 77,
    "total": 23
  },
  "memory": {
    "total": 34359738368,
    "used": 29826576384,
    "free": 4533161984,
    "percent": 86.79
  },
  "disk": {
    "readRate": 1234567,
    "writeRate": 7654321
  },
  "network": {
    "rx_sec": 123456,
    "tx_sec": 234567
  },
  "uptime": 3600
}
```

### GET /api/system/metrics/stream

Server-Sent Events (SSE) stream of metrics (updates every 5s).

**Usage:**
```javascript
const eventSource = new EventSource('http://127.0.0.1:8000/api/system/metrics/stream');
eventSource.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  console.log('Metrics update:', metrics);
};
```

## Audit Logs

### GET /api/audit/logs

Fetch audit trail with pagination and filtering.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 100 | Results per page (max 1000) |
| `offset` | number | 0 | Skip N results |
| `agent` | string | — | Filter by agent (partial match) |
| `action` | string | — | Filter by action type (partial match) |

**Response:**
```json
{
  "total": 1250,
  "limit": 100,
  "offset": 0,
  "entries": [
    {
      "timestamp": "2026-03-23T12:00:00Z",
      "agent": "ops-builder",
      "topic_id": "85",
      "action_type": "build_success",
      "description": "Built ClawCommand v1.0.0",
      "files_touched": ["src/index.ts", "package.json"],
      "result": "success"
    }
  ]
}
```

## Cron Jobs

### GET /api/cron/jobs

List cron jobs with pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Results per page (capped at 500) |
| `offset` | number | 0 | Skip N results |

**Response:**
```json
{
  "total": 315544,
  "limit": 50,
  "offset": 0,
  "jobs": [
    {
      "id": "heartbeat-check-001",
      "schedule": "0 */6 * * *",
      "command": "openclaw cron status",
      "lastRun": "2026-03-23T12:00:00Z",
      "nextRun": "2026-03-23T18:00:00Z",
      "status": "active"
    }
  ]
}
```

### GET /api/cron/jobs/:jobId

Get specific cron job details.

**Path Parameters:**
| Param | Description |
|-------|-------------|
| `jobId` | Job ID |

**Response:**
```json
{
  "id": "heartbeat-check-001",
  "schedule": "0 */6 * * *",
  "command": "openclaw cron status",
  "lastRun": "2026-03-23T12:00:00Z",
  "nextRun": "2026-03-23T18:00:00Z",
  "status": "active",
  "created": "2026-01-01T00:00:00Z",
  "modified": "2026-03-23T00:00:00Z"
}
```

## Error Responses

### Client Errors

**404 Not Found:**
```json
{
  "error": "Cron job not found",
  "timestamp": "2026-03-23T12:00:00Z"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid query parameter: limit must be <= 1000",
  "timestamp": "2026-03-23T12:00:00Z"
}
```

### Server Errors

**500 Internal Server Error:**
```json
{
  "error": "Failed to connect to Docker daemon",
  "timestamp": "2026-03-23T12:00:00Z"
}
```

## Rate Limiting

Current implementation has no explicit rate limits. Production deployment should add:

- Request throttling (per IP, per endpoint)
- Gateway: max 100 concurrent WebSocket connections
- REST endpoints: 1000 req/min per client IP
- File I/O: cache results for 5-30 seconds

## CORS

CORS is enabled for loopback connections only:

```
Access-Control-Allow-Origin: http://127.0.0.1:*
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Caching

| Endpoint | TTL | Strategy |
|----------|-----|----------|
| `/api/system/metrics` | 5s | In-memory |
| `/api/docker/containers` | None | Always fresh |
| `/api/docker/stats` | None | Always fresh |
| `/api/audit/logs` | None | Stream from disk |
| `/api/cron/jobs` | None | Stream from disk |

## Pagination

For paginated endpoints, use limit + offset pattern:

```
GET /api/audit/logs?limit=50&offset=0   # First page
GET /api/audit/logs?limit=50&offset=50  # Second page
GET /api/audit/logs?limit=50&offset=100 # Third page
```

## Retry Logic

Client-side retry recommendations:

- **500 errors**: Exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
- **429 Too Many Requests**: Respect `Retry-After` header
- **Connection drops**: Auto-reconnect (WebSocket only)

## Authentication

### Gateway WebSocket

Token is automatically injected by server. No client-side auth needed.

### Langfuse, Ollama, GitHub

API keys are stored server-side in environment variables. Client sends no credentials.

### Docker

Uses Unix socket permissions. No explicit auth.

---

**Last Updated:** 2026-03-23  
**Server Version:** 1.0.0
