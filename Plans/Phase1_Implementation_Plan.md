# Phase 1 Implementation Plan: Core Functionality Enhancement
*January-February 2025*

## Phase 3: Advanced Features ✅ COMPLETED (January 2025)

### AI Action Suggestions System ✅

#### Backend Implementation
1. **Action Suggestions Service** (`/backend/services/actionSuggestions.js`)
   - Analyzes historical incidents for patterns
   - Finds similar past incidents with solutions
   - Recommends relevant message templates
   - Suggests diversion routes
   - Provides time-based action priorities

2. **API Endpoints**
   - `POST /api/suggestions/actions` - Get suggestions for an incident
   - `GET /api/suggestions/alert/:alertId` - Get suggestions for specific alert

3. **Features Implemented**
   - **Similar Incident Matching**: Uses location keywords, severity, time patterns
   - **Message Template Recommendations**: Personalized templates based on incident type
   - **Route-Based Actions**: Specific recommendations for affected routes
   - **Time-Aware Suggestions**: Different actions for peak vs off-peak times
   - **Confidence Scoring**: Shows reliability of suggestions

#### Frontend Integration
1. **Updated IncidentCard Component**
   - Added AI suggestions button (lightbulb icon)
   - Purple theme for AI features
   - Available for all incident types

2. **ActionSuggestions Component** (`/Go_BARRY/components/ai/ActionSuggestions.jsx`)
   - Tabbed interface: Actions, Messages, Similar, Routes, Diversions
   - Real-time suggestion fetching
   - Skeleton loaders for better UX
   - Error handling and retry logic

3. **Integration Points**
   - Incident Manager V2 fully integrated
   - Modal presentation for suggestions
   - Action selection triggers appropriate workflows
   - Message templates can be used directly

#### Data Sources
- `historical_incidents` table for pattern matching
- `message_templates` table for communications
- `diversion_templates` table for route alternatives
- Real-time GTFS route matching

---

## 1️⃣ Email Notification System (Priority 1)

### Current State
- Microsoft 365 auth structure exists in `/backend/routes/roadworkAlertsAPI.js`
- Email functionality commented out/disabled
- Distribution groups defined but not connected

### Implementation Steps

#### Week 1: Backend Activation
1. **Enable Email Service**
   - Uncomment email sending code in roadworkAlertsAPI.js
   - Configure SMTP settings for Go North East
   - Set up environment variables for email credentials

2. **Distribution Lists Setup**
   ```javascript
   const distributionGroups = {
     'control_room': 'controlroom@gonortheast.co.uk', 
     'depot_supervisors': 'depots@gonortheast.co.uk',
     'operations': 'operations@gonortheast.co.uk',
     'urgent_all': 'urgent@gonortheast.co.uk'
   };
   ```
   Note: Driver notifications via Blink export, not email

3. **Email Templates**
   - Roadwork notification template
   - Incident alert template
   - Daily summary template
   - Test notification template

#### Week 2: Frontend Integration
1. **Update CreateRoadworkModal.jsx**
   - Add email group selection UI
   - Preview email before sending
   - Confirmation of sent emails

2. **Add to IncidentManager.jsx**
   - Quick email alerts for major incidents
   - Recipient selection
   - Template selection

### Success Criteria
- ✅ Emails send successfully from roadworks creation
- ✅ All distribution groups receive notifications
- ✅ Email history logged in database
- ✅ No impact on 2GB memory limit

---

## 2️⃣ Historical Analysis System (Priority 2)

### Database Schema Design
```sql
-- Historical incidents table
CREATE TABLE historical_incidents (
  id UUID PRIMARY KEY,
  incident_id VARCHAR(255),
  type VARCHAR(50),
  severity INT,
  location_lat FLOAT,
  location_lng FLOAT,
  affected_routes TEXT[],
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INT,
  supervisor_badge VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monthly summaries table  
CREATE TABLE monthly_summaries (
  id UUID PRIMARY KEY,
  month DATE,
  total_incidents INT,
  avg_duration_minutes FLOAT,
  most_affected_route VARCHAR(10),
  peak_disruption_hour INT,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

### Report Types
1. **Monthly Disruption Report**
   - Total incidents by type
   - Average duration
   - Most affected routes
   - Peak disruption times
   - Supervisor activity summary

2. **Route Impact Analysis**
   - Incidents per route
   - Total disruption minutes
   - Frequency patterns
   - Severity distribution

3. **Business Period Reports**
   - 4-week period summaries (Go North East standard)
   - Period-over-period comparisons
   - Trend analysis
   - Director-requested reports (e.g., "major disruptions in Period 11")

### Implementation Steps
1. Create Supabase tables
2. Add historical data collection to alert processing
3. Build report generation endpoints
4. Create report UI in Admin Dashboard
5. Add export functionality (PDF/Excel)

---

## 3️⃣ Training/Sandbox Environment (Priority 3)

### Architecture
- Separate `/training` route prefix
- Sample data that resets daily
- No impact on production data
- Visual indicators for training mode

### Features
1. **Guided Tours**
   - Step-by-step overlay tutorials
   - Interactive tooltips
   - Progress tracking
   - Suitable for ALL supervisors (new and experienced)

2. **Practice Scenarios**
   - Pre-loaded sample incidents
   - Mock roadworks to manage
   - Test email sending (sandbox recipients only)
   - Real-world scenarios from actual incidents

3. **Training Progress**
   - Track completion per supervisor
   - Refresher training for updates
   - Audit trail of training completion

### Sample Data
```javascript
const trainingData = {
  incidents: [
    {
      id: 'TRAINING-001',
      description: 'Multi-vehicle RTC on A1 Northbound',
      severity: 8,
      affected_routes: ['X21', '21'],
      // Tutorial: How to assess severity and notify drivers
    },
    {
      id: 'TRAINING-002', 
      description: 'Burst water main on Clayton Street',
      severity: 5,
      affected_routes: ['Q3', '1', '2'],
      // Tutorial: How to create diversions
    }
  ],
  roadworks: [
    {
      id: 'TRAINING-RW-001',
      description: 'Planned gas works - Northumberland Street',
      duration: '5 days',
      // Tutorial: How to plan ahead for known disruptions
    }
  ]
};
```

---

## 📅 Timeline

### January 2025
- **Week 1-2**: Email notification system
- **Week 3-4**: Historical analysis foundation

### February 2025  
- **Week 1-2**: Complete historical analysis
- **Week 3-4**: Training environment

## 🔧 Technical Considerations
1. Use Supabase for all historical data storage
2. Implement background jobs for report generation
3. Cache generated reports for performance
4. Ensure all features work on mobile for field supervisors
5. Maintain comprehensive audit trail

## ✅ Deliverables Checklist
- [ ] Working email notifications
- [ ] 3 types of historical reports
- [ ] Training environment with 5+ scenarios
- [ ] Documentation for all new features
- [ ] Admin controls for all systems
