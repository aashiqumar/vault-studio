#!/usr/bin/env bash
# One-time setup for Vault Studio (macOS / Linux / WSL). Needs Node 18+ and Python 3.9+.
set -e
cd "$(dirname "$0")"
npm install
npx playwright install chromium

# Python (audio). Newer Debian/Ubuntu block system-wide pip (PEP 668), so use apt packages or a local .venv.
if python3 -c "import numpy, scipy" 2>/dev/null; then
  echo "✓ numpy/scipy already available"
elif python3 -m venv .venv 2>/dev/null && .venv/bin/pip install -q -r requirements.txt; then
  echo "✓ Python deps installed in .venv"
else
  echo "✗ Could not install Python deps. Run ONE of these, then re-run ./setup.sh:"
  echo "    sudo apt install -y python3-numpy python3-scipy ffmpeg"
  echo "    sudo apt install -y python3-venv python3-full ffmpeg"
  exit 1
fi
command -v ffmpeg >/dev/null || echo "ℹ ffmpeg not on PATH. Reels will use the copy from imageio-ffmpeg if it's in .venv; otherwise run: sudo apt install -y ffmpeg"

mkdir -p out
touch content/activity.jsonl
echo ""
echo "✓ Vault Studio ready."
echo "  Dashboard:  npm run studio   → http://localhost:4747"
echo "  Library:    npm run status"
