#!/bin/bash

echo "Forcing Render redeployment..."
echo "=============================="

# Add a deployment timestamp to force redeploy
echo -e "\n1. Adding deployment timestamp to index.js..."
echo "// Deployment timestamp: $(date)" >> backend/index.js

# Commit and push
echo -e "\n2. Committing and pushing..."
git add backend/index.js
git commit -m "Force redeploy: Add Street Manager webhook routes"
git push

echo -e "\n3. Done! Wait 2-3 minutes for Render to deploy, then test:"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook/status"
