#!/bin/bash

echo "🔍 Checking Go BARRY Backend Status..."
echo "=================================="

# Check health endpoint
echo -e "\n1️⃣ Health Check:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://go-barry.onrender.com/api/health || echo "❌ Failed to connect"

# Check headers with CORS
echo -e "\n2️⃣ CORS Headers Check:"
curl -I -s https://go-barry.onrender.com/api/health | grep -i "access-control" || echo "❌ No CORS headers found"

# Check alerts endpoint
echo -e "\n3️⃣ Alerts Enhanced Endpoint:"
curl -s -o /dev/null -w "Status: %{http_code}\n" -H "Origin: https://www.gobarry.co.uk" https://go-barry.onrender.com/api/alerts-enhanced || echo "❌ Failed to connect"

# Check if backend is responding at all
echo -e "\n4️⃣ Basic Connection Test:"
curl -s -w "\nResponse time: %{time_total}s\n" https://go-barry.onrender.com/api/health | head -1 || echo "❌ No response"

echo -e "\n=================================="
echo "✅ Check complete"
