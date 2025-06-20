# Activity Log & Duty Management - Deployment Checklist

## 📋 Current Status
- ✅ Code fixed locally (activity logger uses correct table)
- ✅ Duty management API created
- ✅ Display Screen updated to parse JSON strings
- ❌ Backend not deployed to Render yet
- ❓ Supabase table structure needs verification

## 🚀 Deployment Steps

### 1. Test Locally First
```bash
# In new terminal while backend is running:
chmod +x test-local-activity.sh
./test-local-activity.sh
```
✅ Should see activity logs with proper data

### 2. Fix Supabase Table (if needed)
1. Go to Supabase SQL Editor
2. Run the queries in `fix-activity-logs-table.sql`
3. Check if `details` column is JSONB (not TEXT)
4. Fix if needed with the ALTER TABLE command

### 3. Deploy Backend
```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```
This will:
- Commit all changes
- Push to GitHub
- Trigger Render deployment

### 4. Wait for Deployment
- Check https://dashboard.render.com
- Wait for "Deploy live" status (3-5 minutes)
- Look for green checkmark

### 5. Verify Deployment
```bash
chmod +x check-deployment-status.sh
./check-deployment-status.sh
```
✅ Routes should NOT return "renderOptimized" anymore

### 6. Test Production
```bash
chmod +x diagnose-activity-logs.sh
./diagnose-activity-logs.sh
```
✅ Should see real activity data

### 7. Check Display Screen
- Open https://gobarry.co.uk display screen
- Check browser console for logs
- Should see activities appearing

## 🔍 Troubleshooting

### If activities still don't show:
1. **Check browser console** for errors
2. **Check API response** - is it returning data?
3. **Check Supabase** - are activities being saved?
4. **Check details format** - is it JSONB or string?

### Common Issues:
- **"renderOptimized" responses** = Backend not deployed
- **Empty logs array** = Database issue or no activities
- **Parsing errors** = Details column is TEXT not JSONB
- **No display** = Frontend not refreshing (wait 15 seconds)

## 📱 What Should Work After Deployment:
- ✅ Login shows: "Alex Woodcock logged in (AW001)"
- ✅ Duty shows: "David Hall began Duty 100"
- ✅ Roadwork shows: "Anthony Gair created roadwork at A1 Northbound"
- ✅ Email shows: "Claire Fiddler sent email to 3 groups"
- ✅ Duty end shows: "David Hall ended Duty 100"
- ✅ Active supervisors list updates in real-time

## 🎯 Quick Test Commands:
```bash
# Login and start duty
curl -X POST https://go-barry.onrender.com/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"supervisorId": "supervisor005", "badge": "DH005"}'

# Use the sessionId from above response:
curl -X POST https://go-barry.onrender.com/api/duty/start \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "YOUR_SESSION_ID", "dutyNumber": 100}'

# Check logs
curl https://go-barry.onrender.com/api/activity/logs?limit=5
```

## ✅ Success Criteria:
1. API returns activity data (not "renderOptimized")
2. Activities save to Supabase
3. Display Screen shows recent activities
4. Duty management works (start/end)
5. All activity types format correctly
