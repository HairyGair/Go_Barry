# SDC Operations Dashboard - Analytics & Insights Opportunities

**Generated:** 2025-10-02
**System:** Go BARRY Breakdown Guide - SDC Operations Dashboard
**Purpose:** Comprehensive analytics strategy for data-driven decision making

---

## Executive Summary

This document identifies 45+ analytics opportunities across 10 categories to transform the SDC Operations Dashboard from a real-time monitoring tool into a comprehensive data intelligence platform. The analysis leverages existing data sources (Supabase breakdowns, activities, audit logs, fleet data) and proposes SQL-based analytics, BigQuery integration, and actionable visualizations.

**Quick Wins (High Impact, Low Complexity):**
1. Response Time Analytics (avg time to acknowledge)
2. Breakdown Hotspot Mapping (location clustering)
3. Fleet Reliability Scoring (breakdown frequency by vehicle)
4. Peak Time Analysis (breakdown patterns by hour/day)
5. Decision Distribution Analysis (STOP vs AMBER vs CONTINUE ratios)

**Strategic Opportunities:**
- Predictive maintenance using breakdown history
- Route risk scoring for proactive planning
- Supervisor performance benchmarking
- Engineering resource optimization
- Real-time anomaly detection

---

## Data Sources Available

### 1. Supabase Tables
- **breakdowns** - Core breakdown events (fleet_no, location, status, timestamps, decisions)
- **supervisors** - Supervisor profiles (badge_number, depot, role)
- **wizard_progress** - Assessment tracking (wizard_type, current_step, progress_data)
- **fleet_vehicles** - Vehicle master data (fleet_no, depot, make, model, registration)

### 2. Activity Logs (JSON → Migrate to DB)
- **activities.json** - Real-time activity feed (wizard steps, edits, resolutions)
- **audit-log.json** - Audit trail (acknowledgments, decisions, edits)
- **breakdown-counter.json** - Daily breakdown sequencing

### 3. Real-time Event Stream
- **WebSocket events** - Live breakdown updates, wizard progress, SDC actions
- **API metrics** - Endpoint usage, response times, error rates

### 4. External Context Data
- **Route data** - Priority routes (X10, X21, 56, 1, 21, A19, A1, M1)
- **Depot assignments** - Washington, Consett, Riverside, Hexham
- **Time data** - Peak hours (7-9am, 5-7pm), weekdays vs weekends

---

## Category 1: Operational Metrics (Real-Time Dashboard KPIs)

### 1.1 Live Breakdown Statistics
**Description:** Real-time counters and percentages for active breakdowns
**Business Value:** At-a-glance situational awareness for SDC operators
**Data Requirements:**
```sql
-- Current implementation (breakdownsAPI.js lines 218-223)
SELECT
  COUNT(*) FILTER (WHERE status != 'resolved') AS total_active,
  COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_count,
  COUNT(*) FILTER (WHERE acknowledged_at IS NULL) AS pending_count,
  COUNT(*) FILTER (WHERE engineer_assigned IS NOT NULL) AS dispatched_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_assessment_count
FROM breakdowns
WHERE created_at >= CURRENT_DATE
  AND archived = false;
```

**Visualization:** Numeric badges with color coding (red=critical, yellow=pending, green=dispatched)
**Complexity:** LOW (already implemented)
**Impact:** HIGH (core operational visibility)

---

### 1.2 Average Response Time (Acknowledge Time)
**Description:** Mean time from breakdown report to SDC acknowledgment
**Business Value:** Measures SDC team responsiveness, identifies bottlenecks
**Data Requirements:**
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS avg_response_minutes,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS median_response_minutes,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS p95_response_minutes,
  COUNT(*) FILTER (WHERE acknowledged_at IS NULL AND created_at < NOW() - INTERVAL '10 minutes') AS unacknowledged_over_10min
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status != 'resolved';
```

**Visualization:**
- Large numeric display: "Avg Response: 4.2 mins"
- Sparkline chart showing hourly trend
- Alert threshold: >10 mins (yellow), >20 mins (red)

**Complexity:** LOW
**Impact:** HIGH

---

### 1.3 Engineering Dispatch Efficiency
**Description:** Time from breakdown acknowledgment to engineer dispatch
**Business Value:** Optimize engineering resource allocation, reduce vehicle downtime
**Data Requirements:**
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (dispatched_at - acknowledged_at)) / 60) AS avg_dispatch_minutes,
  COUNT(*) FILTER (WHERE severity = 'STOP' AND dispatched_at IS NULL) AS critical_no_engineer,
  COUNT(*) FILTER (WHERE engineering_requested_at IS NOT NULL AND engineer_assigned IS NULL) AS pending_assignment,
  json_build_object(
    'fastest', MIN(EXTRACT(EPOCH FROM (dispatched_at - acknowledged_at)) / 60),
    'slowest', MAX(EXTRACT(EPOCH FROM (dispatched_at - acknowledged_at)) / 60),
    'median', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (dispatched_at - acknowledged_at)) / 60)
  ) AS dispatch_time_stats
FROM breakdowns
WHERE dispatched_at IS NOT NULL
  AND acknowledged_at IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';
```

**Visualization:**
- Bar chart: Dispatch time by priority (Critical, High, Normal)
- List widget: Critical breakdowns awaiting engineer assignment
- Heat map: Dispatch efficiency by time of day

**Complexity:** MEDIUM
**Impact:** HIGH

---

### 1.4 Active Assessment Tracker
**Description:** Live monitoring of supervisors currently completing wizard assessments
**Business Value:** Identify stuck assessments, provide intervention support
**Data Requirements:**
```sql
SELECT
  wp.id,
  wp.supervisor_badge,
  wp.wizard_type,
  wp.current_step,
  wp.total_steps,
  ROUND((wp.current_step::numeric / wp.total_steps) * 100, 0) AS progress_percentage,
  EXTRACT(EPOCH FROM (NOW() - wp.created_at)) / 60 AS elapsed_minutes,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - wp.created_at)) / 60 > 20 THEN 'stalled'
    WHEN EXTRACT(EPOCH FROM (NOW() - wp.created_at)) / 60 > 10 THEN 'warning'
    ELSE 'normal'
  END AS assessment_status,
  b.fleet_no,
  b.location,
  b.issue_category
FROM wizard_progress wp
LEFT JOIN breakdowns b ON b.supervisor_badge = wp.supervisor_badge
WHERE wp.status = 'in_progress'
  AND wp.created_at >= NOW() - INTERVAL '30 minutes'
ORDER BY elapsed_minutes DESC;
```

**Visualization:**
- Progress bar list: Each active assessment with supervisor, fleet, elapsed time
- Status indicator: Green (<5 min), Yellow (5-10 min), Red (>10 min)
- Alert banner: "3 assessments in progress - 1 delayed"

**Complexity:** LOW (partially implemented in /api/breakdowns/in-progress)
**Impact:** MEDIUM

---

### 1.5 Breakdown Velocity (Rate of New Breakdowns)
**Description:** Breakdowns per hour/minute to detect surge events
**Business Value:** Early warning system for operational incidents (weather, accidents, system failures)
**Data Requirements:**
```sql
SELECT
  date_trunc('hour', created_at) AS breakdown_hour,
  COUNT(*) AS breakdown_count,
  AVG(COUNT(*)) OVER (ORDER BY date_trunc('hour', created_at) ROWS BETWEEN 3 PRECEDING AND CURRENT ROW) AS rolling_4hr_avg
FROM breakdowns
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY breakdown_hour DESC;

-- Real-time velocity (last 15 minutes)
SELECT
  COUNT(*) AS breakdowns_last_15min,
  COUNT(*) * 4 AS estimated_hourly_rate,
  CASE
    WHEN COUNT(*) >= 5 THEN 'surge_alert'
    WHEN COUNT(*) >= 3 THEN 'elevated'
    ELSE 'normal'
  END AS velocity_status
FROM breakdowns
WHERE created_at >= NOW() - INTERVAL '15 minutes';
```

**Visualization:**
- Line chart: Breakdowns per hour (last 24 hours)
- Alert widget: "SURGE ALERT: 7 breakdowns in last 15 minutes"
- Comparison: Current rate vs 7-day average

**Complexity:** LOW
**Impact:** HIGH (proactive incident management)

---

## Category 2: Performance KPIs (SDC Team Effectiveness)

### 2.1 Decision Accuracy Tracking
**Description:** Compare wizard decisions (STOP/AMBER/CONTINUE) with actual outcomes (engineering findings, resolution times)
**Business Value:** Validate assessment quality, identify training needs
**Data Requirements:**
```sql
SELECT
  wizard_decision,
  COUNT(*) AS decision_count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) AS avg_resolution_hours,
  COUNT(*) FILTER (WHERE engineer_assigned IS NOT NULL) AS engineering_required_count,
  COUNT(*) FILTER (WHERE decision_notes LIKE '%decision changed%' OR decision_notes LIKE '%overridden%') AS decision_override_count,
  ROUND(
    COUNT(*) FILTER (WHERE decision_notes NOT LIKE '%decision changed%')::numeric / COUNT(*) * 100, 1
  ) AS decision_confidence_percentage
FROM breakdowns
WHERE wizard_decision IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY wizard_decision
ORDER BY decision_count DESC;
```

**Visualization:**
- Sankey diagram: Decision flow (STOP → Engineer Dispatched → Resolved)
- Confidence score: "92% of STOP decisions confirmed by engineering"
- Comparison table: Expected vs actual resolution times by decision type

**Complexity:** MEDIUM
**Impact:** HIGH (quality assurance)

---

### 2.2 Supervisor Performance Benchmarking
**Description:** Compare supervisor assessment speed, decision distribution, accuracy
**Business Value:** Recognize top performers, identify coaching opportunities
**Data Requirements:**
```sql
SELECT
  supervisor_badge,
  supervisor_name,
  COUNT(*) AS total_assessments,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) AS avg_assessment_time_minutes,
  COUNT(*) FILTER (WHERE wizard_decision = 'STOP') AS stop_decisions,
  COUNT(*) FILTER (WHERE wizard_decision = 'AMBER') AS amber_decisions,
  COUNT(*) FILTER (WHERE wizard_decision = 'CONTINUE') AS continue_decisions,
  COUNT(DISTINCT breakdown_id) FILTER (WHERE status = 'resolved') AS breakdowns_resolved,
  ROUND(
    COUNT(DISTINCT breakdown_id) FILTER (WHERE status = 'resolved')::numeric / COUNT(*) * 100, 1
  ) AS resolution_rate_percentage,
  AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS avg_response_time_minutes
FROM breakdowns
WHERE supervisor_badge IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY supervisor_badge, supervisor_name
HAVING COUNT(*) >= 5
ORDER BY avg_assessment_time_minutes ASC;
```

**Visualization:**
- Leaderboard table: Top 10 supervisors by response time, resolution rate
- Radar chart: Individual supervisor profile (speed, accuracy, decision distribution)
- Anonymized comparison: "Your performance vs team average"

**Complexity:** MEDIUM
**Impact:** MEDIUM (potentially sensitive HR data)

**Important Note:** Ensure compliance with HR policies, use anonymized data for training purposes only.

---

### 2.3 Assessment Completion Rate
**Description:** Percentage of started wizards that reach completion vs abandoned
**Business Value:** Identify wizard UX issues, training gaps
**Data Requirements:**
```sql
-- Using activities.json data (migrate to database)
WITH wizard_sessions AS (
  SELECT
    breakdown_id,
    MIN(timestamp) FILTER (WHERE activity_type = 'wizard_started') AS started_at,
    MAX(timestamp) FILTER (WHERE activity_type = 'wizard_completed') AS completed_at,
    MAX(timestamp) FILTER (WHERE activity_type = 'wizard_step') AS last_step_at,
    COUNT(*) FILTER (WHERE activity_type = 'wizard_step') AS steps_completed
  FROM activities
  WHERE activity_type IN ('wizard_started', 'wizard_step', 'wizard_completed')
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY breakdown_id
)
SELECT
  COUNT(*) AS total_started,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS total_completed,
  ROUND(COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::numeric / COUNT(*) * 100, 1) AS completion_rate_percentage,
  COUNT(*) FILTER (WHERE completed_at IS NULL AND last_step_at < NOW() - INTERVAL '30 minutes') AS abandoned_count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) FILTER (WHERE completed_at IS NOT NULL) AS avg_completion_time_minutes
FROM wizard_sessions;
```

**Visualization:**
- Funnel chart: Started → Step 1 → Step 2 → ... → Completed
- Alert widget: "4 assessments abandoned today - investigate"
- Time series: Daily completion rate trend

**Complexity:** MEDIUM (requires activities table migration)
**Impact:** MEDIUM

---

### 2.4 Edit Frequency Analysis
**Description:** Track how often assessments are edited after initial submission
**Business Value:** Identify decision-making issues, training needs, system UX problems
**Data Requirements:**
```sql
SELECT
  COUNT(DISTINCT breakdown_id) AS total_breakdowns,
  COUNT(DISTINCT breakdown_id) FILTER (WHERE edit_count > 0) AS breakdowns_with_edits,
  ROUND(COUNT(DISTINCT breakdown_id) FILTER (WHERE edit_count > 0)::numeric / COUNT(DISTINCT breakdown_id) * 100, 1) AS edit_rate_percentage,
  AVG(edit_count) FILTER (WHERE edit_count > 0) AS avg_edits_per_breakdown,
  MAX(edit_count) AS max_edits_single_breakdown,
  json_agg(DISTINCT edit_reason ORDER BY edit_reason) AS common_edit_reasons
FROM (
  SELECT
    b.breakdown_id,
    COUNT(*) FILTER (WHERE ae.action = 'assessment_edit_initiated') AS edit_count,
    array_agg(ae.reason) FILTER (WHERE ae.action = 'assessment_edit_initiated') AS edit_reasons
  FROM breakdowns b
  LEFT JOIN audit_log ae ON ae.breakdown_id = b.breakdown_id
  WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY b.breakdown_id
) AS edit_stats;
```

**Visualization:**
- Gauge chart: "12% of assessments require editing"
- Bar chart: Top 10 edit reasons
- Trend line: Edit rate over time (improving or worsening?)

**Complexity:** LOW
**Impact:** MEDIUM

---

### 2.5 SLA Compliance Tracking
**Description:** Percentage of breakdowns meeting predefined response/resolution SLAs
**Business Value:** Monitor service level commitments, identify process improvements
**Data Requirements:**
```sql
-- Define SLAs:
-- Critical (STOP): Acknowledge <5 min, Engineer dispatched <15 min, Resolve <2 hours
-- High (AMBER): Acknowledge <10 min, Engineer dispatched <30 min, Resolve <4 hours
-- Normal (CONTINUE): Acknowledge <15 min, Resolve <8 hours

WITH sla_metrics AS (
  SELECT
    breakdown_id,
    severity,
    EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60 AS acknowledge_time_minutes,
    EXTRACT(EPOCH FROM (dispatched_at - acknowledged_at)) / 60 AS dispatch_time_minutes,
    EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60 AS resolution_time_minutes,
    CASE severity
      WHEN 'STOP' THEN 5
      WHEN 'AMBER' THEN 10
      WHEN 'CONTINUE' THEN 15
    END AS acknowledge_sla_minutes,
    CASE severity
      WHEN 'STOP' THEN 15
      WHEN 'AMBER' THEN 30
      WHEN 'CONTINUE' THEN NULL
    END AS dispatch_sla_minutes,
    CASE severity
      WHEN 'STOP' THEN 120
      WHEN 'AMBER' THEN 240
      WHEN 'CONTINUE' THEN 480
    END AS resolution_sla_minutes
  FROM breakdowns
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND status = 'resolved'
)
SELECT
  severity,
  COUNT(*) AS total_breakdowns,
  ROUND(COUNT(*) FILTER (WHERE acknowledge_time_minutes <= acknowledge_sla_minutes)::numeric / COUNT(*) * 100, 1) AS acknowledge_sla_met_percentage,
  ROUND(COUNT(*) FILTER (WHERE dispatch_time_minutes <= dispatch_sla_minutes OR dispatch_sla_minutes IS NULL)::numeric / COUNT(*) * 100, 1) AS dispatch_sla_met_percentage,
  ROUND(COUNT(*) FILTER (WHERE resolution_time_minutes <= resolution_sla_minutes)::numeric / COUNT(*) * 100, 1) AS resolution_sla_met_percentage
FROM sla_metrics
GROUP BY severity
ORDER BY
  CASE severity
    WHEN 'STOP' THEN 1
    WHEN 'AMBER' THEN 2
    WHEN 'CONTINUE' THEN 3
  END;
```

**Visualization:**
- Traffic light indicators: Green (>95%), Yellow (90-95%), Red (<90%)
- Stacked bar chart: SLA compliance by severity level
- Alert banner: "STOP SLA compliance dropped to 87% this week"

**Complexity:** MEDIUM
**Impact:** HIGH (contractual/operational commitment)

---

## Category 3: Predictive Analytics (Forecasting & Pattern Recognition)

### 3.1 Breakdown Prediction by Vehicle Age
**Description:** Predict likelihood of breakdown based on vehicle age, mileage, maintenance history
**Business Value:** Proactive maintenance scheduling, fleet replacement planning
**Data Requirements:**
```sql
SELECT
  fv.fleet_no,
  fv.make,
  fv.model,
  fv.year,
  EXTRACT(YEAR FROM CURRENT_DATE) - fv.year AS vehicle_age_years,
  COUNT(b.breakdown_id) AS breakdown_count_30d,
  COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') AS critical_breakdowns_30d,
  AVG(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 3600) AS avg_downtime_hours,
  ROUND(
    COUNT(b.breakdown_id)::numeric / NULLIF(COUNT(DISTINCT DATE(b.created_at)), 0), 2
  ) AS breakdowns_per_day,
  CASE
    WHEN COUNT(b.breakdown_id) >= 5 AND COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') >= 2 THEN 'high_risk'
    WHEN COUNT(b.breakdown_id) >= 3 THEN 'moderate_risk'
    ELSE 'low_risk'
  END AS breakdown_risk_level
FROM fleet_vehicles fv
LEFT JOIN breakdowns b ON b.fleet_no = fv.fleet_no
  AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE fv.is_active = true
GROUP BY fv.fleet_no, fv.make, fv.model, fv.year
HAVING COUNT(b.breakdown_id) > 0
ORDER BY breakdown_count_30d DESC, critical_breakdowns_30d DESC;
```

**Visualization:**
- Scatter plot: Vehicle age (X) vs breakdown frequency (Y)
- Risk matrix: Fleet vehicles categorized by risk level
- Recommendation list: "5 vehicles flagged for immediate maintenance review"

**Complexity:** MEDIUM
**Impact:** HIGH (preventive maintenance ROI)

---

### 3.2 Route Risk Scoring
**Description:** Assign risk scores to routes based on breakdown history, location factors
**Business Value:** Route planning, driver assignment, contingency planning
**Data Requirements:**
```sql
WITH route_stats AS (
  SELECT
    COALESCE(route, 'UNKNOWN') AS route_number,
    COUNT(*) AS breakdown_count,
    COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_count,
    COUNT(*) FILTER (WHERE wizard_decision = 'STOP') AS stop_decisions,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS avg_resolution_minutes,
    COUNT(DISTINCT location) AS breakdown_locations,
    COUNT(DISTINCT fleet_no) AS vehicles_affected,
    json_agg(DISTINCT issue_category) AS common_issues
  FROM breakdowns
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND route IS NOT NULL
  GROUP BY route
)
SELECT
  route_number,
  breakdown_count,
  critical_count,
  ROUND(
    (breakdown_count * 0.4 + critical_count * 0.6) / NULLIF(breakdown_count, 0) * 100, 1
  ) AS risk_score,
  CASE
    WHEN breakdown_count >= 20 AND critical_count >= 5 THEN 'high_risk'
    WHEN breakdown_count >= 10 THEN 'moderate_risk'
    ELSE 'low_risk'
  END AS risk_category,
  avg_resolution_minutes,
  breakdown_locations,
  vehicles_affected,
  common_issues
FROM route_stats
ORDER BY risk_score DESC, breakdown_count DESC;
```

**Visualization:**
- Color-coded map: Routes overlaid with risk heat map (red=high, yellow=moderate, green=low)
- Table widget: High-risk routes with breakdown counts, common issues
- Alert: "Route X10 showing elevated breakdown risk this week"

**Complexity:** MEDIUM
**Impact:** HIGH (operational planning)

---

### 3.3 Time-of-Day Breakdown Patterns
**Description:** Identify peak breakdown hours/days for resource allocation
**Business Value:** Optimize SDC/engineering shift scheduling
**Data Requirements:**
```sql
SELECT
  EXTRACT(HOUR FROM created_at) AS breakdown_hour,
  EXTRACT(DOW FROM created_at) AS day_of_week, -- 0=Sunday, 6=Saturday
  COUNT(*) AS breakdown_count,
  COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_count,
  AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS avg_response_minutes,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT DATE(created_at)), 1) AS avg_breakdowns_per_occurrence
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY breakdown_hour, day_of_week
ORDER BY avg_breakdowns_per_occurrence DESC;

-- Peak hours analysis
SELECT
  CASE
    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 7 AND 9 THEN 'morning_peak'
    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 12 AND 14 THEN 'midday'
    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 17 AND 19 THEN 'evening_peak'
    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 20 AND 23 THEN 'evening'
    ELSE 'off_peak'
  END AS time_period,
  COUNT(*) AS breakdown_count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) AS percentage_of_total
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY time_period
ORDER BY breakdown_count DESC;
```

**Visualization:**
- Heat map: Day of week (Y) vs Hour of day (X) with color intensity = breakdown frequency
- Bar chart: Breakdown distribution by time period
- Insight banner: "42% of breakdowns occur during morning peak (7-9am)"

**Complexity:** LOW
**Impact:** HIGH (staffing optimization)

---

### 3.4 Seasonal Breakdown Trends
**Description:** Analyze breakdown patterns by season/weather conditions
**Business Value:** Anticipate maintenance needs, proactive winter preparation
**Data Requirements:**
```sql
SELECT
  DATE_TRUNC('month', created_at) AS breakdown_month,
  EXTRACT(MONTH FROM created_at) AS month_number,
  CASE
    WHEN EXTRACT(MONTH FROM created_at) IN (12, 1, 2) THEN 'winter'
    WHEN EXTRACT(MONTH FROM created_at) IN (3, 4, 5) THEN 'spring'
    WHEN EXTRACT(MONTH FROM created_at) IN (6, 7, 8) THEN 'summer'
    ELSE 'autumn'
  END AS season,
  COUNT(*) AS breakdown_count,
  COUNT(*) FILTER (WHERE issue_category LIKE '%heating%' OR issue_category LIKE '%cooling%') AS climate_related_count,
  COUNT(*) FILTER (WHERE issue_category LIKE '%engine%') AS engine_issues,
  COUNT(*) FILTER (WHERE issue_category LIKE '%electrical%') AS electrical_issues,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS avg_resolution_minutes
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY breakdown_month, month_number, season
ORDER BY breakdown_month DESC;
```

**Visualization:**
- Line chart: Breakdown count per month over 24 months
- Stacked area chart: Issue category distribution by season
- Forecast widget: "Based on historical data, expect 20% increase in breakdowns this winter"

**Complexity:** LOW
**Impact:** MEDIUM

---

### 3.5 Issue Category Prediction Model
**Description:** Predict breakdown category based on symptoms, vehicle type, history
**Business Value:** Faster triage, pre-dispatch correct engineer skills
**Data Requirements:**
```sql
-- Feature extraction for ML model
SELECT
  b.breakdown_id,
  b.fleet_no,
  fv.vehicle_type,
  fv.make,
  fv.model,
  EXTRACT(YEAR FROM CURRENT_DATE) - fv.year AS vehicle_age,
  b.issue_category AS label,
  b.wizard_type,
  b.description,
  b.location,
  b.route,
  EXTRACT(HOUR FROM b.created_at) AS breakdown_hour,
  EXTRACT(DOW FROM b.created_at) AS breakdown_dow,
  -- Historical features
  COUNT(prev.breakdown_id) OVER (
    PARTITION BY b.fleet_no
    ORDER BY b.created_at
    ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
  ) AS previous_breakdown_count,
  LAG(b.issue_category) OVER (
    PARTITION BY b.fleet_no
    ORDER BY b.created_at
  ) AS previous_issue_category,
  EXTRACT(EPOCH FROM (b.created_at - LAG(b.created_at) OVER (PARTITION BY b.fleet_no ORDER BY b.created_at))) / 86400 AS days_since_last_breakdown
FROM breakdowns b
LEFT JOIN fleet_vehicles fv ON fv.fleet_no = b.fleet_no
LEFT JOIN breakdowns prev ON prev.fleet_no = b.fleet_no AND prev.created_at < b.created_at
WHERE b.created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND b.issue_category IS NOT NULL
ORDER BY b.created_at DESC;
```

**Visualization:**
- Prediction confidence widget: "85% confidence: Electrical issue"
- Feature importance chart: Top factors influencing prediction
- Recommendation: "Dispatch electrician for fleet 3421"

**Complexity:** HIGH (requires ML model training)
**Impact:** HIGH (operational efficiency)

**Implementation Note:** Export data to BigQuery, train classification model using BigQuery ML or Python/scikit-learn, deploy predictions back to dashboard.

---

## Category 4: Trend Analysis (Historical Patterns & Anomalies)

### 4.1 Fleet Reliability Ranking
**Description:** Rank vehicles by breakdown frequency, severity, downtime
**Business Value:** Identify problem vehicles for retirement/replacement
**Data Requirements:**
```sql
WITH fleet_metrics AS (
  SELECT
    fv.fleet_no,
    fv.make,
    fv.model,
    fv.year,
    fv.depot,
    COUNT(b.breakdown_id) AS breakdown_count_90d,
    COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') AS critical_count,
    SUM(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 3600) AS total_downtime_hours,
    AVG(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 60) AS avg_resolution_minutes,
    MAX(b.created_at) AS last_breakdown_date
  FROM fleet_vehicles fv
  LEFT JOIN breakdowns b ON b.fleet_no = fv.fleet_no
    AND b.created_at >= CURRENT_DATE - INTERVAL '90 days'
  WHERE fv.is_active = true
  GROUP BY fv.fleet_no, fv.make, fv.model, fv.year, fv.depot
)
SELECT
  fleet_no,
  make,
  model,
  year,
  depot,
  breakdown_count_90d,
  critical_count,
  ROUND(total_downtime_hours, 1) AS total_downtime_hours,
  ROUND(avg_resolution_minutes, 0) AS avg_resolution_minutes,
  last_breakdown_date,
  -- Reliability score (lower is better)
  ROUND(
    (breakdown_count_90d * 10) +
    (critical_count * 50) +
    (total_downtime_hours * 5), 0
  ) AS unreliability_score,
  CASE
    WHEN breakdown_count_90d >= 5 AND critical_count >= 2 THEN 'retire_candidate'
    WHEN breakdown_count_90d >= 3 THEN 'maintenance_priority'
    WHEN breakdown_count_90d >= 1 THEN 'monitor'
    ELSE 'reliable'
  END AS fleet_status
FROM fleet_metrics
ORDER BY unreliability_score DESC, breakdown_count_90d DESC;
```

**Visualization:**
- Sortable data table: Fleet number, breakdown count, downtime, reliability score
- Color coding: Red (retire candidate), Orange (maintenance priority), Green (reliable)
- Export button: "Download fleet reliability report (CSV)"

**Complexity:** LOW
**Impact:** HIGH (fleet management decisions)

---

### 4.2 Location Hotspot Analysis
**Description:** Identify geographic areas with high breakdown frequency
**Business Value:** Route optimization, infrastructure improvements, driver awareness
**Data Requirements:**
```sql
SELECT
  location,
  location_lat,
  location_lng,
  COUNT(*) AS breakdown_count,
  COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_count,
  COUNT(DISTINCT fleet_no) AS vehicles_affected,
  COUNT(DISTINCT route) AS routes_affected,
  json_agg(DISTINCT issue_category) AS common_issues,
  ROUND(
    ST_Distance(
      ST_MakePoint(location_lng, location_lat)::geography,
      ST_MakePoint(-1.5849, 54.9733)::geography -- Newcastle city center
    ) / 1000, 1
  ) AS distance_from_city_center_km
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND location IS NOT NULL
  AND location_lat IS NOT NULL
  AND location_lng IS NOT NULL
GROUP BY location, location_lat, location_lng
HAVING COUNT(*) >= 3
ORDER BY breakdown_count DESC;

-- Cluster analysis
SELECT
  ST_ClusterDBSCAN(
    ST_MakePoint(location_lng, location_lat)::geography,
    eps := 500, -- 500 meters
    minpoints := 3
  ) OVER () AS cluster_id,
  COUNT(*) AS breakdowns_in_cluster,
  ST_Centroid(ST_Collect(ST_MakePoint(location_lng, location_lat))) AS cluster_center,
  array_agg(DISTINCT location) AS cluster_locations
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND location_lat IS NOT NULL
GROUP BY cluster_id
HAVING COUNT(*) >= 3
ORDER BY breakdowns_in_cluster DESC;
```

**Visualization:**
- Interactive map: Breakdown locations as heat map with clustering
- List widget: Top 10 breakdown hotspots
- Insight: "32% of breakdowns occur within 2km of Washington depot"

**Complexity:** MEDIUM (requires PostGIS extension)
**Impact:** MEDIUM

---

### 4.3 Issue Category Distribution Over Time
**Description:** Track changes in breakdown types (engine, electrical, brakes, etc.) over months
**Business Value:** Identify emerging issues, validate maintenance effectiveness
**Data Requirements:**
```sql
SELECT
  DATE_TRUNC('month', created_at) AS breakdown_month,
  issue_category,
  COUNT(*) AS issue_count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY DATE_TRUNC('month', created_at)) * 100, 1) AS percentage_of_month
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND issue_category IS NOT NULL
GROUP BY breakdown_month, issue_category
ORDER BY breakdown_month DESC, issue_count DESC;
```

**Visualization:**
- Stacked bar chart: Monthly breakdown distribution by issue category
- Trend line: Specific issue category over time (e.g., "Electrical issues increasing 15% vs last quarter")
- Alert: "Brake-related breakdowns up 30% this month - investigate"

**Complexity:** LOW
**Impact:** MEDIUM

---

### 4.4 Mean Time Between Failures (MTBF) by Vehicle
**Description:** Calculate average days/miles between breakdowns per vehicle
**Business Value:** Reliability metric, maintenance scheduling optimization
**Data Requirements:**
```sql
WITH breakdown_intervals AS (
  SELECT
    fleet_no,
    breakdown_id,
    created_at,
    LAG(created_at) OVER (PARTITION BY fleet_no ORDER BY created_at) AS previous_breakdown_at,
    EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY fleet_no ORDER BY created_at))) / 86400 AS days_since_last_breakdown
  FROM breakdowns
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  ORDER BY fleet_no, created_at
)
SELECT
  fv.fleet_no,
  fv.make,
  fv.model,
  fv.year,
  COUNT(bi.breakdown_id) AS breakdown_count_12m,
  ROUND(AVG(bi.days_since_last_breakdown), 1) AS mtbf_days,
  ROUND(MIN(bi.days_since_last_breakdown), 1) AS min_interval_days,
  ROUND(MAX(bi.days_since_last_breakdown), 1) AS max_interval_days,
  CASE
    WHEN AVG(bi.days_since_last_breakdown) < 15 THEN 'high_frequency'
    WHEN AVG(bi.days_since_last_breakdown) < 30 THEN 'moderate_frequency'
    ELSE 'low_frequency'
  END AS breakdown_frequency_category
FROM fleet_vehicles fv
LEFT JOIN breakdown_intervals bi ON bi.fleet_no = fv.fleet_no
WHERE fv.is_active = true
GROUP BY fv.fleet_no, fv.make, fv.model, fv.year
HAVING COUNT(bi.breakdown_id) >= 2
ORDER BY mtbf_days ASC;
```

**Visualization:**
- Histogram: Distribution of MTBF across fleet
- Comparison widget: "Fleet 3421: MTBF 8 days (fleet avg: 45 days)"
- Alert: "5 vehicles with MTBF <15 days - schedule immediate inspection"

**Complexity:** MEDIUM
**Impact:** HIGH (maintenance planning)

---

### 4.5 Wizard Assessment Decision Distribution
**Description:** Ratio of STOP vs AMBER vs CONTINUE decisions over time
**Business Value:** Monitor decision-making patterns, identify training drift
**Data Requirements:**
```sql
SELECT
  DATE_TRUNC('week', created_at) AS assessment_week,
  wizard_decision,
  COUNT(*) AS decision_count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY DATE_TRUNC('week', created_at)) * 100, 1) AS percentage_of_week
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
  AND wizard_decision IN ('STOP', 'AMBER', 'CONTINUE')
GROUP BY assessment_week, wizard_decision
ORDER BY assessment_week DESC, decision_count DESC;

-- Overall distribution
SELECT
  wizard_decision,
  COUNT(*) AS total_decisions,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) AS percentage_of_total,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS avg_resolution_minutes
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND wizard_decision IN ('STOP', 'AMBER', 'CONTINUE')
GROUP BY wizard_decision
ORDER BY total_decisions DESC;
```

**Visualization:**
- Stacked area chart: Decision distribution over 12 weeks
- Pie chart: Current month decision breakdown
- Benchmark comparison: "STOP decisions: 18% (target: 15-20%)"

**Complexity:** LOW
**Impact:** MEDIUM

---

## Category 5: Decision Support (Real-Time Recommendations)

### 5.1 Similar Breakdown History Lookup
**Description:** When new breakdown reported, show similar past breakdowns with resolutions
**Business Value:** Faster decision-making, learn from historical outcomes
**Data Requirements:**
```sql
-- For a given breakdown (fleet_no, issue_category, location)
SELECT
  b.breakdown_id,
  b.fleet_no,
  b.issue_category,
  b.wizard_decision,
  b.description,
  b.resolution_notes,
  EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 60 AS resolution_time_minutes,
  b.engineer_assigned,
  b.created_at,
  -- Similarity scoring
  CASE
    WHEN b.fleet_no = :current_fleet_no THEN 50
    ELSE 0
  END +
  CASE
    WHEN b.issue_category = :current_issue_category THEN 30
    ELSE 0
  END +
  CASE
    WHEN ST_Distance(
      ST_MakePoint(b.location_lng, b.location_lat)::geography,
      ST_MakePoint(:current_lng, :current_lat)::geography
    ) < 5000 THEN 20
    ELSE 0
  END AS similarity_score
FROM breakdowns b
WHERE b.created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND b.status = 'resolved'
  AND (
    b.fleet_no = :current_fleet_no
    OR b.issue_category = :current_issue_category
    OR ST_Distance(
      ST_MakePoint(b.location_lng, b.location_lat)::geography,
      ST_MakePoint(:current_lng, :current_lat)::geography
    ) < 5000
  )
ORDER BY similarity_score DESC, b.created_at DESC
LIMIT 5;
```

**Visualization:**
- Card list: "5 similar breakdowns found"
  - Fleet 3421 - Electrical - Resolved in 45 mins - Engineer: Smith
  - Decision: AMBER → Changeover → Resolved
  - Notes: "Alternator fault - replaced on-site"
- Recommendation: "Based on similar cases, suggest AMBER decision and engineer dispatch"

**Complexity:** MEDIUM
**Impact:** HIGH (decision quality)

---

### 5.2 Engineer Skill Matching
**Description:** Recommend best available engineer based on issue type, location, past success
**Business Value:** Faster resolution, reduce repeat visits
**Data Requirements:**
```sql
-- Requires engineering_requests and engineer_profiles tables
WITH engineer_performance AS (
  SELECT
    b.engineer_assigned,
    b.issue_category,
    COUNT(*) AS cases_handled,
    AVG(EXTRACT(EPOCH FROM (b.resolved_at - b.dispatched_at)) / 60) AS avg_resolution_time_minutes,
    COUNT(*) FILTER (WHERE b.resolution_notes LIKE '%first_visit%') AS first_visit_resolutions,
    ROUND(
      COUNT(*) FILTER (WHERE b.resolution_notes LIKE '%first_visit%')::numeric / COUNT(*) * 100, 1
    ) AS first_visit_success_rate
  FROM breakdowns b
  WHERE b.engineer_assigned IS NOT NULL
    AND b.dispatched_at IS NOT NULL
    AND b.resolved_at IS NOT NULL
    AND b.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY b.engineer_assigned, b.issue_category
  HAVING COUNT(*) >= 3
)
SELECT
  engineer_assigned AS engineer_name,
  issue_category,
  cases_handled,
  ROUND(avg_resolution_time_minutes, 0) AS avg_resolution_minutes,
  first_visit_success_rate,
  -- Recommendation score
  ROUND(
    (first_visit_success_rate * 0.6) +
    (100 - (avg_resolution_time_minutes / 2)) * 0.4, 1
  ) AS recommendation_score
FROM engineer_performance
WHERE issue_category = :current_issue_category
ORDER BY recommendation_score DESC
LIMIT 5;
```

**Visualization:**
- Recommendation card: "Best match: Engineer Smith (92% first-visit success, avg 38 min resolution)"
- Comparison table: Top 5 engineers with scores
- Availability indicator: Green (available), Yellow (on job), Red (unavailable)

**Complexity:** HIGH (requires engineer tracking system integration)
**Impact:** HIGH (operational efficiency)

---

### 5.3 Route Diversion Recommendations
**Description:** When STOP breakdown occurs, suggest alternative routes for affected services
**Business Value:** Minimize passenger disruption, optimize service continuity
**Data Requirements:**
```sql
-- Requires route_data and stop_data tables
SELECT
  r.route_number,
  r.route_name,
  r.depot,
  COUNT(DISTINCT s.stop_id) AS total_stops,
  ST_Length(r.route_geometry::geography) / 1000 AS route_length_km,
  -- Calculate overlap with breakdown location
  ST_Distance(
    r.route_geometry::geography,
    ST_MakePoint(:breakdown_lng, :breakdown_lat)::geography
  ) AS distance_from_breakdown_meters,
  -- Alternative route scoring
  CASE
    WHEN ST_Distance(r.route_geometry::geography, ST_MakePoint(:breakdown_lng, :breakdown_lat)::geography) < 500 THEN 'directly_affected'
    WHEN ST_Distance(r.route_geometry::geography, ST_MakePoint(:breakdown_lng, :breakdown_lat)::geography) < 2000 THEN 'nearby'
    ELSE 'not_affected'
  END AS impact_level
FROM routes r
LEFT JOIN stops s ON ST_DWithin(r.route_geometry::geography, s.stop_location::geography, 100)
WHERE r.is_active = true
ORDER BY distance_from_breakdown_meters ASC
LIMIT 10;
```

**Visualization:**
- Interactive map: Affected route highlighted, alternative routes suggested
- Alert card: "Route X10 directly affected - 12 stops within 500m of breakdown"
- Action buttons: "Notify passengers", "Activate diversion plan"

**Complexity:** HIGH (requires GIS route data)
**Impact:** HIGH (passenger experience)

---

### 5.4 Changeover Vehicle Availability
**Description:** When AMBER decision made, show nearest available replacement vehicles
**Business Value:** Faster changeover execution, reduce service disruption
**Data Requirements:**
```sql
-- Requires fleet_availability table (real-time vehicle status)
SELECT
  fv.fleet_no,
  fv.make,
  fv.model,
  fv.depot,
  fv.current_location,
  fv.vehicle_type,
  ST_Distance(
    ST_MakePoint(fv.current_lng, fv.current_lat)::geography,
    ST_MakePoint(:breakdown_lng, :breakdown_lat)::geography
  ) / 1000 AS distance_km,
  ROUND(
    ST_Distance(
      ST_MakePoint(fv.current_lng, fv.current_lat)::geography,
      ST_MakePoint(:breakdown_lng, :breakdown_lat)::geography
    ) / 1000 / 40 * 60, 0
  ) AS estimated_arrival_minutes,
  fv.last_maintenance_date,
  COUNT(b.breakdown_id) FILTER (WHERE b.created_at >= CURRENT_DATE - INTERVAL '7 days') AS recent_breakdowns
FROM fleet_vehicles fv
LEFT JOIN breakdowns b ON b.fleet_no = fv.fleet_no
WHERE fv.is_active = true
  AND fv.status = 'available'
  AND fv.vehicle_type = :required_vehicle_type
GROUP BY fv.fleet_no, fv.make, fv.model, fv.depot, fv.current_location, fv.current_lng, fv.current_lat, fv.vehicle_type, fv.last_maintenance_date
ORDER BY distance_km ASC, recent_breakdowns ASC
LIMIT 5;
```

**Visualization:**
- Map view: Breakdown location + nearest 5 available vehicles with ETA
- List widget: Fleet number, distance, ETA, reliability score
- Action button: "Request changeover for fleet 3215 (ETA 18 mins)"

**Complexity:** HIGH (requires real-time vehicle tracking)
**Impact:** HIGH (service continuity)

---

### 5.5 Supervisor Workload Balancing
**Description:** Show which supervisors are handling most breakdowns, suggest reallocation
**Business Value:** Prevent burnout, optimize resource utilization
**Data Requirements:**
```sql
WITH supervisor_workload AS (
  SELECT
    supervisor_badge,
    supervisor_name,
    COUNT(*) FILTER (WHERE status IN ('active', 'in_progress')) AS active_breakdowns,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') AS breakdowns_last_hour,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS breakdowns_today,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS assessments_in_progress,
    MAX(created_at) AS last_breakdown_time
  FROM breakdowns
  WHERE supervisor_badge IS NOT NULL
    AND created_at >= CURRENT_DATE
  GROUP BY supervisor_badge, supervisor_name
)
SELECT
  supervisor_badge,
  supervisor_name,
  active_breakdowns,
  breakdowns_last_hour,
  breakdowns_today,
  assessments_in_progress,
  last_breakdown_time,
  EXTRACT(EPOCH FROM (NOW() - last_breakdown_time)) / 60 AS minutes_since_last_breakdown,
  CASE
    WHEN active_breakdowns >= 5 THEN 'overloaded'
    WHEN active_breakdowns >= 3 THEN 'busy'
    WHEN active_breakdowns >= 1 THEN 'active'
    ELSE 'available'
  END AS workload_status
FROM supervisor_workload
ORDER BY active_breakdowns DESC, breakdowns_last_hour DESC;
```

**Visualization:**
- Bar chart: Supervisor workload distribution
- Alert: "Supervisor AG003 handling 7 active breakdowns - consider reallocation"
- Recommendation: "Assign next breakdown to supervisor JD002 (2 active)"

**Complexity:** LOW
**Impact:** MEDIUM

---

## Category 6: Historical Reporting (End-of-Period Analysis)

### 6.1 Daily Breakdown Summary Report
**Description:** Automated end-of-day summary email/dashboard
**Business Value:** Shift handover, management visibility, trend tracking
**Data Requirements:**
```sql
-- Daily summary query
SELECT
  CURRENT_DATE AS report_date,
  COUNT(*) AS total_breakdowns,
  COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_breakdowns,
  COUNT(*) FILTER (WHERE severity = 'AMBER') AS amber_breakdowns,
  COUNT(*) FILTER (WHERE severity = 'CONTINUE') AS continue_breakdowns,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_breakdowns,
  COUNT(*) FILTER (WHERE status != 'resolved') AS unresolved_breakdowns,
  AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS avg_response_time_minutes,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_time_minutes,
  COUNT(DISTINCT supervisor_badge) AS active_supervisors,
  COUNT(DISTINCT fleet_no) AS vehicles_affected,
  COUNT(DISTINCT route) AS routes_affected,
  json_agg(DISTINCT issue_category) AS issue_categories_reported,
  MAX(created_at) AS last_breakdown_time,
  MIN(created_at) AS first_breakdown_time
FROM breakdowns
WHERE created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day';
```

**Visualization:**
- PDF report with executive summary
- Key metrics: Total, critical, avg response time, resolution rate
- Charts: Breakdown timeline, decision distribution, issue categories
- Notable events: Longest response time, most affected route

**Complexity:** LOW
**Impact:** HIGH (management visibility)

**Implementation:** Scheduled SQL query → Export to PDF → Email to stakeholders

---

### 6.2 Weekly Performance Dashboard
**Description:** Week-over-week comparison of key metrics
**Business Value:** Identify improving/declining trends, management accountability
**Data Requirements:**
```sql
WITH this_week AS (
  SELECT
    COUNT(*) AS breakdowns,
    COUNT(*) FILTER (WHERE severity = 'STOP') AS critical,
    AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS avg_response_minutes,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_minutes
  FROM breakdowns
  WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
),
last_week AS (
  SELECT
    COUNT(*) AS breakdowns,
    COUNT(*) FILTER (WHERE severity = 'STOP') AS critical,
    AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS avg_response_minutes,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_minutes
  FROM breakdowns
  WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'
    AND created_at < DATE_TRUNC('week', CURRENT_DATE)
)
SELECT
  'This Week' AS period,
  tw.breakdowns,
  tw.critical,
  ROUND(tw.avg_response_minutes, 1) AS avg_response_minutes,
  tw.resolved,
  ROUND(tw.avg_resolution_minutes, 0) AS avg_resolution_minutes,
  ROUND((tw.breakdowns - lw.breakdowns)::numeric / NULLIF(lw.breakdowns, 0) * 100, 1) AS breakdown_change_pct,
  ROUND((tw.avg_response_minutes - lw.avg_response_minutes) / NULLIF(lw.avg_response_minutes, 0) * 100, 1) AS response_time_change_pct
FROM this_week tw, last_week lw;
```

**Visualization:**
- Comparison table: This week vs last week with % change indicators
- Trend arrows: Green (improving), Red (declining)
- Insight: "Response time improved 12% this week - keep up the good work!"

**Complexity:** LOW
**Impact:** MEDIUM

---

### 6.3 Monthly Fleet Health Report
**Description:** Comprehensive monthly analysis of fleet performance
**Business Value:** Strategic planning, budget justification, maintenance planning
**Data Requirements:**
```sql
-- Monthly fleet report
SELECT
  DATE_TRUNC('month', b.created_at) AS report_month,
  fv.fleet_no,
  fv.make,
  fv.model,
  fv.year,
  fv.depot,
  COUNT(b.breakdown_id) AS breakdown_count,
  COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') AS critical_count,
  SUM(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 3600) AS total_downtime_hours,
  AVG(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 60) AS avg_resolution_minutes,
  json_agg(DISTINCT b.issue_category) AS issues_this_month,
  COUNT(DISTINCT b.engineer_assigned) AS engineers_involved,
  MAX(b.created_at) AS last_breakdown_date,
  ROUND(
    (COUNT(b.breakdown_id) * 10) +
    (COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') * 50) +
    (SUM(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 3600) * 5), 0
  ) AS monthly_unreliability_score
FROM fleet_vehicles fv
LEFT JOIN breakdowns b ON b.fleet_no = fv.fleet_no
  AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
  AND b.created_at < DATE_TRUNC('month', CURRENT_DATE)
WHERE fv.is_active = true
GROUP BY report_month, fv.fleet_no, fv.make, fv.model, fv.year, fv.depot
ORDER BY monthly_unreliability_score DESC;
```

**Visualization:**
- Multi-page PDF report
- Executive summary: Total breakdowns, cost impact, top problem vehicles
- Fleet ranking table with unreliability scores
- Recommendations: "5 vehicles recommended for immediate review"

**Complexity:** MEDIUM
**Impact:** HIGH (strategic decisions)

---

### 6.4 Supervisor Performance Report
**Description:** Monthly assessment of supervisor assessment quality and speed
**Business Value:** Performance reviews, training needs identification
**Data Requirements:**
```sql
SELECT
  s.supervisor_badge,
  s.supervisor_name,
  s.depot,
  COUNT(b.breakdown_id) AS assessments_completed,
  AVG(EXTRACT(EPOCH FROM (b.completed_at - b.created_at)) / 60) AS avg_assessment_time_minutes,
  COUNT(*) FILTER (WHERE b.wizard_decision = 'STOP') AS stop_decisions,
  COUNT(*) FILTER (WHERE b.wizard_decision = 'AMBER') AS amber_decisions,
  COUNT(*) FILTER (WHERE b.wizard_decision = 'CONTINUE') AS continue_decisions,
  COUNT(*) FILTER (WHERE b.status = 'resolved') AS breakdowns_resolved,
  ROUND(COUNT(*) FILTER (WHERE b.status = 'resolved')::numeric / COUNT(b.breakdown_id) * 100, 1) AS resolution_rate_pct,
  AVG(EXTRACT(EPOCH FROM (b.acknowledged_at - b.created_at)) / 60) AS avg_response_time_minutes,
  COUNT(*) FILTER (WHERE b.decision_notes LIKE '%edit%') AS assessments_edited
FROM supervisors s
LEFT JOIN breakdowns b ON b.supervisor_badge = s.badge_number
  AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
  AND b.created_at < DATE_TRUNC('month', CURRENT_DATE)
WHERE s.is_active = true
  AND s.role = 'supervisor'
GROUP BY s.supervisor_badge, s.supervisor_name, s.depot
HAVING COUNT(b.breakdown_id) > 0
ORDER BY assessments_completed DESC;
```

**Visualization:**
- Confidential report for management only
- Comparison table with anonymized benchmarks
- Recommendations: "Supervisor X shows high edit rate - recommend refresher training"

**Complexity:** MEDIUM
**Impact:** MEDIUM (sensitive HR data)

**Important:** Use aggregated/anonymized data publicly, detailed reports only for authorized personnel.

---

### 6.5 Cost Impact Analysis
**Description:** Estimate financial impact of breakdowns (downtime, engineering, replacement vehicles)
**Business Value:** Budget planning, ROI justification for maintenance investments
**Data Requirements:**
```sql
-- Cost assumptions (configure via admin panel)
-- Engineering callout: £150/hour
-- Downtime cost: £200/hour (lost revenue + customer compensation)
-- Replacement vehicle: £50/hour
-- Admin overhead: £30/breakdown

WITH breakdown_costs AS (
  SELECT
    breakdown_id,
    fleet_no,
    severity,
    issue_category,
    created_at,
    resolved_at,
    EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 AS downtime_hours,
    -- Cost calculations
    ROUND((EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) * 200, 2) AS downtime_cost,
    CASE
      WHEN engineer_assigned IS NOT NULL THEN
        ROUND((EXTRACT(EPOCH FROM (resolved_at - dispatched_at)) / 3600) * 150, 2)
      ELSE 0
    END AS engineering_cost,
    CASE
      WHEN replacement_vehicle_required THEN
        ROUND((EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) * 50, 2)
      ELSE 0
    END AS replacement_vehicle_cost,
    30 AS admin_overhead_cost
  FROM breakdowns
  WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    AND resolved_at IS NOT NULL
)
SELECT
  DATE_TRUNC('month', created_at) AS cost_month,
  COUNT(*) AS total_breakdowns,
  SUM(downtime_hours) AS total_downtime_hours,
  SUM(downtime_cost) AS total_downtime_cost,
  SUM(engineering_cost) AS total_engineering_cost,
  SUM(replacement_vehicle_cost) AS total_replacement_cost,
  SUM(admin_overhead_cost) AS total_admin_cost,
  SUM(downtime_cost + engineering_cost + replacement_vehicle_cost + admin_overhead_cost) AS total_breakdown_cost,
  ROUND(AVG(downtime_cost + engineering_cost + replacement_vehicle_cost + admin_overhead_cost), 2) AS avg_cost_per_breakdown
FROM breakdown_costs
GROUP BY cost_month
ORDER BY cost_month DESC;

-- Cost by issue category
SELECT
  issue_category,
  COUNT(*) AS breakdown_count,
  SUM(downtime_cost + engineering_cost + replacement_vehicle_cost + admin_overhead_cost) AS total_cost,
  ROUND(AVG(downtime_cost + engineering_cost + replacement_vehicle_cost + admin_overhead_cost), 2) AS avg_cost_per_breakdown
FROM breakdown_costs
GROUP BY issue_category
ORDER BY total_cost DESC;
```

**Visualization:**
- Cost dashboard: Total monthly breakdown cost, breakdown by category
- Bar chart: Cost by issue type (Electrical: £12,400, Engine: £8,700, etc.)
- ROI projection: "Investing £20k in preventive maintenance could save £50k/year"

**Complexity:** MEDIUM
**Impact:** HIGH (budget justification)

---

## Category 7: Anomaly Detection (Real-Time Alerts)

### 7.1 Unusual Breakdown Spike Detection
**Description:** Alert when breakdown rate exceeds historical baseline
**Business Value:** Early warning for systemic issues (weather, defects, process failures)
**Data Requirements:**
```sql
-- Calculate baseline and compare to current hour
WITH baseline AS (
  SELECT
    AVG(breakdown_count) AS avg_hourly_breakdowns,
    STDDEV(breakdown_count) AS stddev_hourly_breakdowns
  FROM (
    SELECT
      date_trunc('hour', created_at) AS breakdown_hour,
      COUNT(*) AS breakdown_count
    FROM breakdowns
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND created_at < CURRENT_DATE
    GROUP BY breakdown_hour
  ) AS hourly_counts
),
current_hour AS (
  SELECT
    COUNT(*) AS current_breakdown_count
  FROM breakdowns
  WHERE created_at >= date_trunc('hour', NOW())
)
SELECT
  ch.current_breakdown_count,
  b.avg_hourly_breakdowns,
  b.stddev_hourly_breakdowns,
  ROUND(
    (ch.current_breakdown_count - b.avg_hourly_breakdowns) / NULLIF(b.stddev_hourly_breakdowns, 0), 2
  ) AS z_score,
  CASE
    WHEN (ch.current_breakdown_count - b.avg_hourly_breakdowns) / NULLIF(b.stddev_hourly_breakdowns, 0) > 2 THEN 'critical_anomaly'
    WHEN (ch.current_breakdown_count - b.avg_hourly_breakdowns) / NULLIF(b.stddev_hourly_breakdowns, 0) > 1.5 THEN 'warning_anomaly'
    ELSE 'normal'
  END AS anomaly_status
FROM current_hour ch, baseline b;
```

**Visualization:**
- Alert banner: "ANOMALY DETECTED: 9 breakdowns this hour (avg: 3, threshold: 6)"
- Line chart: Current hour vs 7-day hourly average
- Recommended action: "Investigate common factors - weather, route, vehicle batch"

**Complexity:** MEDIUM
**Impact:** HIGH (proactive incident management)

**Implementation:** Run every 15 minutes, trigger WebSocket alert + email notification

---

### 7.2 Repeat Breakdown Detection
**Description:** Alert when same vehicle breaks down multiple times in short period
**Business Value:** Identify incomplete repairs, chronic issues
**Data Requirements:**
```sql
SELECT
  fleet_no,
  COUNT(*) AS breakdown_count_7d,
  array_agg(breakdown_id ORDER BY created_at DESC) AS recent_breakdown_ids,
  array_agg(issue_category ORDER BY created_at DESC) AS recent_issues,
  MAX(created_at) AS last_breakdown_at,
  MIN(created_at) AS first_breakdown_at,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400 AS days_between_first_last,
  CASE
    WHEN COUNT(*) >= 3 AND EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400 <= 7 THEN 'critical_repeat'
    WHEN COUNT(*) >= 2 AND EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400 <= 3 THEN 'warning_repeat'
    ELSE 'normal'
  END AS repeat_status
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY fleet_no
HAVING COUNT(*) >= 2
ORDER BY breakdown_count_7d DESC, last_breakdown_at DESC;
```

**Visualization:**
- Alert card: "Fleet 3421 has broken down 3 times in 5 days - CRITICAL REPEAT"
- Timeline: Breakdown history for flagged vehicle
- Recommended action: "Remove from service for thorough inspection"

**Complexity:** LOW
**Impact:** HIGH (safety & reliability)

---

### 7.3 Prolonged Unresolved Breakdown Alert
**Description:** Alert when breakdown remains unresolved beyond expected resolution time
**Business Value:** Prevent forgotten/stuck breakdowns, ensure timely escalation
**Data Requirements:**
```sql
-- Define expected resolution times by severity
-- STOP: 2 hours, AMBER: 4 hours, CONTINUE: 8 hours

SELECT
  breakdown_id,
  fleet_no,
  location,
  severity,
  issue_category,
  status,
  supervisor_badge,
  engineer_assigned,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 AS elapsed_minutes,
  CASE severity
    WHEN 'STOP' THEN 120
    WHEN 'AMBER' THEN 240
    WHEN 'CONTINUE' THEN 480
    ELSE 360
  END AS expected_resolution_minutes,
  ROUND(
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 -
    CASE severity
      WHEN 'STOP' THEN 120
      WHEN 'AMBER' THEN 240
      WHEN 'CONTINUE' THEN 480
      ELSE 360
    END, 0
  ) AS overdue_minutes
FROM breakdowns
WHERE status != 'resolved'
  AND created_at < NOW() - INTERVAL '2 hours'
  AND EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 > (
    CASE severity
      WHEN 'STOP' THEN 120
      WHEN 'AMBER' THEN 240
      WHEN 'CONTINUE' THEN 480
      ELSE 360
    END
  )
ORDER BY overdue_minutes DESC;
```

**Visualization:**
- Alert list: "3 breakdowns overdue for resolution"
  - Fleet 3421 - STOP - 87 mins overdue - No engineer assigned
- Escalation button: "Escalate to management"
- Auto-notification: Email sent to supervisor + depot manager

**Complexity:** LOW
**Impact:** HIGH (SLA compliance)

---

### 7.4 Assessment Stall Detection
**Description:** Alert when wizard assessment takes longer than expected
**Business Value:** Identify supervisors needing assistance, prevent workflow blockages
**Data Requirements:**
```sql
SELECT
  wp.id AS progress_id,
  wp.supervisor_badge,
  wp.supervisor_name,
  wp.wizard_type,
  wp.current_step,
  wp.total_steps,
  wp.created_at,
  EXTRACT(EPOCH FROM (NOW() - wp.created_at)) / 60 AS elapsed_minutes,
  EXTRACT(EPOCH FROM (NOW() - wp.updated_at)) / 60 AS minutes_since_last_update,
  b.fleet_no,
  b.location,
  b.issue_category,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - wp.updated_at)) / 60 > 10 THEN 'stalled'
    WHEN EXTRACT(EPOCH FROM (NOW() - wp.created_at)) / 60 > 15 THEN 'delayed'
    ELSE 'normal'
  END AS assessment_status
FROM wizard_progress wp
LEFT JOIN breakdowns b ON b.supervisor_badge = wp.supervisor_badge
WHERE wp.status = 'in_progress'
  AND wp.created_at >= NOW() - INTERVAL '30 minutes'
  AND (
    EXTRACT(EPOCH FROM (NOW() - wp.updated_at)) / 60 > 10
    OR EXTRACT(EPOCH FROM (NOW() - wp.created_at)) / 60 > 15
  )
ORDER BY elapsed_minutes DESC;
```

**Visualization:**
- Alert banner: "Assessment stalled: Supervisor AG003 - No activity for 12 mins"
- Progress tracker: Step 3/5 - Last update 12 mins ago
- Action buttons: "Call supervisor", "Offer assistance"

**Complexity:** LOW
**Impact:** MEDIUM

---

### 7.5 Critical Decision Override Alert
**Description:** Alert when STOP decision is overridden to CONTINUE/AMBER
**Business Value:** Safety oversight, identify decision-making issues
**Data Requirements:**
```sql
-- Requires audit log tracking decision changes
SELECT
  al.breakdown_id,
  b.fleet_no,
  b.location,
  b.supervisor_badge,
  al.timestamp AS override_timestamp,
  al.metadata->>'original_decision' AS original_decision,
  al.metadata->>'new_decision' AS new_decision,
  al.metadata->>'override_reason' AS override_reason,
  al.user_type AS override_by,
  b.status AS current_status,
  EXTRACT(EPOCH FROM (NOW() - al.timestamp)) / 60 AS minutes_since_override
FROM audit_log al
JOIN breakdowns b ON b.breakdown_id = al.breakdown_id
WHERE al.action = 'decision_changed'
  AND al.metadata->>'original_decision' = 'STOP'
  AND al.metadata->>'new_decision' IN ('AMBER', 'CONTINUE')
  AND al.timestamp >= CURRENT_DATE
ORDER BY al.timestamp DESC;
```

**Visualization:**
- Critical alert: "STOP decision overridden to CONTINUE - Fleet 3421"
- Details: Original: STOP (Supervisor AG003), Override: CONTINUE (SDC Operator)
- Reason: "Driver reports issue resolved after restart"
- Follow-up required: "Verify safety before returning to service"

**Complexity:** MEDIUM (requires decision change tracking)
**Impact:** HIGH (safety compliance)

---

## Category 8: Resource Optimization (Efficiency Analysis)

### 8.1 Engineering Resource Utilization
**Description:** Track engineer workload, availability, efficiency
**Business Value:** Optimize staffing levels, reduce idle time
**Data Requirements:**
```sql
-- Requires engineer_tracking table
SELECT
  engineer_name,
  COUNT(*) AS jobs_assigned_today,
  SUM(EXTRACT(EPOCH FROM (resolved_at - dispatched_at)) / 60) AS total_on_job_minutes,
  AVG(EXTRACT(EPOCH FROM (resolved_at - dispatched_at)) / 60) AS avg_job_duration_minutes,
  SUM(EXTRACT(EPOCH FROM (dispatched_at - engineering_requested_at)) / 60) AS total_travel_time_minutes,
  COUNT(*) FILTER (WHERE status = 'resolved') AS jobs_completed,
  COUNT(*) FILTER (WHERE resolution_notes LIKE '%first_visit%') AS first_visit_resolutions,
  ROUND(
    COUNT(*) FILTER (WHERE resolution_notes LIKE '%first_visit%')::numeric / NULLIF(COUNT(*) FILTER (WHERE status = 'resolved'), 0) * 100, 1
  ) AS first_visit_success_rate_pct,
  -- Utilization calculation (on-job time / working hours)
  ROUND(
    SUM(EXTRACT(EPOCH FROM (resolved_at - dispatched_at)) / 3600) / 8 * 100, 1
  ) AS utilization_percentage
FROM breakdowns
WHERE engineer_assigned IS NOT NULL
  AND dispatched_at IS NOT NULL
  AND created_at >= CURRENT_DATE
GROUP BY engineer_name
ORDER BY utilization_percentage DESC;
```

**Visualization:**
- Bar chart: Engineer utilization (target: 60-80%)
- Alert: "Engineer Smith at 92% utilization - consider additional resource"
- Comparison: Utilization vs availability (are we understaffed?)

**Complexity:** MEDIUM
**Impact:** HIGH (staffing decisions)

---

### 8.2 Depot Resource Allocation
**Description:** Compare breakdown volume and resolution capacity by depot
**Business Value:** Allocate resources based on demand, identify bottlenecks
**Data Requirements:**
```sql
SELECT
  depot,
  COUNT(*) AS breakdowns_today,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_today,
  COUNT(*) FILTER (WHERE status IN ('active', 'acknowledged', 'dispatched')) AS active_breakdowns,
  COUNT(DISTINCT supervisor_badge) AS active_supervisors,
  COUNT(DISTINCT engineer_assigned) AS active_engineers,
  AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) AS avg_response_minutes,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_minutes,
  -- Resource adequacy score
  CASE
    WHEN COUNT(*) FILTER (WHERE status IN ('active', 'acknowledged', 'dispatched')) > COUNT(DISTINCT engineer_assigned) * 3 THEN 'understaffed'
    WHEN COUNT(*) FILTER (WHERE status IN ('active', 'acknowledged', 'dispatched')) < COUNT(DISTINCT engineer_assigned) THEN 'overstaffed'
    ELSE 'adequate'
  END AS staffing_status
FROM breakdowns
WHERE created_at >= CURRENT_DATE
GROUP BY depot
ORDER BY breakdowns_today DESC;
```

**Visualization:**
- Comparison table: Depot performance metrics
- Alert: "Washington depot handling 23 breakdowns with 4 engineers - consider reallocation"
- Map view: Depot locations with workload indicators

**Complexity:** LOW
**Impact:** MEDIUM

---

### 8.3 Peak Time Staffing Recommendations
**Description:** Recommend optimal shift schedules based on breakdown patterns
**Business Value:** Reduce overtime, improve response times during busy periods
**Data Requirements:**
```sql
-- Analyze breakdown volume by time of day over last 90 days
WITH hourly_demand AS (
  SELECT
    EXTRACT(HOUR FROM created_at) AS hour_of_day,
    EXTRACT(DOW FROM created_at) AS day_of_week,
    COUNT(*) AS breakdown_count
  FROM breakdowns
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY hour_of_day, day_of_week
)
SELECT
  hour_of_day,
  AVG(breakdown_count) AS avg_breakdowns_per_hour,
  MAX(breakdown_count) AS max_breakdowns_per_hour,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY breakdown_count) AS p95_breakdowns_per_hour,
  -- Recommended staffing (assume 1 supervisor can handle 3 concurrent breakdowns)
  CEIL(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY breakdown_count) / 3) AS recommended_supervisors,
  CEIL(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY breakdown_count) / 5) AS recommended_engineers
FROM hourly_demand
GROUP BY hour_of_day
ORDER BY hour_of_day;
```

**Visualization:**
- Staffing heatmap: Hour of day (X) vs recommended staff count (color intensity)
- Recommendation: "Increase SDC staff from 2 to 4 during 7-9am peak"
- Cost-benefit: "Additional staffing could reduce avg response time by 30%"

**Complexity:** MEDIUM
**Impact:** HIGH (operational efficiency)

---

### 8.4 Vehicle Rotation Optimization
**Description:** Identify vehicles that should be rotated out of service for maintenance
**Business Value:** Preventive maintenance, reduce critical breakdowns
**Data Requirements:**
```sql
-- Vehicles due for preventive maintenance based on breakdown patterns
SELECT
  fv.fleet_no,
  fv.make,
  fv.model,
  fv.depot,
  fv.last_maintenance_date,
  EXTRACT(EPOCH FROM (CURRENT_DATE - fv.last_maintenance_date)) / 30 AS months_since_maintenance,
  COUNT(b.breakdown_id) AS breakdowns_since_maintenance,
  COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') AS critical_breakdowns,
  MAX(b.created_at) AS last_breakdown_date,
  -- Priority scoring
  ROUND(
    (EXTRACT(EPOCH FROM (CURRENT_DATE - fv.last_maintenance_date)) / 30 * 10) +
    (COUNT(b.breakdown_id) * 5) +
    (COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') * 20), 0
  ) AS maintenance_priority_score,
  CASE
    WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - fv.last_maintenance_date)) / 30 >= 6
      AND COUNT(b.breakdown_id) >= 3 THEN 'immediate'
    WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - fv.last_maintenance_date)) / 30 >= 4
      OR COUNT(b.breakdown_id) >= 2 THEN 'this_week'
    WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - fv.last_maintenance_date)) / 30 >= 3 THEN 'this_month'
    ELSE 'scheduled'
  END AS maintenance_urgency
FROM fleet_vehicles fv
LEFT JOIN breakdowns b ON b.fleet_no = fv.fleet_no
  AND b.created_at >= fv.last_maintenance_date
WHERE fv.is_active = true
GROUP BY fv.fleet_no, fv.make, fv.model, fv.depot, fv.last_maintenance_date
ORDER BY maintenance_priority_score DESC;
```

**Visualization:**
- Priority list: Vehicles ranked by maintenance urgency
- Calendar view: Maintenance schedule optimization
- Alert: "5 vehicles flagged for immediate preventive maintenance"

**Complexity:** MEDIUM
**Impact:** HIGH (preventive maintenance ROI)

---

### 8.5 Route Coverage Analysis
**Description:** Identify routes with inadequate vehicle allocation or high breakdown risk
**Business Value:** Optimize route assignments, improve service reliability
**Data Requirements:**
```sql
SELECT
  COALESCE(route, 'UNASSIGNED') AS route_number,
  COUNT(*) AS breakdowns_30d,
  COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_breakdowns,
  COUNT(DISTINCT fleet_no) AS vehicles_used_on_route,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS avg_downtime_minutes,
  SUM(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS total_downtime_minutes,
  -- Service reliability score (lower is better)
  ROUND(
    (COUNT(*) * 10) +
    (COUNT(*) FILTER (WHERE severity = 'STOP') * 50) +
    (SUM(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) / 60 * 5), 0
  ) AS service_disruption_score,
  CASE
    WHEN COUNT(*) >= 10 AND COUNT(DISTINCT fleet_no) <= 3 THEN 'needs_more_vehicles'
    WHEN COUNT(*) >= 15 THEN 'high_breakdown_route'
    ELSE 'normal'
  END AS route_status
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY route
ORDER BY service_disruption_score DESC;
```

**Visualization:**
- Route ranking table with service disruption scores
- Map overlay: High-risk routes highlighted
- Recommendation: "Route X10 needs 2 additional allocated vehicles"

**Complexity:** MEDIUM
**Impact:** MEDIUM

---

## Category 9: Dashboard Widgets (New Visualizations)

### 9.1 Real-Time Activity Feed
**Description:** Live stream of breakdown events, assessments, resolutions
**Business Value:** Situational awareness, transparency
**Data Source:** WebSocket stream + activities table
**Visualization:**
- Scrolling feed widget (right sidebar)
- Event cards with icons, timestamps, brief description
- Filter options: All events, Critical only, My depot

**Complexity:** LOW (already has WebSocket infrastructure)
**Impact:** MEDIUM

---

### 9.2 Critical Breakdown Map
**Description:** Geographic visualization of active STOP breakdowns
**Business Value:** Spatial awareness, identify clustering
**Data Source:** breakdowns table with location_lat/lng
**Visualization:**
- Interactive map (Leaflet or Mapbox)
- Red pins: STOP breakdowns
- Yellow pins: AMBER breakdowns
- Clicking pin shows breakdown details + actions

**Complexity:** MEDIUM
**Impact:** HIGH

---

### 9.3 Response Time Speedometer
**Description:** Gauge showing current avg response time vs target
**Business Value:** At-a-glance performance indicator
**Data Source:** breakdowns table (acknowledged_at - created_at)
**Visualization:**
- Semicircle gauge: 0-20 mins
- Color zones: Green (0-5), Yellow (5-10), Red (>10)
- Needle shows current avg

**Complexity:** LOW
**Impact:** MEDIUM

---

### 9.4 Fleet Health Heatmap
**Description:** Grid view of all active vehicles with color-coded health status
**Business Value:** Quick identification of problem vehicles
**Data Source:** fleet_vehicles + breakdown aggregation
**Visualization:**
- Grid of squares (each = 1 vehicle)
- Color: Green (no breakdowns 30d), Yellow (1-2), Orange (3-4), Red (5+)
- Hover tooltip: Fleet number, last breakdown, days since maintenance

**Complexity:** MEDIUM
**Impact:** MEDIUM

---

### 9.5 Decision Distribution Donut Chart
**Description:** Visual breakdown of STOP/AMBER/CONTINUE percentages
**Business Value:** Quick understanding of severity distribution
**Data Source:** breakdowns table (wizard_decision)
**Visualization:**
- Donut chart with 3 segments
- Center shows total breakdown count
- Tooltip: Count + percentage for each decision type

**Complexity:** LOW
**Impact:** LOW

---

### 9.6 Breakdown Timeline (Gantt-style)
**Description:** Horizontal timeline showing breakdown lifecycle stages
**Business Value:** Understand bottlenecks in workflow
**Data Source:** breakdowns table (all timestamp fields)
**Visualization:**
- Horizontal bars: Created → Acknowledged → Dispatched → Resolved
- Color coding by stage duration
- Identify delays at each stage

**Complexity:** MEDIUM
**Impact:** MEDIUM

---

### 9.7 SLA Compliance Traffic Lights
**Description:** Green/yellow/red indicators for SLA performance
**Business Value:** Instant visibility on service level commitments
**Data Source:** SLA compliance query (Category 2.5)
**Visualization:**
- Three circles: Acknowledge SLA, Dispatch SLA, Resolution SLA
- Color: Green (>95%), Yellow (90-95%), Red (<90%)
- Click for detailed breakdown

**Complexity:** LOW
**Impact:** HIGH

---

### 9.8 Top 5 Problem Vehicles Widget
**Description:** Quick list of vehicles with most breakdowns this week
**Business Value:** Immediate action list for fleet management
**Data Source:** Fleet reliability query (Category 4.1)
**Visualization:**
- Ranked list (1-5)
- Each row: Fleet number, breakdown count, last issue
- Action button: "View full history"

**Complexity:** LOW
**Impact:** HIGH

---

### 9.9 Supervisor Activity Indicator
**Description:** Show which supervisors are currently active/idle
**Business Value:** Resource allocation, workload visibility
**Data Source:** supervisor_sessions table + real-time activity
**Visualization:**
- Circular avatars with status indicators
- Green dot: Active (activity <5 min ago)
- Yellow dot: Idle (5-15 min)
- Gray dot: Offline (>15 min)

**Complexity:** MEDIUM
**Impact:** LOW

---

### 9.10 Breakdown Velocity Meter
**Description:** Real-time rate of new breakdowns (per hour)
**Business Value:** Early warning system for incident surges
**Data Source:** Breakdown velocity query (Category 1.5)
**Visualization:**
- Large number: "4.2 breakdowns/hour"
- Sparkline: Last 6 hours
- Alert threshold indicator

**Complexity:** LOW
**Impact:** HIGH

---

## Category 10: Data Exports & Reports (Management Visibility)

### 10.1 Executive Dashboard Export (PDF/Excel)
**Description:** One-click export of key metrics for management meetings
**Business Value:** Shareable insights, offline review
**Contents:**
- Summary statistics (total, critical, avg response)
- Key charts (breakdown trend, decision distribution)
- Top problem vehicles and routes
- SLA compliance metrics

**Complexity:** MEDIUM
**Impact:** HIGH

---

### 10.2 Breakdown Detail Export (CSV)
**Description:** Export full breakdown data for custom analysis
**Business Value:** Power users can perform deep dives in Excel/BI tools
**Contents:**
- All breakdown fields (timestamps, decisions, locations, etc.)
- Calculated fields (duration, response time, etc.)
- Filter options: Date range, depot, severity

**Complexity:** LOW
**Impact:** MEDIUM

---

### 10.3 Fleet Performance Report (PDF)
**Description:** Monthly comprehensive fleet analysis
**Business Value:** Strategic planning, budget justification
**Contents:**
- Fleet reliability rankings
- Maintenance recommendations
- Cost impact analysis
- Breakdown trends by vehicle type

**Complexity:** MEDIUM
**Impact:** HIGH

---

### 10.4 Audit Trail Export
**Description:** Export complete audit history for compliance/investigation
**Business Value:** Safety investigations, performance reviews
**Contents:**
- All audit events for selected breakdowns
- User actions, timestamps, reasons
- Decision changes and overrides

**Complexity:** LOW
**Impact:** MEDIUM

---

### 10.5 Custom Report Builder
**Description:** Self-service report creation with drag-and-drop filters
**Business Value:** Empowers users to answer their own questions
**Features:**
- Select date range
- Choose metrics (breakdown count, avg time, etc.)
- Group by (depot, route, vehicle, supervisor, etc.)
- Export formats (PDF, Excel, CSV)

**Complexity:** HIGH
**Impact:** HIGH (advanced users)

---

## Implementation Roadmap

### Phase 1: Quick Wins (Weeks 1-2)
**Goal:** Deliver immediate value with low-complexity, high-impact analytics

1. Response Time Analytics (Category 1.2)
2. Breakdown Velocity (Category 1.5)
3. Fleet Reliability Ranking (Category 4.1)
4. Peak Time Analysis (Category 3.3)
5. Real-Time Activity Feed Widget (Category 9.1)
6. Top 5 Problem Vehicles Widget (Category 9.8)

**Estimated Effort:** 40 hours
**Impact:** HIGH

---

### Phase 2: Operational Excellence (Weeks 3-4)
**Goal:** Enhance SDC operator decision-making and workflow efficiency

1. Similar Breakdown History Lookup (Category 5.1)
2. SLA Compliance Tracking (Category 2.5)
3. Anomaly Detection (Breakdown Spike, Repeat, Prolonged Unresolved) (Category 7)
4. Critical Breakdown Map Widget (Category 9.2)
5. SLA Traffic Lights Widget (Category 9.7)
6. Daily Breakdown Summary Report (Category 6.1)

**Estimated Effort:** 60 hours
**Impact:** HIGH

---

### Phase 3: Strategic Insights (Weeks 5-8)
**Goal:** Enable predictive analytics and resource optimization

1. Breakdown Prediction by Vehicle Age (Category 3.1)
2. Route Risk Scoring (Category 3.2)
3. Engineering Resource Utilization (Category 8.1)
4. Fleet Health Heatmap Widget (Category 9.4)
5. Monthly Fleet Health Report (Category 6.3)
6. Cost Impact Analysis (Category 6.5)
7. Vehicle Rotation Optimization (Category 8.4)

**Estimated Effort:** 80 hours
**Impact:** HIGH

---

### Phase 4: Advanced Analytics (Weeks 9-12)
**Goal:** Machine learning, custom reports, advanced visualizations

1. Issue Category Prediction Model (Category 3.5)
2. Engineer Skill Matching (Category 5.2)
3. Route Diversion Recommendations (Category 5.3)
4. Custom Report Builder (Category 10.5)
5. Breakdown Timeline Gantt Widget (Category 9.6)
6. Supervisor Performance Benchmarking (Category 2.2) *if approved by HR*

**Estimated Effort:** 100 hours
**Impact:** MEDIUM-HIGH

---

## Technical Implementation Requirements

### Database Enhancements
1. **Create missing tables** (from DATABASE_ANALYSIS_REPORT.md):
   - `breakdown_events` (audit trail)
   - `activities` (migrate from JSON)
   - `breakdown_notes` (SDC notes)
   - `engineering_requests` (dispatch tracking)

2. **Add missing fields to `breakdowns` table**:
   - Timestamp fields: `acknowledged_at`, `decision_at`, `dispatched_at`, `on_site_at`, `resolved_at`
   - Decision tracking: `acknowledged_by`, `decided_by`, `sdc_decision`, `decision_notes`
   - Engineering: `engineering_requested_at`, `engineering_notes`, `engineer_assigned`
   - Identifiers: `breakdown_id` (unique), `daily_id`, `depot`, `route`, `severity`

3. **Create indexes** for performance:
   ```sql
   CREATE INDEX idx_breakdowns_breakdown_id ON breakdowns(breakdown_id);
   CREATE INDEX idx_breakdowns_status ON breakdowns(status);
   CREATE INDEX idx_breakdowns_severity ON breakdowns(severity);
   CREATE INDEX idx_breakdowns_priority_level ON breakdowns(priority_level);
   CREATE INDEX idx_breakdowns_depot ON breakdowns(depot);
   CREATE INDEX idx_breakdowns_route ON breakdowns(route);
   CREATE INDEX idx_breakdowns_supervisor_badge ON breakdowns(supervisor_badge);
   ```

4. **Create database views** for common queries:
   - `v_active_breakdowns` (enriched breakdown data with vehicle/supervisor joins)
   - `v_dashboard_stats` (real-time statistics)
   - `v_fleet_reliability` (breakdown frequency by vehicle)

5. **Stored procedures** for complex analytics:
   - `calculate_response_time_stats(start_date, end_date)`
   - `get_fleet_reliability_score(fleet_no)`
   - `predict_breakdown_risk(fleet_no, route)`

---

### Backend API Enhancements
1. **New analytics endpoints**:
   - `GET /api/analytics/response-time` - Response time metrics
   - `GET /api/analytics/fleet-reliability` - Fleet rankings
   - `GET /api/analytics/breakdown-velocity` - Real-time rate
   - `GET /api/analytics/sla-compliance` - SLA performance
   - `GET /api/analytics/route-risk-scores` - Route risk analysis
   - `GET /api/analytics/supervisor-performance` - Supervisor metrics (auth required)
   - `GET /api/analytics/cost-impact` - Cost analysis

2. **Report generation endpoints**:
   - `POST /api/reports/daily-summary` - Generate daily PDF
   - `POST /api/reports/weekly-dashboard` - Weekly comparison
   - `POST /api/reports/monthly-fleet` - Fleet health report
   - `GET /api/reports/export-breakdown-data` - CSV export

3. **Real-time analytics via WebSocket**:
   - Broadcast analytics updates every 5 minutes
   - Anomaly alerts (breakdown spike, repeat breakdown)
   - SLA compliance warnings

---

### Frontend Dashboard Enhancements
1. **New dashboard sections**:
   - Analytics Overview (top-level KPIs)
   - Fleet Health (reliability rankings, problem vehicles)
   - Route Intelligence (risk scores, hotspots)
   - Performance Tracking (SLA, response times, supervisor metrics)
   - Reports & Exports (self-service reports)

2. **Interactive visualizations**:
   - Chart library: Chart.js or Recharts (React)
   - Map library: Leaflet or Mapbox GL
   - Table library: React Table with sorting/filtering
   - Gauge/speedometer: react-gauge-chart

3. **User preferences**:
   - Save dashboard layout customization
   - Favorite reports
   - Alert thresholds configuration

---

### BigQuery Integration (Optional - Advanced Analytics)
For large-scale historical analysis and machine learning:

1. **Export Supabase data to BigQuery**:
   - Daily scheduled exports via Cloud Functions
   - Tables: `breakdowns`, `activities`, `fleet_vehicles`, `supervisors`

2. **BigQuery ML models**:
   - Breakdown prediction model (issue category classification)
   - Vehicle failure probability model
   - Route risk scoring model

3. **Analytics queries in BigQuery**:
   - Complex aggregations (faster than Supabase for large datasets)
   - Historical trend analysis (multi-year data)
   - Advanced geospatial analysis (BigQuery GIS)

4. **Sync predictions back to Supabase**:
   - Store ML predictions in `breakdown_predictions` table
   - Display in dashboard as recommendations

---

## Sample SQL Queries (Ready to Use)

### Query 1: Current Dashboard KPIs
```sql
-- Real-time operational metrics
SELECT
  -- Active breakdown counts
  COUNT(*) FILTER (WHERE status IN ('active', 'acknowledged', 'dispatched', 'on_site')) AS active_breakdowns,
  COUNT(*) FILTER (WHERE severity = 'STOP' AND status != 'resolved') AS critical_active,
  COUNT(*) FILTER (WHERE acknowledged_at IS NULL AND status != 'resolved') AS pending_acknowledgment,
  COUNT(*) FILTER (WHERE engineer_assigned IS NOT NULL AND status != 'resolved') AS engineering_dispatched,

  -- Response time metrics
  ROUND(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) FILTER (WHERE acknowledged_at IS NOT NULL AND created_at >= CURRENT_DATE), 1) AS avg_response_time_minutes_today,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) FILTER (WHERE acknowledged_at IS NOT NULL AND created_at >= CURRENT_DATE), 1) AS p95_response_time_minutes_today,

  -- Resolution metrics
  COUNT(*) FILTER (WHERE status = 'resolved' AND created_at >= CURRENT_DATE) AS resolved_today,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL AND created_at >= CURRENT_DATE), 0) AS avg_resolution_time_minutes_today,

  -- Breakdown velocity
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') AS breakdowns_last_hour,
  ROUND(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour')::numeric / (EXTRACT(EPOCH FROM (NOW() - (NOW() - INTERVAL '1 hour'))) / 3600), 1) AS breakdowns_per_hour_rate,

  -- Activity metrics
  COUNT(DISTINCT supervisor_badge) FILTER (WHERE created_at >= CURRENT_DATE) AS active_supervisors_today,
  COUNT(DISTINCT engineer_assigned) FILTER (WHERE dispatched_at >= CURRENT_DATE) AS active_engineers_today,

  -- Timestamp
  NOW() AS snapshot_timestamp
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

---

### Query 2: Fleet Reliability Ranking (Top 20 Problem Vehicles)
```sql
-- Identify vehicles with highest breakdown frequency in last 90 days
WITH fleet_breakdown_stats AS (
  SELECT
    fv.fleet_no,
    fv.make,
    fv.model,
    fv.year,
    fv.depot,
    fv.registration,
    COUNT(b.breakdown_id) AS breakdown_count_90d,
    COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'STOP') AS critical_count,
    COUNT(b.breakdown_id) FILTER (WHERE b.severity = 'AMBER') AS amber_count,
    SUM(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 3600) AS total_downtime_hours,
    AVG(EXTRACT(EPOCH FROM (b.resolved_at - b.created_at)) / 60) AS avg_resolution_minutes,
    MAX(b.created_at) AS last_breakdown_date,
    EXTRACT(EPOCH FROM (CURRENT_DATE - MAX(b.created_at))) / 86400 AS days_since_last_breakdown,
    json_agg(DISTINCT b.issue_category) FILTER (WHERE b.issue_category IS NOT NULL) AS common_issues
  FROM fleet_vehicles fv
  LEFT JOIN breakdowns b ON b.fleet_no = fv.fleet_no
    AND b.created_at >= CURRENT_DATE - INTERVAL '90 days'
  WHERE fv.is_active = true
  GROUP BY fv.fleet_no, fv.make, fv.model, fv.year, fv.depot, fv.registration
)
SELECT
  fleet_no,
  make,
  model,
  year,
  depot,
  registration,
  breakdown_count_90d,
  critical_count,
  amber_count,
  ROUND(total_downtime_hours, 1) AS total_downtime_hours,
  ROUND(avg_resolution_minutes, 0) AS avg_resolution_minutes,
  last_breakdown_date,
  ROUND(days_since_last_breakdown, 0) AS days_since_last_breakdown,
  common_issues,
  -- Unreliability score (higher = more problematic)
  ROUND(
    (breakdown_count_90d * 10) +
    (critical_count * 50) +
    (amber_count * 20) +
    (COALESCE(total_downtime_hours, 0) * 5), 0
  ) AS unreliability_score,
  -- Risk category
  CASE
    WHEN breakdown_count_90d >= 5 AND critical_count >= 2 THEN 'RETIRE_CANDIDATE'
    WHEN breakdown_count_90d >= 4 OR critical_count >= 2 THEN 'MAINTENANCE_PRIORITY'
    WHEN breakdown_count_90d >= 2 THEN 'MONITOR'
    WHEN breakdown_count_90d >= 1 THEN 'WATCH'
    ELSE 'RELIABLE'
  END AS risk_category
FROM fleet_breakdown_stats
ORDER BY unreliability_score DESC, breakdown_count_90d DESC
LIMIT 20;
```

---

### Query 3: Breakdown Hotspot Analysis
```sql
-- Identify geographic locations with high breakdown frequency
SELECT
  location,
  location_lat,
  location_lng,
  COUNT(*) AS breakdown_count_90d,
  COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_count,
  COUNT(DISTINCT fleet_no) AS vehicles_affected,
  COUNT(DISTINCT route) AS routes_affected,
  json_agg(DISTINCT issue_category) FILTER (WHERE issue_category IS NOT NULL) AS common_issues,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60), 0) AS avg_resolution_minutes,
  MIN(created_at) AS first_breakdown_date,
  MAX(created_at) AS last_breakdown_date,
  -- Calculate distance from city center (Newcastle: -1.6118, 54.9783)
  ROUND(
    ST_Distance(
      ST_MakePoint(location_lng, location_lat)::geography,
      ST_MakePoint(-1.6118, 54.9783)::geography
    ) / 1000, 1
  ) AS distance_from_newcastle_km
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND location IS NOT NULL
  AND location_lat IS NOT NULL
  AND location_lng IS NOT NULL
GROUP BY location, location_lat, location_lng
HAVING COUNT(*) >= 3
ORDER BY breakdown_count_90d DESC
LIMIT 50;
```

---

### Query 4: SLA Compliance Report
```sql
-- Calculate SLA compliance for last 30 days
WITH sla_calculations AS (
  SELECT
    breakdown_id,
    severity,
    created_at,
    acknowledged_at,
    dispatched_at,
    resolved_at,
    -- Calculate time intervals in minutes
    EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60 AS acknowledge_time_minutes,
    EXTRACT(EPOCH FROM (dispatched_at - acknowledged_at)) / 60 AS dispatch_time_minutes,
    EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60 AS resolution_time_minutes,
    -- Define SLA thresholds
    CASE severity
      WHEN 'STOP' THEN 5
      WHEN 'AMBER' THEN 10
      WHEN 'CONTINUE' THEN 15
      ELSE 15
    END AS acknowledge_sla_minutes,
    CASE severity
      WHEN 'STOP' THEN 15
      WHEN 'AMBER' THEN 30
      ELSE NULL
    END AS dispatch_sla_minutes,
    CASE severity
      WHEN 'STOP' THEN 120
      WHEN 'AMBER' THEN 240
      WHEN 'CONTINUE' THEN 480
      ELSE 480
    END AS resolution_sla_minutes
  FROM breakdowns
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND status = 'resolved'
)
SELECT
  severity,
  COUNT(*) AS total_breakdowns,

  -- Acknowledge SLA
  ROUND(
    COUNT(*) FILTER (WHERE acknowledge_time_minutes <= acknowledge_sla_minutes)::numeric / COUNT(*) * 100, 1
  ) AS acknowledge_sla_met_pct,
  ROUND(AVG(acknowledge_time_minutes), 1) AS avg_acknowledge_minutes,
  ROUND(acknowledge_sla_minutes, 0) AS acknowledge_sla_target_minutes,

  -- Dispatch SLA (only for STOP/AMBER)
  ROUND(
    COUNT(*) FILTER (WHERE dispatch_time_minutes <= dispatch_sla_minutes OR dispatch_sla_minutes IS NULL)::numeric / COUNT(*) * 100, 1
  ) AS dispatch_sla_met_pct,
  ROUND(AVG(dispatch_time_minutes), 1) AS avg_dispatch_minutes,
  dispatch_sla_minutes AS dispatch_sla_target_minutes,

  -- Resolution SLA
  ROUND(
    COUNT(*) FILTER (WHERE resolution_time_minutes <= resolution_sla_minutes)::numeric / COUNT(*) * 100, 1
  ) AS resolution_sla_met_pct,
  ROUND(AVG(resolution_time_minutes), 0) AS avg_resolution_minutes,
  resolution_sla_minutes AS resolution_sla_target_minutes,

  -- Overall SLA (all three criteria met)
  ROUND(
    COUNT(*) FILTER (
      WHERE acknowledge_time_minutes <= acknowledge_sla_minutes
        AND (dispatch_time_minutes <= dispatch_sla_minutes OR dispatch_sla_minutes IS NULL)
        AND resolution_time_minutes <= resolution_sla_minutes
    )::numeric / COUNT(*) * 100, 1
  ) AS overall_sla_met_pct
FROM sla_calculations
GROUP BY severity, acknowledge_sla_minutes, dispatch_sla_minutes, resolution_sla_minutes
ORDER BY
  CASE severity
    WHEN 'STOP' THEN 1
    WHEN 'AMBER' THEN 2
    WHEN 'CONTINUE' THEN 3
    ELSE 4
  END;
```

---

### Query 5: Breakdown Velocity & Anomaly Detection
```sql
-- Real-time breakdown rate with anomaly detection
WITH hourly_baseline AS (
  -- Calculate average hourly breakdown count over last 7 days (excluding today)
  SELECT
    AVG(hourly_count) AS avg_hourly_breakdowns,
    STDDEV(hourly_count) AS stddev_hourly_breakdowns,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY hourly_count) AS p95_hourly_breakdowns
  FROM (
    SELECT
      date_trunc('hour', created_at) AS breakdown_hour,
      COUNT(*) AS hourly_count
    FROM breakdowns
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND created_at < CURRENT_DATE
    GROUP BY date_trunc('hour', created_at)
  ) AS hourly_counts
),
current_hour_stats AS (
  SELECT
    COUNT(*) AS breakdowns_current_hour,
    array_agg(breakdown_id ORDER BY created_at DESC) AS recent_breakdown_ids
  FROM breakdowns
  WHERE created_at >= date_trunc('hour', NOW())
),
last_24_hours AS (
  SELECT
    date_trunc('hour', created_at) AS breakdown_hour,
    COUNT(*) AS hourly_count
  FROM breakdowns
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY date_trunc('hour', created_at)
  ORDER BY breakdown_hour DESC
)
SELECT
  -- Current hour metrics
  ch.breakdowns_current_hour,
  ROUND(ch.breakdowns_current_hour::numeric * 4, 1) AS estimated_daily_rate, -- Extrapolate to 24 hours

  -- Baseline comparison
  ROUND(hb.avg_hourly_breakdowns, 1) AS baseline_avg_hourly,
  ROUND(hb.stddev_hourly_breakdowns, 1) AS baseline_stddev,
  ROUND(hb.p95_hourly_breakdowns, 0) AS baseline_p95_hourly,

  -- Anomaly detection
  ROUND(
    (ch.breakdowns_current_hour - hb.avg_hourly_breakdowns) / NULLIF(hb.stddev_hourly_breakdowns, 0), 2
  ) AS z_score,
  CASE
    WHEN (ch.breakdowns_current_hour - hb.avg_hourly_breakdowns) / NULLIF(hb.stddev_hourly_breakdowns, 0) > 2.5 THEN 'CRITICAL_ANOMALY'
    WHEN (ch.breakdowns_current_hour - hb.avg_hourly_breakdowns) / NULLIF(hb.stddev_hourly_breakdowns, 0) > 1.5 THEN 'WARNING_ANOMALY'
    WHEN ch.breakdowns_current_hour > hb.p95_hourly_breakdowns THEN 'ELEVATED'
    ELSE 'NORMAL'
  END AS anomaly_status,

  -- Last 24 hours trend
  json_agg(json_build_object(
    'hour', TO_CHAR(lh.breakdown_hour, 'HH24:MI'),
    'count', lh.hourly_count
  ) ORDER BY lh.breakdown_hour DESC) AS last_24_hours_trend,

  -- Current hour breakdown IDs for investigation
  ch.recent_breakdown_ids,

  -- Timestamp
  NOW() AS analysis_timestamp
FROM current_hour_stats ch, hourly_baseline hb, last_24_hours lh
GROUP BY ch.breakdowns_current_hour, ch.recent_breakdown_ids, hb.avg_hourly_breakdowns, hb.stddev_hourly_breakdowns, hb.p95_hourly_breakdowns;
```

---

## Success Metrics & KPIs

To measure the impact of analytics implementation:

### Operational Efficiency
- **Target:** Reduce avg response time from current baseline by 20%
- **Measure:** Track monthly avg response time (acknowledged_at - created_at)

### Decision Quality
- **Target:** 90%+ decision accuracy (wizard decisions validated by outcomes)
- **Measure:** % of decisions not requiring edit/override

### Resource Utilization
- **Target:** Optimize engineer utilization to 70-80% (reduce idle time)
- **Measure:** Track on-job time vs available hours

### Predictive Maintenance
- **Target:** Reduce repeat breakdowns by 30%
- **Measure:** % of vehicles with 2+ breakdowns in 7 days

### Cost Reduction
- **Target:** 25% reduction in breakdown-related costs through preventive maintenance
- **Measure:** Monthly breakdown cost analysis (downtime + engineering + admin)

### User Adoption
- **Target:** 80%+ of SDC operators actively using analytics dashboard
- **Measure:** Google Analytics tracking dashboard usage

---

## Conclusion

This comprehensive analytics strategy provides 45+ opportunities to transform the SDC Operations Dashboard from a reactive monitoring tool into a proactive, data-driven intelligence platform.

**Recommended Starting Point:**
1. Implement Phase 1 Quick Wins (6 analytics features in 2 weeks)
2. Measure impact on response time and user engagement
3. Gather feedback from SDC operators
4. Prioritize Phase 2 based on operational needs and ROI

**Key Success Factors:**
- Complete database schema migrations (missing tables and fields)
- Establish data quality standards (consistent field naming, validation)
- Implement robust WebSocket real-time updates
- Design intuitive visualizations focused on actionability
- Provide training to SDC operators on new analytics features

**Long-Term Vision:**
Transform Go BARRY from a breakdown tracking system into a comprehensive fleet intelligence platform with predictive capabilities, automated recommendations, and continuous optimization.

---

**Document Status:** Ready for Technical Review
**Next Steps:**
1. Prioritize analytics features with stakeholders
2. Complete database schema updates (prerequisite)
3. Begin Phase 1 implementation
4. Establish analytics review cadence (weekly during implementation)

---

**Questions or feedback?** Contact the development team for clarification on any analytics opportunity.
