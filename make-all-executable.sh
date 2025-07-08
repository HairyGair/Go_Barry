#!/bin/bash
# Make all fix scripts executable
chmod +x emergency-cache-clear.sh
chmod +x COMPLETE_CACHE_RESET.sh
chmod +x diagnose-operations-error.sh
chmod +x verify-operations-fix.sh
chmod +x fix-operations-properly.sh
chmod +x clear-all-caches.sh
chmod +x clear-cache.sh
chmod +x make-executable.sh
chmod +x run-verify.sh

echo "✅ All scripts are now executable!"
echo ""
echo "To fix the _operations-centre-disabled error:"
echo "1. Run: ./COMPLETE_CACHE_RESET.sh"
echo "2. Follow the instructions it provides"
