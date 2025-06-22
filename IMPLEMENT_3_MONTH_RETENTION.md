# Go BARRY - 3-Month Data Retention Implementation Guide

## 🎯 SOLUTION SUMMARY

This implementation provides **automatic 3-month data retention** for:
- ✅ **Manual incidents** from Incident Manager
- ✅ **Manual roadworks** from Roadworks Manager  
- ✅ **API-sourced data** (historical incidents, etc.)
- ✅ **Supervisor audit trail** actions

**Key Benefits:**
- 🛡️ **Data persists** across deployments/restarts (no more lost data on Render)
- 🧹 **Automatic cleanup** every 24 hours removes 3+ month old data
- 📊 **Full audit trail** of all supervisor actions
- ⚡ **Zero downtime** - maintains API compatibility

---

## 🚀 QUICK SETUP (5 steps)

### Step 1: Run Database Schema
```bash
# Copy the schema to Supabase
# Go to: https://supabase.com/dashboard → Your Project → SQL Editor
# Paste content from: backend/supabase-incidents-roadworks-schema.sql
# Click "RUN"
```

### Step 2: Update Main App Startup
Add to your `backend/index.js` or main app file:

```javascript
// Add to imports
import startupService from './services/startupService.js';

// Add after Express app creation
async function startServer() {
  // ... existing startup code ...
  
  // Initialize Go BARRY systems
  await startupService.initializeGoBarrySystem();
  
  // ... start your server ...
}

startServer();
```

### Step 3: Update Incident API Import
In `backend/routes/incidentAPI.js` (already done):
```javascript
// CHANGED FROM:
import sharedStorage from '../services/sharedIncidentStorage.js';

// CHANGED TO:
import supabaseStorage from '../services/supabaseIncidentStorage.js';
```

### Step 4: Update Roadworks API Import  
In `backend/routes/roadworksAPI.js`:
```javascript
// ADD this import:
import supabaseRoadworksStorage from '../services/supabaseRoadworksStorage.js';

// REPLACE in-memory arrays with Supabase calls (see migration script)
```

### Step 5: Migrate Existing Data
```bash
cd backend
node migrate-manual-data-to-supabase.js
```

---

## 📁 FILES CREATED

### New Services:
- `backend/services/supabaseIncidentStorage.js` - Incidents with 3-month retention
- `backend/services/supabaseRoadworksStorage.js` - Roadworks with 3-month retention  
- `backend/services/dataRetentionService.js` - Automatic cleanup every 24 hours
- `backend/services/startupService.js` - System initialization

### Database Schema:
- `backend/supabase-incidents-roadworks-schema.sql` - Complete schema with retention

### Migration:
- `backend/migrate-manual-data-to-supabase.js` - Data migration script

---

## ⚙️ HOW IT WORKS

### Automatic Retention:
1. **Every record** gets a `retention_date` = `created_at + 3 months`
2. **Cleanup runs** automatically every 24 hours  
3. **Deletes** all records where `retention_date < NOW()`
4. **Logs** cleanup activity for audit

### Manual Cleanup:
```javascript
// Trigger manual cleanup
import dataRetentionService from './services/dataRetentionService.js';
const results = await dataRetentionService.runDataRetentionCleanup();
console.log(`Deleted ${results.totalDeleted} old records`);
```

### Extend Retention (Emergency):
```javascript
// Extend specific record by 6 months
await dataRetentionService.extendRetention('manual_incidents', 'incident_123', 6);
```

---

## 🛡️ DATA SAFETY

### What Gets Deleted:
- ✅ Manual incidents older than 3 months
- ✅ Manual roadworks older than 3 months  
- ✅ Supervisor actions older than 3 months
- ✅ Historical incidents older than 3 months

### What Stays:
- ✅ Current supervisor data
- ✅ System configuration
- ✅ Template data
- ✅ Active sessions

### Backup Strategy:
- 📁 Migration script creates backups in `/data/pre-supabase-migration/`
- 🔄 Supabase has built-in backups
- 🚨 Emergency retention extension available

---

## 🧪 TESTING

### Check Retention Status:
```javascript
import dataRetentionService from './services/dataRetentionService.js';
const status = await dataRetentionService.getRetentionStatus();
console.table(status.tables);
```

### Test Cleanup (Dry Run):
```javascript
const testResults = await dataRetentionService.testRetentionSystem();
console.log('Test results:', testResults);
```

### Monitor System Health:
```javascript
import startupService from './services/startupService.js';
const health = await startupService.getSystemHealth();
console.log('System health:', health);
```

---

## 🔧 CONFIGURATION

### Retention Periods:
Edit `dataRetentionService.js` → `RETENTION_CONFIG`:
```javascript
const RETENTION_CONFIG = {
  manual_incidents: { enabled: true, months: 3 },
  manual_roadworks: { enabled: true, months: 6 }, // Extended example
  // ...
};
```

### Cleanup Schedule:
Edit `dataRetentionService.js` → `CLEANUP_INTERVAL`:
```javascript
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours (default)
```

---

## 📊 MONITORING

### API Endpoints (Add these):
```javascript
// GET /api/system/health - System health with retention info
// GET /api/system/retention-status - Detailed retention status  
// POST /api/admin/cleanup - Manual cleanup trigger (admin only)
```

### Logs to Watch:
```
✅ Supabase incident storage initialized successfully
✅ Supabase roadworks storage initialized successfully  
🧹 Data retention cleanup scheduled (every 24 hours)
✅ Cleanup completed: 42 old records removed
```

---

## ⚠️ TROUBLESHOOTING

### "Missing Supabase credentials":
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### "Table does not exist":
- Run the SQL schema in Supabase Dashboard first

### "Data not appearing":
- Check if APIs are using new storage services
- Verify migration script completed successfully

### "Cleanup not running":
- Check startup service initialization
- Look for cleanup logs every 24 hours

---

## 🎉 COMPLETION CHECKLIST

- [ ] ✅ Database schema created in Supabase
- [ ] ✅ Startup service added to main app
- [ ] ✅ Incident API using Supabase storage
- [ ] ✅ Roadworks API using Supabase storage  
- [ ] ✅ Existing data migrated successfully
- [ ] ✅ Cleanup running automatically every 24 hours
- [ ] ✅ System health monitoring working
- [ ] ✅ All manual incidents/roadworks persist across restarts
- [ ] ✅ 3-month retention working as expected

**Result:** Manual incidents and roadworks data now automatically saved for exactly 3 months, with persistent storage that survives deployments! 🎯
