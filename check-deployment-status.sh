#!/bin/bash

echo "Quick diagnostics to check deployment status..."
echo "=============================================="

# Check git status
echo -e "\n1. Checking git status:"
git status --short

# Check last commit
echo -e "\n2. Last commit:"
git log -1 --oneline

# Check if health endpoint works (to confirm backend is running)
echo -e "\n3. Testing health endpoint:"
curl -s https://go-barry.onrender.com/api/health | jq '.'

# Check a simple inline route we know exists
echo -e "\n4. Testing roadwork-alerts-test endpoint (should work):"
curl -s https://go-barry.onrender.com/api/roadwork-alerts-test | jq '.'

# Check deployment time
echo -e "\n5. Current time (for reference):"
date

echo -e "\n6. Possible issues:"
echo "   - Deployment may still be in progress (wait 2-3 more minutes)"
echo "   - render-startup.js might be overriding all routes"
echo "   - The inline routes might not be in the deployed version yet"
echo -e "\n7. Next steps:"
echo "   - Check Render dashboard for deployment status"
echo "   - Look at deployment logs for any errors"
echo "   - Verify the commit was pushed successfully"
