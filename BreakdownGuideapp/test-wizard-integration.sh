#!/bin/bash

echo "🧪 Testing Wizard-to-Dashboard Integration"
echo "========================================"

# Test the wizard endpoint
echo "📋 Testing wizard breakdown creation..."

curl -X POST http://localhost:3001/api/breakdowns/from-wizard \
  -H "Content-Type: application/json" \
  -d '{
    "wizard_type": "SteeringWizard",
    "wizard_decision": "STOP",
    "wizard_assessment_data": {
      "steering_response": "poor",
      "severity": "high",
      "symptoms": ["unresponsive steering", "difficult turns"]
    },
    "fleet_number": "1234",
    "location": "Newcastle Depot - Bay 3",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "issue_category": "Steering System",
    "issue_description": "Steering wheel unresponsive during sharp turns",
    "severity": "STOP",
    "priority_level": 1,
    "engineering_required": true,
    "replacement_vehicle_required": true
  }'

echo -e "\n\n🔍 Testing live breakdowns endpoint..."

# Test the live endpoint
curl -X GET http://localhost:3001/api/breakdowns/live

echo -e "\n\n✅ Integration test complete!"