# Go Barry Admin Dashboard

## Overview
The Go Barry Admin Dashboard is a comprehensive system administration interface built with React Native (Expo) featuring a modern dark theme and real-time data synchronization.

## Access
- **URL**: `/admin` 
- **Required**: Admin privileges (AG003 or BP009)
- **Navigation**: Click "Admin Panel" in the supervisor dashboard sidebar

## Features

### 🎯 Dashboard Cards
- **System Overview** - Real-time health monitoring, service status, RAM usage
- **Intelligence Dashboard** - ML predictions, disruption analysis, route impacts
- **Roadworks Manager** - CRUD operations, filtering, supervisor actions
- **Supervisor Management** - User management, permissions, activity tracking
- **Activity Audit Trail** - Complete audit logs with filtering and export
- **Alert Analytics** - Performance metrics, trends, supervisor rankings
- **API Usage** - Rate limits, costs, service breakdown
- **Live Map** - Real-time traffic view with TomTom integration

### 🎨 Design
- Dark theme throughout (#0a0a0f background, #14141f surfaces)
- Accent colors matched to each admin section
- Responsive design for desktop and tablet
- Loading states and error handling

### ⚡ Performance
- 10-second auto-refresh on critical pages
- Pull-to-refresh on all lists
- Optimized for <2GB RAM backend
- Real-time updates via Convex

### 🔐 Security
- Admin-only access with session validation
- Full audit trail of all actions
- Protected routes with auth checks
- Supervisor action tracking

## Technical Details

### File Structure
```
/app/admin/
├── index.jsx              # Main dashboard with cards
├── system-overview.jsx    # Service health monitoring
├── intelligence.jsx       # ML analytics dashboard
├── roadworks.jsx         # Roadworks management
├── supervisors.jsx       # User management
├── audit.jsx            # Activity logs
├── analytics.jsx        # Alert analytics
├── api-usage.jsx        # API monitoring
├── live-map.jsx         # Real-time map
├── _layout.jsx          # Admin layout wrapper
├── styles/
│   └── darkTheme.js     # Theme constants
└── components/          # Reusable components
```

### Navigation
- File-based routing with Expo Router
- Protected routes requiring admin auth
- Back navigation to supervisor dashboard
- Keyboard shortcuts (documented in UI)

### Data Sources
- Backend API: `https://go-barry.onrender.com`
- Real-time sync: Convex
- WebSocket: Supervisor sync (when available)

## Deployment
1. Test all routes locally
2. Verify auth flow
3. Push to staging branch
4. Run smoke tests
5. Deploy to production
6. Monitor error logs

## Maintenance
- Old admin components backed up in `components/admin/_backup_old_admin/`
- Migration plan documented in `MIGRATION_PLAN.md`
- Dark theme constants in `styles/darkTheme.js`
- Reusable components in `components/`

## Support
For issues or questions:
- Check the Training & Help system
- Review MIGRATION_PLAN.md
- Contact the development team

---
© 2024-2025 Anthony Gair. All rights reserved.
