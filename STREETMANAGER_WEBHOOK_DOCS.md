# Street Manager Webhook Integration

## Overview
The Go BARRY system now has a webhook endpoint ready to receive real-time roadwork notifications from manage-roadworks.service.gov.uk via AWS SNS.

## Webhook URL
```
https://go-barry.onrender.com/api/streetmanager/webhook
```

## Available Endpoints

### 1. Webhook Status (GET)
```bash
curl https://go-barry.onrender.com/api/streetmanager/webhook/status
```
Returns webhook configuration and registration instructions.

### 2. Test Endpoint (POST)
```bash
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test \
  -H "Content-Type: application/json" \
  -d '{}'
```
Tests the webhook processing without real Street Manager data.

### 3. Main Webhook (POST)
```bash
POST https://go-barry.onrender.com/api/streetmanager/webhook
```
Receives AWS SNS notifications from Street Manager UK.

## How It Works

1. **Registration**: Register the webhook URL with Street Manager UK at:
   https://www.manage-roadworks.service.gov.uk/open-data-onboarding

2. **Subscription Confirmation**: When registered, AWS SNS will send a subscription confirmation request. The webhook automatically handles this.

3. **Real-time Updates**: Once confirmed, the webhook receives real-time notifications about:
   - New roadwork permits
   - Roadwork updates
   - Work start/stop events
   - Permit status changes

4. **Geographic Filtering**: Only events within North East England (Newcastle, Gateshead, Sunderland, Durham) are processed.

5. **Alert Creation**: Valid events are transformed into Go BARRY alerts with:
   - Severity levels (High/Medium/Low)
   - Route matching
   - Real-time status updates
   - Official source attribution

## Event Types Supported
- PERMIT_CREATED
- PERMIT_UPDATED
- PERMIT_GRANTED
- PERMIT_REFUSED
- PERMIT_REVOKED
- PERMIT_CANCELLED
- ACTIVITY_CREATED
- ACTIVITY_UPDATED
- ACTIVITY_CANCELLED
- WORK_START
- WORK_STOP
- WORK_COMPLETE

## Testing

After deployment, test the webhook:

```bash
# Check status
curl https://go-barry.onrender.com/api/streetmanager/webhook/status

# Test processing
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test \
  -H "Content-Type: application/json" \
  -d '{}'

# Simulate SNS subscription
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook \
  -H "Content-Type: application/json" \
  -H "x-amz-sns-message-type: SubscriptionConfirmation" \
  -d '{"SubscribeURL": "https://example.com/confirm"}'
```

## Implementation Details

- **No Authentication Required**: AWS SNS doesn't support custom auth headers
- **Always Returns 200**: To prevent SNS retries
- **Auto-confirms Subscriptions**: No manual intervention needed
- **Filters by Geography**: Only North East England events processed
- **Real-time Sync**: Alerts sync to Convex for instant updates across all screens

## Next Steps

1. Register the webhook URL with Street Manager UK
2. Wait for subscription confirmation (handled automatically)
3. Start receiving real-time roadwork updates
4. Alerts will appear on supervisor dashboards automatically
