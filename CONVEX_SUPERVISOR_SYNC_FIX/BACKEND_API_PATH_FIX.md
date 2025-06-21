# IMPORTANT: Backend API Path Fix

## Issue Found:
The backend `convexSync.js` is calling:
```javascript
path: 'alerts:batchUpsertAlerts'
```

But the Convex function is named:
```javascript
export const batchInsertAlerts
```

## Fix Option 1 (Easiest):
In the `convexSync_FIXED.js`, change line 47 from:
```javascript
path: 'alerts:batchUpsertAlerts',
```
to:
```javascript
path: 'alerts:batchInsertAlerts',
```

## Fix Option 2:
Rename the function in `convex/alerts.ts` from `batchInsertAlerts` to `batchUpsertAlerts`

## Recommendation:
Use Fix Option 1 - it's simpler and the function already does upsert behavior (updates if exists, inserts if new).
