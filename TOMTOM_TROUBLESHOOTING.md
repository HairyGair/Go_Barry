# TomTom Maps Integration - Troubleshooting Guide

## Issue: "No TomTom API key available" Error

### Problem
The TomTom map component shows an error: `Failed to initialize map: Error: No TomTom API key available`

### Root Cause
The compiled/bundled JavaScript is using outdated code that doesn't properly handle the API key retrieval.

### Solution Applied

1. **Updated TomTomTrafficMap.jsx** with:
   - Multiple API key sources (environment → backend → fallback)
   - Better error handling and debugging
   - Proper use of production API URLs
   - MapLibre GL loading verification

2. **API Key Sources** (in order of priority):
   - `EXPO_PUBLIC_TOMTOM_API_KEY` environment variable
   - Backend endpoint: `/api/config/tomtom-key`
   - Hardcoded fallback: `9rZJqtnfYpOzlqnypI97nFb5oX17SNzp`

### How to Fix

1. **Stop your Expo development server** (Ctrl+C)

2. **Clear Expo cache**:
   ```bash
   npx expo start -c
   ```

3. **Verify environment variables** in `.env`:
   ```
   EXPO_PUBLIC_TOMTOM_API_KEY=9rZJqtnfYpOzlqnypI97nFb5oX17SNzp
   ```

4. **Test the API endpoint**:
   ```bash
   node test-tomtom-api.js
   ```

5. **Restart Expo**:
   ```bash
   npm run web
   ```

### Debug Information

The updated component will log:
- Environment variables available
- API key source being used
- MapLibre GL loading status
- Detailed error messages

Look for these in the browser console:
```
🌍 Environment variables check:
🅰️ API URL will be: https://go-barry.onrender.com/api/config/tomtom-key
✅ Using API key: 9rZJqtnf...
```

### Alternative Solutions

If the issue persists:

1. **Force production build**:
   ```bash
   NODE_ENV=production npm run build:web
   ```

2. **Check browser cache**:
   - Open Developer Tools → Network tab
   - Check "Disable cache"
   - Refresh the page

3. **Use direct API key** (temporary):
   - The component now includes a hardcoded fallback
   - This ensures the map works even if other methods fail

### Verification

The map should:
1. Load without errors
2. Show TomTom base tiles
3. Display traffic overlay
4. Plot alert markers

### Backend Configuration

Ensure the backend `.env` has:
```
TOMTOM_API_KEY=9rZJqtnfYpOzlqnypI97nFb5oX17SNzp
```

And the endpoint `/api/config/tomtom-key` returns:
```json
{
  "success": true,
  "apiKey": "9rZJqtnfYpOzlqnypI97nFb5oX17SNzp"
}
```
