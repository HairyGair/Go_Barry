# ETA Request Pop-up System - Deployment Guide

## 🚀 Quick Deployment Steps

### Step 1: Database Setup
1. Open Supabase SQL Editor
2. Run the migration script: `1-database-migration.sql`
3. Verify tables created:
   - `eta_requests`
   - `active_eta_requests` (view)
   - Updated `breakdowns` table with ETA columns

### Step 2: Backend Integration

#### Option A: Add to existing breakdownTrackerV2.js
```bash
# Copy the ETA endpoints from 2-backend-api.js
# Add them to your existing /backend/routes/breakdownTrackerV2.js
```

#### Option B: Deploy as separate module
```bash
# Copy 2-backend-api.js to:
/backend/routes/etaRequestSystem.js

# Update your main server file with code from 5-server-integration.js
```

### Step 3: Install Dependencies
```bash
cd backend
npm install socket.io node-cron
```

### Step 4: Update Environment Variables
Add to your `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Step 5: Deploy Frontend Files

1. **Engineering Dashboard**
   - Copy `3-engineering-dashboard.html` to `/public/engineering-eta-dashboard.html`
   - Add link from main engineering page

2. **SDC Dashboard Enhancement**
   - Integrate code from `4-sdc-dashboard-enhancement.html` into your existing dashboard
   - Or deploy as standalone and link from main SDC dashboard

### Step 6: Configure WebSocket CORS
Update your server to allow WebSocket connections:
```javascript
const io = socketIO(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://go-barry.onrender.com",
            "https://your-frontend-domain.com"
        ],
        methods: ["GET", "POST"]
    }
});
```

## 🧪 Testing

### Test Checklist
- [ ] Database migration successful
- [ ] Backend API endpoints responding
- [ ] WebSocket connection established
- [ ] Engineering dashboard loads
- [ ] SDC can request ETA
- [ ] Pop-up appears on engineering screen
- [ ] Sound alerts working
- [ ] ETA submission works
- [ ] SDC receives ETA response
- [ ] Auto-escalation after 10/20 minutes
- [ ] Stats updating correctly

### Manual Test Script
```bash
# Test API health
curl https://go-barry.onrender.com/health

# Test ETA request (replace with actual breakdown_id)
curl -X POST https://go-barry.onrender.com/api/breakdowns/BD-2025-00001/request-eta \
  -H "Content-Type: application/json" \
  -d '{
    "requested_by": "SDC001",
    "urgency_level": "urgent",
    "notes": "Test request",
    "fleet_number": "6301",
    "location": "Newcastle Central",
    "depot_id": "Washington"
  }'

# Test pending requests
curl https://go-barry.onrender.com/api/eta-requests/pending

# Test stats
curl https://go-barry.onrender.com/api/eta-requests/stats
```

## 📱 User Access URLs

### For Engineering Team
```
https://go-barry.onrender.com/engineering-eta-dashboard.html
```

### For SDC Operators
```
https://go-barry.onrender.com/enhanced-breakdown-dashboard.html
```

## 🔧 Configuration Options

### Urgency Levels
- **Normal**: Default for standard breakdowns
- **Urgent**: Auto-escalates after 10 minutes
- **Critical**: Maximum priority, continuous alerts

### Auto-Escalation Rules
- Normal → Urgent: After 10 minutes
- Urgent → Critical: After 20 minutes

### Sound Alerts
- Can be toggled on/off per user
- Different sounds for urgency levels
- Browser tab flashing for visibility

## 🚨 Troubleshooting

### Common Issues

1. **Pop-up not appearing**
   - Check WebSocket connection in browser console
   - Verify engineering room subscription
   - Check browser allows pop-ups

2. **Sound not playing**
   - User needs to interact with page first (browser requirement)
   - Check sound toggle is enabled
   - Try different browser

3. **ETA not updating**
   - Verify WebSocket connection to SDC room
   - Check network connectivity
   - Refresh dashboard

4. **Database errors**
   - Verify Supabase connection
   - Check table permissions
   - Run migration again if needed

## 📊 Performance Monitoring

### Key Metrics to Track
- Average response time to ETA requests
- Number of escalations per day
- Peak request times
- Engineer response patterns

### SQL Queries for Reports
```sql
-- Daily ETA statistics
SELECT 
    DATE(requested_at) as date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded,
    AVG(EXTRACT(EPOCH FROM (responded_at - requested_at))/60) as avg_response_minutes
FROM eta_requests
WHERE requested_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(requested_at)
ORDER BY date DESC;

-- Engineer performance
SELECT 
    responded_by as engineer,
    COUNT(*) as total_responses,
    AVG(EXTRACT(EPOCH FROM (responded_at - requested_at))/60) as avg_response_minutes
FROM eta_requests
WHERE status = 'responded'
AND requested_at > NOW() - INTERVAL '30 days'
GROUP BY responded_by
ORDER BY total_responses DESC;

-- Breakdown patterns with ETA
SELECT 
    b.depot_id,
    COUNT(DISTINCT b.breakdown_id) as total_breakdowns,
    COUNT(DISTINCT er.id) as eta_requests,
    AVG(EXTRACT(EPOCH FROM (er.responded_at - er.requested_at))/60) as avg_eta_response
FROM breakdowns b
LEFT JOIN eta_requests er ON b.breakdown_id = er.breakdown_id
WHERE b.created_at > NOW() - INTERVAL '30 days'
GROUP BY b.depot_id;
```

## 🎯 Success Criteria

### Week 1 Goals
- [ ] System deployed and accessible
- [ ] All engineers trained on dashboard
- [ ] SDC operators trained on requesting ETAs
- [ ] 50%+ ETA requests receiving response

### Month 1 Goals
- [ ] 90%+ ETA requests receiving response
- [ ] Average response time < 2 minutes
- [ ] Zero system downtime
- [ ] Positive feedback from teams

## 📧 Support

### Technical Issues
- Backend/API: Engineering Team
- Database: Supabase Admin
- Frontend: Development Team

### Training & Usage
- SDC Supervisors: Operations Manager
- Engineering Team: Engineering Manager

## 🎉 Launch Plan

### Day 1 - Soft Launch
- Deploy to production
- Test with single depot (Washington)
- Monitor for issues

### Day 2-3 - Refinement
- Fix any identified issues
- Gather initial feedback
- Adjust urgency thresholds if needed

### Day 4-7 - Full Rollout
- Enable for all depots
- Train all operators
- Monitor metrics

### Week 2 - Review
- Analyze performance metrics
- Gather team feedback
- Plan improvements

---

## Quick Start Commands

```bash
# 1. Clone and setup
cd /backend
npm install socket.io node-cron

# 2. Run database migration
# (in Supabase SQL editor)

# 3. Deploy backend
npm run dev

# 4. Deploy frontend files
cp eta-popup-implementation/*.html /public/

# 5. Test
curl https://go-barry.onrender.com/health

# 6. Monitor logs
npm run logs
```

## 🏁 Ready to Deploy!

The system is fully implemented and ready for deployment. Follow the steps above to get the ETA Request Pop-up System live.

Remember to:
1. Test in staging first if available
2. Have rollback plan ready
3. Monitor closely during first 24 hours
4. Gather feedback from both teams

Good luck with the deployment! 🚀