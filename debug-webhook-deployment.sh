#!/bin/bash

echo "Debugging Street Manager webhook deployment..."
echo "============================================="

# Check if backend is running
echo -e "\n1. Checking backend health:"
curl https://go-barry.onrender.com/api/health

# Check extended health for more info
echo -e "\n\n2. Checking extended health:"
curl https://go-barry.onrender.com/api/health-extended | jq '.services'

# Try the catch-all route to see error
echo -e "\n\n3. Testing undefined route (should show 404 with hint):"
curl https://go-barry.onrender.com/api/streetmanager/undefined-route

# Check if the main streetmanager routes work
echo -e "\n\n4. Testing legacy streetmanager endpoint:"
curl https://go-barry.onrender.com/api/streetmanager/status

# Check logs for import errors
echo -e "\n\n5. Next steps:"
echo "   - Check Render dashboard logs for import errors"
echo "   - Look for 'streetManagerWebhookRouter' import issues"
echo "   - Check if 'processStreetManagerEvent' import is failing"
