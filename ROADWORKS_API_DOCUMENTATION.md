# BARRY Roadworks API Documentation
# Complete Backend System for Roadworks Task Management

## Overview

The BARRY Roadworks API provides a comprehensive system for managing roadworks that affect Go North East bus services. This system is completely separate from the incidents system and focuses on operational workflow management, diversion planning, and communication generation.

## Key Features

### ✅ **Workflow Management**
- Case-by-case supervisor task management
- Priority-based roadworks classification
- Status tracking through complete lifecycle
- Supervisor accountability and audit trails

### ✅ **Communication Generation**
- **Blink PDF**: Google Maps top-down view with diversion description
- **Ticket Machine Messages**: Full diversion details for bus systems
- **Driver Briefings**: Comprehensive operational information
- **Customer Notices**: Public-facing service change communications

### ✅ **Operational Planning**
- Service diversion route planning
- Council coordination tracking
- Route impact analysis using GTFS data
- Display screen promotion system

### ✅ **Integration**
- Supervisor authentication system
- GTFS route matching (500m radius)
- Enhanced geocoding with Mapbox
- Audit trails for all actions

## API Endpoints

### **Core Roadworks Management**

#### `GET /api/roadworks`
Get all roadworks with filtering options.

**Query Parameters:**
- `status`: Filter by status (reported, assessing, planning, approved, active, monitoring, completed, cancelled)
- `priority`: Filter by priority (critical, high, medium, low, planned)
- `assignedTo`: Filter by assigned supervisor ID
- `dateFrom`: Filter by start date (ISO format)
- `dateTo`: Filter by end date (ISO format)

#### `POST /api/roadworks`
Create a new roadworks task.

#### `PUT /api/roadworks/:id/status`
Update roadworks status with supervisor accountability.

#### `POST /api/roadworks/:id/diversion`
Create diversion plan with communication generation.

#### `POST /api/roadworks/:id/promote-to-display`
Promote roadworks to display screen for 24/7 monitoring.

#### `DELETE /api/roadworks/:id/remove-from-display`
Remove roadworks from display screen.

#### `GET /api/roadworks/display`
Get roadworks for display screen (only promoted items).

#### `GET /api/roadworks/stats`
Get comprehensive roadworks statistics.

## Roadworks Workflow

### **1. Roadwork Report Received**
```
STATUS: reported → assessing
```
- Supervisor receives roadwork notification
- System creates initial roadwork task
- Priority determined automatically based on affected routes
- Initial tasks generated based on priority level

### **2. Impact Assessment**
```
STATUS: assessing → planning
```
- Supervisor reviews route impact using GTFS data
- Council coordination initiated if required
- Priority may be adjusted based on assessment

### **3. Diversion Planning**
```
STATUS: planning → approved
```
- **Blink PDF Generated**: Google Maps top-down view with diversion route
- **Ticket Machine Messages**: Full diversion details for bus systems
- **Driver Briefings**: Comprehensive operational instructions
- **Customer Communications**: Service change notifications

### **4. Implementation**
```
STATUS: approved → active
```
- Diversions go live
- Communications distributed to drivers
- Ticket machine messages updated
- Optional promotion to display screen for critical roadworks

### **5. Monitoring**
```
STATUS: active → monitoring
```
- Ongoing service impact assessment
- Customer feedback monitoring
- Coordination with roadwork authority

### **6. Completion**
```
STATUS: monitoring → completed
```
- Normal service resumed
- Communications updated
- Final impact report generated

## Priority Determination

### **Critical Priority**
- Affects major routes: 21, X21, Q3, 10, 12, 22, 56
- Road closure or major works
- **Action Required**: Within 1 hour
- **Auto-generates**: Blink PDF, Ticket Machine Messages, Council Coordination tasks

### **High Priority**
- Affects important routes: 16, 20, 27, 28, 29, 47, 53, 54, 57, 58
- Significant traffic management
- **Action Required**: Within 2 hours
- **Auto-generates**: Communication and planning tasks

### **Medium Priority**
- Affects 2-4 routes
- Standard traffic management
- **Action Required**: Within 8 hours

### **Low Priority**
- Affects 0-1 routes
- Minimal traffic impact
- **Action Required**: Within 24 hours

### **Planned Priority**
- Pre-scheduled roadworks
- Advance notice available
- **Action Required**: As per schedule

## Communication Types

### **Blink PDF**
**Purpose**: Driver navigation aid
**Contains**:
- Google Maps top-down view of diversion route
- Step-by-step diversion instructions
- Key stops affected
- Emergency contact information
- Roadwork authority details

### **Ticket Machine Messages**
**Purpose**: Passenger information on buses
**Contains**:
- Service change summary
- Affected routes
- Duration information
- Alternative travel advice
- Customer service contacts

### **Driver Briefings**
**Purpose**: Comprehensive operational guidance
**Contains**:
- Situation overview
- Detailed diversion instructions
- Passenger communication scripts
- Timing adjustments
- Emergency procedures

### **Customer Notices**
**Purpose**: Public communication
**Contains**:
- Service change announcement
- Affected stops and alternatives
- Journey planning advice
- Contact information for help

## Deployment Instructions

### **Backend Deployment** (Required for this implementation)
**Target**: `https://go-barry.onrender.com`

1. **Files Modified/Created**:
   - `backend/routes/roadworksAPI.js` (NEW)
   - `backend/services/roadworksServices.js` (NEW)
   - `backend/index.js` (MODIFIED - added roadworks routes)

2. **Deploy to Render**:
   ```bash
   git add .
   git commit -m "Add complete roadworks backend system"
   git push origin main
   ```

3. **Verify Deployment**:
   - Check: `https://go-barry.onrender.com/api/health`
   - Test: `https://go-barry.onrender.com/api/roadworks/stats`

### **Testing the API**

#### **1. Create Test Roadwork**
```bash
curl -X POST https://go-barry.onrender.com/api/roadworks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test A1 Roadworks",
    "location": "A1 Northbound, Newcastle", 
    "description": "Test roadwork for API verification",
    "authority": "Test Authority",
    "sessionId": "test_session",
    "priority": "medium"
  }'
```

#### **2. Get All Roadworks**
```bash
curl https://go-barry.onrender.com/api/roadworks
```

#### **3. Get Statistics**
```bash
curl https://go-barry.onrender.com/api/roadworks/stats
```

---

**System Status**: Backend Complete ✅
**Next Phase**: Frontend Roadworks Manager Interface
**API Base URL**: `https://go-barry.onrender.com`