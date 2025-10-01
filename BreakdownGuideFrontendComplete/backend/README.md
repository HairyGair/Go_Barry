# Go North East Breakdown Backend Service

A dedicated backend service for the Go North East Breakdown Tracking System, providing real-time breakdown management, fleet analytics, and supervisor coordination.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 🚀 Features

### Core Functionality
- **Sequential Breakdown IDs**: Automatic generation (BD-2025-00001 format)
- **Location Tracking**: GPS coordinates, What3Words, verified locations
- **Real-time Dashboard**: Live breakdown status with 5-second updates
- **Pattern Detection**: Identifies repeat breakdowns (3+ in 7 days)
- **Auto-escalation**: Flags breakdowns over 30 minutes
- **Priority Routes**: Special handling for X10, X21, and other critical services

### Analytics & Reporting
- **Depot KPIs**: Performance metrics by depot
- **Fleet Health**: Vehicle reliability scores
- **Supervisor Performance**: Response time and decision tracking
- **Geographic Hotspots**: Breakdown clustering analysis
- **Cost Analysis**: Financial impact tracking

### Fleet Management
- **541 Vehicles**: Complete GNE fleet database
- **6 Depots**: Washington, Riverside, Percy Main, Consett, Deptford, Hexham
- **9 Supervisors**: Authenticated access with JWT tokens
- **Admin Tools**: AG003 and BP009 have elevated permissions

## 📊 API Endpoints

### Breakdown Tracking
```
POST   /api/breakdowns/start         - Start new breakdown
PUT    /api/breakdowns/location/:id  - Update location
POST   /api/breakdowns/step          - Log wizard step
POST   /api/breakdowns/diagnose      - Record decision
PUT    /api/breakdowns/:id/resolve   - Clear breakdown
GET    /api/breakdowns/live          - Active breakdowns
GET    /api/breakdowns/stats         - Statistics
```

### Analytics
```
GET    /api/breakdown-analytics/depot-kpis     - Depot metrics
GET    /api/breakdown-analytics/patterns       - Pattern analysis
GET    /api/breakdown-analytics/fleet-health   - Fleet status
```

### Fleet Database
```
GET    /api/fleet-database/search?q=6301       - Search vehicles
GET    /api/fleet-database/vehicle/:number     - Vehicle details
GET    /api/fleet-database/depot/:depot        - Depot vehicles
```

### Authentication
```
POST   /api/supervisor/login    - Supervisor login
POST   /api/supervisor/verify   - Verify session
GET    /api/supervisor/state    - Current state
```

## 🔧 Installation

### Local Development
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/gne-breakdown-backend.git
cd gne-breakdown-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Start the server
npm run dev
```

### Production Deployment (Render)
1. Click the "Deploy to Render" button above
2. Connect your GitHub account
3. Configure environment variables
4. Deploy!

## 🔐 Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-frontend.com

# Configuration
SUPERVISOR_BADGES=AW001,AC002,AG003,CF004,DH005,JD006,JP007,SG008,BP009
ADMIN_BADGES=AG003,BP009
PRIORITY_ROUTES=X10,X21,307,1
```

## 📡 Integration

### Frontend Connection
```javascript
// In your frontend application
const BACKEND_URL = 'https://your-service.onrender.com';

// Start a breakdown
fetch(`${BACKEND_URL}/api/breakdowns/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fleet_number: '6301',
    supervisor_badge: 'AG003',
    location: 'Newcastle Central Station',
    wizard_type: 'engine_fault'
  })
});
```

### Dashboard Integration
The service provides real-time data for:
- SDC Operations Dashboard
- Engineering Response Dashboard
- Management Overview Dashboard

## 📈 Status Progression

Breakdowns move through these statuses:
1. `received` - Initial report logged
2. `acknowledged` - SDC has acknowledged
3. `decision` - STOP/AMBER/CONTINUE decided
4. `dispatched` - Engineer sent (if needed)
5. `on_site` - Engineer arrived
6. `moving` - Vehicle being recovered
7. `cleared` - Issue resolved

## 🗄️ Database Schema

The service uses PostgreSQL (via Supabase) with tables for:
- `breakdowns` - Main breakdown records
- `breakdown_events` - Status change log
- `priority_services` - Priority route definitions
- `breakdown_location_history` - Location updates

Run `/scripts/setup-database.sql` in Supabase to initialize.

## 🧪 Testing

```bash
# Run API tests
npm test

# Check health
curl https://your-service.onrender.com/api/health

# View documentation
open https://your-service.onrender.com/api-docs
```

## 📊 Performance

- **Memory**: Optimized for 2GB limit (Render free tier)
- **Response Time**: <100ms for most endpoints
- **Uptime**: 99.9% target SLA
- **Concurrent Users**: Handles 100+ simultaneous connections

## 🔒 Security

- JWT authentication for all supervisors
- Role-based access control (admin/supervisor)
- Input validation on all endpoints
- SQL injection protection via parameterized queries
- Rate limiting on authentication endpoints

## 📝 License

Copyright (c) 2025 Anthony Gair. All rights reserved.

Proprietary software for Go North East internal use only.

## 🤝 Support

For issues or questions:
- Internal: Contact Anthony Gair
- Email: anthony@gobarry.co.uk
- Documentation: `/api-docs` endpoint

---

Built with ❤️ for Go North East by Anthony Gair
