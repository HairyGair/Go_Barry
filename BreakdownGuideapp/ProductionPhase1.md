# Go BARRY - Production Phase 1 Audit

**Date:** 16 February 2026
**Audited by:** Playwright automated audit + manual screenshot review
**Login:** anthony.gair@gonortheast.co.uk (real supervisor account)
**Screenshots:** `frontend/Screenshots/audit/`

---

## BUGS (Fix These)

### 1. ~~Demo data leaking into Homepage Activity Feed~~ FIXED
~~The homepage activity feed (right side) shows **"Demo User reported a breakdown"** under LAST HOUR. The activities table filtering was added to the public endpoint but the homepage likely uses a different authenticated endpoint that still returns demo activities.~~

**Fix:** Added DEMO01 filtering to 7 endpoints in `activity.js` (`/feed`, `/feed/legacy`, `/live`, `/live/legacy`, `/breakdown-guide`, `/stats`) and 1 endpoint in `analytics.js` (`/activity/feed`). Non-demo users no longer see demo activity entries.

### 2. ~~`/api/analytics/shift-stats` returning 500 error~~ FIXED
~~Two network 500 errors on this endpoint. Probably a missing column or query bug - it fires on every page load.~~

**Fix:** The query explicitly selected columns (`acknowledged_at`, `received_at`) that don't exist in the breakdowns table. Changed to `SELECT *` so the query doesn't fail on missing columns. Also added DEMO01 filtering.

### 3. ~~Operations Dashboard shows "Demo" in supervisor bar~~ FIXED
~~The supervisor coverage strip shows a "Demo" badge. The supervisor/session list isn't filtering out the DEMO01 user.~~

**Fix:** Added DEMO01 filtering to 4 SQL queries in `/api/analytics/coverage-alert` (activities query, breakdowns query, active breakdown counts, today's resolved stats).

### 4. Engineering Dashboard navigation failure
Screenshots 06 (Engineering) and 07 (Engineer Management) are identical to Operations scrolled - the menu navigation failed silently. This might be a Playwright timing issue, but worth checking if the Engineering link sometimes fails client-side.

### 5. ~~404s on direct URL navigation~~ FIXED
~~`/dashboards/control-room`, `/dashboards/engineering/display?depot=Washington` etc. all return 404 on direct page load. This is a **cPanel .htaccess issue** - the SPA fallback to `index.html` isn't catching all routes. Client-side navigation works fine, but if someone bookmarks or refreshes a dashboard page, they'll get a 404.~~

**Fix:** The `.htaccess` was at `frontend/.htaccess` but Vite only copies files from `frontend/public/` to the build output. Copied `.htaccess` to `frontend/public/` so it's now included in every production build.

---

## UI/UX ISSUES (Should Fix)

### 6. ~~Route Status page looks empty~~ FIXED
~~"Showing **0** of 214 routes (214 operational routes hidden)" - when everything is green, the user sees a completely blank page. This is technically correct but looks broken. Consider showing a success banner like "All 214 routes operational" with a green checkmark, rather than just empty space.~~

**Fix:** Added "All X Routes Operational" banner with green checkmark icon, subtitle text, and a "Show all routes" button. Displayed when there are no RED or AMBER routes and green routes are hidden.

### 7. ~~Fleet Intelligence - blank hotspot map~~ FIXED
~~The "Live Defect Hotspots" panel says "1 active" but the map area is completely empty. The map may not be rendering (possibly a Google Maps API key issue or the breakdowns lack GPS coordinates).~~

### 8. ~~Fleet Intelligence - "No Activity Yet" panel~~ FIXED
~~Despite 2 active breakdowns, the activity panel shows "No Activity Yet". This suggests the Fleet Intelligence page filters activities differently or the activity data format doesn't match what it expects.~~

**Fix (7 & 8):** The router was loading a simplified `FleetDefectIntelligence` wrapper (TrendsDefectsPanel only) instead of the comprehensive `FleetIntelligenceDashboard` v5.0 which includes the Leaflet hotspot map, live activity feed, KPI bar, mileage charts, depot performance, and predictive alerts. Swapped the router to use the full dashboard. The map uses OpenStreetMap/CARTO tiles (no API key needed) and renders breakdown markers when GPS coordinates are available.

### 9. ~~Homepage duty card says "Select a duty shift to get started"~~ FIXED
~~Even after selecting Day Shift in the duty modal, the homepage still shows this prompt. The duty selection may not be persisting properly to the homepage component state.~~

**Fix:** The `window.storage` event only fires in other tabs, not the current one. Passed `currentDuty` as a prop from `App.jsx` to `HomePage`, so duty selection is reflected immediately.

### 10. ~~Operations Dashboard - "MISSED" badges on every card~~ FIXED
~~Both breakdowns (5801 and 5421) show "MISSED" in red. If these have been active for 10h+ and 12h+, this likely means the linked trips were missed. But "MISSED" is ambiguous - does it mean the trip was missed, or the response SLA was missed? Clarify the label.~~

**Fix:** Renamed "MISSED" to "TRIP LOST" and "NEXT TRIP MISSED" to "TRIP LOST — DEPARTED" in `NextTripCountdownBadge.jsx` to clarify this refers to the vehicle's next scheduled trip.

### 11. ~~Menu has 14 links (6 are depot display variants)~~ FIXED
~~The Engineering Display sub-menu lists all 6 depots individually. This clutters the menu. Consider a single "Engineering Display" link that opens a depot picker, or group them under a collapsible sub-section.~~

**Fix:** Consolidated Engineering submenu from 7 items (All + 6 depots) to 2 items: "All Depots Display" and "Manage Engineers" in `MinimalUserMenu.jsx`.

---

## POLISH (Nice to Fix)

### 12. ~~Consett depot missing from Depot Status panel~~ FIXED
~~Operations dashboard shows Washington, Riverside, Deptford, Percy Main, Hexham - but **Consett is missing**. Either it's off-screen or not in the depots data.~~

**Fix:** Added Consett to the `DEPOTS` array in `DepotStatusGrid.jsx`.

### 13. ~~Fleet Intelligence has elements with font-size < 10px~~ FIXED
~~Some text is too small to read comfortably.~~

**Fix:** Bumped all 9px font-size declarations to 11px in `FleetIntelligenceDashboard.css` (3 occurrences) and `TrendsDefectsPanel.css` (1 occurrence).

### 14. ~~Operations Dashboard supervisor bar shows "X 500"~~ FIXED
~~The duty display shows "X 500" which looks like a formatting issue - should it say "Duty 500"?~~

**Fix:** Changed duty pill format from `✓/✗ {code}` to `Duty {code}` in `SupervisorCoverageBar.jsx`. The covered/uncovered CSS class already provides visual distinction.

---

## NETWORK ERRORS CAPTURED

| Status | URL | Fixed? |
|--------|-----|--------|
| ~~500~~ | ~~`/api/analytics/shift-stats?shift_start=...&shift_end=...&duty_co...`~~ | FIXED |
| ~~404~~ | ~~`/dashboards/control-room` (direct page load)~~ | FIXED |
| ~~404~~ | ~~`/dashboards/engineering/display?depot=Washington` (direct page load)~~ | FIXED |
| ~~404~~ | ~~`/dashboards/engineering/display?depot=Riverside` (direct page load)~~ | FIXED |
| ~~404~~ | ~~`/dashboards/engineering/display?depot=Percy%20Main` (direct page load)~~ | FIXED |

---

## FEATURE SUGGESTIONS

### High Value (Should Build)

#### A. What3Words Integration
*Free API for < 10k calls/month*

Supervisors could get a precise 3-word address for the breakdown location. Much easier for engineers to find a bus on a long road than a street name. The API is simple - one REST call converts lat/lng to 3 words.

#### B. Browser Push Notifications
*No third party needed - native Web Notifications API*

When a new STOP breakdown is reported, push a browser notification to all logged-in supervisors. Critical for supervisors who have the app open but are looking at another tab.

#### C. Engineer Live ETA Countdown
*Uses existing Google Directions API integration*

When an engineer is dispatched, calculate and display a live countdown timer on the breakdown card: "Engineer arriving in ~12 min". Update it periodically.

#### D. Breakdown Photo Attachment
Allow supervisors to attach photos (sent by the driver via WhatsApp/text). Even a simple file upload to the breakdown record would be incredibly useful for engineers to assess the fault before arriving. Store in a simple S3-compatible bucket or even base64 in the DB for small images.

#### E. PDF Shift Report Export
At end of shift, generate a PDF summary: all breakdowns handled, response times, outcomes. Useful for handover and management reporting. Libraries like `pdfkit` or `jspdf` can do this client-side.

### Medium Value (Good Additions)

#### F. Met Office Weather Warnings
*Free DataPoint API*

Auto-alert supervisors when Met Office issues severe weather warnings for the North East. Ice/snow/flooding warnings directly correlate with increased breakdowns. API is free for UK weather data.

#### G. SMS Engineer Notifications
*Twilio - ~2p per SMS*

When a breakdown is dispatched to an engineer, send them an SMS with the fleet number, location, and What3Words address. Engineers in the yard may not be watching a screen.

#### H. DVSA MOT History API
*Free UK Government API*

Pull MOT test history and advisory items for fleet vehicles. Flag vehicles with recurring MOT advisories that match current breakdown patterns (e.g., vehicle with brake advisories now having brake failures).

#### I. Recurring Fault Alerts
You already detect patterns (same defect on 5+ vehicles). Extend this to automatically email the Engineering Manager a daily digest: "3 brake failures this week across Riverside fleet - possible batch issue."

#### J. Google Street View Thumbnail
On the breakdown card and engineering display, show a small Street View image of the breakdown location. Helps engineers visualise where they're going. One simple `<img>` tag with the Street View Static API URL.

### Lower Priority (Future Roadmap)

#### K. Passenger Impact Calculator
Using GTFS trip data you already have, calculate estimated passengers affected by a breakdown (based on route frequency and average loading). Useful for severity assessment and reporting.

#### L. Fleet Predictive Maintenance
With enough historical breakdown data, build a simple ML model (or even just statistical analysis) to predict which vehicles are most likely to break down next week. Flag them for pre-emptive inspection.

#### M. Voice Command
*Web Speech API - free, built into Chrome*

"Report breakdown on fleet 5801" - hands-free breakdown reporting for supervisors who are on the phone with a driver.

#### N. Integration with Ticketer/ETM
If Go North East uses electronic ticket machines, integrate to automatically pull the route, trip, and passenger count when a breakdown is reported by fleet number.

---

## PRIORITY SUMMARY

| Priority | Item | Effort | Status |
|----------|------|--------|--------|
| ~~**Fix now**~~ | ~~Demo activity leak on homepage~~ | ~~30 min~~ | DONE |
| ~~**Fix now**~~ | ~~shift-stats 500 error~~ | ~~1 hr~~ | DONE |
| ~~**Fix now**~~ | ~~cPanel .htaccess SPA fallback~~ | ~~15 min~~ | DONE |
| ~~**Fix now**~~ | ~~Demo supervisor in coverage bar~~ | ~~30 min~~ | DONE |
| ~~**Should fix**~~ | ~~Route Status empty state~~ | ~~30 min~~ | DONE |
| ~~**Should fix**~~ | ~~Fleet Intelligence blank map/activity~~ | ~~2 hr~~ | DONE |
| ~~**Should fix**~~ | ~~Homepage duty card persistence~~ | ~~30 min~~ | DONE |
| ~~**Should fix**~~ | ~~MISSED badge clarification~~ | ~~15 min~~ | DONE |
| ~~**Should fix**~~ | ~~Menu link consolidation~~ | ~~15 min~~ | DONE |
| ~~**Polish**~~ | ~~Consett depot missing~~ | ~~5 min~~ | DONE |
| ~~**Polish**~~ | ~~Small font sizes in Fleet Intelligence~~ | ~~10 min~~ | DONE |
| ~~**Polish**~~ | ~~"X 500" formatting~~ | ~~5 min~~ | DONE |
| **Build next** | Browser push notifications | 2 hr | |
| **Build next** | What3Words integration | 1 hr | |
| **Build next** | PDF shift report | 3 hr | |
| **Build next** | Engineer ETA countdown | 2 hr | |
| **Build next** | Breakdown photo upload | 4 hr | |
| **Plan for** | Met Office weather alerts | 3 hr | |
| **Plan for** | SMS notifications (Twilio) | 2 hr | |
| **Plan for** | DVSA MOT API | 3 hr | |

---

## WHAT'S WORKING WELL

- Login flow is clean and polished
- Duty selection modal looks professional
- Operations Dashboard layout is effective - breakdown cards + depot status side panel
- Control Room Display looks excellent on the redesigned stats bar and info grid
- Engineering Display (public) works perfectly - Washington shows "No Active Breakdowns", Riverside correctly shows Fleet 5801
- Route Status dashboard handles 214 routes with good filtering/search/jump-to
- Timetable Viewer route picker with area grouping is well organised
- Stop Finder map is functional and responsive
- Report Breakdown wizard categories are clear and well-structured
- Demo data isolation is working (no demo breakdowns visible to real user)
- Responsive layout at 1024px adapts well
- Real-time WebSocket connection indicators working
- Weather widget on homepage is a nice touch
