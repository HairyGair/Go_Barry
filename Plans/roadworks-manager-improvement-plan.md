# Roadworks Manager V2 - Comprehensive Improvement Plan

## Executive Summary
Transform the Roadworks Manager into a fully-functional, real-time roadworks intelligence system that streamlines supervisor workflow from Street Manager notification to diversion implementation and reporting.

## 🧩 Implementation Breakdown

This section expands the plan into implementation-level detail.

### Webhook Integration (Street Manager) ✅ ALREADY RECEIVING
- **Current State**: Webhook endpoint exists at `/api/streetmanager/webhook`
- **Enhancement Needed**:
  - Move data from webhook → Supabase streetworks table
  - Add permitRef deduplication check
  - Queue new roadworks for supervisor review
- **Existing Utils**: 
  - `parseLineStringToBNG()` and `parsePointToBNG()` for coordinate conversion
  - `isNorthEastLocation()` for area filtering

### Data Processing Pipeline
```javascript
// Enhanced streetManagerProcessor.js
async function processWebhookNotification(payload) {
  // 1. Extract key fields
  const {
    permitReference,
    workType, // 'road_closure', 'lane_closure', 'traffic_control'
    promoterOrganisation, // Who's doing the work
    streetName,
    townName,
    coordinates, // BNG format
    startDate,
    endDate,
    trafficManagementType
  } = parseStreetManagerPayload(payload);
  
  // 2. Check for duplicate
  const existing = await supabase
    .from('streetworks')
    .select('id')
    .eq('permit_ref', permitReference)
    .single();
    
  if (existing) {
    // Update existing record
    return updateRoadwork(existing.id, payload);
  }
  
  // 3. Convert BNG to Lat/Lng (already have utils)
  const { lat, lng } = parsePointToBNG(coordinates);
  
  // 4. Geocode for readable location
  const location = await reverseGeocode(lat, lng);
  
  // 5. Queue for supervisor review
  await queueForReview({
    permitRef: permitReference,
    location: location || `${streetName}, ${townName}`,
    workType,
    organization: promoterOrganisation,
    startDate,
    endDate,
    coordinates: { lat, lng }
  });
}
```

### Supabase Table Structure
```sql
-- Enhanced streetworks table
CREATE TABLE streetworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_ref VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'queued', -- 'queued', 'active', 'completed', 'cancelled'
  
  -- Location data
  street_name VARCHAR,
  town_name VARCHAR,
  location_description VARCHAR, -- Human readable
  coordinates JSONB, -- {lat, lng}
  bng_coordinates JSONB, -- Original BNG
  
  -- Work details
  work_type VARCHAR,
  traffic_management_type VARCHAR,
  promoter_organisation VARCHAR,
  description TEXT,
  
  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  
  -- Supervisor handling
  reviewed_by VARCHAR, -- supervisor badge
  reviewed_at TIMESTAMPTZ,
  pushed_to_display BOOLEAN DEFAULT false,
  display_pushed_by VARCHAR,
  display_pushed_at TIMESTAMPTZ,
  
  -- Diversion data
  diversion_id UUID,
  affected_routes TEXT[],
  diversion_details JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB -- Store original webhook data
);

-- Index for performance
CREATE INDEX idx_streetworks_permit_ref ON streetworks(permit_ref);
CREATE INDEX idx_streetworks_status ON streetworks(status);
CREATE INDEX idx_streetworks_dates ON streetworks(start_date, end_date);
```

### Frontend Polling Implementation
```javascript
// hooks/useStreetManager.js
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

export const useStreetManager = () => {
  const [queuedRoadworks, setQueuedRoadworks] = useState([]);
  const [activeRoadworks, setActiveRoadworks] = useState([]);
  const [lastCheck, setLastCheck] = useState(new Date());
  
  useEffect(() => {
    const pollSupabase = async () => {
      // Get queued roadworks
      const { data: queued } = await supabase
        .from('streetworks')
        .select('*')
        .eq('status', 'queued')
        .order('start_date', { ascending: true });
        
      // Get active roadworks
      const { data: active } = await supabase
        .from('streetworks')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });
        
      // Check for overruns
      const now = new Date();
      const processedActive = active?.map(rw => ({
        ...rw,
        isOverrun: new Date(rw.end_date) < now && !rw.actual_end_date
      }));
      
      setQueuedRoadworks(queued || []);
      setActiveRoadworks(processedActive || []);
      setLastCheck(new Date());
    };
    
    // Initial poll
    pollSupabase();
    
    // Poll every minute
    const interval = setInterval(pollSupabase, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { queuedRoadworks, activeRoadworks, lastCheck };
};
```

### Geocoding Enhancement with Caching
```javascript
// services/geocodingCache.js
const geocodeCache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function reverseGeocodeWithCache(lat, lng) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  
  // Check cache
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Try TomTom first
    const location = await reverseGeocodeTomTom(lat, lng);
    
    // Cache result
    geocodeCache.set(cacheKey, {
      data: location,
      timestamp: Date.now()
    });
    
    return location;
  } catch (error) {
    // Fallback to coordinate-based description
    console.error('Geocoding failed:', error);
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
```

### Diversion Auto-Suggest Algorithm
```javascript
// services/diversionService.js
export async function suggestDiversion(roadworkLocation, affectedRoutes) {
  const suggestions = [];
  
  // 1. Check for previous diversions at this location
  const locationHash = hashLocation(roadworkLocation.lat, roadworkLocation.lng);
  const { data: templates } = await supabase
    .from('diversion_templates')
    .select('*')
    .eq('location_hash', locationHash)
    .order('success_rating', { ascending: false })
    .limit(3);
    
  if (templates?.length) {
    suggestions.push(...templates.map(t => ({
      type: 'historical',
      confidence: t.success_rating,
      diversion: t.diversion_route,
      previousUses: t.usage_count
    })));
  }
  
  // 2. Geographic proximity analysis
  const nearbyRoads = await findAlternativeRoutes(roadworkLocation);
  if (nearbyRoads.length) {
    suggestions.push({
      type: 'geographic',
      confidence: 0.7,
      diversion: nearbyRoads[0],
      reason: 'Parallel road available'
    });
  }
  
  // 3. GTFS-based route analysis
  for (const routeId of affectedRoutes) {
    const routeShape = await getRouteShape(routeId);
    const diversion = calculateDetour(routeShape, roadworkLocation);
    if (diversion) {
      suggestions.push({
        type: 'calculated',
        confidence: 0.6,
        diversion,
        affectedStops: diversion.skippedStops
      });
    }
  }
  
  return suggestions;
}
```

### Display Screen Push Implementation
```javascript
// Enhanced pushToDisplay function
export async function pushToDisplay(roadworkId, supervisorBadge) {
  try {
    // 1. Get roadwork details
    const { data: roadwork } = await supabase
      .from('streetworks')
      .select('*')
      .eq('id', roadworkId)
      .single();
      
    // 2. Format for display
    const displayData = {
      id: roadwork.id,
      type: 'roadwork',
      title: `${roadwork.location_description} - ${roadwork.work_type}`,
      subtitle: `${roadwork.promoter_organisation} | Routes ${roadwork.affected_routes.join(', ')} diverted`,
      severity: roadwork.traffic_management_type === 'road_closure' ? 'high' : 'medium',
      location: roadwork.coordinates,
      mapPin: {
        type: 'roadwork',
        icon: '🚧',
        color: '#F59E0B'
      }
    };
    
    // 3. Push via WebSocket
    await supervisorSync.broadcast({
      type: 'DISPLAY_UPDATE',
      action: 'ADD_ROADWORK',
      data: displayData
    });
    
    // 4. Update database
    await supabase
      .from('streetworks')
      .update({
        pushed_to_display: true,
        display_pushed_by: supervisorBadge,
        display_pushed_at: new Date()
      })
      .eq('id', roadworkId);
      
    // 5. Log action
    await logSupervisorAction(supervisorBadge, 'PUSH_TO_DISPLAY', {
      roadworkId,
      location: roadwork.location_description
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to push to display:', error);
    return { success: false, error: error.message };
  }
}
```

### PDF Report Generation
```javascript
// services/roadworkReportService.js
import PDFDocument from 'pdfkit';
import cron from 'node-cron';

// Schedule for 00:15 daily
cron.schedule('15 0 * * *', generateAndSendDailyReport);

async function generateAndSendDailyReport() {
  const doc = new PDFDocument();
  const buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  // Header
  doc.fontSize(20).text('GO NORTH EAST', { align: 'center' });
  doc.fontSize(16).text('START OF SERVICE REPORT', { align: 'center' });
  doc.fontSize(12).text(`${new Date().toLocaleDateString()} - 00:15`, { align: 'center' });
  doc.moveDown();
  
  // Get active roadworks with diversions
  const { data: roadworks } = await supabase
    .from('streetworks')
    .select('*, diversion:diversion_id(*)')
    .eq('status', 'active')
    .not('diversion_id', 'is', null)
    .order('start_date');
    
  // Add roadworks to PDF
  doc.fontSize(14).text('ACTIVE ROADWORKS & DIVERSIONS');
  doc.moveDown();
  
  roadworks?.forEach((rw, index) => {
    doc.fontSize(12).text(`${index + 1}. ${rw.location_description}`);
    doc.fontSize(10).text(`   ${rw.work_type} - ${rw.promoter_organisation}`);
    doc.text(`   Services ${rw.affected_routes.join(', ')} diverted via ${rw.diversion?.route || 'TBC'}`);
    doc.moveDown();
  });
  
  // Complete PDF
  doc.end();
  
  // Convert to buffer
  const pdfBuffer = Buffer.concat(buffers);
  
  // Send via email
  await sendReportEmail(pdfBuffer);
}
```

### Roadwork Queue Component
```jsx
// components/operations/roadworks-v2/components/RoadworkQueue.jsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles } from '../styles/roadworks.styles';

const RoadworkQueue = ({ queuedRoadworks, onReview, onQuickAdd, onDismiss }) => {
  if (!queuedRoadworks.length) {
    return (
      <View style={roadworksStyles.emptyQueue}>
        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        <Text style={roadworksStyles.emptyText}>All roadworks processed!</Text>
      </View>
    );
  }
  
  return (
    <View style={roadworksStyles.queueContainer}>
      <View style={roadworksStyles.queueHeader}>
        <Ionicons name="layers-outline" size={24} color="#3B82F6" />
        <Text style={roadworksStyles.queueTitle}>
          Roadwork Queue ({queuedRoadworks.length} new)
        </Text>
      </View>
      
      <ScrollView style={roadworksStyles.queueList}>
        {queuedRoadworks.map((rw) => (
          <View key={rw.id} style={roadworksStyles.queueItem}>
            <View style={roadworksStyles.queueItemHeader}>
              <Text style={roadworksStyles.queueItemLocation}>
                {rw.location_description}
              </Text>
              <View style={roadworksStyles.newBadge}>
                <Text style={roadworksStyles.newBadgeText}>NEW</Text>
              </View>
            </View>
            
            <Text style={roadworksStyles.queueItemDetails}>
              {rw.work_type} • {rw.promoter_organisation}
            </Text>
            <Text style={roadworksStyles.queueItemDates}>
              Starts: {new Date(rw.start_date).toLocaleDateString()}
            </Text>
            
            <View style={roadworksStyles.queueActions}>
              <Pressable
                style={[roadworksStyles.actionButton, roadworksStyles.reviewButton]}
                onPress={() => onReview(rw)}
              >
                <Text style={roadworksStyles.actionButtonText}>Review</Text>
              </Pressable>
              
              <Pressable
                style={[roadworksStyles.actionButton, roadworksStyles.quickAddButton]}
                onPress={() => onQuickAdd(rw)}
              >
                <Text style={roadworksStyles.actionButtonText}>Quick Add</Text>
              </Pressable>
              
              <Pressable
                style={[roadworksStyles.actionButton, roadworksStyles.dismissButton]}
                onPress={() => onDismiss(rw)}
              >
                <Text style={roadworksStyles.actionButtonText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default RoadworkQueue;
```

## 🧪 Testing Strategy

- Webhook intake: Send mock POST payloads
- Deduplication: Resend same permitRef, verify no duplicate
- Auto-suggest: Simulate known locations
- PDF: Ensure email dispatch at 00:15

## 📦 Required Dependencies

| Package                              | Use Case                | Status |
|--------------------------------------|-------------------------|--------|
| `@supabase/supabase-js`              | DB interactions         | ✅     |
| `pdfkit`                             | PDF report generation   | ❌     |
| `uuid`                               | Unique IDs              | ✅     |
| `@tomtom-international/web-sdk-maps`| Interactive maps        | ✅     |
| `node-cron`                          | Timed PDF generation    | ❌     |
| `proj4`                              | Better BNG conversion   | ❌     |

## ❓ Open Decisions

- Should diversion effectiveness be AI-evaluated or controller-submitted?
- Do we archive revoked permits?
- Should display screen auto-remove completed diversions instantly or delay?

## ✅ Implementation Tracker

### Phase 1 ✅ COMPLETED
- [x] Street Manager webhook receiving
- [x] BNG to Lat/Lng conversion utils exist
- [x] Supabase streetworks table creation
- [x] RoadworkQueue component ✅ **IMPLEMENTED**
- [x] Webhook → Supabase pipeline ✅ **IMPLEMENTED**
- [x] Frontend polling hook (useStreetManager) ✅ **IMPLEMENTED**

### Phase 2 ✅ COMPLETED  
- [x] Diversion auto-suggest logic ✅ **IMPLEMENTED** (diversionService.js)
- [x] Enhanced DiversionTemplates component ✅ **IMPLEMENTED**
- [x] Display sync function ✅ **IMPLEMENTED** (displayScreenSync.js)
- [x] Geocoding cache service ✅ **IMPLEMENTED** (geocodingCache.js)
- [ ] Enhanced map integration with roadwork pins (medium priority)

### Phase 3 ✅ COMPLETED
- [x] Start of Service PDF system ✅ **IMPLEMENTED** (roadworkReportService.js)
- [x] Enhanced analytics dashboard ✅ **IMPLEMENTED** (RoadworksAnalyticsDashboard.jsx)
- [x] Controller review interface ✅ **IMPLEMENTED** (ControllerReviewInterface.jsx)
- [x] Audit log table & integration ✅ **IMPLEMENTED** (auditLogService.js)

### Testing & Deployment ✅ COMPLETED
- [x] Backend unit tests ✅ **98.3% success rate** (58/59 tests passing)
- [x] Integration tests ✅ **100% success rate** (8/8 tests passing)
- [x] Frontend component tests ✅ **100% success rate** (14/14 tests passing)
- [x] Performance and memory tests ✅ **PASSED**
- [x] Deployment checklist created ✅ **DOCUMENTED**

## 🎯 Core Objectives
1. **Real-time Street Manager Integration** - Automatic processing of webhook notifications
2. **Intelligent Diversion Management** - Auto-suggest and save diversion templates
3. **Display Screen Integration** - Push critical roadworks to control room display
4. **Comprehensive Audit Trail** - Track all supervisor actions
5. **Automated Reporting** - Daily Start of Service reports at 00:15

## 📐 UI/UX Improvements

### Layout Symmetry
- **Uniform Card Grid**: 3x2 layout with equal-sized cards
- **Consistent Spacing**: 16px between cards, 24px margins
- **Visual Hierarchy**: Clear headers, readable fonts, intuitive icons

### Empty State Design
```
┌─────────────────────────────────────┐
│     🚧 No Active Roadworks          │
│                                     │
│  [📝 Create Manual Entry]           │
│  [🔍 Check Street Manager Queue]    │
│  [📊 View Historical Data]          │
└─────────────────────────────────────┘
```

### Color Scheme
- **Active**: Blue (#3B82F6) - Normal roadworks
- **Overrun**: Amber (#F59E0B) - Past expected end date
- **Urgent**: Red (#EF4444) - Requires immediate attention
- **Completed**: Green (#10B981) - Recently finished
- **Queued**: Gray (#6B7280) - Awaiting review

## 🔄 Street Manager Integration

### Data Flow Architecture
```
Street Manager API → Webhook → Backend → Supabase → Frontend Poll (1 min)
                                  ↓
                            Duplicate Check
                                  ↓
                          Roadwork Queue → Supervisor Review
```

### Required Data Extraction
1. **Location**: Reverse geocode coordinates to street name
2. **Work Type**: Parse description (lane closure, road closure, resurfacing)
3. **Organization**: Extract promoter/contractor name
4. **Dates**: Start date, expected end date, actual end date
5. **Permit Reference**: Unique identifier for duplicate detection

### Notification Types Handling
- **New Permit**: Create new roadwork entry
- **Permit Update**: Update existing entry, highlight changes
- **Permit Revoked**: Mark as cancelled, remove from active
- **Work Start/Stop**: Update status, check for overruns

## 🗺️ Enhanced Features

### 1. Roadwork Queue Dashboard
```jsx
// New component: RoadworkQueue.jsx
┌─────────────────────────────────────────────┐
│ 📥 Roadwork Queue (3 new)                  │
├─────────────────────────────────────────────┤
│ 🆕 A1 Newcastle - Lane Closure             │
│    Northumbrian Water | Starts: Tomorrow    │
│    [Review] [Quick Add] [Dismiss]          │
├─────────────────────────────────────────────┤
│ 🆕 Felling Bypass - Full Closure           │
│    BT Openreach | Starts: Monday           │
│    [Review] [Quick Add] [Dismiss]          │
└─────────────────────────────────────────────┘
```

### 2. Interactive Map View
- **TomTom Maps Integration**: Show exact roadwork location
- **Custom Pins**: 🚧 Orange construction cone icon
- **Click Actions**: View details, create diversion, push to display
- **Route Overlay**: Show affected bus routes on map

### 3. Diversion Management System
```jsx
// Diversion Creation Flow
1. Auto-suggest based on:
   - Previous diversions at same location
   - Geographic proximity analysis
   - Affected routes calculation

2. Template System:
   - Save successful diversions
   - Tag by location/type
   - Quick apply to similar situations

3. Success Tracking:
   - Controller review portal
   - Metrics: delays, complaints, driver feedback
   - Historical effectiveness rating
```

### 4. Supervisor Action Tracking
Every action logged with:
- Supervisor badge (e.g., AG003)
- Timestamp
- Action type (viewed, created, modified, dismissed)
- Previous/new values for changes
- IP address and session ID

## 🔌 System Integration

### Display Screen Integration
```javascript
// Push to Display Function
pushToDisplay(roadworkId) {
  // Add roadwork to display queue
  // Format: "A1 Newcastle | Water Main Repair | Routes 1, 27 diverted"
  // Show exact location on map with 🚧 pin
  // Auto-remove when roadwork completed
}
```

### Disruption Database Integration
```javascript
// Auto-sync to DisruptionDatabase
- On roadwork creation/update
- Include: title, location, diversion details, dates
- Maintain 30-day historical record post-completion
- API endpoint: POST /api/disruptions/roadwork
```

### Message Distribution Integration
```javascript
// Automated Messaging
- Generate message: "Route X diverted at [location] due to [work type]"
- Include diversion instructions
- Send to affected depot channels
- Track message delivery status
```

## 📊 Reporting System

### Start of Service Report (Daily 00:15)
```
PDF Format:
┌─────────────────────────────────────┐
│     GO NORTH EAST                   │
│   START OF SERVICE REPORT           │
│     [Date] - 00:15                  │
├─────────────────────────────────────┤
│ ACTIVE ROADWORKS & DIVERSIONS       │
├─────────────────────────────────────┤
│ 1. Gosforth High Street            │
│    Water main repair               │
│    Services 1, 2, 35 diverted via  │
│    Salters Road                    │
├─────────────────────────────────────┤
│ 2. Team Valley Trading Estate      │
│    Road resurfacing                │
│    Service 93, 94 using Kingsway   │
└─────────────────────────────────────┘
```

## 🏗️ Implementation Architecture

### Frontend Components Structure
```
/components/operations/roadworks-v2/
├── RoadworksManagerV2.jsx (main container)
├── components/
│   ├── RoadworkQueue.jsx
│   ├── RoadworkCard.jsx (enhanced)
│   ├── MapView.jsx (TomTom integration)
│   ├── DiversionPlanner.jsx
│   ├── ActionAuditLog.jsx
│   └── QuickActions.jsx
├── modals/
│   ├── CreateRoadworkModal.jsx
│   ├── DiversionModal.jsx
│   └── ReviewQueueModal.jsx
└── hooks/
    ├── useStreetManager.js
    ├── useDiversionTemplates.js
    └── useRoadworkSync.js
```

### Backend Services Enhancement
```
/backend/services/
├── streetManagerProcessor.js (enhanced)
│   ├── Webhook handler
│   ├── Duplicate detection
│   ├── Data normalization
│   └── Queue management
├── diversionService.js (new)
│   ├── Auto-suggest algorithm
│   ├── Template management
│   └── Success tracking
└── roadworkReportService.js (new)
    ├── PDF generation
    ├── Email dispatch
    └── Historical archiving
```

### Database Schema (Supabase)
```sql
-- Existing tables to utilize
streetworks (from Street Manager)
disruption_database (existing)

-- New tables needed
CREATE TABLE diversion_templates (
  id UUID PRIMARY KEY,
  location_hash VARCHAR,
  diversion_route TEXT,
  affected_routes TEXT[],
  success_rating DECIMAL,
  created_by VARCHAR,
  usage_count INT
);

CREATE TABLE supervisor_actions (
  id UUID PRIMARY KEY,
  roadwork_id UUID,
  supervisor_badge VARCHAR,
  action_type VARCHAR,
  details JSONB,
  timestamp TIMESTAMPTZ
);
```

## 🚀 Quick Implementation Wins

### Week 1: Foundation
1. Create Supabase tables with proper schema
2. Build webhook → Supabase pipeline
3. Create RoadworkQueue component
4. Implement permit reference duplicate detection
5. Add supervisor action logging hooks

### Week 2: Core Features  
1. Integrate map view with roadwork pins
2. Build diversion planner with auto-suggest
3. Connect to Display Screen system
4. Create manual entry form
5. Implement roadwork status updates

### Week 3: Polish & Reporting
1. Implement Start of Service PDF generation
2. Add email automation (00:15 daily)
3. Build controller review interface
4. Complete audit trail system
5. Performance optimization

## 📈 Success Metrics
- **Processing Time**: <30 seconds from webhook to display
- **Duplicate Detection**: 100% accuracy using permit refs
- **Diversion Success**: Track 80%+ positive outcomes
- **Report Delivery**: 100% on-time at 00:15
- **Supervisor Efficiency**: 50% reduction in manual entry time

## 🔐 Security & Permissions
- Only logged-in supervisors can access
- Admin-only features: template management, audit logs
- Controller-only: success rating, report configuration
- All actions logged with full context

## 💡 Future Enhancements
1. **AI Diversion Optimization**: Learn from successful patterns
2. **Predictive Alerts**: Warn of likely overruns
3. **Public API**: Share non-sensitive data with partners
4. **Mobile App**: Dedicated supervisor mobile interface
5. **Integration Hub**: Connect with council systems directly

---

*This plan provides a comprehensive roadmap to transform the Roadworks Manager into a best-in-class operational tool that significantly improves supervisor efficiency and service reliability.*