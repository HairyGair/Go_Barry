# GTFS Data Features - Strategic Suggestions for Go BARRY

**Date:** November 10, 2025
**Context:** Now that you can import GTFS (General Transit Feed Specification) data, here are powerful feature additions that will enhance the breakdown management system

---

## Executive Summary

You now have **real-time access to:**
- ✅ All 231+ bus routes with full route definitions
- ✅ All bus stops with exact GPS coordinates
- ✅ All scheduled trips for every route
- ✅ Complete timetable data (arrival/departure times at every stop)

This unlocks **significant operational improvements** for your breakdown management system.

---

## 1. **Smart Route Matching** 🗺️ (HIGH VALUE)

### What It Does
When a supervisor reports a breakdown at a location, automatically identify which routes pass through that area.

### Current Problem
- Supervisors manually figure out which routes are affected
- Delays in notifying passengers
- Risk of missing affected routes
- Manual coordination between teams

### How GTFS Helps
- Use `gtfs_stops` (stop_lat, stop_lon) + `gtfs_trips` to build a route map
- When breakdown location is reported, query: "Which routes have stops within X miles?"
- Instantly show affected routes and schedules

### Implementation
```sql
-- Example: Find all routes within 1 mile of breakdown location
SELECT DISTINCT gr.route_short_name, gr.route_long_name
FROM gtfs_stops gs
JOIN gtfs_trips gt ON gs.stop_id = gt.trip_id
JOIN gtfs_routes gr ON gt.route_id = gr.route_id
WHERE SQRT(POW((gs.stop_lat - ?), 2) + POW((gs.stop_lon - ?), 2)) < 0.014
-- 0.014 degrees ≈ 1 mile
```

### Value for Supervisors
- ✅ Instant route impact assessment
- ✅ Proactive passenger notifications
- ✅ Better resource allocation
- ✅ Faster incident response
- ✅ Reduced customer frustration

### Feature Addition Ideas
- [ ] Show affected routes on breakdown map
- [ ] Auto-notify routes when breakdown is created
- [ ] Estimate passenger impact (trips per hour per route)
- [ ] Integration with passenger notification system

---

## 2. **Estimated Service Recovery Time** ⏱️ (HIGH VALUE)

### What It Does
Show supervisors how long until normal service resumes on affected routes, based on scheduled trips.

### Current Problem
- Supervisors don't know when to expect traffic to return to normal
- Can't estimate how many more buses will be affected
- Passengers frustrated by lack of information
- No data-driven recovery timeline

### How GTFS Helps
- `gtfs_stop_times` has exact arrival/departure times for every trip
- Calculate: how many scheduled trips pass through the breakdown location in next 2-4 hours?
- Estimate service recovery based on traffic clearing

### Example Scenarios
```
Scenario 1: Breakdown at 14:30
- Route 21 passes through every 15 minutes
- Next 4 trips scheduled: 14:45, 15:00, 15:15, 15:30
- If cleared in 45 mins, only 3 trips affected
- Alert: "Service recovery estimated at 15:15 for Route 21"

Scenario 2: Incident blocks 2 routes
- Route 45: 8 trips in next 2 hours
- Route 47: 6 trips in next 2 hours
- Estimated impact: 14 buses, ~500-700 passengers
- Recovery timeline: show when each route expects first bus after clearance
```

### Implementation
```sql
-- Find all trips through a location in next N hours
SELECT gr.route_short_name, gst.departure_time, gst.arrival_time
FROM gtfs_stop_times gst
JOIN gtfs_stops gs ON gst.stop_id = gs.stop_id
JOIN gtfs_trips gt ON gst.trip_id = gt.trip_id
JOIN gtfs_routes gr ON gt.route_id = gr.route_id
WHERE SQRT(POW((gs.stop_lat - ?), 2) + POW((gs.stop_lon - ?), 2)) < 0.014
AND gst.departure_time > NOW()
AND gst.departure_time < DATE_ADD(NOW(), INTERVAL 4 HOUR)
ORDER BY gst.departure_time
```

### Value for Operations
- ✅ Quantify service disruption
- ✅ Estimate passenger impact
- ✅ Data-driven recovery timeline
- ✅ Better management decisions
- ✅ Passenger communication templates

### Feature Addition Ideas
- [ ] "Impact Dashboard" showing affected trips in real-time
- [ ] Automated alerts: "Route X has N trips impacted"
- [ ] Estimated recovery time notification
- [ ] Passenger impact estimate (routes, stops, trips affected)
- [ ] Integration with customer notifications

---

## 3. **Breakdown Location Suggestion** 📍 (MEDIUM VALUE)

### What It Does
When supervisor enters a breakdown location description, suggest the nearest bus stop or route.

### Current Problem
- Manual location entry is error-prone
- Inconsistent location naming (different supervisors use different descriptions)
- Some locations have multiple common names
- Takes time to precisely pinpoint breakdown location

### How GTFS Helps
- `gtfs_stops` contains all official stop names + GPS coordinates
- When supervisor types location, fuzzy-match against stop names
- Suggest nearest stops with coordinates

### Implementation
```sql
-- Find nearest stops to typed location
SELECT stop_id, stop_name, stop_lat, stop_lon,
  SQRT(POW((stop_lat - ?), 2) + POW((stop_lon - ?), 2)) as distance
FROM gtfs_stops
WHERE stop_name LIKE CONCAT('%', ?, '%')
ORDER BY distance
LIMIT 5
```

### User Experience
```
Supervisor types: "near team valley shopping centre"

System suggests:
1. Team Valley Shopping Centre Stop (Route 11, 27, 45)
2. Team Valley Bus Station (Route 10, 21, 32)
3. Team Valley Industrial Estate (Route 15)
4. [Or: enter custom location]
```

### Value for Data Quality
- ✅ Consistent location naming
- ✅ Accurate GPS coordinates
- ✅ Faster data entry
- ✅ Better analytics
- ✅ Improved route matching accuracy

### Feature Addition Ideas
- [ ] "Snap to nearest stop" button during breakdown creation
- [ ] Auto-complete location field using stop names
- [ ] Show route list for suggested stops
- [ ] Coordinate picker integrated with stop locations

---

## 4. **Route-Specific Breakdown History** 📊 (HIGH VALUE)

### What It Does
Show supervisors historical breakdown patterns for each route.

### Current Problem
- No way to see if a specific route has recurring issues
- Can't identify problem areas on routes
- Missing patterns that could indicate maintenance needs
- No data to prioritize maintenance resources

### How GTFS Helps
- Use `gtfs_stops` to tag breakdowns by route
- Correlate breakdowns with specific stops/sections
- Identify problem hotspots

### Example Use Cases
```
Route 21 Analysis:
- 8 breakdowns this month
- 4 breakdowns at "North Shields Station" stop
- 3 breakdowns on "Low Lights" section
- Conclusion: Specific area has issues, needs maintenance

Route 45 Analysis:
- 2 breakdowns, both on Sundays
- Both involving Route 45's older vehicles
- Conclusion: Maintenance needed for aging bus fleet
```

### Implementation
```sql
-- Breakdowns per route per stop
SELECT
  gr.route_short_name,
  gs.stop_name,
  COUNT(*) as breakdown_count,
  AVG(DATEDIFF(resolution_time, created_at)) as avg_resolution_time
FROM breakdowns b
JOIN fleet_vehicles fv ON b.fleet_no = fv.fleet_number
JOIN gtfs_stops gs ON ? -- Match stop location to closest stop
JOIN gtfs_trips gt ON ? -- Route through stop
JOIN gtfs_routes gr ON gt.route_id = gr.route_id
GROUP BY gr.route_id, gs.stop_id
HAVING breakdown_count > 2
ORDER BY breakdown_count DESC
```

### Value for Maintenance
- ✅ Identify recurring problem areas
- ✅ Data-driven maintenance planning
- ✅ Prioritize maintenance resources
- ✅ Reduce future breakdowns
- ✅ Improve fleet reliability

### Feature Addition Ideas
- [ ] Route-specific breakdown dashboard
- [ ] Heatmap: breakdown hotspots on each route
- [ ] Trend analysis: is this route improving/declining?
- [ ] Maintenance recommendations based on breakdown patterns
- [ ] Route reliability score (breakdowns per mile)

---

## 5. **Live Passenger Notifications** 📱 (VERY HIGH VALUE)

### What It Does
Automatically notify passengers on affected routes when breakdowns occur.

### Current Problem
- Passengers unaware of service disruption
- Long waits at bus stops
- Frustrated customers
- Poor perception of service quality
- No real-time communication channel

### How GTFS Helps
- Identify exactly which passengers will be affected
- Send targeted notifications to people waiting for affected routes
- Provide realistic ETAs for service resumption

### Integration Points
```
Breakdown Created → Find Affected Routes → Notify Passengers
                         ↓
            Query gtfs_trips, gtfs_stop_times
                         ↓
   "Route 21 has delay at North Shields
    Estimated service resume: 15:45
    Next bus expected: 16:00"
```

### Implementation
```
1. Breakdown reported at specific location
2. Query: Which routes pass through this location?
3. For each affected route:
   - Get current scheduled trips
   - Get next expected trip arrival times
   - Calculate estimated delay
   - Send notification to passenger app

Example Message:
"⚠️ Route 21: Service disruption reported at Team Valley
Expected resume: 3:15 PM
Next bus: 3:30 PM (usually 3:15 PM)
Check go-north-east.co.uk for updates"
```

### Value for Passengers
- ✅ Real-time service disruption alerts
- ✅ Accurate delay information
- ✅ Expected service resumption time
- ✅ Ability to plan alternative travel
- ✅ Improved customer satisfaction

### Value for Operators
- ✅ Reduced passenger frustration
- ✅ Better brand perception
- ✅ Data on passenger notifications
- ✅ Legal compliance (accessibility notifications)
- ✅ Integration point with existing apps

### Feature Addition Ideas
- [ ] Passenger notification system (SMS/push notification)
- [ ] Estimated ETAs based on breakdown duration
- [ ] Alternative route suggestions
- [ ] Real-time service status page using GTFS
- [ ] Integration with Go North East mobile app

---

## 6. **Supervisor Dashboard Enhancements** 📈 (HIGH VALUE)

### What It Does
Show supervisors real-time metrics based on current breakdowns and GTFS schedules.

### Current Problem
- Limited visibility into overall system impact
- Can't easily see how bad current situation is
- No passenger impact metrics
- Missing context for decision making

### How GTFS Helps
- Real-time passenger impact calculation
- Service disruption metrics
- Recovery timeline estimates

### Dashboard Metrics
```
Current Metrics (using GTFS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Breakdowns: 3
Affected Routes: 7
Estimated Passengers Impacted: 1,200-1,500
Trips Affected in Next 4 Hours: 34
Average Resolution Time: 47 minutes

Breakdown Impact Summary:
- Route 21: 8 trips, ~300 passengers
- Route 45: 12 trips, ~500 passengers
- Route 67: 14 trips, ~400 passengers

Expected Service Recovery: 3:45 PM (47 min)
```

### Implementation
```sql
-- Real-time impact dashboard
SELECT
  COUNT(DISTINCT b.id) as active_breakdowns,
  COUNT(DISTINCT gr.route_id) as affected_routes,
  SUM(estimated_passengers) as total_impact,
  AVG(DATEDIFF(CURTIME(), b.created_at)) as avg_duration
FROM breakdowns b
LEFT JOIN gtfs_routes gr ON b.affected_routes LIKE CONCAT('%', gr.route_id, '%')
WHERE b.status NOT IN ('resolved', 'cleared')
```

### Value for Supervisors
- ✅ Situational awareness
- ✅ Passenger impact visibility
- ✅ Data for management reporting
- ✅ Better resource allocation decisions
- ✅ Improved coordination

### Feature Addition Ideas
- [ ] Real-time impact dashboard widget
- [ ] Affected routes with passenger estimates
- [ ] Recovery timeline projection
- [ ] Export reports for management
- [ ] Integration with SDC operations dashboard

---

## 7. **Maintenance & Fleet Optimization** 🔧 (MEDIUM VALUE)

### What It Does
Use breakdown patterns by route to optimize maintenance schedules.

### Current Problem
- Maintenance scheduled by calendar, not data
- Can't predict which vehicles will break down
- No preventive maintenance strategy
- Maintenance resources not optimized

### How GTFS Helps
- Correlate breakdowns with specific routes
- Identify which routes have older, less reliable vehicles
- Plan maintenance around less-critical routes

### Example Analysis
```
Route 21 vs Route 45 Analysis:
- Route 21: Runs every 15 mins, 40 trips/day
- Route 45: Runs every 30 mins, 20 trips/day
- Route 21 more critical (more passengers)

Maintenance Strategy:
- Maintain Route 21 buses during off-peak (11 PM - 6 AM)
- Maintain Route 45 buses during mid-day (11 AM - 2 PM)
- Prioritize repairs for high-frequency routes
```

### Implementation
```sql
-- Identify least reliable routes
SELECT
  gr.route_short_name,
  COUNT(b.id) as breakdown_count,
  COUNT(DISTINCT gt.trip_id) as total_trips_per_day,
  ROUND(COUNT(b.id) / COUNT(DISTINCT gt.trip_id), 2) as breakdown_ratio
FROM gtfs_routes gr
LEFT JOIN gtfs_trips gt ON gr.route_id = gt.route_id
LEFT JOIN breakdowns b ON gr.route_short_name = b.affected_routes
GROUP BY gr.route_id
ORDER BY breakdown_ratio DESC
```

### Value for Fleet Management
- ✅ Data-driven maintenance planning
- ✅ Predict maintenance needs
- ✅ Optimize maintenance scheduling
- ✅ Reduce unplanned breakdowns
- ✅ Improve fleet reliability

### Feature Addition Ideas
- [ ] Route reliability scores
- [ ] Maintenance schedule recommendations
- [ ] Predictive analytics for fleet maintenance
- [ ] Route assignment optimization (avoid unreliable routes)

---

## 8. **Engineering Dispatch Optimization** 🚗 (MEDIUM VALUE)

### What It Does
Suggest which engineer should be dispatched based on route location and their current location.

### Current Problem
- Manual dispatch decisions
- Inefficient engineer routing
- Long response times
- Suboptimal engineer allocation

### How GTFS Helps
- Show exact breakdown location (snapped to bus stop)
- Show which routes serve that location
- Calculate distance for dispatch decisions

### Example
```
Breakdown at "Team Valley Shopping Centre Stop"
↓
Query gtfs_stops for coordinates
↓
Find engineers within 5 miles
↓
Dispatch: "Engineer John (2.3 miles, 8 mins)"
Instead of: "Engineer Sarah (12 miles, 25 mins)"
```

### Implementation
```sql
-- Find nearest engineers to breakdown location
SELECT eng.engineer_id, eng.name, eng.current_lat, eng.current_lon,
  SQRT(POW((eng.current_lat - ?), 2) + POW((eng.current_lon - ?), 2)) as distance
FROM engineers eng
WHERE eng.status = 'available'
ORDER BY distance
LIMIT 3
```

### Value for Operations
- ✅ Faster response times
- ✅ Reduced engineer travel
- ✅ Better resource allocation
- ✅ Optimized dispatch decisions
- ✅ Improved SLAs

---

## 9. **Schedule-Aware Breakdown Patterns** 📅 (MEDIUM VALUE)

### What It Does
Identify if breakdowns correlate with specific times of day, day of week, or route schedules.

### Current Problem
- No visibility into temporal patterns
- Can't predict busy times
- No preventive measures for peak periods
- Missing optimization opportunities

### How GTFS Helps
- Correlate breakdowns with scheduled busy times
- Identify patterns: "Routes always break down during peak hours"
- Plan preventive measures

### Example Analysis
```
Route 21 Pattern Analysis:
- Morning Peak (7-9 AM): 4 breakdowns this month
- Midday (11 AM-2 PM): 0 breakdowns
- Evening Peak (4-6 PM): 6 breakdowns

Finding: Evening peak has 50% more breakdowns
Action: Extra engineering support during 4-6 PM
```

### Implementation
```sql
-- Breakdowns by route and time of day
SELECT
  gr.route_short_name,
  HOUR(b.created_at) as hour_of_day,
  DAYNAME(b.created_at) as day_of_week,
  COUNT(*) as breakdown_count
FROM breakdowns b
JOIN gtfs_routes gr ON -- match route
GROUP BY gr.route_id, HOUR(b.created_at), DAY(b.created_at)
ORDER BY breakdown_count DESC
```

### Value for Planning
- ✅ Identify temporal patterns
- ✅ Preventive scheduling
- ✅ Better staffing decisions
- ✅ Predictive resource allocation

---

## 10. **Accessible Route Information** ♿ (COMPLIANCE VALUE)

### What It Does
Show accessible stops and routes (wheelchair, mobility aids, etc.)

### Current Problem
- Limited accessibility information
- Passengers with mobility needs can't easily find accessible options
- Non-compliance with accessibility standards
- Poor user experience for accessibility needs

### How GTFS Helps
- `gtfs_stops.wheelchair_boarding` flag is already tracked
- Show accessible routes and stops
- Help supervisors plan accessible alternatives

### Implementation
```sql
-- Find accessible stops on affected routes
SELECT DISTINCT gs.stop_name, gs.stop_id, gs.wheelchair_boarding
FROM gtfs_stops gs
JOIN gtfs_trips gt ON gs.stop_id = gt.trip_id
JOIN gtfs_routes gr ON gt.route_id = gr.route_id
WHERE gs.wheelchair_boarding = 1
AND gr.route_short_name = ?
```

### Value for Accessibility
- ✅ ADA/UK Equality Act compliance
- ✅ Better customer service
- ✅ Inclusive transportation options
- ✅ Legal protection
- ✅ Improved brand reputation

### Feature Addition Ideas
- [ ] Accessible route filters
- [ ] Accessibility information in breakdowns
- [ ] Alternative accessible routes suggestion
- [ ] Accessibility status in notifications

---

## Implementation Roadmap

### Phase 1 (High Value, Quick Wins) - 2-4 weeks
1. ✅ Smart Route Matching (#1)
2. ✅ Breakdown Location Suggestion (#3)
3. ✅ Route-Specific Breakdown History (#4)

**Impact:** Better data quality, improved route tracking, maintenance insights

### Phase 2 (Operational Excellence) - 4-8 weeks
1. ✅ Estimated Service Recovery Time (#2)
2. ✅ Supervisor Dashboard Enhancements (#6)
3. ✅ Engineering Dispatch Optimization (#8)

**Impact:** Better operations, faster response, improved efficiency

### Phase 3 (Passenger & Compliance) - 8-12 weeks
1. ✅ Live Passenger Notifications (#5)
2. ✅ Schedule-Aware Breakdown Patterns (#9)
3. ✅ Accessible Route Information (#10)

**Impact:** Better customer experience, compliance, passenger satisfaction

### Phase 4 (Advanced Analytics) - 12+ weeks
1. ✅ Maintenance & Fleet Optimization (#7)

**Impact:** Predictive maintenance, cost savings, reliability

---

## Technical Notes

### Database Queries
All features can be implemented with JOIN queries between:
- `breakdowns` (existing)
- `fleet_vehicles` (existing)
- `gtfs_routes`, `gtfs_stops`, `gtfs_trips`, `gtfs_stop_times` (new)

### Performance Considerations
- Index on `stop_lat`, `stop_lon` for location queries
- Cache route information (changes infrequently)
- Pre-calculate passenger estimates daily
- Use geospatial indexes for distance queries

### Integration Points
- Breakdown creation form → suggest nearest stops
- Dashboard → show affected routes in real-time
- Notifications → use GTFS for targeted alerts
- Dispatch system → suggest optimal engineers

---

## Summary

With GTFS data, you can transform Go BARRY from a **reactive** breakdown system into a **proactive, data-driven** operations platform that:

✅ Improves response times
✅ Reduces passenger impact
✅ Optimizes maintenance
✅ Enhances user experience
✅ Provides actionable insights
✅ Ensures compliance

**Start with Phase 1** (Smart Route Matching + Location Suggestion + Breakdown History). These provide immediate operational value with moderate implementation effort.

