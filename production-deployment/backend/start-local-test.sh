#!/bin/bash
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
export PORT=3001
echo "🧪 Testing backend with production NODE_OPTIONS..."
npm start
