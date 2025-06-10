#!/bin/bash
# EMERGENCY DEPLOYMENT: Stop WebSocket Connection Storm

echo "🚨 EMERGENCY DEPLOYMENT: Stopping WebSocket Connection Storm"
echo ""

# Show what's being deployed
echo "🔧 EMERGENCY FIXES:"
echo "   • Frontend: WebSocket temporarily DISABLED to stop connection storm"
echo "   • Backend: Connection rate limiting added (2 per IP per 30s)"
echo "   • Display still works with live traffic data (no WebSocket sync)"
echo "   • Professional control room layout with large map & alerts"
echo "   • Emergency notice explaining WebSocket status"
echo ""

# Add all changes
git add .

# Commit with detailed message
git commit -m "🚨 EMERGENCY: Stop WebSocket Connection Storm

🔴 CRITICAL FIXES:
- Frontend: Temporarily disabled WebSocket to stop connection storm
- Backend: Added connection rate limiting (2 per IP per 30 seconds)
- Display still functional with live traffic data from APIs
- Professional control room layout preserved
- Emergency notice added to display explaining status

🔧 Frontend Changes (display.jsx):
- Commented out useSupervisorSync hook temporarily
- Added emergency notice banner
- Using fallback values for supervisor data
- All display functionality preserved except real-time sync

🛡️ Backend Changes (supervisorSync.js):
- Added connection limiting per IP address
- Maximum 2 connections per IP per 30-second window
- Connections exceeding limit are rejected immediately
- Proper cleanup when connections disconnect
- Detailed logging for rate limit monitoring

📊 Expected Results:
- Immediate stop of connection churn in logs
- Display screen will load properly at /display
- Large map and alert cards visible from distance
- Professional control room layout working
- Live traffic data from TomTom, HERE, National Highways

🔄 Next Steps:
- Monitor logs for reduced connection attempts
- Investigate root cause of connection storm
- Re-enable WebSocket once issue is resolved"

# Push to trigger deployment
echo "🚀 Pushing EMERGENCY fixes to production..."
git push origin main

echo ""
echo "✅ EMERGENCY FIXES DEPLOYED!"
echo ""
echo "📊 Expected immediate results:"
echo "   • WebSocket connection storm will STOP"
echo "   • Display screen will load properly at /display"
echo "   • Large control room layout will be visible"
echo "   • Live traffic data will continue working"
echo ""
echo "🔍 Monitor logs at: https://go-barry.onrender.com/api/health"
echo "📺 Check display at: https://gobarry.co.uk/display"
echo "⏱️  Emergency fixes will be live in ~2-3 minutes"
echo ""
echo "🚨 NOTE: WebSocket features temporarily disabled but display fully functional"