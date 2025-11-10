# Feature Priority Matrix - Visual Guide

**Date:** November 10, 2025
**Purpose:** Quick reference for prioritizing GTFS features

---

## Quick Priority Ranking

```
PRIORITY  FEATURE                           EFFORT  VALUE   READY?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  LIVE ROUTE STATUS DASHBOARD          ⭐⭐    ⭐⭐⭐  ✅ NOW
    (Green/Amber/Red for 231 routes)     12-16h  +3min

2️⃣  ROUTE COVERAGE ANALYSIS              ⭐⭐⭐  ⭐⭐⭐  ✅ NOW
    (Which routes have spare backup)     14-18h  +5min

3️⃣  STOP-LEVEL INCIDENT HEATMAP          ⭐⭐⭐  ⭐⭐    ✅ NOW
    (Breakdown hotspots visualization)   16-20h  +8min

4️⃣  DYNAMIC SPARE ALLOCATION             ⭐⭐⭐⭐ ⭐⭐⭐⭐ ✅ WEEK 4
    (AI parking for spares)              18-24h  -15min

5️⃣  SMART ENGINEER DISPATCH              ⭐⭐⭐⭐ ⭐⭐⭐  ✅ WEEK 6
    (Match skills to jobs)               20-28h  -12min

6️⃣  PASSENGER IMPACT ASSESSMENT          ⭐⭐    ⭐⭐⭐  ✅ WEEK 8
    (How many passengers affected)       14-18h  Prioritize

7️⃣  SEASONAL RISK PROFILES               ⭐⭐    ⭐⭐    ✅ WEEK 10
    (Winter/summer patterns)             16-22h  Plan ahead

8️⃣  STOP ACCESSIBILITY MATCHING          ⭐     ⭐⭐    ✅ WEEK 12
    (Wheelchair vehicle matching)        8-12h   Compliance

9️⃣  PREDICTIVE ROUTE ALERTS              ⭐⭐⭐⭐⭐ ⭐⭐⭐⭐⭐ ⚠️ MONTH 4
    (Predict breakdowns 30-60 min)       26-34h  Prevent

🔟  GTFS-RT PUBLIC API                   ⭐⭐    ⭐⭐    ✅ WEEK 14
    (Journey planner integration)        12-16h  Visibility
```

---

## Decision Matrix

```
                        ┌─────────────────┬──────────────────┐
                        │   QUICK WINS    │  STRATEGIC       │
                   HIGH │  (Build First)  │  (Build Next)    │
             BUSINESS   │                 │                  │
             VALUE      │ #1 Status       │ #9 Predictive    │
                        │ #2 Coverage     │ #5 Engineer      │
                        │ #3 Heatmap      │                  │
                        │ #6 Passenger    │                  │
                        └─────────────────┼──────────────────┘
                        │    NICE TO HAVE │  DEFER           │
                   LOW  │    (Low ROI)    │  (Complex, Low   │
                        │                 │   Value)         │
                        │ #7 Seasonal     │                  │
                        │ #8 Accessibility│                  │
                        └─────────────────┴──────────────────┘
                             LOW EFFORT        HIGH EFFORT
                           (12-18 hours)     (20-34 hours)
```

---

## Effort vs Value Scatter Plot

```
VALUE
  ⭐⭐⭐⭐⭐ │                    9️⃣
  ⭐⭐⭐⭐  │        5️⃣
  ⭐⭐⭐    │  1️⃣  2️⃣  4️⃣  6️⃣
  ⭐⭐     │  3️⃣              7️⃣
  ⭐      │                      8️⃣
  ─────────┼────────────────────────
         10h  15h  20h  25h  30h  35h
                    EFFORT
```

**Legend:**
- **Quadrant 1 (Top-Left):** Quick Wins - Build first (#1, #2, #3, #6)
- **Quadrant 2 (Top-Right):** Strategic - Build after quick wins (#5, #9)
- **Quadrant 3 (Bottom-Left):** Easy but low impact - Skip or defer (#7, #8)
- **Quadrant 4 (Bottom-Right):** Hard & low value - Not recommended

---

## Timeline: 18 Weeks, 4 Phases

### Phase 1: QUICK WINS (Weeks 1-4)
```
Week 1: Feature #1 - Live Route Status Dashboard
Week 2: Feature #2 - Route Coverage Analysis
Week 3-4: Feature #3 - Stop Heatmap
Total: 42-54 hours
Value Delivered: Week 1
```

### Phase 2: OPTIMIZATION (Weeks 5-8)
```
Week 5-6: Feature #4 - Dynamic Spare Allocation
Week 7-8: Feature #5 - Smart Engineer Dispatch
Total: 38-52 hours
Value Delivered: Week 5
```

### Phase 3: INTELLIGENCE (Weeks 9-13)
```
Week 9-10: Feature #7 - Seasonal Risk Profiles
Week 11-12: Feature #8 - Stop Accessibility
Week 13: Feature #6 - Passenger Impact (moved here)
Total: 38-52 hours
NOTE: Feature #9 (Predictive) deferred to Month 4
```

### Phase 4: INTEGRATION (Weeks 14-18)
```
Week 14-15: Feature #10 - GTFS-RT Public API
Week 16-17: Testing & optimization
Week 18: Training & rollout
Total: 12-16 hours
```

---

## Implementation Checklist by Phase

### Phase 1 Checklist (Start Immediately)
```
Database:
  ☐ Add route_id to breakdowns table
  ☐ Create spatial index on gtfs_stops
  ☐ Add breakdown_count view for heatmap

Backend:
  ☐ GET /api/routes/status endpoint
  ☐ GET /api/routes/coverage endpoint
  ☐ GET /api/stops/heatmap endpoint
  ☐ Memory monitoring endpoint

Frontend:
  ☐ Route status dashboard component
  ☐ Coverage analysis cards
  ☐ Heatmap visualization

Testing:
  ☐ Load test 231 routes
  ☐ Memory profiling
  ☐ Supervisor feedback (n=3)

Deployment:
  ☐ Staging environment
  ☐ Production rollout
  ☐ Monitoring & alerts
```

### Phase 2 Checklist (Week 5)
```
Database:
  ☐ Add spare vehicle tracking table
  ☐ Add engineer skills table
  ☐ Historical dispatch time analysis

Backend:
  ☐ ML model for spare positioning
  ☐ Engineer dispatch recommendation
  ☐ Real-time API endpoints

Frontend:
  ☐ Spare allocation UI
  ☐ Engineer assignment interface
  ☐ Dashboard updates

Testing:
  ☐ Spare positioning accuracy (80%+)
  ☐ Engineer match quality (90%+)
```

### Phase 3 Checklist (Week 9)
```
Database:
  ☐ Risk profile materialized view
  ☐ Accessibility mapping table

Backend:
  ☐ Seasonal analysis endpoints
  ☐ Accessibility matching logic
  ☐ Passenger impact calculation

Frontend:
  ☐ Risk profile dashboard
  ☐ Accessibility interface
  ☐ Impact prioritization UI

Analysis:
  ☐ 3+ months breakdown data (for predictive)
  ☐ Pattern identification
```

### Phase 4 Checklist (Week 14)
```
Backend:
  ☐ GTFS-RT feed generation
  ☐ Integration with journey planners
  ☐ Real-time update mechanism

Frontend:
  ☐ API monitoring dashboard
  ☐ Data quality metrics

Integration:
  ☐ TripPlanner integration
  ☐ Google Maps integration (optional)
  ☐ Third-party journey planner support
```

---

## Feature Impact Matrix

```
FEATURE                      TIME SAVED    SAFETY    COST REDUCTION
────────────────────────────────────────────────────────────────
1. Live Route Status         3 min/case    Medium    Low
2. Coverage Analysis         5 min/case    HIGH      Medium ($5k/yr)
3. Heatmap                   0 min/case    HIGH      Medium ($3k/yr)
4. Spare Allocation          15 min/case   HIGH      High ($12k/yr)
5. Engineer Dispatch         12 min/case   HIGH      High ($15k/yr)
6. Passenger Impact          2 min/case    Medium    Low
7. Seasonal Profiles         N/A           HIGH      High ($8k/yr)
8. Accessibility            N/A           HIGH      High ($2k/yr)
9. Predictive Alerts         20 min/case   VERY HIGH High ($20k/yr)
10. GTFS-RT API             N/A            Medium    Low
────────────────────────────────────────────────────────────────
TOTAL IMPACT:               ~60 min/day    HIGH      $65k/yr
```

---

## Risk Assessment by Feature

```
FEATURE                      RISK LEVEL    KEY RISKS
────────────────────────────────────────────────────────
1. Status Dashboard          LOW           None
2. Coverage Analysis         LOW           Data quality
3. Heatmap                   LOW           Database performance
4. Spare Allocation          MEDIUM        Model accuracy (need testing)
5. Engineer Dispatch         MEDIUM        Skill data maintenance
6. Passenger Impact          LOW           Passenger count accuracy
7. Seasonal Profiles         LOW           Requires data history
8. Accessibility            LOW            Data accuracy
9. Predictive Alerts         HIGH          Requires 3+ months data
10. GTFS-RT API             LOW            Third-party integration
────────────────────────────────────────────────────────────────
MITIGATION: Phased approach, test Phase 1 before Phase 2
```

---

## Resource Allocation

```
ROLE                    PHASE 1    PHASE 2    PHASE 3    PHASE 4
─────────────────────────────────────────────────────────────
Backend Dev             100%       80%        60%        40%
Frontend Dev            50%        30%        20%        0%
Data Analyst            20%        40%        70%        20%
QA/Testing              30%        30%        30%        30%
─────────────────────────────────────────────────────────────
Estimated Team:         2-3 people full-time for 18 weeks
Cost:                   ~$32,800 (development only)
```

---

## What To Build First: The Case for Phase 1

### Why Start with Features #1, #2, #3

1. **Immediate Value** - Supervisors see benefits week 1
2. **Low Risk** - No ML models, simple database queries
3. **Builds Foundation** - Data structures used by later features
4. **Low Effort** - 42-54 hours total for 3 features
5. **Quick ROI** - Measurable time savings immediately
6. **High Adoption** - Supervisors quickly adopt dashboard
7. **Team Building** - Developers learn system while building

### Why Not Start with #9 (Predictive Alerts)

1. **Requires 3+ months data** - Too early (just deployed system)
2. **High complexity** - ML models need tuning
3. **Uncertain ROI** - Accuracy threshold unknown
4. **High risk** - Model false positives waste resources
5. **Deferred to Month 4** - Start after Phase 3, once data exists

---

## Success Metrics by Phase

### Phase 1 Success (Weeks 1-4)
- [ ] All 3 features deployed to production
- [ ] Supervisor dashboard active usage >50%
- [ ] System memory stays <1.5 GB
- [ ] API response time <500ms
- [ ] Identified ≥5 coverage gaps

### Phase 2 Success (Weeks 5-8)
- [ ] Spare dispatch time: 20-30 min → 5-10 min (60% reduction)
- [ ] Engineer first-time fix rate: +25%
- [ ] Supervisor confidence in recommendations: 80%+
- [ ] System memory <1.6 GB even under load

### Phase 3 Success (Weeks 9-13)
- [ ] Seasonal patterns documented
- [ ] Accessibility compliance: 100%
- [ ] Passenger impact data used for prioritization
- [ ] Predictive model ready for testing (Month 4)

### Phase 4 Success (Weeks 14-18)
- [ ] GTFS-RT feeding to 3+ journey planners
- [ ] Passenger notification reduction: -30%
- [ ] All features documented and trained

---

## Budget Breakdown

```
PHASE 1 (Weeks 1-4):        $18,000 (42-54 hours @ $80/hr)
  ├─ Live Status            $5,000 (12-16h)
  ├─ Coverage Analysis      $5,600 (14-18h)
  └─ Heatmap                $7,400 (16-20h)

PHASE 2 (Weeks 5-8):        $24,000 (52-68h)
  ├─ Spare Allocation       $7,200 (18-24h)
  ├─ Engineer Dispatch      $8,800 (20-28h)
  └─ Passenger Impact       $5,600 (14-18h)

PHASE 3 (Weeks 9-13):       $20,000 (56-72h)
  ├─ Seasonal Profiles      $6,400 (16-22h)
  ├─ Accessibility          $3,200 (8-12h)
  ├─ Impact Refinement      $4,800 (12-15h)
  └─ Predictive Setup       $5,600 (14-17h prep)

PHASE 4 (Weeks 14-18):      $6,400 (16-20h)
  ├─ GTFS-RT API            $4,800 (12-16h)
  └─ Testing/Deployment     $1,600 (4-4h)

─────────────────────────────────────────
TOTAL DEVELOPMENT:          $68,400 (256-344 hours)
Infrastructure/Tools:       $2,000
Training/Docs:             $1,500
─────────────────────────────────────────
TOTAL PROJECT:             $71,900
```

---

## Recommendation

**Build Phase 1 immediately. Start Week 1.**

Rationale:
1. All 3 features ready now (no blocking dependencies)
2. Low risk, high confidence
3. Value delivered week 1 to supervisors
4. Builds foundation for Phase 2
5. Team learns system while building
6. ROI begins accruing immediately

**Next Step:** Executive approval of Phase 1 budget ($18k, 6-7 weeks)

---

**Created:** November 10, 2025
**Analysis by:** Claude Code AI
**Status:** Ready for Approval
