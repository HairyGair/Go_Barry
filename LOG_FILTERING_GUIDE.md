# Log Filtering Guide for Go BARRY

## Why Not Separate All Services?

While we successfully separated the Breakdown Guide, separating other sections (Disruption Centre, Operations Centre, Admin Dashboard, Control Room) is **not recommended** because:

1. **They're React Native components** sharing state, not standalone apps
2. **Would require 5x more memory** (exceeding free tier limits)
3. **Complex state synchronization** between services
4. **Increased deployment complexity** without proportional benefit

## Better Solution: Structured Logging

### Implementation
We've added structured logging that prefixes all logs with context tags:

```
[DISRUPTION-CENTRE] [2025-01-09T10:23:45Z] GET /api/disruptions
[OPERATIONS-CENTRE] [2025-01-09T10:23:46Z] POST /api/operations/update
[ADMIN-DASHBOARD] [2025-01-09T10:23:47Z] GET /api/admin/users
```

### How to Filter Logs in Render Dashboard

#### 1. Using Render's Log Search
In the Render dashboard logs view, use these search terms:

| Section | Search Term |
|---------|------------|
| Disruption Centre | `[DISRUPTION-CENTRE]` |
| Operations Centre | `[OPERATIONS-CENTRE]` |
| Admin Dashboard | `[ADMIN-DASHBOARD]` |
| Control Room | `[CONTROL-ROOM]` |
| Breakdown Guide | `[BREAKDOWN-GUIDE]` |
| All Errors | `[ERROR]` |
| Slow Requests (>1s) | `in [0-9]{4,}ms` |

#### 2. Using Render CLI
```bash
# Install Render CLI
brew install render

# Filter specific section logs
render logs --service go-barry --filter "[OPERATIONS-CENTRE]"

# Show only errors
render logs --service go-barry --filter "[ERROR]"

# Export logs for analysis
render logs --service go-barry --filter "[ADMIN-DASHBOARD]" > admin-logs.txt
```

#### 3. Real-time Monitoring
```bash
# Watch operations centre activity
render logs --service go-barry --filter "[OPERATIONS-CENTRE]" --tail

# Monitor all errors across sections
render logs --service go-barry --filter "[ERROR]" --tail
```

### Adding Structured Logging to Backend

In `backend/index.js`, add after other middleware:

```javascript
import structuredLoggingMiddleware from './middleware/structuredLogging.js';

// Add after CORS setup
app.use(structuredLoggingMiddleware);

// Now in your routes, use req.log instead of console.log:
app.get('/api/operations/status', (req, res) => {
  req.log('Fetching operations status'); // Will output: [OPERATIONS-CENTRE] [...] Fetching operations status
  // ... rest of handler
});
```

## Log Analysis Tools

### 1. Daily Summary Script
```bash
#!/bin/bash
# daily-log-summary.sh

echo "=== Go BARRY Daily Log Summary ==="
echo "Date: $(date)"
echo ""

for context in "DISRUPTION-CENTRE" "OPERATIONS-CENTRE" "ADMIN-DASHBOARD" "CONTROL-ROOM"; do
  count=$(render logs --service go-barry --since 24h | grep -c "\[$context\]")
  errors=$(render logs --service go-barry --since 24h | grep "\[$context\]" | grep -c "\[ERROR\]")
  echo "$context: $count requests, $errors errors"
done
```

### 2. Performance Analysis
```bash
# Find slowest endpoints
render logs --service go-barry --since 1h | grep -E "in [0-9]{4,}ms" | sort -t' ' -k8 -rn | head -10
```

### 3. Error Tracking
```bash
# Group errors by context
render logs --service go-barry --since 24h | grep "\[ERROR\]" | cut -d' ' -f1 | sort | uniq -c
```

## Benefits of This Approach

✅ **Clean log separation** - Easy to filter by section
✅ **No additional cost** - Single service, same free tier
✅ **Simple deployment** - One service to manage
✅ **Shared resources** - Efficient memory usage
✅ **Easy to implement** - Just add middleware
✅ **Backward compatible** - No breaking changes

## When to Consider Service Separation

Only separate a section into its own service when:

1. **It's a standalone app** (like Breakdown Guide)
2. **Different technology stack** (not React Native)
3. **Different deployment schedule** (needs independent updates)
4. **Different scaling needs** (high traffic vs low traffic)
5. **Security isolation required** (sensitive data handling)

Currently, only the Breakdown Guide meets these criteria in your system.