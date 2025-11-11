# GTFS + Fleet Data Feature Analysis
**Go BARRY Breakdown Management System**

**Analysis Date:** November 10, 2025
**Analysis Scope:** Data-driven feature opportunities leveraging GTFS (231+ routes, 2000+ stops) and Fleet (1000+ vehicles)
**Target Users:** 9 supervisors across 6 depots (Washington, Riverside, Consett, Deptford, Percy Main, Hexham)

---

## Executive Summary

Your system has recently invested in importing and structuring two critical datasets:
- **GTFS Data**: Comprehensive transit data (routes, stops, trips, schedules)
- **Fleet Data**: Complete vehicle information with depot assignments

This analysis identifies **10 high-impact features** that will provide immediate operational value, improve supervisor efficiency, and reduce response times to breakdowns. Features are prioritized by business impact and implementation complexity.

**Total Opportunity**: 144-288 implementation hours across all 10 features, delivering measurable improvements to:
- Breakdown response time (target: -15-20%)
- Route coverage reliability
- Preventive maintenance effectiveness
- Supervisor decision-making quality

---

## Feature Ranking Matrix

| Priority | Feature | Business Impact | Complexity | Hours | Data Source |
|----------|---------|-----------------|-----------|-------|-------------|
| 1 | Live Route Status Dashboard | CRITICAL | Low | 16-20 | GTFS + Fleet + Breakdowns |
| 2 | Predictive Route Disruption Alerts | HIGH | Medium | 24-32 | GTFS + Fleet + Historical |
| 3 | Dynamic Spare Vehicle Allocation | HIGH | Medium | 28-36 | Fleet + GTFS + Breakdowns |
| 4 | Stop-Level Incident Heatmap | HIGH | Low | 12-16 | GTFS + Breakdowns |
| 5 | Passenger Impact Assessment | MEDIUM | Medium | 20-28 | GTFS + Breakdowns + Time data |
| 6 | Route Coverage Analysis Tool | HIGH | Low | 14-18 | GTFS + Fleet |
| 7 | Smart Engineer Dispatch | HIGH | Medium | 32-40 | Fleet + GTFS + Breakdowns |
| 8 | Seasonal Route Risk Profiles | MEDIUM | Medium | 24-32 | Historical + GTFS + Weather |
| 9 | Stop Accessibility & Vehicle Matching | MEDIUM | Low | 16-20 | GTFS + Fleet |
| 10 | Real-Time Passenger Notifications | MEDIUM | High | 40-48 | GTFS + Breakdowns + External API |

---

## Feature Detailed Analysis

### 1. Live Route Status Dashboard
**Priority:** CRITICAL | **Complexity:** Low | **Effort:** 16-20 hours | **Expected ROI:** Very High

#### Description
A supervisory dashboard showing real-time health status for each of the 231 bus routes, combining GTFS route definitions with live breakdown data and current fleet assignments. Provides color-coded route health (Green/Amber/Red) based on active breakdowns impacting that route.

#### Data Source
- **Primary:** GTFS routes (231+ routes) + Breakdowns (real-time) + Fleet assignments
- **Secondary:** Booking/capacity data (if available)
- **Dependencies:** Breakdown location matching to routes (already implemented in route matching feature)

#### Expected Value/Benefit
- **Supervisor Perspective:** Instant view of which routes are affected and severity level
- **Operational:** Enables rapid escalation and coordination across depots
- **Response Time:** Reduces time to identify impacted routes from 5-10 mins to <30 seconds
- **Examples:**
  - Route 1 (Washington-Gateshead): RED - 1 breakdown, 15+ min delay expected
  - Route 47 (City Centre): AMBER - 1 breakdown affecting 20% capacity
  - Route 22 (Percy Main): GREEN - All vehicles operational

#### Complexity Breakdown
- Backend API: 6-8 hours (aggregation logic, caching layer)
- Frontend Dashboard: 8-10 hours (real-time updates, color coding, filtering)
- WebSocket Integration: 2-4 hours (broadcast route status changes)

#### Implementation Approach
```sql
-- Query aggregates breakdowns by route in real-time
SELECT
  gr.route_id,
  gr.route_short_name,
  COUNT(DISTINCT b.id) as active_breakdowns,
  COUNT(DISTINCT fv.fleet_number) as available_vehicles,
  CASE
    WHEN COUNT(b.id) > 2 THEN 'RED'
    WHEN COUNT(b.id) = 1 THEN 'AMBER'
    ELSE 'GREEN'
  END as status
FROM gtfs_routes gr
LEFT JOIN breakdowns b ON b.status IN ('pending', 'in-progress')
  AND b.breakdown_location LIKE CONCAT('%', gr.route_short_name, '%')
LEFT JOIN fleet_vehicles fv ON fv.depot = gr.depot_assignment
GROUP BY gr.route_id, gr.route_short_name;
```

#### Key Metrics to Track
- Route status (Red/Amber/Green)
- Active breakdown count per route
- Average delay impact (minutes)
- Affected passenger capacity

#### Nice-to-Haves
- Historical route reliability scoring
- Trend arrows (improving/declining)
- Predicted recovery time per route

---

### 2. Predictive Route Disruption Alerts
**Priority:** HIGH | **Complexity:** Medium | **Effort:** 24-32 hours | **Expected ROI:** High

#### Description
An intelligent alert system that predicts which routes are likely to face breakdowns based on historical patterns, vehicle age, scheduled maintenance windows, and current fleet distribution. Provides 30-60 minute advance warning to supervisors.

#### Data Source
- **Primary:** Historical breakdowns (patterns by route/vehicle type), Fleet vehicle data (age, maintenance schedule)
- **Secondary:** GTFS trip schedules (peak times), weather data (optional)
- **Calculation:** Time-series analysis of breakdown frequency by route/time/vehicle type

#### Expected Value/Benefit
- **Proactive Response:** Supervisors can pre-position spare vehicles or notify operators before breakdowns occur
- **Cost Reduction:** Reduce reactive repairs, better maintenance scheduling
- **Passenger Satisfaction:** Fewer service interruptions and delays
- **Response Efficiency:** Moves from reactive (5-10 min response) to proactive (30-60 min advance notice)
- **Target Reduction:** 10-15% fewer critical breakdowns through early intervention

#### Complexity Breakdown
- Prediction Model: 12-16 hours (aggregation logic, pattern matching, scoring algorithm)
- API Endpoint: 6-8 hours (alert generation, delivery, scoring)
- Frontend Alerts: 6-8 hours (alert UI, dismissal, history)

#### Implementation Approach
```javascript
// Scoring algorithm (risk_score = 0-100)
// Factors:
// - Vehicle age: +2 points per year of age
// - Historical breakdown rate: baseline from last 90 days
// - Current fleet density on route: -1 per spare vehicle
// - Peak hours: +10 during rush hours
// - Vehicle type: different rates (e.g., older Enviro type = +15)
// - Seasonal patterns: winter months = +10

const calculateRouteRiskScore = (routeId, vehicleType, currentHour) => {
  let score = 0;

  // 1. Get historical breakdown frequency for this route
  const historicalRate = getBreakdownRateForRoute(routeId); // 0-100
  score += historicalRate * 0.4;

  // 2. Vehicle age factor
  const avgVehicleAge = getAverageFleetAge(routeId);
  score += Math.min(avgVehicleAge * 2, 20); // cap at 20

  // 3. Fleet availability on route
  const spareVehicles = getAvailableVehiclesForRoute(routeId);
  score -= Math.min(spareVehicles * 2, 15); // reduce by availability

  // 4. Time of day (peak hour multiplier)
  const isPeakHour = currentHour >= 7 && currentHour <= 9 ||
                     currentHour >= 16 && currentHour <= 18;
  if (isPeakHour) score += 10;

  // 5. Seasonal adjustment (winter higher risk)
  const month = new Date().getMonth();
  if (month >= 10 || month <= 2) score += 10;

  return Math.min(score, 100);
};
```

#### Alert Thresholds
- Score 0-30: GREEN - Low risk (routine monitoring)
- Score 31-65: AMBER - Medium risk (pre-position spare, brief supervisors)
- Score 66-100: RED - High risk (active contingency plan, call additional support)

#### Data Dependencies
- Historical breakdown data: ✅ Available
- GTFS route-to-vehicle type mappings: Needs creation (routes → typical vehicle types)
- Maintenance schedules: Needs import (if available)

#### Key Metrics to Track
- Prediction accuracy rate (%)
- False positive rate (%)
- Lead time achieved (minutes before breakdown)
- Cost savings from prevented breakdowns

---

### 3. Dynamic Spare Vehicle Allocation
**Priority:** HIGH | **Complexity:** Medium | **Effort:** 28-36 hours | **Expected ROI:** High

#### Description
An intelligent system that recommends optimal placement of spare vehicles across the 6 depots based on real-time demand, GTFS route patterns, and current breakdown incidents. Uses predictive modeling to pre-position vehicles where they're most likely to be needed.

#### Data Source
- **Primary:** GTFS routes (coverage, demand patterns), Fleet vehicles (location, type, availability)
- **Secondary:** Real-time breakdowns, Historical incident patterns
- **Optimization:** Route-to-depot affinity, vehicle type requirements per route

#### Expected Value/Benefit
- **Response Time:** Reduce average substitution vehicle dispatch time from 20-30 mins to 5-10 mins
- **Depot Efficiency:** Balance spare vehicle distribution based on predicted demand
- **Vehicle Utilization:** Maximize usage of available fleet
- **Operational Flexibility:** Recommendations for movement between depots
- **Cost Impact:** 5-10% reduction in overtime for emergency vehicle repositioning

#### Complexity Breakdown
- Allocation Algorithm: 16-20 hours (demand forecasting, optimization logic)
- Backend API: 6-8 hours (real-time calculations, scenario modeling)
- Admin UI: 6-8 hours (recommendations display, execution controls)

#### Implementation Approach
```javascript
// Allocation logic considers:
// 1. Routes assigned to each depot (from GTFS route-depot mapping)
// 2. Current spare vehicle count at each depot
// 3. Active breakdowns requiring substitutions
// 4. Vehicle type compatibility with routes

const optimizeVehicleAllocation = async () => {
  // Step 1: Identify high-demand routes and their home depots
  const routeDemand = await calculateRouteDemandScores();
  // Example: { routeId: "1", depot: "Washington", demandScore: 85 }

  // Step 2: Map routes to required vehicle types
  const routeVehicleRequirements = await getRouteVehicleCompatibility();
  // Example: { "1": ["Enviro", "Wrightbus"], "47": ["Versa"] }

  // Step 3: Current spare vehicle availability
  const spareVehicles = await getAvailableVehiclesByDepot();
  // Example: { Washington: 3, Riverside: 1, Consett: 4, ... }

  // Step 4: Identify mismatches and generate recommendations
  const recommendations = generateRecommendations(
    routeDemand,
    routeVehicleRequirements,
    spareVehicles
  );

  // Example recommendation:
  // {
  //   action: "MOVE",
  //   vehicleId: "6500",
  //   from: "Hexham",
  //   to: "Washington",
  //   reason: "Route 1 high demand, Washington has only 1 spare",
  //   estimatedImpact: "15 min reduction in substitution time"
  // }

  return recommendations;
};
```

#### Constraints & Factors
- **Vehicle Compatibility:** Only assign vehicles compatible with route (double-decker vs single-decker)
- **Maintenance Windows:** Don't recommend vehicles scheduled for maintenance
- **Driver Availability:** Consider driver duty shifts (Duty 100/200/400/500)
- **Distance Optimization:** Minimize reallocation distance between depots
- **Current Assignments:** Don't recommend moving vehicles already assigned to high-priority routes

#### Key Metrics to Track
- Average spare vehicle dispatch time (target: <10 min)
- Vehicle reallocation frequency (should trend down)
- Route substitution success rate (%)
- Depot-to-depot transfer volume

---

### 4. Stop-Level Incident Heatmap
**Priority:** HIGH | **Complexity:** Low | **Effort:** 12-16 hours | **Expected ROI:** High

#### Description
A visual map showing historical breakdown incidents clustered by specific bus stops (from GTFS stops database). Identifies "hotspot" stops where breakdowns frequently occur (mechanical issues, passenger behavior, congestion patterns), enabling targeted prevention and resource planning.

#### Data Source
- **Primary:** GTFS stops (2000+ stops with GPS coordinates), Breakdowns with location data
- **Secondary:** Historical patterns (12+ months if available)
- **Aggregation:** Group breakdowns by nearest GTFS stop

#### Expected Value/Benefit
- **Root Cause Identification:** Discover patterns like "Route 1 breaks down at Central Station 60% of the time"
- **Infrastructure Planning:** Identify stops that need additional maintenance/facilities
- **Operational Planning:** Pre-position resources at high-risk stops
- **Preventive Measures:** Target route optimization or vehicle type changes
- **Cost Savings:** Focus preventive maintenance budgets on high-risk areas

#### Complexity Breakdown
- Geospatial Aggregation: 4-6 hours (stop clustering, heatmap calculation)
- Backend API: 4-6 hours (query optimization, caching)
- Frontend Visualization: 4-4 hours (map rendering, heatmap overlay)

#### Implementation Approach
```sql
-- Query: Identify high-risk stops
SELECT
  gs.stop_id,
  gs.stop_name,
  gs.stop_lat,
  gs.stop_lon,
  COUNT(b.id) as incident_count,
  ROUND(COUNT(b.id) * 100.0 / (
    SELECT COUNT(*) FROM breakdowns WHERE location_description IS NOT NULL
  ), 2) as percentage_of_total,
  GROUP_CONCAT(DISTINCT b.issue_category) as issue_types,
  AVG(DATEDIFF(b.updated_at, b.created_at)) as avg_resolution_time_minutes
FROM gtfs_stops gs
LEFT JOIN breakdowns b ON
  ST_Distance_Sphere(
    POINT(gs.stop_lon, gs.stop_lat),
    POINT(
      ROUND(b.location_lng, 3),
      ROUND(b.location_lat, 3)
    )
  ) < 100  -- Within 100 meters
GROUP BY gs.stop_id, gs.stop_name
ORDER BY incident_count DESC
LIMIT 20;
```

#### Heatmap Visualization
- **Intensity:** Based on incident frequency (Red = hotspot, Yellow = warning, Green = safe)
- **Clustering:** Radius-based clustering for visualization performance
- **Time Filtering:** Filter heatmap by date range and issue type
- **Export:** Download hotspot list for infrastructure planning

#### Key Metrics to Track
- Top 10 highest-risk stops (by incident count)
- Incident concentration (% of all incidents in top 20 stops)
- Trend: Are hotspots improving or worsening?
- Issue type distribution by stop

---

### 5. Passenger Impact Assessment
**Priority:** MEDIUM | **Complexity:** Medium | **Effort:** 20-28 hours | **Expected ROI:** Medium

#### Description
Automatic calculation of passenger impact when a breakdown occurs, using GTFS schedule data to estimate affected passengers based on service time, route type, and trip capacity. Provides supervisors with context for triage and communication decisions.

#### Data Source
- **Primary:** GTFS stop_times (schedules), gtfs_trips (capacity indicators), Breakdowns with location/time
- **Secondary:** Fleet vehicle capacity by type (seats, standing room)
- **Estimation:** Historical passenger loads by route/time (if available)

#### Expected Value/Benefit
- **Supervisor Context:** Understand severity beyond mechanical issues (affects 50 passengers vs. 5 passengers)
- **Communication Prioritization:** High-impact breakdowns get faster decision-making
- **Reporting:** Quantify operational impact for management and planning
- **Service Recovery:** Passenger impact data supports compensation decisions
- **Route Planning:** Identify routes with capacity constraints during peak times

#### Complexity Breakdown
- Impact Calculation: 10-12 hours (schedule analysis, passenger estimation)
- Backend API: 6-8 hours (integration with breakdown creation)
- Frontend Display: 4-8 hours (impact visualization in breakdown details)

#### Implementation Approach
```javascript
// Passenger impact estimation
const assessPassengerImpact = async (breakdownData) => {
  const { location_description, created_at, duration_minutes, fleet_number } = breakdownData;

  // Step 1: Find which routes serve this location
  const affectedRoutes = await matchBreakdownToRoutes(location_description);
  // Returns: [{ routeId: "1", routeName: "Washington-Gateshead", ... }, ...]

  // Step 2: Get schedule for affected routes at breakdown time
  const tripsAtTime = await getTripsAtDateTime(affectedRoutes, created_at);

  // Step 3: Estimate passengers per trip
  let totalEstimatedPassengers = 0;
  for (const trip of tripsAtTime) {
    const tripCapacity = await getTripCapacity(trip); // based on vehicle type
    const estimatedLoad = tripCapacity * 0.65; // empirical average occupancy
    totalEstimatedPassengers += estimatedLoad;
  }

  // Step 4: Calculate impact based on duration
  const impactScore = totalEstimatedPassengers * (duration_minutes / 60);

  return {
    estimatedAffectedPassengers: Math.round(totalEstimatedPassengers),
    estimatedTotalPassengerMinutes: Math.round(impactScore),
    affectedTrips: tripsAtTime.length,
    impactLevel: impactScore > 500 ? 'CRITICAL' :
                 impactScore > 200 ? 'HIGH' :
                 impactScore > 50 ? 'MEDIUM' : 'LOW'
  };
};

// Example output:
// {
//   estimatedAffectedPassengers: 45,
//   estimatedTotalPassengerMinutes: 225,
//   affectedTrips: 3,
//   impactLevel: 'HIGH'
// }
```

#### Data Requirements
- Accurate vehicle capacity by type (needed from fleet data)
- Historical passenger load patterns (may need external source like TomTom or local data)
- Stop-to-location mapping (done via geospatial matching)

#### Challenges & Solutions
- **Challenge:** Not all locations map perfectly to stops
  - **Solution:** Use geospatial distance matching + route matching logic
- **Challenge:** Passenger load varies significantly (rush hour vs. off-peak)
  - **Solution:** Use time-based load factors (weekday vs. weekend, hour of day)
- **Challenge:** No historical passenger count data
  - **Solution:** Use industry standard occupancy rates (60-70% average)

#### Key Metrics to Track
- Average affected passengers per breakdown
- Passenger-minutes of delay (key metric)
- Correlation between impact and resolution time
- Routes with highest passenger impact risk

---

### 6. Route Coverage Analysis Tool
**Priority:** HIGH | **Complexity:** Low | **Effort:** 14-18 hours | **Expected ROI:** High

#### Description
An analysis tool for operations managers showing coverage gaps and redundancy for the 231 bus routes. Answers questions like: "What happens if we lose vehicle type X from depot Y?" and "Which neighborhoods are served by only 1 route?" Supports strategic fleet planning.

#### Data Source
- **Primary:** GTFS routes (all 231 routes with full stop coverage), Fleet vehicles (type, depot assignments)
- **Secondary:** Breakdown history (shows real coverage gaps when breakdowns occur)
- **Geographic:** Stop coordinates (from GTFS)

#### Expected Value/Benefit
- **Strategic Planning:** Data-driven decisions on fleet composition and depot sizing
- **Risk Mitigation:** Identify routes with single-vehicle dependency
- **Route Optimization:** Find opportunities to consolidate or reconfigure routes
- **Redundancy Analysis:** Show which geographic areas have good coverage vs. isolated areas
- **Disaster Planning:** Understand impact of losing specific vehicle types or depots

#### Complexity Breakdown
- Coverage Analysis Algorithm: 6-8 hours (path coverage, redundancy scoring)
- Backend API: 4-6 hours (scenario modeling, caching)
- Analytics Dashboard: 4-4 hours (visualization, filtering, export)

#### Implementation Approach
```sql
-- Coverage Gap Analysis: Find neighborhoods served by only 1-2 routes
SELECT
  gs.zone_id,
  GROUP_CONCAT(DISTINCT gr.route_short_name ORDER BY gr.route_short_name) as serving_routes,
  COUNT(DISTINCT gr.route_id) as route_count,
  COUNT(DISTINCT gs.stop_id) as stop_count,
  CASE
    WHEN COUNT(DISTINCT gr.route_id) = 1 THEN 'CRITICAL'
    WHEN COUNT(DISTINCT gr.route_id) <= 2 THEN 'HIGH_RISK'
    ELSE 'ADEQUATE'
  END as coverage_status
FROM gtfs_stops gs
LEFT JOIN gtfs_stop_times gst ON gs.stop_id = gst.stop_id
LEFT JOIN gtfs_trips gt ON gst.trip_id = gt.trip_id
LEFT JOIN gtfs_routes gr ON gt.route_id = gr.route_id
GROUP BY gs.zone_id
ORDER BY route_count ASC;

-- Fleet Dependency Analysis: What if we lose this vehicle type?
SELECT
  fv.type as vehicle_type,
  COUNT(DISTINCT fv.fleet_number) as count,
  COUNT(DISTINCT CONCAT(fv.depot, ':', fv.type)) as depot_type_combos,
  GROUP_CONCAT(DISTINCT fv.depot) as depots_using,
  GROUP_CONCAT(DISTINCT gr.route_short_name) as routes_using
FROM fleet_vehicles fv
LEFT JOIN gtfs_routes gr ON fv.depot = gr.depot_assignment
GROUP BY fv.type
ORDER BY count DESC;
```

#### Analysis Outputs
1. **Coverage Map** - Visual shows route coverage density by geographic area
2. **Single-Route Neighborhoods** - List of areas served by only 1 route (high risk)
3. **Vehicle Type Dependency** - Impact if specific vehicle types fail
4. **Depot Resilience** - Redundancy scoring for each depot
5. **Scenario Planning** - "If route X loses Y vehicles, what's impact on passengers?"

#### Key Questions Answered
- Which neighborhoods are underserved?
- Which vehicle types are most critical to operations?
- What's the minimum fleet size for depot X?
- If depot X closes, what's the impact?
- Where do we need additional routes?

#### Key Metrics to Track
- Coverage redundancy score (1.0 = single route, >2.0 = good redundancy)
- Population served per route
- Critical single-route neighborhoods (count and population)

---

### 7. Smart Engineer Dispatch
**Priority:** HIGH | **Complexity:** Medium | **Effort:** 32-40 hours | **Expected ROI:** High

#### Description
An intelligent engineer dispatching system that recommends optimal engineer allocation based on real-time breakdowns, engineer location/skill sets, GTFS route structure, and traffic patterns. Reduces dispatch decision time and ensures engineers reach breakdowns faster.

#### Data Source
- **Primary:** Real-time breakdowns (location, type), Fleet vehicles (location), GTFS stops/routes (for routing)
- **Secondary:** Engineer database (location, skills, certifications), Historical resolution times
- **Traffic Data:** Optional integration with routing API (Google Maps, TomTom) for ETA

#### Expected Value/Benefit
- **Response Time:** Reduce engineer dispatch time by 20-30% through optimization
- **Travel Time:** Smarter routing reduces time engineers spend traveling
- **Utilization:** Better allocation ensures engineers aren't underutilized
- **Skills Matching:** Assign engineers with relevant skills/certifications
- **Fairness:** Balanced workload distribution across engineer team

#### Complexity Breakdown
- Dispatch Algorithm: 16-20 hours (optimization logic, skill matching)
- Backend API: 8-10 hours (real-time integration, scenario calculation)
- Mobile UI Update: 8-10 hours (engineer app integration, notifications)

#### Implementation Approach
```javascript
// Engineer dispatch optimization
const smartDispatch = async (breakdownData) => {
  const { location_lat, location_lng, issue_category, severity } = breakdownData;

  // Step 1: Get available engineers and their locations
  const availableEngineers = await getAvailableEngineers();

  // Step 2: Get nearest stops/landmarks for routing
  const nearestStops = await findNearestStops(location_lat, location_lng, 5);

  // Step 3: Score each engineer based on:
  // - Distance to breakdown
  // - Required skill set for issue_category
  // - Current workload
  // - Historical effectiveness for this issue type
  const engineerScores = availableEngineers.map(engineer => {
    let score = 0;

    // Distance scoring (closer = higher score)
    const distance = calculateDistance(engineer.lat, engineer.lng, location_lat, location_lng);
    const distanceScore = Math.max(0, 100 - distance * 2); // decreases with distance
    score += distanceScore * 0.4;

    // Skill matching (has required certification?)
    const hasRequiredSkill = engineer.certifications.includes(
      getRequiredSkillForIssue(issue_category)
    );
    score += hasRequiredSkill ? 30 : 0;

    // Workload balance (less busy = higher score)
    const workloadScore = (100 - engineer.current_workload) * 0.2;
    score += workloadScore;

    // Historical effectiveness (has solved this issue type before?)
    const historicalScore = engineer.stats[issue_category]?.success_rate || 0.5;
    score += historicalScore * 20;

    return {
      engineerId: engineer.id,
      name: engineer.name,
      score: Math.round(score),
      distance,
      eta: calculateETA(engineer.location, nearestStops[0])
    };
  });

  // Step 4: Rank and return top 3 recommendations
  return engineerScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((eng, idx) => ({
      ...eng,
      recommendation: idx === 0 ? 'PRIMARY' : idx === 1 ? 'SECONDARY' : 'TERTIARY'
    }));
};

// Example output:
// [
//   {
//     engineerId: "E001",
//     name: "John Smith",
//     score: 92,
//     distance: 2.3,
//     eta: 8,
//     recommendation: "PRIMARY"
//   },
//   { ... }
// ]
```

#### Smart Matching Factors
1. **Proximity** (40% weight)
   - Current location vs. breakdown location
   - Time to reach (based on GTFS routing + traffic)

2. **Skill Relevance** (30% weight)
   - Issue type vs. engineer certifications
   - Historical success rate for this issue
   - Specialized equipment on hand

3. **Workload** (20% weight)
   - Current job queue
   - Predicted completion time
   - Fairness (balance across engineers)

4. **Availability** (10% weight)
   - On duty (Duty 100/200/400/500)
   - Not in mandatory break period
   - Vehicle status (available for dispatch)

#### Integration Points
- **Breakdown Creation:** Auto-suggest engineer when breakdown is logged
- **Acceptance:** Engineer accepts/declines dispatch via mobile app
- **Reallocation:** If engineer is delayed, system suggests alternatives
- **Closure:** Track engineer performance for future recommendations

#### Key Metrics to Track
- Average dispatch-to-arrival time (target: <20 min)
- Engineer acceptance rate (% of dispatches accepted)
- First-time fix rate (% resolved without callback)
- Engineer utilization rate (%)
- Workload balance (standard deviation of engineer hours)

---

### 8. Seasonal Route Risk Profiles
**Priority:** MEDIUM | **Complexity:** Medium | **Effort:** 24-32 hours | **Expected ROI:** Medium

#### Description
Advanced analytics that build seasonal risk profiles for each route, accounting for weather patterns, passenger volume changes, annual events, and historical seasonal breakdowns. Helps supervisors anticipate demand and resource needs.

#### Data Source
- **Primary:** Historical breakdowns (12+ months minimum), GTFS routes and schedules
- **Secondary:** Weather data (temperature, precipitation), Local event calendar, Passenger load data
- **Aggregation:** Breakdown patterns by route/season/vehicle type

#### Expected Value/Benefit
- **Predictive Staffing:** Know which routes need extra resources in winter/summer
- **Maintenance Scheduling:** Plan preventive maintenance during lower-risk seasons
- **Budget Planning:** Forecast breakdown costs and resource needs by season
- **Passenger Impact:** Understand seasonal stress on fleet
- **Communication:** Proactive messaging to passengers about seasonal challenges

#### Complexity Breakdown
- Seasonal Analysis: 12-16 hours (pattern detection, statistical modeling)
- Backend Reporting: 8-10 hours (API, data aggregation, caching)
- Frontend Visualizations: 4-6 hours (seasonal trend charts)

#### Implementation Approach
```sql
-- Seasonal breakdown analysis
SELECT
  gr.route_short_name,
  QUARTER(b.created_at) as season,
  COUNT(b.id) as incident_count,
  AVG(DATEDIFF(b.updated_at, b.created_at)) as avg_resolution_minutes,
  GROUP_CONCAT(DISTINCT b.issue_category) as issue_types,
  ROUND(AVG(b.health_score), 1) as avg_severity
FROM gtfs_routes gr
LEFT JOIN breakdowns b ON b.breakdown_location LIKE CONCAT('%', gr.route_short_name, '%')
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY gr.route_short_name, QUARTER(b.created_at)
ORDER BY gr.route_short_name, season;

-- Winter-specific analysis (Dec, Jan, Feb)
SELECT
  gr.route_short_name,
  COUNT(DISTINCT YEAR(b.created_at)) as winter_seasons_analyzed,
  COUNT(b.id) / COUNT(DISTINCT YEAR(b.created_at)) as avg_winter_breakdowns,
  GROUP_CONCAT(DISTINCT b.issue_category) as winter_issue_types
FROM gtfs_routes gr
LEFT JOIN breakdowns b ON
  b.breakdown_location LIKE CONCAT('%', gr.route_short_name, '%')
  AND MONTH(b.created_at) IN (12, 1, 2)
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 24 MONTH)
GROUP BY gr.route_short_name
ORDER BY avg_winter_breakdowns DESC;
```

#### Seasonal Risk Profiles
**Spring (Mar-May):** Post-winter maintenance baseline
**Summer (Jun-Aug):** High passenger volume, increased stress
**Fall (Sep-Nov):** Transition period, leaf/debris issues
**Winter (Dec-Feb):** Cold weather, weather-related issues, staff absences

#### Analysis Outputs
1. **Seasonal Risk Index** - Comparative risk (1-10 scale) per season
2. **Issue Type Distribution** - What breaks in summer vs. winter
3. **Resource Recommendations** - Staffing levels per season
4. **Maintenance Calendar** - Optimal times for preventive work
5. **Passenger Impact Forecast** - Expected delays per season

#### Key Metrics to Track
- Seasonal breakdown variance (coefficient of variation)
- Peak season impact (% of annual breakdowns in worst season)
- Seasonal pattern consistency (year-to-year)

---

### 9. Stop Accessibility & Vehicle Matching
**Priority:** MEDIUM | **Complexity:** Low | **Effort:** 16-20 hours | **Expected ROI:** Medium

#### Description
A smart matching system that ensures correct vehicle types are assigned to routes based on stop-level accessibility requirements. Uses GTFS wheelchair accessibility data to flag when non-accessible vehicles are assigned to accessible-required stops.

#### Data Source
- **Primary:** GTFS stops (wheelchair_boarding field), Fleet vehicles (accessibility features), Routes (stop assignments)
- **Secondary:** Regulatory requirements, Fleet capabilities database

#### Expected Value/Benefit
- **Compliance:** Ensure regulatory accessibility requirements are met
- **Passenger Service:** Reduce service failures for passengers with mobility needs
- **Planning:** Identify routes needing vehicle replacement or retrofitting
- **Liability:** Reduce risk of accessibility-related complaints/legal issues
- **Vehicle Assignment:** Optimize vehicle type selection based on accessibility

#### Complexity Breakdown
- Stop Accessibility Mapping: 6-8 hours (GTFS data enrichment, requirement rules)
- Backend Matching: 6-8 hours (vehicle-to-route compatibility)
- Frontend Alerts: 4-4 hours (admin notifications)

#### Implementation Approach
```sql
-- Identify routes with accessibility requirements
SELECT
  gr.route_id,
  gr.route_short_name,
  COUNT(CASE WHEN gs.wheelchair_boarding = 1 THEN 1 END) as wheelchair_accessible_stops,
  COUNT(DISTINCT gs.stop_id) as total_stops,
  ROUND(COUNT(CASE WHEN gs.wheelchair_boarding = 1 THEN 1 END) * 100.0 /
    COUNT(DISTINCT gs.stop_id), 1) as pct_accessible_stops,
  CASE
    WHEN COUNT(CASE WHEN gs.wheelchair_boarding = 1 THEN 1 END) > 0 THEN 'REQUIRES_ACCESSIBLE_VEHICLE'
    ELSE 'STANDARD_VEHICLE_OK'
  END as vehicle_requirement
FROM gtfs_routes gr
LEFT JOIN gtfs_stop_times gst ON gr.route_id = gst.route_id
LEFT JOIN gtfs_stops gs ON gst.stop_id = gs.stop_id
GROUP BY gr.route_id
ORDER BY pct_accessible_stops DESC;

-- Check fleet compatibility
SELECT
  fv.fleet_number,
  fv.type,
  fv.has_wheelchair_lift,
  fv.depot,
  COUNT(DISTINCT CASE WHEN gr.vehicle_requirement = 'REQUIRES_ACCESSIBLE_VEHICLE'
    THEN gr.route_id ELSE NULL END) as assigned_accessible_routes,
  CASE
    WHEN fv.has_wheelchair_lift = 1 THEN 'COMPLIANT'
    WHEN fv.has_wheelchair_lift = 0 THEN 'NON_COMPLIANT'
    ELSE 'UNKNOWN'
  END as accessibility_status
FROM fleet_vehicles fv
LEFT JOIN gtfs_routes gr ON fv.depot = gr.depot_assignment
GROUP BY fv.fleet_number;
```

#### Compliance Rules
- Routes with any wheelchair-accessible stops MUST be served by accessible vehicles
- During peak hours, allocate accessible vehicles based on demand patterns
- Flag non-compliant assignments in real-time
- Track accessibility compliance metrics

#### Key Metrics to Track
- % of routes with proper vehicle matching
- Accessibility compliance score (0-100%)
- Non-compliant assignments (number and duration)
- Routes needing vehicle upgrades

---

### 10. Real-Time Passenger Notifications
**Priority:** MEDIUM | **Complexity:** High | **Effort:** 40-48 hours | **Expected ROI:** Medium

#### Description
A system that automatically sends real-time notifications to passengers on affected routes when breakdowns occur, using GTFS data to identify affected stops and trips. Integrates with passenger notification platforms (SMS, push, website) to keep passengers informed.

#### Data Source
- **Primary:** Real-time breakdowns, GTFS routes/stops/trips, Passenger database (if available)
- **Secondary:** Expected delay calculations, Alternative route suggestions
- **Integration Points:** SMS gateway, Push notification service, Website API

#### Expected Value/Benefit
- **Passenger Satisfaction:** Real-time information reduces frustration and anxiety
- **Customer Service:** Reduces call volume to customer service with proactive comms
- **Safety:** Passengers can make alternative plans (don't wait indefinitely)
- **Reputation:** Go North East seen as transparent and customer-focused
- **Accessibility:** Supports multimodal journey planning (bus + other transit)

#### Complexity Breakdown
- Message Generation Logic: 12-16 hours (impact analysis, messaging)
- Notification Gateway Integration: 12-16 hours (SMS/push API, rate limiting)
- Frontend Notifications: 8-12 hours (website banners, mobile app)
- Admin Controls: 8-4 hours (message approval, manual override)

#### Implementation Approach
```javascript
// Passenger notification system
const notifyPassengersOfBreakdown = async (breakdownData) => {
  const { location_lat, location_lng, severity, expected_delay_minutes } = breakdownData;

  // Step 1: Find affected routes and stops
  const affectedRoutes = await findRoutesNearLocation(location_lat, location_lng);
  const affectedStops = await findStopsNearLocation(location_lat, location_lng, 500); // 500m radius

  // Step 2: Identify passenger audience
  const passengerLists = affectedRoutes.map(route => ({
    route: route.route_short_name,
    stops: affectedStops.map(s => s.stop_name),
    // Subscribers to this route (if available)
    subscribers: await getRouteSubscribers(route.route_id)
  }));

  // Step 3: Compose message based on severity
  const messages = passengerLists.map(pl => ({
    title: `Service update: Route ${pl.route}`,
    body: `There's a vehicle breakdown affecting Route ${pl.route}.
           Expected delay: ${expected_delay_minutes} minutes.
           Alternative routes: ${getAlternativeRoutes(pl.route).join(', ')}`,
    severity: severity === 'STOP' ? 'critical' : 'warning',
    actionUrl: `https://breakdowns.gobarry.co.uk/route/${pl.route}`
  }));

  // Step 4: Send notifications via multiple channels
  for (const message of messages) {
    if (message.severity === 'critical') {
      // Send SMS to subscribed passengers
      await sendSMSNotifications(message, passengerLists);

      // Push notification to mobile app users
      await sendPushNotifications(message, passengerLists);
    }

    // Always update website/app
    await updateLiveServiceBulletins(message);
  }

  // Step 5: Track notification effectiveness
  await trackNotificationMetrics({
    breakdownId: breakdownData.id,
    routesAffected: affectedRoutes.length,
    passengersNotified: passengerLists.reduce((sum, pl) => sum + pl.subscribers.length, 0),
    channels: ['sms', 'push', 'website']
  });
};
```

#### Notification Channels
1. **Website Banner** - Permanent on site showing current service updates
2. **Mobile App Push** - For subscribers to specific routes
3. **SMS** - For subscribers who opted in
4. **Real-time Display** - At bus stops (if displays available)
5. **Social Media** - Official Go North East Twitter/Facebook

#### Message Customization
```
CRITICAL (STOP severity):
"Route {number} SUSPENDED. Breakdown at {stop}.
Expected resume: {time}. Use alternative routes: {alternates}.
Visit breakdowns.gobarry.co.uk for updates."

HIGH (15+ min delay):
"Route {number} DELAYED {minutes} mins. Breakdown affecting {stop}.
Alternative routes available: {alternates}."

MEDIUM (5-15 min delay):
"Route {number} running {minutes} minutes late due to vehicle issue."
```

#### Challenges & Solutions
- **Challenge:** Privacy - don't expose sensitive operational data
  - **Solution:** Show only route number and general area, not exact location
- **Challenge:** Message fatigue - avoid over-notifying
  - **Solution:** Consolidate messages, send only major incidents
- **Challenge:** Outdated information - passengers see wrong info
  - **Solution:** Auto-expire messages, provide cancel option
- **Challenge:** Alternative route complexity - hard to explain quickly
  - **Solution:** Link to journey planner, show only 2-3 best alternatives

#### Key Metrics to Track
- Notification delivery rate (%)
- Read rate (% who clicked through)
- Sentiment analysis (feedback from passengers)
- Service satisfaction correlation (breakdowns with notifications = higher satisfaction?)
- Cost per notification
- Channel effectiveness (SMS vs. push vs. website)

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4) - 48-64 hours
**Focus:** High-impact, low-complexity features

1. **Live Route Status Dashboard** (16-20 hrs)
   - Backend: Route status aggregation API
   - Frontend: Real-time dashboard with color coding
   - WebSocket: Real-time updates when routes change status

2. **Stop-Level Incident Heatmap** (12-16 hrs)
   - Geospatial clustering of breakdowns to stops
   - Heatmap visualization on map
   - Admin-facing analytics dashboard

3. **Route Coverage Analysis Tool** (14-18 hrs)
   - Coverage gap analysis queries
   - Vehicle type dependency analysis
   - Scenario planning UI

**Phase 1 Outcome:** Supervisors gain instant visibility into operational status and can answer strategic questions about coverage and redundancy.

---

### Phase 2: Optimization (Weeks 5-8) - 52-68 hours
**Focus:** Medium-complexity features that improve resource efficiency

4. **Predictive Route Disruption Alerts** (24-32 hrs)
   - Historical pattern analysis
   - Risk scoring algorithm
   - Alert system integration

5. **Dynamic Spare Vehicle Allocation** (28-36 hrs)
   - Allocation optimization algorithm
   - Real-time recommendation system
   - Admin approval workflow

**Phase 2 Outcome:** Supervisors can proactively position resources and anticipate disruptions, reducing response time by 20-30%.

---

### Phase 3: Intelligence (Weeks 9-12) - 44-60 hours
**Focus:** Advanced features that provide deeper operational insights

6. **Smart Engineer Dispatch** (32-40 hrs)
   - Dispatch optimization algorithm
   - Skill matching logic
   - Mobile app integration

7. **Seasonal Route Risk Profiles** (24-32 hrs)
   - Multi-year seasonal analysis
   - Risk forecasting
   - Reporting dashboard

8. **Passenger Impact Assessment** (20-28 hrs)
   - Impact calculation engine
   - Integration with breakdown workflow
   - Visualization and reporting

**Phase 3 Outcome:** Supervisors make data-driven decisions backed by comprehensive impact analysis. System learns from patterns and improves recommendations over time.

---

### Phase 4: Advanced (Weeks 13-18) - 56-68 hours
**Focus:** Specialized features and external integrations

9. **Stop Accessibility & Vehicle Matching** (16-20 hrs)
   - Accessibility requirement mapping
   - Compliance alerts
   - Vehicle assignment optimization

10. **Real-Time Passenger Notifications** (40-48 hrs)
    - Notification generation system
    - Multi-channel delivery (SMS, push, website)
    - Message tracking and analytics

**Phase 4 Outcome:** Full-stack operational system with external customer-facing notifications and advanced compliance management.

---

## Technical Architecture Requirements

### Database Enhancements Needed

```sql
-- 1. Route-to-Depot Mapping (missing)
CREATE TABLE route_depot_mapping (
  route_id VARCHAR(100),
  home_depot VARCHAR(50),
  primary_vehicle_type VARCHAR(50),
  accessibility_required BOOLEAN,
  peak_demand_factor DECIMAL(3,2),
  FOREIGN KEY (route_id) REFERENCES gtfs_routes(route_id),
  PRIMARY KEY (route_id, home_depot)
);

-- 2. Vehicle Capabilities (enhance fleet_vehicles)
ALTER TABLE fleet_vehicles ADD COLUMN (
  has_wheelchair_lift BOOLEAN DEFAULT 0,
  max_passenger_capacity INT,
  accessible_capacity INT,
  low_floor_bus BOOLEAN DEFAULT 0
);

-- 3. Engineer Skills & Location (new)
CREATE TABLE engineer_profiles (
  engineer_id INT PRIMARY KEY,
  name VARCHAR(100),
  depot VARCHAR(50),
  certifications JSON,
  current_location POINT,
  current_workload INT,
  FOREIGN KEY (depot) REFERENCES depots(depot_name)
);

-- 4. Breakdown Impact Tracking (enhance breakdowns table)
ALTER TABLE breakdowns ADD COLUMN (
  estimated_passenger_impact INT,
  actual_passenger_impact INT,
  affected_route_ids JSON,
  affected_stop_ids JSON,
  notification_sent_at TIMESTAMP NULL
);
```

### API Endpoints to Create

```
NEW ENDPOINTS REQUIRED:

Core Analytics:
- GET /api/analytics/route-status - Live status for all 231 routes
- GET /api/analytics/stop-heatmap - Incident clustering by stop
- GET /api/analytics/coverage-analysis - Coverage gap analysis
- GET /api/analytics/route-risks/:seasonCode - Seasonal risk profiles

Operational Planning:
- GET /api/operations/predict-disruptions - Predictive alerts
- GET /api/operations/spare-allocation - Vehicle allocation recommendations
- GET /api/operations/engineer-dispatch - Smart dispatch recommendations
- POST /api/operations/dispatch/:engineerId/:breakdownId - Execute dispatch

Passenger Communication:
- POST /api/notifications/broadcast - Send bulk notifications
- GET /api/notifications/queue - View pending notifications
- GET /api/notifications/history - Notification delivery tracking

Admin Tools:
- GET /api/admin/vehicle-compliance - Accessibility compliance report
- POST /api/admin/update-route-mapping - Update route-depot associations
- GET /api/admin/impact-assessment/:breakdownId - Detailed impact analysis
```

### Frontend Components to Build

```
Pages:
- /dashboard/operations - Main supervisor dashboard
- /analytics/routes - Route status dashboard
- /analytics/heatmap - Stop-level incident heatmap
- /analytics/planning - Strategic coverage analysis
- /alerts/predictions - Predictive disruption alerts
- /operations/allocations - Spare vehicle allocations
- /operations/dispatch - Engineer dispatch interface
- /admin/accessibility - Vehicle-stop compatibility matrix

Shared Components:
- RouteStatusCard - Shows route health with drill-down
- HeatmapVisualization - Interactive incident map
- PredictionAlert - Shows upcoming disruption risk
- AllocationRecommendation - Shows vehicle move suggestion
- DispatchPanel - Engineer assignment interface
- ImpactBadge - Shows passenger impact indicator
```

---

## Data Quality & Dependencies

### Currently Available ✅
- GTFS routes (231 routes) - imported
- GTFS stops (2000+ stops) - imported
- GTFS trips and schedules - imported
- Fleet vehicles (1000+) - in database
- Breakdown history - 12+ months available
- Supervisor accounts and sessions - available

### Needs Import/Enhancement ⚠️
- **Route-to-Depot Mapping** - Which routes are primarily served by which depots?
- **Vehicle Accessibility Features** - Which vehicles have wheelchair lifts, low floors, etc.?
- **Engineer Skill Certifications** - What's each engineer trained/certified to repair?
- **Stop Accessibility Data** - Wheelchair boarding field in GTFS needs verification
- **Vehicle Maintenance Schedules** - Upcoming maintenance windows
- **Historical Passenger Loads** - By route/time for impact estimation (optional)
- **Traffic/Routing Data** - TomTom/HERE API for ETA calculations

### Optional Enhancements
- Weather data (temperature, precipitation for seasonal analysis)
- Local event calendar (concerts, sports, increases in demand)
- External passenger information system integration
- Social media feed monitoring (for real-time incident discovery)
- Competitor route information (for alternative route recommendations)

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Incorrect route-to-stop matching | High | Medium | Implement QA validation, manual review process |
| Stale GTFS data | Medium | Medium | Automated update checks, version tracking |
| Passenger notification spam | Medium | High | Message consolidation, opt-in controls |
| Accessibility compliance gaps | Medium | High | Comprehensive vehicle audit before launch |
| Engineer dispatch rejection rate | Medium | Medium | Refine algorithm based on actual usage |
| Inaccurate passenger impact estimates | High | Low | Use conservative estimates, validate with TomTom |
| Data privacy concerns (notifications) | Low | High | PII scrubbing, anonymization, GDPR compliance |

---

## Success Metrics & KPIs

### Target Improvements (6-12 months after implementation)

| Metric | Current | Target | Feature(s) |
|--------|---------|--------|-----------|
| Avg breakdown response time | 20-25 min | 12-15 min | Smart Dispatch, Allocation, Alerts |
| Route status visibility | Manual | Real-time | Live Dashboard, Alerts |
| Supervisor decision time | 10-15 min | 2-5 min | Dashboards, Impact Assessment |
| Engineer first-arrival time | 25-30 min | 15-20 min | Smart Dispatch |
| Spare vehicle dispatch time | 20-30 min | 5-10 min | Dynamic Allocation |
| Accessibility compliance | Unknown | >99% | Stop-Vehicle Matching |
| Passenger impact awareness | Qualitative | Quantified | Impact Assessment, Notifications |
| Coverage redundancy visibility | None | Full analysis | Coverage Analysis |

---

## Budget & Resource Estimation

### Total Development Effort
- **Phase 1 (Weeks 1-4):** 48-64 hours
- **Phase 2 (Weeks 5-8):** 52-68 hours
- **Phase 3 (Weeks 9-12):** 44-60 hours
- **Phase 4 (Weeks 13-18):** 56-68 hours
- **Testing & QA:** 40-60 hours (across all phases)
- **Deployment & Documentation:** 16-24 hours

**Total: 256-344 hours (6-9 months for 1 FTE engineer)**

### Resource Requirements
- 1x Backend Engineer (Node.js + SQL)
- 1x Frontend Engineer (React)
- 1x Data Analyst (SQL optimization, reporting)
- 0.5x QA Tester
- 0.25x DevOps (deployment, monitoring)
- 0.25x Product Manager (requirements, feedback collection)

### Cost-Benefit Analysis
- **Implementation Cost:** 256-344 hours × $75-150/hour = $19,200-$51,600
- **Annual Benefits:**
  - 15-20% reduction in breakdown response time = ~$30,000 in efficiency gains
  - 5-10% reduction in overtime costs = ~$15,000 savings
  - Improved passenger satisfaction = potential revenue (better reputation)
  - Reduced compliance issues = avoided penalties/liability

**ROI: Positive in 3-6 months**

---

## Competitive Advantages

These features position Go North East ahead of competitors by providing:

1. **Operational Transparency** - Real-time visibility into fleet status (vs. competitors' delays)
2. **Data-Driven Decision Making** - Predictive analytics guide resource allocation
3. **Customer Communication** - Real-time passenger notifications improve satisfaction
4. **Compliance Assurance** - Automated accessibility verification ensures legal compliance
5. **Supervisor Empowerment** - Tools that make supervisors more effective
6. **Strategic Planning** - Long-term insights support network optimization

---

## Next Steps

### Week 1 Action Items
1. **Data Validation** - Verify GTFS stop accessibility data (wheelchair_boarding field)
2. **Route Mapping** - Create route-to-depot associations
3. **Stakeholder Review** - Get supervisor feedback on priorities
4. **Architecture Review** - Confirm database schema changes with team
5. **Quick Wins** - Start with Phase 1 features (highest ROI)

### Week 2-4
1. Begin Phase 1 implementation
2. Establish testing framework
3. Create monitoring dashboards
4. Set up deployment pipeline

### Month 2+
1. Roll out Phase 2 optimization features
2. Gather user feedback and iterate
3. Measure KPI improvements
4. Plan Phase 3-4 based on results

---

## Conclusion

The combination of GTFS data (route/stop structure) and Fleet data (vehicle assignments) creates a powerful opportunity to build an industry-leading breakdown management system. These 10 features represent a complete transformation of operational visibility and decision-making capability.

**Key Takeaway:** Start with Phase 1 (Live Dashboard + Heatmap + Coverage Analysis) to deliver immediate value within 4 weeks, then build progressively toward more sophisticated features. Each phase builds on previous work and generates user feedback to guide priorities.

The 144-288 hour investment will deliver 3-6 months ROI through efficiency gains, cost savings, and improved operational resilience.

