# WebSocket Migration - Quick Reference

## What Changed

### Authentication
```javascript
// OLD: Supabase auth
const { data: userData } = await supabase.auth.getUser(token);

// NEW: JWT middleware
const decoded = await verifyToken(token);
```

### Database Queries
```javascript
// OLD: Supabase query
const { data } = await supabase.from('supervisors').select('*').eq('email', email).single();

// NEW: MySQL query builder
const { data } = await from('supervisors').select('*').eq('email', email).single();
```

## What Stayed The Same

### Broadcasting API
```javascript
// These work exactly as before - NO CHANGES NEEDED
webSocketHandler.broadcastBreakdownCreated(data);
webSocketHandler.broadcastWizardCompleted(data);
webSocketHandler.broadcastRepeatDefect(data);
// ... all broadcast methods unchanged
```

### Client Connection
```javascript
// Client code unchanged
const ws = new WebSocket('ws://host/ws/sdc-dashboard?token=YOUR_JWT');
```

### Message Format
```javascript
// All WebSocket messages have same structure
{
  type: 'breakdown_created',
  data: {...},
  timestamp: '2025-10-16T...'
}
```

## Files Affected

| File | Status | Action Required |
|------|--------|-----------------|
| `routes/webSocketHandler.js` | ✅ Migrated | None - already updated |
| `services/activityLogger.js` | ✅ Already MySQL | None |
| `middleware/authMiddleware.js` | ✅ Already exists | None |
| Client code | ✅ No changes | None |

## Testing Commands

```bash
# Test WebSocket connection
wscat -c "ws://localhost:3001/ws/sdc-dashboard?token=YOUR_TOKEN"

# Test server health
curl http://localhost:3001/health

# Test breakdown creation (triggers broadcast)
curl -X POST http://localhost:3001/api/breakdowns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fleetNo":"6333","issue":"Test"}'
```

## Rollback

```bash
# Restore Supabase version
cp routes/webSocketHandler.js.supabase-backup routes/webSocketHandler.js
npm restart
```

## Key Benefits

1. ✅ No client changes required
2. ✅ No broadcast method changes
3. ✅ Faster authentication (JWT vs API call)
4. ✅ Single database (MySQL only)
5. ✅ No Supabase dependency

## Common Issues

### "verifyToken is not a function"
**Fix:** Ensure `authMiddleware.js` exports `verifyToken`:
```javascript
export { verifyToken } from './middleware/authMiddleware.js';
```

### "from is not a function"
**Fix:** Ensure query helpers are imported:
```javascript
import { from, query } from '../utils/queryHelpers.js';
```

### WebSocket connection fails
**Fix:** Check JWT token is valid and not expired:
```javascript
// Token should be generated from /api/auth/login
```

## Migration Status

| Component | Status |
|-----------|--------|
| Authentication | ✅ Migrated |
| Database queries | ✅ Migrated |
| Broadcasting | ✅ No changes |
| File watchers | ✅ No changes |
| Client protocol | ✅ No changes |
| Backup created | ✅ Complete |
| Syntax check | ✅ Passed |
| Testing | ⏳ Pending |
| Production | ⏳ Pending |

---

**Last Updated:** October 16, 2025
**Migration By:** Claude Code
**Review Status:** Pending
