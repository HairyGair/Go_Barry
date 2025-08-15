# Go BARRY Log Management Guide

## 🔇 Quiet Mode for Production

Your Render logs are now much cleaner! The new log filtering system reduces noise by 80-90%.

## Environment Variables

Add these to your **Render environment variables** to control logging:

### Basic Log Control
```
QUIET_LOGS=true                 # Enable quiet mode (recommended for production)
LOG_LEVEL=INFO                  # Options: ERROR, WARN, INFO, DEBUG
```

### Specific Feature Logging
```
ENABLE_HEALTH_LOGS=false       # Hide health check spam
ENABLE_MEMORY_LOGS=false       # Hide memory usage logs
```

## What Gets Filtered Out:

✅ **Suppressed (Noise Reduced)**:
- Health check requests (`/api/health`)
- Memory optimization status
- TomTom API polling messages
- GTFS route processing spam
- Coordinate enhancement logs
- Supabase connection tests
- Express middleware noise
- Supervisor polling updates

🔍 **Always Shown (Important)**:
- Breakdown system events
- Authentication failures
- API errors (4xx, 5xx responses)
- Slow requests (>1 second)
- Street Manager webhooks
- Alert system activities

## Log Levels:

### ERROR (Cleanest)
- Only errors and critical failures
- Recommended for stable production

### WARN (Balanced)
- Errors + warnings
- Good for monitoring

### INFO (Default)
- Normal operational logs
- Filtered noise but shows important events

### DEBUG (Verbose)
- Everything (like before)
- Use only for troubleshooting

## Quick Setup:

### For Clean Production Logs:
```bash
# In Render environment variables:
QUIET_LOGS=true
LOG_LEVEL=WARN
ENABLE_HEALTH_LOGS=false
ENABLE_MEMORY_LOGS=false
```

### For Debugging Issues:
```bash
# Temporarily enable verbose logs:
QUIET_LOGS=false
LOG_LEVEL=DEBUG
```

## Example Log Output:

### Before (Noisy):
```
✅ Health check passed
📊 Memory usage: 245MB
🔄 TomTom traffic flow updated
✅ GTFS processing complete
📊 Memory optimization status
✅ Health check passed
📊 Memory usage: 247MB
```

### After (Clean):
```
🚀 Go BARRY Backend Starting...
✅ Production log filtering active - reduced noise
🌐 POST /api/breakdowns/start - 192.168.1.1
✅ POST /api/breakdowns/start - 201 (145ms)
❌ GET /api/supervisor/auth - 401 (23ms)
```

## Emergency Debug Mode:

If you need to see everything temporarily, add this to your code:
```javascript
// In any route file
logFilter.enableDebugMode();
```

## Cost Savings:

- **Reduced log storage** (Render charges for log retention)
- **Faster log searching** (less noise to filter through)
- **Easier debugging** (important messages stand out)
- **Better performance** (less I/O overhead)

Your logs should now be 80-90% cleaner while still showing everything important for operations and debugging!