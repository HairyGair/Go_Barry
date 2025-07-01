#!/bin/bash
# Diagnose the _operations-centre-disabled issue

echo "🔍 Diagnosing _operations-centre-disabled Error"
echo "=============================================="
echo ""

echo "Checking for any references to _operations-centre-disabled..."
echo ""

# Check if the folder exists anywhere
echo "1. Checking if folder exists:"
find . -name "_operations-centre-disabled" -type d 2>/dev/null | head -20

echo ""
echo "2. Checking for references in code:"
grep -r "_operations-centre-disabled" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -20

echo ""
echo "3. Current app folder structure:"
ls -la app/ | grep operations

echo ""
echo "4. Checking .expo folder:"
ls -la .expo/web/cache 2>/dev/null || echo "No .expo/web/cache folder"

echo ""
echo "5. Checking temp folders:"
ls $TMPDIR | grep -E "(metro|haste|react)" | head -10

echo ""
echo "📊 DIAGNOSIS COMPLETE"
echo ""
echo "If you see references to _operations-centre-disabled above,"
echo "run: ./COMPLETE_CACHE_RESET.sh"
echo ""
echo "Otherwise, the issue is in the Metro bundler's memory cache."
echo "Solution: Stop the server (Ctrl+C) and restart with: npm start -- --clear"
