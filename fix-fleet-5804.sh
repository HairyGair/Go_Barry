#!/bin/bash

# Make scripts executable and run the fleet database fix

echo "🔧 Fixing Fleet 5804 Database Issue..."
echo "======================================"
echo ""

# Make scripts executable
chmod +x generate-complete-fleet-database.mjs
chmod +x test-fleet-5804.mjs

echo "📊 Generating complete fleet database from Excel..."
echo ""

# Run the generator
node generate-complete-fleet-database.mjs

echo ""
echo "======================================"
echo "🔍 Testing the fix..."
echo ""

# Test the result
node test-fleet-5804.mjs

echo ""
echo "======================================"
echo "✅ Fix complete!"
echo ""
echo "Next steps:"
echo "1. Open your browser to the Go BARRY application"
echo "2. Clear cache (Ctrl+F5 or Cmd+Shift+R)"
echo "3. Try entering fleet number 5804 again"
echo ""
echo "The error should now be resolved! 🎉"
