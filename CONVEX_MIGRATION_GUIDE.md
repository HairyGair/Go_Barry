# Go BARRY - Convex Migration Guide 🚀

## Overview
This guide will help you migrate the Go BARRY supervisor sync system from WebSocket/polling to Convex, solving all CORS, real-time sync, and reliability issues.

## Prerequisites
1. Node.js 18+ installed
2. Convex account (free tier is fine)
3. Access to Go BARRY codebase

## Step 1: Install Convex

```bash
cd Go_BARRY
npm install convex
```

## Step 2: Initialize Convex

```bash
npx convex dev
```

This will:
- Create a new Convex project (or connect to existing)
- Generate the `convex/_generated` folder
- Start the Convex dev server

## Step 3: Deploy Schema & Functions

The following files have been created:
- `convex/schema.ts` - Database schema
- `convex/supervisors.ts` - Auth functions
- `convex/alerts.ts` - Alert management
- `convex/sync.ts` - Sync state functions

Deploy them:
```bash
npx convex deploy
```

## Step 4: Update App.js

Replace WebSocket/polling setup with ConvexProvider:

```javascript
// App.js
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CONVEX_URL } from '@env'; // Add to .env

const convex = new ConvexReactClient(CONVEX_URL);

export default function App() {
  return (
    <ConvexProvider client={convex}>
      {/* Your existing app code */}
    </ConvexProvider>
  );
}
```

## Step 5: Update Components

### EnhancedDashboard.jsx
Replace polling/WebSocket code with Convex hooks:

```javascript
import { useConvexSync } from '../hooks/useConvexSync';

// Remove these:
// - useSupervisorSync hook
// - WebSocket connection code
// - Polling intervals

// Add Convex integration:
const {
  // Auth
  login,
  logout,
  session,
  
  // Sync state
  syncState,
  setDisplayMode,
  addCustomMessage,
  
  // Alerts
  activeAlerts,
  acknowledge,
  dismissFromDisplay,
  
  // Supervisors
  activeSupervisors,
} = useConvexSync();

// Use session heartbeat
useHeartbeat(session?._id);
```

### DisplayScreen.jsx
Similar updates - remove polling, add Convex:

```javascript
import { useConvexSync } from '../hooks/useConvexSync';

const {
  activeAlerts,
  syncState,
  activeSupervisors,
} = useConvexSync();

// Remove setInterval polling
// Data updates automatically via Convex subscriptions
```

## Step 6: Backend Integration

Create a sync service to push alerts to Convex:

```javascript
// backend/services/convexSync.js
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../Go_BARRY/convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.CONVEX_URL);

export async function syncAlertsToConvex(alerts) {
  try {
    await client.mutation(api.alerts.batchInsertAlerts, { alerts });
    console.log('✅ Synced to Convex');
  } catch (error) {
    console.error('❌ Convex sync error:', error);
  }
}
```

Update `backend/index.js` to sync on alert updates:

```javascript
import { syncAlertsToConvex } from './services/convexSync.js';

// In /api/alerts-enhanced endpoint:
app.get('/api/alerts-enhanced', async (req, res) => {
  // ... existing code ...
  
  // Sync to Convex
  await syncAlertsToConvex(enhancedAlerts);
  
  res.json({ success: true, data: enhancedAlerts });
});
```

## Step 7: Environment Variables

Add to `.env` files:

Frontend (`Go_BARRY/.env`):
```
CONVEX_URL=https://your-project.convex.cloud
```

Backend (`backend/.env`):
```
CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
```

## Step 8: Remove Old Code

Delete/remove:
- `backend/services/supervisorSync.js`
- WebSocket setup in `backend/index.js`
- `hooks/useSupervisorSync.js` (old polling hook)
- Any localStorage sync code

## Step 9: Test Migration

1. Run Convex dev server: `npx convex dev`
2. Start backend: `npm run dev`
3. Start frontend: `npm start`
4. Test:
   - Supervisor login
   - Alert acknowledgment
   - Real-time sync between tabs
   - No CORS errors
   - Instant updates

## Benefits of Convex Migration

✅ **No CORS Issues** - Convex handles all cross-origin requests
✅ **Real-time by Default** - Instant updates without polling
✅ **Automatic Reconnection** - No manual WebSocket management
✅ **Offline Support** - Optimistic updates and sync
✅ **Type Safety** - Full TypeScript support
✅ **Scalability** - Handles thousands of concurrent users
✅ **Built-in Auth** - Session management included

## Troubleshooting

### "Cannot find module convex/_generated/api"
Run `npx convex dev` to generate files

### "Invalid Convex URL"
Check `.env` file has correct CONVEX_URL

### "Mutation failed"
Check Convex dashboard for detailed error logs

## Next Steps

1. **Add More Features**:
   - Push notifications via Convex actions
   - File uploads for incident photos
   - Advanced analytics queries

2. **Optimize Performance**:
   - Add pagination to queries
   - Implement data retention policies
   - Use Convex indexes efficiently

3. **Production Deployment**:
   ```bash
   npx convex deploy --prod
   ```

## Support

- Convex Docs: https://docs.convex.dev
- Convex Discord: https://convex.dev/community
- Go BARRY Issues: Contact Anthony Gair

## Migration Checklist

- [ ] Install Convex
- [ ] Deploy schema & functions
- [ ] Update App.js with ConvexProvider
- [ ] Replace polling with Convex hooks
- [ ] Update backend to sync alerts
- [ ] Configure environment variables
- [ ] Remove old WebSocket code
- [ ] Test all functionality
- [ ] Deploy to production

🎉 **Congratulations!** You've migrated Go BARRY to Convex for reliable real-time sync!
