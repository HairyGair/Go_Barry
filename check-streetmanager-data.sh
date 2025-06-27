#!/bin/bash

echo "🔍 Checking StreetManager data across all tables..."
echo "=================================================="

# 1. Check streetmanager_notifications table (webhook saves here)
echo -e "\n1️⃣ StreetManager Notifications Table:"
NOTIFICATIONS=$(curl -s "https://go-barry.onrender.com/api/streetmanager/notifications?limit=3")
COUNT=$(echo "$NOTIFICATIONS" | jq '.notifications | length' 2>/dev/null || echo "0")
echo "Records in notifications table: $COUNT"
if [ "$COUNT" != "0" ]; then
  echo "$NOTIFICATIONS" | jq '.notifications[] | {id: .notification_id, street: .street_name, status: .processing_status}' 2>/dev/null
fi

# 2. Check unified roadworks API (searches multiple tables)
echo -e "\n2️⃣ Unified Roadworks API (StreetManager source):"
UNIFIED=$(curl -s "https://go-barry.onrender.com/api/roadworks/unified?source=street_manager&limit=3")
SM_COUNT=$(echo "$UNIFIED" | jq '.roadworks | length' 2>/dev/null || echo "0")
echo "StreetManager roadworks found: $SM_COUNT"
if [ "$SM_COUNT" != "0" ]; then
  echo "$UNIFIED" | jq '.roadworks[] | {id: .id, title: .title, source: .source}' 2>/dev/null
fi

# 3. Check if manual poll works
echo -e "\n3️⃣ Testing Manual Poll (fetches from StreetManager API):"
echo "Note: This may take a moment..."
POLL_RESULT=$(curl -s -X POST https://go-barry.onrender.com/api/streetmanager/poll)
POLL_SUCCESS=$(echo "$POLL_RESULT" | jq '.success' 2>/dev/null)
if [ "$POLL_SUCCESS" = "true" ]; then
  echo "✅ Poll successful!"
  echo "$POLL_RESULT" | jq '{saved: .result.totalSaved, activities: .result.activities, permits: .result.permits}' 2>/dev/null
else
  echo "❌ Poll failed or not available"
  echo "$POLL_RESULT" | jq '.error' 2>/dev/null || echo "$POLL_RESULT"
fi

# 4. Check active roadworks view (if it exists)
echo -e "\n4️⃣ Active StreetManager Roadworks:"
ACTIVE=$(curl -s "https://go-barry.onrender.com/api/streetmanager/active-roadworks?limit=3")
ACTIVE_COUNT=$(echo "$ACTIVE" | jq '.roadworks | length' 2>/dev/null || echo "0")
echo "Active roadworks: $ACTIVE_COUNT"

# 5. Summary
echo -e "\n📊 SUMMARY:"
echo "- Notifications table: $COUNT records"
echo "- Unified API (StreetManager): $SM_COUNT records"
echo "- Active roadworks: $ACTIVE_COUNT records"

if [ "$COUNT" = "0" ] && [ "$SM_COUNT" = "0" ]; then
  echo -e "\n⚠️  No StreetManager data found!"
  echo "This means either:"
  echo "1. The webhook is not saving data (missing table columns)"
  echo "2. No webhooks have been received yet"
  echo "3. The manual poll hasn't been run"
  echo -e "\n🔧 To fix, run the SQL script: docs/add_all_streetmanager_columns.sql"
fi
