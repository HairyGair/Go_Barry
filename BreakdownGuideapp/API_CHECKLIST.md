# API Endpoints Checklist

## Required for Breakdown Guide

Based on analysis of the standalone app, these endpoints are needed:

### 🔴 Priority 1: Core Breakdown Management

```javascript
// Start a new breakdown assessment
POST /api/breakdowns/v3/start
Body: {
  vehicleId: "uuid",
  supervisorId: "uuid", 
  issueCategory: "string",
  location: { lat, lng },
  driverName: "string",
  driverPhone: "string"
}
Returns: { breakdownId: "BD-2025-00001", ... }

// Log wizard step progress
POST /api/breakdowns/v3/step
Body: {
  breakdownId: "BD-2025-00001",
  wizardName: "SteeringWizard",
  stepNumber: 1,
  question: "string",
  answer: "string",
  tranzauraRef: "string" // New: Tranzaura defect reference
}

// Complete assessment with decision
POST /api/breakdowns/v3/complete
Body: {
  breakdownId: "BD-2025-00001",
  severity: "STOP|AMBER|CONTINUE",
  resolutionNotes: "string"
}

// Get live breakdowns
GET /api/breakdowns/live
Returns: Array of active breakdowns

// Get today's breakdowns
GET /api/breakdowns/today
Returns: Array of today's breakdowns
```

### 🟡 Priority 2: Fleet & Lookups

```javascript
// Get all vehicles
GET /api/fleet
Returns: Array of all vehicles

// Get single vehicle
GET /api/fleet/:fleetNumber
Returns: Vehicle details

// Get supervisors
GET /api/supervisors
Returns: Array of supervisors
```

### 🟢 Priority 3: Analytics & Intelligence

```javascript
// Depot performance
GET /api/analytics/depot-performance
Returns: Performance metrics by depot

// Fleet intelligence summary
GET /api/fleet-intelligence/summary
Returns: Cost tracking, health scores

// Problem vehicles
GET /api/fleet-intelligence/problem-vehicles
Returns: Vehicles with pattern issues
```

## Backend Routes to Create

In `/backend/routes/`:

1. `breakdowns.js` - Main breakdown CRUD operations
2. `fleet.js` - Vehicle lookups
3. `analytics.js` - Reports and metrics
4. `supervisors.js` - User management

## Notes

- All endpoints should handle errors gracefully
- Use Supabase for data persistence
- Include proper status codes
- Add request validation
- Consider rate limiting for production
- Integrate with Tranzaura defect tracking system (replaced Go-Check)
- ABS Light assessments don't require Tracerit reports (per SDC Guide v1.3)
- All assessments should return decisions: 'STOP', 'AMBER', or 'CONTINUE'
