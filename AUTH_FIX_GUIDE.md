# 🔧 Go BARRY Authentication Issues - Quick Fix Guide

## Current Status
- ✅ **TomTom**: Working (15 alerts)
- ❌ **HERE**: 400 Bad Request  
- ❌ **MapQuest**: 401 Unauthorized
- ❌ **National Highways**: 401 Unauthorized

## Immediate Solutions

### 1. HERE API (400 Error)
**Issue**: Bad request format or invalid API key
**Fix**: 
```bash
# Test current key
curl "https://data.traffic.hereapi.com/v7/incidents?apikey=YOUR_KEY&in=circle:54.9783,-1.6178;r=5000"

# Get new key: https://developer.here.com/
# Update in backend/.env:
HERE_API_KEY=new_key_here
```

### 2. MapQuest API (401 Error)  
**Issue**: Invalid/expired API key
**Fix**:
```bash
# Get new key: https://developer.mapquest.com/
# Create new application -> Generate key
# Update in backend/.env:
MAPQUEST_API_KEY=new_key_here
```

### 3. National Highways API (401 Error)
**Issue**: Invalid subscription key  
**Fix**:
```bash
# This requires enterprise registration
# Contact: National Highways Data Team
# Or use alternative: Traffic England API
# Update in backend/.env:
NATIONAL_HIGHWAYS_API_KEY=new_subscription_key
```

## Quick Test Commands

```bash
# Run comprehensive auth test
chmod +x run-auth-test.sh
./run-auth-test.sh

# Test specific API
node fix-auth-issues.js

# Test backend after fixes
cd backend && npm run test-api-endpoints
```

## Priority Actions

1. **Immediate (5 min)**: Get new MapQuest key - easiest fix
2. **Short term (30 min)**: Fix HERE API key format
3. **Medium term (1-2 days)**: Register for National Highways enterprise access

## Alternative Strategy

If getting new keys takes time, temporarily disable failing APIs:

```javascript
// In backend/services/enhancedDataSourceManager.js
const enabledSources = {
  tomtom: true,
  here: false,        // Disable until fixed
  mapquest: false,    // Disable until fixed  
  nationalHighways: false // Disable until fixed
};
```

This keeps the system working with TomTom while you fix the other APIs.
