# SDC Operations Dashboard Integration Guide
## Complete Setup Instructions

---

## 🎯 Overview

The SDC Operations Dashboard is now fully integrated with the Go North East Breakdown Guide system. This dashboard provides real-time visibility of all breakdown assessments, supervisor activity, and depot performance metrics.

---

## 🚀 Quick Start

### Access the Dashboard

1. **Primary URL**: `https://yourdomain.com/sdc-operations-dashboard.html`
2. **Alternative**: Navigate from Go BARRY main menu → SDC Operations

### Features Available

- **Live Breakdown Tracking**: Real-time view of all active breakdowns
- **Supervisor Activity**: Monitor which supervisors are handling assessments
- **Depot Performance**: KPIs and metrics for all 6 depots
- **Priority Alerts**: Automatic flagging of STOP decisions and priority routes
- **Response Times**: Track Receipt → Acknowledge → Decision → Clear times
- **Integration**: Automatic sync with Breakdown Guide assessments

---

## 📡 Data Flow

### How Data Flows from Breakdown Guide to SDC Dashboard

```
Breakdown Guide Assessment
         ↓
supervisorBreakdownLogger.js
         ↓
sdc-dashboard-connector.js
         ↓
Backend API (go-barry.onrender.com)
         ↓
SDC Operations Dashboard
```

### Real-Time Updates

1. **Assessment Started**: Immediately appears on dashboard
2. **Decision Made**: Updates severity color (STOP/AMBER/CONTINUE)
3. **Status Changes**: Tracked through lifecycle (Received → Cleared)
4. **Location Updates**: GPS coordinates converted to addresses
5. **Engineer Dispatch**: Automatic status updates

---

## 🔧 Technical Integration

### API Endpoints Used

```javascript
// Primary endpoints the dashboard connects to:
GET  /api/breakdowns/live           // Active breakdowns
GET  /api/breakdown-analytics/supervisor-performance
GET  /api/breakdown-analytics/depot-performance
POST /api/breakdowns/dashboard-update
```

### Automatic Features

1. **Auto-Refresh**: Dashboard updates every 5 seconds
2. **Alert System**: Critical breakdowns trigger visual alerts
3. **Priority Detection**: Routes X10, X21, 307, 1 automatically flagged
4. **Pattern Detection**: Repeat breakdowns highlighted
5. **SLA Monitoring**: Color-coded response time warnings

---

## 📊 Dashboard Sections

### 1. Header Statistics
- **Active Breakdowns**: Total count of unresolved breakdowns
- **STOP/AMBER/CONTINUE**: Severity breakdown counts
- **Average Response Time**: Rolling average
- **Engineers Dispatched**: Active engineering callouts
- **Cleared Today**: Completed resolutions
- **Priority Routes**: High-priority service disruptions

### 2. Active Breakdowns
Real-time cards showing:
- Fleet number and route
- Issue type and location
- Supervisor handling
- Time elapsed
- Current status

**Color Coding**:
- 🔴 Red border = STOP decision
- 🟡 Yellow border = AMBER decision
- 🟢 Green border = CONTINUE decision
- ⭐ Highlighted = Priority route

### 3. Supervisor Activity
Grid showing all 9 supervisors:
- Active/Available status
- Current assessments count
- Today's total assessments
- Average response time

**Status Indicators**:
- 🟢 Green = Active (handling breakdowns)
- ⚪ Gray = Available
- 🟡 Yellow highlight = In assessment

### 4. Depot Performance
Metrics for each depot:
- Active breakdowns count
- Today's total
- Average response time
- Cleared count

**Performance Colors**:
- Green = ≤5 min average response
- Yellow = 5-10 min average response
- Red = >10 min average response

---

## 🔔 Alert System

### Critical Alerts Trigger When:

1. **STOP Decision Made**: Immediate red alert banner
2. **Delayed Response**: >30 minutes without acknowledgment
3. **Priority Route Down**: X10, X21, 307, or 1 affected
4. **Multiple Failures**: Same vehicle with 3+ breakdowns in 7 days

### Alert Actions:
- Visual banner at top of dashboard
- Audio notification (if enabled)
- Email to management (configurable)
- SMS to on-call supervisor (optional)

---

## 📱 Mobile Access

The dashboard is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets (iPad, Android tablets)
- Smartphones (iOS, Android)

### Mobile Features:
- Touch-optimized controls
- Swipe to filter
- Condensed view for small screens
- Offline mode with sync

---

## 🔐 Security & Access Control

### Authentication Levels:

1. **Supervisors**: Full access to all features
2. **Management**: Read-only access plus reports
3. **Engineering**: View breakdowns and dispatch status
4. **Directors**: Full access plus configuration

### Security Features:
- Session timeout after 30 minutes
- Encrypted data transmission
- Audit logging of all actions
- Role-based permissions

---

## 📈 Reporting & Analytics

### Available Reports:

1. **Daily Summary**: Automated email at shift end
2. **Weekly Performance**: Depot and supervisor metrics
3. **Monthly Trends**: Pattern analysis and predictions
4. **DVSA Compliance**: One-click audit package

### Export Options:
- PDF reports
- Excel spreadsheets
- CSV data dumps
- API access for BI tools

---

## 🛠️ Troubleshooting

### Common Issues & Solutions:

**Dashboard Not Loading:**
- Check internet connection
- Clear browser cache
- Verify backend is running: https://go-barry.onrender.com/health

**No Data Showing:**
- Confirm supervisor is logged in
- Check API connectivity
- Verify time/date settings

**Updates Not Appearing:**
- Refresh page (Ctrl+F5)
- Check auto-refresh is enabled
- Verify WebSocket connection

**Performance Issues:**
- Reduce refresh interval
- Close other browser tabs
- Check network speed

---

## 🚨 Emergency Procedures

### If Dashboard Fails:

1. **Fallback Mode**: Use enhanced-breakdown-dashboard.html
2. **Manual Logging**: Record in Excel template
3. **Phone Coordination**: Call SDC directly
4. **Paper Forms**: Emergency assessment sheets in each depot

### Critical Contacts:
- **Technical Support**: [IT Help Desk]
- **Backend Issues**: [DevOps Team]
- **Escalation**: Operations Director

---

## 📋 Configuration Options

### Customize Settings in Dashboard:

```javascript
// Edit these values in sdc-operations-dashboard.html

const REFRESH_INTERVAL = 5000;  // Milliseconds (5 seconds default)
const PRIORITY_ROUTES = ['X10', 'X21', '307', '1'];
const BACKEND_URL = 'https://go-barry.onrender.com';
const ALERT_THRESHOLD = 30;  // Minutes before alert
```

### Environment Variables:
- `BACKEND_URL`: API endpoint location
- `CORS_ORIGIN`: Allowed origins for API
- `LOG_LEVEL`: Debug output verbosity

---

## 🎓 Training Resources

### For Supervisors:
1. Video walkthrough (10 minutes)
2. Quick reference card (printable)
3. Practice mode with test data

### For Management:
1. Dashboard interpretation guide
2. KPI definitions and targets
3. Report generation tutorial

### For IT Staff:
1. Technical architecture document
2. API documentation
3. Deployment procedures

---

## 📅 Maintenance Schedule

### Daily:
- Automated health checks
- Log rotation
- Cache clearing

### Weekly:
- Performance optimization
- Database cleanup
- Backup verification

### Monthly:
- Security updates
- Feature releases
- User feedback review

---

## ✅ Implementation Checklist

### Initial Setup:
- [ ] Dashboard URL bookmarked on all SDC computers
- [ ] All supervisors have login credentials
- [ ] Test breakdowns created and verified
- [ ] Alert email list configured
- [ ] Mobile devices tested

### Ongoing:
- [ ] Daily dashboard check at shift start
- [ ] Weekly performance review
- [ ] Monthly KPI assessment
- [ ] Quarterly training refresh

---

## 🔄 Integration Status

### ✅ Completed:
- SDC Operations Dashboard created
- Real-time data synchronization
- Supervisor activity tracking
- Depot performance metrics
- Alert system implementation
- Mobile responsive design
- API integration with Breakdown Guide

### 🔄 In Progress:
- Advanced analytics features
- Predictive breakdown alerts
- TracerIt integration
- Passenger Cloud notifications

### 📅 Planned:
- AI-powered insights
- Voice command interface
- Augmented reality view
- Cross-operator benchmarking

---

## 📞 Support

### Getting Help:
1. **Documentation**: This guide and inline help
2. **Training Videos**: Available on SharePoint
3. **IT Support**: Extension 1234
4. **Emergency**: Operations Director mobile

### Feedback:
- Feature requests: sdc-feedback@gonortheast.co.uk
- Bug reports: Use in-app reporting tool
- Suggestions: Monthly user group meetings

---

## 🎯 Success Metrics

### KPIs We're Tracking:
- **Dashboard Adoption**: Target 100% daily use
- **Response Time Improvement**: Target 25% reduction
- **Data Accuracy**: Target 99%+ correct entries
- **System Uptime**: Target 99.9% availability
- **User Satisfaction**: Target 4.5/5 rating

---

**Last Updated**: August 20, 2025
**Version**: 1.0.0
**Status**: LIVE - Fully Operational

---

*"Real-time visibility driving operational excellence"*

**Go North East - SDC Operations Dashboard**
