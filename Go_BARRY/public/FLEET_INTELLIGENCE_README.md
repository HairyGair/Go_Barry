# Fleet Intelligence System - Phase 1
**Go North East - Predictive Fleet Management**

## 🚀 Overview

The Fleet Intelligence system provides real-time vehicle health monitoring, problem detection, and cost analysis for Go North East's 900+ vehicle fleet. This Phase 1 implementation delivers three key quick wins:

1. **Vehicle Health Scores** - Traffic light system showing vehicle condition
2. **Top 10 Problem Vehicles** - Identifies vehicles needing immediate attention  
3. **Cost Counter** - Real-time breakdown cost tracking

## 📁 Files Created

### 1. `fleet-intelligence.html`
**Location**: `/Go_BARRY/public/fleet-intelligence.html`

Standalone dashboard that can be accessed immediately for testing:
- **URL**: `https://gobarry.co.uk/fleet-intelligence.html`
- **Features**:
  - Live vehicle health scores with color coding
  - Problem vehicle rankings
  - Real-time cost counter
  - Auto-refresh every 30 seconds
  - Responsive design for mobile/tablet

### 2. `fleet-intelligence-service.js`
**Location**: `/Go_BARRY/public/fleet-intelligence-service.js`

Modular service class for integration into main application:
- Sophisticated health score calculations
- Pattern detection algorithms
- Cost analysis with multiple factors
- Prediction engine (for future phases)
- Recommendation system

## 🎯 Key Features

### Vehicle Health Scoring

Each vehicle gets a health score from 0-100:
- **95-100** (Green): Excellent - No issues
- **85-94** (Blue): Good - Minor issues only
- **70-84** (Amber): Fair - Needs attention
- **50-69** (Orange): Poor - Priority maintenance
- **0-49** (Red): Critical - Immediate action needed

Score calculation factors:
- Number of breakdowns (30-day window)
- Severity of breakdowns (RED/AMBER/GREEN)
- Recency (last 7 days weighted higher)
- Repeat breakdowns (extra penalty)
- Trend analysis (improving/worsening)

### Problem Vehicle Detection

Identifies vehicles with:
- Highest breakdown frequency
- Most critical failures
- Repeat issues
- Excessive downtime
- Pattern of similar failures

Displays:
- Ranking (1-10)
- Total breakdowns
- This week's count
- Critical incident count

### Cost Analysis

Real-time calculation of breakdown costs:

**Base Factors**:
- Lost Revenue: £8.50/minute
- Replacement Vehicle: £150/hour
- Engineering Callout: £250 base + £85/hour
- Parts & Materials: £120 average

**Multipliers**:
- Peak Hours (7-9am, 4-6pm): 1.5x
- Weekend Engineering: 1.5x
- Priority Routes (X10, X21): 2.0x
- Repeat Breakdowns: 1.3x

## 🔧 Integration Guide

### Quick Test (Standalone)

1. **Open the dashboard directly**:
   ```
   https://gobarry.co.uk/fleet-intelligence.html
   ```

2. **Check console for activity**:
   ```javascript
   // Press F12, go to Console tab
   // You should see:
   "🚀 Fleet Intelligence Dashboard initialized"
   "📊 Loading fleet intelligence data..."
   ```

### Integration into Main App

1. **Import the service**:
   ```javascript
   import FleetIntelligenceService from './fleet-intelligence-service.js';
   
   const fleetIntel = new FleetIntelligenceService();
   ```

2. **Get all intelligence data**:
   ```javascript
   const intelligence = await fleetIntel.getFleetIntelligence();
   
   // Returns:
   {
     healthScores: [...],      // All vehicles with scores
     problemVehicles: [...],    // Top problem vehicles
     costs: {...},              // Detailed cost breakdown
     statistics: {...},         // Fleet statistics
     predictions: [...],        // Failure predictions
     recommendations: [...]     // Action recommendations
   }
   ```

3. **Get specific data**:
   ```javascript
   // Just health scores
   const history = await fleetIntel.getBreakdownHistory(30);
   const scores = fleetIntel.calculateHealthScores(history);
   
   // Just problem vehicles
   const problems = fleetIntel.identifyProblemVehicles(history);
   
   // Just costs
   const todayBreakdowns = await fleetIntel.fetchWithCache('breakdowns/today');
   const liveBreakdowns = await fleetIntel.fetchWithCache('breakdowns/live');
   const costs = fleetIntel.calculateDetailedCosts(todayBreakdowns, liveBreakdowns);
   ```

### Add to Existing Dashboard

```html
<!-- Add to your existing dashboard -->
<div id="fleetIntelligenceWidget"></div>

<script src="/fleet-intelligence-service.js"></script>
<script>
  const fleetService = new FleetIntelligenceService();
  
  async function updateFleetIntelligence() {
    const data = await fleetService.getFleetIntelligence();
    
    // Update your UI
    document.getElementById('fleetIntelligenceWidget').innerHTML = `
      <div class="health-summary">
        ${data.healthScores.slice(0, 5).map(v => 
          `<div class="vehicle-health">
            Fleet ${v.fleet}: ${v.score} (${v.status})
          </div>`
        ).join('')}
      </div>
    `;
  }
  
  // Update every 30 seconds
  setInterval(updateFleetIntelligence, 30000);
  updateFleetIntelligence();
</script>
```

## 📊 API Endpoints Used

The system connects to these existing endpoints:

- `GET /api/breakdowns/today` - Today's breakdown list
- `GET /api/breakdowns/live` - Currently active breakdowns
- `GET /api/breakdowns/fleet/:number/history` - Vehicle history (future)

## 🎨 Customization

### Adjust Cost Factors

Edit the cost factors in `fleet-intelligence-service.js`:

```javascript
this.costFactors = {
    lostRevenuePerMinute: 8.50,       // Your actual revenue/minute
    replacementVehiclePerHour: 150,    // Your replacement cost
    engineeringCalloutBase: 250,       // Your callout fee
    engineeringPerHour: 85,            // Your hourly rate
    averagePartsPerBreakdown: 120,     // Your average parts cost
    peakHourMultiplier: 1.5,          // Your peak multiplier
    weekendCalloutMultiplier: 1.5,     // Your weekend rate
    priorityRouteMultiplier: 2.0,      // Priority route impact
    repeatBreakdownMultiplier: 1.3     // Repeat issue penalty
};
```

### Adjust Health Thresholds

```javascript
this.healthThresholds = {
    excellent: 95,  // Adjust for stricter/looser scoring
    good: 85,
    fair: 70,
    poor: 50,
    critical: 0
};
```

### Add Priority Routes

```javascript
this.priorityRoutes = ['X10', 'X21', 'X30', 'X31', 'Q3', '21', '56'];
// Add your high-priority routes
```

## 🚦 Visual Indicators

### Health Status Colors
- 🟢 **Green** (#10b981): Excellent health (95-100)
- 🔵 **Blue** (#3b82f6): Good health (85-94)
- 🟡 **Amber** (#f59e0b): Fair health (70-84)
- 🟠 **Orange** (#ef4444): Poor health (50-69)
- 🔴 **Red** (#991b1b): Critical (0-49)

### Animations
- **Pulse**: Critical vehicles pulse to draw attention
- **Hover Effects**: Interactive elements respond on hover
- **Live Indicator**: Shows real-time data status

## 📈 Future Enhancements (Phase 2 & 3)

### Phase 2 (Next Month)
- Pattern detection alerts
- Depot performance comparison  
- Maintenance recommendations
- Historical trending graphs
- Export reports to PDF

### Phase 3 (Q2 2025)
- AI-powered failure prediction
- Route correlation analysis
- ROI calculator for repairs
- Integration with TracerIt
- Mobile app version

## 🔍 Troubleshooting

### Data Not Loading?
1. Check browser console for errors (F12)
2. Verify API is accessible: `https://go-barry.onrender.com/api/health`
3. Check CORS settings if on different domain

### Costs Seem Wrong?
1. Review cost factors in service
2. Check if peak hours are detected correctly
3. Verify route classifications

### Health Scores Unexpected?
1. Check 30-day breakdown history
2. Review scoring algorithm weights
3. Verify severity classifications

## 📞 Support

For issues or enhancements:
- **Technical**: Anthony Gair (Fleet Intelligence System)
- **Operational**: Engineering Director
- **Data Quality**: Breakdown tracking team

## 🎯 Success Metrics

Track these KPIs to measure success:

1. **Breakdown Reduction**: Target 20% reduction in repeat failures
2. **Cost Savings**: Target £50k/month through preventive maintenance
3. **Response Time**: Identify problems 3 days earlier on average
4. **Fleet Availability**: Increase from 94% to 96%

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Ready for Testing
