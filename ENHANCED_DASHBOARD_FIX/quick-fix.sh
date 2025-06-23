#!/bin/bash
# Quick fix for EnhancedDashboard.jsx error

echo "🔧 Fixing EnhancedDashboard.jsx error..."

# Create backup
cp ../Go_BARRY/components/EnhancedDashboard.jsx ../Go_BARRY/components/EnhancedDashboard.jsx.backup

# Apply the critical fix for stats calculation
# This uses sed to replace the problematic code

# Fix 1: Update stats calculation to add defensive checks
sed -i '' '
/const stats = useMemo(() => {/,/}, \[processedAlerts\]);/ {
  s/const alerts = processedAlerts\.all;/const alerts = processedAlerts?.all || [];/
  s/processedAlerts\.critical\.length/processedAlerts?.critical?.length || 0/g
  s/processedAlerts\.high\.length/processedAlerts?.high?.length || 0/g
  s/processedAlerts\.medium\.length/processedAlerts?.medium?.length || 0/g
}
' ../Go_BARRY/components/EnhancedDashboard.jsx

# Fix 2: Update filteredAlerts to add null check
sed -i '' '
/const filteredAlerts = useMemo(() => {/,/}, \[processedAlerts, selectedFilter\]);/ {
  s/if (selectedFilter === '\''all'\'') return processedAlerts\.all;/if (!processedAlerts) return [];\
  \
  if (selectedFilter === '\''all'\'') {\
    return processedAlerts.all || [];\
  }/
}
' ../Go_BARRY/components/EnhancedDashboard.jsx

echo "✅ Fix applied!"
echo ""
echo "Changes made:"
echo "1. Added defensive checks to stats calculation"
echo "2. Added null checks to filteredAlerts"
echo ""
echo "Original file backed up to: EnhancedDashboard.jsx.backup"
echo ""
echo "Please refresh your browser to see the fix in action!"