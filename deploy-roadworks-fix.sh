#!/bin/bash

echo "🚀 Deploying roadworks to CORRECT index file (index-v3-optimized.js)"

# Add all changes
git add .

# Commit with specific message about the fix
git commit -m "Fix roadworks API: Add to index-v3-optimized.js (the actual running file)"

# Push to trigger Render deployment
git push origin main

echo "✅ Deploying! Roadworks API will be available in 2-3 minutes at:"
echo "   https://go-barry.onrender.com/api/roadworks/stats"