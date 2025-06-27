#!/bin/bash

echo "🔧 Testing StreetManager webhook with Sheffield roadwork data..."
echo "=============================================================="

# The exact data from the error message
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook \
  -H "Content-Type: application/json" \
  -H "x-amz-sns-message-type: Notification" \
  -H "x-amz-sns-message-id: sheffield-test-$(date +%s)" \
  -d '{
    "Type": "Notification",
    "MessageId": "sheffield-test-'$(date +%s)'",
    "TopicArn": "arn:aws:sns:eu-west-2:000000000000:streetmanager-notifications",
    "Subject": "StreetManager Notification",
    "Message": "{\"event_reference\":128587307,\"event_type\":\"PERMIT_ALTERATION_GRANTED\",\"object_data\":{\"work_reference_number\":\"LC10620213165\",\"permit_reference_number\":\"LC10620213165-01\",\"promoter_swa_code\":\"4420\",\"promoter_organisation\":\"SHEFFIELD CITY COUNCIL\",\"highway_authority\":\"SHEFFIELD CITY COUNCIL\",\"works_location_coordinates\":\"POINT(433674.488 380502.109)\",\"street_name\":\"LOWEDGES ROAD\",\"area_name\":\"\",\"work_category\":\"Major\",\"traffic_management_type\":\"Stop/go boards\",\"proposed_start_date\":\"2025-06-15T23:00:00.000Z\",\"proposed_start_time\":\"2025-06-15T23:00:00.000Z\",\"proposed_end_date\":\"2025-07-04T22:59:00.000Z\",\"proposed_end_time\":\"2025-07-04T22:59:00.000Z\",\"actual_start_date_time\":\"2025-06-16T06:47:17.000Z\",\"actual_end_date_time\":null,\"work_status\":\"Works in progress\",\"usrn\":\"34409447\",\"highway_authority_swa_code\":\"4420\",\"work_category_ref\":\"major\",\"traffic_management_type_ref\":\"stop_go_boards\",\"work_status_ref\":\"in_progress\",\"activity_type\":\"Utility asset works\",\"is_ttro_required\":\"No\",\"is_covid_19_response\":null,\"works_location_type\":\"Carriageway\",\"permit_conditions\":\"NCT01a, NCT02a, NCT05a, NCT06a, NCT08a, NCT11b, NCT01b, NCT11a\",\"road_category\":\"8\",\"is_traffic_sensitive\":\"Yes\",\"is_deemed\":\"No\",\"permit_status\":\"granted\",\"town\":\"SHEFFIELD\",\"collaborative_working\":\"No\",\"close_footway\":\"No\",\"close_footway_ref\":\"no\",\"current_traffic_management_type\":null,\"current_traffic_management_type_ref\":null,\"current_traffic_management_update_date\":null},\"event_time\":\"2025-06-27T17:26:01.809Z\",\"object_type\":\"PERMIT\",\"object_reference\":\"LC10620213165-01\",\"version\":1}",
    "Timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "SignatureVersion": "1",
    "Signature": "test-signature"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"

echo -e "\n📊 Checking if it was saved..."
sleep 2

curl -s "https://go-barry.onrender.com/api/streetmanager/notifications?limit=5" | \
  jq '.notifications[] | select(.permit_reference_number == "LC10620213165-01" or .raw_webhook_data.object_reference == "LC10620213165-01") | {id: .notification_id, street: .street_name, saved: true}' 2>/dev/null || \
  echo "Not found in database"

echo -e "\n💡 If you see 'Not found in database', run this SQL in Supabase:"
echo "----------------------------------------"
cat ~/Go\ BARRY\ App/docs/add_all_streetmanager_columns.sql | head -20
echo "... (see full script in docs/add_all_streetmanager_columns.sql)"
