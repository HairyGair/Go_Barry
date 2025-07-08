# Convex Deployment Fix Required

## Issue
The DisplayScreen is showing a Convex server error for `alerts:getPushedAlerts`. The function exists in the code but the Convex deployment is out of sync.

## Symptoms
- Error: `[CONVEX Q(alerts:getPushedAlerts)] Server Error`
- DisplayScreen shows "No alerts on display" even when alerts should be visible
- pushedAlerts always returns empty array

## Root Cause
The Convex backend deployment doesn't match the local code. The `getPushedAlerts` function was added to `convex/alerts.ts` but hasn't been deployed to production.

## Solution

1. **Navigate to the Go_BARRY directory:**
   ```bash
   cd /Users/anthony/Go\ BARRY\ App/Go_BARRY
   ```

2. **Deploy Convex to production:**
   ```bash
   npx convex deploy --prod
   ```

3. **If prompted, select the correct project:**
   - Project: `standing-octopus-908`
   - Dashboard: https://dashboard.convex.dev/d/standing-octopus-908

4. **Verify deployment:**
   - Check the Convex dashboard for deployment status
   - The error should disappear after successful deployment

## Temporary Workaround (Currently Applied)
The `useConvexSync.js` hook has been modified to return an empty array for `pushedAlerts` instead of calling the broken function. This prevents errors but means alerts won't show on the display screen.

## After Deployment
Once Convex is deployed, update `/Go_BARRY/hooks/useConvexSync.js` line 151:
```javascript
// Change from:
const pushedAlerts = []; // api ? useQuery(api.alerts.getPushedAlerts) : [];

// To:
const pushedAlerts = api ? useQuery(api.alerts.getPushedAlerts) : [];
```

## Prevention
- Always run `npx convex deploy` after modifying Convex functions
- Consider adding this to your deployment scripts
- Test Convex functions locally with `npx convex dev` before deploying
