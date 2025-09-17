# Go North East Breakdown Guide - Quick Reference

## System Information
- **Production URL**: https://breakdowns.gobarry.co.uk
- **API Backend**: https://breakdown-guide.onrender.com
- **Database**: Supabase (Project: oieliubbvvdzhzvikzal)
- **Defect Tracking**: Tranzaura (replaced Go-Check in Dec 2024)
- **Version**: 1.1.3 (Latest: January 12, 2025)

## Key Features
1. **33 Assessment Wizards** - All SDC Guide compliant
2. **Real-time Breakdown Tracking** - Format: BD-2025-00001
3. **Fleet Intelligence** - Vehicle health monitoring
4. **Multiple Dashboards** - SDC Operations, Engineering, Management
5. **PWA Support** - Works offline
6. **Mobile Optimised** - Responsive design
7. **Assessment Summary** - Comprehensive summary for Tracerit reporting

## Recent Updates (January 12, 2025) - v1.1.3
- ✅ BatteryWizard Compliance Update
  - Streamlined to match SDC Guide v1.3 two-step assessment
  - Enhanced safety messaging - engine OFF before belt inspection
  - Correct decision logic: Belt off → STOP, Master switch not engaged → CONTINUE, Master switch engaged → STOP
  - Added DVSA electrical system "Dangerous" defect warnings
  - Transmission drive loss risks clearly emphasized
  - Proper Tranzaura System integration

## Previous Updates (January 8, 2025) - v1.1.1
- ✅ ABSLightWizard Compliance Update
  - Complete rewrite to align with SDC Guide v1.3
  - Removed all EBS references (SDC Guide only covers ABS)
  - Fixed "Complete Assessment" button functionality
  - Simplified to two-step process: reset, then check at 10mph
  - Correct decision logic implemented
- ✅ Assessment Completion Fix
  - All wizards now properly pass decision and notes to onComplete
  - Decision values: 'STOP', 'AMBER', 'CONTINUE'
- ✅ Tracerit Requirements Update
  - AssessmentSummary now hides Tracerit section for ABS assessments
  - ABS Light warnings don't require Tracerit reports per SDC Guide

## Previous Updates (December 2024)
- ✅ Road Traffic Incidents Wizard Enhanced
  - Restructured flow to match TraceRit form
  - Auto-generates incident numbers (RTI-YYYYMMDD-HHMM)
  - Pre-populates smart defaults (brand, depot, dates)
  - Quick action buttons for common scenarios
  - TraceRit external form integration
  - Location auto-capture with reverse geocoding
  - OpenStreetMap visualization
- ⚠️ Known Issues:
  - Button click issues in Step 2 (see fix notes)
  - CCTV status field pending
  - Fire/Environmental section to be added

## Previous Updates (January 12, 2025)
- ✅ SteeringWizard updated for full SDC v1.3 and DVSA compliance
- ✅ Enhanced Tranzaura System integration across all wizards
- ✅ Strengthened "Dangerous defects" messaging

## Previous Updates (December 2024)
- ✅ Migrated from Go-Check to Tranzaura
- ✅ Enhanced BrakesWizard with DVSA compliance
- ✅ Professional UI with Go North East branding
- ✅ PNG icon system (20 icons + 10 emoji fallbacks)
- ✅ Dashboard statistics and animations

## File Structure
```
frontend/src/breakdown-guide/
├── App.jsx                          # Main app with enhanced UI
├── supervisorBreakdownLogger.js     # Core tracking logic
├── components/
│   └── wizards/                     # 33 assessment wizards
│       ├── BrakesWizard.jsx         # Updated for SDC v1.3
│       └── [other wizards]
├── styles/
│   └── main.css                     # Enhanced dark theme
└── data/                            # Diagnostic flows

frontend/public/
├── icons/                           # PNG assessment icons
│   ├── brakes.png
│   ├── steering.png
│   └── [18 more icons]
└── gne-logo-horizontal-colour.png   # Go North East logo
```

## Icons Status
### Available (21 PNG files)
- brakes, steering, oil_warning, loose_wheel_nuts, puncture
- collision, battery_issues, non_starter, door_issues
- smashed_window, gear_selector_issues, gearbox_issues
- low_fuel_cutting_out, wheelchair_ramp, exterior_lights
- broken_mirror, interior_lights, destination_display
- cold_bus_demisters, repeat_defects, ABS_light

### Missing (Using Emoji)
- Cooling System (🌡️)
- Low Water (💧)
- Excessive Smoke (💨)
- Wipers/Screenwash (🌧️)
- Suspension (🚙)
- Warning Lights (⚠️)
- Speedo (🏁)
- Interior/Exterior Damage (⚠️)
- Buzzers (🔔)

## Important Notes
1. **Safety First**: Follow SDC Guide decision framework (STOP/AMBER/CONTINUE)
2. **Defect Logging**: Use Tranzaura System for all defect recording
3. **DVSA Compliance**: Dangerous defects can result in PG9 prohibition
4. **EP Morris Codes**: BDBR for brake issues (mark as URGENT if critical)
5. **ABS Assessments**: Don't require Tracerit reports (only defect logging)
6. **Assessment Completion**: All wizards must pass (decision, notes) to onComplete

## Quick Commands
```bash
# Development
cd frontend
npm install
npm run dev

# Build for production
npm run build

# Deploy to cPanel
# Upload dist/ contents to public_html/breakdowns/
```

## Environment Variables
```env
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=[your_key]
VITE_API_URL=https://breakdown-guide.onrender.com
VITE_ENABLE_AUTH=false
VITE_DEFECT_SYSTEM=tranzaura
```

## Contact
- **Developer**: Anthony Gair
- **Email**: anthony@gobarry.co.uk
- **License**: Proprietary - All rights reserved
