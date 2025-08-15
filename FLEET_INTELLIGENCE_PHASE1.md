# Fleet Intelligence - Phase 1 Implementation
**Date**: January 2025
**Location**: Go_BARRY/public/fleet-intelligence.html

## 🚀 Quick Access

Access the Fleet Intelligence dashboard at:
- **Local**: http://localhost:3001/public/fleet-intelligence.html
- **Production**: https://go-barry.onrender.com/public/fleet-intelligence.html

## ✅ Phase 1 Features Implemented

### 1. **Vehicle Health Scores** ❤️
- Real-time health scoring (0-100) for every vehicle in the fleet
- Color-coded status indicators:
  - 🟢 **Green** (70-100): Healthy vehicles with 0-1 breakdowns
  - 🟡 **Amber** (50-69): Warning status with 2-3 breakdowns
  - 🔴 **Red** (0-49): Critical vehicles with 4+ breakdowns
- Based on 30-day breakdown history
- Considers breakdown recency and severity

### 2. **Top 10 Problem Vehicles** 🚨
- Ranked list of vehicles with most breakdowns
- Shows breakdown count for last 30 days
- Displays vehicle details (make, model, depot)
- Quick identification of vehicles needing attention

### 3. **Cost Counter** 💰
- Real-time breakdown cost tracking for today
- Breakdown of costs by category:
  - **Lost Revenue**: Based on service delays (£8.50/minute)
  - **Engineering Costs**: Callout and hourly rates
  - **Replacement Vehicles**: Hourly replacement costs
  - **Total Impact**: Combined financial impact
- Animated counters for visual impact
- Updates every 30 seconds

## 📊 API Endpoints

The Fleet Intelligence system uses these API endpoints:

### Core Endpoints (Live)
- `GET /api/breakdowns/today` - Today's breakdown data
- `GET /api/fleet-database/all` - Complete fleet inventory

### Fleet Intelligence API (New)
- `GET /api/fleet-intelligence/health-scores` - Vehicle health scores
- `GET /api/fleet-intelligence/cost-analysis` - Breakdown cost analysis
- `GET /api/fleet-intelligence/problem-vehicles` - Top problem vehicles
- `GET /api/fleet-intelligence/predictions` - Breakdown predictions
- `GET /api/fleet-intelligence/depot-comparison` - Depot performance

## 🔧 Technical Details

### Frontend Features
- **Auto-refresh**: Updates every 30 seconds with countdown timer
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Filter Options**: Filter vehicles by health status
- **Mock Data Fallback**: Shows sample data if API is unavailable
- **Smooth Animations**: Cost counters animate when updating

### Cost Calculation Logic
```javascript
// Cost Configuration
REVENUE_LOSS_PER_MINUTE: £8.50
ENGINEERING_CALLOUT_BASE: £150
REPLACEMENT_VEHICLE_HOURLY: £45

// Example Calculation
30-minute delay = £255 lost revenue
Engineering callout = £150
2-hour replacement = £90
Total Impact = £495
```

### Health Score Algorithm
```javascript
Base Score: 100
Per Breakdown Deductions:
- Recent (< 7 days): -10 to -20 points
- Medium (7-14 days): -5 to -10 points
- Older (14-30 days): -2 to -5 points
Severity Multipliers:
- High severity: 2x deduction
- Medium severity: 1.5x deduction
- Low severity: 1x deduction
```

## 🎯 How to Use

### For Supervisors
1. **Monitor Health Scores**: Check vehicle health at start of shift
2. **Identify Problem Vehicles**: Focus on red/amber status vehicles
3. **Track Costs**: See real-time financial impact of breakdowns
4. **Take Action**: Schedule preventive maintenance for at-risk vehicles

### For Management
1. **Cost Tracking**: Monitor daily breakdown costs
2. **Fleet Health**: Overall fleet reliability metrics
3. **Resource Allocation**: Identify vehicles needing replacement
4. **Depot Comparison**: Compare breakdown rates across depots

## 📈 Next Steps (Phase 2)

### Coming Soon
1. **Pattern Detection**: "5 Volvos with steering issues this week"
2. **Depot Comparison**: Breakdown rates by depot
3. **Maintenance Suggestions**: AI-powered preventive recommendations

### Phase 3 (Q2 2025)
1. **AI Predictions**: Machine learning failure predictions
2. **Route Analysis**: Breakdown correlation with routes
3. **ROI Calculator**: Repair vs replace decisions

## 🚨 Deployment Instructions

### Backend Deployment
```bash
cd backend
git add routes/fleetIntelligenceAPI.js index.js
git commit -m "Add Fleet Intelligence API for health scores and cost tracking"
git push
# Auto-deploys on Render.com
```

### Frontend Access
The frontend is already deployed as a static file at:
`/Go_BARRY/public/fleet-intelligence.html`

No additional deployment needed - just access the URL!

## 📝 Testing Checklist

- [ ] Health scores display correctly (0-100)
- [ ] Color coding works (green/amber/red)
- [ ] Top 10 problem vehicles shown
- [ ] Cost counter updates with real data
- [ ] Auto-refresh every 30 seconds
- [ ] Filters work (All/Critical/Warning/Healthy)
- [ ] Mobile responsive design
- [ ] Mock data displays if API fails

## 🔍 Troubleshooting

### No Data Showing?
1. Check API is running: https://go-barry.onrender.com/api/health
2. Check browser console for errors (F12)
3. Ensure CORS is configured for your domain
4. Mock data should appear as fallback

### Costs Not Updating?
1. Verify breakdowns exist for today
2. Check `/api/breakdowns/today` endpoint
3. Cost calculations require breakdown timestamps

### Health Scores Incorrect?
1. Scores based on last 30 days data
2. Check `/api/fleet-intelligence/health-scores`
3. Verify breakdown data in database

## 💡 Tips

1. **Best Time to Check**: Start of each shift for proactive management
2. **Focus Areas**: Vehicles with score < 50 need immediate attention
3. **Cost Awareness**: Share daily costs with drivers to encourage care
4. **Pattern Recognition**: Look for similar vehicles with issues
5. **Preventive Action**: Schedule maintenance for amber status vehicles

## 📞 Support

For issues or enhancements:
- Technical: Check browser console and API endpoints
- Feature Requests: Note what additional metrics would help
- Bug Reports: Include browser, time, and screenshot

---

**Status**: ✅ Phase 1 Complete and Deployed
**Next Review**: February 2025 for Phase 2 implementation
