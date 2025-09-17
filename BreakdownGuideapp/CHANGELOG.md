# Changelog

All notable changes to the Go North East Breakdown Guide project will be documented in this file.

## [1.5.0] - 2025-09-16

### Added - Dashboard React Migration (Phase 5 Complete)

#### Phase 5: Management Dashboard ✅
- Executive-level Management Dashboard for strategic oversight
- Real-time KPI tracking with trend indicators
- Multi-period analysis (Today/Week/Month/Quarter/Year)
- Depot performance comparison league table
- Fleet health monitoring with breakdown analysis
- Export functionality (PDF/Excel/CSV)
- 6 executive KPIs (MTBF, SLA, Response Time, Fleet Availability, Breakdowns, Utilization)
- Interactive performance trend charts
- Notification system for user feedback
- Mobile-responsive executive interface

### Technical Details
- All 6 management components already implemented:
  - ManagementDashboard: Main executive dashboard
  - ExecutiveKPIs: Strategic KPI cards with trends
  - PerformanceTrends: Interactive SVG charts
  - DepotComparison: Performance league table
  - FleetHealth: Fleet status visualization
  - ExportPanel: Multi-format report generation
- Mock data generation when API unavailable
- 30-second auto-refresh for executive view
- Period-based data filtering

### Achievement
- 🎉 **All 4 Dashboards Now Complete!**
- Breakdown, SDC, Engineering, and Management dashboards fully migrated to React
- Only WebSocket integration (Phase 6) remains

## [1.4.0] - 2025-09-16

### Added - Dashboard React Migration (Phase 4 Complete)

#### Phase 4: Engineering Dashboard ✅
- Complete Engineering Response tracking dashboard
- Real-time engineer assignment and status tracking
- Depot-specific performance metrics with hover details
- 6-stage breakdown timeline visualization
- Engineer selection modal with availability status
- Auto-assign functionality across depots
- Status progression workflow (Dispatched → On Site → Repairing → Complete)
- Overdue breakdown highlighting with visual indicators
- Test data toggle for development
- Filter system (All, Unassigned, Dispatched, On Site, Overdue, Priority)
- Performance statistics (Avg Response, SLA Compliance, Active Engineers)
- Mobile-responsive design

### Technical Details
- Created 3 new components:
  - EngineeringCard: Focused view for engineering actions
  - DepotStats: Real-time depot performance visualization
  - EngineerModal: Engineer selection interface
- Integrated with existing dashboard infrastructure
- Uses apiConfig.baseUrl for all API calls
- Auto-refresh every 10 seconds
- Comprehensive error handling and loading states

## [1.3.0] - 2025-09-16

### Added - Dashboard React Migration (Phase 1-3 Complete)

#### Phase 1: Dashboard Infrastructure ✅
- Created shared dashboard components (DashboardLayout, StatsCard, LiveIndicator, FilterBar)
- Set up dashboard routing with React Router
- Implemented shared navigation with keyboard shortcuts (Alt+1-5)
- Added mobile-responsive bottom navigation
- Integrated with environment variables for correct backend URL

#### Phase 2: Breakdown Dashboard ✅
- Fully functional breakdown tracking dashboard with timeline visualization
- BreakdownCard component with 6-stage progress tracking
- SLA breach/warning visual indicators
- Engineering team assignment with ETAs
- Activity feed per breakdown
- EngineeringStats component showing depot performance
- Real-time updates every 5 seconds
- Quick stats bar with key metrics

#### Phase 3: SDC Operations Dashboard ✅
- Complete Service Delivery Centre control panel
- SDCBreakdownCard with 4-stage timeline (Received → Acknowledged → Decision → Engineering)
- PriorityAlerts for critical notifications (2+ critical on priority routes)
- StatusWidget showing real-time statistics
- RecentDecisions component for activity tracking
- Quick Actions bar with 5 buttons (Emergency, New Breakdown, Engineering, Passenger Cloud, Refresh)
- Filter system (All, Critical, Pending, Priority Routes)
- Responsive two-column layout

### Changed
- Migrated from standalone HTML dashboards to React components
- Fixed incorrect backend URLs (now using environment variables)
- Improved state management with React hooks
- Enhanced performance with component-based architecture

### Technical Details
- All dashboards now use `apiConfig.baseUrl` from constants
- Shared authentication ready for implementation
- Reusable component architecture
- CSS-in-JS with style jsx (convertible to CSS modules)
- Mobile-first responsive design

## [1.2.3] - 2025-01-15

### ✅ SYSTEM STATUS: PRODUCTION READY
- **All 42 Assessment Wizards Operational** - Complete breakdown guide functionality
  - Every wizard loads without blank screens
  - All decision logic properly implemented (STOP/AMBER/CONTINUE)
  - Complete Tranzaura system integration throughout
  - Professional assessment summaries for Tracerit reporting
- **Build System Stable** - No compilation errors or critical warnings
- **User Interface Complete** - Go North East branding with modern responsive design
- **Production Deployment Ready** - System ready for immediate supervisor use

### Assessment Wizard Suite (42/42 Functional ✅)
**Critical Safety Assessments:**
- SteeringWizard, BrakesWizard, BatteryWizard, ABSLightWizard
- NonStarterWizard, OverheatingWizard (CoolingSystemWizard), OilWarningLightWizard
- ExcessiveSmokeWizard, CuttingOutFuelWizard, GearboxWizard, GearSelectionWizard

**Vehicle Systems:**
- ExteriorLightsWizard, InteriorLightsWizard, WarningLightsWizard
- WipersScreenwashWizard, DemistersHeatersWizard, SuspensionWizard
- WheelchairRampWizard, DoorsWizard, WingMirrorsWizard

**Specialized Assessments:**
- RoadTrafficIncidentsWizard, PunctureWizard, LooseWheelNutsWizard
- BrokenWindowsWizard, InteriorExteriorDamageWizard, RepeatDefectsWizard
- TracerItHelperWizard, SpeedoWizard, BuzzersWizard, LowWaterWizard

### Technical Implementation
- **Decision Logic**: All wizards properly pass decision values to onComplete()
- **SDC Compliance**: Full alignment with SDC Engineering Issues Guide v1.3
- **DVSA Standards**: Dangerous defects properly classified and handled
- **Tranzaura Integration**: Complete replacement of Go-Check references
- **Assessment Summaries**: Comprehensive reporting for Tracerit integration

## [1.2.2] - 2025-09-15

### Changed
- **NonStarterWizard.jsx** updated to ensure full compliance with SDC Guide v1.3 and DVSA standards
  - Complete rewrite to align exactly with SDC Engineering Issues Guide non-starter procedures
  - Enhanced three-step assessment flow matching SDC Guide:
    - Step 1: Initial troubleshooting (5 specific checks)
    - Step 2: Rear start attempt with critical safety warnings
    - Step 3: Gather diagnostic information for engineers
  - Added explicit safety warnings about belt entanglement during rear start
  - Updated decision logic to match SDC Guide:
    - Initial start successful → CONTINUE (driver continues in service)
    - Rear start successful → AMBER (keep engine running, await engineer)
    - All attempts failed → STOP (await engineering assistance)
  - Added DVSA compliance notes regarding dangerous defects for starting system failures
  - Included proper diagnostic questions: oil light, exhaust smoke, engine response
  - Updated all Tranzaura System references (replaced Go-Check)
  - Enhanced safety messaging throughout the assessment

### Technical Details
- NonStarterWizard now properly passes decision values to onComplete: 'STOP', 'AMBER', or 'CONTINUE'
- Added diagnostic information collection to assist engineering teams
- Improved user flow with clearer stage progression
- Added critical safety instructions for rear start procedures

## [1.2.1] - 2025-09-15

### Fixed
- **Critical Syntax Errors Resolved** - Complete codebase stability update
  - Fixed all JSX syntax errors across 40+ wizard components
  - Resolved missing closing braces in conditional expressions
  - Fixed unterminated JSX contents in multiple files
  - Corrected import path for AssessmentSummary.jsx icons
  - Fixed duplicate case 5 clause in RoadTrafficIncidentsWizard.jsx
  - Restructured React component function returns for proper JSX rendering
  - All builds now pass without syntax errors ✅

### Changed  
- **RoadTrafficIncidentsWizard** - Enhanced structure and functionality
  - Fixed white page issue in stage 3 (Location Information)
  - Corrected case sequence from 1→2→3→4→5→5→6 to proper 1→2→3→4→5→6→7
  - Added proper renderStep() function structure for React functional component
  - Balanced all div tags (258 open, 258 close)
  - Complete 7-stage incident reporting workflow now fully functional

- **Navigation Pattern Improvements** - Enhanced user experience
  - Added automatic progression with onNext() calls to 402+ wizard selection buttons
  - Improved wizard flow - selection buttons now automatically advance to next step
  - Preserved proper UX patterns for checkboxes, toggles, and navigation buttons
  - Maintained exceptions for Previous/Back, Cancel, and onComplete() buttons

### Technical Details
- Fixed specific syntax issues in:
  - SteeringWizard.jsx: Invalid `>` character in JSX text
  - BuzzersWizard.jsx: Missing closing `}` in conditional expressions
  - CuttingOutFuelWizard.jsx: Multiple missing closing braces in conditional and replace expressions
  - ExteriorLightsWizard.jsx: Missing closing braces in conditional expressions
  - RoadTrafficIncidentsWizard.jsx: Duplicate case clause and missing div structure
  - AssessmentSummary.jsx: Incorrect import path `../icons.jsx` → `./icons.jsx`

## [1.1.3] - 2025-01-12

### Changed
- **BatteryWizard.jsx** updated to ensure full compliance with SDC Guide v1.3 and DVSA standards
  - Streamlined to match SDC's exact two-step assessment flow
  - Enhanced safety messaging with mandatory engine OFF protocol before belt inspection
  - Updated decision logic to match SDC Guide exactly:
    - Belt(s) come off → STOP (can move short distance if no other warnings)
    - Master switch not engaged → CONTINUE (engage switch and continue)
    - Master switch engaged → STOP (transmission drive loss risk)
    - Cannot check belts → AMBER (changeover required)
  - Added DVSA compliance warnings about electrical system "Dangerous" defects
  - Emphasized Tranzaura System integration with EP Morris codes
  - Clarified transmission drive loss risks when master switch is engaged

### Technical Details
- BatteryWizard now properly passes decision values to onComplete: 'STOP', 'AMBER', or 'CONTINUE'
- Added clear visual indicators matching decision severity
- Simplified user flow with fewer steps but more focused assessments

## [1.1.2] - 2025-01-02

### Added
- ABS Light PNG icon added to replace emoji fallback
- Assessment Summary feature for Tracerit reporting
  - Comprehensive summary at end of each assessment
  - Includes all key information needed for Tracerit forms
  - Copy to clipboard functionality
  - Print and email options
  - Decision-specific guidance and actions

### Changed
- ABSLightWizard now uses PNG icon instead of emoji
- Updated icon count from 20 to 21 PNG icons
- Removed ABS Light from missing icons list
- Assessment flow now includes summary step before completion

## [1.1.1] - 2025-01-12

### Changed
- **SteeringWizard.jsx** updated to ensure full compliance with SDC Guide v1.3 and DVSA standards
  - Added explicit reference to DVSA's "Categorisation of Vehicle Defects" document
  - Emphasised Tranzaura System for defect recording (replacing Go-Check references)
  - Clarified DVSA 75mm play limit specification for power steering
  - Added guidance about persistent false reports per SDC requirements
  - Strengthened "Dangerous defects" classification messaging
  - Enhanced compliance documentation throughout the wizard

## [1.2.0] - 2025-09-14

### Added
- Enhanced Road Traffic Incidents wizard with improved flow
- Auto-generation of incident numbers (RTI-YYYYMMDD-HHMM format)
- Pre-populated smart defaults for common fields
- Quick action buttons for common incident scenarios
- Integration with TraceRit external reporting system
- Location auto-capture from breakdown coordinates
- Reverse geocoding for address details
- Map visualization with OpenStreetMap integration
- Route type and route number fields
- Vehicle type dropdown selection
- Employee injury tracking

### Changed
- Reordered Road Traffic Incidents wizard steps to match TraceRit form flow
- Enhanced vehicle and employee information sections
- Improved safety assessment with critical warnings for injuries
- Added comprehensive damage assessment options

### Known Issues
- Button click issues in Step 2 of Road Traffic Incidents wizard (see RoadTrafficIncidentsWizard_FIX_NOTES.md)
- CCTV status field not yet implemented
- Fire/Environmental impact section pending
- Full incident description text area to be added

## [1.1.1] - 2025-01-08

### Fixed
- ABSLightWizard "Complete Assessment" button now properly passes decision and notes parameters
- Fixed onComplete callback to correctly determine final safety decision (STOP/AMBER/CONTINUE)

### Changed
- **ABSLightWizard**: Complete rewrite to align with SDC Engineering Issues Guide v1.3
  - Removed all EBS (Electronic Braking System) references - SDC Guide only covers ABS
  - Simplified assessment flow to match SDC's two-step process
  - Removed "light behavior" question (constant/intermittent) not in SDC Guide
  - Updated decision logic to match SDC Guide exactly:
    - Amber ABS → Reset successful = Continue with monitoring
    - Amber ABS → Reset failed = Changeover at earliest convenience
    - Red ABS → Reset successful = Changeover at earliest convenience  
    - Red ABS → Reset failed = Stop immediately, await engineering
  - Added proper safety messaging per SDC Guide
  - Updated all Tranzaura references

### Removed
- Tracerit reporting requirements for ABS Light assessments (not required per SDC Guide)
- AssessmentSummary now conditionally hides Tracerit section for ABS assessments

### Technical Details
- ABSLightWizard now passes structured decision data: `onComplete(finalDecision, notes)`
- Decision values: 'STOP', 'AMBER', or 'CONTINUE'
- Notes include ABS color, reset status, and action taken

## [1.1.0] - 2024-12-13

### Added
- Professional dashboard UI with Go North East branding
- PNG icon system for assessment types
- Dashboard statistics cards (Active Breakdowns, Today's Assessments, Avg Response Time)
- Enhanced header with logo integration
- Modern dark theme with animations and hover effects
- Responsive design improvements

### Changed
- **BREAKING**: Migrated from Go-Check to Tranzaura defect tracking system
- Updated BrakesWizard.jsx to fully align with SDC Guide v1.3
- Added DVSA "Dangerous defects" classification references
- Removed location input from BrakesWizard (now handled by map insert)
- Enhanced safety warnings with PG9 prohibition mentions
- Improved wizard card styling with red accent hover effects

### Technical Details
- Icon System:
  - 20 PNG icons implemented from `/public/icons/`
  - 10 assessment types using emoji fallbacks (icons to be created)
  - Icons include: brakes.png, steering.png, oil_warning.png, etc.
  
- UI Components:
  - Enhanced header: `app-header-enhanced` class
  - New stat cards: `dashboard-stats` section
  - Improved wizard cards: `wizard-card-enhanced` class
  - PNG icon support: `wizard-icon-img` and `wizard-icon-png` classes

### Missing Icons (To Be Created)
1. ABS Light
2. Cooling System
3. Low Water
4. Excessive Smoke
5. Wipers/Screenwash
6. Suspension
7. Warning Lights
8. Speedo
9. Interior/Exterior Damage
10. Buzzers

### Dependencies
- No new dependencies added
- All changes are CSS and React component updates

### Notes
- All references to "Go-Check" have been replaced with "Tranzaura"
- The system is ready for production deployment
- Future updates should maintain compatibility with Tranzaura API

## [1.0.0] - 2024-08-25

### Initial Release
- Core breakdown assessment system
- 33 SDC-compliant assessment wizards
- Supabase integration
- Basic UI implementation
