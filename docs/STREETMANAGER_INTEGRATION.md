# Go BARRY - Street Manager Integration Summary

## Overview
Street Manager (manage-roadworks.service.gov.uk) integration has been set up to receive real-time roadwork notifications via AWS SNS webhooks.

## What Was Added

### 1. Webhook Endpoint Route
**File**: `/backend/routes/streetManagerWebhook.js`
- **POST /api/streetmanager/webhook** - Main webhook endpoint that:
  - Handles SNS subscription confirmations automatically
  - Processes real-time roadwork event notifications
  - Filters events for North East England region
  
- **GET /api/streetmanager/webhook/status** - Status check endpoint
- **POST /api/streetmanager/webhook/test** - Test endpoint for simulating events

### 2. Event Processing Service
**File**: `/backend/services/streetManagerEvents.js`
- Processes incoming Street Manager events
- Transforms events to Go BARRY alert format
- Filters by geographic region (North East England)
- Handles event types:
  - PERMIT_CREATED/GRANTED/REFUSED
  - WORK_START/STOP/COMPLETE
  - ACTIVITY_CREATED/UPDATED
- Syncs alerts to Convex for real-time distribution

### 3. Backend Integration
**File**: `/backend/index.js`
- Added route registration for webhook endpoints
- Preserved existing Street Manager API polling functionality

### 4. Convex Sync Enhancement
**File**: `/backend/services/convexSync.js`
- Added `syncSingleAlert()` method for real-time event processing

### 5. Documentation
**File**: `/docs/streetmanager-webhook-setup.html`
- Complete setup guide for webhook registration
- Technical details and event types
- Testing instructions

## Setup Instructions

1. **Register Webhook**:
   - Visit: https://www.manage-roadworks.service.gov.uk/open-data-onboarding
   - Create an account for open data access
   - Register webhook endpoint: `https://go-barry.onrender.com/api/streetmanager/webhook`

2. **Automatic Confirmation**:
   - The endpoint will automatically confirm SNS subscriptions
   - Check logs for confirmation URL if manual confirmation needed

3. **Start Receiving Events**:
   - Real-time notifications for roadworks in North East England
   - Events automatically filtered by region
   - Alerts synced to Convex for distribution

## Benefits
- **Real-time Updates**: No more polling delays
- **Official Data**: Direct from UK government source
- **Automatic Filtering**: Only North East England events
- **Event-Driven**: Updates as they happen
- **CORS-Free**: Backend handles all processing

## Testing
Test the integration with:
```bash
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test
```

## Next Steps
- Monitor webhook logs for subscription confirmation
- Verify events are being received and processed
- Check Convex dashboard for synced alerts