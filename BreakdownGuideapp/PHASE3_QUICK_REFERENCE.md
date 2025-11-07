# Phase 3: Rate Limiting Fix - Quick Reference

**Status:** ✅ COMPLETED (November 7, 2025)

---

## What Changed?

**One file modified:** `/backend/middleware/authMiddleware.js`

**What was fixed:**
- Replaced memory-leaking `Map` objects with `node-cache`
- Added automatic TTL-based cleanup
- Bounded memory with 10,000 key limit
- Added cache monitoring

---

## Key Changes

### Before
```javascript
const loginAttempts = new Map();  // Unbounded, manual cleanup
```

### After
```javascript
import NodeCache from 'node-cache';

const loginAttempts = new NodeCache({
  stdTTL: 900,          // Auto-delete after 15 minutes
  maxKeys: 10000,       // Prevent unbounded growth
  checkperiod: 60       // Cleanup every 60 seconds
});
```

---

## Deployment (cPanel)

```bash
# 1. SSH to server
ssh user@85.234.151.224

# 2. Navigate to backend
cd ~/api

# 3. Upload new authMiddleware.js and package.json
# (via SFTP or git pull)

# 4. Install dependencies
npm install

# 5. Restart PM2
pm2 restart breakdown-backend

# 6. Verify
pm2 logs breakdown-backend
```

---

## Testing

### Test Rate Limiting
```bash
# Make 6 failed login attempts (should block after 5)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

**Expected:** 429 status on 6th attempt

### Check Cache Stats
```bash
# Cache stats logged every 10 minutes
pm2 logs breakdown-backend | grep "CACHE STATS"
```

---

## Benefits

1. **No Memory Leaks** - Bounded cache (10,000 keys max)
2. **Automatic Cleanup** - TTL expires entries after 15 minutes
3. **Better Performance** - C++ optimized module
4. **Monitoring** - Cache statistics every 10 minutes
5. **Cluster Safe** - Works with PM2 multi-instance

---

## Files Modified

| File | Change |
|------|--------|
| `/backend/middleware/authMiddleware.js` | Replaced Map with NodeCache |
| `/backend/package.json` | Added `node-cache` dependency |

---

## Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| TTL | 15 minutes | Rate limit window |
| Max Keys | 10,000 | Maximum cache entries |
| Cleanup | 60 seconds | Background check period |
| Login Limit | 5 attempts | Max failed logins |
| SDC Limit | 100 ops | Max operations per window |

---

## Monitoring

Watch for these log entries:

### Good
```
[CACHE STATS] Rate limiting caches: { login: { keys: 45 }, sdc: { keys: 8 } }
```

### Warning
```
⚠️ Rate limit exceeded for ::1:Mozilla. Reset at 2025-11-07T22:07:22.036Z
```

### Error (should not see)
```
❌ Cache full (maxKeys reached)
```

---

## Troubleshooting

### Rate limit not working?
```bash
# Check node-cache installed
npm list node-cache  # Should show: node-cache@5.1.2

# Restart server
pm2 restart breakdown-backend

# Check logs
pm2 logs breakdown-backend --lines 100
```

### Too many keys?
```bash
# Check cache stats
pm2 logs | grep "CACHE STATS"

# Keys should be < 1000 normally
# If > 5000, investigate unusual traffic
```

---

## Next Steps

- [ ] Deploy to production
- [ ] Monitor cache stats for 24 hours
- [ ] Verify no memory growth over time
- [ ] Consider Redis for multi-server setup

---

**Documentation:** See `PHASE3_RATE_LIMIT_FIX_SUMMARY.md` for full details
