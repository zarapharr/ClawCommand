# ClawCommand Codebase Triage Report

**Report Generated:** 2026-03-23 20:22 CDT  
**Audit Scope:** Full codebase (app, server, docs)  
**Findings:** 5 sections, 4 actionable issues  

---

## 1. TypeScript Compilation Status

**Severity:** CRITICAL ✓ RESOLVED  
**Finding:** Zero TypeScript errors detected.

```
cd /Users/eric_pharr/.openclaw/workspace/ClawCommand/app && npx tsc -b --noEmit
(no output - clean build)
```

All `.ts` and `.tsx` files compile without errors. No broken type references, missing imports, or validation failures.

---

## 2. Mock Data Dependencies

**Severity:** LOW  
**Finding:** No mock imports detected in `src/`.

```bash
grep -rn "mock" src/ --include="*.tsx" --include="*.ts" | grep -i "import\|from.*mock"
(no results)

grep -rn "mockSystemMetrics\|mockAgents\|mockData\|mock-data" src/ --include="*.tsx" --include="*.ts"
(no results)
```

**Status:** The codebase is already clean of mock data patterns. If mock data was used in earlier phases, it has been fully removed or replaced with real data sources.

**Recommended Action:** Continue live data integration as specified in PRD; no legacy mock cleanup needed.

---

## 3. WebSocket Challenge Response Format

**Severity:** HIGH  
**Status:** Mismatch between implementation and gateway expectations. Requires implementation of device identity signing.

### Current Implementation (gateway-proxy.ts)

ClawCommand backend sends this connect frame:

```json
{
  "type": "req",
  "id": "<uuid>",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "gateway-client",
      "version": "1.0.0",
      "platform": "node",
      "mode": "backend"
    },
    "role": "operator",
    "scopes": ["operator.admin"],
    "auth": {
      "token": "<OPENCLAW_GATEWAY_TOKEN>"
    }
  }
}
```

### Gateway Expectations (OpenClaw gateway-cli-Cxz4pSoJ.js)

The gateway validates connect frames and enforces device identity requirements:

1. **Device Identity Check:**
   - Gateway requires either a device identity (Ed25519 keypair with signed nonce) OR one of two config bypasses
   
2. **Two Resolution Paths:**

   **Option A: Configure Gateway Insecure Auth (Simplest)**
   - Set `gateway.controlUi.allowInsecureAuth=true` in openclaw.json
   - Applies only to Control UI connections (browser/desktop)
   - Still enforces auth token requirement
   - Bypasses device identity check for local clients only
   - Code path: `evaluateMissingDeviceIdentity()` checks `allowInsecureAuthConfigured` and `isLocalClient`
   
   **Option B: Implement Ed25519 Device Identity (Secure)**
   - Generate Ed25519 keypair for backend
   - On `connect.challenge`, extract `nonce` from gateway
   - Sign payload with device private key:
     ```
     payload = {
       deviceId: "<derived-from-public-key>",
       clientId: "gateway-client",
       clientMode: "backend",
       role: "operator",
       scopes: ["operator.admin"],
       signedAtMs: <timestamp>,
       token: "<OPENCLAW_GATEWAY_TOKEN>",
       nonce: "<gateway-nonce>"
     }
     signature = sign(payload, privateKey)
     ```
   - Send in connect frame: `auth: { deviceSignature: "<signature>", devicePublicKey: "<public-key>" }`

### Gateway Logic Flow

From `method-scopes-BWG4Q18M.js`:
- Gateway emits `connect.challenge` event with `nonce`
- Backend receives challenge and has ~60s to respond with connect frame
- Gateway validates in this order:
  1. If device signature present → verify signature (Option B path)
  2. If no device identity but `isControlUi` + `allowInsecureAuthConfigured` + `isLocalClient` → allow (Option A path)
  3. If no device identity and none of above → reject with `kind: "reject-device-required"`

### Current Block

ClawCommand sends token-only auth. Gateway will:
- Check for device signature → missing
- Check for device identity bypass → fails unless Option A is configured
- Result: **Connection rejected with error code `reject-device-required`**

**Recommended Fix:**
1. **Immediate (unblock dev/testing):** Set `gateway.controlUi.allowInsecureAuth=true` in openclaw.json
2. **Before production:** Implement Option B (Ed25519 signing) for secure backend auth
   - Files to update: `server/src/gateway-proxy.ts`
   - Use OpenClaw SDK functions: `loadOrCreateDeviceIdentity()`, `signDevicePayload()`, `verifyDeviceSignature()`
   - Store keypair in safe location (e.g., `~/.openclaw/clawcommand-backend.key`)

---

## 4. LaunchAgent Configuration

**Severity:** MEDIUM (one config issue)  
**Status:** Mostly correct, but missing ENV var.

### Configuration Summary

**File:** `/Users/eric_pharr/Library/LaunchAgents/ai.clawcommand.backend.plist`

| Field | Value | Status |
|-------|-------|--------|
| Node Binary | `/opt/homebrew/bin/node` | ✓ Correct |
| WorkingDirectory | `/Users/eric_pharr/.openclaw/workspace/ClawCommand/server` | ✓ Correct |
| PATH env var | `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin` | ✓ Includes homebrew |
| NODE_ENV | `production` | ✓ Set |
| AutoStart (RunAtLoad) | `true` | ✓ Enabled |
| KeepAlive | `true` | ✓ Enabled |
| Restart policy | `on-failure` with 5s delay | ✓ Appropriate |

### LaunchAgent Runtime Status

```
launchctl list | grep claw
-	78	ai.clawcommand.backend
83582	0	ai.openclaw.gateway
```

| Service | Exit Code | Status |
|---------|-----------|--------|
| ai.clawcommand.backend | 78 | ⚠ Exited with code 78 (likely invalid PID or not running) |
| ai.openclaw.gateway | 0 | ✓ Running cleanly |

### Issues Identified

1. **Missing OPENCLAW_GATEWAY_TOKEN env var:** The plist does not export `OPENCLAW_GATEWAY_TOKEN`. Current code reads it from env; if not set, defaults to empty string `''`.
   - This would cause gateway authentication to fail (Option 3a in WS challenge)
   - Gateway would reject connect frame with invalid/empty token

2. **Missing OPENCLAW_GATEWAY_URL env var:** Currently hardcoded to `ws://127.0.0.1:18789`, which is correct for local gateway but not flexible for future remote/VPS setups.

3. **Backend not running:** Exit code 78 suggests process exited or was never started. Check logs at:
   - Stdout: `/Users/eric_pharr/.openclaw/logs/clawcommand-backend.log`
   - Stderr: `/Users/eric_pharr/.openclaw/logs/clawcommand-backend.error.log`

### Recommended Fix

Update plist to include env vars:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>PATH</key>
  <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  <key>NODE_ENV</key>
  <string>production</string>
  <key>OPENCLAW_GATEWAY_TOKEN</key>
  <string><!-- set via secure method, not plist --></string>
  <key>OPENCLAW_GATEWAY_URL</key>
  <string>ws://127.0.0.1:18789</string>
</dict>
```

**Better approach:** Use a `.env` file in the server directory and load it with `dotenv` in `server/src/index.ts`. Then LaunchAgent only needs to set `NODE_ENV=production`.

---

## 5. Product Requirements Documentation

**Severity:** MEDIUM (outdated docs, but PRD exists)  
**Status:** Multiple PRD versions detected; need consolidation.

### Files Found

| Path | Modified | Size | Status |
|------|----------|------|--------|
| `/docs/MASTER_PRD_ClawCommand_Desktop_Real_Data_MVP.md` | 2026-03-22 22:19 | 9.1 KB | ✓ Current |
| `/docs/PRD-desktop-real-data-mvp.md` | 2026-03-22 22:19 | 7.0 KB | ? |
| `/docs/PHASE2-PRD-TRACEABILITY-MATRIX.md` | 2026-03-22 22:19 | 3.3 KB | ? |
| `PRD.md` (root) | N/A | N/A | ✗ Does not exist |
| `CLAWCOMMAND_PRD.md` (root) | N/A | N/A | ✗ Does not exist |

### Current PRD Summary (MASTER_PRD_ClawCommand_Desktop_Real_Data_MVP.md)

**Status:** Master Draft for Owner Review  
**Date:** 2026-02-27  

**In Scope:**
- Factory Floor Live View
- Session + Task Command Center
- Cron Health + Retry Panel
- Action Console with canonical receipts
- Morning Brief Panel
- Settings (connection/auth/routing visibility)

**Key Requirements:**
- FR-1: Live Event Ingestion (event transport decision Week 1 Day 2)
- Replace all mock data with real runtime data
- Secure local bridge with operational hardening
- Desktop-first (Electron) target
- Single-owner authority model (Eric profile only)

**Non-Goals:**
- Mobile parity
- Multi-tenant RBAC
- Visual skill/workflow builder
- Governance voting panel

### Redundant Documentation

- `/docs/PHASE-2-INDEX.md` - Planning doc (12.9 KB)
- `/docs/SPRINT-PHASE2-FULL-EXECUTION.md` - Execution plan (5.6 KB)
- `/docs/SPRINT1-UAT-SIGNOFF.md` - Sprint 1 results (6.9 KB)
- `/docs/PHASE2-RELEASE-GATE-CC-010.md` - Gate criteria (2.4 KB)
- Multiple integration specs: `CLAWCOMMAND-INTEGRATION-REQUIREMENTS.md`, `factory-floor-spec.md`, `workflow-timeline-spec.md`, etc.

### Issues Identified

1. **No canonical root PRD:** Multiple PRD files exist but none at root level. Unclear which is source-of-truth for ops.
2. **Docs not indexed:** Docs folder has 28 files with no manifest or summary.
3. **Last updated 2026-03-22:** PRD is recent but may not reflect latest sprint status.

### Recommended Fix

1. **Designate canonical PRD:** Move `/docs/MASTER_PRD_ClawCommand_Desktop_Real_Data_MVP.md` to `/PRD.md` as single source-of-truth
2. **Create docs/INDEX.md:** List all docs, purpose, and last update
3. **Archive old versions:** Move superseded Phase 1/2 docs to `docs/archive/`
4. **Link from README:** Root `README.md` should point to `/PRD.md` and `/docs/INDEX.md`

---

## Summary & Priority Queue

| # | Issue | Severity | Category | Estimated Effort | Blocker |
|---|-------|----------|----------|------------------|---------|
| 1 | Add device identity (Ed25519) OR gateway allowInsecureAuth config | HIGH | WS Auth | 2-4 hours | YES - blocks dev |
| 2 | Add OPENCLAW_GATEWAY_TOKEN to LaunchAgent plist | MEDIUM | Config | 30 min | YES - blocks prod |
| 3 | Debug backend exit code 78 and check logs | MEDIUM | Ops | 30 min | Possibly |
| 4 | Use dotenv for env vars instead of plist | MEDIUM | Config | 1 hour | NO |
| 5 | Consolidate PRD docs and add index | LOW | Docs | 1 hour | NO |

### Immediate Action Items (CRITICAL PATH)

1. **Unblock dev:** Configure `gateway.controlUi.allowInsecureAuth=true` in `~/.openclaw/openclaw.json`
2. **Get backend running:** Check error logs, verify token is set, restart service
3. **Plan Ed25519:** Schedule device identity implementation before production release

---

## Appendix: Gateway Device Auth Reference

### evaluateMissingDeviceIdentity() Logic

```
if hasDeviceIdentity → allow
if isControlUi + trustedProxyAuthOk → allow
if isControlUi + controlUiAuthPolicy.allowBypass + role=operator → allow
if isControlUi + !allowBypass + (!allowInsecureAuthConfigured OR !isLocalClient) → REJECT
if roleCanSkipDeviceIdentity(role, sharedAuthOk) → allow
if !authOk + hasSharedAuth → REJECT unauthorized
else → REJECT device-required
```

### shouldSkipBackendSelfPairing() Logic

```
if NOT (client.id=GATEWAY_CLIENT AND client.mode=BACKEND) → false
usesSharedSecret = auth via token/password
usesDeviceToken = auth via device-token
return isLocalClient AND !hasBrowserOriginHeader AND 
       (sharedAuthOk + usesSharedSecret OR usesDeviceToken)
```

**Implication:** Backend with token auth can skip pairing IF local AND no browser origin header. This applies to gateway-proxy.ts.

---

_End of Triage Report_
