#!/usr/bin/env bash
# Adds a "Vault Studio" launcher to the app menu and the desktop (Linux: GNOME, KDE, Cinnamon, XFCE).
# Run once from a terminal inside the vault-studio folder:  scripts/install-shortcut.sh
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node || true)"
[ -z "$NODE" ] && { echo "✗ node not found on PATH. Install Node 18+ first."; exit 1; }
chmod +x "$DIR/scripts/studio-launch.sh"
APPS="$HOME/.local/share/applications"; mkdir -p "$APPS"
ENTRY="$APPS/vault-studio.desktop"
cat > "$ENTRY" <<DESK
[Desktop Entry]
Type=Application
Name=Vault Studio
Comment=Vault marketing dashboard: calendar, board, library, live renders
Exec=env NODE_BIN=$NODE "$DIR/scripts/studio-launch.sh"
Icon=$DIR/brand/logo/vault-icon.png
Terminal=false
Categories=Office;Graphics;
StartupWMClass=VaultStudio
Actions=phone;stop;

[Desktop Action phone]
Name=Open with phone access (Wi-Fi)
Exec=env NODE_BIN=$NODE "$DIR/scripts/studio-launch.sh" --lan

[Desktop Action stop]
Name=Stop dashboard server
Exec=env NODE_BIN=$NODE "$DIR/scripts/studio-launch.sh" --stop
DESK
chmod +x "$ENTRY"
command -v update-desktop-database >/dev/null && update-desktop-database "$APPS" 2>/dev/null || true

DESKTOP="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
if [ -d "$DESKTOP" ]; then
  cp "$ENTRY" "$DESKTOP/vault-studio.desktop"; chmod +x "$DESKTOP/vault-studio.desktop"
  command -v gio >/dev/null && gio set "$DESKTOP/vault-studio.desktop" metadata::trusted true 2>/dev/null || true
  echo "✓ Desktop icon: $DESKTOP/vault-studio.desktop"
fi
echo "✓ App menu entry: $ENTRY"
echo "  To pin it to the dock: open Show Apps (the ⋮⋮⋮ button), search \"Vault Studio\", right-click → Pin to Dash / Add to Favorites."
echo "  (Ubuntu doesn't let you drag desktop icons onto the dock.)"
echo "  If the desktop icon shows a warning, right-click it → Allow Launching."
