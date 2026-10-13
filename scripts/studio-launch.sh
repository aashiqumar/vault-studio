#!/usr/bin/env bash
# Opens the Vault Studio dashboard: starts the server in the background if it isn't running,
# then opens it as an app window (Chrome/Chromium/Edge/Brave --app) or the default browser.
#   scripts/studio-launch.sh          start (if needed) + open
#   scripts/studio-launch.sh --lan    same, with phone access on your Wi-Fi (shows a QR code to scan)
#   scripts/studio-launch.sh --stop   stop the background server
set -u
DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${VAULT_STUDIO_PORT:-4747}"
URL="http://localhost:$PORT"
NODE="${NODE_BIN:-$(command -v node || true)}"
LOG="$DIR/out/studio.log"; PIDF="$DIR/out/studio.pid"
mkdir -p "$DIR/out"

notify() { command -v notify-send >/dev/null && notify-send -i "$DIR/brand/logo/vault-icon.png" "Vault Studio" "$1" || echo "$1"; }
up() { "$NODE" -e "fetch('$URL/api/state').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; }
is_lan() { "$NODE" -e "fetch('$URL/api/phone').then(r=>r.json()).then(j=>process.exit(j.lan?0:1)).catch(()=>process.exit(1))" 2>/dev/null; }
stop() { [ -f "$PIDF" ] && kill "$(cat "$PIDF")" 2>/dev/null; rm -f "$PIDF"; for _ in $(seq 1 20); do up || return 0; sleep 0.25; done; }

if [ -z "$NODE" ]; then notify "Node.js not found. Re-run scripts/install-shortcut.sh from a terminal."; exit 1; fi

if [ "${1:-}" = "--stop" ]; then
  if [ -f "$PIDF" ] && kill "$(cat "$PIDF")" 2>/dev/null; then rm -f "$PIDF"; notify "Dashboard stopped."; else notify "Dashboard wasn't running."; fi
  exit 0
fi
LAN=""; OPEN="$URL"
if [ "${1:-}" = "--lan" ]; then
  LAN="--lan"; OPEN="$URL/?phone=1"
  if up && ! is_lan; then stop; up && { notify "A dashboard started from a terminal is running. Stop it (Ctrl+C), then try again."; exit 1; }; fi
fi

if ! up; then
  cd "$DIR"
  nohup "$NODE" scripts/studio.cjs --port "$PORT" $LAN >>"$LOG" 2>&1 &
  echo $! > "$PIDF"
  for _ in $(seq 1 40); do up && break; sleep 0.25; done
  up || { notify "Couldn't start the dashboard. See out/studio.log"; exit 1; }
fi

for b in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge brave-browser; do
  # Own profile dir = its own browser process, so --class sticks and the dock groups the window under the Vault Studio icon.
  if command -v "$b" >/dev/null; then nohup "$b" --app="$OPEN" --class=VaultStudio --user-data-dir="$DIR/out/app-profile" --no-first-run --no-default-browser-check >/dev/null 2>&1 & exit 0; fi
done
if command -v xdg-open >/dev/null; then xdg-open "$OPEN" >/dev/null 2>&1 &
elif command -v open >/dev/null; then open "$OPEN"
else echo "Open $URL in your browser"; fi
