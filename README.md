# Go North East - Breakdown Guide App

## Overview

This is a digital wizard application for Go North East supervisors to diagnose bus engineering issues systematically, ensuring safety compliance and consistent decision-making. The application implements the SDC Guide to Engineering Issues v1.3.

## Features

### ✅ Phase 1 - Foundation & Brakes Implementation

- **Complete Brakes Wizard**: Fully functional brake assessment following SDC Guide
- **Go North East Branding**: Official colors, typography, and professional design
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Session Persistence**: Saves progress using localStorage
- **Safety-First Decision Logic**: Critical issues immediately trigger STOP protocols
- **Comprehensive Logging**: Documents all decisions and actions taken

### 🔧 Current Implementation

#### Brakes Assessment Wizard
- **Step 1**: Symptom identification with 6 critical brake issues
- **Step 2**: Automated decision based on safety-critical symptoms
- **Step 3**: Documentation and Go-Check confirmation
- **Completion**: Summary with print functionality

#### Critical Safety Features
- Immediate STOP protocols for any critical brake symptoms
- Visual safety alerts with pulsing animations
- Clear action items and engineering contact requirements
- Mandatory Go-Check system entry confirmation

#### User Interface
- Professional Go North East branding
- Intuitive wizard navigation with progress tracking
- Clear visual hierarchy and accessibility features
- Emergency contact information in footer

## File Structure

```
/Go BARRY App/
├── index.html                 # Main application file (ready to run)
├── src/
│   ├── components/
│   │   └── BreakdownGuideApp.jsx  # Main React component
│   └── wizards/              # Future wizard implementations
├── assets/                   # Images, logos, icons
├── docs/                     # Documentation
└── enhanced-implementation-plan.md  # Complete project roadmap
```

## Technology Stack

- **Frontend**: React 18, HTML5, CSS3
- **Styling**: Tailwind CSS with custom Go North East branding
- **Icons**: Custom SVG icons (Lucide React style)
- **Storage**: Browser localStorage for session persistence
- **Deployment**: Single HTML file, no build process required

## SDC Guide Compliance

The Brakes wizard implements the exact requirements from SDC Guide v1.3 page 7:

### Critical Brake Issues (All result in immediate STOP):
1. ✅ Brake pedal sinks to the floor with little or no resistance
2. ✅ Braking response is delayed or ineffective
3. ✅ Unusual noises (e.g., grinding or squealing) during braking
4. ✅ Visible leaks in the brake system (e.g., brake fluid)
5. ✅ Brakes are grabbing or shuddering
6. ✅ Red ABS/EBS light is illuminated

### Required Actions Implementation:
- ✅ Switch off vehicle and await engineering attendance
- ✅ Record defects in Go-Check system
- ✅ Vehicle changeover at earliest opportunity
- ✅ Report to depot management for persistent issues

## Usage Instructions

### For Supervisors:

1. **Open Application**: Load `index.html` in any modern web browser
2. **Select Category**: Click on "Brakes" from the homepage
3. **Follow Wizard**: Answer questions based on driver conversation
4. **Review Decision**: System automatically determines STOP or CONTINUE
5. **Document Actions**: Complete required fields and confirm Go-Check entry
6. **Print Summary**: Generate printable assessment report

### Safety Protocol:

- **ALWAYS** prioritize safety over service continuity
- **NEVER** allow vehicles with critical defects to continue
- **IMMEDIATELY** contact engineering for STOP decisions
- **DOCUMENT** all decisions in Go-Check system

## Next Steps - Remaining Categories

The application is designed for easy expansion. Next implementations should follow this priority:

### Phase 2 - Critical Issues (Priority 1):
- ⏳ Steering (75mm play limit, loss of control)
- ⏳ Oil Warning Light (immediate stop, leak inspection)
- ⏳ Loose Wheel Nuts (zero tolerance, multiple notifications)
- ⏳ Red ABS Light (reset procedures, 10mph check)

### Phase 3 - High Priority Issues (Priority 2):
- ⏳ Overheating (temperature thresholds, mitigation)
- ⏳ Low Water (leak checks, top-up protocols)
- ⏳ Battery Light (belt inspection, master switch)
- ⏳ Doors Not Working (safety classifications)
- ⏳ Amber ABS Light (distinct from red procedures)

### Phase 4 - Common Issues (Priority 3):
- ⏳ Wipers/Screenwash (weather impact, route considerations)
- ⏳ Exterior Lights (hours of darkness, LED percentages)
- ⏳ Non-Starter (systematic troubleshooting)
- ⏳ Gear Selection (reset procedures, ramp position)
- ⏳ Warning Lights (color-based decisions)

## Technical Notes

### Browser Compatibility:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance:
- Loads in under 2 seconds on standard connections
- Works offline after initial load
- Minimal memory footprint
- No external dependencies beyond CDNs

### Security:
- No server-side components
- All data stored locally
- No personal information transmitted
- GDPR compliant

## Support Contacts

- **Emergency**: 0800 123 456
- **Engineering**: 0800 789 012
- **Technical Support**: Contact your local IT team

---

**Version**: 1.0.0 (Brakes Implementation Complete)  
**Last Updated**: January 2025  
**Author**: SDC Development Team  
**Approved By**: Lee Mutch (Engineering Director)