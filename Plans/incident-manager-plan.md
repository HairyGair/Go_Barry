## 🌐 UK English Language Standards

### Spelling Conventions
The following UK English spellings must be used throughout:
- **-ise endings**: centralise, organise, prioritise (not -ize)
- **-our endings**: colour, behaviour, favour (not -or)
- **-re endings**: centre, metre, theatre (not -er)
- **Double consonants**: modelling, cancelled, travelled
- **-ogue endings**: catalogue, dialogue (not -og)

### Terminology
- **Lorry** (not truck) for HGV incidents
- **Pavement** (not sidewalk)
- **Carriageway** (not roadway)
- **Junction** (not intersection)
- **Diversion** (not detour)
- **Queue** (not line) for traffic
- **Torch** (not flashlight) if needed

### Date/Time Formats
- **Date**: DD/MM/YYYY (20/01/2025)
- **Time**: 24-hour format (14:30, not 2:30 PM)
- **Timezone**: GMT/BST

### UI Text Examples
- "The incident has been centralised in the system"
- "Select your favourite routes"
- "Customise the colour scheme"
- "Authorisation required"
- "Check licence status"# 🚨 Go BARRY Incident Manager - Implementation Plan
**Created**: January 2025  
**Purpose**: Enable supervisors to quickly create, track, and manage traffic incidents affecting Go North East bus services
**Language**: UK English throughout

## 📋 Core Requirements

### 1. Incident Sources
- **Manual Creation**: Supervisors create incidents from observations/driver reports  
  - Use `/components/operations/incidents/QuickCreateModal.jsx` to implement manual incident input.  
  - Store new incidents in Supabase using `POST /api/incidents`.  
  - Use `useState` to track form data; no localStorage.  
- **API Integration**: Pull incidents from TomTom and National Highways  
  - Backend uses `tomtom.js` and `nationalHighways.js` in `/backend/services/`.  
  - Poll every 2 minutes via a cron-style service in `backend/index.js`.  
  - New incidents stored in Supabase if not duplicate.  
  - Auto-clear logic in `backend/controllers/incidents.js`.  
- **Display**: Show as news alerts in both Incident Manager and Control Room Display  
  - Connect to `/ws/supervisor-sync` WebSocket.  
  - Send `newIncident` event with incident payload to update displays.  
  - Ensure `DisplayScreen.jsx` listens for this event.  

### 2. Quick Create Flow
### Implementation Details:
- [Big Create Button] lives in `EnhancedDashboard.jsx`.  
- Clicking launches `QuickCreateModal.jsx`.  
- Postcode geocoding uses HERE API from `/backend/services/here.js`.  
- Auto-detection of routes uses `/api/gtfs/match/enhanced`.  
- Creation posts to `/api/incidents`.  
- Live updates pushed via WebSocket to `/ws/supervisor-sync`.  

```
[Big Create Button] → [Click Map/Enter Postcode] → [Auto-detect Routes] → [Add Details] → [Create]
```

### Quick Actions Toolbar
- **Recent Locations**: One-click to create incident at frequent spots  
  - Store last 10 incident locations in `localStorage` (session only).  
  - Display as dropdown with location names and timestamps.  
  - Click to pre-fill location in QuickCreateModal.  
- **My Routes**: Supervisor's commonly managed routes for quick filter  
  - Track route selections per supervisor in Supabase.  
  - Show top 10 most-used routes as quick toggles.  
  - Implement in `RouteSelector.jsx` header.  
- **Copy Last**: Duplicate previous incident with new time  
  - Button in incident list to clone with current timestamp.  
  - Pre-fill all fields except time and status.  
  - Useful for recurring incidents.  
- **Bulk Update**: Select multiple incidents to update status together  
  - Checkbox selection in `IncidentList.jsx`.  
  - Bulk actions menu for status changes.  
  - Single API call with array of incident IDs.

### 3. Incident Lifecycle
- **Created** →  
  - Save to Supabase with `status: 'created'`.  
  - Created via POST `/api/incidents`.  
- **Active** →  
  - Change status with `PUT /api/incidents/:id`.  
  - Frontend: toggle using IncidentList.jsx controls.  
- **Resolved** →  
  - Call `PUT /api/incidents/:id/resolve`.  
  - System adds `resolvedAt` timestamp.  
  - Triggers reminder for Disruption Database export.  
- **Archived to Disruption Database** →  
  - Retain 30 days in Supabase via scheduled deletion job.  
  - Use Supabase function or manual cleanup script.  

- 30-day retention in database for mileage tracking  
- Auto-clear when traffic conditions improve  

### 4. User Access
- Service Delivery Supervisors (all 9)  
- Service Delivery Controller (Barry)  
- Future: Depot Supervisors (read access)  

## 🎯 Key Features

### Map Interface
- **Click to Create**: Click map location to create incident  
  - Use `IncidentMap.jsx` for map rendering and click event capture.  
  - Integrate Leaflet or Mapbox GL JS for map functionality.  
- **Postcode Entry**: Alternative quick entry method  
  - Use postcode lookup via HERE API backend service.  
  - Validate postcode format client-side before geocoding.  
- **Auto-zoom**: Control Room Display zooms to new incidents  
  - Implement zoom logic in `DisplayScreen.jsx` on receiving new incident event.  
- **Pin Display**: Similar to one.network style pins  
  - Use SVG icons styled per incident type.  
  - Pins rendered on map layer with hover tooltips.  
- **Route Overlay**: Show affected bus routes on map  
  - Fetch route shapes from GTFS data backend.  
  - Highlight selected routes dynamically.  
- **UK Localisation**: Map centred on Newcastle by default  
  - Use UK English in all map labels and tooltips  
  - Format postcodes with proper UK spacing  
  - Show confidence level (small % indicator) when auto-detected.  
  - Use opacity to indicate confidence (100% = full opacity, 70% = semi-transparent).  

### Route Selection
- **Button Grid**: All 231 routes as clickable number buttons  
  - Implement in `RouteSelector.jsx` with virtualized list for performance.  
  - Use react-window for efficient rendering of 231 buttons.  
  - Group by route type (single digit, X routes, etc.) for easier navigation.  
- **Auto-detection**: System suggests affected routes based on location  
  - Backend API `/api/gtfs/match/enhanced` uses geoqueries for route matching.  
  - Display confidence as small percentage (e.g., "85%" in corner of button).  
  - Pre-select routes with >70% confidence.  
- **Multi-select**: Select multiple affected routes quickly  
  - Use controlled checkboxes or toggle buttons with multi-select state.  
  - "Select All"/"Clear All" buttons for efficiency.  
  - Keyboard shortcuts (Shift+Click for range selection).  
- **Visual Feedback**: Highlight selected routes on map  
  - Sync selection state with map overlay in `IncidentMap.jsx`.  
  - Selected routes show in primary colour, suggested in secondary colour.  

### Incident Types
- 🚗 Road Traffic Collision (RTC)  
- 🚧 Road Closure  
- 🚑 Emergency Services Blocking  
- 🌳 Obstruction (tree/debris)  
- 💧 Utilities (burst water main, gas leak)  
- 🚦 Traffic Light Failure  
- ⚡ Power Lines Down  
- 🌊 Flooding  
- ❄️ Weather Conditions  
- 🚌 Vehicle Breakdown  
- 🏗️ Unplanned Roadworks  
- 🎪 Event Traffic  
- ➕ Other (custom description)  

- Use icon components for each type in selection grid and map pins.  
- Store type as string enum in incident objects.  
- All labels and messages use UK English spelling (e.g., 'colour', 'centre', 'organisation').  

### Smart Templates
Pre-configured templates for common incidents:  
- **RTC Template**: "RTC at [location] affecting routes [X]. Police on scene."  
- **Road Closure**: "Road closed at [location]. Routes [X] diverted via [Y]."  
- **Emergency Block**: "Ambulance blocking at [location]. Routes [X] delayed."  

- Templates implemented in `IncidentTemplates.jsx`.  
- Allow insertion into description field with placeholders replaced dynamically.  
- Provide UI to select and preview templates.  

### Message Distribution Integration
- **Auto-generate Messages**: Create formatted messages for:  
  - Driver alerts (Ticketer format)  
    - Subject: "Diversion - [Location Name]" for diversions  
    - Subject: "Caution - [Location Name]" for delays  
    - Body includes routes affected and action required  
  - Customer information (Passenger Cloud format)  
    - Customer-friendly language  
    - Includes apology and alternative suggestions  
  - Email notifications (Outlook format)  
    - Detailed incident report with all context  
    - Professional format for depot managers  
- **Copy Buttons**: One-click copy for each platform  
- **Message History**: Track what was sent where  

- `MessageGenerator.jsx` handles generation logic.  
- Ticketer uses subject/body format (no character limit).  
- Email integration uses `/api/auth/microsoft/send`.  
- Passenger Cloud messages generated but must be manually copied.  
- Copy buttons call `navigator.clipboard.writeText()`.  
- Message history saved under `messages` in incident object.  
- Visual feedback ("Copied!") on successful copy.  
- Templates update based on incident type and action taken.  

## 💻 Technical Implementation

### Frontend Components
```
/components/operations/incidents/
├── IncidentManager.jsx          # Main container
├── IncidentMap.jsx             # Map with click-to-create
├── QuickCreateModal.jsx        # Fast incident creation
├── RouteSelector.jsx           # Route button grid
├── IncidentList.jsx           # Table view of incidents
├── IncidentTemplates.jsx      # Smart templates
└── MessageGenerator.jsx       # Platform-specific messages
```

- Use React functional components with hooks (`useState`, `useEffect`).  
- Centralise incident state in `IncidentManager.jsx`.  
- Use Context API or Redux for global state if needed.  
- Styling with CSS Modules or Styled Components.  
- All UI text uses UK English (e.g., 'Centralise', 'Colours', 'Favourites').  

### Data Structure
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
  routeConfidence: {"1": 95, "2": 88, "38": 92, "40": 85}, // Auto-detection confidence
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
  source: "manual", // or "tomtom", "highways"
  externalId: null, // for API-sourced incidents
  relatedIncidents: ["INC-2025-002"], // For linked incidents
  parentIncident: null, // For follow-up incidents
  impactRadius: 500, // meters, for proximity alerts
  requiresDisruptionDb: true, // Flag for database export
  dayEndRetention: true // Keep visible until midnight
}
```

- Use UUID or sequential IDs for incident identifiers.  
- Store timestamps in ISO 8601 UTC format.  
- Normalize route IDs as strings for consistency.  
- Messages stored as sub-objects keyed by platform.  

### API Endpoints
```
POST   /api/incidents                # Create incident
GET    /api/incidents                # List all active (with pagination)
GET    /api/incidents/:id           # Get specific incident
PUT    /api/incidents/:id           # Update incident
PUT    /api/incidents/:id/resolve   # Mark as resolved
GET    /api/incidents/external      # Get TomTom/Highways incidents
POST   /api/incidents/:id/messages  # Generate messages
POST   /api/incidents/:id/link      # Link related incidents
GET    /api/incidents/export        # Export to Excel (resolved + diversions)
POST   /api/incidents/adopt/:externalId # Adopt external incident as manual
```

- Implement RESTful endpoints using Express.js.  
- Validate inputs with Joi or Yup schemas.  
- Authenticate users via supervisor session middleware.  
- Use Supabase client for database operations.  
- Handle errors with standard HTTP status codes and messages.  
- Pagination: `?page=1&limit=50` with total count in headers.  
- Export endpoint generates Excel with sheetjs/xlsx library.  
- All error messages and responses use UK English spelling.  

### Real-time Sync Options
Since Convex limits are a concern:  
1. **WebSocket**: Use existing supervisorSync.js  
   - Implement event-based updates for new, updated, resolved incidents.  
2. **Polling**: Simple 30-second refresh  
   - Fallback option if WebSocket unavailable.  
3. **Server-Sent Events**: One-way updates from server  
   - Lightweight alternative to WebSocket.  
4. **Firebase**: Alternative real-time database (free tier available)  
   - Consider for scalability or offline support.  

- Ensure frontend components subscribe/unsubscribe cleanly to real-time channels.  
- Debounce rapid updates to avoid UI thrashing.  

## 🔄 Workflow

### Creating an Incident
1. Supervisor clicks "Create Incident" button  
2. Clicks on map OR enters postcode  
3. System shows affected area and suggests routes  
4. Supervisor confirms/adjusts route selection  
5. Selects incident type from grid  
6. Adds description (or uses template)  
7. System generates messages for all platforms  
8. Incident appears on Control Room Display  

- Validate all inputs before submission.  
- Provide loading indicators during API calls.  
- Show success/failure notifications.  
- Push update events via WebSocket after creation.  

### Action Reminders
When creating/updating incidents, remind supervisors to:  
- ✉️ Send email to affected depots  
- 📱 Update Ticketer with driver message  
- 🖥️ Update Passenger Cloud  
- 📊 Add to Disruption Database when resolved  

- Implement reminders as modal dialogs or toast notifications.  
- Provide links or templates to facilitate external communication.  

### External Incident Handling
- Poll TomTom/Highways every 2 minutes  
  - Backend cron job in `incidentPoller.js`.  
  - Fetch from both APIs in parallel.  
- Match incidents to Go North East routes  
  - Use GTFS matcher to find affected routes.  
  - Store with source field for identification.  
- Display as "Traffic Alert" type  
  - Different icon/color from manual incidents.  
  - Show source badge (TomTom/Highways).  
- Auto-clear when API shows resolved  
  - Check if incident still exists in API response.  
  - Mark as "Incident Cleared" or "Congestion Cleared".  
  - Keep visible rest of day if `dayEndRetention: true`.  
- Supervisors can "adopt" external incidents to add local details  
  - "Adopt" button converts to manual incident.  
  - Preserves original data but allows full editing.  
  - Unlinks from external updates after adoption.  

### Duplicate Detection
- Generate hash from location + type + time window (15 mins).  
- Compare new incidents against active incidents.  
- If potential duplicate found:  
  - Check distance (<200m = likely duplicate).  
  - Check time window (<15 mins = likely duplicate).  
  - Merge or flag for supervisor review.  
- Store deduplication hash in incident record.  

## 📊 Display Integration

### Control Room Display
- New incidents appear as popup notifications  
  - Toast notification slides in from top-right.  
  - Shows type, location, affected routes.  
  - Auto-dismiss after 10 seconds or manual close.  
  - Sound alert option (configurable).  
- Map auto-zooms to incident location  
  - Smooth animation to incident coordinates.  
  - Zoom level based on impact radius.  
  - Return to overview button.  
- Incident pins color-coded by type  
  - RTC = Red, Roadworks = Orange, etc.  
  - Pulse animation for new incidents.  
  - Size indicates impact (more routes = bigger pin).  
- Click pin for full details  
  - Popup with all incident data.  
  - Quick action buttons (update, message).  
- Active incident count in header  
  - Separate counts for manual vs external.  
  - Click to filter display.  

### Smart Alerting
- **Proximity Alerts**: Notify when incident near depot or key junction  
  - Define key locations in config (depots, stations, major junctions).  
  - Alert if incident within 500m of key location.  
  - Higher priority notification.  
- **Duration Warnings**: Highlight incidents active >2 hours  
  - Visual indicator (red border) for long-running incidents.  
  - Reminder notification to check if still active.  
- **Pattern Detection**: "Similar incident at this location yesterday"  
  - Simple location-based history check.  
  - Show previous incident details for context.  

- Use WebSocket listeners to trigger UI updates.  
- Dark mode support with theme toggle.  
- Performance mode to disable animations on older hardware.  

### Incident List View
- Sortable table with key info  
  - Columns: Type, Location, Routes, Status, Created, Actions.  
  - Click headers to sort.  
  - Responsive design for smaller screens.  
- Quick actions (update, resolve, message)  
  - Icon buttons in actions column.  
  - Hover tooltips for clarity.  
  - Bulk selection checkboxes.  
- Filter by route, type, supervisor  
  - Multi-select dropdowns.  
  - Search box for location/description.  
  - Date range picker.  
  - Clear filters button.  
- Export to Disruption Database  
  - Auto-flag incidents with diversions.  
  - Manual flag option for others.  
  - Export resolved incidents to Excel.  
  - Schedule daily export at midnight.  

- Use `IncidentList.jsx` with react-table v8.  
- Pagination: 50 per page with page selector.  
- Virtual scrolling for performance.  
- Column visibility toggle.  
- Export uses sheetjs to generate .xlsx files.  
- Resolved incidents show until midnight (dimmed style).  

## 💻 Performance Optimizations

### Frontend Performance
- **Virtual Scrolling**: For route selector with 231 routes  
  - Use `react-window` for RouteSelector component.  
  - Fixed height items for optimal performance.  
  - Lazy render only visible routes.  
- **Debounced Search**: For postcode/location lookup  
  - 300ms debounce on input.  
  - Cancel previous requests.  
  - Loading state during lookup.  
- **Lazy Load**: Historical incidents only when needed  
  - Load today's incidents initially.  
  - Load historical on filter change.  
  - Infinite scroll for incident list.  
- **WebWorker**: For GTFS route matching calculations  
  - Move heavy calculations off main thread.  
  - Cache results for repeated locations.  
  - Progress indicator for long operations.  
- **IndexedDB**: Offline incident creation queue  
  - Store incidents locally if offline.  
  - Sync when connection restored.  
  - Visual indicator for offline mode.  

### Backend Performance
- **Database Indexing**  
  - Index on status, createdAt, location (PostGIS).  
  - Compound index for common queries.  
  - Scheduled VACUUM for PostgreSQL.  
- **Caching Strategy**  
  - Redis cache for route shapes.  
  - 5-minute cache for external incidents.  
  - Invalidate on updates.  
- **Query Optimisation**  
  - Batch external API requests.  
  - Use database views for complex queries.  
  - Connection pooling for Supabase.  

### Map Performance  
- **Clustering**: Group nearby incidents at low zoom  
- **Tile Caching**: Cache map tiles locally  
- **Simplified Shapes**: Use simplified route geometries on overview  
- **Progressive Loading**: Load incident details on demand  

## 🚀 Implementation Priority

### Phase 1 - Core (Week 1) ✅ COMPLETED
- [x] Basic incident creation  
- [x] Map click functionality  
  - [x] Leaflet map integration with click-to-create
  - [x] Postcode search functionality  
  - [x] Reverse geocoding for readable addresses
- [x] Route selection grid  
  - [x] All 231 routes as clickable buttons
  - [x] Auto-detection with confidence levels
  - [x] Multi-select with Select All/Clear All
  - [x] Visual states for selected/detected routes
- [x] Save to database  
  - [x] Coordinates stored with incidents
  - [x] Route confidence data preserved
  - [x] Integration with existing API endpoints
- [x] UK English localisation throughout
  - [x] All UI text uses British spelling
  - [x] Map centred on Newcastle
  - [x] 24-hour time format

### Implementation Details - Phase 1:
**Files Created:**
- `/components/operations/incidents-v2/components/maps/IncidentMapPicker.jsx`
- `/components/operations/incidents-v2/components/RouteSelector.jsx`

**Files Modified:**
- `/components/operations/incidents-v2/components/CreateIncidentModal.jsx` - Added tabs, map integration
- `/components/operations/incidents-v2/IncidentsManagerV2.jsx` - UK English updates

**Features Implemented:**
- Tabbed modal interface (Details, Map Location, Routes)
- Interactive map with click-to-set location
- Postcode search with geocoding
- Route auto-detection calling `/api/gtfs/match/enhanced`
- 231-route button grid with search and filters
- Confidence percentage display
- Quick action buttons for map/route selection  

### Phase 2 - Integration (Week 2) ✅ COMPLETED
- [x] TomTom/Highways API integration - ALREADY EXISTS in backend
- [x] Traffic incident fetching - `fetchTrafficIncidents()` implemented
- [x] Traffic alerts display - Complete with live indicators and promote button
  - [x] IncidentCard supports traffic incidents with special styling
  - [x] "LIVE" badge for real-time traffic data
  - [x] Intelligence score display
  - [x] Delay and affected length metrics
  - [x] "Promote to Manual Incident" button
  - [x] Auto-refresh every 2 minutes
  - [x] Toggle to show/hide traffic alerts
  - [x] UK time format (24-hour)
  - [x] Orange border and background tint for visual differentiation
  - [x] GNE route filtering applied
  - [x] North East region boundary checking
  - [x] Adaptive refresh rates (15-60 seconds based on activity)
  - [x] Traffic stats counter in dashboard
- [x] Control Room Display integration  
  - [x] Push incident to display button functionality
  - [x] API endpoint integration (`/api/display/push-incident`)
  - [x] Display options with auto-zoom and duration
  - [x] Supervisor tracking for audit trail
- [x] Message generation  
  - [x] MessageGenerator component created
  - [x] Ticketer format templates with subject/body
  - [x] Passenger Cloud format templates
  - [x] Email format templates with full details
  - [x] Copy-to-clipboard functionality
  - [x] Message customisation and editing
  - [x] Character count display
  - [x] Template regeneration
  - [x] Messages saved to incident record
- [ ] Real-time updates via WebSocket/Convex  
  - [ ] WebSocket connection for live updates
  - [ ] Incident creation/update events
  - [ ] Supervisor action notifications

### Implementation Details - Phase 2 Complete:
**Files Created:**
- `/components/operations/incidents-v2/components/MessageGenerator.jsx`
  - Full message generation interface
  - Platform-specific templates
  - Copy functionality with visual feedback

**Files Modified:**
- `/components/operations/incidents-v2/IncidentsManagerV2.jsx`
  - Added message generation handler
  - Implemented push to display functionality
  - Fixed traffic incident fetching
- `/components/operations/incidents-v2/components/IncidentCard.jsx`
  - Added message button for manual incidents
  - Enhanced action buttons layout

**Features Working:**
- Generate messages for Ticketer, Passenger Cloud, and Email
- Copy messages with one click
- Push incidents to Control Room Display
- Full UK English localisation
- Template-based message generation with smart replacements  

### Phase 3 - Enhancement (Week 3)
- [ ] Smart templates  
- [ ] Postcode lookup  
- [ ] Route auto-detection  
- [ ] Action reminders  

## 📝 Notes

- No severity levels - supervisors assess impact  
- No countdown timers - situations too variable  
- Focus on speed of creation over detailed forms  
- Messages are for copy/paste, not auto-send  
- 30-day retention for mileage analysis  
- Must work without Convex if limits reached  
- All resolved incidents visible until midnight  
- Incidents with diversions auto-flagged for Disruption Database  
- Dark mode support for night shift supervisors  
- Excel export for archiving and analysis  
- Confidence levels shown but not prominently featured  
- External incidents auto-clear when no longer in API data  

## 🗺️ Map Implementation

### Map Library Choice
- **Leaflet** (Recommended)  
  - Free and open source  
  - Large community and plugins  
  - Good React integration (react-leaflet)  
  - Lighter weight than Mapbox  
- **Alternative: Mapbox GL JS**  
  - Better performance for many features  
  - Vector tiles support  
  - Costs apply after free tier  

### Map Features
- **Base Layers**  
  - OpenStreetMap (default)  
  - Dark theme for night mode  
  - Satellite view option  
- **Incident Layers**  
  - Manual incidents (full opacity)  
  - External incidents (75% opacity)  
  - Route overlays when selected  
- **Controls**  
  - Zoom in/out  
  - Fullscreen toggle  
  - Layer switcher  
  - Locate me button  
- **UK Localisation**  
  - Default centre: Newcastle (54.9783, -1.6178)  
  - UK postcode format validation  
  - British road naming conventions  

### Implementation
```javascript
// IncidentMap.jsx structure
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';

// Custom incident markers
const IncidentMarker = ({ incident }) => {
  const icon = getIncidentIcon(incident.type);
  return (
    <Marker 
      position={[incident.location.lat, incident.location.lng]}
      icon={icon}
      eventHandlers={{
        click: () => showIncidentDetails(incident)
      }}
    />
  );
};

// Click to create handler
map.on('click', (e) => {
  if (createMode) {
    setNewIncidentLocation(e.latlng);
    detectNearbyRoutes(e.latlng);
  }
});
```
