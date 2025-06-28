# Go Barry - Traffic Intelligence Platform

## Overview
Go Barry is a real-time traffic intelligence platform designed specifically for Go North East bus operations. It provides supervisors and control room staff with live traffic alerts, route disruption monitoring, and incident management capabilities across the North East region.

## Features
- 🚦 **Real-time Traffic Monitoring** - Live updates from TomTom, National Highways, and StreetManager
- 🚌 **Route Impact Analysis** - Automatic detection of affected bus routes using GTFS data
- 👥 **Supervisor Management** - Secure authentication and activity tracking
- 🗺️ **Interactive Maps** - Visual representation of traffic incidents and roadworks
- 📊 **Control Room Display** - 24/7 monitoring screen with automatic alert cycling
- 🔔 **Smart Notifications** - Email alerts for critical disruptions
- 🛠️ **Incident Management** - Create and track manual incidents
- 📱 **Mobile Responsive** - Works on desktop, tablet, and mobile devices

## Technology Stack
- **Frontend**: React Native Web (Expo)
- **Backend**: Node.js + Express
- **Database**: Supabase + Local JSON storage
- **Real-time**: Convex + WebSockets
- **APIs**: TomTom Traffic, National Highways, StreetManager
- **Hosting**: Render.com (Backend), GitHub Pages (Frontend)

## Access Points
- **Production**: https://www.gobarry.co.uk
- **Control Room Display**: https://www.gobarry.co.uk/display
- **Supervisor Interface**: https://www.gobarry.co.uk/browser-main
- **Backend API**: https://go-barry.onrender.com

## System Requirements
- Modern web browser (Chrome, Edge, Firefox, Safari)
- Internet connection
- 1920x1080 resolution or higher (recommended for control room)

## Security
- Badge-based supervisor authentication
- 10-hour session timeout for full shift coverage
- Audit trail for all supervisor actions
- Secure password management
- Admin-only access to system management

---

## Copyright and License

© 2024-2025 Anthony Gair. All rights reserved.

This software is proprietary and confidential. All rights reserved. No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of Anthony Gair.

**Contact**: anthonygair@icloud.com

### Third-Party Licenses
This software includes third-party libraries and services:
- TomTom Maps API - Subject to TomTom terms of service
- National Highways API - UK Open Government License
- React Native - MIT License
- Express.js - MIT License
- Other dependencies - See package.json files for full list

### Disclaimer
This software is provided "as is" without warranty of any kind. The author shall not be liable for any damages arising from the use of this software.
