BARRY - Bus Alerts and Roadworks Reporting for You

OVERVIEW
========

BARRY is a complete traffic intelligence platform designed for Go North East bus operations. The system provides real-time traffic monitoring, roadworks alerts, and route impact analysis to support operational decision-making and passenger information services.

The platform consists of a React Native mobile application and a Node.js backend API that integrates multiple traffic data sources including Street Manager, National Highways, HERE Traffic API, and MapQuest.

PROJECT STRUCTURE
=================

Go_BARRY/                     React Native mobile application
├── app/(tabs)/              Tab navigation screens
│   ├── _layout.jsx         Tab configuration
│   ├── home.jsx            Welcome screen
│   ├── alerts.jsx          Traffic alerts list
│   ├── dashboard.jsx       Traffic overview
│   ├── settings.jsx        App preferences
│   └── about.jsx           App information
├── components/              Reusable UI components
│   ├── AlertList.jsx       Traffic alerts display
│   ├── Dashboard.jsx       Overview dashboard
│   ├── TrafficCard.jsx     Individual alert cards
│   └── hooks/              Custom React hooks
├── constants/               App configuration
├── assets/                  Images and icons
└── services/               API integration services

backend/                      Node.js API server
├── data/                    JSON data storage
├── fetchers/                Data source integrations
├── index.js                 Main server file
└── package.json            Backend dependencies

DisplayScreen/               Control room dashboard
└── control-room-live.html  Browser-based display

FEATURES
========

Mobile Application:
- Five-tab navigation interface
- Real-time traffic alerts display
- Interactive dashboard with key metrics
- Dark theme optimized for operations
- Route impact analysis for Go North East services
- Professional UI suitable for control room use

Backend API:
- Street Manager integration via AWS SNS webhooks
- National Highways DATEX II API connectivity
- HERE Traffic API for real-time congestion data
- MapQuest Traffic API for detailed incident information
- GTFS route mapping for bus service impact analysis
- Multi-source data validation and deduplication
- RESTful API endpoints for frontend consumption

Control Room Display:
- Large format dashboard for wall-mounted displays
- Real-time traffic overview
- Critical alert highlighting
- Designed for 1920x1080 resolution

DATA SOURCES
============

Street Manager:
- Local authority roadworks notifications
- Street works permits and schedules
- Traffic management plans
- AWS SNS webhook integration

National Highways:
- Major road incidents and closures
- Planned maintenance schedules
- Strategic road network disruptions
- DATEX II standard compliance

HERE Traffic API:
- Real-time traffic flow data
- Congestion level analysis
- Lane-level precision information
- Historical traffic patterns

MapQuest Traffic API:
- Detailed incident descriptions
- Construction event information
- Traffic delay estimates
- Alternative route suggestions

INSTALLATION
============

Mobile Application:
1. Navigate to Go_BARRY directory
2. Run: npm install
3. Run: npx expo run:ios (for iOS)
4. Run: npx expo run:android (for Android)

Backend Server:
1. Navigate to backend directory
2. Run: npm install
3. Configure environment variables in .env file (see below)
4. Run: node index.js

Environment Configuration:
==========================

Create backend/.env file with the following configuration:

# Server Configuration
PORT=3001
NODE_ENV=development

# National Highways API Keys
NATIONAL_HIGHWAYS_API_KEY=622f1fc448714ca59bd1e6f0ffc8580c
NATIONAL_HIGHWAYS_API_PRIMARY_KEY=622f1fc448714ca59bd1e6f0ffc8580c
NATIONAL_HIGHWAYS_API_SECONDARY_KEY=9328175a500c44df89846cf97cca4d7d

# Supabase Configuration
SUPABASE_URL=https://haountnghecfrsoniubq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MTM0MTAsImV4cCI6MjA0ODIxMzQxMH0.WJxIiwicm9sZUimFub241LCJpYXQiOjE3MzM2MTM0NDksImV4cCI6MjA0ODIxMzQxMH0.xtjxeGkxG3cx67IypI4XxEp

# TomTom API
TOMTOM_API_KEY=p1RBk8dOAhAuipgt7zxplRBro4V5rmyh

# HERE Traffic API
HERE_API_KEY=kw-aCK-LeVViMkZh9C_bK-Km-GjUtv_303waROHLL5Q

# MapQuest API
MAPQUEST_API_KEY=OeLAVWPNlgnBjW66iam0yiD5kEecJIoN

# API URLs
NATIONAL_HIGHWAYS_API_URL=https://api.data.nationalhighways.co.uk/roads/v2.0/closures

# Logging Level
LOG_LEVEL=info

# CORS Settings
CORS_ORIGIN=http://localhost:8081
RENDER_BACKEND_URL=https://barry-backend.onrender.com

⚠️ SECURITY WARNING: These are live API keys. Do not commit this file to public repositories.

API ENDPOINTS
=============

GET /api/alerts
Returns unified traffic alerts from all sources

GET /api/traffic
Returns live traffic congestion data

GET /api/streetworks
Returns Street Manager roadworks data

GET /api/roadworks
Returns National Highways closure data

GET /api/health
Returns system status and data source health

GET /api/refresh
Forces refresh of all data sources

POST /api/streetmanager/webhook
Receives Street Manager AWS SNS notifications

TECHNICAL SPECIFICATIONS
========================

Frontend Technologies:
- React Native 0.73+
- Expo Router for navigation
- Expo Vector Icons
- React Native Safe Area Context
- TypeScript support

Backend Technologies:
- Node.js 18+
- Express.js web framework
- Axios for HTTP requests
- XML2JS for DATEX II parsing
- Fast XML Parser for performance
- CORS support for cross-origin requests

Mobile App Requirements:
- iOS 13.0+ or Android 6.0+
- Internet connectivity for live data
- Approximately 50MB storage space

Server Requirements:
- Node.js 18 or higher
- 512MB RAM minimum
- Internet connectivity for API access
- HTTPS support recommended for production

GO NORTH EAST INTEGRATION
=========================

Route Mapping:
The system includes comprehensive mapping of Go North East bus routes to road networks, enabling automatic impact analysis when traffic incidents occur.

GTFS Integration:
Static GTFS data processing provides route definitions, stop locations, and service patterns for accurate disruption assessment.

Operational Benefits:
- Automatic route impact notifications
- Proactive passenger information updates
- Diversion planning support
- Performance monitoring capabilities

Control Room Integration:
- Large display dashboard for operations centers
- Real-time alert monitoring
- Critical incident escalation
- Historical data analysis

DEPLOYMENT
==========

Development Environment:
- Frontend: Expo development server
- Backend: Local Node.js server on port 3001
- Database: JSON file storage for development

Production Environment:
- Frontend: Expo compiled application or web deployment
- Backend: Cloud hosting (Render, Heroku, AWS)
- Database: Persistent cloud storage recommended
- HTTPS: Required for production API endpoints

Monitoring:
- API health checks available at /api/health
- Error logging to console and files
- Request/response tracking for debugging

USAGE GUIDELINES
===============

For Control Room Staff:
1. Open BARRY mobile app or web dashboard
2. Monitor alerts tab for live traffic incidents
3. Check dashboard for system overview
4. Review route impacts for operational planning
5. Use refresh function for latest data updates

For Field Supervisors:
1. Use mobile app for on-the-go traffic monitoring
2. Check specific route impacts before deployment
3. Monitor incident duration and estimated clearance
4. Coordinate with control room using shared data view

For System Administrators:
1. Monitor API health endpoints regularly
2. Check data source connectivity status
3. Review error logs for integration issues
4. Maintain API key validity and quotas
5. Update route mappings as services change

TROUBLESHOOTING
==============

Common Issues:

Network Request Failed:
- Check internet connectivity
- Verify API endpoints are accessible
- Confirm API keys are valid and not expired
- Check CORS configuration for web deployments

Invalid Icon Names:
- Ensure all lucide-react-native imports are replaced with Expo Vector Icons
- Use valid Ionicons names only
- Check component imports are correct

Build Errors:
- Clear Metro bundler cache: npx expo start --clear
- Reinstall dependencies: rm -rf node_modules && npm install
- Check for syntax errors in JSX files
- Verify all imports are available

Data Not Loading:
- Check backend server is running
- Verify API endpoints return valid JSON
- Check network connectivity between frontend and backend
- Review API key quotas and rate limits

SUPPORT AND MAINTENANCE
======================

Regular Maintenance Tasks:
- Monitor API key usage and quotas
- Update traffic data source configurations
- Review and update route mappings
- Test mobile app compatibility with OS updates
- Backup configuration and historical data

Performance Optimization:
- Implement data caching strategies
- Monitor API response times
- Optimize mobile app bundle size
- Consider CDN for static assets
- Database indexing for large datasets

Security Considerations:
- Rotate API keys regularly
- Use HTTPS for all API communications
- Implement request rate limiting
- Validate all input data
- Monitor for unusual usage patterns

CONTACT INFORMATION
==================

Project Lead: Anthony Gair
Organization: Go North East
Purpose: Internal traffic monitoring and operations support

For technical support or feature requests, refer to the project repository issues section or contact the development team directly.

VERSION HISTORY
==============

Version 3.0 - Current Release
- React Native mobile application
- Complete backend API integration
- Multi-source traffic data aggregation
- Professional control room interface
- Go North East route impact analysis

This documentation represents the current state of the BARRY traffic intelligence platform as of the latest release.