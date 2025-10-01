# 🚨 ETA Request Pop-up System
## Real-time Communication Between SDC and Engineering

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-ready_to_deploy-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## 📋 Overview

The **ETA Request Pop-up System** creates instant, real-time communication between the Service Delivery Centre (SDC) and Engineering teams when vehicle breakdowns occur. When SDC requests an ETA, engineering receives an immediate pop-up notification with full breakdown details, enabling rapid response and better passenger communication.

## ✨ Key Features

### For SDC Operators
- **One-Click ETA Requests** - Request engineer arrival time with urgency levels
- **Live ETA Tracking** - See engineer responses in real-time
- **Countdown Timers** - Visual indicators showing time remaining
- **Escalation Alerts** - Automatic urgency increases for delayed responses

### For Engineering Team
- **Instant Pop-up Notifications** - Never miss an ETA request
- **Quick Response Options** - Pre-set time buttons (10m, 15m, 30m, etc.)
- **Urgency Indicators** - Visual and audio alerts based on priority
- **Pending Request Dashboard** - See all active requests at a glance

### System Features
- **WebSocket Real-time Updates** - Instant bi-directional communication
- **Auto-Escalation** - Normal→Urgent (10min), Urgent→Critical (20min)
- **Sound Alerts** - Different tones for urgency levels
- **Browser Tab Flashing** - Visual notification when not in focus
- **Complete Audit Trail** - All requests and responses logged
- **Performance Metrics** - Track response times and patterns

## 🏗️ Architecture

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│  SDC Dashboard  │◄──────────────────────────►│   Node.js API    │
│                 │         Real-time           │  + Socket.IO     │
└─────────────────┘                            └──────────────────┘
                                                         │
┌─────────────────┐         WebSocket                   │
│   Engineering   │◄────────────────────────────────────┘
│   Dashboard     │         Real-time                   │
└─────────────────┘                                     ▼
                                                ┌──────────────────┐
                                                │    Supabase      │
                                                │    Database      │
                                                └──────────────────┘
```

## 📁 File Structure

```
eta-popup-implementation/
├── 1-database-migration.sql       # Database schema and tables
├── 2-backend-api.js               # API endpoints and WebSocket logic
├── 3-engineering-dashboard.html   # Engineering pop-up interface
├── 4-sdc-dashboard-enhancement.html # SDC request interface
├── 5-server-integration.js       # Main server setup
├── DEPLOYMENT-GUIDE.md           # Step-by-step deployment
├── test-eta-system.sh            # Automated testing script
├── package.json                  # Node.js dependencies
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Supabase account with database access
- Access to Go BARRY backend

### Installation

1. **Clone/Copy files to your backend directory**
```bash
cp -r eta-popup-implementation/* /path/to/backend/
```

2. **Install dependencies**
```bash
npm install
```

3. **Run database migration**
- Open Supabase SQL Editor
- Execute `1-database-migration.sql`

4. **Configure environment**
```bash
echo "SUPABASE_URL=your_url_here" >> .env
echo "SUPABASE_ANON_KEY=your_key_here" >> .env
```

5. **Start the server**
```bash
npm run dev
```

6. **Deploy frontend files**
```bash
cp 3-engineering-dashboard.html /public/
cp 4-sdc-dashboard-enhancement.html /public/
```

7. **Test the system**
```bash
bash test-eta-system.sh
```

## 🎮 Usage

### SDC Operator Workflow
1. Click "Request ETA" on any active breakdown
2. Select urgency level:
   - **Normal** - Standard breakdown
   - **Urgent** - Priority route or blocking traffic
   - **Critical** - Safety issue or dangerous location
3. Add optional notes
4. Submit request
5. Monitor for engineer response

### Engineering Workflow
1. Receive pop-up notification with sound alert
2. Review breakdown details
3. Select or enter estimated arrival time
4. Add optional notes (traffic, parts needed, etc.)
5. Submit ETA
6. SDC automatically notified

## ⚙️ Configuration

### Urgency Escalation Rules
```javascript
// Configurable in backend
const ESCALATION_RULES = {
    normal_to_urgent: 10,    // minutes
    urgent_to_critical: 20   // minutes
};
```

### Sound Settings
Users can toggle sound alerts on/off individually. Settings persist in browser localStorage.

### WebSocket Rooms
- `engineering` - All engineering staff
- `sdc` - All SDC operators
- `depot-{id}` - Specific depot channels (future enhancement)

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/breakdowns/:id/request-eta` | SDC requests ETA |
| POST | `/api/breakdowns/:id/provide-eta` | Engineer provides ETA |
| GET | `/api/eta-requests/pending` | Get all pending requests |
| GET | `/api/eta-requests/stats` | Get statistics |
| POST | `/api/eta-requests/escalate` | Trigger escalation check |
| POST | `/api/eta-requests/:id/cancel` | Cancel a request |

## 🧪 Testing

Run the automated test suite:
```bash
bash test-eta-system.sh
```

Manual testing checklist:
- [ ] Create test breakdown
- [ ] Request ETA from SDC
- [ ] Verify pop-up appears in Engineering
- [ ] Submit ETA response
- [ ] Verify SDC receives update
- [ ] Test urgency escalation
- [ ] Test sound alerts
- [ ] Test multiple concurrent requests

## 📈 Performance Metrics

### Target KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time | < 2 minutes | Median time to provide ETA |
| Response Rate | > 90% | % of requests receiving ETA |
| System Uptime | 99.9% | Monthly availability |
| Escalation Rate | < 10% | % requiring escalation |

### SQL Queries for Monitoring
```sql
-- Average response time by engineer
SELECT 
    responded_by,
    AVG(EXTRACT(EPOCH FROM (responded_at - requested_at))/60) as avg_minutes
FROM eta_requests
WHERE status = 'responded'
GROUP BY responded_by;

-- Requests by urgency level
SELECT 
    urgency_level,
    COUNT(*) as count
FROM eta_requests
WHERE requested_at > NOW() - INTERVAL '24 hours'
GROUP BY urgency_level;
```

## 🐛 Troubleshooting

### Pop-up Not Appearing
1. Check browser console for WebSocket errors
2. Verify engineering dashboard is open
3. Ensure popups are not blocked
4. Check sound permissions

### WebSocket Connection Issues
1. Verify CORS settings in server
2. Check firewall rules
3. Ensure Socket.IO client version matches server

### Database Errors
1. Run migration script again
2. Check Supabase connection string
3. Verify table permissions

## 🔒 Security

- All communications encrypted via HTTPS/WSS
- Badge number validation
- Role-based access control
- Audit logging of all actions
- No sensitive data in WebSocket messages

## 🤝 Contributing

To add features or fix bugs:
1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📞 Support

### Technical Issues
- Backend/API: Development Team
- Database: Database Administrator
- Frontend: UI/UX Team

### Training
- SDC Training: Operations Manager
- Engineering Training: Engineering Manager

## 📜 License

MIT License - See LICENSE file for details

## 🎉 Acknowledgments

Built for **Go North East** to improve breakdown response times and enhance communication between Service Delivery Centre and Engineering teams.

---

## 🚦 Deployment Status

| Component | Status | URL/Location |
|-----------|--------|--------------|
| Database Migration | 🔴 Pending | Supabase SQL Editor |
| Backend API | 🔴 Pending | `/backend/routes/` |
| Engineering Dashboard | 🔴 Pending | `/public/engineering-eta-dashboard.html` |
| SDC Dashboard | 🔴 Pending | `/public/enhanced-breakdown-dashboard.html` |
| WebSocket Server | 🔴 Pending | Port 3001 |

**Next Step**: Run database migration to begin deployment

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Ready for Production Deployment