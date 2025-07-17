# Go BARRY Breakdown Guide - Complete Implementation Prompt

## Project Overview

The Go BARRY Breakdown Guide is a React-based modular troubleshooting system for bus breakdown assistance. The project provides a dark-themed, wizard-based interface for drivers to diagnose and resolve vehicle issues following strict SDC (Safety Declaration Compliance) procedures.

### Current Status
- **Progress**: 24/31 wizards complete (77%)
- **Location**: `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/`
- **Testing URL**: `http://localhost:8081/breakdown-guide/`

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
├── index.html              # Main entry point
├── App.js                  # Main React component with routing
├── components/
│   ├── common/
│   │   ├── constants.js    # Shared constants
│   │   └── icons.js        # Icon definitions
│   └── wizards/
│       └── [wizard].js     # Individual wizard components
└── styles/main.css         # Custom styles and animations
```

## UI/UX Design Specifications

### Visual Design
- **Theme**: Dark gradient background (slate-900 to slate-800)
- **Effects**: 
  - Animated blob effects in background
  - Glassmorphism with backdrop blur
  - Hover animations (scale, shadow, color transitions)
- **Layout**: Compact button grid (2-6 columns responsive)
- **Buttons**: Icon + name only design
- **Progress**: Visual progress bar showing completion percentage

### Color Coding System
- **Red**: Safety Critical - Immediate stop required
- **Amber**: High Priority - Continue to changeover point
- **Blue**: Operational Systems - Standard procedures
- **Gray**: Coming Soon - Placeholder for future wizards

## Wizard Component Pattern

Every wizard MUST follow this exact structure:

```javascript
const WizardName = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
  // 4-step flow implementation
  // Step 1: Initial problem description
  // Step 2: Diagnostic questions
  // Step 3: Action recommendations
  // Step 4: Summary and Go-Check reminder
  
  // Component logic here
};

// CRITICAL: Export to global scope
window.WizardName = WizardName;
```

## Implementation Status

### ✅ Completed Wizards (24/31)

#### Safety Critical (6)
1. `SteeringWizard` - Steering system assessment
2. `BrakesWizard` - Brake system assessment
3. `ABSLightWizard` - ABS warning light protocols
4. `OilWarningLightWizard` - Oil pressure warning system
5. `LooseWheelNutsWizard` - Critical wheel safety
6. `PunctureWizard` - Tire safety procedures

#### High Priority (3)
1. `RepeatDefectsWizard` - Quality control escalation
2. `RoadTrafficIncidentsWizard` - Accident management protocols
3. `TraceritHelperWizard` - Incident reporting assistance

#### Operational Systems (15)
1. `InteriorLightsWizard` - Interior lighting assessment
2. `ExteriorLightsWizard` - Exterior lighting systems
3. `WheelchairLiftWizard` - Accessibility ramp systems
4. `DestinationDisplayWizard` - Passenger information displays
5. `BatteryWizard` - Battery charging system
6. `CoolingSystemWizard` - Overheating/water management
7. `DemistersHeatersWizard` - Climate control systems
8. `DoorsWizard` - Door system troubleshooting
9. `NonStarterWizard` - Starting system diagnostics
10. `GearSelectionWizard` - Transmission gear issues
11. `GearboxWizard` - Transmission temperature monitoring
12. `BuzzersWizard` - Warning buzzer diagnostics
13. `WarningLightsWizard` - Dashboard warning lights
14. `ExcessiveSmokeWizard` - Engine/exhaust smoke assessment
15. `SuspensionWizard` - Suspension system stability assessment

### ⏳ Remaining Wizards (7/31)

1. **WipersScreenwashWizard** - Windscreen cleaning systems (SDC Section 30)
2. **LowWaterWizard** - Water level management (SDC Section 18)
3. **BrokenWindowsWizard** - Window damage assessment (SDC Section 6)
4. **WingMirrorsWizard** - Mirror systems (SDC Section 29)
5. **SpeedoWizard** - Speedometer issues (SDC Section 25)
6. **CuttingoutFuelWizard** - Fuel system issues (SDC Section 8)
7. **InteriororExteriorDamageWizard** - Damage assessment (SDC Section 16)

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

## Implementation Guide

### Step-by-Step Process for New Wizards

#### 1. Create the Wizard Component
Create file: `/components/wizards/[WizardName]Wizard.js`

```javascript
const [WizardName]Wizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Implementation following 4-step pattern
    // Use SDC guide for exact procedures
};

window.[WizardName]Wizard = [WizardName]Wizard;
```

#### 2. Update index.html
Add script tag before the "Load main application" comment:

```html
<script type="text/babel" src="./components/wizards/[WizardName]Wizard.js"></script>
```

#### 3. Add Wizard Route in App.js
Add condition block before "Main Menu" section:

```javascript
// [Wizard Display Name] Wizard
if (currentWizard === '[wizard_id]') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Animated background and header - copy from existing wizards */}
            <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <[WizardName]Wizard
                    currentStep={currentStep}
                    responses={responses}
                    updateResponse={updateResponse}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onComplete={handleComplete}
                />
            </div>
        </div>
    );
}
```

#### 4. Update Menu Entry in App.js
Move from 'coming_soon' to appropriate category in `defectCategories` array:
- 'safety' for Safety Critical
- 'high_priority' for High Priority
- 'operational' for Operational Systems

#### 5. Update Progress Counter
Update the progress bar text and percentage to reflect new total (e.g., "22/31 wizards complete (71%)")

## Implementation Priorities

### Suggested Order (by importance)
1. **LowWaterWizard** - Engine protection
2. **WipersScreenwashWizard** - Driver visibility
3. **CuttingoutFuelWizard** - Service reliability
4. **BrokenWindowsWizard** - Passenger safety
5. **SpeedoWizard** - Legal compliance
6. **WingMirrorsWizard** - Driver visibility
7. **InteriororExteriorDamageWizard** - General assessment

## Standard Implementation Request Template

Use this template when requesting implementation of a new wizard:

```
Please implement the [WizardName]Wizard following SDC guide section [X]. 

The wizard should:
1. Create the component file at /components/wizards/[WizardName]Wizard.js following our 4-step pattern
2. Update index.html with the appropriate script tag
3. Add the wizard route in App.js with wizard_id '[wizard_id]'
4. Move the menu entry from 'coming_soon' to '[category]' category
5. Update the progress counter to show [X]/31 wizards complete ([X]%)
6. Strictly follow the SDC procedures from section [X]
7. Include all required safety warnings and Go-Check reminders
8. Maintain the dark UI theme with appropriate color coding

The SDC guide section [X] specifies: [brief summary of the section's key procedures]
```

## Error Handling & Edge Cases

### Standard Error Handling Patterns

#### Navigation Edge Cases
- **Skip Prevention**: Always disable navigation buttons during transitions
- **Back Button**: Ensure previous responses are preserved when going back
- **Direct Navigation**: Handle cases where users might bookmark a specific step

```javascript
// Example: Preventing skip to next step
const handleNext = () => {
    if (!responses[currentStep]) {
        // Don't proceed without a response
        return;
    }
    onNext();
};
```

#### Common Edge Cases from Completed Wizards
1. **Multiple Warning Lights**: Handle cases where multiple issues exist simultaneously
2. **Incomplete Information**: Provide "Unknown/Not Sure" options where appropriate
3. **Emergency Situations**: Always provide immediate "STOP" guidance for safety-critical issues
4. **Communication Failures**: Include offline-capable instructions

### Validation Patterns
- Required fields must be clearly indicated
- Provide helpful error messages, not generic ones
- Validate responses before allowing progression

## Testing Guidelines

### Pre-Release Testing Checklist

#### Functionality Tests
- [ ] All 4 steps load correctly
- [ ] Navigation works (Next/Previous/Skip to summary)
- [ ] Responses are saved between steps
- [ ] Complete wizard flow works end-to-end
- [ ] "Start Over" functionality clears all data

#### Safety & Compliance Tests
- [ ] Safety warnings are prominently displayed
- [ ] RED/AMBER color coding is correct
- [ ] SDC procedures match the guide exactly
- [ ] Go-Check reminders are included

#### UI/UX Tests
- [ ] Mobile responsive (test at 320px, 768px, 1024px+)
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable on all backgrounds
- [ ] Animations don't cause layout shift
- [ ] Icons load correctly

#### Browser Testing Requirements
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Component Communication

### State Management Pattern

#### Wizard to App.js Communication
```javascript
// In App.js
const [currentWizard, setCurrentWizard] = useState(null);
const [currentStep, setCurrentStep] = useState(1);
const [responses, setResponses] = useState({});

// Passed to wizards
const updateResponse = (step, value) => {
    setResponses(prev => ({ ...prev, [step]: value }));
};

const handleComplete = () => {
    // Clear state and return to menu
    setCurrentWizard(null);
    setCurrentStep(1);
    setResponses({});
};
```

#### Shared Utilities
- Response formatting helpers
- Safety level determination
- Common UI components (buttons, cards)
- Icon mappings

### Common Patterns Between Wizards
1. **Step Headers**: Consistent step indicator UI
2. **Button Styles**: Shared button component styles
3. **Safety Warnings**: Reusable warning alert components
4. **Response Cards**: Consistent selection card design

## SDC Guide Integration Mapping

### Quick Reference Table

| Wizard Name | SDC Section | Page | Safety Level |
|-------------|-------------|------|-------------|
| SteeringWizard | Section 26 | 8 | Safety Critical |
| BrakesWizard | Section 5 | 7 | Safety Critical |
| ABSLightWizard | Section 3 | 14 | Safety Critical |
| OilWarningLightWizard | Section 20 | 22 | Safety Critical |
| LooseWheelNutsWizard | Section 17 | 28 | Safety Critical |
| PunctureWizard | Section 22 | 32 | Safety Critical |
| RepeatDefectsWizard | Section 24 | 23 | High Priority |
| RoadTrafficIncidentsWizard | Section 2 | 4-5 | High Priority |
| InteriorLightsWizard | Section 15 | 33 | Operational |
| ExteriorLightsWizard | Section 11 | 35 | Operational |
| WheelchairLiftWizard | Section 23 | 20 | Operational |
| BatteryWizard | Section 4 | 13 | Operational |
| CoolingSystemWizard | Section 21 | 11 | Operational |
| DemistersHeatersWizard | Section 9 | 15 | Operational |
| DoorsWizard | Section 10 | 17 | Operational |
| NonStarterWizard | Section 19 | 9 | Operational |
| GearSelectionWizard | Section 13 | 24 | Operational |
| GearboxWizard | Section 14 | 21 | Operational |
| BuzzersWizard | Section 7 | 26 | Operational |
| WarningLightsWizard | Section 28 | 25 | Operational |
| ExcessiveSmokeWizard | Section 12 | 10 | Operational |
| SuspensionWizard | Section 27 | 34 | Operational |

### Remaining Wizards Mapping
| Wizard Name | SDC Section | Page |
|-------------|-------------|------|
| WipersScreenwashWizard | Section 30 | 12 |
| LowWaterWizard | Section 18 | 16 |
| BrokenWindowsWizard | Section 6 | 6 |
| WingMirrorsWizard | Section 29 | 27 |
| SpeedoWizard | Section 25 | 31 |
| CuttingoutFuelWizard | Section 8 | 18-19 |
| InteriororExteriorDamageWizard | Section 16 | 29-30 |

### Translating SDC Procedures to Wizard Steps

#### Example Pattern:
**SDC Procedure**: "If red ABS light remains illuminated, driver should stop and wait for engineering."

**Wizard Implementation**:
```javascript
// Step 2: Diagnostic Question
{
    question: "Is the ABS light still illuminated?",
    options: [
        { value: 'yes_red', label: 'Yes - RED light' },
        { value: 'yes_amber', label: 'Yes - AMBER light' },
        { value: 'no', label: 'No - Light is off' }
    ]
}

// Step 3: Action Based on Response
if (responses[2] === 'yes_red') {
    return (
        <Alert severity="danger">
            <AlertTitle>⚠️ STOP IMMEDIATELY</AlertTitle>
            <AlertDescription>
                RED ABS light indicates a critical brake system fault.
                1. Stop the vehicle safely
                2. Turn off the engine
                3. Contact engineering immediately
                4. Do NOT continue driving
            </AlertDescription>
        </Alert>
    );
}
```

## Visual Assets & Styling

### Icon Naming Conventions

The `window.Icons` object uses the following pattern:
- Format: `IconCategoryName` (e.g., `AlertTriangle`, `Settings`, `CheckCircle`)
- Safety icons: `AlertTriangle`, `ShieldAlert`, `AlertCircle`
- System icons: `Settings`, `Wrench`, `Car`, `Gauge`
- Status icons: `CheckCircle`, `XCircle`, `Info`

### Available CSS Classes & Animations

#### From styles/main.css:
```css
/* Blob animations */
.blob-blue, .blob-purple, .blob-pink

/* Gradient text */
.gradient-text

/* Glassmorphism card */
.glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Hover effects */
.hover-scale {
    transition: transform 0.2s;
}
.hover-scale:hover {
    transform: scale(1.05);
}

/* Safety level colors */
.safety-critical { /* red theme */ }
.high-priority { /* amber theme */ }
.operational { /* blue theme */ }
```

### Animation Patterns
- Entry animations: Fade in with slight upward movement
- Button hover: Scale + shadow increase
- Page transitions: Smooth opacity changes
- Loading states: Pulse animation on buttons

## Key Implementation Notes

### Do's
- ✅ Follow SDC guide procedures exactly
- ✅ Use established UI patterns from completed wizards
- ✅ Include clear safety warnings
- ✅ Add Go-Check recording reminders
- ✅ Test all navigation paths
- ✅ Maintain consistent dark theme
- ✅ Use proper color coding for urgency levels

### Don'ts
- ❌ Use localStorage or sessionStorage
- ❌ Deviate from the 4-step wizard pattern
- ❌ Skip safety warnings or procedures
- ❌ Create overly complex question flows
- ❌ Forget to export to global scope
- ❌ Miss updating all required files

## Resources

### Available References
- **SDC PDF Guide**: Source document for all wizard logic and procedures
- **Completed wizards**: Reference implementations for consistent patterns
- **Original HTML**: Fallback reference for any missing functionality

### Development Tips
- Each wizard implementation takes approximately 15-20 minutes
- Focus on clarity and safety in user instructions
- Test navigation flow thoroughly
- Ensure mobile responsiveness
- Keep language clear and action-oriented

## Quality Standards

### Client Expectations
- Professional dark UI (highly praised by client)
- Clear, actionable guidance for drivers
- Strict adherence to safety protocols
- Modular, maintainable code structure
- Responsive design for various devices

### Code Quality
- Consistent component structure
- Clear variable and function names
- Proper error handling
- Comprehensive user guidance
- Accessibility considerations

## Next Steps

1. Begin implementing remaining wizards in priority order
2. Test each wizard thoroughly before moving to next
3. Update progress counter after each completion
4. Ensure all wizards follow exact SDC procedures
5. Maintain high quality standards throughout

Remember: **Safety is paramount** - when in doubt, always err on the side of caution and follow SDC guide procedures exactly.
