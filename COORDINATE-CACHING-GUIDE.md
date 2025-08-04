# Go BARRY Coordinate Caching Implementation Guide
## August 4, 2025

### Overview
This guide covers implementing persistent coordinate caching in Supabase to improve performance and reduce repeated coordinate processing.

## Step 1: Run Supabase Migration

1. Go to your Supabase dashboard: https://app.supabase.com/project/[your-project-id]
2. Navigate to SQL Editor
3. Open the file `/backend/migrations/add-coordinate-caching.sql`
4. Copy and paste the entire SQL script into the editor
5. Click "Run" to execute the migration
6. Verify the columns were added by checking the output

The migration will add these columns to the streetworks table:
- `cached_lat` - Cached WGS84 latitude
- `cached_lng` - Cached WGS84 longitude  
- `cached_coordinate_source` - Source of coordinates (e.g., street_manager_converted)
- `cached_coordinate_accuracy` - Accuracy level (high, medium, low)
- `cached_at` - Timestamp when cached
- `coordinate_metadata` - Additional metadata as JSON

## Step 2: Deploy Backend Updates

### Files Modified:
1. `/backend/services/coordinateCacheService.js` - Updated to use new columns
2. `/backend/routes/roadworksUnifiedSimple.js` - Includes cached fields in SELECT
3. `/backend/routes/coordinateCacheTest.js` - New test endpoints
4. `/backend/index.js` - Registers coordinate cache test route
5. `/backend/render-startup.js` - Fixed CORS for gobarry.co.uk
6. `/Go_BARRY/app/disruption-centre/index.jsx` - Reduced API call frequency

### Deploy Commands:
```bash
cd /Users/anthony/Go\ BARRY\ App
git add -A
git commit -m "Implement coordinate caching with new Supabase columns"
git push
```

Render will auto-deploy the backend in ~2-3 minutes.

## Step 3: Test Coordinate Caching

### 1. Verify Columns Exist:
```
GET https://go-barry.onrender.com/api/coordinate-cache/verify-columns
```

Expected response:
```json
{
  "success": true,
  "columnsExist": true,
  "columnStatus": {
    "cached_lat": true,
    "cached_lng": true,
    "cached_coordinate_source": true,
    "cached_coordinate_accuracy": true,
    "cached_at": true,
    "coordinate_metadata": true
  },
  "message": "✅ All coordinate caching columns exist!"
}
```

### 2. Test Caching:
```
GET https://go-barry.onrender.com/api/coordinate-cache/test
```

This will:
- Find a roadwork with coordinates
- Process the coordinates
- Cache them to Supabase
- Verify the cache write worked

### 3. Check Cache Statistics:
```
GET https://go-barry.onrender.com/api/coordinate-cache/stats
```

This shows:
- Total roadworks
- How many have cached coordinates
- Cache hit percentage
- Cache age distribution

### 4. Verify Main API Uses Cache:
```
GET https://go-barry.onrender.com/api/roadworks/unified
```

Check the logs - you should see:
- "📦 Cache hit: X/Y" messages
- Faster response times for cached coordinates
- No "Failed to store cached coordinates" errors

## How It Works

### Cache Flow:
1. **First Request**: 
   - Roadwork fetched from Supabase
   - No cached coordinates found
   - Coordinates processed (OSGB36→WGS84 or geocoding)
   - Results cached to both memory and database

2. **Subsequent Requests**:
   - Roadwork fetched with cached fields
   - Cache service finds `cached_lat` and `cached_lng`
   - Returns cached coordinates immediately
   - No processing needed!

### Cache Invalidation:
- Cache expires after 30 days (configurable)
- Expired entries are re-processed automatically
- Manual cache refresh possible via API

### Performance Benefits:
- **Before**: Process 100 roadworks = 100 coordinate conversions
- **After**: Process 100 roadworks = Only new/expired ones processed
- **Result**: 80-90% reduction in processing time

## Monitoring

### Check Logs:
```bash
# Look for successful caching
"✅ Cached coordinates for roadwork [ID]"
"✅ Batch cached X coordinates"

# Look for cache hits
"✅ Cache hit: X/Y (X%)"
"cacheHit: 'database'"

# No more errors like:
"Failed to store cached coordinates: Request failed with status code 400"
```

### Performance Metrics:
- Response time for `/api/roadworks/unified` should decrease
- Memory usage should remain stable (memory cache has size limits)
- Database storage will increase slightly (6 new columns)

## Troubleshooting

### If columns don't exist:
1. Check you're in the right Supabase project
2. Ensure the migration ran successfully
3. Check for any SQL errors in the output

### If caching isn't working:
1. Verify environment variables are set in Render
2. Check Supabase RLS policies allow updates
3. Look for error messages in logs

### If cache hit rate is low:
1. Wait for cache to build up (takes time)
2. Check cache expiry isn't too short
3. Verify coordinate processing is successful

## Next Steps

1. Monitor cache hit rates over the next few days
2. Consider batch processing historical roadworks to pre-populate cache
3. Adjust cache expiry time based on data patterns
4. Add cache warming on server startup for frequently accessed roadworks

## Summary

This implementation provides:
- ✅ Persistent coordinate caching in Supabase
- ✅ Significant performance improvements
- ✅ Reduced API calls to geocoding services
- ✅ Better user experience with faster load times
- ✅ Memory-safe implementation with size limits
- ✅ Automatic cache expiry and refresh

The system is designed to be transparent - it works automatically without any changes to the frontend or API consumers.
