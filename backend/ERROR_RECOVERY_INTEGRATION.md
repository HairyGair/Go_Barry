# Error Recovery System Integration Guide

## Quick Setup

1. **Install required dependency:**
```bash
npm install p-retry
```

2. **Add to backend/index.js after imports:**
```javascript
import errorRecoverySystem from './errorRecoverySystem.js';

// Initialize error recovery after app setup
await errorRecoverySystem.initialize();
```

3. **Register circuit breaker routes in index.js:**
```javascript
// Add with other route registrations
await routeManager.registerRoute(app, '/api/circuit-breaker', './routes/circuitBreaker.js', 'Circuit Breaker Status');
```

4. **Update TomTom service imports:**
Replace:
```javascript
import tomtomService from './services/tomtom.js';
```
With:
```javascript
import tomtomService from './services/tomtomWithRecovery.js';
```

5. **Apply Street Manager webhook patch:**
- Review `/backend/patches/streetManagerWebhook.patch.js`
- Apply the changes to `/backend/routes/streetManagerWebhook.js`

## New API Endpoints

### Circuit Breaker Management
- `GET /api/circuit-breaker/status` - View all circuit breaker states
- `POST /api/circuit-breaker/reset/:service` - Reset specific service
- `GET /api/circuit-breaker/fallback/:service` - Get fallback data
- `POST /api/circuit-breaker/force-open/:service` - Testing only

### Street Manager Retry
- `POST /api/streetmanager/webhook/retry` - Retry failed webhooks
- `GET /api/streetmanager/webhook/retry-status` - Check retry queue

## Architecture Overview

```
External API Request
    ↓
Circuit Breaker (checks state)
    ↓
[CLOSED] → Execute Request → Success/Failure tracking
[OPEN] → Use Fallback Data → Wait for reset timeout
[HALF_OPEN] → Test Request → Move to CLOSED or OPEN
    ↓
Response with fallback flag if applicable
```

## Key Features

✅ **Circuit Breaker Pattern**
- Prevents cascade failures
- Auto-recovery with exponential backoff
- Service-specific thresholds

✅ **Retry Mechanism**
- Exponential backoff retries
- Queue for failed requests
- Automatic batch processing

✅ **Fallback Data**
- Cached successful responses
- Static fallback for critical services
- Automatic cleanup of old data

✅ **TomTom Error Prevention**
- Failures don't cascade to frontend
- Returns cached/fallback data
- Health check endpoint

## Monitoring

Check system health:
```bash
curl http://localhost:3001/api/circuit-breaker/status
```

View specific service:
```bash
curl http://localhost:3001/api/circuit-breaker/status | jq '.circuitBreakers.tomtom'
```

## Testing

1. **Simulate TomTom failure:**
```bash
curl -X POST http://localhost:3001/api/circuit-breaker/force-open/tomtom
```

2. **Verify fallback works:**
```bash
curl http://localhost:3001/api/tomtom/incidents
# Should return fallback data with fromFallback: true
```

3. **Reset circuit:**
```bash
curl -X POST http://localhost:3001/api/circuit-breaker/reset/tomtom
```

## Configuration

Adjust thresholds in `circuitBreaker.js`:
```javascript
tomtom: new CircuitBreaker({ 
  name: 'TomTom', 
  failureThreshold: 3,  // Failures before opening
  resetTimeout: 30000    // MS before retry
})
```
