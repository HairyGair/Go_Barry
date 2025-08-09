# Phase 1 Implementation Guide - Fleet Breakdown Analytics

## ✅ What's Been Done

### 1. **Backend API Created & Registered**
- Created comprehensive API at `/backend/routes/breakdownAnalyticsAPI.js`
- Registered in backend at `/api/breakdown-analytics`
- Endpoints ready:
  - `POST /api/breakdown-analytics/events` - Record breakdowns
  - `GET /api/breakdown-analytics/overview` - Dashboard stats
  - `GET /api/breakdown-analytics/vehicle-reliability` - Vehicle performance
  - `GET /api/breakdown-analytics/depot-patterns` - Pattern analysis
  - `GET /api/breakdown-analytics/pattern-alerts` - Active alerts

### 2. **Database Schema Ready**
- Complete schema at `/backend/database/breakdown_analytics_schema.sql`
- Tables: fleet_vehicles, breakdown_events, pattern_alerts, etc.
- Automated pattern detection triggers

### 3. **Dashboard Deployed**
- Analytics dashboard at `/Go_BARRY/public/breakdown-analytics/index.html`
- Real-time data visualization
- Pattern alerts display
- Vehicle reliability tracking

### 4. **GO BARRY Integration**
- Analytics integration script loaded
- App.js updated to send breakdown data
- Automatic pattern checking

## 📋 Next Steps You Need to Do

### Step 1: Create Database Tables
```bash
# First, run the setup script to check your database
cd backend
npm install  # If you haven't already
node scripts/setup-breakdown-analytics.js
```

The script will tell you if tables exist. If not, you need to:

1. Copy the contents of `/backend/database/breakdown_analytics_schema.sql`
2. Go to your Supabase dashboard: https://app.supabase.com/
3. Click on "SQL Editor" 
4. Paste the SQL and run it
5. Run the setup script again to verify

### Step 2: Add Sample Fleet Data (Optional)
```bash
# Add sample vehicles and breakdown data
node scripts/setup-breakdown-analytics.js --sample-data
```

### Step 3: Update Fleet Numbers (Important!)
The system detects depot from fleet numbers. Current mapping:
- 6000-6499 → Washington
- 5000-5499 → Consett  
- 4000-4499 → Hexham
- 3000-3499 → Riverside
- 700-799 → Hexham (Solos)

If your fleet numbering is different, update:
- `/backend/routes/breakdownAnalyticsAPI.js` (line ~450)
- `/Go_BARRY/public/breakdown-guide/components/common/breakdownAnalytics.js` (line ~60)

### Step 4: Test the System
1. **Test the API:**
   ```bash
   # Test API is working
   curl http://localhost:3001/api/breakdown-analytics/overview
   ```

2. **Test GO BARRY Integration:**
   - Open GO BARRY: http://localhost:3000/breakdown-guide
   - Complete a test wizard (e.g., Brakes)
   - Enter fleet number: 6301
   - Check browser console for "Breakdown recorded successfully"

3. **View Dashboard:**
   - Open: http://localhost:3000/breakdown-analytics
   - Should show your test breakdown

### Step 5: Import Real Fleet Data
If you have the GNE_Fleet_Master.xlsx file:

```javascript
// Create a simple import script
const xlsx = require('xlsx');
const supabase = require('./services/supabaseService');

async function importFleet() {
  const workbook = xlsx.readFile('GNE_Fleet_Master.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  for (const vehicle of data) {
    await supabase.insert('fleet_vehicles', {
      fleet_number: vehicle['Fleet Number'],
      registration: vehicle['Registration'],
      vehicle_type: vehicle['Type'],
      depot: vehicle['Depot'],
      // Map other fields...
    });
  }
}
```

## 🚀 Production Deployment

### For Render.com:
1. Ensure environment variables are set
2. The API will be available at: https://go-barry.onrender.com/api/breakdown-analytics
3. Dashboard at: https://go-barry.onrender.com/breakdown-analytics

### Update API URLs:
In `/Go_BARRY/public/breakdown-guide/components/common/breakdownAnalytics.js`:
```javascript
API_URL: window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api/breakdown-analytics'
  : 'https://go-barry.onrender.com/api/breakdown-analytics',
```

## 📊 What You'll See

### Pattern Alerts:
- "8 Cooling System failures at Consett in 7 days"
- "Vehicle 5481 has 5 breakdowns in 30 days"
- "Electrical issues up 300% at Washington"

### Dashboard Features:
- Total breakdowns with week-over-week change
- Vehicles affected count
- Safety critical incidents
- Breakdown categories pie chart
- Depot comparison bar chart
- Vehicle reliability table

### Automatic Features:
- Pattern detection runs after each breakdown
- Critical patterns (5+ same issues) trigger alerts
- Offline storage if API is down
- Auto-sync when connection restored

## 🔧 Troubleshooting

### "Tables not found" error:
- Run the SQL schema in Supabase dashboard
- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

### No data showing in dashboard:
- Check browser console for errors
- Verify API is running: http://localhost:3001/api/breakdown-analytics/overview
- Check CORS if on different ports

### Breakdowns not recording:
- Ensure fleet number is entered in wizard
- Check browser console for errors
- Verify breakdownAnalytics.js is loaded

## 📈 Phase 2 Preview

Once Phase 1 is working, Phase 2 will add:
- Email alerts for critical patterns
- Weekly/monthly trend reports
- Predictive maintenance suggestions
- Cost tracking per breakdown
- Integration with maintenance schedules

## Questions?

The system is designed to be operational-focused. It tracks:
- Which vehicles break down most
- What fails most often
- Which depots have specific issues
- When patterns emerge

This helps operations make decisions about:
- Vehicle allocation
- Preventive maintenance priorities
- Depot-specific interventions
- Fleet replacement planning