#!/bin/bash
# fix-activity-logs-deployment.sh
# Fix the activity logs routes not working on Render

echo "🔧 Fixing Activity Logs Deployment Issue"
echo "========================================"
echo ""

echo "1️⃣ Backup original file..."
cp backend/routes/activityLogs.js backend/routes/activityLogs.backup.js

echo "2️⃣ Replace with simplified version..."
cp backend/routes/activityLogs_FIXED.js backend/routes/activityLogs.js

echo "3️⃣ Add debug endpoint to index.js..."
echo ""
echo "Add this after the routes registration in backend/index.js:"
echo ""
cat << 'EOF'
// TEMPORARY DEBUG - Remove after fixing
app.get('/api/debug/routes-test', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    routes: {
      activityLogsLoaded: !!activityLogsAPI,
      dutyAPILoaded: !!dutyAPI
    }
  });
});

// Force error visibility
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});
EOF

echo ""
echo "4️⃣ Deploy to Render:"
echo "cd backend"
echo "git add ."
echo "git commit -m 'Fix: Simplify activity logs routes for debugging'"
echo "git push"
echo ""
echo "5️⃣ After deployment, test:"
echo "curl https://go-barry.onrender.com/api/activity-test"
echo "curl https://go-barry.onrender.com/api/debug/routes-test"
echo ""
echo "This will tell us if the routes are loading at all."
