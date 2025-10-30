#!/bin/bash

# Update Documentation to cPanel-Only Deployment
# Date: October 27, 2025
# Purpose: Remove all Render.com references and standardize on cPanel

set -e  # Exit on error

echo "========================================="
echo "Updating Go BARRY Documentation"
echo "Target: cPanel-Only Deployment"
echo "========================================="
echo ""

# Define files to update
FILES=(
    "CPANEL_INTEGRATION_GUIDE_FIXED.md"
    "QUICK_REFERENCE_V2.md"
    "API_INTEGRATION_ROADMAP_V2.md"
    "CPANEL_MANUAL_DEPLOYMENT_CHECKLIST.md"
    "COMPLETE_API_ENDPOINT_AUDIT.md"
    "SCREEN_TO_SCREEN_DATA_FLOW.md"
)

# Create backup directory
BACKUP_DIR="./documentation_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"
echo ""

# Backup original files
echo "Backing up original files..."
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "  ✓ Backed up: $file"
    else
        echo "  ⚠ File not found: $file"
    fi
done
echo ""

# Function to perform replacements
update_file() {
    local file=$1
    local output_file="${file%.md}_CPANEL_ONLY.md"

    echo "Processing: $file"

    # Create new file with replacements
    sed -E \
        -e 's|https://go-barry\.onrender\.com|https://breakdowns.gobarry.co.uk|g' \
        -e 's|https://breakdown-guide\.onrender\.com|https://breakdowns.gobarry.co.uk|g' \
        -e 's|wss://go-barry\.onrender\.com|wss://breakdowns.gobarry.co.uk|g' \
        -e 's|https://dashboard\.render\.com|https://breakdowns.gobarry.co.uk:2083 (cPanel)|g' \
        -e 's|Render\.com \(Current\)|cPanel|g' \
        -e 's|Render\.com|cPanel|g' \
        -e 's|render\.com|cPanel hosting|g' \
        -e 's|Deployment Targets: Render\.com.*\+ cPanel.*|Deployment Target: cPanel (shared/dedicated hosting)|' \
        -e 's|Current Deployment: Render\.com.*|Current Deployment: cPanel with MySQL backend|' \
        -e 's|2GB RAM limit on Render\.com|512MB-1GB RAM limit (cPanel shared hosting, 2GB+ on dedicated)|g' \
        -e 's|2GB RAM limit \(Render-specific\)|512MB-2GB RAM (depends on cPanel hosting plan)|g' \
        -e 's|Memory Constraint: 2GB RAM limit on Render\.com|Memory Limits: 512MB (shared) to 8GB+ (dedicated cPanel)|g' \
        -e 's|\*\*Render\.com \(Development\)\*\*:.*|**cPanel (Production)**: https://breakdowns.gobarry.co.uk|' \
        -e 's|API_URL="https://go-barry\.onrender\.com"|API_URL="https://breakdowns.gobarry.co.uk"|g' \
        -e 's|Production: https://go-barry\.onrender\.com|Production: https://breakdowns.gobarry.co.uk|g' \
        -e 's|Render \(Development\)|cPanel (Production)|g' \
        -e 's|onrender\.com|gobarry.co.uk|g' \
        -e 's|PRODUCTION_URL=https://.*onrender\.com|PRODUCTION_URL=https://breakdowns.gobarry.co.uk|g' \
        -e 's|ALLOWED_ORIGINS=.*onrender\.com.*|ALLOWED_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk,https://breakdowns.gobarry.co.uk,http://localhost:3000,http://localhost:8081|' \
        -e 's|/\^https:\\/\\/\.\*\\.onrender\\.com\$/||g' \
        -e 's|/\^https:\\/\\/\.\*\\.render\\.com\$/||g' \
        "$file" > "$output_file"

    echo "  ✓ Created: $output_file"
    echo ""
}

# Process each file
echo "========================================="
echo "Updating Documentation Files"
echo "========================================="
echo ""

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        update_file "$file"
    else
        echo "⚠ Skipping missing file: $file"
        echo ""
    fi
done

# Create summary report
echo "========================================="
echo "Update Complete!"
echo "========================================="
echo ""
echo "Files created with _CPANEL_ONLY suffix:"
for file in "${FILES[@]}"; do
    output_file="${file%.md}_CPANEL_ONLY.md"
    if [ -f "$output_file" ]; then
        lines=$(wc -l < "$output_file")
        echo "  ✓ $output_file ($lines lines)"
    fi
done
echo ""

echo "Backup location: $BACKUP_DIR"
echo ""

echo "Next steps:"
echo "1. Review *_CPANEL_ONLY.md files"
echo "2. Compare with originals: diff ORIGINAL.md ORIGINAL_CPANEL_ONLY.md"
echo "3. Test all URLs and commands"
echo "4. Replace original files when satisfied"
echo ""

echo "To restore backups if needed:"
echo "  cp $BACKUP_DIR/* ."
echo ""

echo "========================================="
echo "Summary of Changes"
echo "========================================="
echo ""
echo "URL Changes:"
echo "  go-barry.onrender.com → breakdowns.gobarry.co.uk"
echo "  breakdown-guide.onrender.com → breakdowns.gobarry.co.uk"
echo ""
echo "Platform Changes:"
echo "  Render.com → cPanel"
echo "  2GB RAM limit → 512MB-1GB (shared) or 2GB+ (dedicated)"
echo ""
echo "Deployment Method:"
echo "  Git push to Render → FTP/SFTP upload to cPanel"
echo "  Render Dashboard → cPanel File Manager / SSH"
echo ""

exit 0
