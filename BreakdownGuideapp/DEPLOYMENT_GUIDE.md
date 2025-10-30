# Trends & Defects Intelligence Panel - Deployment Guide

**Version:** 1.0.0
**Last Updated:** October 6, 2025
**Component:** Fleet Intelligence Module
**Deployment Target:** Production (Render.com + Supabase)

---

## ⚠️ **LEGACY DOCUMENTATION - OUTDATED** ⚠️

**This document describes outdated deployment using Supabase/Render.com.**

**Current Deployment:**
- ✅ Platform: cPanel (self-hosted)
- ✅ Database: MySQL (cPanel)
- ✅ See: `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`
- ✅ Quick: `docs/CPANEL_QUICK_START_10MIN.md`

**Last Updated:** October 27, 2025

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Requirements](#environment-requirements)
3. [Database Migration Steps](#database-migration-steps)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Testing Procedures](#testing-procedures)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring Recommendations](#monitoring-recommendations)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Pre-Deployment Checklist

### Code Review
- ✅ Code reviewed and approved
- ✅ All tests passing locally
- ✅ No console errors in development
- ✅ No security vulnerabilities (npm audit)
- ✅ Dependencies up to date

### Documentation
- ✅ API documentation complete
- ✅ Implementation status documented
- ✅ Deployment guide created (this file)
- ✅ Feature enhancements documented
- ⚠️ User guide pending

### Testing
- ✅ Unit tests passing (if applicable)
- ✅ Integration tests verified
- ✅ Manual testing completed
- ⚠️ Load testing pending
- ⚠️ Accessibility testing pending
- ⚠️ Mobile testing pending

### Infrastructure
- ✅ Environment variables configured
- ✅ Database accessible
- ✅ CORS configured correctly
- ✅ WebSocket endpoint accessible
- ✅ Render.com deployment configured

---

## Environment Requirements

### Backend Requirements

**Runtime:**
- Node.js: 18.x or higher
- npm: 9.x or higher

**Dependencies:**
```json
{
  "express": "^4.18.2",
  "ws": "^8.18.3",
  "@supabase/supabase-js": "^2.x",
  "dotenv": "^16.x",
  "cors": "^2.x"
}
```

**Environment Variables (Production):**

```bash
# Server Configuration
NODE_ENV=production
PORT=3002

# Database
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_KEY=<your_service_key>

# CORS
ALLOWED_ORIGINS=https://gobarry.co.uk,https://breakdowns.gobarry.co.uk

# Optional: Email Service (for escalations)
SENDGRID_API_KEY=<your_sendgrid_key>
# OR
AWS_SES_REGION=eu-west-1
AWS_SES_ACCESS_KEY=<your_aws_key>
AWS_SES_SECRET_KEY=<your_aws_secret>
```

**Environment Variables (Development):**

```bash
# Server Configuration
NODE_ENV=development
PORT=3001

# Database (same as production)
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_KEY=<your_service_key>

# CORS (allow localhost)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend Requirements

**Runtime:**
- Node.js: 18.x or higher
- Vite: 4.x or higher (if using Vite)
- React: 18.x or higher

**Environment Variables:**

```bash
# API Configuration
VITE_API_BASE_URL=https://breakdown-guide.onrender.com
VITE_WS_URL=wss://breakdown-guide.onrender.com

# Development
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## Database Migration Steps

### Step 1: Performance Optimization Indexes

**File:** Create new migration file: `backend/migrations/006_defect_intelligence_indexes.sql`

```sql
-- Performance indexes for defect intelligence queries
-- Run time: ~2-5 seconds depending on data volume

-- Index for time-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_at
  ON breakdowns(created_at DESC);

-- Index for vehicle-based queries (repeat defects)
CREATE INDEX IF NOT EXISTS idx_breakdowns_fleet_no
  ON breakdowns(fleet_no);

-- Index for depot analysis
CREATE INDEX IF NOT EXISTS idx_breakdowns_depot
  ON breakdowns(depot);

-- Index for defect type analysis
CREATE INDEX IF NOT EXISTS idx_breakdowns_issue_category
  ON breakdowns(issue_category);

-- Index for severity filtering
CREATE INDEX IF NOT EXISTS idx_breakdowns_severity
  ON breakdowns(severity);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_breakdowns_status
  ON breakdowns(status);

-- Composite index for defect analysis queries
-- Optimizes: SELECT ... WHERE created_at > X AND fleet_no = Y
CREATE INDEX IF NOT EXISTS idx_breakdowns_analysis
  ON breakdowns(created_at DESC, fleet_no, issue_category, depot);

-- Verify indexes created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'breakdowns'
ORDER BY indexname;
```

**Apply Migration:**

```bash
# Option 1: Via Supabase Dashboard
1. Go to https://app.supabase.com/project/oieliubbvvdzhzvikzal
2. Navigate to SQL Editor
3. Paste migration SQL
4. Click "Run"

# Option 2: Via Supabase CLI
supabase db push --project-ref oieliubbvvdzhzvikzal
```

**Verification:**

```sql
-- Check index sizes and usage
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'breakdowns'
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### Step 2: Optional - Create Materialized View for Analytics

**File:** `backend/migrations/007_defect_analytics_view.sql`

```sql
-- Materialized view for faster defect analytics
-- Refreshes every hour (can be adjusted)

CREATE MATERIALIZED VIEW IF NOT EXISTS defect_analytics_summary AS
SELECT
  depot,
  issue_category,
  DATE_TRUNC('day', created_at) AS defect_date,
  COUNT(*) AS defect_count,
  AVG(
    CASE
      WHEN severity = 'STOP' THEN 3
      WHEN severity = 'AMBER' THEN 2
      WHEN severity = 'CONTINUE' THEN 1
      ELSE 0
    END
  ) AS avg_severity_score,
  COUNT(DISTINCT fleet_no) AS unique_vehicles,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE status != 'resolved') AS unresolved_count
FROM breakdowns
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY depot, issue_category, DATE_TRUNC('day', created_at);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_defect_analytics_date
  ON defect_analytics_summary(defect_date DESC);

CREATE INDEX IF NOT EXISTS idx_defect_analytics_depot
  ON defect_analytics_summary(depot);

-- Auto-refresh setup (requires pg_cron extension)
-- SELECT cron.schedule(
--   'refresh-defect-analytics',
--   '0 * * * *', -- Every hour
--   $$REFRESH MATERIALIZED VIEW CONCURRENTLY defect_analytics_summary$$
-- );
```

**Manual Refresh Command:**

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY defect_analytics_summary;
```

### Step 3: Rollback Plan for Migrations

**File:** `backend/migrations/rollback_006_defect_intelligence_indexes.sql`

```sql
-- Rollback script for defect intelligence indexes
-- Only run if issues detected

DROP INDEX IF EXISTS idx_breakdowns_created_at;
DROP INDEX IF EXISTS idx_breakdowns_fleet_no;
DROP INDEX IF EXISTS idx_breakdowns_depot;
DROP INDEX IF EXISTS idx_breakdowns_issue_category;
DROP INDEX IF EXISTS idx_breakdowns_severity;
DROP INDEX IF EXISTS idx_breakdowns_status;
DROP INDEX IF EXISTS idx_breakdowns_analysis;

-- Verify rollback
SELECT COUNT(*) AS remaining_indexes
FROM pg_indexes
WHERE tablename = 'breakdowns'
  AND indexname LIKE 'idx_breakdowns_%';
```

---

## Backend Deployment

### Step 1: Prepare Code for Deployment

```bash
# Navigate to project directory
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"

# Verify you're on main branch
git branch

# Pull latest changes (if working with team)
git pull breakdown main

# Verify backend code
cd backend
npm install
npm run dev

# Test key endpoints locally
curl http://localhost:3001/health
curl http://localhost:3001/api/defects/depot-stats
```

### Step 2: Run Pre-Deployment Tests

```bash
# Backend directory
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"

# Run defects API test suite
node routes/test-defects.js

# Expected output:
# ✅ All 8 endpoints responding
# ✅ Authentication working
# ✅ WebSocket broadcasts verified
# ✅ Error handling confirmed

# Check for security vulnerabilities
npm audit

# Fix any critical/high vulnerabilities
npm audit fix
```

### Step 3: Commit and Push to Production

```bash
# From project root
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Deploy Trends & Defects Intelligence Panel to production

Comprehensive fleet intelligence module with:
- 8 production-ready API endpoints for defect analysis
- Real-time WebSocket broadcasting for 6 event types
- Pattern detection for proactive maintenance
- Frontend dashboard with live updates
- Complete documentation and test coverage

Components:
- TrendsDefectsPanel.jsx (1,797 lines)
- defects.js routes (1,069 lines)
- WebSocket integration (695 lines)
- Test suite (300+ lines)

Deployment includes:
- Database performance indexes
- Activity logging integration
- Error handling and fallbacks
- Test mode for development"

# Push to production remote (triggers Render deployment)
git push breakdown main
```

### Step 4: Monitor Deployment on Render.com

```bash
# Deployment typically takes 2-3 minutes

1. Go to https://dashboard.render.com
2. Navigate to "breakdown-guide" service
3. Click "Events" tab
4. Watch deployment progress

Expected stages:
- 🔄 Build starting...
- 📦 Installing dependencies...
- ✅ Build successful
- 🚀 Deploying...
- ✅ Live

# Check deployment logs
Click "Logs" tab
Look for:
✅ Supabase connection verified
✅ WebSocket server initialized
✅ Defects routes registered
✅ Server listening on port 3002
```

### Step 5: Verify Backend Deployment

```bash
# Test production API
curl https://breakdown-guide.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-06T...",
  "services": {
    "database": "connected",
    "websocket": "active"
  }
}

# Test defects endpoint (requires auth token)
curl -X GET "https://breakdown-guide.onrender.com/api/defects/depot-stats?timeframe=7d" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test WebSocket connection
# Using wscat (install: npm install -g wscat)
wscat -c "wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence"

# Expected:
# < {"type":"connected","channel":"defect-intelligence","authenticated":false,...}
```

### Step 6: Apply Database Migrations

```bash
# Via Supabase Dashboard (Recommended)
1. Go to https://app.supabase.com/project/oieliubbvvdzhzvikzal
2. Navigate to SQL Editor
3. Copy contents of: backend/migrations/006_defect_intelligence_indexes.sql
4. Paste into editor
5. Click "Run"
6. Verify: "Success. No rows returned"

# Check query performance improvement
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE tablename = 'breakdowns'
  AND schemaname = 'public';
```

---

## Frontend Deployment

### Step 1: Build Frontend for Production

```bash
# Navigate to frontend directory
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend"

# Install dependencies
npm install

# Build for production
npm run build

# Expected output:
# ✓ built in XXXms
# dist/index.html                  X kB
# dist/assets/index-XXXXXX.js      XXX kB
# dist/assets/index-XXXXXX.css     XX kB
```

### Step 2: Deploy to Hosting (Option 1: Render.com)

**Via Render Dashboard:**

1. Create new Static Site:
   - Name: `breakdown-guide-frontend`
   - Branch: `main`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

2. Environment Variables:
   ```
   VITE_API_BASE_URL=https://breakdown-guide.onrender.com
   VITE_WS_URL=wss://breakdown-guide.onrender.com
   ```

3. Custom Domain:
   - Add domain: `breakdowns.gobarry.co.uk`
   - Configure DNS:
     ```
     CNAME breakdowns.gobarry.co.uk -> breakdown-guide-frontend.onrender.com
     ```

### Step 3: Deploy to Hosting (Option 2: cPanel)

**Using npm run build:cpanel:**

```bash
# Frontend directory
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend"

# Build for cPanel deployment
npm run build:cpanel

# Upload to cPanel
# Files are in: frontend/dist/

# Via cPanel File Manager:
1. Go to cPanel → File Manager
2. Navigate to: public_html/breakdowns/
3. Upload all files from frontend/dist/
4. Set permissions: 755 for directories, 644 for files

# Verify deployment
curl https://breakdowns.gobarry.co.uk
```

### Step 4: Verify Frontend Deployment

```bash
# Test frontend URL
curl -I https://breakdowns.gobarry.co.uk

# Expected:
# HTTP/2 200
# content-type: text/html

# Open in browser
# Navigate to: https://breakdowns.gobarry.co.uk

# Test features:
1. Login with supervisor credentials
2. Navigate to SDC Dashboard
3. Verify Trends & Defects panel visible on right sidebar
4. Check WebSocket connection status (should be 🟢 LIVE)
5. Verify data loads correctly
6. Test refresh button
7. Test escalation modal
```

---

## Testing Procedures

### Post-Deployment Functional Testing

#### 1. API Endpoint Testing

```bash
# Test all defects endpoints
BASE_URL="https://breakdown-guide.onrender.com"
TOKEN="your_supervisor_token_here"

# Repeat defects analysis
curl -X POST "$BASE_URL/api/defects/repeat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"7d"}'

# Trending defects
curl -X POST "$BASE_URL/api/defects/trends" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"7d","groupByType":true}'

# Depot statistics
curl -X GET "$BASE_URL/api/defects/depot-stats?timeframe=7d" \
  -H "Authorization: Bearer $TOKEN"

# Predictive alerts
curl -X GET "$BASE_URL/api/defects/predictive?timeframe=30d" \
  -H "Authorization: Bearer $TOKEN"

# Vehicle history
curl -X GET "$BASE_URL/api/defects/vehicle/6348" \
  -H "Authorization: Bearer $TOKEN"
```

#### 2. WebSocket Testing

```bash
# Install wscat if not already installed
npm install -g wscat

# Connect to defect-intelligence channel
wscat -c "wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence"

# Should receive:
# < {"type":"connected","channel":"defect-intelligence",...}

# Trigger an event (in another terminal)
curl -X POST "$BASE_URL/api/defects/repeat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"24h"}'

# Should receive in wscat:
# < {"type":"NEW_REPEAT_DEFECT","data":{...},...}
```

#### 3. Frontend Integration Testing

**Manual Test Script:**

1. **Login Test:**
   - Go to https://breakdowns.gobarry.co.uk
   - Login with supervisor credentials
   - Verify successful authentication

2. **Dashboard Load Test:**
   - Navigate to SDC Dashboard
   - Verify Trends & Defects panel visible
   - Check WebSocket status (🟢 LIVE expected)
   - Verify loading spinner appears initially

3. **Data Display Test:**
   - Wait for data to load (should be < 2s)
   - Verify 4 sections present:
     - Critical Vehicles
     - Trending Issues
     - Depot Hotspots
     - Predictive Alerts
   - Check data accuracy (cross-reference with API)

4. **Timeframe Filter Test:**
   - Change timeframe to "30 days"
   - Verify data refreshes
   - Check loading state appears
   - Confirm new data displayed

5. **Real-Time Update Test:**
   - Create a new breakdown via wizard
   - Wait up to 10 seconds
   - Verify panel updates automatically
   - Check for green pulse animation on updated cards

6. **Escalation Test:**
   - Click "⚠️ Escalate to Engineering" on any critical vehicle
   - Verify modal opens
   - Check vehicle details displayed
   - Cancel modal (don't submit unless testing email)

7. **Refresh Test:**
   - Click refresh button (🔄)
   - Verify button shows ⟳ during refresh
   - Confirm data refreshes
   - Check no errors in console

#### 4. Performance Testing

```bash
# Load test with Apache Bench (install: brew install apache-bench)
ab -n 100 -c 10 "https://breakdown-guide.onrender.com/api/defects/depot-stats?timeframe=7d" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected results:
# Requests per second: > 10
# Average response time: < 500ms
# Failed requests: 0

# WebSocket connection test (multiple clients)
for i in {1..10}; do
  wscat -c "wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence" &
done

# Monitor Render.com dashboard for:
# CPU usage: < 80%
# Memory usage: < 1.5GB
# Response time: < 500ms
```

#### 5. Error Handling Testing

```bash
# Test invalid token
curl -X GET "$BASE_URL/api/defects/depot-stats" \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized

# Test invalid timeframe
curl -X POST "$BASE_URL/api/defects/repeat" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"timeframe":"invalid"}'

# Expected: 400 Bad Request or fallback to default

# Test network interruption
# In browser DevTools:
# 1. Go to Network tab
# 2. Select "Offline"
# 3. Try to refresh panel
# 4. Verify graceful degradation (error message or cached data)
```

---

## Rollback Procedures

### Quick Rollback (Revert to Previous Deploy)

**Scenario:** Critical bug found, need immediate rollback

```bash
# Option 1: Via Render Dashboard
1. Go to https://dashboard.render.com
2. Select "breakdown-guide" service
3. Click "Events" tab
4. Find previous successful deployment
5. Click "Redeploy" on that commit

# Option 2: Via Git
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"

# View recent commits
git log --oneline -10

# Identify last working commit (before deployment)
# Example: abc1234 - Previous working version

# Revert to that commit
git reset --hard abc1234

# Force push to production (BE CAREFUL!)
git push breakdown main --force

# Render will auto-deploy previous version
```

### Partial Rollback (Hide Panel Only)

**Scenario:** Panel has issues, but backend is fine

```bash
# Edit frontend to hide panel
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/src/dashboards/sdc"

# Edit SDCDashboard.jsx
# Comment out TrendsDefectsPanel, uncomment StatusWidget

# Lines 1500-1507 change to:
<div className="right-sidebar">
  {/* <TrendsDefectsPanel testMode={testMode} /> */}
  <StatusWidget />
  <RecentDecisions decisions={recentDecisions} />
</div>

# Commit and deploy
git add .
git commit -m "fix: temporarily revert to StatusWidget"
git push breakdown main
```

### Database Rollback (Indexes)

**Scenario:** Indexes causing performance issues

```sql
-- Run in Supabase SQL Editor
-- See: backend/migrations/rollback_006_defect_intelligence_indexes.sql

DROP INDEX IF EXISTS idx_breakdowns_created_at;
DROP INDEX IF EXISTS idx_breakdowns_fleet_no;
DROP INDEX IF EXISTS idx_breakdowns_depot;
DROP INDEX IF EXISTS idx_breakdowns_issue_category;
DROP INDEX IF EXISTS idx_breakdowns_severity;
DROP INDEX IF EXISTS idx_breakdowns_status;
DROP INDEX IF EXISTS idx_breakdowns_analysis;
```

### Emergency Shutdown (WebSocket Issues)

**Scenario:** WebSocket causing server instability

```bash
# Via Render Dashboard
1. Go to Settings → Environment
2. Add: DISABLE_WEBSOCKET=true
3. Save changes (triggers redeploy)

# Server will skip WebSocket initialization
# Panel will fall back to polling mode
```

---

## Monitoring Recommendations

### Application Monitoring

#### 1. Uptime Monitoring

**Service:** UptimeRobot (Free tier)

```
Monitor 1: Backend API
- URL: https://breakdown-guide.onrender.com/health
- Interval: 5 minutes
- Alert: Email + SMS on downtime

Monitor 2: Frontend
- URL: https://breakdowns.gobarry.co.uk
- Interval: 5 minutes
- Alert: Email on downtime

Monitor 3: WebSocket
- URL: wss://breakdown-guide.onrender.com/ws
- Type: Keyword monitoring
- Keyword: "connected"
- Interval: 10 minutes
```

#### 2. Performance Monitoring

**Service:** Render.com Built-in Metrics

```
Metrics to track:
- CPU usage (alert if > 80% for 5 minutes)
- Memory usage (alert if > 1.8GB)
- Response time (alert if > 1s average)
- Request volume (track daily patterns)

Access: https://dashboard.render.com → breakdown-guide → Metrics
```

#### 3. Error Tracking

**Service:** Sentry (Recommended)

```bash
# Install Sentry
npm install @sentry/react @sentry/node

# Backend setup (server.js)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

# Frontend setup (main.jsx)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1
});
```

#### 4. Database Monitoring

**Via Supabase Dashboard:**

```
Metrics to track:
- Database size (alert at 400MB / 500MB limit)
- Connection count (alert if > 50)
- Slow queries (> 1s)
- Index usage statistics

Access: https://app.supabase.com/project/oieliubbvvdzhzvikzal
Navigate to: Database → Performance
```

#### 5. Custom Logging

**Winston Logger Setup:**

```bash
npm install winston

# backend/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export default logger;

# Usage
import logger from './utils/logger.js';

logger.info('Defects endpoint called', { timeframe: '7d', user: req.user.id });
logger.error('Database query failed', { error: error.message });
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Panel Not Loading Data

**Symptoms:**
- Loading spinner indefinitely
- "Analyzing fleet defects..." never completes
- No error messages

**Diagnosis:**
```bash
# Check API connectivity
curl https://breakdown-guide.onrender.com/health

# Check browser console for errors
# DevTools → Console

# Check if using test mode
# Look for: console.log('🧪 Test mode enabled')
```

**Solutions:**
1. Check authentication token is valid
2. Verify API base URL in frontend config
3. Check CORS settings allow origin
4. Enable test mode to bypass API

#### Issue 2: WebSocket Not Connecting

**Symptoms:**
- Connection status shows 🔴 or 🟡 Reconnecting
- No real-time updates
- Console shows: "WebSocket connection failed"

**Diagnosis:**
```bash
# Test WebSocket directly
wscat -c "wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence"

# Check Render logs
# Dashboard → breakdown-guide → Logs
# Look for: "WebSocket server initialized"
```

**Solutions:**
1. Check Render service is awake (cold start takes ~10s)
2. Verify WebSocket URL in frontend config
3. Check firewall allows WebSocket connections
4. Fall back to polling mode if persistent issues

#### Issue 3: Slow Performance / Timeouts

**Symptoms:**
- API responses > 2 seconds
- Database query timeouts
- "Failed to fetch" errors

**Diagnosis:**
```sql
-- Check slow queries in Supabase
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('breakdowns'));
```

**Solutions:**
1. Apply database indexes (see migration steps)
2. Reduce query timeframes (7d instead of 30d)
3. Enable query result caching
4. Upgrade Render plan for more CPU

#### Issue 4: Mobile Layout Issues

**Symptoms:**
- Cards too wide on mobile
- Text too small to read
- Buttons not tappable

**Diagnosis:**
```javascript
// Check viewport in browser DevTools
// Toggle device toolbar
// Test on: iPhone 13 Pro (390x844)

// Check CSS media queries applying
// Inspect element → Computed styles
```

**Solutions:**
1. Review responsive CSS (lines 1824-1854 in TrendsDefectsPanel.jsx)
2. Increase minimum touch target size to 44x44px
3. Use relative font sizes (rem instead of px)
4. Test on real devices

#### Issue 5: Escalation Emails Not Sending

**Symptoms:**
- Escalation succeeds but no email received
- Activity logged but no notification

**Diagnosis:**
```bash
# Check environment variables
echo $SENDGRID_API_KEY
# OR
echo $AWS_SES_ACCESS_KEY

# Check activity logs
# Supabase Dashboard → activity_logs table
# Look for: activity_type = 'defect_escalation'
```

**Solutions:**
1. Email service not yet configured (expected)
2. See FEATURE_ENHANCEMENTS.md for email setup
3. Manual notification currently required
4. Monitor activity logs for escalation records

---

## Post-Deployment Validation

### Validation Checklist

**Day 1 (Deployment Day):**
- ✅ Backend health check responds
- ✅ Frontend loads correctly
- ✅ WebSocket connection established
- ✅ API endpoints respond to test requests
- ✅ Database queries complete successfully
- ✅ No critical errors in logs
- ✅ Real-time updates working

**Week 1:**
- ✅ Monitor error rates (target: < 1%)
- ✅ Track API response times (target: < 500ms)
- ✅ Verify WebSocket stability (target: < 5 disconnects/day)
- ✅ Collect user feedback from supervisors
- ✅ Review database performance
- ✅ Check for any accessibility issues reported

**Month 1:**
- ✅ Analyze usage patterns
- ✅ Optimize based on real-world data
- ✅ Plan feature enhancements
- ✅ Review security audit logs
- ✅ Update documentation based on learnings

---

## Support and Escalation

### Support Contacts

**Technical Issues:**
- **Developer:** Anthony Gair
- **Email:** anthony.gair@gonortheast.co.uk
- **Response Time:** Within 4 hours during business hours

**Infrastructure:**
- **Render.com Support:** support@render.com
- **Supabase Support:** https://supabase.com/support

**User Training:**
- **SDC Operations Manager:** [Contact to be added]
- **Training Materials:** See user documentation (pending)

### Escalation Path

**Level 1:** Minor issues, questions
- Contact: Developer via email
- Response: Within 4 hours

**Level 2:** Service degradation
- Contact: Developer via phone + email
- Response: Within 1 hour
- Action: Investigate and provide update

**Level 3:** Service outage
- Contact: Developer immediately
- Response: Within 15 minutes
- Action: Emergency rollback if needed

---

## Deployment History

### Version 1.0.0 (October 6, 2025)
- ✅ Initial production deployment
- ✅ 8 API endpoints operational
- ✅ WebSocket broadcasting configured
- ✅ Frontend dashboard integrated
- ✅ Test mode available
- ⚠️ Database indexes pending
- ⚠️ Email escalations pending
- ⚠️ PDF reports pending

---

**Deployment Guide Complete**

For questions or issues during deployment, contact: anthony.gair@gonortheast.co.uk

**Last Updated:** October 6, 2025
**Version:** 1.0.0
**Next Review:** After first production deployment
