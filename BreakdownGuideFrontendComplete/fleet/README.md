# Fleet Intelligence Dashboard

## 📍 Location
**URL**: https://breakdowns.gobarry.co.uk/fleet/

## 🎯 Purpose
Real-time fleet health monitoring and breakdown cost analytics for Go North East's entire vehicle fleet.

## ✅ Features

### 1. **Vehicle Health Scores**
- 0-100 scoring system for every vehicle
- Color-coded status:
  - 🟢 Green (70-100): Healthy
  - 🟡 Amber (50-69): Warning
  - 🔴 Red (0-49): Critical
- Based on 30-day breakdown history

### 2. **Today's Breakdown Costs**
- **Total Impact**: Combined financial loss
- **Lost Revenue**: £8.50 per minute of delays
- **Engineering**: Callout and repair costs
- **Replacements**: Vehicle substitution costs
- Animated counters update in real-time

### 3. **Top 10 Problem Vehicles**
- Ranked by breakdown frequency
- Shows vehicle details and depot
- Quick identification of maintenance priorities

## 🔄 Real-Time Features
- Auto-refresh every 30 seconds
- Countdown timer shows next update
- Live data from breakdown tracking system
- Fallback to mock data if API unavailable

## 🔗 Navigation
The dashboard includes navigation links to:
- Home (`/`)
- Breakdown Guide (`/breakdown-guide/`)
- Dashboard (`/dashboard/`)
- Fleet Intelligence (`/fleet/`) - Current page
- Analytics (`/analytics/`)
- Reports (`/reports/`)

## 📊 API Integration
Connects to Fleet Intelligence API endpoints:
- `/api/fleet-intelligence/health-scores`
- `/api/fleet-intelligence/cost-analysis`
- `/api/fleet-intelligence/problem-vehicles`

Fallback endpoints if primary API fails:
- `/api/breakdowns/today`
- `/api/fleet-database/all`

## 🎨 UI Features
- Responsive design for all devices
- Filter buttons: All, Critical, Warning, Healthy
- Hover effects on vehicle cards
- Pulsing animation for critical vehicles
- Progress bar for refresh countdown

## 💡 Usage Tips

### For Supervisors
1. Check fleet health at shift start
2. Focus on red status vehicles first
3. Monitor cost impact throughout the day
4. Schedule maintenance for amber vehicles

### For Management
1. Track daily breakdown costs
2. Identify vehicles for replacement
3. Compare depot performance
4. Justify maintenance investments

## 🚀 Quick Actions

### Filter Critical Vehicles
Click "Critical" button to see only red status vehicles

### View Vehicle Details
Hover over any vehicle card for expanded information

### Track Costs
Watch the animated counters for real-time cost updates

## 📱 Mobile Access
Fully responsive design works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔧 Technical Details

### File Location
`/BreakdownGuideFrontendComplete/fleet/index.html`

### Dependencies
- No external libraries required
- Pure HTML/CSS/JavaScript
- API endpoints from go-barry.onrender.com

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🐛 Troubleshooting

### No Data Loading?
1. Check API status: https://go-barry.onrender.com/api/health
2. Open browser console (F12) for errors
3. Mock data should appear as fallback

### Costs Not Updating?
- Requires breakdowns logged today
- Check `/api/breakdowns/today` endpoint

### Incorrect Health Scores?
- Based on last 30 days of data
- Updates every 30 seconds

## 📈 Future Enhancements

### Phase 2 (Coming Soon)
- Pattern detection alerts
- Depot comparison tables
- Maintenance recommendations

### Phase 3 (Q2 2025)
- AI predictions
- Route analysis
- ROI calculator

## 📞 Support
For issues or questions, check:
- Browser console for errors
- API health endpoint
- Network tab in DevTools

---

**Last Updated**: January 2025
**Version**: 1.0.0
