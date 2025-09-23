#!/bin/bash

echo "🧪 Testing Wizard Integration After Adding Database Columns"
echo "=========================================================="

echo "📋 Testing wizard breakdown creation..."

# Test the wizard endpoint with all required fields
curl -X POST http://localhost:3002/api/breakdowns/from-wizard \
  -H "Content-Type: application/json" \
  -d '{
    "wizard_type": "SteeringWizard",
    "wizard_decision": "STOP",
    "wizard_assessment_data": {
      "steering_response": "poor",
      "severity": "high",
      "symptoms": ["unresponsive steering", "difficult turns"]
    },
    "fleet_number": "7001",
    "location": "Newcastle Depot - Bay 3",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "issue_category": "Steering System",
    "issue_description": "Steering wheel unresponsive during sharp turns - requires immediate attention",
    "severity": "STOP",
    "priority_level": 1,
    "engineering_required": true,
    "replacement_vehicle_required": true
  }'

echo -e "\n\n🔍 Testing live breakdowns endpoint (should now show the new breakdown)..."

# Test the live endpoint to see if our new breakdown appears
curl -X GET http://localhost:3002/api/breakdowns/live

echo -e "\n\n✅ Wizard integration test complete!"
echo "If both endpoints returned success responses, the integration is working!"