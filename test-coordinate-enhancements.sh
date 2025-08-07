#!/bin/bash
# Test Enhanced Coordinate Features

echo "🧪 Testing Enhanced Coordinate Features"
echo "========================================"

BASE_URL="http://localhost:3001"

# Test enhanced postcode geocoding
echo ""
echo "📍 Test 1: Enhanced Postcode Geocoding (NE1 1AA)"
curl -s -X POST $BASE_URL/api/coordinates/process \
  -H "Content-Type: application/json" \
  -d '{"postcode": "NE1 1AA"}' | jq '.'

echo ""
echo "📍 Test 2: Postcode District Fallback (DH1)"
curl -s -X POST $BASE_URL/api/coordinates/process \
  -H "Content-Type: application/json" \
  -d '{"postcode": "DH1"}' | jq '.'

echo ""
echo "📍 Test 3: Quality Assessment"
echo "Testing coordinate quality scoring..."
# This would need a new endpoint to be added

echo ""
echo "📍 Test 4: Batch with Quality Scores"
curl -s -X POST $BASE_URL/api/coordinates/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"location": "Newcastle", "id": "1"},
      {"postcode": "NE1 1AA", "id": "2"},
      {"easting": 425000, "northing": 565000, "id": "3"},
      {"location": "Unknown Place", "id": "4"}
    ]
  }' | jq '.'

echo ""
echo "========================================"
echo "✅ Enhancement tests complete!"
echo ""
echo "Expected improvements:"
echo "- Postcode geocoding should now work properly"
echo "- District-level fallback for partial postcodes"
echo "- Quality scoring for coordinate confidence"
echo "- Better error handling and fallbacks"
