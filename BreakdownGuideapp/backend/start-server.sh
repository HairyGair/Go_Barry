#!/bin/bash
#
# Go BARRY Backend Server Startup Script
#
# This script configures Node.js options for shared hosting environments
# with limited memory resources
#

# Disable undici WebAssembly to prevent memory allocation errors on shared hosting
# This fixes the "WebAssembly.instantiate(): Out of memory" error
export NODE_OPTIONS="--no-experimental-fetch"

# Alternative: Use older Node.js fetch implementation without WebAssembly
# export NODE_OPTIONS="--no-experimental-fetch --max-old-space-size=1024"

# Start the server
echo "🚀 Starting Go BARRY Backend Server..."
echo "📍 Node Options: $NODE_OPTIONS"
echo "🔧 Disabling experimental fetch to avoid WebAssembly memory errors"
echo ""

node server.js
