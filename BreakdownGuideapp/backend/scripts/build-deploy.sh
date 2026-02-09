#!/bin/bash
# ============================================
# Go BARRY Backend - Build Deployment Package
# ============================================
# Creates a ready-to-upload folder for Cyberduck/FTP
#
# Usage: npm run build:deploy
#        or: bash scripts/build-deploy.sh
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory and backend root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$BACKEND_DIR/deploy"

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Go BARRY Backend - Deployment Builder${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

cd "$BACKEND_DIR"

# Clean previous build
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
fi

mkdir -p "$BUILD_DIR"

echo -e "${YELLOW}Packaging backend files...${NC}"

# Copy application directories
DIRS_TO_COPY=(config data middleware migrations routes services utils validation)
for dir in "${DIRS_TO_COPY[@]}"; do
    if [ -d "$dir" ]; then
        cp -r "$dir" "$BUILD_DIR/"
        echo -e "  ${GREEN}+${NC} $dir/"
    fi
done

# Copy root files
FILES_TO_COPY=(server.js package.json package-lock.json .htaccess .env.example)
for file in "${FILES_TO_COPY[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BUILD_DIR/"
        echo -e "  ${GREEN}+${NC} $file"
    fi
done

# Remove any .DS_Store files that got copied
find "$BUILD_DIR" -name '.DS_Store' -delete 2>/dev/null

# Remove any .env files that accidentally got into subdirs
find "$BUILD_DIR" -name '.env' -not -name '.env.example' -delete 2>/dev/null

# Count files
FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Build complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Files:    ${BLUE}${FILE_COUNT}${NC}"
echo -e "  Size:     ${BLUE}${DIR_SIZE}${NC}"
echo -e "  Location: ${BLUE}backend/deploy/${NC}"
echo ""
echo -e "${YELLOW}Deployment:${NC}"
echo -e "  1. Open ${BLUE}backend/deploy/${NC} in Cyberduck"
echo -e "  2. Copy all contents to ${BLUE}~/api/${NC} on the server"
echo -e "  3. Run: ${BLUE}npm ci --production${NC}"
echo -e "  4. Run: ${BLUE}pm2 restart breakdown-backend${NC}"
echo ""
