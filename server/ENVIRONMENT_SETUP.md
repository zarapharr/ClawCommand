# ClawCommand Environment Setup Guide

Complete walkthrough for configuring all 9 data sources and getting API keys.

## Prerequisites

- macOS (or Linux/Windows with Docker installed)
- Node.js 20+ and npm
- Git
- Docker Desktop (for Langfuse, Qdrant, Ollama containers)

## Data Source Configuration

### 1. OpenClaw Gateway Token

**Status:** Already configured  
**Token Location:** `~/.openclaw/openclaw.json` → `gateway.auth.token`

The gateway token is auto-generated during OpenClaw setup. Verify it:

```bash
# Check in config
grep -A2 "\"auth\":" ~/.openclaw/openclaw.json | grep "token"

# Output should show:
# "token": "5048528cccc8bc2eee7652dcf229b4be0ea067f12019c2db"
```

**Action:** Copy this value to `.env` as `OPENCLAW_GATEWAY_TOKEN`.

---

### 2. Langfuse API Key

**Setup Steps:**

1. Open Langfuse dashboard:
   ```bash
   open http://localhost:3000
   ```

2. Navigate to **Settings** → **API Keys**

3. Click **Create New API Key**

4. Copy the key (starts with `sk_`)

5. Add to `.env`:
   ```bash
   LANGFUSE_API_KEY=sk_your_key_here
   ```

**Verify:**
```bash
curl -H "Authorization: Bearer sk_your_key_here" \
  http://localhost:3000/api/v1/trace
```

Expected: `200 OK` with JSON response

---

### 3. Qdrant (No Auth Required)

**Status:** Ready to connect (localhost:6333)

**Verify:**
```bash
curl http://localhost:6333/health
# Expected: 200 OK
```

**No `.env` entry needed** - Direct connection from React app.

---

### 4. Ollama (No Auth Required)

**Status:** Running locally (127.0.0.1:11434)

**Verify:**
```bash
curl http://127.0.0.1:11434/api/tags
# Expected: 200 OK with model list
```

**Set in `.env`:**
```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

---

### 5. Docker Daemon (No Auth Required)

**Status:** Socket-based local access

**Verify socket exists:**
```bash
ls -la ~/.docker/run/docker.sock
# Expected: srwxrwxrwx
```

**Set in `.env`:**
```bash
DOCKER_SOCKET_PATH=/Users/eric_pharr/.docker/run/docker.sock
```

---

### 6. GitHub API Token

**Setup Steps:**

1. Go to https://github.com/settings/tokens

2. Click **Generate new token (classic)**

3. Enter name: `ClawCommand Backend`

4. Select scopes:
   - `repo` (full control)
   - `read:org` (read organization data)
   - `read:user` (read profile)

5. Click **Generate token**

6. Copy immediately (you won't see it again)

7. Add to `.env`:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   ```

**Verify:**
```bash
curl -H "Authorization: Bearer ghp_your_token_here" \
  https://api.github.com/user
# Expected: 200 OK with your GitHub profile
```

**For SSH Git Operations (separate):**

GitHub CLI is pre-configured via Keychain on macOS:
```bash
gh auth status
# Output: Logged in to github.com as zarapharr
```

---

### 7. Audit Logs (Filesystem)

**Status:** Logs already being written

**Location:** `~/.openclaw/workspace/logs/audit/`

**Verify:**
```bash
ls -lh ~/.openclaw/workspace/logs/audit/
# Expected: audit-2026-03-*.jsonl files
```

**Set in `.env`:**
```bash
AUDIT_LOGS_PATH=/Users/eric_pharr/.openclaw/workspace/logs/audit
```

---

### 8. Cron Jobs (Filesystem)

**Status:** Jobs database already created

**Location:** `~/.openclaw/.cron/jobs.json`

**Verify:**
```bash
wc -l ~/.openclaw/.cron/jobs.json
# Expected: 315000+ line JSON file
```

**Set in `.env`:**
```bash
CRON_JOBS_PATH=/Users/eric_pharr/.openclaw/.cron/jobs.json
```

---

### 9. System Metrics (OS-level)

**Status:** No configuration needed

System metrics are gathered via `systeminformation` npm package. Requires no auth or external config.

**Verify npm module installed:**
```bash
cd server && npm list systeminformation
```

---

## Complete .env Template

Copy this to `server/.env` and fill in the blanks:

```bash
# ========================================
# OPENCLAW GATEWAY
# ========================================
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=5048528cccc8bc2eee7652dcf229b4be0ea067f12019c2db

# ========================================
# LANGFUSE
# ========================================
LANGFUSE_API_KEY=sk_your_key_from_dashboard
LANGFUSE_BASE_URL=http://localhost:3000

# ========================================
# OLLAMA
# ========================================
OLLAMA_BASE_URL=http://127.0.0.1:11434

# ========================================
# DOCKER
# ========================================
DOCKER_SOCKET_PATH=/Users/eric_pharr/.docker/run/docker.sock

# ========================================
# GITHUB
# ========================================
GITHUB_TOKEN=ghp_your_pat_from_github_settings
GITHUB_OWNER=zarapharr

# ========================================
# FILE PATHS
# ========================================
AUDIT_LOGS_PATH=/Users/eric_pharr/.openclaw/workspace/logs/audit
CRON_JOBS_PATH=/Users/eric_pharr/.openclaw/.cron/jobs.json
CRON_RUNS_PATH=/Users/eric_pharr/.openclaw/.cron/runs

# ========================================
# PROXY SERVER
# ========================================
PROXY_SERVER_PORT=8000
PROXY_SERVER_HOST=127.0.0.1
NODE_ENV=development
SYSTEM_METRICS_REFRESH_MS=5000
```

---

## Validation Checklist

Run this to verify all data sources are accessible:

```bash
#!/bin/bash
set -e

echo "✓ Checking OpenClaw Gateway..."
curl -s http://127.0.0.1:18789 > /dev/null && echo "  ✓ Gateway responding" || echo "  ✗ Gateway not responding"

echo "✓ Checking Langfuse..."
curl -s http://localhost:3000/health | jq . && echo "  ✓ Langfuse responding" || echo "  ✗ Langfuse not responding"

echo "✓ Checking Qdrant..."
curl -s http://localhost:6333/health | jq . && echo "  ✓ Qdrant responding" || echo "  ✗ Qdrant not responding"

echo "✓ Checking Ollama..."
curl -s http://127.0.0.1:11434/api/tags | jq . && echo "  ✓ Ollama responding" || echo "  ✗ Ollama not responding"

echo "✓ Checking Docker socket..."
test -S ~/.docker/run/docker.sock && echo "  ✓ Docker socket present" || echo "  ✗ Docker socket missing"

echo "✓ Checking audit logs..."
test -d ~/.openclaw/workspace/logs/audit && echo "  ✓ Audit logs directory exists" || echo "  ✗ Audit logs directory missing"

echo "✓ Checking cron jobs..."
test -f ~/.openclaw/.cron/jobs.json && echo "  ✓ Cron jobs file exists" || echo "  ✗ Cron jobs file missing"

echo ""
echo "✓ All checks complete!"
```

Save as `verify-setup.sh` and run:
```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

---

## Debugging Connection Issues

### Gateway Connection Fails

Check if gateway is running:
```bash
openclaw gateway status
# Expected: Running

# If not running:
openclaw gateway start
```

Check token in config:
```bash
cat ~/.openclaw/openclaw.json | jq .gateway.auth.token
```

### Langfuse Connection Fails

Check if container is running:
```bash
docker ps | grep langfuse
# Expected: langfuse container listed

# If not running:
docker-compose up -d
```

Check API key:
```bash
curl -H "Authorization: Bearer YOUR_KEY" http://localhost:3000/api/v1/trace
```

### Qdrant Connection Fails

Check if container is running:
```bash
docker ps | grep qdrant

# If not running:
docker start qdrant
```

### Docker Daemon Access Denied

Check permissions:
```bash
ls -la ~/.docker/run/docker.sock
# Expected: srwxrwxrwx (or similar with read permission for user)

# If permission denied:
docker run --rm hello-world
# Tests if docker is accessible at all
```

### GitHub API Returns 401

Token may be expired or revoked. Generate a new one:
1. Go to https://github.com/settings/tokens
2. Generate new token with `repo` scope
3. Update `.env` with new token

---

## Production Secrets Management

**DO NOT commit `.env` to git.**

For production:

1. Use environment variable files (CI/CD):
   ```bash
   # GitHub Actions example
   echo "LANGFUSE_API_KEY=${{ secrets.LANGFUSE_API_KEY }}" >> .env
   ```

2. Or use a secrets manager:
   ```bash
   # 1Password example
   eval $(op signin)
   op read "op://vault/ClawCommand/LANGFUSE_API_KEY" > .env
   ```

3. Or use systemd user secrets:
   ```bash
   systemd-creds encrypt LANGFUSE_API_KEY
   ```

4. Or Kubernetes secrets:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: clawcommand-backend
   data:
     LANGFUSE_API_KEY: base64-encoded-key
   ```

---

## Quick Start After Setup

1. Copy `.env.example`:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Fill in API keys:
   ```bash
   nano .env
   # Edit with your keys
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build:
   ```bash
   npm run build
   ```

5. Start server:
   ```bash
   npm start
   # Server running on http://127.0.0.1:8000
   ```

6. Test in another terminal:
   ```bash
   curl http://127.0.0.1:8000/health
   # Expected: {"status":"ok",...}
   ```

---

## Environment Variables Summary

| Variable | Type | Source | Critical |
|----------|------|--------|----------|
| `OPENCLAW_GATEWAY_TOKEN` | Token | openclaw.json | Yes |
| `LANGFUSE_API_KEY` | Key | Langfuse dashboard | Yes |
| `GITHUB_TOKEN` | Token | GitHub settings | Yes |
| `OLLAMA_BASE_URL` | URL | Config | No (has default) |
| `DOCKER_SOCKET_PATH` | Path | Config | No (has default) |
| `AUDIT_LOGS_PATH` | Path | Config | No (has default) |
| `CRON_JOBS_PATH` | Path | Config | No (has default) |
| `PROXY_SERVER_PORT` | Number | Config | No (default: 8000) |
| `PROXY_SERVER_HOST` | String | Config | No (default: 127.0.0.1) |

---

**Setup Time:** ~10 minutes (mostly API key generation)  
**Success Criteria:** All 3 critical variables set + all services responding to health checks
