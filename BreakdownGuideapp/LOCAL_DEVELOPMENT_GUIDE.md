# 🏠 Local Development Guide - 5 Day Build Sprint

You're off work for 5 days, so let's get your local environment set up for rapid development and testing!

## 🚀 Quick Start (First Time Setup)

### Terminal 1: Start Backend
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
./start-local.sh
```

**Backend runs on**: `http://localhost:3001`

### Terminal 2: Start Frontend
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

## ✅ What Works Locally Now

### Duty System (Just Implemented)
- ✅ Login with duty dropdown (4 duties)
- ✅ Duty badge in navigation bar
- ✅ Backend duty management API
- ✅ Database shift tracking

### Core Features
- ✅ Breakdown wizard system
- ✅ Control Room Display
- ✅ SDC Operations Dashboard
- ✅ Fleet Intelligence
- ✅ Activity Feed
- ✅ Authentication (MySQL backend)

## 🔧 Development Workflow

### Making Changes

1. **Edit files** in your IDE (VS Code, etc.)
2. **Backend auto-reloads** (nodemon watches for changes)
3. **Frontend auto-reloads** (Vite HMR)
4. **Test in browser** at `http://localhost:5173`
5. **Check database** in DBeaver (production DB)

### Testing Duty System

1. **Login**: Go to `http://localhost:5173`
2. **Select duty**: Choose "Duty 100" from dropdown
3. **Verify**: Green badge shows in nav bar
4. **Check DB**:
   ```sql
   SELECT * FROM supervisors WHERE email = 'your.email@gonortheast.co.uk';
   SELECT * FROM supervisor_shift_history ORDER BY shift_start DESC LIMIT 5;
   ```

## 📋 Next Features to Build (5 Day Sprint)

### 🔔 Priority 1: Shift Warning Notification (Day 1)
**Status**: Pending
**Goal**: Warn supervisor 15 minutes before shift ends

**Implementation**:
- Poll `/api/auth/shift-warning` every minute
- Show notification when within 15-minute window
- Message: "Your shift (Duty 100) ends in X minutes. Please ensure your EPM entries are complete - handover if not able to Miles Post any entries."

**Components to create**:
- `ShiftWarningNotification.jsx` - Notification UI
- `useShiftWarning` hook - Polling logic
- Integration in `App.jsx`

### 📊 Priority 2: Activity Feed Duty Integration (Day 2)
**Status**: Not started
**Goal**: Show duty in activity feed entries

**Implementation**:
- Add duty to breakdown creation logs
- Display duty badge in feed items
- Filter by duty in feed

### 🔍 Priority 3: Duty Filtering in Dashboards (Day 3)
**Status**: Not started
**Goal**: Filter breakdowns by duty for analysis

**Implementation**:
- Add duty filter dropdown to Control Room
- Add duty column to breakdown tables
- Statistics by duty

### 🏥 Priority 4: End Shift Functionality (Day 4)
**Status**: API exists, UI needed
**Goal**: Allow supervisor to manually end shift

**Implementation**:
- "End Shift" button in profile menu
- Confirmation dialog
- Calls `/api/auth/end-shift`
- Removes duty badge

### 📈 Priority 5: Shift History Reporting (Day 5)
**Status**: API exists, UI needed
**Goal**: View shift history for management

**Implementation**:
- Shift history table
- Filter by date, supervisor, duty
- Export to CSV
- Charts/statistics

## 🧪 Testing Checklist (Local)

Before deploying to production:

- [ ] Login without duty (optional field)
- [ ] Login with each duty (100, 200, 400, 500)
- [ ] Duty badge shows correctly
- [ ] Database updates correctly
- [ ] Shift warning triggers (manually set duty_end_time)
- [ ] End shift works
- [ ] Activity feed shows duty
- [ ] Dashboard filtering works
- [ ] Shift history displays correctly

## 🚀 Deployment Process

When ready to deploy:

1. **Test locally first**
2. **Run build**: `npm run build` in frontend
3. **Upload dist**: To `~/public_html/breakdowns.gobarry.co.uk/`
4. **Verify backend**: Check PM2 on cPanel
5. **Test live**: Clear cache and test at work URL

## 🐛 Common Issues & Fixes

### Backend won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### Frontend can't connect to backend
- Check `.env.development` has `VITE_API_URL=http://localhost:3001`
- Verify backend is running on port 3001
- Check browser console for CORS errors

### Database connection fails
- Verify `.env` in backend has correct MySQL credentials
- Check you can connect via DBeaver
- Ensure firewall allows connection

### Duty dropdown not showing
- Check browser console for errors
- Verify `/api/auth/duties` returns JSON (not HTML)
- Hard refresh browser (Ctrl+Shift+R)

## 📁 Project Structure

```
BreakdownGuideapp/
├── backend/
│   ├── index.js                    # Main server
│   ├── services/
│   │   └── dutyManager.js         # ✅ Duty management
│   ├── routes/
│   │   ├── auth.js                # ✅ Login with duty
│   │   └── breakdowns.js          # Breakdown tracking
│   └── start-local.sh             # ✅ Quick start script
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # ✅ Main app with duty badge
│   │   ├── components/
│   │   │   └── SupervisorLoginWithContext.jsx  # ✅ Login with duty
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # ✅ Auth with duty support
│   │   └── services/
│   │       └── backend-auth-service.js  # ✅ API client
│   └── dist/                      # Build output for production
│
└── LOCAL_DEVELOPMENT_GUIDE.md    # This file
```

## 🎯 Day-by-Day Plan

### Day 1 (Today)
- ✅ Get local environment running
- ✅ Test duty system locally
- 🔨 Implement shift warning notification
- 🧪 Test notification triggers

### Day 2
- 🔨 Add duty to activity feed
- 🔨 Style duty badges in feed
- 🧪 Test feed filtering

### Day 3
- 🔨 Add duty filtering to dashboards
- 🔨 Create duty statistics view
- 🧪 Test filtering across all dashboards

### Day 4
- 🔨 Build end shift UI
- 🔨 Add confirmation dialog
- 🧪 Test complete shift lifecycle

### Day 5
- 🔨 Create shift history page
- 🔨 Add export functionality
- 🧪 Full end-to-end testing
- 🚀 Deploy to production

## 💡 Tips for Productive Development

1. **Use two terminals**: Backend in one, frontend in other
2. **Keep DBeaver open**: Monitor database changes in real-time
3. **Use browser DevTools**: Console and Network tabs are your friends
4. **Git commit frequently**: Commit working features as you go
5. **Test before deploying**: Always test locally before uploading to production

## 📞 Need Help?

If you run into issues:
1. Check backend logs: `pm2 logs` or terminal output
2. Check frontend console: F12 → Console
3. Check database: Run queries in DBeaver
4. Review this guide for common issues

Good luck with your 5-day build sprint! 🚀
