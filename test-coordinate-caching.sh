#!/bin/bash

echo "🧪 Testing Go BARRY Coordinate Caching Implementation..."
echo "======================================================="
echo ""

# Base URL
BASE_URL="https://go-barry.onrender.com"

# Test 1: Verify columns exist
echo "1️⃣ Verifying Supabase columns..."
curl -s "$BASE_URL/api/coordinate-cache/verify-columns" | python3 -m json.tool
echo ""
echo "✅ Check that 'columnsExist' is true and all columns show true"
echo ""
read -p "Press Enter to continue..."

# Test 2: Test caching functionality
echo ""
echo "2️⃣ Testing coordinate caching..."
curl -s "$BASE_URL/api/coordinate-cache/test" | python3 -m json.tool
echo ""
echo "✅ Check that 'cacheSuccess' is true and cached data is populated"
echo ""
read -p "Press Enter to continue..."

# Test 3: Check cache statistics
echo ""
echo "3️⃣ Checking cache statistics..."
curl -s "$BASE_URL/api/coordinate-cache/stats" | python3 -m json.tool
echo ""
echo "✅ Note the cache percentage and number of cached coordinates"
echo ""
read -p "Press Enter to continue..."

# Test 4: Check main API performance
echo ""
echo "4️⃣ Testing main roadworks API..."
echo "This should now use cached coordinates for better performance"
echo ""
time curl -s "$BASE_URL/api/roadworks/unified?limit=10" > /dev/null
echo ""
echo "✅ Response time should be faster with caching enabled"
echo ""

# Test 5: Check CORS
echo "5️⃣ Testing CORS fix..."
echo "Visit http://www.gobarry.co.uk and check DevTools Network tab"
echo "There should be NO CORS errors when calling the API"
echo ""

echo "🎉 Testing complete!"
echo ""
echo "📊 Summary:"
echo "- If columns exist: ✅ Migration successful"
echo "- If caching works: ✅ Implementation successful"
echo "- If stats show data: ✅ Cache is building"
echo "- If API is faster: ✅ Performance improved"
echo "- If no CORS errors: ✅ Frontend can connect"
echo ""
echo "🚀 Next steps:"
echo "1. Monitor cache hit rates over time"
echo "2. Consider running batch population script"
echo "3. Deploy frontend changes"
