#!/bin/bash

echo "Quick diagnostics for Street Manager webhook..."
echo "=============================================="

# Check if the backend is running
echo -e "\n1. Checking backend health:"
curl -s https://go-barry.onrender.com/api/health | jq '.'

# Check if we get 404 with our custom format
echo -e "\n\n2. Testing 404 response format:"
curl -s https://go-barry.onrender.com/api/undefined-endpoint | jq '.'

# Check the legacy streetmanager endpoint
echo -e "\n\n3. Testing legacy streetmanager status:"
curl -s https://go-barry.onrender.com/api/streetmanager/status | jq '.'

# List all working endpoints from health-extended
echo -e "\n\n4. Getting list of registered routes:"
curl -s https://go-barry.onrender.com/api/health-extended | jq '.routes'

echo -e "\n\n5. Next steps:"
echo "   - Check Render logs for import errors"
echo "   - Look for '✅ streetManagerWebhookRouter imported'"
echo "   - Check for any error messages during route registration"
