#!/usr/bin/env bash
# One-time setup for Vault Studio (macOS / Linux / WSL). Needs Node 18+ and Python 3.9+.
set -e
cd "$(dirname "$0")"
npm install
npx playwright install chromium
python3 -m pip install -r requirements.txt
mkdir -p out
touch content/activity.jsonl
echo ""
echo "✓ Vault Studio ready."
echo "  Dashboard:  npm run studio   → http://localhost:4747"
echo "  Library:    npm run status"
