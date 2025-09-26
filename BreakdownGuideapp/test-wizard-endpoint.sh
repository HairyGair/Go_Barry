#!/bin/bash

# Test the from-wizard endpoint with sample data
echo "Testing /api/breakdowns/from-wizard endpoint..."

# API URL
API_URL="http://localhost:3001/api/breakdowns/from-wizard"

# Sample wizard data
read -r -d '' JSON_DATA <<EOF
{
  "wizard_type": "Brakes",
  "wizard_decision": "CONTINUE",
  "wizard_assessment_data": {
    "brakeToFloor": false,
    "delayedBraking": false,
    "unusualNoises": true,
    "brakeLeaks": false
  },
  "fleet_number": "5801",
  "location": "Test Location - Bradford",
  "location_coords": null,
  "w3w_location": null,
  "supervisor_badge": "TEST001",
  "supervisor_name": "Anthony Gair",
  "issue_category": "brakes",
  "severity": "CONTINUE",
  "priority_level": 3,
  "engineering_required": false,
  "replacement_vehicle_required": false
}
EOF

# Make the API call
echo "Sending POST request to $API_URL"
echo "Data: $JSON_DATA"
echo "---"

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA")

# Check if response is JSON
if echo "$RESPONSE" | python3 -m json.tool > /dev/null 2>&1; then
  echo "Response (formatted):"
  echo "$RESPONSE" | python3 -m json.tool
  
  # Check if successful
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Test PASSED - Wizard data accepted"
  else
    echo "❌ Test FAILED - Check error message above"
  fi
else
  echo "Response (raw):"
  echo "$RESPONSE"
  echo "❌ Test FAILED - Invalid response format"
fi
