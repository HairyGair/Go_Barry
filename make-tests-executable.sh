#!/bin/bash
# Make test scripts executable

chmod +x test-breakdown-frontend.sh
echo "✅ test-breakdown-frontend.sh is now executable"

# Also make other test scripts executable if they exist
if [ -f "backend/test-breakdown-v2.sh" ]; then
    chmod +x backend/test-breakdown-v2.sh
    echo "✅ backend/test-breakdown-v2.sh is now executable"
fi

echo ""
echo "You can now run the tests with:"
echo "  ./test-breakdown-frontend.sh"
