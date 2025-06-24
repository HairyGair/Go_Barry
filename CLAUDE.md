# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Go BARRY (Bus Alerts and Roadworks Reporting for You) is a real-time traffic intelligence platform for Go North East bus operations. It helps supervisors manage traffic disruptions affecting 231 bus routes across Newcastle, Gateshead, Sunderland, Durham, North Tyneside, and Northumberland.

**Scale**: 9 active supervisors, 231+ bus routes, 6+ integrated data sources

## Architecture

### Frontend: React Native with Expo
- **Location**: `/Go_BARRY/`
- **Framework**: React Native 0.79.3 + Expo 53.0.10
- **Navigation**: Expo Router (file-based in `app/` directory)
- **Primary Platform**: Web (mobile-ready)
- **Real-time**: Convex integration (not WebSocket)

### Backend: Node.js with Express
- **Location**: `/backend/`
- **Runtime**: Node.js 18+ with Express.js
- **Database**: Supabase (PostgreSQL) + local JSON files in `/backend/data/`
- **Hosting**: Render.com (2GB RAM limit - critical constraint)
- **Module System**: ES6 imports only (`type: "module"`)

## Essential Development Commands

### Quick Start
```bash
npm run dev:full          # Start both frontend and backend
npm run dev:browser       # Frontend web development only
npm run dev:backend       # Backend development only
```

### Frontend (Go_BARRY/)
```bash
npm start                 # Start Expo web development
npm run web               # Alternative web start
npm run build:web         # Export for web deployment
npm run build:cpanel      # Build for cPanel hosting
npm run ios               # iOS simulator
npm run android           # Android simulator
```

### Backend
```bash
npm run dev               # Development with nodemon
npm start                 # Production start (memory optimized)
npm run test              # Run API tests
```

### Testing
```bash
npm test                  # Run Playwright E2E tests (root level)
```

## Critical Code Patterns

### React Native Constraints
- **No localStorage**: Use React state only (except supervisor sessions)
- **Platform checks**: Use `Platform.OS === 'web'` for web-specific features
- **Web fallbacks**: Many RN modules need web alternatives in `components/`

### Backend Memory Management
- **2GB RAM limit**: Always optimize for memory usage
- **JSON file loading**: Load data files on-demand, not at startup
- **Request processing**: Batch operations where possible

### Module System
```javascript
// ✅ Correct - ES6 imports
import express from 'express';
import { readFileSync } from 'fs';

// ❌ Wrong - CommonJS not supported
const express = require('express');
```

## Key Integrations

### Working Data Sources
- **Street Manager**: Webhook integration for roadworks
- **National Highways**: M1, A1(M) incident data
- **TomTom**: Real-time traffic flow data
- **HERE**: Route matching and geocoding

### Authentication
- **Supervisor Login**: Badge-based (9 real supervisors: AG003, BP009, etc.)
- **Admin Access**: Only AG003 and BP009 have admin privileges
- **Sessions**: Stored in backend memory, sync via Convex

### Real-time Sync
- **Convex**: Primary real-time data sync (replaces WebSocket)
- **Endpoint**: Supervisor state sync every 30 seconds
- **Fallback**: Manual refresh if sync fails

## Database Structure

### Supabase Tables
- **supervisors**: Authentication and state
- **alerts**: Traffic incidents and roadworks
- **routes**: GTFS route data

### Local JSON Files (`/backend/data/`)
- **routes.json**: Bus route geometries
- **stops.json**: Bus stop locations  
- **supervisor_sessions.json**: Active sessions

## File Structure Highlights

```
Go_BARRY/
├── app/(tabs)/           # Main navigation screens
├── components/           # Reusable UI components
├── hooks/               # Custom React hooks
└── utils/               # Helper functions

backend/
├── index.js             # Main server entry
├── services/            # Data source integrations
├── data/               # JSON data files
└── routes/             # API endpoint definitions
```

## Known Issues & Workarounds

### Current Problems
- **MapQuest API**: Authentication broken, affects geocoding
- **Elgin/SCOOT**: Integration incomplete
- **Memory leaks**: Monitor backend memory usage in production

### Common Fixes
- **CORS**: Already configured for gobarry.co.uk - don't modify
- **Convex sync**: Check `/api/supervisor-state` if real-time breaks
- **Route matching**: 80-90% accuracy is expected, not perfect

## Development Guidelines

### Before Making Changes
1. **Read GO_BARRY_AI_CONTEXT.txt** - contains critical project context
2. **Check memory impact** - backend has 2GB limit
3. **Test on web first** - primary platform
4. **Verify supervisor workflow** - affects real operations

### Testing Real Scenarios
- **Use actual supervisor badges**: AG003, BP009, etc.
- **Test with live data sources**: Street Manager webhooks active
- **Monitor backend logs**: Memory and performance issues

### Deployment
- **Backend**: Auto-deploys via Render.com
- **Frontend**: Can deploy to cPanel or Render
- **Environment**: Check `.env` files for API keys

## Important Files to Read First

1. **GO_BARRY_AI_CONTEXT.txt** - Essential project context
2. **Go_BARRY/Readme.txt** - Comprehensive technical docs
3. **backend/DEPLOYMENT_CHECKLIST.md** - Production deployment guide
4. **backend/index.js** - Main server architecture
5. **Go_BARRY/app/(tabs)/index.js** - Frontend entry point