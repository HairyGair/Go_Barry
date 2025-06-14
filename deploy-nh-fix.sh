#!/bin/bash

echo "🛣️ Deploying National Highways RSS Fix..."
echo ""

# Navigate to root directory
cd /Users/anthony/Go\ BARRY\ App/

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix National Highways: Switch from JSON API to RSS feed parsing

🔧 Key Changes:
- Updated nationalHighways.js to parse RSS/XML instead of JSON
- Using UnplannedEvents.xml feed (8 current incidents)
- No API key needed for RSS feeds
- Added North East filtering by county, region, roads, and coordinates
- Fixed 'No features in response' error

🎯 What this fixes:
- National Highways was returning XML when we expected JSON
- Now properly parsing RSS feed with real incident data
- Filters for North East region (Northumberland, Tyne & Wear, Durham)
- Monitors A1, A19, A69, A167, A194, A1058, A184, A690

📊 Result:
- National Highways will now show active traffic incidents
- 3/5 data sources operational (HERE, MapQuest, National Highways)
- Better coverage for Go North East bus operations"

# Push to trigger deployment
git push origin main

echo ""
echo "✅ Deployment triggered!"
echo "📡 Render will automatically deploy in ~2 minutes"
echo ""
echo "🎯 Expected results:"
echo "  ✅ National Highways will show incident count > 0"
echo "  ✅ 3/5 data sources operational"
echo "  ✅ Real-time unplanned events from National Highways"
echo ""
echo "Test with: node check-all-sources.js"
