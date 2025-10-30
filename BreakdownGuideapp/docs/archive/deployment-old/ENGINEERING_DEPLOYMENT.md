# Engineering Dashboard - Quick Deployment Guide

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

## 🚀 5-Minute Deployment

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard**: https://app.supabase.com/project/oieliubbvvdzhzvikzal
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `backend/migrations/QUICKSTART_SUPABASE.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

**Expected Output**:
```
✅ Breakdowns table: 13 engineering columns added
✅ Engineers table: 5 engineers loaded

Sample Engineer Logins:
  ENG001 - John Smith (Washington)
  ENG002 - Sarah Johnson (Riverside)
  ENG003 - Mike Williams (Consett)
  ENG004 - Emma Brown (Washington)
  ENG005 - David Wilson (Deptford)
```

### Step 2: Deploy Backend

```bash
git add .
git commit -m "Add Engineering Dashboard - Complete Implementation"
git push breakdown main
```

**Render will auto-deploy in 2-3 minutes.**

Monitor at: https://dashboard.render.com/web/srv-YOUR-SERVICE-ID

### Step 3: Verify Backend

```bash
curl https://breakdown-guide.onrender.com/api/engineering/jobs
```

Expected response:
```json
{
  "success": true,
  "jobs": [],
  "count": 0,
  "filter": "all"
}
```

### Step 4: Test Engineering Dashboard

1. Open: https://breakdowns.gobarry.co.uk/engineering
2. You should see the Engineer Login prompt
3. Click **"👷 Engineer Login"**
4. Enter:
   - Badge: `ENG001`
   - Name: `John Smith`
5. You should see:
   - ✅ "Logged in as John Smith (ENG001)" notification
   - 🟢 Green "Live" indicator (WebSocket connected)
   - Your name in the blue header bar

### Step 5: Create Test Breakdown

To test the full workflow, create a breakdown from the Breakdown Guide:

1. Open: https://breakdowns.gobarry.co.uk
2. Login as supervisor (AG003)
3. Create new breakdown via wizard
4. The breakdown should immediately appear in Engineering Dashboard

---

## ✅ Verification Checklist

- [ ] Database migration completed successfully
- [ ] Backend deployed to Render
- [ ] Engineering Dashboard loads
- [ ] Engineer login works
- [ ] WebSocket shows "🟢 Live"
- [ ] Can view jobs in queue
- [ ] Test breakdown created
- [ ] Can accept job
- [ ] Can update status
- [ ] Can complete job

---

## 🔧 Troubleshooting

### Database Migration Failed

**Error**: "column already exists"
- **Solution**: This is safe to ignore. The migration checks before adding columns.

**Error**: "relation engineers does not exist"
- **Solution**: Make sure you ran the ENTIRE script, not just part of it.

### Backend Not Deploying

**Check Render Logs**:
1. Go to Render Dashboard
2. Select `breakdown-guide` service
3. Click **Logs** tab
4. Look for errors

**Common Issues**:
- Missing environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- Port conflicts (should be 3002)
- ES6 module errors (check all imports use `import`, not `require`)

### WebSocket Not Connecting

**Symptom**: Red "🔴 Offline" indicator

**Fixes**:
1. Check browser console for WebSocket errors
2. Verify `VITE_WS_URL=wss://breakdown-guide.onrender.com` in frontend `.env`
3. Test WebSocket directly:
   ```javascript
   const ws = new WebSocket('wss://breakdown-guide.onrender.com');
   ws.onopen = () => console.log('✅ Connected');
   ws.onerror = (e) => console.error('❌ Error:', e);
   ```

### Jobs Not Loading

**Check API**:
```bash
curl https://breakdown-guide.onrender.com/api/engineering/jobs
```

If returns 500 error:
1. Check Render logs for database connection errors
2. Verify Supabase credentials in environment variables
3. Check if migration completed successfully

### Engineer Login Not Saving

**Symptom**: Page refresh loses login

**Fix**: Check browser localStorage:
```javascript
// In browser console
console.log(localStorage.getItem('engineer_badge'));
console.log(localStorage.getItem('engineer_name'));
```

If null, check for browser privacy settings blocking localStorage.

---

## 📊 Test Data

### Sample Breakdowns for Testing

You can manually create test breakdowns in Supabase:

```sql
INSERT INTO breakdowns (
  breakdown_id,
  fleet_number,
  depot,
  location,
  issue_category,
  severity,
  status,
  supervisor_name,
  supervisor_badge,
  created_at
) VALUES (
  'TEST-' || floor(random() * 10000)::text,
  '6377',
  'Washington',
  'Newcastle upon Tyne, Northbound',
  'Power Steering',
  'AMBER',
  'active',
  'Test Supervisor',
  'TS001',
  NOW()
);
```

### Check Engineer Data

```sql
SELECT badge_number, name, depot, status FROM engineers;
```

Expected output:
```
ENG001 | John Smith      | Washington | available
ENG002 | Sarah Johnson   | Riverside  | available
ENG003 | Mike Williams   | Consett    | available
ENG004 | Emma Brown      | Washington | available
ENG005 | David Wilson    | Deptford   | available
```

---

## 🎯 Quick Test Workflow

1. **Login as Engineer**:
   - Badge: ENG001
   - Name: John Smith

2. **Create Test Breakdown** (or use existing):
   - Fleet: 6377
   - Location: Newcastle
   - Issue: Power Steering
   - Severity: AMBER

3. **Accept Job**:
   - Click "✓ Accept Job"
   - Enter ETA: 15 minutes
   - Check status changes to "Dispatched"

4. **Update Status**:
   - Click "📍 Update Status"
   - Select "On Site"
   - Add note: "Arrived on location"
   - Click "Update Status"

5. **View Details**:
   - Click "📋 Details"
   - Review all 4 tabs
   - Check Timeline shows progression

6. **Complete Job**:
   - Click "✅ Complete"
   - Select "Fixed on Site"
   - Add notes: "Replaced power steering pump"
   - Add part: PS-12345, "Power Steering Pump", Qty: 1
   - Labor hours: 0.75
   - Repair category: Hydraulics
   - Root cause: "Pump seal failure"
   - Click "Complete Job"

7. **Verify**:
   - Job disappears from queue
   - Check Supabase for completed breakdown
   - Verify all timestamps and data saved

---

## 📞 Support

**Issues?** Check:
- Render Logs: https://dashboard.render.com
- Supabase Logs: https://app.supabase.com/project/oieliubbvvdzhzvikzal/logs
- Browser Console: F12 → Console tab

**Documentation**:
- Full API Reference: `ENGINEERING_DASHBOARD.md`
- System Architecture: `README.md`

---

## ✨ What's Next?

After successful deployment, you can:

1. **Add Real Engineers**: Update the `engineers` table with actual staff
2. **Customize Skills**: Edit `skills` JSONB array for each engineer
3. **Set Shift Times**: Add `shift_start` and `shift_end` for each engineer
4. **Add Phone Numbers**: Update `phone` column for contact info
5. **Configure Depots**: Match depot codes to your actual depot structure

**Example**:
```sql
UPDATE engineers
SET phone = '07123456789',
    shift_start = '08:00',
    shift_end = '16:00',
    skills = '["electrical", "mechanical", "hvac"]'::jsonb
WHERE badge_number = 'ENG001';
```

---

**Deployment Date**: October 4, 2025
**Status**: Ready for Production ✅
