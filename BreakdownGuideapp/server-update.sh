#!/bin/bash
set -euo pipefail

# ─── Go BARRY Breakdown Guide — Server Deploy Script ─────────────────────────
# Downloads the latest release from GitHub and deploys to cPanel.
#
# First-time setup:
#   1. SSH into the server: ssh gobarryco@85.234.151.224
#   2. Upload this script:  scp server-update.sh gobarryco@85.234.151.224:~/update-breakdown.sh
#   3. Make executable:     chmod +x ~/update-breakdown.sh
#   4. Ensure .env exists:  ls ~/api/.env
#   5. Run first deploy:    ./update-breakdown.sh
#
# Usage:
#   ./update-breakdown.sh
# ──────────────────────────────────────────────────────────────────────────────

REPO="HairyGair/Go_Barry"
BACKEND_DIR="$HOME/api"
FRONTEND_DIR="$HOME/public_html/breakdowns.gobarry.co.uk"
STAGING="$HOME/breakdown-staging"
TARBALL="breakdown-deploy.tar.gz"
BACKUP_DIR="$HOME/backups"

echo ""
echo "=== Go BARRY Breakdown Guide — Deploying ==="
echo ""

cd "$HOME"

# Create backup directory if needed
mkdir -p "$BACKUP_DIR"

# Backup current backend
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Backing up current backend..."
if [ -d "$BACKEND_DIR" ]; then
  tar -czf "$BACKUP_DIR/backend_backup_$TIMESTAMP.tar.gz" -C "$HOME" api/ 2>/dev/null || echo "  (no existing backend to backup)"
fi

# Clean up any previous staging
rm -rf "$STAGING"
mkdir -p "$STAGING"

echo "Downloading latest release..."
curl -fsSL "https://github.com/$REPO/releases/download/breakdown-latest/$TARBALL" -o "$TARBALL"

echo "Extracting to staging..."
tar -xzf "$TARBALL" -C "$STAGING" --strip-components=1

# ── Deploy Backend ──────────────────────────────────────────────────────────

echo ""
echo "--- Deploying backend to $BACKEND_DIR ---"

# Preserve .env (never overwrite production secrets)
if [ -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env" "$HOME/.env.breakdown.bak"
fi

# Copy backend files (overwrite application code, keep .env)
cp -rf "$STAGING"/backend/* "$BACKEND_DIR/"

# Restore .env
if [ -f "$HOME/.env.breakdown.bak" ]; then
  mv "$HOME/.env.breakdown.bak" "$BACKEND_DIR/.env"
fi

# Install production dependencies
echo "Installing dependencies..."
cd "$BACKEND_DIR"
npm ci --production

# ── Deploy Frontend ─────────────────────────────────────────────────────────

echo ""
echo "--- Deploying frontend to $FRONTEND_DIR ---"

# Preserve any custom .htaccess additions (the dist should include one from build)
mkdir -p "$FRONTEND_DIR"
rm -rf "$FRONTEND_DIR"/*
cp -r "$STAGING"/frontend-dist/* "$FRONTEND_DIR/"

# ── Restart Services ────────────────────────────────────────────────────────

echo ""
echo "--- Restarting PM2 ---"
pm2 restart breakdown-backend
sleep 2

echo ""
echo "=== Deployment complete! ==="
echo ""
pm2 status

# Cleanup
rm -rf "$STAGING" "$HOME/$TARBALL"

# Keep only last 5 backups
echo ""
echo "Cleaning old backups..."
ls -t "$BACKUP_DIR"/backend_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

# Verify
echo ""
echo "--- Verifying deployment ---"
sleep 2
echo "Backend health:"
curl -s https://api.breakdowns.gobarry.co.uk/api/health | head -c 300
echo ""
echo ""
echo "Frontend:"
curl -sI https://breakdowns.gobarry.co.uk | head -3
echo ""
echo "Done!"
