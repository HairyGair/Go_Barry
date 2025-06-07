#!/bin/bash

# Quick deployment script for roadworks backend
echo "🚀 Quick Deploy: Roadworks Backend System"

# Add all changes
git add .

# Commit with concise message  
git commit -m "Add roadworks backend API system with workflow management and communication generation"

# Push to trigger Render deployment
git push origin main

echo "✅ Deployed! Check https://go-barry.onrender.com/api/roadworks/stats in 2-3 minutes"