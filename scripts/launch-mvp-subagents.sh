#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/eric_pharr/.openclaw/workspace/ClawCommand"

cat <<'EOF'
ClawCommand MVP subagent launch commands
Copy and run each command in a separate terminal/session.

# 1) Architect
openclaw sessions spawn --name "mvp-architect" --cwd "/home/eric_pharr/.openclaw/workspace/ClawCommand" --message "You are the architect role for ClawCommand desktop MVP. Own packet sequencing, dependency decisions, and risk escalation for real-data-first delivery."

# 2) Frontend Integrator
openclaw sessions spawn --name "mvp-frontend-integrator" --cwd "/home/eric_pharr/.openclaw/workspace/ClawCommand/app" --message "You are the frontend-integrator role for ClawCommand desktop MVP. Replace mock feeds with runtime data, preserve UX, and close packet acceptance criteria."

# 3) Runtime Integrator
openclaw sessions spawn --name "mvp-runtime-integrator" --cwd "/home/eric_pharr/.openclaw/workspace/ClawCommand/app" --message "You are the runtime-integrator role for ClawCommand desktop MVP. Own runtime adapters, data normalization, validation, and safe fallbacks."

# 4) QA / Reliability
openclaw sessions spawn --name "mvp-qa-reliability" --cwd "/home/eric_pharr/.openclaw/workspace/ClawCommand" --message "You are the qa/reliability role for ClawCommand desktop MVP. Validate acceptance criteria, run smoke checks, and file defects with severity."

# 5) Docs / Release
openclaw sessions spawn --name "mvp-docs-release" --cwd "/home/eric_pharr/.openclaw/workspace/ClawCommand/docs" --message "You are the docs/release role for ClawCommand desktop MVP. Maintain runbooks, release notes, rollback notes, and handoff checklist."

# Optional: verify command availability
openclaw help
EOF
