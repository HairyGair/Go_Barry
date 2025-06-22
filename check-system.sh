#!/bin/bash
# Quick system check script

echo "🔍 GO BARRY SYSTEM CHECK"
echo "========================"
echo ""

# Check if backend is running
echo "1️⃣ Checking backend status..."
curl -s http://localhost:3001/api/health || echo "❌ Backend not responding on localhost:3001"
echo ""

# Check production backend
echo "2️⃣ Checking production backend..."
curl -s https://go-barry.onrender.com/api/health || echo "❌ Production backend not responding"
echo ""

# Check for alerts
echo "3️⃣ Checking for alerts..."
curl -s https://go-barry.onrender.com/api/alerts-enhanced | jq '.metadata.totalAlerts, .metadata.sources' || echo "❌ Failed to get alerts"
echo ""

# Check environment
echo "4️⃣ Checking environment..."
if [ -f "backend/.env" ]; then
  echo "✅ Backend .env file exists"
  grep "TOMTOM_API_KEY" backend/.env > /dev/null && echo "✅ TomTom API key configured" || echo "❌ TomTom API key missing"
else
  echo "❌ Backend .env file missing"
fi
echo ""

echo "5️⃣ To debug further, run:"
echo "   cd backend"
echo "   node debug-alerts.js"
echo "   node test-tomtom-direct.js"
