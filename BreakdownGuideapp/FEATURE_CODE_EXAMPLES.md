# Feature Implementation Code Examples
**Go BARRY Breakdown Management System**

This document provides working code examples and database queries for implementing the 10 featured features.

---

## Feature 1: Live Route Status Dashboard

### Database Query
```sql
-- Get current status of all routes
SELECT
  gr.route_id,
  gr.route_short_name,
  gr.route_long_name,
  gr.route_color,
  COUNT(DISTINCT b.id) as active_breakdowns,
  MAX(b.severity) as max_severity,
  CASE
    WHEN COUNT(b.id) > 1 THEN 'RED'
    WHEN COUNT(b.id) = 1 THEN 'AMBER'
    ELSE 'GREEN'
  END as status,
  ROUND(
    SUM(CASE WHEN b.status IN ('pending', 'in-progress') THEN 1 ELSE 0 END) * 100.0 /
    NULLIF(COUNT(DISTINCT gst.trip_id), 0), 2
  ) as service_impact_percent
FROM gtfs_routes gr
LEFT JOIN breakdowns b ON
  (b.status IN ('pending', 'in-progress', 'reviewing'))
  AND (
    b.breakdown_location LIKE CONCAT('%', gr.route_short_name, '%')
    OR b.affected_route_ids LIKE CONCAT('%', gr.route_id, '%')
  )
LEFT JOIN gtfs_trips gt ON gr.route_id = gt.route_id
LEFT JOIN gtfs_stop_times gst ON gt.trip_id = gst.trip_id
GROUP BY gr.route_id, gr.route_short_name, gr.route_long_name, gr.route_color
ORDER BY FIELD(status, 'RED', 'AMBER', 'GREEN'), active_breakdowns DESC;
```

### Backend API (Node.js)
```javascript
// backend/routes/analytics.js - Add this endpoint
import express from 'express';
import { query } from '../config/mysql.js';
import { authenticateSupervisor } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/analytics/route-status
router.get('/route-status', authenticateSupervisor, async (req, res) => {
  try {
    const sql = `
      SELECT
        gr.route_id,
        gr.route_short_name,
        gr.route_long_name,
        gr.route_color,
        gr.route_text_color,
        COUNT(DISTINCT CASE WHEN b.status IN ('pending', 'in-progress') THEN b.id END) as active_breakdowns,
        GROUP_CONCAT(DISTINCT b.severity) as severity_types,
        CASE
          WHEN COUNT(DISTINCT CASE WHEN b.status IN ('pending', 'in-progress') THEN b.id END) > 1 THEN 'RED'
          WHEN COUNT(DISTINCT CASE WHEN b.status IN ('pending', 'in-progress') THEN b.id END) = 1 THEN 'AMBER'
          ELSE 'GREEN'
        END as status,
        ROUND(AVG(b.estimated_delay_minutes), 0) as avg_delay_minutes,
        MAX(b.created_at) as latest_incident_time
      FROM gtfs_routes gr
      LEFT JOIN breakdowns b ON
        b.status IN ('pending', 'in-progress', 'reviewing')
        AND (
          b.breakdown_location LIKE CONCAT('%', gr.route_short_name, '%')
          OR b.affected_route_ids LIKE CONCAT('%', gr.route_id, '%')
        )
      GROUP BY gr.route_id, gr.route_short_name, gr.route_long_name, gr.route_color, gr.route_text_color
      ORDER BY FIELD(status, 'RED', 'AMBER', 'GREEN'), active_breakdowns DESC
    `;

    const routes = await query(sql);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      routes: routes,
      summary: {
        total_routes: routes.length,
        red_routes: routes.filter(r => r.status === 'RED').length,
        amber_routes: routes.filter(r => r.status === 'AMBER').length,
        green_routes: routes.filter(r => r.status === 'GREEN').length,
        total_active_incidents: routes.reduce((sum, r) => sum + r.active_breakdowns, 0)
      }
    });
  } catch (error) {
    console.error('Route status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### Frontend Component
```jsx
// frontend/src/components/RouteStatusDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RouteStatusDashboard() {
  const [routes, useState] = useState([]);
  const [filter, setFilter] = useState('all'); // all, red, amber, green
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRouteStatus();
    const interval = setInterval(fetchRouteStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRouteStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/route-status');
      setRoutes(response.data.routes);
    } catch (error) {
      console.error('Error fetching route status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'RED': return 'bg-red-500 text-white';
      case 'AMBER': return 'bg-yellow-500 text-white';
      case 'GREEN': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredRoutes = routes.filter(route => {
    if (filter === 'all') return true;
    return route.status === filter.toUpperCase();
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Route Status Dashboard</h1>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-4">
          {['all', 'red', 'amber', 'green'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {f.toUpperCase()} ({routes.filter(r => f === 'all' || r.status === f.toUpperCase()).length})
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-red-100 p-4 rounded">
            <div className="text-red-600 font-bold">Red Routes</div>
            <div className="text-2xl">{routes.filter(r => r.status === 'RED').length}</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded">
            <div className="text-yellow-600 font-bold">Amber Routes</div>
            <div className="text-2xl">{routes.filter(r => r.status === 'AMBER').length}</div>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <div className="text-green-600 font-bold">Green Routes</div>
            <div className="text-2xl">{routes.filter(r => r.status === 'GREEN').length}</div>
          </div>
          <div className="bg-blue-100 p-4 rounded">
            <div className="text-blue-600 font-bold">Active Incidents</div>
            <div className="text-2xl">{routes.reduce((sum, r) => sum + r.active_breakdowns, 0)}</div>
          </div>
        </div>
      </div>

      {/* Route cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutes.map(route => (
          <div key={route.route_id} className="border rounded-lg p-4 hover:shadow-lg transition">
            {/* Status badge */}
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 ${getStatusColor(route.status)}`}>
              {route.status}
            </div>

            {/* Route info */}
            <div className="mb-3">
              <h3 className="text-xl font-bold">
                <span style={{ color: `#${route.route_color}` }} className="mr-2">■</span>
                Route {route.route_short_name}
              </h3>
              <p className="text-gray-600 text-sm">{route.route_long_name}</p>
            </div>

            {/* Incidents */}
            {route.active_breakdowns > 0 && (
              <div className="bg-red-50 p-3 rounded mb-3">
                <div className="font-bold text-red-600">
                  {route.active_breakdowns} Active {route.active_breakdowns === 1 ? 'Incident' : 'Incidents'}
                </div>
                {route.avg_delay_minutes > 0 && (
                  <div className="text-sm text-red-600">
                    Avg Delay: {route.avg_delay_minutes} minutes
                  </div>
                )}
              </div>
            )}

            {/* Last update */}
            <div className="text-xs text-gray-500">
              Last update: {new Date(route.latest_incident_time).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-center py-4">Updating...</div>}
    </div>
  );
}
```

---

## Feature 2: Stop-Level Incident Heatmap

### Database Query
```sql
-- Find incidents grouped by nearest stop (geospatial clustering)
SELECT
  gs.stop_id,
  gs.stop_name,
  gs.stop_lat,
  gs.stop_lon,
  gs.zone_id,
  COUNT(DISTINCT b.id) as incident_count,
  GROUP_CONCAT(DISTINCT b.fleet_number) as affected_vehicles,
  GROUP_CONCAT(DISTINCT b.issue_category SEPARATOR ', ') as issue_types,
  ROUND(AVG(DATEDIFF(b.updated_at, b.created_at)), 1) as avg_resolution_minutes,
  GROUP_CONCAT(DISTINCT DATE(b.created_at)) as incident_dates
FROM gtfs_stops gs
LEFT JOIN breakdowns b ON
  ST_Distance_Sphere(
    POINT(gs.stop_lon, gs.stop_lat),
    POINT(b.location_lng, b.location_lat)
  ) < 200  -- Within 200 meters of stop
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY gs.stop_id, gs.stop_name, gs.stop_lat, gs.stop_lon, gs.zone_id
HAVING COUNT(DISTINCT b.id) > 0
ORDER BY incident_count DESC
LIMIT 50;
```

### Backend API
```javascript
// backend/routes/analytics.js - Add this endpoint
router.get('/stop-heatmap', authenticateSupervisor, async (req, res) => {
  try {
    const { days = 90, minIncidents = 0 } = req.query;

    const sql = `
      SELECT
        gs.stop_id,
        gs.stop_name,
        gs.stop_lat,
        gs.stop_lon,
        COUNT(DISTINCT b.id) as incident_count,
        ROUND(AVG(DATEDIFF(b.updated_at, b.created_at)), 1) as avg_resolution_minutes
      FROM gtfs_stops gs
      LEFT JOIN breakdowns b ON
        ST_Distance_Sphere(
          POINT(gs.stop_lon, gs.stop_lat),
          POINT(b.location_lng, b.location_lat)
        ) < 200
        AND b.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY gs.stop_id, gs.stop_name, gs.stop_lat, gs.stop_lon
      HAVING COUNT(DISTINCT b.id) >= ?
      ORDER BY incident_count DESC
      LIMIT 100
    `;

    const hotspots = await query(sql, [parseInt(days), parseInt(minIncidents)]);

    // Calculate heatmap intensity (0-100)
    const maxIncidents = Math.max(...hotspots.map(h => h.incident_count), 1);
    const heatmapData = hotspots.map(spot => ({
      ...spot,
      intensity: Math.round((spot.incident_count / maxIncidents) * 100),
      riskLevel: spot.incident_count > 5 ? 'CRITICAL' :
                 spot.incident_count > 3 ? 'HIGH' : 'MEDIUM'
    }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      period_days: days,
      hotspots: heatmapData,
      stats: {
        total_hotspots: heatmapData.length,
        critical: heatmapData.filter(h => h.riskLevel === 'CRITICAL').length,
        high: heatmapData.filter(h => h.riskLevel === 'HIGH').length,
        total_incidents_in_hotspots: heatmapData.reduce((sum, h) => sum + h.incident_count, 0)
      }
    });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Frontend Map Component
```jsx
// frontend/src/components/StopHeatmap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import axios from 'axios';

export default function StopHeatmap() {
  const [hotspots, setHotspots] = useState([]);
  const [mapCenter, setMapCenter] = useState([54.975, -1.6]); // Newcastle center

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const response = await axios.get('/api/analytics/stop-heatmap?days=90');
        setHotspots(response.data.hotspots);
      } catch (error) {
        console.error('Error fetching heatmap:', error);
      }
    };
    fetchHeatmap();
  }, []);

  const getColor = (intensity) => {
    if (intensity > 75) return '#dc2626'; // Red - Critical
    if (intensity > 50) return '#f97316'; // Orange - High
    if (intensity > 25) return '#eab308'; // Yellow - Medium
    return '#22c55e'; // Green - Low
  };

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={mapCenter}
        zoom={11}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {hotspots.map(spot => (
          <CircleMarker
            key={spot.stop_id}
            center={[spot.stop_lat, spot.stop_lon]}
            radius={Math.sqrt(spot.incident_count) * 3}
            fillColor={getColor(spot.intensity)}
            fillOpacity={0.7}
            stroke={true}
            color="#000"
            weight={2}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{spot.stop_name}</h3>
                <p>Incidents: {spot.incident_count}</p>
                <p>Avg Resolution: {spot.avg_resolution_minutes} min</p>
                <p>Risk: {spot.riskLevel}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
```

---

## Feature 4: Predictive Route Disruption Alerts

### Prediction Algorithm
```javascript
// backend/services/predictiveAlerts.js
import { query } from '../config/mysql.js';

export async function calculateRouteRiskScores() {
  try {
    // Get all routes
    const routes = await query(`
      SELECT route_id, route_short_name
      FROM gtfs_routes
      WHERE route_short_name IS NOT NULL
      LIMIT 231
    `);

    const riskScores = [];

    for (const route of routes) {
      const score = await calculateRiskForRoute(route);
      if (score.riskScore > 30) {
        riskScores.push(score);
      }
    }

    // Sort by risk score descending
    return riskScores.sort((a, b) => b.riskScore - a.riskScore);
  } catch (error) {
    console.error('Risk calculation error:', error);
    return [];
  }
}

async function calculateRiskForRoute(route) {
  let score = 0;
  const factors = {};

  // Factor 1: Historical breakdown frequency (40% weight)
  const breakdownHistory = await query(`
    SELECT
      COUNT(*) as count,
      AVG(DATEDIFF(updated_at, created_at)) as avg_resolution_mins
    FROM breakdowns
    WHERE breakdown_location LIKE CONCAT('%', ?, '%')
    AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
  `, [route.route_short_name]);

  const historicalRate = (breakdownHistory[0]?.count || 0) / 30; // Per day
  factors.historical = Math.min(historicalRate * 20, 40); // 0-40 points
  score += factors.historical;

  // Factor 2: Fleet age for vehicles assigned to this route (30% weight)
  const avgFleetAge = await query(`
    SELECT AVG(YEAR(NOW()) - registration_year) as avg_age
    FROM fleet_vehicles
    WHERE depot IN (
      SELECT DISTINCT depot FROM fleet_vehicles LIMIT 100
    )
  `);

  factors.fleetAge = Math.min((avgFleetAge[0]?.avg_age || 5) * 3, 30);
  score += factors.fleetAge;

  // Factor 3: Current spare vehicle availability (20% weight)
  const spareVehicles = await query(`
    SELECT COUNT(*) as spare_count
    FROM fleet_vehicles
    WHERE status = 'available'
    AND depot IN (
      SELECT DISTINCT depot FROM fleet_vehicles
      WHERE fleet_number IN (
        SELECT DISTINCT fleet_no FROM breakdowns
        WHERE breakdown_location LIKE CONCAT('%', ?, '%')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
    )
  `, [route.route_short_name]);

  const spareAvailability = spareVehicles[0]?.spare_count || 0;
  factors.spareAvailability = Math.max(20 - spareAvailability * 2, 0); // 0-20 points
  score += factors.spareAvailability;

  // Factor 4: Time of day multiplier (10% weight - peak hours higher risk)
  const currentHour = new Date().getHours();
  const isPeakHour = (currentHour >= 7 && currentHour <= 9) ||
                     (currentHour >= 16 && currentHour <= 18);
  factors.peakHour = isPeakHour ? 10 : 0;
  score += factors.peakHour;

  // Seasonal adjustment
  const month = new Date().getMonth();
  const isWinter = month >= 10 || month <= 2;
  factors.seasonal = isWinter ? 10 : 0;
  score += factors.seasonal;

  return {
    routeId: route.route_id,
    routeName: route.route_short_name,
    riskScore: Math.min(Math.round(score), 100),
    riskLevel: score > 65 ? 'RED' : score > 40 ? 'AMBER' : 'GREEN',
    factors: factors,
    recommendations: generateRecommendations(score, route)
  };
}

function generateRecommendations(score, route) {
  const recommendations = [];

  if (score > 65) {
    recommendations.push({
      action: 'PREPOSITION_SPARE_VEHICLE',
      priority: 'IMMEDIATE',
      description: `Pre-position spare vehicle for Route ${route.route_short_name}`,
      estimatedImpact: 'Reduce substitution dispatch time by 15 minutes'
    });
    recommendations.push({
      action: 'BRIEF_SUPERVISOR',
      priority: 'IMMEDIATE',
      description: 'Brief supervisor on potential service disruption'
    });
  } else if (score > 40) {
    recommendations.push({
      action: 'MONITOR_CLOSELY',
      priority: 'HIGH',
      description: `Monitor Route ${route.route_short_name} for early warning signs`
    });
  }

  return recommendations;
}
```

### Backend API Endpoint
```javascript
// backend/routes/analytics.js
router.get('/predict-disruptions', authenticateSupervisor, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const predictions = await calculateRouteRiskScores();
    const topRisks = predictions.slice(0, parseInt(limit));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      predictions: topRisks,
      summary: {
        high_risk_routes: topRisks.filter(p => p.riskLevel === 'RED').length,
        medium_risk_routes: topRisks.filter(p => p.riskLevel === 'AMBER').length,
        next_update: new Date(Date.now() + 15 * 60000).toISOString()
      }
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Feature 5: Passenger Impact Assessment

### Calculation Logic
```javascript
// backend/services/impactAssessment.js
import { query } from '../config/mysql.js';

export async function assessBreakdownImpact(breakdownData) {
  try {
    const { location_lat, location_lng, created_at, issue_category } = breakdownData;

    // Step 1: Find affected routes
    const affectedRoutes = await query(`
      SELECT DISTINCT
        gr.route_id,
        gr.route_short_name,
        gr.route_long_name
      FROM gtfs_routes gr
      LEFT JOIN gtfs_trips gt ON gr.route_id = gt.route_id
      LEFT JOIN gtfs_stop_times gst ON gt.trip_id = gst.trip_id
      LEFT JOIN gtfs_stops gs ON gst.stop_id = gs.stop_id
      WHERE ST_Distance_Sphere(
        POINT(gs.stop_lon, gs.stop_lat),
        POINT(?, ?)
      ) < 500  -- 500 meter radius
      LIMIT 5
    `, [location_lng, location_lat]);

    // Step 2: Get trips scheduled for this time
    const breakdownTime = new Date(created_at);
    const timeWindow = breakdownTime.getTime() / 1000;

    const affectedTrips = await query(`
      SELECT
        gt.trip_id,
        gt.route_id,
        gr.route_short_name,
        COUNT(DISTINCT gst.stop_id) as stops_count
      FROM gtfs_trips gt
      LEFT JOIN gtfs_routes gr ON gt.route_id = gr.route_id
      LEFT JOIN gtfs_stop_times gst ON gt.trip_id = gst.trip_id
      WHERE gr.route_id IN (${affectedRoutes.map(r => `'${r.route_id}'`).join(',')})
      AND gst.departure_time IS NOT NULL
      GROUP BY gt.trip_id, gt.route_id, gr.route_short_name
    `);

    // Step 3: Estimate passenger capacity
    let totalEstimatedPassengers = 0;
    const vehicleCapacity = await getAverageVehicleCapacity(affectedRoutes);

    for (const trip of affectedTrips) {
      // Empirical: Average occupancy is 65% of capacity
      const estimatedPassengers = vehicleCapacity * 0.65;
      totalEstimatedPassengers += estimatedPassengers;
    }

    // Step 4: Calculate impact score
    const durationEstimate = estimateResolutionTime(issue_category);
    const passsengerMinutesImpact = totalEstimatedPassengers * durationEstimate;

    return {
      estimatedAffectedPassengers: Math.round(totalEstimatedPassengers),
      estimatedTotalPassengerMinutes: Math.round(passsengerMinutesImpact),
      affectedTrips: affectedTrips.length,
      affectedRoutes: affectedRoutes.length,
      estimatedResolutionMinutes: durationEstimate,
      impactLevel: classifyImpact(passsengerMinutesImpact),
      affectedRoutesList: affectedRoutes.map(r => r.route_short_name),
      confidence: 'MEDIUM'  // Depends on data quality
    };
  } catch (error) {
    console.error('Impact assessment error:', error);
    return {
      estimatedAffectedPassengers: 0,
      error: error.message
    };
  }
}

function estimateResolutionTime(issueCategory) {
  const estimates = {
    'ENGINE': 45,
    'GEARBOX': 60,
    'BRAKE': 30,
    'TRANSMISSION': 50,
    'ELECTRICAL': 25,
    'HVAC': 40,
    'DOOR': 20,
    'SUSPENSION': 45,
    'DESTINATION_DISPLAY': 15,
    'WHEELCHAIR_RAMP': 25,
    'UNKNOWN': 35
  };

  return estimates[issueCategory] || estimates['UNKNOWN'];
}

function classifyImpact(passsengerMinutes) {
  if (passsengerMinutes > 1000) return 'CRITICAL';
  if (passsengerMinutes > 500) return 'HIGH';
  if (passsengerMinutes > 100) return 'MEDIUM';
  return 'LOW';
}

async function getAverageVehicleCapacity(routes) {
  try {
    const result = await query(`
      SELECT AVG(max_passenger_capacity) as avg_capacity
      FROM fleet_vehicles
      WHERE max_passenger_capacity > 0
    `);

    return result[0]?.avg_capacity || 65; // Default to 65 seats
  } catch (error) {
    return 65;
  }
}
```

### Integration with Breakdown Creation
```javascript
// backend/routes/breakdowns.js - Modify POST endpoint
router.post('/', async (req, res) => {
  try {
    // ... existing validation code ...

    // Calculate impact before creating breakdown
    const impactAssessment = await assessBreakdownImpact({
      location_lat: req.body.location_lat,
      location_lng: req.body.location_lng,
      created_at: new Date(),
      issue_category: req.body.issue_category
    });

    // Create breakdown with impact data
    const breakdownData = {
      ...req.body,
      estimated_passenger_impact: impactAssessment.estimatedAffectedPassengers,
      created_at: new Date(),
      supervisor_badge: req.user.badge_number
    };

    // Insert into database
    const result = await db.insert('breakdowns', breakdownData);

    // Return with impact assessment
    res.json({
      success: true,
      breakdown: {
        ...breakdownData,
        id: result.insertId
      },
      impact: impactAssessment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Feature 7: Smart Engineer Dispatch

### Dispatch Algorithm
```javascript
// backend/services/smartDispatch.js
import { query } from '../config/mysql.js';

export async function recommendEngineers(breakdownData) {
  try {
    const { location_lat, location_lng, issue_category, severity } = breakdownData;

    // Step 1: Get available engineers
    const availableEngineers = await query(`
      SELECT
        e.engineer_id,
        e.name,
        e.depot,
        e.current_lat,
        e.current_lng,
        e.current_workload,
        JSON_EXTRACT(e.certifications, '$[*]') as certifications
      FROM engineers e
      WHERE e.status = 'available'
      AND e.on_duty = 1
      AND e.current_workload < 5  -- Not overloaded
      ORDER BY e.current_workload ASC
    `);

    if (availableEngineers.length === 0) {
      return {
        success: false,
        message: 'No engineers available',
        recommendations: []
      };
    }

    // Step 2: Score each engineer
    const engineerScores = availableEngineers.map(engineer => {
      let score = 0;
      const factors = {};

      // Factor 1: Distance (40% weight)
      const distance = calculateDistance(
        engineer.current_lat,
        engineer.current_lng,
        location_lat,
        location_lng
      );

      factors.distance = distance;
      const distanceScore = Math.max(0, 100 - distance * 2);
      score += distanceScore * 0.4;

      // Factor 2: Skill match (30% weight)
      const requiredSkill = getRequiredSkillForIssue(issue_category);
      const hasSkill = engineer.certifications.includes(requiredSkill);
      factors.hasRequiredSkill = hasSkill;
      score += hasSkill ? 30 : 15;

      // Factor 3: Workload balance (20% weight)
      factors.workload = engineer.current_workload;
      const workloadScore = (5 - engineer.current_workload) * 4;
      score += workloadScore;

      // Factor 4: Historical success rate (10% weight)
      const historicalScore = engineer.stats?.[issue_category]?.success_rate || 0.6;
      score += historicalScore * 10;

      // Severity multiplier
      if (severity === 'STOP') score *= 1.2;  // Prioritize STOP severity

      return {
        engineerId: engineer.engineer_id,
        name: engineer.name,
        depot: engineer.depot,
        distance: Math.round(distance * 10) / 10,
        score: Math.round(score),
        factors: factors,
        eta: Math.round(distance / 0.9) // Assume 0.9 km/min average urban speed
      };
    });

    // Step 3: Return top 3 recommendations
    return {
      success: true,
      recommendations: engineerScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((eng, idx) => ({
          ...eng,
          rank: idx + 1,
          recommendation: idx === 0 ? 'PRIMARY' : idx === 1 ? 'SECONDARY' : 'TERTIARY'
        })),
      breakdown: breakdownData
    };
  } catch (error) {
    console.error('Dispatch recommendation error:', error);
    return {
      success: false,
      error: error.message,
      recommendations: []
    };
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRequiredSkillForIssue(issueCategory) {
  const skillMap = {
    'ENGINE': 'ENGINE_DIAGNOSTIC',
    'GEARBOX': 'TRANSMISSION',
    'BRAKE': 'BRAKE_SYSTEMS',
    'ELECTRICAL': 'ELECTRICAL_SYSTEMS',
    'HVAC': 'CLIMATE_CONTROL',
    'DOOR': 'DOOR_SYSTEMS',
    'SUSPENSION': 'SUSPENSION',
    'WHEELCHAIR_RAMP': 'MOBILITY_EQUIPMENT'
  };
  return skillMap[issueCategory] || 'GENERAL';
}
```

### Backend API Endpoint
```javascript
// backend/routes/engineering.js
router.post('/smart-dispatch', authenticateSupervisor, async (req, res) => {
  try {
    const { breakdown_id, location_lat, location_lng, issue_category, severity } = req.body;

    const recommendations = await recommendEngineers({
      breakdown_id,
      location_lat,
      location_lng,
      issue_category,
      severity
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute dispatch
router.post('/dispatch/:engineerId/:breakdownId', authenticateSupervisor, async (req, res) => {
  try {
    const { engineerId, breakdownId } = req.params;

    // Update engineer workload
    await query('UPDATE engineers SET current_workload = current_workload + 1 WHERE engineer_id = ?', [engineerId]);

    // Create dispatch record
    await query(`
      INSERT INTO engineer_dispatches (engineer_id, breakdown_id, dispatched_at, dispatched_by)
      VALUES (?, ?, NOW(), ?)
    `, [engineerId, breakdownId, req.user.id]);

    // Send notification to engineer
    // ... implementation depends on your notification system

    res.json({
      success: true,
      message: 'Engineer dispatched successfully',
      engineer_id: engineerId,
      breakdown_id: breakdownId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Database Schema Additions

```sql
-- Table: Engineer Profiles
CREATE TABLE IF NOT EXISTS engineers (
  engineer_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  depot VARCHAR(50) NOT NULL,
  status ENUM('available', 'on-job', 'break', 'off-duty') DEFAULT 'available',
  on_duty BOOLEAN DEFAULT 1,
  current_location POINT,
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  current_workload INT DEFAULT 0,
  certifications JSON,  -- ["ENGINE", "TRANSMISSION", "ELECTRICAL"]
  vehicle_id VARCHAR(50),  -- Engineer's service vehicle
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_depot (depot),
  INDEX idx_status (status),
  SPATIAL INDEX spatial_location (current_location)
);

-- Table: Route-to-Depot Mapping
CREATE TABLE IF NOT EXISTS route_depot_mapping (
  mapping_id INT PRIMARY KEY AUTO_INCREMENT,
  route_id VARCHAR(100) NOT NULL,
  primary_depot VARCHAR(50),
  vehicle_type_primary VARCHAR(50),
  accessibility_required BOOLEAN DEFAULT 0,
  peak_demand_hours JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_route_depot (route_id, primary_depot),
  FOREIGN KEY (route_id) REFERENCES gtfs_routes(route_id) ON DELETE CASCADE
);

-- Enhanced breakdowns table (add these columns)
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS (
  estimated_passenger_impact INT DEFAULT 0,
  actual_passenger_impact INT,
  affected_route_ids JSON,
  affected_stop_ids JSON,
  notification_sent_at TIMESTAMP NULL,
  engineer_assigned_id INT,
  dispatch_time TIMESTAMP NULL,
  arrival_time TIMESTAMP NULL,
  FOREIGN KEY (engineer_assigned_id) REFERENCES engineers(engineer_id)
);

-- Enhanced fleet_vehicles table
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS (
  has_wheelchair_lift BOOLEAN DEFAULT 0,
  max_passenger_capacity INT,
  accessible_capacity INT,
  low_floor_bus BOOLEAN DEFAULT 0,
  registration_year INT,
  health_score INT DEFAULT 100,
  last_maintenance_date DATE,
  next_maintenance_date DATE
);
```

---

## WebSocket Integration (Real-time Updates)

```javascript
// backend/routes/webSocketHandler.js - Add dispatch updates
export function broadcastDispatchUpdate(dispatch) {
  const message = {
    type: 'ENGINEER_DISPATCHED',
    timestamp: new Date().toISOString(),
    data: {
      engineer_id: dispatch.engineer_id,
      breakdown_id: dispatch.breakdown_id,
      eta: dispatch.eta,
      location: dispatch.current_location
    }
  };

  // Broadcast to SDC dashboard and supervisor
  broadcastToSDCDashboard(message);
}

export function broadcastRouteStatusChange(route) {
  const message = {
    type: 'ROUTE_STATUS_CHANGED',
    timestamp: new Date().toISOString(),
    data: {
      route_id: route.route_id,
      route_short_name: route.route_short_name,
      status: route.status,
      active_incidents: route.active_breakdowns
    }
  };

  broadcastToAll(message);
}
```

---

This code should get you started with implementing these features. Each can be built incrementally, starting with Phase 1 features that have lower complexity.

