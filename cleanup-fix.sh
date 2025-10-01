#!/bin/bash
# Clean up empty fix directory
if [ -d "/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/src/utils/fix" ]; then
  rmdir "/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/src/utils/fix" 2>/dev/null
  echo "Cleaned up fix directory"
fi
