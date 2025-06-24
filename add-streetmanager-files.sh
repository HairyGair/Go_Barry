#!/bin/bash

echo "Adding Street Manager webhook files to git..."

cd /Users/anthony/Go\ BARRY\ App

# Force add the new files
git add -f backend/routes/streetManagerWebhook.js
git add -f backend/services/streetManagerEvents.js
git add -f docs/streetmanager-webhook-setup.html
git add -f docs/STREETMANAGER_INTEGRATION.md

# Check if backend/index.js has changes
git add backend/index.js
git add backend/services/convexSync.js

# Show status
echo -e "\nGit status after adding files:"
git status

echo -e "\nIf files were added, you can now commit with:"
echo "git commit -m 'Add Street Manager webhook integration for real-time roadwork updates'"
