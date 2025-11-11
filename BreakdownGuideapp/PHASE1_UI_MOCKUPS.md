# Phase 1 UI Mockups - GTFS Features

**Date:** November 11, 2025
**Status:** Design Ready for Approval
**Features:** 3 (Live Route Status, Route Coverage, Incident Heatmap)

---

## Design System Overview

### Color Palette

**Status Colors:**
- 🟢 **GREEN (#10B981)** - Route healthy, no active breakdowns
- 🟡 **AMBER (#F59E0B)** - Route has AMBER severity breakdown
- 🔴 **RED (#EF4444)** - Route has STOP severity breakdown
- 🔵 **BLUE (#3B82F6)** - Interactive/highlight state

**Coverage Status Colors:**
- 🟢 **SAFE (Green #10B981)** - 4+ spare vehicles available
- 🟡 **HIGH RISK (Amber #F59E0B)** - 1-3 spare vehicles
- 🔴 **CRITICAL (Red #EF4444)** - 0 spare vehicles

**Intensity Colors (Heatmap):**
- 🟢 **Low incident (1-5):** #D1FAE5 (light green)
- 🟡 **Medium incident (6-20):** #FCD34D (light yellow)
- 🔴 **High incident (21+):** #FCA5A5 (light red)
- 🔴 **Very High incident (50+):** #DC2626 (dark red)

**Neutral Colors:**
- Background: #0F172A (dark slate)
- Card Background: #1E293B (darker slate)
- Text Primary: #F1F5F9 (light gray)
- Text Secondary: #94A3B8 (medium gray)
- Border: #334155 (medium slate)

**Typography:**
- Headings: Inter Bold, 16-24px
- Body Text: Inter Regular, 14px
- Labels: Inter Medium, 12px
- Monospace (numbers): IBM Plex Mono, 14-18px

---

## Feature 1: Live Route Status Dashboard

### Overview
Real-time dashboard showing Green/Amber/Red status for all 231 routes. Supervisors can see which routes are experiencing issues at a glance.

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Go BARRY Dashboard          🔔 2 Alerts    🕒 Updated 12:34 PM    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ROUTE STATUS MONITOR                            [Refresh]         │
│  All 231 Routes - Real-time Updates                                │
│                                                                     │
│  Filter: [All Depots ▼]  [All Statuses ▼]  Search: [________]     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GRID VIEW (5-6 routes per row)                                    │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ 🟢 ROUTE X10     │  │ 🔴 ROUTE 56      │  │ 🟡 ROUTE 309     │ │
│  │                  │  │                  │  │                  │ │
│  │ Newcastle City   │  │ City Centre      │  │ Airport Express  │ │
│  │                  │  │                  │  │                  │ │
│  │ Active: 0        │  │ Active: 2        │  │ Active: 1        │ │
│  │ Resolved: 5      │  │ Resolved: 8      │  │ Resolved: 3      │ │
│  │                  │  │                  │  │                  │ │
│  │ Last update: now │  │ Last update: 2m  │  │ Last update: 5m  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ 🟢 ROUTE 21      │  │ 🟢 ROUTE 27      │  │ 🔴 ROUTE 45      │ │
│  │                  │  │                  │  │                  │ │
│  │ City Commuter    │  │ Riverside        │  │ Metro Express    │ │
│  │                  │  │                  │  │                  │ │
│  │ Active: 0        │  │ Active: 0        │  │ Active: 1        │ │
│  │ Resolved: 2      │  │ Resolved: 1      │  │ Resolved: 7      │ │
│  │                  │  │                  │  │                  │ │
│  │ Last update: now │  │ Last update: now │  │ Last update: 1m  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                     │
│  [Show More Routes]        Showing 6 of 231                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Individual Route Status Card

```
┌─────────────────────────────┐
│ 🔴 ROUTE 56                 │  ◄─ Status indicator + route ID
│                             │
│ City Centre Express         │  ◄─ Route name/description
│                             │
│ ┌─────────────┬─────────────┤
│ │ Active: 2   │ Resolved: 8 │  ◄─ Stats
│ └─────────────┴─────────────┤
│                             │
│ ⏱️ Last update: 2 minutes   │  ◄─ Last update time
│                             │
│ ↓ View Details              │  ◄─ Action link
└─────────────────────────────┘
```

### Card States

**GREEN STATE (No Issues)**
```
┌─────────────────────────────┐
│ 🟢 ROUTE X10                │
│ Newcastle City              │
│ Active: 0   Resolved: 5     │
│ ⏱️ Just now                 │
│ ↓ View Details              │
└─────────────────────────────┘
```

**AMBER STATE (One Breakdown)**
```
┌─────────────────────────────┐
│ 🟡 ROUTE 309                │  ◄─ Amber/yellow background
│ Airport Express             │
│ Active: 1   Resolved: 3     │
│ ⏱️ 5 minutes ago            │
│ ↓ View Details              │
└─────────────────────────────┘
```

**RED STATE (Critical Breakdown)**
```
┌─────────────────────────────┐
│ 🔴 ROUTE 56                 │  ◄─ Red background + pulse
│ City Centre Express         │
│ Active: 2   Resolved: 8     │  ◄─ Highlight active count
│ ⏱️ 2 minutes ago            │
│ ↓ View Details              │
└─────────────────────────────┘
```

### Interactive Elements

**Filter Dropdown**
```
[All Depots ▼]
├─ All Depots (231 routes)
├─ Washington (45 routes)
├─ Riverside (38 routes)
├─ Consett (42 routes)
├─ Deptford (35 routes)
├─ Percy Main (36 routes)
└─ Hexham (35 routes)
```

**Status Filter**
```
[All Statuses ▼]
├─ All Statuses (231 routes)
├─ 🟢 Green (190 routes)
├─ 🟡 Amber (32 routes)
└─ 🔴 Red (9 routes)
```

**Search Box**
```
Search: [Type route number or name...]
Examples: "Route 21", "City", "Express"
```

### Mobile Layout

```
┌──────────────────────────┐
│ Go BARRY              🔔  │
│                          │
│ ROUTE STATUS MONITOR     │
│ Updated: 12:34 PM        │
│                          │
│ Filter: [All Depots ▼]   │
│ Status: [All Statuses ▼] │
│                          │
├──────────────────────────┤
│                          │
│ ┌────────────────────┐   │
│ │ 🟢 ROUTE X10       │   │
│ │ Newcastle City     │   │
│ │ Active: 0          │   │
│ │ Resolved: 5        │   │
│ │ Just now           │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ 🔴 ROUTE 56        │   │
│ │ City Centre        │   │
│ │ Active: 2          │   │
│ │ Resolved: 8        │   │
│ │ 2 minutes ago      │   │
│ └────────────────────┘   │
│                          │
│ [Load More]              │
│                          │
└──────────────────────────┘
```

### Real-Time Behavior

**WebSocket Update Animation:**
- When a breakdown status changes, the card briefly highlights (pulse animation)
- Color changes with fade-in (0.3s transition)
- "Last update" time updates immediately
- Active count increases/decreases with subtle animation

**Example:** Route 56 goes from 1 active → 2 active
```
1. Card pulses red (0.2s)
2. Active count changes: 1 → 2 (with counter animation)
3. "Last update" shows "Just now" (in green briefly, then fades)
```

---

## Feature 2: Route Coverage Analysis

### Overview
Shows which routes have backup vehicle coverage and which are at risk of cascading failures. Supervisors can identify vulnerable routes before they become problems.

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Go BARRY Dashboard          🔔 2 Alerts    🕒 Updated 12:34 PM    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ROUTE COVERAGE ANALYSIS                      [View Map] [Export] │
│  Fleet Backup Vehicle Distribution                                 │
│                                                                     │
│  Summary:                                                           │
│  🟢 SAFE: 190 routes (82%)                                         │
│  🟡 HIGH RISK: 32 routes (14%)                                     │
│  🔴 CRITICAL: 9 routes (4%)                                        │
│                                                                     │
│  Filter: [All Depots ▼]  [Risk Level ▼]                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  COVERAGE TABLE VIEW                                               │
│                                                                     │
│  Route │ Name             │ Status │ Spares │ Needed │ % Coverage │
│  ──────┼──────────────────┼────────┼────────┼────────┼────────────┤
│  X10   │ Newcastle City   │ 🟢 SAFE│   4    │   2    │   200%     │
│  21    │ City Commuter    │ 🟢 SAFE│   3    │   2    │   150%     │
│  27    │ Riverside        │ 🟢 SAFE│   2    │   2    │   100%     │
│  56    │ City Centre      │ 🟡 HIGH│   1    │   2    │    50%     │
│  309   │ Airport Express  │ 🟡 HIGH│   1    │   2    │    50%     │
│  45    │ Metro Express    │ 🔴 CRIT│   0    │   2    │     0%     │
│  ──────┼──────────────────┼────────┼────────┼────────┼────────────┤
│                                                                     │
│  [Show More Routes]        Showing 6 of 231                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Coverage Card (Alternative View)

```
┌──────────────────────────────┐
│ 🔴 ROUTE 45                  │
│ Metro Express                │
│                              │
│ CRITICAL - 0 Spares          │  ◄─ Red alert
│                              │
│ Current spares nearby: 0     │
│ Vehicles needed: 2           │
│ Coverage: 0%                 │
│                              │
│ Nearest spare:               │
│ Route X10 (5.2 km away)      │
│ ETA if needed: 15 minutes    │
│                              │
│ ⚠️ RECOMMENDATION:           │
│ Reposition spare from depot  │
│                              │
│ [Request Spare] [View Map]   │
└──────────────────────────────┘
```

### Coverage Status Colors

**SAFE (Green) - 4+ Spares**
```
┌──────────────────────────────┐
│ 🟢 ROUTE X10                 │
│ Newcastle City               │
│ SAFE - 4 Spares              │
│ Coverage: 200%               │
│ ✅ No action needed          │
└──────────────────────────────┘
```

**HIGH RISK (Amber) - 1-3 Spares**
```
┌──────────────────────────────┐
│ 🟡 ROUTE 56                  │
│ City Centre Express          │
│ HIGH RISK - 1 Spare          │
│ Coverage: 50%                │
│ ⚠️ Monitor closely           │
└──────────────────────────────┘
```

**CRITICAL (Red) - 0 Spares**
```
┌──────────────────────────────┐
│ 🔴 ROUTE 45                  │
│ Metro Express                │
│ CRITICAL - 0 Spares          │
│ Coverage: 0%                 │
│ 🚨 Action required           │
└──────────────────────────────┘
```

### Summary Section

```
COVERAGE SUMMARY
═════════════════════════════════

🟢 SAFE (82%)       ████████████████████░░░ 190 routes
   4+ spare vehicles available

🟡 HIGH RISK (14%)  ███░░░░░░░░░░░░░░░░░░ 32 routes
   1-3 spare vehicles available

🔴 CRITICAL (4%)    ░░░░░░░░░░░░░░░░░░░░░░░░ 9 routes
   0 spare vehicles available

Last updated: 15 minutes ago
Background analysis running...
```

### Map View (Optional)

```
┌────────────────────────────────────────────┐
│         ROUTE COVERAGE MAP                 │
│                                            │
│  🗺️ [Zoom in] [Zoom out] [Current view]   │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │                                      │ │
│  │      🟢🟢🟡🟡🔴              │ │
│  │   🟢       🟢                        │ │
│  │        🟢   🟡    🔴                │ │
│  │   🟢                                  │ │
│  │  🟢      🟡                          │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Legend:                                   │
│  🟢 = Safe (4+ spares)                    │
│  🟡 = High Risk (1-3 spares)              │
│  🔴 = Critical (0 spares)                 │
│                                            │
└────────────────────────────────────────────┘
```

### Mobile Layout

```
┌──────────────────────────┐
│ Go BARRY              🔔  │
│                          │
│ ROUTE COVERAGE           │
│ Analysis                 │
│                          │
│ 🟢 SAFE: 190 (82%)       │
│ 🟡 HIGH RISK: 32 (14%)   │
│ 🔴 CRITICAL: 9 (4%)      │
│                          │
│ Filter: [All Depots ▼]   │
│                          │
├──────────────────────────┤
│ Route│Name      │Coverage│
│ ─────┼──────────┼────────│
│ X10  │Newcastle │ 🟢 Safe│
│ 56   │City Ctr  │ 🟡 High│
│ 45   │Metro     │ 🔴 Crit│
│                          │
│ [Load More]              │
│                          │
└──────────────────────────┘
```

---

## Feature 3: Stop-Level Incident Heatmap

### Overview
Interactive map showing where breakdowns cluster geographically. Helps identify problem areas (potholes, bad intersections) that need maintenance.

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Go BARRY Dashboard          🔔 2 Alerts    🕒 Updated 12:34 PM    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BREAKDOWN INCIDENT HEATMAP                   [Download] [Export]  │
│  Geographic clustering of breakdowns (Last 6 months)              │
│                                                                     │
│  Filters: [Date Range ▼]  [Severity ▼]  [Depot ▼]                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  🗺️ INTERACTIVE MAP                 [Zoom +][-] [Reset]    │ │
│  │                                                             │ │
│  │  ┌───────────────────────────────────────────────────────┐ │ │
│  │  │                                                       │ │ │
│  │  │     🔴🔴     🟡🟡        🔴        │ │ │
│  │  │   🔴  🔴  🟡   🟡  🟢🟢        │ │ │
│  │  │      🔴🔴          🟢  🟡     │ │ │
│  │  │                  🟡  🟡  🟢   │ │ │
│  │  │                           🟢 │ │ │
│  │  │                                       │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  Intensity Legend:                                          │ │
│  │  🟢 Low (1-5)    🟡 Med (6-20)    🔴 High (21+)           │ │
│  │  🔴 Very High (50+)                                         │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  HOTSPOT DETAILS                                                   │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐ │
│  │ 🔴 HIGH CONCENTRATION       │  │ 🟡 MEDIUM CONCENTRATION     │ │
│  │ Corner: High St & Queen St  │  │ Area: Central Station       │ │
│  │ Incidents: 12 (6 months)    │  │ Incidents: 8 (6 months)    │ │
│  │                             │  │                             │ │
│  │ Issue Type: Road condition  │  │ Issue Type: Traffic        │ │
│  │ Action: Investigate pothole │  │ Action: Monitor pattern    │ │
│  │                             │  │                             │ │
│  │ Last incident: 2 days ago   │  │ Last incident: 5 days ago   │ │
│  │                             │  │                             │ │
│  │ [View Route Details]        │  │ [View Route Details]        │ │
│  └─────────────────────────────┘  └─────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Map Colors & Intensity

**Gradient Legend**
```
Incidents per cluster (1km grid cell):

1-5 incidents:      🟢 #D1FAE5 (light green)
6-20 incidents:     🟡 #FCD34D (light yellow)
21-50 incidents:    🔴 #FCA5A5 (light red)
50+ incidents:      🔴 #DC2626 (dark red)

Size also indicates intensity:
Small dot = low incidents
Large dot = high incidents
```

### Hotspot Detail Card

**High Concentration Example**
```
┌──────────────────────────────────┐
│ 🔴 HOTSPOT #1                    │
│ High St & Queen St               │
│                                  │
│ Severity: HIGH CONCENTRATION     │
│ Incidents: 12 in 6 months        │
│ Average frequency: 2/month       │
│                                  │
│ Recent incidents:                │
│ • Brake failure - 2 days ago     │
│ • Engine shutdown - 1 week ago   │
│ • Suspension - 2 weeks ago       │
│ • Power steering - 3 weeks ago   │
│                                  │
│ Likely causes:                   │
│ ⚠️ Road surface issues (pothole) │
│ → Recommend: Inspect road        │
│                                  │
│ Affected routes:                 │
│ Route 45, 56, 309 (see coverage) │
│                                  │
│ [View Map] [More Info]           │
└──────────────────────────────────┘
```

**Medium Concentration Example**
```
┌──────────────────────────────────┐
│ 🟡 HOTSPOT #2                    │
│ Central Station                  │
│                                  │
│ Severity: MEDIUM CONCENTRATION  │
│ Incidents: 8 in 6 months        │
│ Average frequency: 1.3/month    │
│                                  │
│ Recent incidents:                │
│ • Engine warning - 5 days ago   │
│ • Electrical - 2 weeks ago      │
│ • Cooling system - 3 weeks ago  │
│                                  │
│ Likely causes:                   │
│ → Traffic congestion/idling     │
│ → Recommend: Monitor pattern    │
│                                  │
│ [View Map] [Monitor]             │
└──────────────────────────────────┘
```

### Date Range Filter

```
[Last 6 Months ▼]
├─ Last Week (7 days)
├─ Last Month (30 days)
├─ Last 3 Months (90 days)
├─ Last 6 Months (180 days)
└─ Last Year (365 days)

Custom: [From: ____] [To: ____]
```

### Severity Filter

```
[All Severity ▼]
├─ All Severity (12 hotspots)
├─ 🔴 HIGH - Urgent (2 hotspots)
├─ 🟡 MEDIUM - Monitor (5 hotspots)
└─ 🟢 LOW - Track (5 hotspots)
```

### Mobile Layout

```
┌──────────────────────────┐
│ Go BARRY              🔔  │
│                          │
│ INCIDENT HEATMAP         │
│ Breakdown Clusters       │
│                          │
│ Date: [Last 6mo ▼]       │
│ Severity: [All ▼]        │
│                          │
├──────────────────────────┤
│                          │
│ ┌────────────────────┐   │
│ │                    │   │
│ │    🔴🔴🟡        │   │
│ │   🔴 🟡  🟢      │   │
│ │         🟢       │   │
│ │                    │   │
│ └────────────────────┘   │
│                          │
├──────────────────────────┤
│ HOTSPOTS                 │
│                          │
│ 1. 🔴 High St & Queen    │
│    12 incidents         │
│                          │
│ 2. 🟡 Central Station    │
│    8 incidents          │
│                          │
│ [See More]               │
│                          │
└──────────────────────────┘
```

---

## Navigation & Integration

### Main Dashboard Navigation

```
┌─────────────────────────────────────────────────────────────┐
│ Go BARRY Breakdown Management System                        │
└─────────────────────────────────────────────────────────────┘

MAIN MENU:
├─ 🏠 Home
├─ 📊 Dashboard (current)
│  ├─ Route Status          ◄─ Feature #1
│  ├─ Coverage Analysis     ◄─ Feature #2
│  └─ Incident Heatmap      ◄─ Feature #3
├─ 🚨 Active Breakdowns
├─ 🔧 Diagnostic Wizards
├─ 📈 Analytics
├─ ⚙️ Settings
└─ 👤 Profile
```

### Feature Access Points

**From Home:**
- Link to Dashboard
- Link to Route Status Monitor
- Link to Coverage Analysis
- Quick stats summary

**From Active Breakdowns:**
- "View route status" button
- "Check coverage" button
- "Show on heatmap" button

**From Analytics:**
- Drill-down to heatmap
- Link to coverage gaps
- Historical route status

---

## Interaction Patterns

### Loading States

**Initial Load**
```
┌──────────────────────────────┐
│ ROUTE STATUS MONITOR         │
│                              │
│ Loading routes...            │
│ ⟳⟳⟳                          │
│                              │
│ Fetching data for 231 routes │
│ This typically takes 2-5 sec │
│                              │
└──────────────────────────────┘
```

**Background Update**
```
┌──────────────────────────────┐
│ ROUTE STATUS MONITOR         │
│                              │
│ 🔄 Updating... (230 of 231)  │ ◄─ Subtle indicator
│                              │
│ [Display existing data]      │
│                              │
└──────────────────────────────┘
```

### Error States

**Connection Error**
```
┌──────────────────────────────┐
│ ROUTE STATUS MONITOR         │
│                              │
│ ⚠️ Connection Lost           │
│                              │
│ Unable to fetch latest data. │
│ Displaying cached version... │
│                              │
│ [Retry]  [View Cached]       │
│                              │
└──────────────────────────────┘
```

**No Data Available**
```
┌──────────────────────────────┐
│ ROUTE STATUS MONITOR         │
│                              │
│ 🔍 No matching routes found  │
│                              │
│ Your filter returned 0 results│
│                              │
│ Try: Clearing filters or     │
│      Selecting different     │
│      depot                   │
│                              │
└──────────────────────────────┘
```

### Empty States

**No Active Breakdowns (All Green)**
```
┌──────────────────────────────┐
│ ROUTE STATUS MONITOR         │
│                              │
│ ✅ All Systems Operational   │
│                              │
│ No active breakdowns detected│
│ All 231 routes are healthy   │
│                              │
│ Last update: Just now        │
│                              │
│ 🎉 Great day on the network! │
│                              │
└──────────────────────────────┘
```

### Responsive Breakpoints

**Desktop (1920px+)**
- 5-6 route cards per row
- Table view with 6+ columns
- Full map with hotspot details side-by-side
- Detailed information panels

**Laptop (1280-1920px)**
- 4-5 route cards per row
- Table view with 5 columns
- Map with details below
- Compact information panels

**Tablet (768-1279px)**
- 2-3 route cards per row
- Table with horizontal scroll
- Stacked map and details
- Expandable sections

**Mobile (320-767px)**
- 1 route card per row (full width)
- List view with swipe actions
- Map takes full width
- Collapsible details
- Bottom sheet for filters

---

## Accessibility Features

### Color Contrast
- All text meets WCAG AA standard (4.5:1 ratio)
- Status indicators have text labels (not color alone)
- Example: "🔴 RED" (icon + text) not just red color

### Keyboard Navigation
- Tab order: Routes in logical order
- Enter/Space to expand cards
- Arrow keys to navigate heatmap
- Escape to close modals

### Screen Reader Support
- All icons have aria-labels
- Table has proper th/td semantics
- Status descriptions: "Route 56 has 2 active breakdowns"
- Heatmap clusters: "High concentration hotspot: 12 incidents"

### Font Sizes
- Base text: 14px (readable on mobile)
- Headings: 18-24px (hierarchy clear)
- Labels: 12px (sufficient with color contrast)

---

## Animation & Micro-interactions

### Status Change Animation
```
Route status changes from Green → Red:

1. Card pulses (red background, 0.2s)
2. Color fades in (0.3s transition)
3. Active count increments with number animation
4. "Last update" highlights briefly (green, 1s)
5. Returns to normal (2s total)
```

### WebSocket Update Indicator
```
Small indicator shows when data updates:
"Last update: Just now" (green highlight, fades)
appears for 2 seconds, then normal color
```

### Hover States

**Desktop - Route Card Hover**
```
Before:
┌──────────────────┐
│ 🟢 ROUTE X10     │
│ Newcastle City   │
│ Active: 0        │
│ Resolved: 5      │
│ Last update: now │
└──────────────────┘

After (hover):
┌──────────────────┐
│ 🟢 ROUTE X10     │  ◄─ Slight shadow increase
│ Newcastle City   │
│ Active: 0        │
│ Resolved: 5      │
│ Last update: now │
│ ↓ View Details   │  ◄─ Appears on hover
└──────────────────┘
```

### Touch Interactions (Mobile)

**Tap to expand:**
```
Card expands to show:
- Full breakdown details
- More route information
- Action buttons
```

**Swipe left:**
```
Reveals additional actions:
- View on map
- View coverage
- View heatmap
```

**Long press:**
```
Shows context menu:
- View details
- Share
- Favorite
```

---

## Notification/Alert System

### Alert Badge

```
🔔 Indicator with count:

Go BARRY Dashboard     🔔 2

Shows supervisor:
- 2 alerts pending
- Click to view all alerts
```

### Alert Types

**Critical (Red)**
```
🔴 CRITICAL: Route 45 has 0 spare vehicles
   Action required: Reposition spare
   [View Route Coverage]
```

**Warning (Amber)**
```
🟡 WARNING: Route 56 experiencing multiple breakdowns
   Monitor closely: 2 active incidents
   [View Route Status]
```

**Info (Blue)**
```
🔵 INFO: Coverage analysis updated
   New coverage gaps identified
   [View Analysis]
```

---

## Form Elements & Input States

### Select Dropdowns

**Normal State**
```
[All Depots ▼]
```

**Focused State**
```
[All Depots ▼]  ◄─ Blue border
```

**Open State**
```
[All Depots ▼]
├─ All Depots
├─ Washington
├─ Riverside
└─ ...
```

### Search Input

**Empty State**
```
Search: [Type to filter routes...]
```

**With Value**
```
Search: [Route 45              X]
        Matches: "Route 45", "45", "Metro"
```

**No Results**
```
Search: [unknown-route         X]
        No matches found
        Try: "56", "City", "Express"
```

---

## Performance Considerations

### Initial Load
- First 6 routes load immediately (perceived performance)
- Rest load in background
- Show "Loading more..." indicator

### Real-time Updates
- WebSocket updates broadcast every 5 seconds
- Only changed routes update (not full refresh)
- Updates appear smooth with 0.3s transitions

### Mobile Optimization
- Images optimized (< 50KB each)
- CSS minimal (one stylesheet)
- JavaScript lazy-loaded
- Map tiles cached locally

---

## Design System Files

### Colors (CSS Variables)
```css
--color-status-green: #10B981;
--color-status-amber: #F59E0B;
--color-status-red: #EF4444;
--color-bg-dark: #0F172A;
--color-bg-card: #1E293B;
--color-text-primary: #F1F5F9;
--color-text-secondary: #94A3B8;
```

### Typography
```css
font-family: 'Inter', sans-serif;
--font-heading: 600;
--font-body: 400;
--font-mono: 'IBM Plex Mono';

--size-heading: 18-24px;
--size-body: 14px;
--size-label: 12px;
```

### Spacing
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

---

## Next Steps

1. **Get Supervisor Feedback** (this week)
   - Show mockups to 2-3 supervisors
   - Collect feedback on layout and usability
   - Validate colors are clear and intuitive

2. **Create High-Fidelity Designs** (Week 0)
   - Use Figma to create interactive prototypes
   - Define exact spacing and typography
   - Create component library

3. **Build Component Library** (Week 0-1)
   - RouteStatusCard.jsx
   - CoverageAnalysisCard.jsx
   - HeatmapCluster.jsx
   - Filters and search components

4. **Implement Frontend** (Week 1-4)
   - Build responsive layouts
   - Implement WebSocket updates
   - Add animations and transitions
   - Test on multiple devices

---

**Design Status:** ✅ Ready for Review
**Next Review:** Post-supervisor feedback (this week)
**Created:** November 11, 2025

