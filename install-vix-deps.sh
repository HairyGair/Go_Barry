#!/bin/bash
# Install VIX dependencies

echo "🚌 Installing VIX Late Runners dependencies..."

# Navigate to backend directory
cd backend

# Install xlsx package
echo "📦 Installing xlsx package..."
npm install xlsx

echo "✅ VIX dependencies installed successfully!"
echo "🚀 You can now restart the backend server to use VIX upload functionality"