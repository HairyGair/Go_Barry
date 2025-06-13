#!/bin/bash
# Test authentication after deployment

echo "🔍 Testing authentication deployment..."
echo "Waiting for deployment to complete..."

# Wait for deployment
sleep 30

echo ""
echo "📡 Testing authentication endpoint..."

# Test the auth endpoint
response=$(curl -s -X POST https://go-barry.onrender.com/api/supervisor/auth/login \
  -H "Content-Type: application/json" \
  -d '{"supervisorId":"supervisor001","badge":"AW001"}' \
  -w "HTTPSTATUS:%{http_code}")

http_code=$(echo $response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3}).*/\1/')
body=$(echo $response | sed -E 's/HTTPSTATUS.*//g')

if [ "$http_code" = "200" ]; then
    echo "✅ Authentication endpoint working!"
    echo "Response: $body"
    
    # Test WebSocket endpoint
    echo ""
    echo "🔌 Testing WebSocket endpoint..."
    curl -s -I https://go-barry.onrender.com/ws/supervisor-sync
    
else
    echo "❌ Authentication endpoint failed: HTTP $http_code"
    echo "Response: $body"
    echo ""
    echo "💡 Possible issues:"
    echo "   - Deployment still in progress"
    echo "   - Route not properly mounted"
    echo "   - CORS issue"
fi

echo ""
echo "🧪 Test in browser:"
echo "1. Go to https://gobarry.co.uk"
echo "2. Click 'Supervisor Control'"
echo "3. Login as Alex Woodcock"
echo "4. Check browser console for errors"
echo "5. Open https://gobarry.co.uk/display to verify sync"
