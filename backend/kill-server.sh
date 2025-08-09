#!/bin/bash

# backend/kill-server.sh
# Kill all Go BARRY server processes

echo "🛑 Stopping all Go BARRY server processes..."
echo ""

# Kill all node processes related to render-startup.js
pkill -f "node.*render-startup.js"

echo "✅ All server processes stopped"
echo ""
echo "Now start the server again with:"
echo "npm start"
