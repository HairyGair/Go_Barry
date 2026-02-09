#!/bin/bash
#
# Upload GTFS files to the production backend API
#
# Usage:
#   1. First, apply migration 024 via phpMyAdmin
#   2. Truncate old GTFS tables via phpMyAdmin
#   3. Run this script: bash scripts/upload-gtfs-remote.sh
#
# Requires: curl, jq (optional, for pretty output)
#

API_URL="https://api.breakdowns.gobarry.co.uk"
GTFS_DIR="/Users/anthony/Downloads/gonortheast_1769518232"

echo "==========================================="
echo "  GTFS Upload to Production Backend"
echo "  API: $API_URL"
echo "  Files: $GTFS_DIR"
echo "==========================================="

# Step 1: Get CSRF token
echo ""
echo "=== Step 1: Get CSRF token ==="
CSRF_RESPONSE=$(curl -s -c /tmp/gtfs-cookies.txt "$API_URL/api/auth/csrf-token")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null)
echo "CSRF Token: ${CSRF_TOKEN:0:20}..."

# Step 2: Login as admin (AG003)
echo ""
echo "=== Step 2: Login as admin ==="
ADMIN_EMAIL="${1:-}"
ADMIN_PASSWORD="${2:-}"

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "Usage: bash scripts/upload-gtfs-remote.sh <email> <password>"
  echo "Example: bash scripts/upload-gtfs-remote.sh admin@example.com mypassword"
  exit 1
fi
echo "Logging in as: $ADMIN_EMAIL"

LOGIN_RESPONSE=$(curl -s -b /tmp/gtfs-cookies.txt -c /tmp/gtfs-cookies.txt \
  -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "CSRF-Token: $CSRF_TOKEN" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

echo "Login response: $LOGIN_RESPONSE"

# Check if login succeeded
LOGIN_SUCCESS=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
if [ "$LOGIN_SUCCESS" != "True" ]; then
  echo "Login failed! Check credentials."
  exit 1
fi

echo "Logged in successfully"

# Step 3: Upload files in order
upload_file() {
  local FILE="$1"
  local ENDPOINT="$2"
  local LABEL="$3"

  if [ ! -f "$FILE" ]; then
    echo "   SKIP: $FILE not found"
    return
  fi

  local SIZE=$(du -h "$FILE" | cut -f1)
  echo ""
  echo "=== Uploading $LABEL ($SIZE) ==="
  echo "   File: $FILE"
  echo "   Endpoint: $API_URL/api/admin/gtfs/$ENDPOINT"

  RESPONSE=$(curl -s -b /tmp/gtfs-cookies.txt \
    -X POST "$API_URL/api/admin/gtfs/$ENDPOINT" \
    -H "CSRF-Token: $CSRF_TOKEN" \
    -F "csvFile=@$FILE" \
    --max-time 300)

  echo "   Response: $RESPONSE"
}

upload_file "$GTFS_DIR/routes.txt" "routes" "Routes"
upload_file "$GTFS_DIR/stops.txt" "stops" "Stops"
upload_file "$GTFS_DIR/trips.txt" "trips" "Trips"
upload_file "$GTFS_DIR/stop_times.txt" "stop-times" "Stop Times"
upload_file "$GTFS_DIR/shapes.txt" "shapes" "Shapes"

# Step 4: Compute distances
echo ""
echo "=== Computing route distances ==="
DISTANCE_RESPONSE=$(curl -s -b /tmp/gtfs-cookies.txt \
  -X POST "$API_URL/api/admin/gtfs/compute-distances" \
  -H "Content-Type: application/json" \
  -H "CSRF-Token: $CSRF_TOKEN" \
  --max-time 300)
echo "   Response: $DISTANCE_RESPONSE"

# Step 5: Get final stats
echo ""
echo "=== Final GTFS Stats ==="
STATS_RESPONSE=$(curl -s -b /tmp/gtfs-cookies.txt "$API_URL/api/admin/gtfs/stats")
echo "$STATS_RESPONSE"

# Cleanup
rm -f /tmp/gtfs-cookies.txt

echo ""
echo "==========================================="
echo "  GTFS Upload Complete!"
echo "==========================================="
