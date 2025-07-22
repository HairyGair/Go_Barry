# Go BARRY Breakdown Guide - Complete Implementation Prompt

## Project Overview

The Go BARRY Breakdown Guide is a React-based modular troubleshooting system for bus breakdown assistance. The project provides a dark-themed, wizard-based interface for drivers to diagnose and resolve vehicle issues following strict SDC (Safety Declaration Compliance) procedures.

### Current Status
- **Progress**: 31/31 wizards complete (100%)
- **Location**: `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/`
- **Testing URL**: `http://localhost:8081/breakdown-guide/`
- **Live URL**: `https://www.gobarry.co.uk/breakdown-guide/`

### Recent Updates
- **Fixed**: "Unmatched Route" error on production server
- **Deployment Package**: Ready at `/Users/anthony/Go BARRY App/breakdown-guide-react-deploy/`
- **Architecture**: Fully modular system with each wizard as a separate component

## Technical Architecture

### Core Technologies
- **Framework**: React 18 with Babel standalone (no build step required)
- **Styling**: Tailwind CSS via CDN
- **State Management**: React state only - NO localStorage/sessionStorage
- **Icons**: Global `window.Icons` object
- **Module Pattern**: Each wizard in separate file, exports to global scope

### File Structure
```
/breakdown-guide/
├── index.html              # Main entry point (shows Go NorthEast loading, then Go BARRY app)
├── App.js                  # Main React component with Go BARRY branding
├── components/
│   ├── common/
│   │   ├── constants.js    # Shared constants
│   │   └── icons.js        # Icon definitions (20+ icons)
│   └── wizards/
│       └── [wizard].js     # Individual wizard components (24 complete)
└── styles/
    └── main.css           # Custom styles and animations
```

### Deployment Structure
The deployment package maintains the exact same structure, ensuring seamless transition from development to production.

## UI/UX Design Specifications

### Visual Design
- **Loading Screen**: "Go NorthEast" branding (briefly)
- **Main App**: "Go BARRY" branding in red on dark theme
- **Theme**: Dark gradient background (slate-900 to slate-800)
- **Effects**: 
  - Animated blob effects in background (red, blue, purple)
  - Glassmorphism with backdrop blur
  - Hover animations (scale, shadow, color transitions)
  - Hover glow effects on critical buttons
- **Layout**: Compact button grid (responsive: 1 col mobile, 3 cols desktop)
- **Buttons**: Icon + name design with category badges
- **Progress**: All wizards implemented and operational

### Color Coding System
- **Red**: Safety Critical - Immediate stop required
- **Orange**: High Priority - Continue to changeover point  
- **Blue**: Operational Systems - Standard procedures
- **Gray**: Coming Soon - Placeholder for future wizards

## Wizard Component Pattern

Every wizard MUST follow this exact structure:

```javascript
const WizardName = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = window.Icons;
    
    switch (currentStep) {
        case 1:
            // Initial assessment
            return (...);
        case 2:
            // Detailed evaluation
            return (...);
        case 3:
            // Safety decision
            return (...);
        case 4:
            // Final report (optional)
            return (...);
        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// CRITICAL: Export to global scope
window.WizardName = WizardName;
```

## Implementation Status

### ✅ Completed Wizards (31/31)

#### Safety Critical (9)
1. `SteeringWizard` - Steering system assessment (75mm play limit)
2. `BrakesWizard` - Brake system assessment
3. `ABSLightWizard` - ABS warning light protocols (Red vs Amber)
4. `OilWarningLightWizard` - Oil pressure warning system
5. `LooseWheelNutsWizard` - Critical wheel safety (zero tolerance)
6. `PunctureWizard` - Tire safety procedures
7. `BrokenWindowsWizard` - Window damage assessment (SDC Section 6)
8. `WingMirrorsWizard` - Mirror systems (SDC Section 29)
9. `CuttingOutFuelWizard` - Fuel system issues (SDC Section 8)

#### High Priority (3)
1. `RepeatDefectsWizard` - Quality control escalation
2. `RoadTrafficIncidentsWizard` - Accident management protocols
3. `TracerItHelperWizard` - Incident reporting assistance

#### Operational Systems (19)
1. `InteriorLightsWizard` - Interior lighting assessment (50% rule)
2. `ExteriorLightsWizard` - Exterior lighting systems
3. `WheelchairLiftWizard` - Accessibility ramp systems
4. `DestinationDisplayWizard` - Passenger information displays
5. `BatteryWizard` - Battery charging system
6. `CoolingSystemWizard` - Overheating/water management (80-100°C thresholds)
7. `DemistersHeatersWizard` - Climate control systems (16° threshold)
8. `DoorsWizard` - Door system troubleshooting
9. `NonStarterWizard` - Starting system diagnostics (rear start procedures)
10. `GearSelectionWizard` - Transmission gear issues
11. `GearboxWizard` - Transmission temperature monitoring
12. `BuzzersWizard` - Warning buzzer diagnostics
13. `WarningLightsWizard` - Dashboard warning lights (Red vs Amber)
14. `ExcessiveSmokeWizard` - Engine/exhaust smoke assessment
15. `SuspensionWizard` - Suspension system stability assessment
16. `WipersScreenwashWizard` - Windscreen cleaning systems (SDC Section 30)
17. `LowWaterWizard` - Water level management (SDC Section 18)
18. `SpeedoWizard` - Speedometer issues (SDC Section 25)
19. `InteriorExteriorDamageWizard` - Damage assessment (SDC Section 16)

### ✅ All Wizards Complete

All 31 wizards have been implemented and are fully operational, providing comprehensive coverage of all SDC engineering scenarios.

## App.js Structure

The main App.js file handles:
1. **Wizard Selection**: Menu system with category organization
2. **State Management**: Current wizard, step, and responses
3. **Navigation**: Back to menu functionality
4. **Branding**: "Go BARRY" in header with "Breakdown Guide System" subtitle
5. **Progress Display**: Shows completion percentage
6. **Category Organization**: Safety Critical, High Priority, Operational Systems

### Wizard Integration Pattern in App.js

```javascript
// [Wizard Display Name] Wizard - [Category Type]
if (currentWizard === '[wizard-id]') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Animated background effect */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10">
                <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold">
                                    <span className="text-white">Go</span>
                                    <span className="text-red-500">BARRY</span>
                                </h1>
                                <span className="ml-4 text-gray-400 text-sm">Breakdown Guide System</span>
                            </div>
                            <button onClick={handleBackToMenu} className="flex items-center px-4 py-2 text-gray-300 hover:text-white transition-colors">
                                {Home && <Home className="w-4 h-4 mr-2" />}
                                Back to Menu
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {window.[WizardName] && React.createElement(window.[WizardName], {
                        currentStep,
                        responses,
                        updateResponse,
                        onNext: handleNext,
                        onPrevious: handlePrevious,
                        onComplete: handleComplete
                    })}
                </main>
            </div>
        </div>
    );
}
```

## SDC Guide Compliance Rules

### Critical Safety Principles
1. **Safety First**: Any safety-critical defect = immediate stop
2. **Color Coding**:
   - RED warnings/lights = STOP immediately
   - AMBER warnings/lights = Continue to changeover point
3. **Standard Flow**:
   - Initial assessment questions
   - Step-by-step troubleshooting
   - Clear decision points
   - Safety warnings prominently displayed
   - Go-Check recording reminder

### Required Elements in Every Wizard
- Clear safety warnings where applicable
- Reference to Go-Check system for defect recording
- Escalation procedures to engineering
- Driver safety reminders
- Communication protocols
- Specific thresholds (e.g., 75mm steering play, 100°C temperature)

## Implementation Guide for Remaining Wizards

### Step-by-Step Process

#### 1. Create the Wizard Component
Create file: `/components/wizards/[WizardName]Wizard.js`

```javascript
// [Wizard Name] Wizard Component
// Follows SDC Engineering Issues Guide - Section [X]

const [WizardName]Wizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = window.Icons;
    
    switch (currentStep) {
        case 1:
            // Initial assessment
            return (
                <div className="space-y-6">
                    {/* Step content */}
                </div>
            );
            
        case 2:
            // Detailed evaluation
            return (...);
            
        case 3:
            // Safety decision
            return (...);
            
        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope
window.[WizardName]Wizard = [WizardName]Wizard;
```

#### 2. Update index.html
Add script tag in the wizards section:

```html
<script type="text/babel" src="./components/wizards/[WizardName]Wizard.js"></script>
```

#### 3. Add Wizard Route in App.js
Add the wizard condition before the "Main menu" return statement

#### 4. Update Menu Button in App.js
Move the button from placeholder section to appropriate category

#### 5. Update Progress Counter
Update text to reflect new total (e.g., "25 of 31 Wizards Complete (81%)")

## Testing & Deployment

### Local Testing
1. Run local server: `python -m http.server 8081`
2. Navigate to: `http://localhost:8081/breakdown-guide/`
3. Test all navigation paths and safety decisions

### Production Deployment
1. Copy all files from source to `/breakdown-guide-react-deploy/`
2. Upload to server maintaining directory structure
3. Verify .htaccess is included for React routing
4. Test at: `https://www.gobarry.co.uk/breakdown-guide/`

### Browser Requirements
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android)

## Key Implementation Notes

### Do's
- ✅ Follow SDC guide procedures exactly
- ✅ Use established UI patterns from completed wizards
- ✅ Include clear safety warnings with proper icons
- ✅ Add Go-Check recording reminders in final steps
- ✅ Test all navigation paths thoroughly
- ✅ Maintain consistent dark theme with animated backgrounds
- ✅ Use proper color coding for urgency levels
- ✅ Include specific thresholds from SDC guide

### Don'ts
- ❌ Use localStorage or sessionStorage (will cause failures)
- ❌ Deviate from the established wizard pattern
- ❌ Skip safety warnings or procedures
- ❌ Create overly complex question flows
- ❌ Forget to export to global scope
- ❌ Miss updating all required files (index.html, App.js)
- ❌ Use external dependencies not already included

## Standard Implementation Request Template

Use this template when requesting implementation of a new wizard:

```
Please implement the [WizardName]Wizard following SDC guide section [X] (page [Y]). 

The wizard should:
1. Create the component file at /components/wizards/[WizardName]Wizard.js
2. Follow our established 3-4 step pattern with dark UI theme
3. Update index.html with the script tag
4. Add the wizard route in App.js with currentWizard === '[wizard-id]'
5. Move the menu button to the [category] section
6. Update progress to show [X]/31 wizards complete ([X]%)
7. Include all SDC thresholds and procedures from the guide
8. Add proper safety warnings with icon usage
9. Include Go-Check reminder in final step

Key SDC procedures for this wizard:
- [List specific thresholds or critical procedures]
- [Any special safety considerations]
```

## Resources & References

### Project Files
- **Source**: `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/`
- **Deployment**: `/Users/anthony/Go BARRY App/breakdown-guide-react-deploy/`
- **SDC Guide**: Original PDF with all procedures and thresholds
- **Completed Wizards**: Reference implementations for patterns

### Visual Consistency
- Always use dark gradient backgrounds
- Include animated blob effects
- Use glassmorphism for cards
- Maintain red "BARRY" branding
- Follow established button and form patterns

## Current Priorities

1. **System Maintenance**: Ongoing monitoring and refinements
2. **User Training**: Staff training on the complete system
3. **Performance Optimization**: Continue improving response times and user experience
4. **Documentation**: Keep this guide updated with any changes and enhancements

Remember: This is a safety-critical system. Every decision and implementation must prioritize driver and passenger safety above all else.
