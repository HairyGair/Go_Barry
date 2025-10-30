#!/bin/bash
# Force Complete Cache Clear for cPanel/Passenger
# Run as: bash cpanel-force-refresh.sh

echo "=========================================="
echo "FORCING COMPLETE CACHE REFRESH"
echo "=========================================="
echo ""

echo "Step 1: Adding unique debug marker to supervisors.js..."
# Add a unique timestamp comment at the top of the file to verify it's loaded
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
MARKER="// LOADED AT: $TIMESTAMP - If you see this in logs, the new file is active"

# Check if marker already exists
if grep -q "LOADED AT:" ~/api/routes/supervisors.js; then
    # Update existing marker
    sed -i.bak "1s|.*LOADED AT:.*|$MARKER|" ~/api/routes/supervisors.js
else
    # Add new marker at line 1
    sed -i.bak "1i\\
$MARKER" ~/api/routes/supervisors.js
fi

echo "Added marker: $MARKER"
echo ""

echo "Step 2: Killing all Node.js processes..."
pkill -9 -f "node" 2>/dev/null || echo "No Node processes to kill"
pkill -9 -f "passenger" 2>/dev/null || echo "No Passenger processes to kill"
sleep 2
echo ""

echo "Step 3: Clearing Passenger tmp directory..."
rm -rf ~/api/tmp/*
mkdir -p ~/api/tmp
echo ""

echo "Step 4: Creating restart.txt..."
touch ~/api/tmp/restart.txt
echo ""

echo "Step 5: Clearing any Node.js module cache..."
# Remove any .cache directories
find ~/api -type d -name ".cache" -exec rm -rf {} + 2>/dev/null || true
echo ""

echo "Step 6: Verifying file permissions..."
chmod 644 ~/api/routes/supervisors.js
chmod 755 ~/api/routes/
echo ""

echo "Step 7: Waiting 5 seconds for Passenger to initialize..."
sleep 5
echo ""

echo "Step 8: Testing API endpoint..."
echo "Making request to: https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003"
curl -s https://api.breakdowns.gobarry.co.uk/api/supervisors/AG003 | head -100
echo ""
echo ""

echo "=========================================="
echo "REFRESH COMPLETE"
echo "=========================================="
echo ""
echo "If you still see the old error:"
echo "1. Check server.js import path"
echo "2. Look for duplicate supervisor files"
echo "3. Contact cPanel host about Passenger cache"
echo ""
