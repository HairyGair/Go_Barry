#!/bin/bash
# Quick script to find and fix the syntax error
# Run from backend directory: ./find-syntax-error.sh

echo "🔍 Searching for syntax issues in backend..."

# First, try to run Node with syntax checking
echo "Running syntax check on index.js..."
node --check index.js 2>&1 | grep -A 5 -B 5 "compareScheduledVsActual"

# If that doesn't work, search all JS files for the string
echo -e "\n📝 Searching for 'compareScheduledVsActual' in all files..."
grep -r "compareScheduledVsActual" . --include="*.js" --exclude-dir=node_modules 2>/dev/null

# Search for common syntax patterns that might cause this error
echo -e "\n⚠️  Looking for potential syntax issues..."

# Find object methods without commas
echo "Checking for missing commas in object methods..."
grep -n -E "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(" . --include="*.js" --exclude-dir=node_modules -B1 | grep -B1 -v "function\|const\|let\|var\|if\|for\|while" | head -20

# Find incomplete function declarations
echo -e "\nChecking for incomplete function declarations..."
grep -n -E "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*$" . --include="*.js" --exclude-dir=node_modules | head -20

echo -e "\n✅ Search complete. If 'compareScheduledVsActual' wasn't found, it might be:"
echo "1. In a file that's being dynamically created"
echo "2. Part of an incomplete edit"
echo "3. In a string that's being evaluated"

echo -e "\n💡 To fix:"
echo "1. Check recent Git changes: git status && git diff"
echo "2. Look for incomplete edits in your IDE"
echo "3. Try reverting recent changes to identify the problematic file"
