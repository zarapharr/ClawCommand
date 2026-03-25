#!/bin/bash
cd /Users/eric_pharr/.openclaw/workspace/ClawCommand/server
set -a
source .env
set +a
exec /opt/homebrew/bin/node dist/index.js
