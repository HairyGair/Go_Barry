# Fixing Nominatim Geocoding Timeouts

## 🚨 Issue
The logs show hundreds of "Nominatim geocoding error: timeout of 5000ms exceeded" messages. This is happening because:

1. Many roadworks don't have coordinates
2. The system tries to geocode them using OpenStreetMap's Nominatim service
3. Nominatim is timing out (rate limiting or network issues)

## ✅ Quick Fix: Disable Geocoding

Add this environment variable to Render:

```
DISABLE_GEOCODING=true
```

This will:
- Stop the geocoding attempts
- Eliminate the timeout errors
- Use only roadworks with existing coordinates

## 🚀 How to Apply

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service**: `go-barry`
3. **Go to Environment** tab
4. **Add**:
   ```
   DISABLE_GEOCODING=true
   ```
5. **Save** - Render will redeploy automatically

## 📊 Impact

**Pros:**
- No more timeout errors flooding logs
- Faster API responses
- More stable system

**Cons:**
- Roadworks without coordinates won't be geocoded
- Might have fewer roadworks with valid locations

## 🔧 Alternative Solutions

### 1. **Reduce Geocoding Timeout**
Change timeout from 10000ms to 3000ms in `coordinateFallbackProcessor.js`:
```javascript
timeout: 3000  // Reduced from 10000
```

### 2. **Use Google Geocoding Instead**
Replace Nominatim with Google Geocoding API (requires API key):
```javascript
// In .env
GOOGLE_GEOCODING_API_KEY=your_key_here
```

### 3. **Implement Aggressive Caching**
Cache all geocoding results in database to avoid repeated requests

### 4. **Batch Process Geocoding**
Run geocoding as a background job instead of real-time

## 🎯 Recommended Action

For now, **disable geocoding** to stabilize the system. Once the Supabase data is flowing properly, we can re-evaluate if geocoding is needed at all (most roadworks should have coordinates from Street Manager).

## 📝 Verification

After adding `DISABLE_GEOCODING=true` and redeploying:

```bash
# Check if errors stopped
curl https://go-barry.onrender.com/api/roadworks/unified | jq '.metadata'

# Should see no more timeout errors in logs
```

The system will log:
```
🚫 Geocoding disabled via DISABLE_GEOCODING environment variable
```

This confirms geocoding is off and timeouts should stop.
