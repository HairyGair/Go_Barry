#!/bin/bash
# Test if the backend starts without errors

cd /Users/anthony/Go\ BARRY\ App/backend

echo "🧪 Testing backend startup..."
echo "================================"

# Run the server for 5 seconds and capture output
timeout 5 npm start 2>&1 | tee startup-test.log || true

echo ""
echo "================================"
echo "📊 Checking for errors..."

# Check for specific errors
if grep -q "SyntaxError" startup-test.log; then
  echo "❌ Syntax errors found!"
  grep "SyntaxError" startup-test.log
else
  echo "✅ No syntax errors"
fi

if grep -q "Supabase connection successful" startup-test.log; then
  echo "✅ Supabase connected successfully"
else
  echo "⚠️ Supabase connection not confirmed"
fi

if grep -q "Server running on port" startup-test.log; then
  echo "✅ Server started successfully"
else
  echo "❌ Server failed to start"
fi

# Clean up
rm -f startup-test.log

echo ""
echo "Test complete!"
