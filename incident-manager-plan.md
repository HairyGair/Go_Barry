# 🚨 Go BARRY Incident Manager - Implementation Plan
**Created**: January 2025  
**Purpose**: Enable supervisors to quickly create, track, and manage traffic incidents affecting Go North East bus services
**Language**: UK English throughout
**Status**: Phase 3 COMPLETE ✅

## 📋 Core Requirements

### 1. Incident Sources
- **Manual Creation**: Supervisors create incidents from observations/driver reports ✅
  - Implemented via `CreateIncidentModal.jsx` with tabbed interface
  - Map click or postcode entry for location selection
  - Route auto-detection with confidence percentages
  - Smart templates for common incident types
- **API Integration**: Pull incidents from TomTom and National Highways ✅
  - Backend uses `tomtom.js` and `nationalHighways.js` services
  - Auto-refresh every 2 minutes when enabled
  - Adaptive refresh rates based on incident activity
  - Traffic incidents shown with "LIVE" indicator
- **Display Integration**: Show on Control Room Display ✅
  - Push to Display button on each incident
  - Real-time sync via Convex
  - Incidents appear on map with 🚨 icons
  - Incident count shown in display header

### 2. Quick Create Flow ✅ IMPLEMENTED
```
[Create Button] → [Map/Postcode Tab] → [Click Location] → [Routes Auto-Detect] → [Add Details] → [Create] → [Action Reminders]
```

### Quick Actions Toolbar ✅ IMPLEMENTED
- **Recent Locations**: Dropdown showing last 10 locations with timestamps
- **My Routes**: Quick filter by supervisor's common routes
- **Copy Last**: Duplicate previous incident with current time
- **Bulk Update**: Select multiple incidents with checkboxes for mass updates

### 3. Incident Lifecycle ✅
- **Created** → Saved to database with initial status
- **Active** → Visible on all displays and reports
- **Resolved** → Marked complete with resolution time
- **Exported** → Available for Disruption Database export
- 30-day retention for mileage analysis
- Auto-clear when traffic conditions improve

### 4. User Access ✅
- Service Delivery Supervisors (all 9) - Full access
- Service Delivery Controller (Barry) - Admin access
- Future: Depot Supervisors (read-only planned)

## 🎯 Key Features - ALL IMPLEMENTED ✅

### Map Interface ✅
- **Click to Create**: Interactive Leaflet map with click-to-place
- **Postcode Entry**: UK postcode search with geocoding
- **Auto-zoom**: Centres on incident location
- **Pin Display**: Incident type icons on map
- **Route Overlay**: Shows affected bus routes
- **UK Localisation**: Newcastle-centred, UK formats

### Route Selection ✅
- **Button Grid**: All 231 Go North East routes
- **Auto-detection**: GTFS matcher suggests routes with confidence %
- **Multi-select**: Select All/Clear All functionality
- **Visual Feedback**: Selected routes highlighted
- **Search**: Filter routes by number or name
- **Confidence Display**: Shows match percentage (e.g., "85%")

### Incident Types ✅
- 🚗 Road Traffic Collision (RTC)
- 🚧 Road Closure
- 🚑 Emergency Services
- 🌳 Obstruction
- 💧 Utilities
- 🚦 Traffic Lights
- ⚡ Power Lines
- 🌊 Flooding
- ❄️ Weather
- 🚌 Breakdown
- 🏗️ Roadworks
- 🎪 Events
- ➕ Other

### Smart Templates ✅
8 pre-configured templates with dynamic placeholders:
- RTC Template
- Road Closure
- Emergency Block
- Weather Conditions
- Planned Roadworks
- Event Traffic
- Breakdown
- General Disruption

### Message Distribution ✅
- **Auto-generate Messages** for:
  - Ticketer (driver alerts)
  - Passenger Cloud (customer info)
  - Email (detailed reports)
- **Copy Buttons**: One-click clipboard copy
- **Message History**: Saved with incident
- **UK English**: Proper spelling throughout

### Export & Reporting ✅
- **Excel Export**: All incidents with filters
- **Disruption Database**: Resolved incidents and diversions
- **Summary Sheets**: Statistics included
- **UK Formatting**: DD/MM/YYYY, 24-hour time

## 💻 Technical Implementation

### Frontend Components ✅
```
/components/operations/incidents-v2/
├── IncidentsManagerV2.jsx          # Main container ✅
├── components/
│   ├── CreateIncidentModal.jsx     # Creation flow ✅
│   ├── IncidentCard.jsx           # Display card ✅
│   ├── RouteSelector.jsx          # Route grid ✅
│   ├── MessageGenerator.jsx       # Messages ✅
│   ├── ActionRemindersModal.jsx   # Reminders ✅
│   ├── IncidentTemplates.jsx      # Templates ✅
│   ├── StatsCard.jsx              # Statistics ✅
│   ├── maps/
│   │   └── IncidentMapPicker.jsx  # Map interface ✅
│   └── toolbar/
│       ├── QuickActionsToolbar.jsx # Quick actions ✅
│       └── BulkUpdateModal.jsx     # Bulk update ✅
├── styles/
│   └── incidents.styles.js         # Styling ✅
└── utils/
    └── excelExport.js             # Export utility ✅
```

### Data Structure ✅
```javascript
{
  id: "INC-2025-001",
  type: "RTC",
  location: {
    lat: 54.9783,
    lng: -1.6178,
    postcode: "NE1 4ST",
    description: "Northumberland Street near Eldon Square"
  },
  affectedRoutes: ["1", "2", "38", "40"],
  routeConfidence: {"1": 95, "2": 88, "38": 92, "40": 85},
  description: "Multi-vehicle RTC blocking northbound lane",
  actionTaken: "Routes diverted via Clayton Street",
  createdBy: "AG003",
  createdAt: "2025-01-20T10:30:00Z",
  status: "active",
  messages: {
    drivers: "RTC Northumberland St. Divert via Clayton St.",
    customers: "Service 1,2,38,40 diverted due to accident",
    email: "Multi-vehicle collision on Northumberland Street..."
  },
  source: "manual",
  pushedToDisplay: true,
  coordinates: { lat: 54.9783, lng: -1.6178 }
}
```

### API Endpoints ✅
```
POST   /api/incidents                    # Create incident ✅
GET    /api/incidents                    # List all active ✅
GET    /api/incidents/:id               # Get specific ✅
PUT    /api/incidents/:id               # Update incident ✅
PUT    /api/incidents/:id/resolve       # Mark resolved ✅
GET    /api/incidents/traffic-incidents # Get traffic alerts ✅
POST   /api/incidents/:id/messages      # Generate messages ✅
GET    /api/incidents/export            # Export to Excel ✅
POST   /api/display/push-incident       # Push to display ✅
```

### Real-time Integration ✅
- **Convex**: Real-time sync for display integration
- **Adaptive Polling**: 15-60 second refresh based on activity
- **WebSocket**: Planned for Phase 4

## 🚀 Implementation Status

### ✅ Phase 1 - Core (COMPLETED)
- [x] Basic incident creation with tabbed interface
- [x] Map click functionality with Leaflet
- [x] Postcode search with geocoding
- [x] Route selection grid (231 routes)
- [x] Auto-detection with confidence levels
- [x] Database integration
- [x] UK English localisation

### ✅ Phase 2 - Integration (COMPLETED)
- [x] TomTom/Highways API integration
- [x] Traffic alerts with live indicators
- [x] Control Room Display push
- [x] Message generation for all platforms
- [x] Smart templates implementation
- [x] Promote traffic alert to manual
- [x] Adaptive refresh rates
- [x] GNE route filtering

### ✅ Phase 3 - Enhancement (COMPLETED - January 2025)
- [x] Smart templates with placeholders
- [x] Postcode lookup in map picker
- [x] Action reminders workflow
- [x] Quick Actions Toolbar:
  - [x] Recent Locations dropdown
  - [x] My Routes filters
  - [x] Copy Last incident
  - [x] Bulk Update modal
- [x] Excel export functionality:
  - [x] Export all/filtered incidents
  - [x] Disruption Database export
  - [x] Summary statistics
  - [x] UK date/time formatting

### 📅 Phase 4 - Advanced Features (PLANNED)
- [ ] **WebSocket Real-time Updates**:
  - [ ] Connect to `/ws/supervisor-sync`
  - [ ] Handle incident events
  - [ ] Connection status indicator
  - [ ] Auto-reconnection
  - [ ] Polling fallback
- [ ] **External Incident Adoption**:
  - [ ] "Adopt" button for traffic incidents
  - [ ] Convert to manual incident
  - [ ] Preserve original data
  - [ ] Link relationships
- [ ] **Analytics Dashboard**:
  - [ ] Daily/weekly/monthly stats
  - [ ] Route impact analysis
  - [ ] Incident heatmap
  - [ ] Resolution time metrics
  - [ ] Peak time analysis
- [ ] **Smart Alerting**:
  - [ ] Depot proximity alerts
  - [ ] Long duration warnings
  - [ ] Pattern detection
  - [ ] Recurring locations
- [ ] **Performance**:
  - [ ] Virtual scrolling
  - [ ] WebWorker for GTFS
  - [ ] IndexedDB offline queue
  - [ ] Map clustering

## 🌐 UK English Language Standards ✅

### Spelling Conventions
- **-ise endings**: centralise, organise, prioritise ✅
- **-our endings**: colour, behaviour, favour ✅
- **-re endings**: centre, metre, theatre ✅
- **Double consonants**: modelling, cancelled ✅
- **-ogue endings**: catalogue, dialogue ✅

### Terminology
- **Lorry** (not truck) ✅
- **Pavement** (not sidewalk) ✅
- **Carriageway** (not roadway) ✅
- **Junction** (not intersection) ✅
- **Diversion** (not detour) ✅
- **Queue** (not line) ✅

### Date/Time Formats
- **Date**: DD/MM/YYYY ✅
- **Time**: 24-hour format ✅
- **Timezone**: GMT/BST ✅

## 📊 Current System Capabilities

### Performance Metrics
- **Incident Creation**: <10 seconds from click to save
- **Route Detection**: 80-90% accuracy
- **Traffic Updates**: 2-minute refresh cycle
- **Export Speed**: <5 seconds for 100 incidents
- **Display Sync**: Real-time via Convex

### Usage Statistics (as of January 2025)
- **Components Built**: 15+ React components
- **API Endpoints**: 10+ RESTful endpoints
- **Routes Supported**: All 231 Go North East routes
- **Message Templates**: 8 pre-configured
- **Export Formats**: Excel with summary sheets

### Integration Points
- **Backend**: Node.js + Express
- **Database**: Supabase + local JSON
- **Real-time**: Convex for display sync
- **Maps**: Leaflet with TomTom tiles
- **Geocoding**: TomTom Search API
- **Traffic Data**: TomTom + National Highways
- **Export**: xlsx library for Excel

## 🔧 Recent Updates (January 2025)

### Phase 3 Completion
- **Quick Actions Toolbar**: Efficiency tools for supervisors
- **Bulk Operations**: Update multiple incidents at once
- **Excel Export**: Full reporting with UK formatting
- **Selection System**: Checkbox selection for bulk actions
- **Performance**: Optimised for 2GB memory limit

### Bug Fixes
- Fixed duplicate state variables
- Added missing handlePromoteToIncident
- Improved checkbox styling
- Enhanced error handling

### Known Issues
- WebSocket connection not yet implemented
- Map clustering needed for many incidents
- Offline queue not yet available

## 📝 Notes for Developers

### Key Decisions
- No severity levels - supervisors assess impact
- No countdown timers - situations too variable
- Messages are copy/paste, not auto-send
- 30-day retention for analysis
- Must work without Convex if limits reached
- Resolved incidents visible until midnight

### Best Practices
- Always use UK English spelling
- Test with 2GB memory limit
- Handle offline scenarios gracefully
- Validate all user inputs
- Log all supervisor actions

### Future Considerations
- Depot supervisor read-only access
- Driver app integration
- Predictive incident detection
- Multi-language for tourists
- Historical pattern analysis

## ✅ Project Success Metrics

### Achieved
- ✅ Quick incident creation (<30 seconds)
- ✅ Accurate route detection (80-90%)
- ✅ Real-time display updates
- ✅ Platform-specific messaging
- ✅ Full audit trail
- ✅ UK English throughout
- ✅ Export capabilities
- ✅ Traffic data integration

### Phase 4 Goals
- [ ] <5 second incident sync
- [ ] Pattern detection accuracy >70%
- [ ] Offline capability
- [ ] Analytics dashboard
- [ ] Automated depot alerts